import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const SECRET = process.env.SESSION_SECRET
if (!SECRET) {
  throw new Error('SESSION_SECRET is not set — check server/.env')
}

const SESSION_LIFETIME = '30d'

export function hashPassword(password) {
  return bcrypt.hash(password, 12)
}

export function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash)
}

export function issueSession(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: SESSION_LIFETIME })
}

export function readSession(token) {
  try {
    return jwt.verify(token, SECRET)
  } catch {
    return null
  }
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  const session = token ? readSession(token) : null
  if (!session) {
    return res.status(401).json({ error: 'Du skal være logget ind for at gøre dette.' })
  }
  req.session = session
  next()
}
