import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'
import useAuthStore from './useAuthStore'
import {
  PIPELINE_STAGES,
  PipelineStage,
  AuditLogItem,
  AuditActionType,
  StagePermissionItem,
  EmployeeCoverage,
  DailyMetricItem,
  FormalRecordItem,
  NotificationItem,
} from '@/types/pipeline'
import { pipelineService } from '@/services/pipelineService'
import { useToast } from '@/hooks/use-toast'

interface PipelineAccessState {
  stages: PipelineStage[]
  assignedStageIds: string[]
  temporaryStageIds: string[]
  allActiveStageIds: string[]
  activeCoverages: EmployeeCoverage[]
  myActiveCoverage: EmployeeCoverage | null

  // Funções de verificação de permissão
  canOperateStage: (stageId: string) => boolean
  canReadAdjacentStage: (stageId: string) => boolean
  getStageAccessType: (stageId: string) => 'operacao' | 'leitura_adjacente' | 'bloqueado'

  // Auditoria
  auditLogs: AuditLogItem[]
  logAuditAction: (params: {
    acao: AuditActionType
    etapaId?: string
    contratoId?: string
    dadosAntes?: Record<string, unknown>
    dadosDepois?: Record<string, unknown>
    motivo?: string
    autorizadoPor?: string
  }) => Promise<void>
  refreshLogs: () => Promise<void>

  // Permissões
  permissions: StagePermissionItem[]
  addPermission: (perm: Omit<StagePermissionItem, 'id'>) => Promise<boolean>
  removePermission: (id: string) => Promise<boolean>

  // Coberturas
  coverages: EmployeeCoverage[]
  startCoverage: (data: {
    colaboradorAusenteId: string
    colaboradorSubstitutoId: string
    etapasCobertas: string[]
    dataFimPrevista: string
    motivo: string
  }) => Promise<boolean>
  endCoverage: (coverageId: string) => Promise<boolean>

  // Métricas e Desempenho
  metrics: DailyMetricItem[]
  formalRecords: FormalRecordItem[]
  addFormalRecord: (data: Omit<FormalRecordItem, 'id'>) => Promise<boolean>
  refreshMetrics: () => Promise<void>

  // Notificações
  notifications: NotificationItem[]
  refreshNotifications: () => Promise<void>

  // Modal de Acesso Restrito
  restrictedModalState: {
    isOpen: boolean
    stage: PipelineStage | null
    isAdjacent: boolean
  }
  openRestrictedModal: (stage: PipelineStage, isAdjacent?: boolean) => void
  closeRestrictedModal: () => void
  requestAccess: (stage: PipelineStage, motivo?: string) => Promise<void>
}

const PipelineAccessContext = createContext<PipelineAccessState | undefined>(undefined)

