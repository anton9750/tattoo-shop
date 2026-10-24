import { config } from 'dotenv'
import express from 'express'
import cors from 'cors'
import multer from 'multer'
import { randomBytes } from 'node:crypto'
import { dirname, extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: join(__dirname, '.env') })

const { db } = await import('./db.js')
const { seedIfEmpty } = await import('./seed.js')
const { hashPassword, verifyPassword, issueSession, requireAuth } = await import('./auth.js')
const mail = await import('./email.js')
const storage = await import('./storage.js')

await seedIfEmpty()

const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:5173'
// Comma-separated list of extra origins allowed to call this API (e.g. a
// GitHub Pages site). FRONTEND_URL is always allowed.
const ALLOWED_ORIGINS = [FRONTEND_URL, ...(process.env.ALLOWED_ORIGINS?.split(',') ?? [])].map((o) => o.trim())

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

// Uploaded images go straight to R2 (see storage.js) — nothing is written to
// local disk, so uploads survive redeploys on hosts with ephemeral storage.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    cb(null, /^image\/(png|jpe?g|webp|gif)$/.test(file.mimetype))
  },
})

async function uploadToStorage(file, folder) {
  const key = `${folder}/${db.id()}${extname(file.originalname)}`
  return storage.uploadImage(file.buffer, key, file.mimetype)
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

async function currentArtist(req) {
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
  if (await db.findUserByEmail(email)) {
    return res.status(409).json({ error: 'Der findes allerede en konto med den e-mail.' })
  }

  const artistId = db.id()
  const userId = db.id()
  const passwordHash = await hashPassword(password)

  await db.createUser({ id: userId, email, passwordHash, artistId })
  await db.createArtist({
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

  const artist = await db.getArtist(artistId)
  mail.sendWelcomeEmail(artist, email).catch((err) => console.error('Kunne ikke sende velkomst-mail:', err.message))

  const token = issueSession({ userId, artistId })
  res.status(201).json({ token, artist: publicArtist(artist) })
})

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body ?? {}
  const user = await db.findUserByEmail(email ?? '')
  const ok = user && (await verifyPassword(password ?? '', user.password_hash))
  if (!ok) return res.status(401).json({ error: 'Forkert e-mail eller adgangskode.' })

  const token = issueSession({ userId: user.id, artistId: user.artist_id })
  res.json({ token, artist: publicArtist(await db.getArtist(user.artist_id)) })
})

app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body ?? {}
  const user = email ? await db.findUserByEmail(email) : null

  // Always respond the same way, whether or not the account exists —
  // otherwise this endpoint could be used to check which emails are registered.
  if (user) {
    const token = randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString()
    await db.setResetToken(user.id, token, expires)
    const resetUrl = `${FRONTEND_URL}/nulstil-adgangskode?token=${token}`
    mail.sendPasswordResetEmail(user.email, resetUrl).catch((err) => console.error('Kunne ikke sende reset-mail:', err.message))
  }

  res.json({ ok: true })
})

app.post('/api/auth/reset-password', async (req, res) => {
  const { token, password } = req.body ?? {}
  if (!password || password.length < 8) return res.status(400).json({ error: 'Adgangskoden skal være mindst 8 tegn.' })

  const user = token ? await db.findUserByResetToken(token) : null
  if (!user || !user.reset_token_expires || new Date(user.reset_token_expires) < new Date()) {
    return res.status(400).json({ error: 'Linket er ugyldigt eller udløbet. Bed om et nyt.' })
  }

  await db.updatePassword(user.id, await hashPassword(password))
  res.json({ ok: true })
})

// ---------- own profile (protected) ----------

app.get('/api/me', requireAuth, async (req, res) => {
  const artist = await currentArtist(req)
  if (!artist) return res.status(404).json({ error: 'Profil ikke fundet.' })
  res.json(publicArtist(artist))
})

app.put('/api/me', requireAuth, async (req, res) => {
  const artist = await currentArtist(req)
  if (!artist) return res.status(404).json({ error: 'Profil ikke fundet.' })

  await db.updateArtist(artist.id, req.body ?? {})
  res.json(publicArtist(await db.getArtist(artist.id)))
})

