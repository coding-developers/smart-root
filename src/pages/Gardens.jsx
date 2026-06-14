import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'

export default function Gardens() {
  const [jardins, setJardins] = useState(null)
  const [erro, setErro] = useState('')
  const [criando, setCriando] = useState(false)
  const [nome, setNome] = useState('')

  async function carregar() {
    try {
      setJardins(await api.get('/gardens'))
    } catch (err) {
      setErro(err.message)
    }
  }
  useEffect(() => { carregar() }, [])

  async function criar(e) {
    e.preventDefault()
    if (!nome.trim()) return
    try {
      await api.post('/gardens', { nome: nome.trim() })
      setNome('')
      setCriando(false)
      carregar()
    } catch (err) {
      setErro(err.message)
    }
  }

  if (erro) return <p className="erro">{erro}</p>
  if (jardins === null) return <p className="suave">Carregando jardins…</p>

  return (
    <div>
      <div className="cabecalho-secao">
        <h1>Meus jardins</h1>
        <button className="botao primario pequeno" onClick={() => setCriando(!criando)}>
          {criando ? 'Cancelar' : '+ Novo'}
        </button>
      </div>

      {criando && (
        <form className="cartao form-inline" onSubmit={criar}>
          <input placeholder="Nome do jardim (ex: Jardim Escritório)"
                 value={nome} onChange={(e) => setNome(e.target.value)} autoFocus />
          <button className="botao primario">Criar</button>
        </form>
      )}

      {jardins.length === 0 && !criando && (
        <p className="suave">Você ainda não tem jardins. Toque em “+ Novo” para criar o primeiro.</p>
      )}

      <ul className="lista">
        {jardins.map((j) => (
          <li key={j.id}>
            <Link to={`/jardins/${j.id}`} className="cartao item-jardim">
              <div>
                <strong>{j.nome}</strong>
                {j.descricao && <span className="suave"> — {j.descricao}</span>}
                <div className="meta">
                  {j.device
                    ? <span className={`tag ${j.device.status}`}>placa {j.device.status}</span>
                    : <span className="tag sem-placa">sem placa</span>}
                  {j.irrigando && <span className="tag irrigando">💧 irrigando</span>}
                </div>
              </div>
              <span className="seta">›</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
