import { config } from 'dotenv'
import express from 'express'
import cors from 'cors'
import multer from 'multer'
import { randomBytes } from 'node:crypto'
import { dirname, extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { mkdirSync } from 'node:fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: join(__dirname, '.env') })

const { db } = await import('./db.js')
const { seedIfEmpty } = await import('./seed.js')
const { hashPassword, verifyPassword, issueSession, requireAuth } = await import('./auth.js')
const mail = await import('./email.js')

seedIfEmpty()

const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:5173'
// Comma-separated list of extra origins allowed to call this API (e.g. a
// GitHub Pages site). FRONTEND_URL is always allowed.
const ALLOWED_ORIGINS = [FRONTEND_URL, ...(process.env.ALLOWED_ORIGINS?.split(',') ?? [])].map((o) => o.trim())

const UPLOADS_DIR = join(__dirname, 'uploads')
mkdirSync(UPLOADS_DIR, { recursive: true })

const app = express()
app.use(
  cors({
    origin(origin, callback) {
      // same-origin / server-to-server requests have no Origin header — allow those
      if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true)
      callback(new Error('Ikke tilladt af CORS'))
    },
  }),
)
app.use(express.json())
app.use('/uploads', express.static(UPLOADS_DIR))

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOADS_DIR,
    filename: (_req, file, cb) => cb(null, `${db.id()}${extname(file.originalname)}`),
  }),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    cb(null, /^image\/(png|jpe?g|webp|gif)$/.test(file.mimetype))
  },
})

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function currentArtist(req) {
  return db.getArtist(req.session.artistId)
}

function publicArtist(artist) {
  if (!artist) return artist
  const { userId, ...rest } = artist
  return rest
}

// ---------- auth ----------

app.post('/api/auth/register', async (req, res) => {
  const { email, password, name, studio, city, styles, bio, instagram, depositDkk } = req.body ?? {}

  if (!email || !EMAIL_RE.test(email)) return res.status(400).json({ error: 'Angiv en gyldig e-mail.' })
  if (!password || password.length < 8) return res.status(400).json({ error: 'Adgangskoden skal være mindst 8 tegn.' })
  if (!name || !studio || !city) return res.status(400).json({ error: 'Navn, studie og by er påkrævet.' })
  if (db.findUserByEmail(email)) {
    return res.status(409).json({ error: 'Der findes allerede en konto med den e-mail.' })
  }

  const artistId = db.id()
  const userId = db.id()
  const passwordHash = await hashPassword(password)

  db.createUser({ id: userId, email, passwordHash, artistId })
  db.createArtist({
    id: artistId,
    userId,
    name,
    studio,
    city,
    styles: Array.isArray(styles) && styles.length ? styles : ['Ikke angivet'],
    bio: bio ?? '',
    avatar: `https://picsum.photos/seed/${artistId}/160/160`,
    instagram: instagram ?? '',
    bookingLeadTime: 'Ventetid: ikke angivet endnu',
    depositDkk: Number.isFinite(Number(depositDkk)) ? Number(depositDkk) : 0,
    rating: 0,
    reviewCount: 0,
    createdAt: new Date().toISOString(),
  })

  const artist = db.getArtist(artistId)
  mail.sendWelcomeEmail(artist, email).catch((err) => console.error('Kunne ikke sende velkomst-mail:', err.message))

  const token = issueSession({ userId, artistId })
  res.status(201).json({ token, artist: publicArtist(artist) })
})

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body ?? {}
  const user = db.findUserByEmail(email ?? '')
  const ok = user && (await verifyPassword(password ?? '', user.password_hash))
  if (!ok) return res.status(401).json({ error: 'Forkert e-mail eller adgangskode.' })

  const token = issueSession({ userId: user.id, artistId: user.artist_id })
  res.json({ token, artist: publicArtist(db.getArtist(user.artist_id)) })
})

app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body ?? {}
  const user = email ? db.findUserByEmail(email) : null

  // Always respond the same way, whether or not the account exists —
  // otherwise this endpoint could be used to check which emails are registered.
  if (user) {
    const token = randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString()
    db.setResetToken(user.id, token, expires)
    const resetUrl = `${FRONTEND_URL}/nulstil-adgangskode?token=${token}`
    mail.sendPasswordResetEmail(user.email, resetUrl).catch((err) => console.error('Kunne ikke sende reset-mail:', err.message))
  }

  res.json({ ok: true })
})

app.post('/api/auth/reset-password', async (req, res) => {
  const { token, password } = req.body ?? {}
  if (!password || password.length < 8) return res.status(400).json({ error: 'Adgangskoden skal være mindst 8 tegn.' })

  const user = token ? db.findUserByResetToken(token) : null
  if (!user || !user.reset_token_expires || new Date(user.reset_token_expires) < new Date()) {
    return res.status(400).json({ error: 'Linket er ugyldigt eller udløbet. Bed om et nyt.' })
  }

  db.updatePassword(user.id, await hashPassword(password))
  res.json({ ok: true })
})

// ---------- own profile (protected) ----------

