import { randomUUID } from 'node:crypto'
import pg from 'pg'

const { Pool } = pg

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is not set — check server/.env')
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
})

async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      artist_id TEXT NOT NULL,
      reset_token TEXT,
      reset_token_expires TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS artists (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      name TEXT NOT NULL,
      studio TEXT NOT NULL,
      city TEXT NOT NULL,
      styles TEXT NOT NULL,
      bio TEXT NOT NULL DEFAULT '',
      avatar TEXT NOT NULL,
      instagram TEXT NOT NULL DEFAULT '',
      booking_lead_time TEXT NOT NULL DEFAULT '',
      deposit_dkk INTEGER NOT NULL DEFAULT 0,
      rating REAL NOT NULL DEFAULT 0,
      review_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS designs (
      id TEXT PRIMARY KEY,
      artist_id TEXT NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      style TEXT NOT NULL,
      image TEXT NOT NULL,
      width INTEGER NOT NULL,
      height INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      artist_id TEXT NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
      design_id TEXT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      placement TEXT NOT NULL,
      size TEXT NOT NULL,
      preferred_dates TEXT NOT NULL DEFAULT '',
      message TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'ny',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_designs_artist ON designs(artist_id);
    CREATE INDEX IF NOT EXISTS idx_bookings_artist ON bookings(artist_id);
  `)
}

const migrated = migrate()

function artistRowToObject(row) {
  if (!row) return undefined
  const { user_id, booking_lead_time, deposit_dkk, review_count, created_at, styles, ...rest } = row
  return {
    ...rest,
    userId: user_id,
    bookingLeadTime: booking_lead_time,
    depositDkk: deposit_dkk,
    reviewCount: review_count,
    createdAt: created_at,
    styles: JSON.parse(styles),
  }
}

function designRowToObject(row) {
  if (!row) return undefined
  const { artist_id, ...rest } = row
  return { ...rest, artistId: artist_id }
}

function bookingRowToObject(row) {
  if (!row) return undefined
  const { artist_id, design_id, preferred_dates, created_at, ...rest } = row
  return {
    ...rest,
    artistId: artist_id,
    designId: design_id,
    preferredDates: preferred_dates,
    createdAt: created_at,
  }
}

async function query(text, params) {
  await migrated
  return pool.query(text, params)
}

export const db = {
  id: () => randomUUID(),

  // ---- users ----
  async createUser({ id, email, passwordHash, artistId }) {
    await query('INSERT INTO users (id, email, password_hash, artist_id, created_at) VALUES ($1, $2, $3, $4, $5)', [
      id,
      email,
      passwordHash,
      artistId,
      new Date().toISOString(),
    ])
  },
  async findUserByEmail(email) {
    const { rows } = await query('SELECT * FROM users WHERE lower(email) = lower($1)', [email])
    return rows[0]
  },
  async findUserById(id) {
    const { rows } = await query('SELECT * FROM users WHERE id = $1', [id])
    return rows[0]
  },
  async findUserByArtistId(artistId) {
    const { rows } = await query('SELECT * FROM users WHERE artist_id = $1', [artistId])
    return rows[0]
  },
  async setResetToken(userId, token, expiresAt) {
    await query('UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3', [token, expiresAt, userId])
  },
  async findUserByResetToken(token) {
    const { rows } = await query('SELECT * FROM users WHERE reset_token = $1', [token])
    return rows[0]
  },
  async updatePassword(userId, passwordHash) {
    await query('UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2', [
      passwordHash,
      userId,
    ])
  },

  // ---- artists ----
  async createArtist(artist) {
    await query(
      `INSERT INTO artists
        (id, user_id, name, studio, city, styles, bio, avatar, instagram, booking_lead_time, deposit_dkk, rating, review_count, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        artist.id,
        artist.userId,
        artist.name,
        artist.studio,
        artist.city,
        JSON.stringify(artist.styles),
        artist.bio,
        artist.avatar,
        artist.instagram,
        artist.bookingLeadTime,
        artist.depositDkk,
        artist.rating,
        artist.reviewCount,
        artist.createdAt,
      ],
    )
  },
  async getArtist(id) {
    const { rows } = await query('SELECT * FROM artists WHERE id = $1', [id])
    return artistRowToObject(rows[0])
  },
  async getArtistByUserId(userId) {
    const { rows } = await query('SELECT * FROM artists WHERE user_id = $1', [userId])
    return artistRowToObject(rows[0])
  },
  async listArtists({ style, city, q } = {}) {
    let sql = 'SELECT * FROM artists WHERE 1=1'
    const params = []
    if (city) {
      params.push(city)
      sql += ` AND city = $${params.length}`
    }
    if (q) {
      params.push(`%${q.toLowerCase()}%`)
      sql += ` AND (lower(name) LIKE $${params.length} OR lower(studio) LIKE $${params.length})`
    }
    sql += ' ORDER BY created_at DESC'
    const { rows } = await query(sql, params)
    let artists = rows.map(artistRowToObject)
    if (style) artists = artists.filter((a) => a.styles.includes(style))
    return artists
  },
  async updateArtist(id, fields) {
    const columns = {
      name: 'name',
      studio: 'studio',
      city: 'city',
      bio: 'bio',
      instagram: 'instagram',
      bookingLeadTime: 'booking_lead_time',
      depositDkk: 'deposit_dkk',
      avatar: 'avatar',
    }
    const sets = []
    const params = []
    for (const [key, column] of Object.entries(columns)) {
      if (fields[key] !== undefined) {
        params.push(fields[key])
        sets.push(`${column} = $${params.length}`)
      }
    }
    if (fields.styles !== undefined) {
      params.push(JSON.stringify(fields.styles))
      sets.push(`styles = $${params.length}`)
    }
    if (sets.length === 0) return
    params.push(id)
    await query(`UPDATE artists SET ${sets.join(', ')} WHERE id = $${params.length}`, params)
  },

  // ---- designs ----
  async listDesigns({ artistId, style, q } = {}) {
    let sql = 'SELECT * FROM designs WHERE 1=1'
    const params = []
    if (artistId) {
      params.push(artistId)
      sql += ` AND artist_id = $${params.length}`
    }
    if (style) {
      params.push(style)
      sql += ` AND style = $${params.length}`
    }
    if (q) {
      params.push(`%${q.toLowerCase()}%`)
      sql += ` AND lower(title) LIKE $${params.length}`
    }
    const { rows } = await query(sql, params)
    return rows.map(designRowToObject)
  },
  async getDesign(id) {
    const { rows } = await query('SELECT * FROM designs WHERE id = $1', [id])
    return designRowToObject(rows[0])
  },
  async createDesign(design) {
    await query('INSERT INTO designs (id, artist_id, title, style, image, width, height) VALUES ($1, $2, $3, $4, $5, $6, $7)', [
      design.id,
      design.artistId,
      design.title,
      design.style,
      design.image,
      design.width,
      design.height,
    ])
  },
  async deleteDesign(id, artistId) {
    const result = await query('DELETE FROM designs WHERE id = $1 AND artist_id = $2', [id, artistId])
    return result.rowCount > 0
  },

  // ---- bookings ----
  async createBooking(booking) {
    await query(
      `INSERT INTO bookings
        (id, artist_id, design_id, name, email, phone, placement, size, preferred_dates, message, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        booking.id,
        booking.artistId,
        booking.designId ?? null,
        booking.name,
        booking.email,
        booking.phone,
        booking.placement,
        booking.size,
        booking.preferredDates ?? '',
        booking.message ?? '',
        booking.status,
        booking.createdAt,
      ],
    )
  },
  async listBookingsByArtist(artistId) {
    const { rows } = await query('SELECT * FROM bookings WHERE artist_id = $1 ORDER BY created_at DESC', [artistId])
    return rows.map(bookingRowToObject)
  },
  async getBooking(id, artistId) {
    const { rows } = await query('SELECT * FROM bookings WHERE id = $1 AND artist_id = $2', [id, artistId])
    return bookingRowToObject(rows[0])
  },
  async updateBookingStatus(id, artistId, status) {
    await query('UPDATE bookings SET status = $1 WHERE id = $2 AND artist_id = $3', [status, id, artistId])
    return db.getBooking(id, artistId)
  },

  // ---- contact messages ----
  async createMessage(message) {
    await query('INSERT INTO messages (id, name, email, message, created_at) VALUES ($1, $2, $3, $4, $5)', [
      message.id,
      message.name,
      message.email,
      message.message,
      message.createdAt,
    ])
  },
}
