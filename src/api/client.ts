// In dev this is empty, so requests go through Vite's /api proxy to localhost:4000.
// In a static production build (e.g. GitHub Pages), set VITE_API_URL to the
// deployed backend's origin (e.g. https://inkmap-api.onrender.com) at build time.
const API_BASE = import.meta.env.VITE_API_URL ?? ''

const TOKEN_KEY = 'inkmap.session'

// Uploaded images come back as relative paths like "/uploads/xyz.jpg" — resolve
// those against the backend origin. Seed-data images are already absolute URLs.
export function mediaUrl(path: string) {
  if (!path || /^https?:\/\//.test(path)) return path
  return `${API_BASE}${path}`
}

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    // storage unavailable — session just won't persist across reloads
  }
}

class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers = new Headers(options.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (!(options.body instanceof FormData) && options.body) {
    headers.set('Content-Type', 'application/json')
  }

  const res = await fetch(`${API_BASE}/api${path}`, { ...options, headers })
  const isJson = res.headers.get('content-type')?.includes('application/json')
  const data = isJson ? await res.json() : null

  if (!res.ok) {
    throw new ApiError(res.status, data?.error ?? 'Der skete en fejl. Prøv igen.')
  }
  return data as T
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body instanceof FormData ? body : JSON.stringify(body) }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: body instanceof FormData ? body : JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}

export { ApiError }
