import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'

const VAZIO = {
  nome: '', sobrenome: '', cpf: '', data_nascimento: '',
  email: '', senha: '', plan_id: '',
}

/** 000.000.000-00 enquanto digita. O backend recebe só os dígitos. */
function mascararCpf(valor) {
  const d = valor.replace(/\D/g, '').slice(0, 11)
  return d
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d{1,2})$/, '.$1-$2')
}

const precoBR = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function Register() {
  const [form, setForm] = useState(VAZIO)
  const [planos, setPlanos] = useState([])
  const [erro, setErro] = useState('')
  const [ok, setOk] = useState(false)
  const [enviando, setEnviando] = useState(false)

  // Rota pública: a vitrine de planos existe antes de haver conta.
  // Se der erro (ou não houver plano cadastrado), o campo simplesmente não aparece.
  useEffect(() => {
    api.get('/plans').then(setPlanos).catch(() => setPlanos([]))
  }, [])

  function set(campo) {
    return (e) => setForm({ ...form, [campo]: e.target.value })
  }

  async function onSubmit(e) {
    e.preventDefault()
    setErro('')
    setEnviando(true)
    try {
      await api.post('/auth/register', {
        nome: form.nome.trim(),
        sobrenome: form.sobrenome.trim(),
        cpf: form.cpf.replace(/\D/g, ''),
        data_nascimento: form.data_nascimento,
        email: form.email.trim(),
        senha: form.senha,
        plan_id: form.plan_id || null,
      })
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

        <div className="linha-dupla">
          <label>Nome
            <input value={form.nome} onChange={set('nome')} required minLength={2}
                   autoComplete="given-name" />
          </label>
          <label>Sobrenome
            <input value={form.sobrenome} onChange={set('sobrenome')} required minLength={2}
                   autoComplete="family-name" />
          </label>
        </div>

        <div className="linha-dupla">
          <label>CPF
            {/* inputMode numérico abre o teclado de números no celular */}
            <input value={form.cpf}
                   onChange={(e) => setForm({ ...form, cpf: mascararCpf(e.target.value) })}
                   placeholder="000.000.000-00" inputMode="numeric" required minLength={14} />
          </label>
          <label>Nascimento
            <input type="date" value={form.data_nascimento} onChange={set('data_nascimento')}
                   max={new Date().toISOString().slice(0, 10)} required />
          </label>
        </div>

        <label>E-mail
          <input type="email" value={form.email} onChange={set('email')} required
                 autoComplete="email" />
        </label>
        <label>Senha
          <input type="password" value={form.senha} onChange={set('senha')}
                 required minLength={6} autoComplete="new-password" />
        </label>

        {planos.length > 0 && (
          <label>Plano desejado
            <select value={form.plan_id} onChange={set('plan_id')}>
              <option value="">— Decidir depois —</option>
              {planos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome} — {precoBR(p.preco_mensal)}/mês
                  {p.limite_jardins ? ` (até ${p.limite_jardins} jardim/ns)` : ' (jardins ilimitados)'}
                </option>
              ))}
            </select>
          </label>
        )}

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
