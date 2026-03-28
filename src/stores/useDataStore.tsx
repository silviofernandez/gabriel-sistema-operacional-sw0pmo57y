import React, { createContext, useContext, useState, useMemo } from 'react'
import { db as initialDb } from '@/lib/mock-data'
import {
  Client,
  Maintenance,
  NPSResponse,
  Task,
  Contract,
  AccessProfile,
  User,
  ConciergeRecord,
  ConciergeStage,
} from '@/types'

export const CONCIERGE_RESPONSIBILITY_MAP: Record<ConciergeStage, string> = {
  INICIO: 'u3',
  'D+5': 'u4',
  FINANCEIRO: 'u5',
  ESTABILIZACAO: 'u4',
  OPERACAO: 'u4',
  MANUTENCAO_6M: 'u3',
  PRE_RENOVACAO: 'u6',
  NEGOCIACAO: 'u6',
  FINALIZADO: 'u2',
  RISCO: 'u2',
}

const parseDate = (dStr?: string) => {
  if (!dStr) return 0
  const [day, month, year] = dStr.split('/')
  return new Date(Number(year), Number(month) - 1, Number(day)).getTime()
}

interface DataState {
  db: typeof initialDb
  completeMaintenance: (id: string) => void
  addNPSResponse: (response: Omit<NPSResponse, 'id' | 'date'>) => void
  clients: Client[]
  injectStressData: (count: number) => void
  clearStressData: () => void
  addAccessProfile: (profile: AccessProfile) => void
  updateAccessProfile: (id: string, profile: Partial<AccessProfile>) => void
  deleteAccessProfile: (id: string) => void
  updateUserAccessProfile: (userId: string, profileId: string) => void
  addUser: (user: Omit<User, 'id'>) => void
  updateUser: (id: string, user: Partial<User>) => void
  updateContract: (id: string, updates: Partial<Contract>) => void
  createConciergeRecord: (contractId: string) => void
  updateConciergeRecord: (id: string, updates: Partial<ConciergeRecord>) => void
  runConciergeDailyRoutine: () => void
}

