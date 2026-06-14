import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth.jsx'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    setErro('')
    setEnviando(true)
    try {
      await login(email, senha)
      navigate('/')
    } catch (err) {
      setErro(err.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="centro">
      <form className="cartao form" onSubmit={onSubmit}>
        <h1 className="marca">🌱 Smart Root</h1>
        <p className="subtitulo">Entre para controlar sua irrigação</p>

        <label>E-mail
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                 required autoComplete="email" />
        </label>
        <label>Senha
          <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)}
                 required autoComplete="current-password" />
        </label>

        {erro && <p className="erro">{erro}</p>}

        <button className="botao primario" disabled={enviando}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
        <p className="rodape-form">
          Não tem conta? <Link to="/cadastro">Cadastre-se</Link>
        </p>
      </form>
    </div>
  )
}
