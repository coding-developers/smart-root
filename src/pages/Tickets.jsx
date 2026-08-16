import { useEffect, useState } from 'react'
import { api } from '../api.js'

const ROTULO_STATUS = {
  aberto: 'Aberto',
  em_andamento: 'Em andamento',
  fechado: 'Fechado',
}

export default function Tickets() {
  const [tickets, setTickets] = useState(null)
  const [erro, setErro] = useState('')
  const [aberto, setAberto] = useState(false)
  const [form, setForm] = useState({ assunto: '', descricao: '' })

  async function carregar() {
    try {
      setTickets(await api.get('/tickets'))
    } catch (err) {
      setErro(err.message)
    }
  }
  useEffect(() => { carregar() }, [])

  async function enviar(e) {
    e.preventDefault()
    setErro('')
    try {
      await api.post('/tickets', form)
      setForm({ assunto: '', descricao: '' })
      setAberto(false)
      carregar()
    } catch (err) {
      setErro(err.message)
    }
  }

  return (
    <div>
      <div className="cabecalho-secao">
        <h1>Chamados</h1>
        <button className="botao primario pequeno" onClick={() => setAberto(!aberto)}>
          {aberto ? 'Cancelar' : '+ Abrir'}
        </button>
      </div>

      {aberto && (
        <form className="cartao form bloco" onSubmit={enviar}>
          <label>Assunto
            <input value={form.assunto} onChange={(e) => setForm({ ...form, assunto: e.target.value })}
                   required minLength={3} />
          </label>
          <label>Descrição
            <textarea rows={4} value={form.descricao}
                      onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                      required minLength={3} />
          </label>
          <button className="botao primario">Enviar chamado</button>
        </form>
      )}

      {erro && <p className="erro">{erro}</p>}
      {tickets === null ? (
        <p className="suave">Carregando…</p>
      ) : tickets.length === 0 ? (
        <p className="suave">Você ainda não abriu nenhum chamado.</p>
      ) : (
        <ul className="lista">
          {tickets.map((t) => (
            <li key={t.id} className="cartao item-ticket">
              <div className="ticket-topo">
                <strong>{t.assunto}</strong>
                <span className={`tag status-${t.status}`}>{ROTULO_STATUS[t.status]}</span>
              </div>
              <p className="suave">{t.descricao}</p>
              <span className="data">{new Date(t.criado_em).toLocaleString('pt-BR')}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
