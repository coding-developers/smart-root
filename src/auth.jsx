import { createContext, useContext, useEffect, useState } from 'react'
import { api, getToken, setToken } from './api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [carregando, setCarregando] = useState(true)

  // Ao abrir o app, se houver token salvo, recupera o usuário.
  useEffect(() => {
    if (!getToken()) {
      setCarregando(false)
      return
    }
    api.get('/auth/me')
      .then(setUsuario)
      .catch(() => setToken(null))
      .finally(() => setCarregando(false))
  }, [])

  async function login(email, senha) {
    const { access_token } = await api.post('/auth/login', { email, senha })
    setToken(access_token)
    const me = await api.get('/auth/me')
    setUsuario(me)
    return me
  }

  function logout() {
    setToken(null)
    setUsuario(null)
  }

  return (
    <AuthContext.Provider value={{ usuario, carregando, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
