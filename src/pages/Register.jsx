import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'

export default function Register() {
  const [form, setForm] = useState({ nome: '', email: '', senha: '' })
  const [erro, setErro] = useState('')
  const [ok, setOk] = useState(false)
  const [enviando, setEnviando] = useState(false)

  function set(campo) {
    return (e) => setForm({ ...form, [campo]: e.target.value })
  }

  async function onSubmit(e) {
    e.preventDefault()
    setErro('')
    setEnviando(true)
    try {
      await api.post('/auth/register', form)
      setOk(true)
    } catch (err) {
      setErro(err.message)
    } finally {
      setEnviando(false)
    }
  }

  if (ok) {
    return (
      <div className="centro">
        <div className="cartao form">
          <h1 className="marca">🌱</h1>
          <h2>Cadastro enviado!</h2>
          <p className="subtitulo">
            Sua conta foi criada e está <strong>aguardando aprovação</strong> do
            administrador. Você poderá entrar assim que for liberada.
          </p>
          <Link className="botao primario" to="/login">Voltar para o login</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="centro">
      <form className="cartao form" onSubmit={onSubmit}>
        <h1 className="marca">🌱 Criar conta</h1>
        <label>Nome
          <input value={form.nome} onChange={set('nome')} required minLength={2} />
        </label>
        <label>E-mail
          <input type="email" value={form.email} onChange={set('email')} required />
        </label>
        <label>Senha
          <input type="password" value={form.senha} onChange={set('senha')}
                 required minLength={6} autoComplete="new-password" />
        </label>

        {erro && <p className="erro">{erro}</p>}

        <button className="botao primario" disabled={enviando}>
          {enviando ? 'Enviando…' : 'Cadastrar'}
        </button>
        <p className="rodape-form">
          Já tem conta? <Link to="/login">Entrar</Link>
        </p>
      </form>
    </div>
  )
}