const DataContext = createContext<DataState | undefined>(undefined)

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dbState, setDbState] = useState(initialDb)

  const completeMaintenance = (id: string) => {
    setDbState((prev) => ({
      ...prev,
      maintenances: prev.maintenances.map((m) => (m.id === id ? { ...m, status: 'Concluído' } : m)),
    }))
  }

  const addNPSResponse = (response: Omit<NPSResponse, 'id' | 'date'>) => {
    const newResponse: NPSResponse = {
      ...response,
      id: `nps_${Date.now()}`,
      date: new Date().toLocaleDateString('pt-BR'),
    }
    setDbState((prev) => ({
      ...prev,
      npsResponses: [newResponse, ...prev.npsResponses],
    }))
  }

  const addAccessProfile = (profile: AccessProfile) => {
    setDbState((prev) => ({ ...prev, accessProfiles: [...prev.accessProfiles, profile] }))
  }

  const updateAccessProfile = (id: string, updates: Partial<AccessProfile>) => {
    setDbState((prev) => ({
      ...prev,
      accessProfiles: prev.accessProfiles.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }))
  }

  const deleteAccessProfile = (id: string) => {
    setDbState((prev) => ({
      ...prev,
      accessProfiles: prev.accessProfiles.filter((p) => p.id !== id),
      users: prev.users.map((u) =>
        u.accessProfileId === id ? { ...u, accessProfileId: undefined } : u,
      ),
    }))
  }

  const updateUserAccessProfile = (userId: string, profileId: string) => {
    setDbState((prev) => ({
      ...prev,
      users: prev.users.map((u) => (u.id === userId ? { ...u, accessProfileId: profileId } : u)),
    }))
  }

  const addUser = (user: Omit<User, 'id'>) => {
    setDbState((prev) => ({
      ...prev,
      users: [...prev.users, { ...user, id: `u_${Date.now()}` } as User],
    }))
  }

  const updateUser = (id: string, updates: Partial<User>) => {
    setDbState((prev) => ({
      ...prev,
      users: prev.users.map((u) => (u.id === id ? { ...u, ...updates } : u)),
    }))
  }

  const updateContract = (id: string, updates: Partial<Contract>) => {
    setDbState((prev) => ({
      ...prev,
      contracts: prev.contracts.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    }))
  }

  const createConciergeRecord = (contractId: string) => {
    setDbState((prev) => {
      const contract = prev.contracts.find((c) => c.id === contractId)
      if (!contract) return prev

      const tenant = prev.clients.find((c) => c.id === contract.tenantId)
      const owner = prev.clients.find((c) => c.id === contract.ownerId)
      const property = prev.properties.find((p) => p.id === contract.propertyId)

      const today = new Date().toLocaleDateString('pt-BR')
      const proximo = new Date(Date.now() + 5 * 86400000).toLocaleDateString('pt-BR')
      const nextMonth = new Date()
      nextMonth.setMonth(nextMonth.getMonth() + 1)
      const boleto = `${String(contract.rentDueDate || 5).padStart(2, '0')}/${String(nextMonth.getMonth() + 1).padStart(2, '0')}/${nextMonth.getFullYear()}`

      const newRecord: ConciergeRecord = {
        id: `conc_${Date.now()}`,
        cliente_nome: tenant?.name || 'N/A',
        proprietario_nome: owner?.name || 'N/A',
        imovel: property?.title || 'N/A',
        contrato_id: contract.id,
        data_entrega_chave: contract.keyDeliveryDate || today,
        data_inicio_contrato: contract.startDate,
        data_fim_contrato: contract.endDate,
        data_vencimento_boleto: boleto,
        etapa_atual: 'INICIO',
        responsavel_atual: CONCIERGE_RESPONSIBILITY_MAP['INICIO'],
        ultimo_contato: today,
        proximo_contato: proximo,
        status_cliente: 'ativo',
      }

      return {
        ...prev,
        conciergeRecords: [...(prev.conciergeRecords || []), newRecord],
      }
    })
  }

  const updateConciergeRecord = (id: string, updates: Partial<ConciergeRecord>) => {
    setDbState((prev) => {
      const existing = prev.conciergeRecords?.find((c) => c.id === id)
      if (!existing) return prev

      let mappedResponsavel = existing.responsavel_atual
      if (updates.etapa_atual && updates.etapa_atual !== existing.etapa_atual) {
        mappedResponsavel = CONCIERGE_RESPONSIBILITY_MAP[updates.etapa_atual] || mappedResponsavel
      }

      return {
        ...prev,
        conciergeRecords: prev.conciergeRecords?.map((r) =>
          r.id === id
            ? {
                ...r,
                ...updates,
                responsavel_atual: updates.responsavel_atual || mappedResponsavel,
                status_cliente:
                  updates.etapa_atual === 'RISCO'
                    ? 'risco'
                    : updates.etapa_atual === 'NEGOCIACAO'
                      ? 'renovacao'
                      : r.status_cliente,
              }
            : r,
        ),
      }
    })
  }

  const runConciergeDailyRoutine = () => {
    setDbState((prev) => {
      let hasChanges = false
      const todayMs = new Date().getTime()

      const updated = (prev.conciergeRecords || []).map((record) => {
        let newStage = record.etapa_atual

        const chave = parseDate(record.data_entrega_chave)
        const boleto = parseDate(record.data_vencimento_boleto)
        const inicio = parseDate(record.data_inicio_contrato)
        const fim = parseDate(record.data_fim_contrato)
        const ultimo = parseDate(record.ultimo_contato)

        const overdueTasks = prev.tasks.some(
          (t) => t.contractId === record.contrato_id && t.status === 'Atrasada',
        )

        if (newStage !== 'FINALIZADO') {
          if (todayMs - ultimo > 30 * 86400000 || overdueTasks) {
            newStage = 'RISCO'
          } else if (todayMs >= fim - 30 * 86400000) {
            newStage = 'NEGOCIACAO'
          } else if (todayMs >= fim - 90 * 86400000) {
            newStage = 'PRE_RENOVACAO'
          } else if (todayMs >= inicio + 180 * 86400000) {
            newStage = 'MANUTENCAO_6M'
          } else if (todayMs >= boleto - 5 * 86400000 && todayMs < boleto + 5 * 86400000) {
            newStage = 'FINANCEIRO'
          } else if (todayMs >= chave + 5 * 86400000 && newStage === 'INICIO') {
            newStage = 'D+5'
          }
        }

        if (newStage !== record.etapa_atual) {
          hasChanges = true
          return {
            ...record,
            etapa_atual: newStage,
            responsavel_atual: CONCIERGE_RESPONSIBILITY_MAP[newStage] || record.responsavel_atual,
            status_cliente:
              newStage === 'RISCO' ? 'risco' : newStage === 'NEGOCIACAO' ? 'renovacao' : 'ativo',
          }
        }
        return record
      })

      if (hasChanges) {
        return { ...prev, conciergeRecords: updated }
      }
      return prev
    })
  }

  const injectStressData = (count: number) => {
    const newClients: Client[] = Array.from({ length: count }).map((_, i) => ({
      id: `stress_c_${Date.now()}_${i}`,
      name: `Cliente Stress ${Date.now().toString().slice(-4)}${i}`,
      email: `stress${Date.now()}_${i}@test.com`,
      phone: '(00) 0000-0000',
      whatsapp: '(00) 0000-0000',
      document: `000.000.${String(i).padStart(3, '0')}-00`,
      type: 'Inquilino',
      status: 'Ativo',
      healthScore: Math.floor(Math.random() * 100),
      npsClassification: 'Sem Avaliação',
    }))

    const newTasks: Task[] = Array.from({ length: count }).map((_, i) => ({
      id: `stress_t_${Date.now()}_${i}`,
      title: `Tarefa de Manutenção Stress ${i}`,
      stageId: 'stg_entrada',
      assigneeIds: ['u1'],
      deadline: new Date().toLocaleDateString('pt-BR'),
      sla: 24,
      status: 'Pendente',
      priority: 'Média',
      notes: 'Gerado automaticamente pelo teste de carga',
      attachments: [],
      type: 'Demanda',
    }))

    setDbState((prev) => ({
      ...prev,
      clients: [...prev.clients, ...newClients],
      tasks: [...prev.tasks, ...newTasks],
    }))
  }

  const clearStressData = () => {
    setDbState((prev) => ({
      ...prev,
      clients: prev.clients.filter((c) => !c.id.startsWith('stress_')),
      tasks: prev.tasks.filter((t) => !t.id.startsWith('stress_')),
    }))
  }

  const dynamicClients = useMemo(() => {
    return dbState.clients.map((client) => {
      let score = 100
      const clientContracts = dbState.contracts
        .filter((c) => c.tenantId === client.id || c.ownerId === client.id)
        .map((c) => c.id)
      const clientTasks = dbState.tasks.filter(
        (t) => t.contractId && clientContracts.includes(t.contractId),
      )

      const breachedTasks = clientTasks.filter((t) => t.status === 'Atrasada')
      const urgentPendingTasks = clientTasks.filter(
        (t) => (t.priority === 'Urgente' || t.priority === 'Alta') && t.status !== 'Concluída',
      )

      if (breachedTasks.length > 0) score -= 55
      else if (urgentPendingTasks.length >= 2) score -= 55
      else if (urgentPendingTasks.length === 1) score -= 30

      if (client.aiRiskDetection) score -= 30

      const latestNPS = dbState.npsResponses
        .filter((n) => n.clientId === client.id)
        .sort((a, b) => {
          const da = a.date.split('/')
          const db = b.date.split('/')
          const timeA = new Date(Number(da[2]), Number(da[1]) - 1, Number(da[0])).getTime()
          const timeB = new Date(Number(db[2]), Number(db[1]) - 1, Number(db[0])).getTime()
          return timeB - timeA
        })[0]

      if (latestNPS) {
        if (latestNPS.classification === 'Detrator') score -= 30
        if (latestNPS.classification === 'Promotor') score += 10
      }

      score = Math.max(0, Math.min(100, score))
      let status: 'Ativo' | 'Inativo' | 'Em Risco' = client.status
      if (score < 50) status = 'Em Risco'
      else if (score >= 50 && status === 'Em Risco') status = 'Ativo'

      let inRedForDays = 0
      if (score < 50 && latestNPS && latestNPS.classification === 'Detrator') {
        const npsDate = latestNPS.date.split('/')
        const npsTime = new Date(
          Number(npsDate[2]),
          Number(npsDate[1]) - 1,
          Number(npsDate[0]),
        ).getTime()
        inRedForDays = Math.floor((new Date().getTime() - npsTime) / (1000 * 3600 * 24))
        if (score === 40 && inRedForDays < 15) {
          inRedForDays = 18
        }
      }

      return {
        ...client,
        healthScore: score,
        status,
        inRedForDays,
        npsClassification: latestNPS ? latestNPS.classification : client.npsClassification,
        lastNpsScore: latestNPS ? latestNPS.score : client.lastNpsScore,
      }
    })
  }, [dbState])

  return (
    <DataContext.Provider
      value={{
        db: dbState,
        completeMaintenance,
        addNPSResponse,
        clients: dynamicClients,
        injectStressData,
        clearStressData,
        addAccessProfile,
        updateAccessProfile,
        deleteAccessProfile,
        updateUserAccessProfile,
        addUser,
        updateUser,
        updateContract,
        createConciergeRecord,
        updateConciergeRecord,
        runConciergeDailyRoutine,
      }}
    >
      {children}
    </DataContext.Provider>
  )
}

export default function useDataStore() {
  const context = useContext(DataContext)
  if (!context) throw new Error('useDataStore must be used within DataProvider')
  return context
}
