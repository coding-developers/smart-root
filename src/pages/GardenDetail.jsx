import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api.js'

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export default function GardenDetail() {
  const { id } = useParams()
  const [jardim, setJardim] = useState(null)
  const [horarios, setHorarios] = useState([])
  const [erro, setErro] = useState('')
  const [msg, setMsg] = useState('')

  async function carregar() {
    try {
      const [j, h] = await Promise.all([
        api.get(`/gardens/${id}`),
        api.get(`/gardens/${id}/schedules`),
      ])
      setJardim(j)
      setHorarios(h)
    } catch (err) {
      setErro(err.message)
    }
  }
  useEffect(() => { carregar() }, [id])

  async function irrigar(acao) {
    setMsg('')
    setErro('')
    try {
      await api.post(`/gardens/${id}/irrigate`, acao === 'start'
        ? { acao: 'start', duracao_seg: 600 }   // 10 min por padrão
        : { acao: 'stop' })
      setMsg(acao === 'start' ? 'Comando de ligar enviado 💧' : 'Comando de desligar enviado')
      setTimeout(carregar, 1200)   // dá tempo da placa reportar o novo status
    } catch (err) {
      setErro(err.message)
    }
  }

  if (erro) return <div><Voltar /><p className="erro">{erro}</p></div>
  if (!jardim) return <p className="suave">Carregando…</p>

  return (
    <div>
      <Voltar />
      <h1>{jardim.nome}</h1>
      {jardim.descricao && <p className="suave">{jardim.descricao}</p>}

      <div className="cartao painel-status">
        <div>
          <span className="rotulo">Estado</span>
          <strong className={jardim.irrigando ? 'verde' : ''}>
            {jardim.irrigando ? '💧 Irrigando' : 'Parado'}
          </strong>
        </div>
        <div>
          <span className="rotulo">Placa</span>
          {jardim.device
            ? <strong className={jardim.device.status === 'online' ? 'verde' : 'cinza'}>
                {jardim.device.status}
              </strong>
            : <strong className="cinza">não associada</strong>}
        </div>
      </div>

      {!jardim.device && (
        <p className="aviso">
          Este jardim ainda não tem uma placa associada. Peça ao administrador para
          vincular o dispositivo antes de irrigar.
        </p>
      )}

      <div className="botoes-irrigar">
        <button className="botao grande primario" disabled={!jardim.device}
                onClick={() => irrigar('start')}>Ligar agora</button>
        <button className="botao grande secundario" disabled={!jardim.device}
                onClick={() => irrigar('stop')}>Desligar</button>
      </div>
      {msg && <p className="ok">{msg}</p>}

      <Horarios gardenId={id} horarios={horarios} aoMudar={carregar} setErro={setErro} />
    </div>
  )
}

function Voltar() {
  return <Link to="/" className="voltar">‹ Meus jardins</Link>
}

function Horarios({ gardenId, horarios, aoMudar, setErro }) {
  const [aberto, setAberto] = useState(false)
  const [inicio, setInicio] = useState('06:00')
  const [fim, setFim] = useState('06:15')
  const [dias, setDias] = useState([1, 2, 3, 4, 5])

  function toggleDia(d) {
    setDias(dias.includes(d) ? dias.filter((x) => x !== d) : [...dias, d].sort())
  }

  async function adicionar(e) {
    e.preventDefault()
    setErro('')
    if (dias.length === 0) { setErro('Escolha ao menos um dia'); return }
    try {
      await api.post(`/gardens/${gardenId}/schedules`, {
        hora_inicio: inicio, hora_fim: fim, dias_semana: dias, ativo: true,
      })
      setAberto(false)
      aoMudar()
    } catch (err) {
      setErro(err.message)
    }
  }

  async function remover(sid) {
    try {
      await api.del(`/schedules/${sid}`)
      aoMudar()
    } catch (err) {
      setErro(err.message)
    }
  }

  return (
    <section className="secao-horarios">
      <div className="cabecalho-secao">
        <h2>Horários</h2>
        <button className="botao primario pequeno" onClick={() => setAberto(!aberto)}>
          {aberto ? 'Cancelar' : '+ Horário'}
        </button>
      </div>

      {aberto && (
        <form className="cartao form" onSubmit={adicionar}>
          <div className="linha-horas">
            <label>Início<input type="time" value={inicio} onChange={(e) => setInicio(e.target.value)} required /></label>
            <label>Término<input type="time" value={fim} onChange={(e) => setFim(e.target.value)} required /></label>
          </div>
          <div className="dias">
            {DIAS.map((nome, d) => (
              <button type="button" key={d}
                      className={`chip ${dias.includes(d) ? 'ativo' : ''}`}
                      onClick={() => toggleDia(d)}>{nome}</button>
            ))}
          </div>
          <button className="botao primario">Salvar horário</button>
        </form>
      )}

      {horarios.length === 0 ? (
        <p className="suave">Nenhum horário cadastrado. A placa só irriga quando você ligar manualmente.</p>
      ) : (
        <ul className="lista">
          {horarios.map((h) => (
            <li key={h.id} className="cartao item-horario">
              <div>
                <strong>{h.hora_inicio.slice(0, 5)} – {h.hora_fim.slice(0, 5)}</strong>
                <div className="meta">
                  {h.dias_semana.map((d) => <span key={d} className="tag dia">{DIAS[d]}</span>)}
                  {!h.ativo && <span className="tag sem-placa">inativo</span>}
                </div>
              </div>
              <button className="link-btn perigo" onClick={() => remover(h.id)}>Remover</button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
