import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'
import { usePolling } from '../hooks/usePolling.js'

// A lista é só panorama: 15 s já mantém os selos de status honestos sem pesar.
const INTERVALO = 15000

export default function Gardens() {
  const [erro, setErro] = useState('')
  const [criando, setCriando] = useState(false)
  const [nome, setNome] = useState('')

  const buscar = useCallback(() => api.get('/gardens'), [])
  const { dados: jardins, erro: erroStatus, carregando, refrescar } =
    usePolling(buscar, { intervalo: INTERVALO })

  async function criar(e) {
    e.preventDefault()
    if (!nome.trim()) return
    setErro('')
    try {
      await api.post('/gardens', { nome: nome.trim() })
      setNome('')
      setCriando(false)
      refrescar()
    } catch (err) {
      setErro(err.message)
    }
  }

  if (carregando && !jardins) return <p className="suave">Carregando jardins…</p>
  if (!jardins) return <p className="erro">{erroStatus}</p>

  const online = jardins.filter((j) => j.device?.status === 'online').length

  return (
    <div>
      <div className="cabecalho-secao">
        <h1>Meus jardins</h1>
        <button className="botao primario pequeno" onClick={() => setCriando(!criando)}>
          {criando ? 'Cancelar' : '+ Novo'}
        </button>
      </div>

      {jardins.length > 0 && (
        <div className={`monitor ${erroStatus ? 'com-erro' : ''}`}>
          <span className="ponto-vivo" aria-hidden="true" />
          <span>
            {erroStatus
              ? 'Sem contato com o servidor — tentando de novo'
              : `${online} de ${jardins.length} placa(s) online`}
          </span>
          <button type="button" className="link-btn" onClick={refrescar}>Atualizar</button>
        </div>
      )}

      {erro && <p className="erro">{erro}</p>}

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
