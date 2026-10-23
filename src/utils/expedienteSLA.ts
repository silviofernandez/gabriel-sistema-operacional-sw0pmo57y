import { ConfiguracaoExpediente } from '@/types/processos'

/**
 * Utilitário de Expediente e SLA para Jaú, Pederneiras e Lençóis Paulista
 * Considera dias úteis (seg-sex), horário de expediente (ex: 08:30 - 18:00) e feriados.
 * Se solicitação aberta fora do expediente, a contagem inicia no próximo período útil.
 */

export function isDentroDoExpediente(date: Date, config?: ConfiguracaoExpediente): boolean {
  const diaSemana = date.getDay() // 0 = Domingo, 1 = Segunda, ... 6 = Sábado
  const diasUteis = config?.dias_uteis || [1, 2, 3, 4, 5]
  if (!diasUteis.includes(diaSemana)) return false

  const dateIso = date.toISOString().slice(0, 10)
  if (config?.feriados?.includes(dateIso)) return false

  const horaAtual = date.getHours() + date.getMinutes() / 60
  const [iniH, iniM] = (config?.hora_inicio || '08:30').split(':').map(Number)
  const [fimH, fimM] = (config?.hora_fim || '18:00').split(':').map(Number)
  const horaIni = iniH + iniM / 60
  const horaFim = fimH + fimM / 60

  return horaAtual >= horaIni && horaAtual <= horaFim
}

export function proximoInicioUtil(fromDate: Date, config?: ConfiguracaoExpediente): Date {
  const cur = new Date(fromDate)
  const diasUteis = config?.dias_uteis || [1, 2, 3, 4, 5]
  const [iniH, iniM] = (config?.hora_inicio || '08:30').split(':').map(Number)
  const [fimH, fimM] = (config?.hora_fim || '18:00').split(':').map(Number)
  const horaFim = fimH + fimM / 60

  while (true) {
    const diaSemana = cur.getDay()
    const dateIso = cur.toISOString().slice(0, 10)
    const isDiaUtil = diasUteis.includes(diaSemana) && !config?.feriados?.includes(dateIso)
    const horaAtual = cur.getHours() + cur.getMinutes() / 60

    if (isDiaUtil) {
      if (horaAtual < iniH + iniM / 60) {
        cur.setHours(iniH, iniM, 0, 0)
        return cur
      }
      if (horaAtual <= horaFim) {
        return cur // já está dentro do expediente
      }
    }

    // Avança para o início da manhã do dia seguinte
    cur.setDate(cur.getDate() + 1)
    cur.setHours(iniH, iniM, 0, 0)
  }
}

export function adicionarHorasUteis(
  startDate: Date,
  horasUteis: number,
  config?: ConfiguracaoExpediente,
): Date {
  let cur = proximoInicioUtil(startDate, config)
  const [iniH, iniM] = (config?.hora_inicio || '08:30').split(':').map(Number)
  const [fimH, fimM] = (config?.hora_fim || '18:00').split(':').map(Number)
  const horasPorDia = fimH + fimM / 60 - (iniH + iniM / 60)

  let horasRestantes = horasUteis

  while (horasRestantes > 0) {
    const horaAtual = cur.getHours() + cur.getMinutes() / 60
    const horasDisponiveisHoje = Math.max(0, fimH + fimM / 60 - horaAtual)

    if (horasRestantes <= horasDisponiveisHoje) {
      const minutosAdd = Math.round(horasRestantes * 60)
      cur = new Date(cur.getTime() + minutosAdd * 60000)
      horasRestantes = 0
    } else {
      horasRestantes -= horasDisponiveisHoje
      cur.setDate(cur.getDate() + 1)
      cur.setHours(iniH, iniM, 0, 0)
      cur = proximoInicioUtil(cur, config)
    }
  }

  return cur
}

export function formatarDataHoraBR(dStr?: string): string {
  if (!dStr) return '-'
  try {
    const d = new Date(dStr)
    if (isNaN(d.getTime())) return dStr
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dStr
  }
}
