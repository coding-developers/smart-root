// Camada única de acesso ao backend.
// - Em dev (local): VITE_API_URL não existe → usa /api, redirecionado pelo proxy do Vite.
// - Em produção (Vercel): defina VITE_API_URL = https://SEU_DOMINIO (URL do backend no VPS).
const BASE = import.meta.env.VITE_API_URL || '/api'

const TOKEN_KEY = 'irriga_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}
export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

class ApiError extends Error {
  constructor(status, detail) {
    super(detail || `Erro ${status}`)
    this.status = status
  }
}

async function request(method, path, body) {
  // ngrok-skip-browser-warning: evita a página de aviso do ngrok grátis nas
  // chamadas de API (inofensivo quando não se usa ngrok — o backend ignora).
  const headers = { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' }
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (res.status === 204) return null

  let data = null
  const text = await res.text()
  if (text) {
    try { data = JSON.parse(text) } catch { data = text }
  }

  if (!res.ok) {
    const detail = data && data.detail ? data.detail : `Erro ${res.status}`
    // 401 = token inválido/expirado: derruba a sessão
    if (res.status === 401) setToken(null)
    throw new ApiError(res.status, typeof detail === 'string' ? detail : 'Falha na requisição')
  }
  return data
}

export const api = {
  get: (p) => request('GET', p),
  post: (p, b) => request('POST', p, b),
  put: (p, b) => request('PUT', p, b),
  del: (p) => request('DELETE', p),
}
