import { DatabaseSync } from 'node:sqlite'
import { randomUUID } from 'node:crypto'
import { existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, 'data')
const DB_FILE = join(DATA_DIR, 'inkmap.sqlite')

mkdirSync(DATA_DIR, { recursive: true })
const isNewDatabase = !existsSync(DB_FILE)

const conn = new DatabaseSync(DB_FILE)
conn.exec('PRAGMA journal_mode = WAL')
conn.exec('PRAGMA foreign_keys = ON')

conn.exec(`
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

export const db = {
  id: () => randomUUID(),

  // ---- users ----
  createUser({ id, email, passwordHash, artistId }) {
    conn
      .prepare('INSERT INTO users (id, email, password_hash, artist_id, created_at) VALUES (?, ?, ?, ?, ?)')
      .run(id, email, passwordHash, artistId, new Date().toISOString())
  },
  findUserByEmail(email) {
    return conn.prepare('SELECT * FROM users WHERE lower(email) = lower(?)').get(email)
  },
  findUserById(id) {
    return conn.prepare('SELECT * FROM users WHERE id = ?').get(id)
  },
  findUserByArtistId(artistId) {
    return conn.prepare('SELECT * FROM users WHERE artist_id = ?').get(artistId)
  },
  setResetToken(userId, token, expiresAt) {
    conn.prepare('UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?').run(token, expiresAt, userId)
  },
  findUserByResetToken(token) {
    return conn.prepare('SELECT * FROM users WHERE reset_token = ?').get(token)
  },
  updatePassword(userId, passwordHash) {
    conn
      .prepare('UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?')
      .run(passwordHash, userId)
  },

  // ---- artists ----
  createArtist(artist) {
    conn
      .prepare(
        `INSERT INTO artists
          (id, user_id, name, studio, city, styles, bio, avatar, instagram, booking_lead_time, deposit_dkk, rating, review_count, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
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
      )
  },
  getArtist(id) {
    return artistRowToObject(conn.prepare('SELECT * FROM artists WHERE id = ?').get(id))
  },
  getArtistByUserId(userId) {
    return artistRowToObject(conn.prepare('SELECT * FROM artists WHERE user_id = ?').get(userId))
  },
  listArtists({ style, city, q } = {}) {
    let sql = 'SELECT * FROM artists WHERE 1=1'
    const params = []
    if (city) {
      sql += ' AND city = ?'
      params.push(city)
    }
    if (q) {
      sql += ' AND (lower(name) LIKE ? OR lower(studio) LIKE ?)'
      params.push(`%${q.toLowerCase()}%`, `%${q.toLowerCase()}%`)
    }
    sql += ' ORDER BY created_at DESC'
    let rows = conn.prepare(sql).all(...params).map(artistRowToObject)
    if (style) rows = rows.filter((a) => a.styles.includes(style))
    return rows
  },
  updateArtist(id, fields) {
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
        sets.push(`${column} = ?`)
        params.push(fields[key])
      }
    }
    if (fields.styles !== undefined) {
      sets.push('styles = ?')
      params.push(JSON.stringify(fields.styles))
    }
    if (sets.length === 0) return
    params.push(id)
    conn.prepare(`UPDATE artists SET ${sets.join(', ')} WHERE id = ?`).run(...params)
  },

  // ---- designs ----
  listDesigns({ artistId, style, q } = {}) {
    let sql = 'SELECT * FROM designs WHERE 1=1'
    const params = []
    if (artistId) {
      sql += ' AND artist_id = ?'
      params.push(artistId)
    }
    if (style) {
      sql += ' AND style = ?'
      params.push(style)
    }
    if (q) {
      sql += ' AND lower(title) LIKE ?'
      params.push(`%${q.toLowerCase()}%`)
    }
    return conn.prepare(sql).all(...params).map(designRowToObject)
  },
  getDesign(id) {
    return designRowToObject(conn.prepare('SELECT * FROM designs WHERE id = ?').get(id))
  },
  createDesign(design) {
    conn
      .prepare('INSERT INTO designs (id, artist_id, title, style, image, width, height) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(design.id, design.artistId, design.title, design.style, design.image, design.width, design.height)
  },
  deleteDesign(id, artistId) {
    const result = conn.prepare('DELETE FROM designs WHERE id = ? AND artist_id = ?').run(id, artistId)
    return result.changes > 0
  },

  // ---- bookings ----
  createBooking(booking) {
    conn
      .prepare(
        `INSERT INTO bookings
          (id, artist_id, design_id, name, email, phone, placement, size, preferred_dates, message, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
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
      )
  },
  listBookingsByArtist(artistId) {
    return conn
      .prepare('SELECT * FROM bookings WHERE artist_id = ? ORDER BY created_at DESC')
      .all(artistId)
      .map(bookingRowToObject)
  },
  getBooking(id, artistId) {
    return bookingRowToObject(conn.prepare('SELECT * FROM bookings WHERE id = ? AND artist_id = ?').get(id, artistId))
  },
  updateBookingStatus(id, artistId, status) {
    conn.prepare('UPDATE bookings SET status = ? WHERE id = ? AND artist_id = ?').run(status, id, artistId)
    return db.getBooking(id, artistId)
  },

  // ---- contact messages ----
  createMessage(message) {
    conn
      .prepare('INSERT INTO messages (id, name, email, message, created_at) VALUES (?, ?, ?, ?, ?)')
      .run(message.id, message.name, message.email, message.message, message.createdAt)
  },
}

export { isNewDatabase }
