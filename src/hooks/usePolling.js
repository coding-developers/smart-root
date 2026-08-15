import { useCallback, useEffect, useRef, useState } from 'react'

// Recuo máximo em caso de falhas seguidas: intervalo * 8.
// (Evita martelar o backend quando ele cai ou a URL do ngrok muda.)
const MAX_MULTIPLICADOR = 8

/**
 * Chama `buscar()` de tempos em tempos e devolve o último resultado.
 *
 * Cuidados que o hook toma sozinho:
 *  - pausa quando a aba está em segundo plano (`document.hidden`) ou o aparelho
 *    está sem internet — importante num PWA de celular, que fica minimizado;
 *  - volta a buscar na hora quando a aba reaparece ou a internet volta;
 *  - recuo exponencial a cada falha seguida, zerado no primeiro sucesso;
 *  - nunca deixa duas requisições da mesma origem em voo (usa setTimeout
 *    encadeado, não setInterval).
 *
 * @param buscar   função async estável (envolva em useCallback)
 * @param intervalo  ms entre as chamadas; pode mudar em tempo de execução
 * @param ativo    false congela o polling
 */
export function usePolling(buscar, { intervalo = 10000, ativo = true } = {}) {
  const [dados, setDados] = useState(null)
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [atualizadoEm, setAtualizadoEm] = useState(null)
  const [gatilho, setGatilho] = useState(0)   // incrementar = buscar agora

  const buscarRef = useRef(buscar)
  useEffect(() => { buscarRef.current = buscar })

  const timer = useRef(null)
  const falhas = useRef(0)
  const vivo = useRef(true)

  useEffect(() => {
    vivo.current = true
    return () => { vivo.current = false; clearTimeout(timer.current) }
  }, [])

  const executar = useCallback(async () => {
    try {
      const novo = await buscarRef.current()
      if (!vivo.current) return
      setDados(novo)
      setErro('')
      setAtualizadoEm(Date.now())
      falhas.current = 0
    } catch (e) {
      if (!vivo.current) return
      falhas.current += 1
      setErro(e.message || 'Falha ao atualizar')
    } finally {
      if (vivo.current) setCarregando(false)
    }
  }, [])

  useEffect(() => {
    if (!ativo) return
    let cancelado = false

    const pausado = () => document.hidden || navigator.onLine === false

    async function ciclo() {
      if (cancelado) return
      if (!pausado()) await executar()
      if (cancelado) return
      const espera = intervalo * Math.min(2 ** falhas.current, MAX_MULTIPLICADOR)
      timer.current = setTimeout(ciclo, espera)
    }
    ciclo()

    function acordar() {
      if (cancelado || pausado()) return
      clearTimeout(timer.current)
      falhas.current = 0     // voltou do segundo plano: recomeça sem penalidade
      ciclo()
    }
    document.addEventListener('visibilitychange', acordar)
    window.addEventListener('online', acordar)

    return () => {
      cancelado = true
      clearTimeout(timer.current)
      document.removeEventListener('visibilitychange', acordar)
      window.removeEventListener('online', acordar)
    }
  }, [intervalo, ativo, gatilho, executar])

  // Dispara uma busca imediata e reinicia a contagem do intervalo.
  const refrescar = useCallback(() => setGatilho((g) => g + 1), [])

  return { dados, erro, carregando, atualizadoEm, refrescar, setDados }
}

/**
 * O backend grava os horários em UTC mas serializa sem o fuso ("...T12:00:00").
 * Sem o 'Z' o navegador interpretaria como hora local e a conta de "há quanto
 * tempo" sairia deslocada em 3 h no Brasil.
 */
export function paraData(iso) {
  if (!iso) return null
  const temFuso = /(Z|[+-]\d{2}:?\d{2})$/.test(iso)
  return new Date(temFuso ? iso : `${iso}Z`)
}

/** "há 2 min", "há 1 h" — usado para o último sinal da placa. */
export function tempoDesde(iso) {
  const d = paraData(iso)
  if (!d || Number.isNaN(d.getTime())) return null
  const seg = Math.round((Date.now() - d.getTime()) / 1000)
  if (seg < 45) return 'agora mesmo'          // cobre também pequeno desvio de relógio
  if (seg < 90) return 'há 1 min'
  const min = Math.round(seg / 60)
  if (min < 60) return `há ${min} min`
  const h = Math.round(min / 60)
  if (h < 24) return `há ${h} h`
  return `há ${Math.round(h / 24)} dia(s)`
}