export const PipelineAccessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profileLevel, role } = useAuthStore()
  const { toast } = useToast()

  const [permissions, setPermissions] = useState<StagePermissionItem[]>([])
  const [coverages, setCoverages] = useState<EmployeeCoverage[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([])
  const [metrics, setMetrics] = useState<DailyMetricItem[]>([])
  const [formalRecords, setFormalRecords] = useState<FormalRecordItem[]>([])
  const [notifications, setNotifications] = useState<NotificationItem[]>([])

  const [restrictedModalState, setRestrictedModalState] = useState<{
    isOpen: boolean
    stage: PipelineStage | null
    isAdjacent: boolean
  }>({
    isOpen: false,
    stage: null,
    isAdjacent: false,
  })

  // Carregar dados iniciais
  const refreshAll = useCallback(async () => {
    try {
      const [p, c, l, m, f, n] = await Promise.all([
        pipelineService.fetchStagePermissions(),
        pipelineService.fetchCoverages(),
        pipelineService.fetchAuditLogs('', '-created', 150),
        pipelineService.fetchDailyMetrics(),
        pipelineService.fetchFormalRecords(),
        pipelineService.fetchNotifications(),
      ])
      setPermissions(p)
      setCoverages(c)
      setAuditLogs(l)
      setMetrics(m)
      setFormalRecords(f)
      setNotifications(n)
    } catch (err) {
      console.warn('Erro ao carregar dados do pipeline:', err)
    }
  }, [])

  useEffect(() => {
    refreshAll()
  }, [refreshAll])

  const refreshLogs = useCallback(async () => {
    const l = await pipelineService.fetchAuditLogs('', '-created', 150)
    setAuditLogs(l)
  }, [])

  const refreshMetrics = useCallback(async () => {
    const [m, f] = await Promise.all([
      pipelineService.fetchDailyMetrics(),
      pipelineService.fetchFormalRecords(),
    ])
    setMetrics(m)
    setFormalRecords(f)
  }, [])

  const refreshNotifications = useCallback(async () => {
    const n = await pipelineService.fetchNotifications()
    setNotifications(n)
  }, [])

  // Identificar etapas do usuário logado
  const isManagerOrAdmin = useMemo(() => {
    return role === 'Administrador' || profileLevel === 'Diretor' || profileLevel === 'Gestor'
  }, [role, profileLevel])

  const assignedStageIds = useMemo(() => {
    if (isManagerOrAdmin) {
      // Gestores e diretores têm visão de todas as etapas por padrão
      return PIPELINE_STAGES.map((s) => s.id)
    }
    const userPerms = permissions.filter(
      (p) => p.colaborador_id === user.id && p.tipo === 'permanente' && p.is_active !== false,
    )
    if (userPerms.length > 0) {
      return userPerms.map((p) => p.etapa_id)
    }

    // Fallback padrão baseado no role do mock
    if (role === 'Equipe de Vistoria' || user.id === 'u4') return ['4', '8']
    if (role === 'Equipe Financeira' || user.id === 'u5') return ['9', '12']
    if (role === 'Concierge' || user.id === 'u6') return ['6', '7', '10']
    if (user.id === 'u3') return ['1', '2', '3']
    return ['1', '2']
  }, [permissions, user.id, isManagerOrAdmin, role])

  // Coberturas ativas
  const activeCoverages = useMemo(() => {
    return coverages.filter((c) => c.status === 'ativa')
  }, [coverages])

  const myActiveCoverage = useMemo(() => {
    return activeCoverages.find((c) => c.colaborador_substituto_id === user.id) || null
  }, [activeCoverages, user.id])

  const temporaryStageIds = useMemo(() => {
    if (isManagerOrAdmin) return []
    const tempPerms = permissions.filter(
      (p) => p.colaborador_id === user.id && p.tipo === 'temporaria' && p.is_active !== false,
    )
    const fromPerms = tempPerms.map((p) => p.etapa_id)
    const fromCoverage = myActiveCoverage ? myActiveCoverage.etapas_cobertas : []
    return Array.from(new Set([...fromPerms, ...fromCoverage]))
  }, [permissions, user.id, myActiveCoverage, isManagerOrAdmin])

  const allActiveStageIds = useMemo(() => {
    return Array.from(new Set([...assignedStageIds, ...temporaryStageIds]))
  }, [assignedStageIds, temporaryStageIds])

  // Checagem de Operação (normal ou cobertura temporária)
  const canOperateStage = useCallback(
    (stageId: string) => {
      if (isManagerOrAdmin) return true
      return allActiveStageIds.includes(stageId)
    },
    [isManagerOrAdmin, allActiveStageIds],
  )

  // Checagem de Leitura Adjacente: anterior ou próxima a qualquer etapa ativa
  const adjacentStageIds = useMemo(() => {
    if (isManagerOrAdmin) return []
    const adj = new Set<string>()
    for (const sid of allActiveStageIds) {
      const num = parseInt(sid, 10)
      if (num > 1) adj.add(String(num - 1))
      if (num < 12) adj.add(String(num + 1))
    }
    // Remove as que já opera normalmente
    for (const sid of allActiveStageIds) {
      adj.delete(sid)
    }
    return Array.from(adj)
  }, [allActiveStageIds, isManagerOrAdmin])

  const canReadAdjacentStage = useCallback(
    (stageId: string) => {
      if (isManagerOrAdmin) return true
      return adjacentStageIds.includes(stageId)
    },
    [isManagerOrAdmin, adjacentStageIds],
  )

  const getStageAccessType = useCallback(
    (stageId: string): 'operacao' | 'leitura_adjacente' | 'bloqueado' => {
      if (isManagerOrAdmin || allActiveStageIds.includes(stageId)) {
        return 'operacao'
      }
      if (adjacentStageIds.includes(stageId)) {
        return 'leitura_adjacente'
      }
      return 'bloqueado'
    },
    [isManagerOrAdmin, allActiveStageIds, adjacentStageIds],
  )

  // Função central de registro de auditoria
  const logAuditAction = useCallback(
    async ({
      acao,
      etapaId,
      contratoId,
      dadosAntes,
      dadosDepois,
      motivo,
      autorizadoPor,
    }: {
      acao: AuditActionType
      etapaId?: string
      contratoId?: string
      dadosAntes?: Record<string, unknown>
      dadosDepois?: Record<string, unknown>
      motivo?: string
      autorizadoPor?: string
    }) => {
      const isOwnStage = etapaId ? assignedStageIds.includes(etapaId) : true
      const newLog = await pipelineService.logAction({
        colaborador_id: user.id || 'u3',
        colaborador_nome: user.name || 'Colaborador',
        acao_tipo: acao,
        etapa_id: etapaId,
        etapa_propria: isOwnStage,
        contrato_id: contratoId,
        dados_antes: dadosAntes,
        dados_depois: dadosDepois,
        motivo,
        autorizado_por: autorizadoPor,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      })

      if (newLog) {
        setAuditLogs((prev) => [newLog, ...prev])
      }

      // Se for tentativa de acesso negado, gerar notificação para gestor (WhatsApp/Sistema)
      if (acao === 'tentou_acesso_negado') {
        const stageObj = PIPELINE_STAGES.find((s) => s.id === etapaId)
        const stageName = stageObj ? stageObj.name : `Etapa ${etapaId}`
        await pipelineService.sendNotification({
          destinatario_id: 'u1',
          destinatario_nome: 'Carlos Silva (Gestor)',
          telefone: '(11) 99999-8888',
          mensagem: `${user.name || 'Colaborador'} tentou acessar ${stageName} sem permissão às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}.`,
          tipo: 'whatsapp_gestor_tentativa',
          status: 'enviada',
        })
      }
    },
    [user.id, user.name, assignedStageIds],
  )

  // Adicionar permissão
  const addPermission = useCallback(async (perm: Omit<StagePermissionItem, 'id'>) => {
    const created = await pipelineService.addStagePermission(perm)
    if (created) {
      setPermissions((prev) => [...prev, created])
      return true
    }
    return false
  }, [])

  const removePermission = useCallback(async (id: string) => {
    const success = await pipelineService.removeStagePermission(id)
    if (success) {
      setPermissions((prev) => prev.filter((p) => p.id !== id))
      return true
    }
    return false
  }, [])

  // Fluxo de Cobertura de Ausência Completo
  const startCoverage = useCallback(
    async ({
      colaboradorAusenteId,
      colaboradorSubstitutoId,
      etapasCobertas,
      dataFimPrevista,
      motivo,
    }: {
      colaboradorAusenteId: string
      colaboradorSubstitutoId: string
      etapasCobertas: string[]
      dataFimPrevista: string
      motivo: string
    }) => {
      try {
        const todayStr = new Date().toISOString().slice(0, 10)
        const ausente = ['u4', 'u3', 'u2', 'u5', 'u6', 'u1'].find(
          (id) => id === colaboradorAusenteId,
        )
        const ausenteNome =
          colaboradorAusenteId === 'u4'
            ? 'Alice Santos'
            : colaboradorAusenteId === 'u3'
              ? 'João Paulo'
              : colaboradorAusenteId === 'u5'
                ? 'Ricardo Mendes'
                : 'Colaborador'
        const substitutoNome =
          colaboradorSubstitutoId === 'u3'
            ? 'João Paulo'
            : colaboradorSubstitutoId === 'u4'
              ? 'Alice Santos'
              : colaboradorSubstitutoId === 'u6'
                ? 'Camila Torres'
                : 'Substituto'

        // 1. Criar registro de cobertura
        const createdCob = await pipelineService.createCoverage({
          colaborador_ausente_id: colaboradorAusenteId,
          colaborador_ausente_nome: ausenteNome,
          colaborador_substituto_id: colaboradorSubstitutoId,
          colaborador_substituto_nome: substitutoNome,
          etapas_cobertas: etapasCobertas,
          data_inicio: todayStr,
          data_fim_prevista: dataFimPrevista,
          motivo,
          autorizado_por: user.name || 'Carlos Silva (Gestor)',
          status: 'ativa',
          relatorio_acoes: [],
        })

        // 2. Criar permissões temporárias para as etapas
        for (const stageId of etapasCobertas) {
          await pipelineService.addStagePermission({
            colaborador_id: colaboradorSubstitutoId,
            etapa_id: stageId,
            tipo: 'temporaria',
            data_inicio: todayStr,
            data_fim: dataFimPrevista,
            motivo: `Cobertura de ausência de ${ausenteNome}`,
            autorizado_por: user.name || 'Carlos Silva (Gestor)',
            is_active: true,
          })
        }

        // 3. Registrar formalmente a cobertura no log
        await pipelineService.logAction({
          colaborador_id: user.id,
          colaborador_nome: user.name,
          acao_tipo: 'acessou_com_permissao_extra',
          etapa_id: etapasCobertas[0] || '4',
          etapa_propria: false,
          motivo: `Iniciada cobertura de ausência de ${ausenteNome} por ${substitutoNome}`,
          autorizado_por: user.name,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        })

        // 4. Notificar substituto via WhatsApp/Sistema
        const stageNames = etapasCobertas
          .map((id) => PIPELINE_STAGES.find((s) => s.id === id)?.shortName || `Etapa ${id}`)
          .join(', ')
        await pipelineService.sendNotification({
          destinatario_id: colaboradorSubstitutoId,
          destinatario_nome: substitutoNome,
          telefone: '(11) 97654-3210',
          mensagem: `${substitutoNome.split(' ')[0]}, você está cobrindo ${stageNames} de ${ausenteNome.split(' ')[0]} até ${new Date(dataFimPrevista).toLocaleDateString('pt-BR')}. Bom trabalho!`,
          tipo: 'whatsapp_cobertura',
          status: 'enviada',
        })

        await refreshAll()
        return true
      } catch (err) {
        console.error('Erro ao iniciar cobertura:', err)
        return false
      }
    },
    [user.id, user.name, refreshAll],
  )

  const endCoverage = useCallback(
    async (coverageId: string) => {
      try {
        const cob = coverages.find((c) => c.id === coverageId)
        if (!cob) return false

        // Finaliza cobertura
        await pipelineService.finishCoverage(coverageId, [
          {
            data: new Date().toLocaleDateString('pt-BR'),
            acao: 'Cobertura encerrada formalmente pelo gestor. Acessos restaurados.',
          },
        ])

        // Desativa permissões temporárias
        const tempPerms = permissions.filter(
          (p) =>
            p.colaborador_id === cob.colaborador_substituto_id &&
            p.tipo === 'temporaria' &&
            cob.etapas_cobertas.includes(p.etapa_id),
        )
        for (const p of tempPerms) {
          await pipelineService.removeStagePermission(p.id)
        }

        // Registrar no log
        await pipelineService.logAction({
          colaborador_id: user.id,
          colaborador_nome: user.name,
          acao_tipo: 'acessou_com_permissao_extra',
          etapa_id: cob.etapas_cobertas[0] || '4',
          etapa_propria: false,
          motivo: `Encerramento de cobertura de ${cob.colaborador_ausente_nome}. Acesso temporário de ${cob.colaborador_substituto_nome} revogado.`,
          autorizado_por: user.name,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        })

        // Notificar ambos via WhatsApp
        await pipelineService.sendNotification({
          destinatario_id: cob.colaborador_substituto_id,
          destinatario_nome: cob.colaborador_substituto_nome,
          mensagem: `A cobertura de ${cob.colaborador_ausente_nome} foi encerrada. Obrigado pela colaboração!`,
          tipo: 'whatsapp_retorno_cobertura',
          status: 'enviada',
        })
        await pipelineService.sendNotification({
          destinatario_id: cob.colaborador_ausente_id,
          destinatario_nome: cob.colaborador_ausente_nome,
          mensagem: `Bem-vindo(a) de volta! Suas etapas estão ativas novamente sob sua responsabilidade.`,
          tipo: 'whatsapp_retorno_cobertura',
          status: 'enviada',
        })

        await refreshAll()
        return true
      } catch (err) {
        console.error('Erro ao encerrar cobertura:', err)
        return false
      }
    },
    [coverages, permissions, user.id, user.name, refreshAll],
  )

  // Registro de Acertos e Ocorrências
  const addFormalRecord = useCallback(
    async (data: Omit<FormalRecordItem, 'id'>) => {
      try {
        const created = await pipelineService.createFormalRecord(data)
        if (!created) return false

        setFormalRecords((prev) => [created, ...prev])

        // Se for acerto, disparar notificação automática de parabéns via WhatsApp
        if (data.tipo === 'acerto') {
          const colabNome = data.colaborador_nome || 'Colaborador'
          await pipelineService.sendNotification({
            destinatario_id: data.colaborador_id,
            destinatario_nome: colabNome,
            mensagem: `Parabéns, ${colabNome.split(' ')[0]}! ${user.name || 'Carlos'} registrou um acerto seu no ${data.contrato_id || 'contrato'}. Continue assim!`,
            tipo: 'whatsapp_parabens',
            status: 'enviada',
          })
        }

        // Registrar também no log de auditoria
        await pipelineService.logAction({
          colaborador_id: user.id,
          colaborador_nome: user.name,
          acao_tipo: 'editou',
          contrato_id: data.contrato_id,
          motivo: `Registro formal de ${data.tipo.toUpperCase()}: ${data.descricao.slice(0, 60)}...`,
          dadosDepois: { tipo: data.tipo, impacto: data.impacto },
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        })

        await refreshMetrics()
        return true
      } catch (err) {
        console.error('Erro ao adicionar registro formal:', err)
        return false
      }
    },
    [user.id, user.name, refreshMetrics],
  )

  // Controle de Modal de Restrição
  const openRestrictedModal = useCallback((stage: PipelineStage, isAdjacent = false) => {
    setRestrictedModalState({
      isOpen: true,
      stage,
      isAdjacent,
    })
  }, [])

  const closeRestrictedModal = useCallback(() => {
    setRestrictedModalState({ isOpen: false, stage: null, isAdjacent: false })
  }, [])

  const requestAccess = useCallback(
    async (stage: PipelineStage, motivo?: string) => {
      // Registra tentativa no log e envia notificação ao gestor
      await logAuditAction({
        acao: 'tentou_acesso_negado',
        etapaId: stage.id,
        motivo: motivo || 'Solicitação de acesso emergencial pelo colaborador',
      })
      toast({
        title: 'Solicitação Enviada',
        description: `Seu gestor foi notificado para liberar acesso temporário à etapa "${stage.name}".`,
      })
      closeRestrictedModal()
    },
    [logAuditAction, toast, closeRestrictedModal],
  )

  const value = useMemo(
    () => ({
      stages: PIPELINE_STAGES,
      assignedStageIds,
      temporaryStageIds,
      allActiveStageIds,
      activeCoverages,
      myActiveCoverage,
      canOperateStage,
      canReadAdjacentStage,
      getStageAccessType,
      auditLogs,
      logAuditAction,
      refreshLogs,
      permissions,
      addPermission,
      removePermission,
      coverages,
      startCoverage,
      endCoverage,
      metrics,
      formalRecords,
      addFormalRecord,
      refreshMetrics,
      notifications,
      refreshNotifications,
      restrictedModalState,
      openRestrictedModal,
      closeRestrictedModal,
      requestAccess,
    }),
    [
      assignedStageIds,
      temporaryStageIds,
      allActiveStageIds,
      activeCoverages,
      myActiveCoverage,
      canOperateStage,
      canReadAdjacentStage,
      getStageAccessType,
      auditLogs,
      logAuditAction,
      refreshLogs,
      permissions,
      addPermission,
      removePermission,
      coverages,
      startCoverage,
      endCoverage,
      metrics,
      formalRecords,
      addFormalRecord,
      refreshMetrics,
      notifications,
      refreshNotifications,
      restrictedModalState,
      openRestrictedModal,
      closeRestrictedModal,
      requestAccess,
    ],
  )

  return <PipelineAccessContext.Provider value={value}>{children}</PipelineAccessContext.Provider>
}

export default function usePipelineAccess() {
  const context = useContext(PipelineAccessContext)
  if (!context) {
    throw new Error('usePipelineAccess must be used within PipelineAccessProvider')
  }
  return context
}