app.get('/api/me', requireAuth, (req, res) => {
  const artist = currentArtist(req)
  if (!artist) return res.status(404).json({ error: 'Profil ikke fundet.' })
  res.json(publicArtist(artist))
})

app.put('/api/me', requireAuth, (req, res) => {
  const artist = currentArtist(req)
  if (!artist) return res.status(404).json({ error: 'Profil ikke fundet.' })

  db.updateArtist(artist.id, req.body ?? {})
  res.json(publicArtist(db.getArtist(artist.id)))
})

app.post('/api/me/avatar', requireAuth, upload.single('image'), (req, res) => {
  const artist = currentArtist(req)
  if (!artist) return res.status(404).json({ error: 'Profil ikke fundet.' })
  if (!req.file) return res.status(400).json({ error: 'Intet billede modtaget.' })

  db.updateArtist(artist.id, { avatar: `/uploads/${req.file.filename}` })
  res.json(publicArtist(db.getArtist(artist.id)))
})

app.get('/api/me/designs', requireAuth, (req, res) => {
  res.json(db.listDesigns({ artistId: req.session.artistId }))
})

app.post('/api/me/designs', requireAuth, upload.single('image'), (req, res) => {
  const { title, style } = req.body ?? {}
  if (!title || !style) return res.status(400).json({ error: 'Titel og stil er påkrævet.' })
  if (!req.file) return res.status(400).json({ error: 'Vælg et billede af motivet.' })

  const design = {
    id: db.id(),
    artistId: req.session.artistId,
    title,
    style,
    image: `/uploads/${req.file.filename}`,
    width: 640,
    height: 640,
  }
  db.createDesign(design)
  res.status(201).json(design)
})

app.delete('/api/me/designs/:id', requireAuth, (req, res) => {
  const deleted = db.deleteDesign(req.params.id, req.session.artistId)
  if (!deleted) return res.status(404).json({ error: 'Motiv ikke fundet.' })
  res.status(204).end()
})

app.get('/api/me/bookings', requireAuth, (req, res) => {
  res.json(db.listBookingsByArtist(req.session.artistId))
})

app.put('/api/me/bookings/:id', requireAuth, (req, res) => {
  if (!['ny', 'bekræftet', 'afvist'].includes(req.body?.status)) {
    return res.status(400).json({ error: 'Ugyldig status.' })
  }
  const existing = db.getBooking(req.params.id, req.session.artistId)
  if (!existing) return res.status(404).json({ error: 'Booking ikke fundet.' })

  const booking = db.updateBookingStatus(req.params.id, req.session.artistId, req.body.status)
  const artist = currentArtist(req)
  if (booking.status !== 'ny') {
    mail.sendBookingStatusUpdate(booking, artist).catch((err) => console.error('Kunne ikke sende status-mail:', err.message))
  }
  res.json(booking)
})

// ---------- public ----------

app.get('/api/artists', (req, res) => {
  const { style, city, q } = req.query
  res.json(db.listArtists({ style, city, q }).map(publicArtist))
})

app.get('/api/artists/:id', (req, res) => {
  const artist = db.getArtist(req.params.id)
  if (!artist) return res.status(404).json({ error: 'Tatovør ikke fundet.' })
  res.json(publicArtist(artist))
})

app.get('/api/designs', (req, res) => {
  const { artistId, style, q } = req.query
  res.json(db.listDesigns({ artistId, style, q }))
})

app.post('/api/bookings', (req, res) => {
  const { artistId, designId, name, email, phone, placement, size, preferredDates, message } = req.body ?? {}

  const artist = artistId ? db.getArtist(artistId) : null
  if (!artist) return res.status(404).json({ error: 'Tatovør ikke fundet.' })
  if (!name || !email || !EMAIL_RE.test(email) || !phone || !placement || !size) {
    return res.status(400).json({ error: 'Udfyld navn, e-mail, telefon, placering og størrelse.' })
  }

  const booking = {
    id: db.id(),
    artistId,
    designId: designId ?? null,
    name,
    email,
    phone,
    placement,
    size,
    preferredDates: preferredDates ?? '',
    message: message ?? '',
    status: 'ny',
    createdAt: new Date().toISOString(),
  }
  db.createBooking(booking)

  mail.sendBookingConfirmationToVisitor(booking, artist).catch((err) => console.error('Kunne ikke sende bekræftelses-mail:', err.message))
  const artistUser = db.findUserByArtistId(artistId)
  if (artistUser) {
    mail
      .sendBookingReceivedToArtist(artist, booking, artistUser.email)
      .catch((err) => console.error('Kunne ikke sende besked til tatovøren:', err.message))
  }

  res.status(201).json(booking)
})

app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body ?? {}
  if (!name || !email || !EMAIL_RE.test(email) || !message) {
    return res.status(400).json({ error: 'Udfyld navn, e-mail og besked.' })
  }

  db.createMessage({ id: db.id(), name, email, message, createdAt: new Date().toISOString() })
  res.status(201).json({ ok: true })
})

const port = process.env.PORT ?? 4000
app.listen(port, () => {
  console.log(`InkMap API kører på http://localhost:${port}`)
})
