import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api.js'
import { tempoDesde, usePolling } from '../hooks/usePolling.js'

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

const INTERVALO_PADRAO = 10000   // placa em repouso: confere a cada 10 s
const INTERVALO_BUSCA  = 4000    // placa offline: procura mais de perto
const INTERVALO_RAPIDO = 2000    // esperando a placa confirmar um comando
const ESPERA_MAXIMA    = 20000   // depois disso, desiste de esperar a confirmação

export default function GardenDetail() {
  const { id } = useParams()
  const navegar = useNavigate()
  const [horarios, setHorarios] = useState([])
  const [erro, setErro] = useState('')
  const [msg, setMsg] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [aguardando, setAguardando] = useState(null)   // { acao } enquanto a placa não confirma
  const [editando, setEditando] = useState(false)

  // ------------------------------------------------------- status ao vivo --
  const buscarJardim = useCallback(() => api.get(`/gardens/${id}`), [id])
  const [intervalo, setIntervalo] = useState(INTERVALO_PADRAO)
  const { dados: jardim, erro: erroStatus, carregando, atualizadoEm, refrescar, setDados } =
    usePolling(buscarJardim, { intervalo })

  const temPlaca = !!jardim?.device
  const online = jardim?.device?.status === 'online'
  const podeIrrigar = temPlaca && online && !enviando

  // Ritmo do polling: acelera esperando a confirmação, e fica de tocaia quando
  // a placa está offline para liberar os botões assim que ela voltar.
  useEffect(() => {
    const alvo = aguardando ? INTERVALO_RAPIDO
      : (temPlaca && !online) ? INTERVALO_BUSCA
      : INTERVALO_PADRAO
    setIntervalo((atual) => (atual === alvo ? atual : alvo))
  }, [aguardando, temPlaca, online])

  // Horários mudam só quando o usuário mexe — não precisam de polling.
  const carregarHorarios = useCallback(() => {
    api.get(`/gardens/${id}/schedules`).then(setHorarios).catch((e) => setErro(e.message))
  }, [id])
  useEffect(() => { carregarHorarios() }, [carregarHorarios])

  // Confirmação do comando: o polling rápido roda até a placa refletir o estado.
  useEffect(() => {
    if (!aguardando || !jardim) return
    const esperado = aguardando.acao === 'start'
    if (jardim.irrigando === esperado) {
      setAguardando(null)
      setMsg(esperado ? 'Irrigação ligada — placa confirmou 💧' : 'Irrigação desligada — placa confirmou')
    }
  }, [jardim, aguardando])

  // Rede de segurança: se a placa não confirmar, para de esperar e avisa.
  useEffect(() => {
    if (!aguardando) return
    const t = setTimeout(() => {
      setAguardando(null)
      // Em segundo plano o polling fica pausado, então não dá para culpar a placa.
      if (document.hidden) return
      setErro('A placa recebeu o comando mas não confirmou o novo estado. '
            + 'Verifique se ela continua ligada e tente de novo.')
    }, ESPERA_MAXIMA)
    return () => clearTimeout(t)
  }, [aguardando])

  async function irrigar(acao) {
    setMsg(''); setErro('')

    // Só manda a requisição se a placa estiver online — offline o comando MQTT
    // se perderia no caminho e o usuário ficaria achando que funcionou.
    if (!temPlaca) { setErro('Este jardim ainda não tem uma placa associada.'); return }
    if (!online) {
      setErro('A placa está offline — nada foi enviado. Assim que ela voltar, o botão libera sozinho.')
      refrescar()
      return
    }

    setEnviando(true)
    try {
      await api.post(`/gardens/${id}/irrigate`, acao === 'start'
        ? { acao: 'start', duracao_seg: 600 }   // 10 min por padrão
        : { acao: 'stop' })
      setMsg(acao === 'start' ? 'Comando enviado — aguardando a placa…' : 'Desligando — aguardando a placa…')
      setAguardando({ acao })
      refrescar()
    } catch (err) {
      setErro(err.message)
    } finally {
      setEnviando(false)
    }
  }

  if (carregando && !jardim) return <p className="suave">Carregando…</p>
  if (!jardim) return <div><Voltar /><p className="erro">{erroStatus || 'Jardim não encontrado'}</p></div>

  return (
    <div>
      <Voltar />
      <div className="cabecalho-secao titulo-jardim">
        <h1>{jardim.nome}</h1>
        <button className="botao secundario pequeno" onClick={() => { setEditando(!editando); setMsg(''); setErro('') }}>
          {editando ? 'Cancelar' : 'Editar'}
        </button>
      </div>
      {!editando && jardim.descricao && <p className="suave">{jardim.descricao}</p>}

      {editando && (
        <FormEditarJardim
          jardim={jardim}
          aoSalvar={(atualizado) => {
            setDados(atualizado)          // reflete na hora; o polling confirma depois
            setEditando(false)
            setMsg('Jardim atualizado')
          }}
          setErro={setErro}
        />
      )}

      <div className="cartao painel-status">
        <div>
          <span className="rotulo">Estado</span>
          <strong className={jardim.irrigando ? 'verde' : ''}>
            {jardim.irrigando ? '💧 Irrigando' : 'Parado'}
          </strong>
        </div>
        <div>
          <span className="rotulo">Placa</span>
          {temPlaca
            ? <strong className={online ? 'verde' : 'cinza'}>{jardim.device.status}</strong>
            : <strong className="cinza">não associada</strong>}
          {temPlaca && jardim.device.ultima_vez && (
            <span className="data">sinal {tempoDesde(jardim.device.ultima_vez)}</span>
          )}
        </div>
      </div>

      <BarraMonitor
        erro={erroStatus}
        atualizadoEm={atualizadoEm}
        aguardando={!!aguardando}
        aoAtualizar={refrescar}
      />

      {!temPlaca && (
        <p className="aviso">
          Este jardim ainda não tem uma placa associada. Peça ao administrador para
          vincular o dispositivo antes de irrigar.
        </p>
      )}

      {temPlaca && !online && (
        <div className="aviso banner-procura">
          <span className="radar" aria-hidden="true" />
          <div>
            <strong>Placa offline — procurando…</strong>
            <p>
              O app checa a cada {INTERVALO_BUSCA / 1000} s e libera os botões sozinho
              assim que ela voltar. Nenhum comando é enviado enquanto isso.
            </p>
          </div>
        </div>
      )}

      <div className="botoes-irrigar">
        <button className="botao grande primario" disabled={!podeIrrigar}
                onClick={() => irrigar('start')}>
          {aguardando?.acao === 'start' ? 'Ligando…' : 'Ligar agora'}
        </button>
        <button className="botao grande secundario" disabled={!podeIrrigar}
                onClick={() => irrigar('stop')}>
          {aguardando?.acao === 'stop' ? 'Desligando…' : 'Desligar'}
        </button>
      </div>
      {msg && <p className="ok">{msg}</p>}
      {erro && <p className="erro">{erro}</p>}

      <Horarios gardenId={id} horarios={horarios} aoMudar={carregarHorarios} setErro={setErro} />

      <ZonaPerigo
        jardim={jardim}
        aoExcluir={() => navegar('/', { replace: true })}
        setErro={setErro}
      />
    </div>
  )
}