app.post('/api/me/avatar', requireAuth, upload.single('image'), async (req, res) => {
  const artist = await currentArtist(req)
  if (!artist) return res.status(404).json({ error: 'Profil ikke fundet.' })
  if (!req.file) return res.status(400).json({ error: 'Intet billede modtaget.' })

  try {
    const url = await uploadToStorage(req.file, 'avatars')
    await db.updateArtist(artist.id, { avatar: url })
    res.json(publicArtist(await db.getArtist(artist.id)))
  } catch (err) {
    res.status(503).json({ error: err.message })
  }
})

app.get('/api/me/designs', requireAuth, async (req, res) => {
  res.json(await db.listDesigns({ artistId: req.session.artistId }))
})

app.post('/api/me/designs', requireAuth, upload.single('image'), async (req, res) => {
  const { title, style } = req.body ?? {}
  if (!title || !style) return res.status(400).json({ error: 'Titel og stil er påkrævet.' })
  if (!req.file) return res.status(400).json({ error: 'Vælg et billede af motivet.' })

  try {
    const image = await uploadToStorage(req.file, 'designs')
    const design = {
      id: db.id(),
      artistId: req.session.artistId,
      title,
      style,
      image,
      width: 640,
      height: 640,
    }
    await db.createDesign(design)
    res.status(201).json(design)
  } catch (err) {
    res.status(503).json({ error: err.message })
  }
})

app.delete('/api/me/designs/:id', requireAuth, async (req, res) => {
  const design = await db.getDesign(req.params.id)
  const deleted = design && design.artistId === req.session.artistId && (await db.deleteDesign(req.params.id, req.session.artistId))
  if (!deleted) return res.status(404).json({ error: 'Motiv ikke fundet.' })

  storage.deleteImage(design.image).catch(() => {})
  res.status(204).end()
})

app.get('/api/me/bookings', requireAuth, async (req, res) => {
  res.json(await db.listBookingsByArtist(req.session.artistId))
})

app.put('/api/me/bookings/:id', requireAuth, async (req, res) => {
  if (!['ny', 'bekræftet', 'afvist'].includes(req.body?.status)) {
    return res.status(400).json({ error: 'Ugyldig status.' })
  }
  const existing = await db.getBooking(req.params.id, req.session.artistId)
  if (!existing) return res.status(404).json({ error: 'Booking ikke fundet.' })

  const booking = await db.updateBookingStatus(req.params.id, req.session.artistId, req.body.status)
  const artist = await currentArtist(req)
  if (booking.status !== 'ny') {
    mail.sendBookingStatusUpdate(booking, artist).catch((err) => console.error('Kunne ikke sende status-mail:', err.message))
  }
  res.json(booking)
})

// ---------- public ----------

app.get('/api/artists', async (req, res) => {
  const { style, city, q } = req.query
  res.json((await db.listArtists({ style, city, q })).map(publicArtist))
})

app.get('/api/artists/:id', async (req, res) => {
  const artist = await db.getArtist(req.params.id)
  if (!artist) return res.status(404).json({ error: 'Tatovør ikke fundet.' })
  res.json(publicArtist(artist))
})

app.get('/api/designs', async (req, res) => {
  const { artistId, style, q } = req.query
  res.json(await db.listDesigns({ artistId, style, q }))
})

app.post('/api/bookings', async (req, res) => {
  const { artistId, designId, name, email, phone, placement, size, preferredDates, message } = req.body ?? {}

  const artist = artistId ? await db.getArtist(artistId) : null
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
  await db.createBooking(booking)

  mail.sendBookingConfirmationToVisitor(booking, artist).catch((err) => console.error('Kunne ikke sende bekræftelses-mail:', err.message))
  const artistUser = await db.findUserByArtistId(artistId)
  if (artistUser) {
    mail
      .sendBookingReceivedToArtist(artist, booking, artistUser.email)
      .catch((err) => console.error('Kunne ikke sende besked til tatovøren:', err.message))
  }

  res.status(201).json(booking)
})

app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body ?? {}
  if (!name || !email || !EMAIL_RE.test(email) || !message) {
    return res.status(400).json({ error: 'Udfyld navn, e-mail og besked.' })
  }

  await db.createMessage({ id: db.id(), name, email, message, createdAt: new Date().toISOString() })
  res.status(201).json({ ok: true })
})

const port = process.env.PORT ?? 4000
app.listen(port, () => {
  console.log(`InkMap API kører på http://localhost:${port}`)
  if (!storage.storageConfigured()) {
    console.log('⚠ R2 er ikke konfigureret endnu — billede-upload vil fejle, indtil R2_* miljøvariabler er sat.')
  }
})
