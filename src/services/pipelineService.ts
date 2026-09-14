import pb from '@/lib/pocketbase/client'
import {
  AuditActionType,
  AuditLogItem,
  DailyMetricItem,
  EmployeeCoverage,
  FormalRecordItem,
  NotificationItem,
  StagePermissionItem,
} from '@/types/pipeline'

export const pipelineService = {
  // 1. Logs de auditoria
  async fetchAuditLogs(filter?: string, sort = '-created', limit = 100): Promise<AuditLogItem[]> {
    try {
      const records = await pb.collection('log_auditoria').getList<AuditLogItem>(1, limit, {
        filter,
        sort,
      })
      return records.items
    } catch (err) {
      console.warn('Erro ao carregar log_auditoria do PocketBase:', err)
      return []
    }
  },

  async logAction(item: Omit<AuditLogItem, 'id' | 'created'>): Promise<AuditLogItem | null> {
    try {
      const record = await pb.collection('log_auditoria').create<AuditLogItem>({
        ...item,
        timestamp: item.timestamp || new Date().toISOString().replace('T', ' ').slice(0, 19),
        ip: item.ip || '187.22.45.10',
        dispositivo:
          item.dispositivo ||
          (typeof navigator !== 'undefined'
            ? `${navigator.userAgent.includes('Mac') ? 'macOS' : 'Windows'} / Navegador`
            : 'Web Client'),
      })
      return record
    } catch (err) {
      console.warn('Erro ao salvar registro no log_auditoria:', err)
      return null
    }
  },

  // 2. Permissões de Etapas
  async fetchStagePermissions(colaboradorId?: string): Promise<StagePermissionItem[]> {
    try {
      const filter = colaboradorId ? `colaborador_id = '${colaboradorId}'` : ''
      const records = await pb.collection('etapas_permissoes').getFullList<StagePermissionItem>({
        filter,
        sort: 'etapa_id',
      })
      return records
    } catch (err) {
      console.warn('Erro ao carregar etapas_permissoes:', err)
      return []
    }
  },

  async addStagePermission(
    data: Omit<StagePermissionItem, 'id'>,
  ): Promise<StagePermissionItem | null> {
    try {
      const record = await pb.collection('etapas_permissoes').create<StagePermissionItem>(data)
      return record
    } catch (err) {
      console.error('Erro ao criar etapas_permissoes:', err)
      return null
    }
  },

  async removeStagePermission(id: string): Promise<boolean> {
    try {
      await pb.collection('etapas_permissoes').delete(id)
      return true
    } catch (err) {
      console.error('Erro ao deletar etapa_permissao:', err)
      return false
    }
  },

  // 3. Coberturas de Ausência
  async fetchCoverages(status?: 'ativa' | 'concluida' | 'cancelada'): Promise<EmployeeCoverage[]> {
    try {
      const filter = status ? `status = '${status}'` : ''
      const records = await pb.collection('coberturas').getFullList<EmployeeCoverage>({
        filter,
        sort: '-created',
      })
      return records
    } catch (err) {
      console.warn('Erro ao carregar coberturas:', err)
      return []
    }
  },

  async createCoverage(data: Omit<EmployeeCoverage, 'id'>): Promise<EmployeeCoverage | null> {
    try {
      const record = await pb.collection('coberturas').create<EmployeeCoverage>(data)
      return record
    } catch (err) {
      console.error('Erro ao criar cobertura:', err)
      return null
    }
  },

  async finishCoverage(
    coverageId: string,
    actionsSummary?: { data: string; acao: string }[],
  ): Promise<EmployeeCoverage | null> {
    try {
      const updateData: Partial<EmployeeCoverage> = {
        status: 'concluida',
        data_fim_real: new Date().toISOString().slice(0, 10),
      }
      if (actionsSummary) {
        updateData.relatorio_acoes = actionsSummary
      }
      const record = await pb
        .collection('coberturas')
        .update<EmployeeCoverage>(coverageId, updateData)
      return record
    } catch (err) {
      console.error('Erro ao finalizar cobertura:', err)
      return null
    }
  },

  // 4. Métricas Diárias & Desempenho
  async fetchDailyMetrics(filter?: string): Promise<DailyMetricItem[]> {
    try {
      const records = await pb.collection('metricas_diarias').getFullList<DailyMetricItem>({
        filter,
        sort: '-score_total',
      })
      return records
    } catch (err) {
      console.warn('Erro ao carregar metricas_diarias:', err)
      return []
    }
  },

  async saveDailyMetric(metric: Omit<DailyMetricItem, 'id'>): Promise<DailyMetricItem | null> {
    try {
      const record = await pb.collection('metricas_diarias').create<DailyMetricItem>(metric)
      return record
    } catch (err) {
      console.error('Erro ao salvar métrica diária:', err)
      return null
    }
  },

  // 5. Registros Formais (Acertos & Ocorrências)
  async fetchFormalRecords(colaboradorId?: string): Promise<FormalRecordItem[]> {
    try {
      const filter = colaboradorId ? `colaborador_id = '${colaboradorId}'` : ''
      const records = await pb.collection('registros_formais').getFullList<FormalRecordItem>({
        filter,
        sort: '-created',
      })
      return records
    } catch (err) {
      console.warn('Erro ao carregar registros_formais:', err)
      return []
    }
  },

  async createFormalRecord(record: Omit<FormalRecordItem, 'id'>): Promise<FormalRecordItem | null> {
    try {
      const created = await pb.collection('registros_formais').create<FormalRecordItem>(record)
      return created
    } catch (err) {
      console.error('Erro ao criar registro formal:', err)
      return null
    }
  },

  // 6. Notificações / Central WhatsApp
  async fetchNotifications(destinatarioId?: string): Promise<NotificationItem[]> {
    try {
      const filter = destinatarioId ? `destinatario_id = '${destinatarioId}'` : ''
      const records = await pb.collection('notificacoes').getFullList<NotificationItem>({
        filter,
        sort: '-created',
      })
      return records
    } catch (err) {
      console.warn('Erro ao carregar notificacoes:', err)
      return []
    }
  },

  async sendNotification(item: Omit<NotificationItem, 'id'>): Promise<NotificationItem | null> {
    try {
      const record = await pb.collection('notificacoes').create<NotificationItem>({
        ...item,
        status: item.status || 'enviada',
        enviada_em: item.enviada_em || new Date().toISOString().replace('T', ' ').slice(0, 19),
      })
      return record
    } catch (err) {
      console.error('Erro ao enviar notificação:', err)
      return null
    }
  },
}

export default pipelineService