/** Renomear / mudar a descrição. Monta com os valores atuais e não é tocado pelo polling. */
function FormEditarJardim({ jardim, aoSalvar, setErro }) {
  const [nome, setNome] = useState(jardim.nome)
  const [descricao, setDescricao] = useState(jardim.descricao || '')
  const [salvando, setSalvando] = useState(false)

  async function salvar(e) {
    e.preventDefault()
    if (!nome.trim()) return
    setErro('')
    setSalvando(true)
    try {
      const atualizado = await api.put(`/gardens/${jardim.id}`, {
        nome: nome.trim(),
        descricao: descricao.trim() || null,
      })
      aoSalvar(atualizado)
    } catch (err) {
      setErro(err.message)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <form className="cartao form" onSubmit={salvar}>
      <label>Nome
        <input value={nome} onChange={(e) => setNome(e.target.value)}
               maxLength={120} required autoFocus />
      </label>
      <label>Descrição
        <input value={descricao} onChange={(e) => setDescricao(e.target.value)}
               placeholder="Opcional (ex: canteiro dos fundos)" />
      </label>
      <button className="botao primario" disabled={salvando}>
        {salvando ? 'Salvando…' : 'Salvar alterações'}
      </button>
    </form>
  )
}

/** Exclusão em dois toques — nada de apagar jardim por esbarrão no celular. */
function ZonaPerigo({ jardim, aoExcluir, setErro }) {
  const [confirmando, setConfirmando] = useState(false)
  const [apagando, setApagando] = useState(false)

  async function excluir() {
    setErro('')
    setApagando(true)
    try {
      await api.del(`/gardens/${jardim.id}`)
      aoExcluir()
    } catch (err) {
      setErro(err.message)
      setApagando(false)
      setConfirmando(false)
    }
  }

  return (
    <section className="cartao zona-perigo">
      {!confirmando ? (
        <>
          <div>
            <strong>Excluir jardim</strong>
            <p className="suave">Apaga os horários e o histórico deste jardim. A placa não é apagada.</p>
          </div>
          <button className="link-btn perigo" onClick={() => setConfirmando(true)}>Excluir</button>
        </>
      ) : (
        <>
          <div>
            <strong>Excluir “{jardim.nome}”?</strong>
            <p className="suave">
              {jardim.irrigando
                ? 'A irrigação em curso será desligada e a agenda apagada da placa. Não dá para desfazer.'
                : 'Os horários saem da placa junto. Não dá para desfazer.'}
            </p>
          </div>
          <div className="acoes-perigo">
            <button className="botao secundario pequeno" disabled={apagando}
                    onClick={() => setConfirmando(false)}>Cancelar</button>
            <button className="botao pequeno perigo" disabled={apagando} onClick={excluir}>
              {apagando ? 'Excluindo…' : 'Excluir mesmo'}
            </button>
          </div>
        </>
      )}
    </section>
  )
}

function Voltar() {
  return <Link to="/" className="voltar">‹ Meus jardins</Link>
}

/** Faixa fina com o "batimento" do polling: mostra que a tela está viva. */
function BarraMonitor({ erro, atualizadoEm, aguardando, aoAtualizar }) {
  const [, forcar] = useState(0)
  // redesenha de tempos em tempos só para o "há Xs" não congelar
  useEffect(() => {
    const t = setInterval(() => forcar((n) => n + 1), 5000)
    return () => clearInterval(t)
  }, [])

  const segundos = atualizadoEm ? Math.round((Date.now() - atualizadoEm) / 1000) : null

  return (
    <div className={`monitor ${erro ? 'com-erro' : ''}`}>
      <span className="ponto-vivo" aria-hidden="true" />
      <span>
        {erro
          ? `Sem contato com o servidor — tentando de novo (${erro})`
          : aguardando
            ? 'Aguardando a placa confirmar…'
            : segundos === null ? 'Sincronizando…' : `Atualizado há ${segundos}s`}
      </span>
      <button type="button" className="link-btn" onClick={aoAtualizar}>Atualizar</button>
    </div>
  )
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
