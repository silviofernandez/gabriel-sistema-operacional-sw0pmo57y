import { useState, useMemo, useEffect } from 'react'
import { db } from '@/lib/mock-data'
import { KanbanCard } from '@/components/kanban/KanbanCard'
import { TaskDetailDialog } from '@/components/tasks/TaskDetailDialog'
import { NewTaskDialog } from '@/components/kanban/NewTaskDialog'
import { Button } from '@/components/ui/button'
import {
  Plus,
  Settings,
  GripVertical,
  Trash2,
  Filter,
  X,
  Lock,
  Eye,
  CheckCircle2,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import useAuthStore from '@/stores/useAuthStore'
import usePipelineAccess from '@/stores/usePipelineAccess'
import { useToast } from '@/hooks/use-toast'
import { Task } from '@/types'
import { RoleGate } from '@/components/shared/RoleGate'
import { usePermissions } from '@/hooks/usePermissions'
import { AdjacentAccessBanner } from '@/components/pipeline/AdjacentAccessBanner'
import { Badge } from '@/components/ui/badge'

// Mapeamento das colunas do Kanban com as 12 etapas da esteira
const STAGE_ID_PIPELINE_MAP: Record<string, string> = {
  stg_entrada: '4', // 4. Vistoria de Entrada
  stg_assinaturas: '5', // 5. Assinatura & Ativação
  stg_chaves: '6', // 6. Entrega de Chaves
  stg_pos_mudanca: '7', // 7. Régua do Inquilino
  stg_pagamento: '9', // 9. Financeiro & Repasses
  stg_preventiva: '8', // 8. Manutenções & Reparos
  stg_renovacao: '10', // 10. Renovações
}

export default function Kanban() {
  const { user, profileLevel } = useAuthStore()
  const { toast } = useToast()
  const { can } = usePermissions()
  const {
    stages: pipelineStages,
    canOperateStage,
    canReadAdjacentStage,
    getStageAccessType,
    logAuditAction,
    openRestrictedModal,
  } = usePipelineAccess()

  const canCreateTask = can('tasks', 'create') || can('kanban', 'create')

  const initialStages = useMemo(() => {
    return db.stages.filter((s) => s.processId === 'proc1').sort((a, b) => a.order - b.order)
  }, [])

  const [stages, setStages] = useState(initialStages)
  const [activeAdjacentAlertStage, setActiveAdjacentAlertStage] = useState<{
    id: string
    name: string
  } | null>(null)

  const initialTasks = useMemo(() => {
    if (!user) return []
    if (profileLevel === 'Colaborador') {
      return db.tasks.filter((t) => (t.assigneeIds || []).includes(user.id))
    }
    return db.tasks
  }, [profileLevel, user?.id])

  const [tasks, setTasks] = useState(initialTasks)

  // Sincroniza a lista local de tasks se houver alteração global na base
  useEffect(() => {
    setTasks(initialTasks)
  }, [initialTasks])

  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  const [filterPriority, setFilterPriority] = useState<string>('Todas')
  const [filterType, setFilterType] = useState<string>('Todos')

  const enrichedTasks = useMemo(() => {
    return tasks
      .filter((t) => {
        if (filterPriority !== 'Todas' && t.priority !== filterPriority) return false
        if (filterType !== 'Todos' && t.type !== filterType) return false
        return true
      })
      .map((task) => {
        const property = db.properties.find((p) => p.id === task.propertyId)
        const assignees = (task.assigneeIds || [])
          .map((id) => db.users.find((u) => u.id === id)?.avatar)
          .filter(Boolean) as string[]

        return {
          ...task,
          propertyTitle: property?.title || 'Sem Imóvel Vinculado',
          assigneesAvatars: assignees,
          image: property?.image || 'https://img.usecurling.com/p/200/120?q=building',
        }
      })
  }, [tasks, filterPriority, filterType])

  const handleDragStart = (e: React.DragEvent, taskId: string, originColumnId: string) => {
    const pipelineEtapaId = STAGE_ID_PIPELINE_MAP[originColumnId] || '1'
    if (!canOperateStage(pipelineEtapaId)) {
      e.preventDefault()
      const pipeStage = pipelineStages.find((s) => s.id === pipelineEtapaId)
      if (pipeStage) openRestrictedModal(pipeStage)
      return
    }
    e.dataTransfer.setData('taskId', taskId)
    e.dataTransfer.setData('originColumnId', originColumnId)
  }

  const handleDrop = (e: React.DragEvent, columnId: string) => {
    e.preventDefault()
    const taskId = e.dataTransfer.getData('taskId')
    const originColumnId = e.dataTransfer.getData('originColumnId')
    if (!taskId) return

    const targetEtapaId = STAGE_ID_PIPELINE_MAP[columnId] || '1'
    if (!canOperateStage(targetEtapaId)) {
      const pipeStage = pipelineStages.find((s) => s.id === targetEtapaId)
      if (pipeStage) openRestrictedModal(pipeStage)
      // Grava tentativa negada no log
      logAuditAction({
        acao: 'tentou_acesso_negado',
        etapaId: targetEtapaId,
        contratoId: tasks.find((t) => t.id === taskId)?.contractId,
        motivo: 'Tentativa de mover card para etapa sem permissão de operação',
      })
      return
    }

    // Sucesso: registrar avanço de etapa no log de auditoria
    const movedTask = tasks.find((t) => t.id === taskId)
    logAuditAction({
      acao: 'avancou_etapa',
      etapaId: targetEtapaId,
      contratoId: movedTask?.contractId,
      dadosAntes: { stageId: originColumnId },
      dadosDepois: { stageId: columnId },
      motivo: `Card "${movedTask?.title}" movido para nova etapa`,
    })

    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, stageId: columnId } : t)))
    toast({
      title: 'Etapa Atualizada',
      description: 'O card foi avançado e a ação foi registrada na trilha de auditoria.',
    })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleCreateTask = (newTask: Task) => {
    const firstStageId = stages[0]?.id || ''
    const taskWithStage = { ...newTask, stageId: firstStageId }

    // Registrar ação no log de auditoria
    logAuditAction({
      acao: 'criou_tarefa',
      etapaId: STAGE_ID_PIPELINE_MAP[firstStageId] || '4',
      contratoId: newTask.contractId,
      motivo: `Criação da tarefa: ${newTask.title}`,
      dadosDepois: { title: newTask.title, priority: newTask.priority },
    })

    setTasks((prev) => [taskWithStage, ...prev])
    setIsNewTaskOpen(false)
    toast({
      title: 'Tarefa Criada',
      description: 'A nova tarefa foi adicionada com sucesso ao Kanban.',
    })
  }

  // Ao clicar em uma coluna/card para inspecionar
  const handleInspectStage = (columnId: string, columnName: string) => {
    const pipeId = STAGE_ID_PIPELINE_MAP[columnId] || '1'
    const accessType = getStageAccessType(pipeId)
    const pipeStage = pipelineStages.find((s) => s.id === pipeId)

    if (accessType === 'bloqueado') {
      if (pipeStage) openRestrictedModal(pipeStage)
      logAuditAction({
        acao: 'tentou_acesso_negado',
        etapaId: pipeId,
        motivo: `Tentativa de acesso à coluna bloqueada "${columnName}"`,
      })
    } else if (accessType === 'leitura_adjacente') {
      setActiveAdjacentAlertStage({ id: pipeId, name: columnName })
      logAuditAction({
        acao: 'visualizou_adjacente',
        etapaId: pipeId,
        motivo: `Colaborador abriu para leitura adjacente a coluna "${columnName}"`,
      })
    } else {
      setActiveAdjacentAlertStage(null)
      logAuditAction({
        acao: 'visualizou',
        etapaId: pipeId,
        motivo: `Visualização normal da etapa atribuída "${columnName}"`,
      })
    }
  }

  const resetFilters = () => {
    setFilterPriority('Todas')
    setFilterType('Todos')
  }

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] animate-fade-in-up w-full">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Kanban Operacional</h1>
            <Badge variant="outline" className="text-xs bg-muted font-normal">
              Controle por Etapa Ativo
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            Acompanhe o Fluxo Padrão de cada contrato pelas etapas automáticas com permissões
            granulares.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <RoleGate allowedLevels={['Diretor']}>
            <Button variant="outline" onClick={() => setIsConfigOpen(true)}>
              <Settings className="mr-2 h-4 w-4" /> Configurar Etapas
            </Button>
          </RoleGate>
          {canCreateTask && (
            <Button onClick={() => setIsNewTaskOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Nova Tarefa
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4 bg-muted/30 p-2 rounded-lg border shadow-sm w-max shrink-0 overflow-x-auto max-w-full">
        <div className="flex items-center gap-2 px-2 text-sm font-medium text-muted-foreground border-r border-border/50 pr-4">
          <Filter className="w-4 h-4" /> Filtros
        </div>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-40 h-8 text-xs border-transparent bg-transparent hover:bg-muted/50 shadow-none font-medium">
            <SelectValue placeholder="Prioridade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todas">Qualquer Prioridade</SelectItem>
            <SelectItem value="Baixa">Baixa</SelectItem>
            <SelectItem value="Média">Média</SelectItem>
            <SelectItem value="Alta">Alta</SelectItem>
            <SelectItem value="Crítica">Crítica</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-44 h-8 text-xs border-transparent bg-transparent hover:bg-muted/50 shadow-none font-medium">
            <SelectValue placeholder="Tipo de Tarefa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Qualquer Tipo</SelectItem>
            <SelectItem value="Operacional">Operacional</SelectItem>
            <SelectItem value="Concierge">Concierge</SelectItem>
            <SelectItem value="Demanda">Demanda</SelectItem>
            <SelectItem value="Manutenção">Manutenção</SelectItem>
            <SelectItem value="Vistoria">Vistoria</SelectItem>
            <SelectItem value="Administrativo">Administrativo</SelectItem>
          </SelectContent>
        </Select>
        {(filterPriority !== 'Todas' || filterType !== 'Todos') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="h-8 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="w-3 h-3 mr-1" /> Limpar
          </Button>
        )}
      </div>

      {/* Banner de aviso se o colaborador estiver com etapa adjacente selecionada */}
      {activeAdjacentAlertStage && (
        <AdjacentAccessBanner
          stageName={activeAdjacentAlertStage.name}
          stageNumber={STAGE_ID_PIPELINE_MAP[activeAdjacentAlertStage.id]}
        />
      )}

      <div className="flex gap-4 overflow-x-auto pb-4 flex-1 scrollbar-hide snap-x">
        {stages.map((column) => {
          const pipeId = STAGE_ID_PIPELINE_MAP[column.id] || '1'
          const accessType = getStageAccessType(pipeId)
          const isBlocked = accessType === 'bloqueado'
          const isAdjacent = accessType === 'leitura_adjacente'
          const pipeStageObj = pipelineStages.find((s) => s.id === pipeId)

          return (
            <div
              key={column.id}
              onClick={() => handleInspectStage(column.id, column.name)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
              className={`flex flex-col w-[320px] shrink-0 rounded-xl border p-3 snap-start h-full transition-all ${
                isBlocked
                  ? 'bg-muted/15 border-dashed border-border/60 opacity-60 hover:opacity-80 cursor-not-allowed'
                  : isAdjacent
                    ? 'bg-amber-500/5 border-amber-500/30'
                    : 'bg-muted/40 border-border/80'
              }`}
            >
              <div className="flex items-center justify-between mb-3 px-1 shrink-0">
                <div className="flex items-center gap-1.5 min-w-0 pr-2">
                  {isBlocked ? (
                    <Lock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  ) : isAdjacent ? (
                    <Eye className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  )}
                  <h3 className="font-semibold text-sm truncate text-foreground tracking-wide">
                    {column.name}
                  </h3>
                </div>
                <div className="flex items-center gap-1">
                  {isBlocked ? (
                    <Badge
                      variant="outline"
                      className="text-[10px] text-muted-foreground bg-background"
                    >
                      Restrito 🔒
                    </Badge>
                  ) : isAdjacent ? (
                    <Badge
                      variant="outline"
                      className="text-[10px] text-amber-700 bg-amber-500/10 border-amber-500/30"
                    >
                      Leitura
                    </Badge>
                  ) : (
                    <span className="text-xs bg-background text-muted-foreground px-2 py-0.5 rounded font-medium shadow-sm border">
                      {enrichedTasks.filter((t) => t.stageId === column.id).length}
                    </span>
                  )}
                </div>
              </div>

              {isBlocked ? (
                <div className="flex-1 flex flex-col items-center justify-center p-4 text-center border border-dashed rounded-lg bg-background/40">
                  <Lock className="w-8 h-8 text-muted-foreground/40 mb-2" />
                  <p className="text-xs font-medium text-foreground mb-1">Acesso Restrito</p>
                  <p className="text-[11px] text-muted-foreground mb-3">
                    Você não atua nesta etapa da esteira.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (pipeStageObj) openRestrictedModal(pipeStageObj)
                    }}
                  >
                    Solicitar Acesso
                  </Button>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto scrollbar-hide h-full min-h-[100px]">
                  {enrichedTasks
                    .filter((task) => task.stageId === column.id)
                    .map((task) => (
                      <div
                        key={task.id}
                        draggable={!isAdjacent}
                        onDragStart={(e) => handleDragStart(e, task.id, column.id)}
                        onClick={() => setSelectedTask(tasks.find((t) => t.id === task.id) || null)}
                        className={isAdjacent ? 'cursor-pointer pointer-events-auto' : ''}
                      >
                        <KanbanCard
                          task={{
                            id: task.id,
                            title: task.title,
                            property: task.propertyTitle,
                            priority: task.priority,
                            assignees: task.assigneesAvatars,
                            image: task.image,
                            deadline: task.deadline,
                            delayStatus: task.delayStatus,
                            autoGenerated: task.autoGenerated,
                          }}
                        />
                      </div>
                    ))}
                  {enrichedTasks.filter((t) => t.stageId === column.id).length === 0 && (
                    <div className="h-24 border border-dashed border-border/60 bg-background/50 rounded-xl flex items-center justify-center text-muted-foreground text-xs font-medium">
                      {isAdjacent ? 'Sem tarefas ativas' : 'Arrastar para cá'}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <TaskDetailDialog
        task={selectedTask}
        open={!!selectedTask}
        onOpenChange={(open) => !open && setSelectedTask(null)}
      />

      <NewTaskDialog
        open={isNewTaskOpen}
        onOpenChange={setIsNewTaskOpen}
        onSave={handleCreateTask}
      />

      <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Configurar Etapas do Kanban</DialogTitle>
            <DialogDescription>
              Adicione, edite ou remova colunas do seu processo operacional (Fluxo Padrão).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4 max-h-[60vh] overflow-y-auto pr-1">
            {stages.map((stage, idx) => (
              <div
                key={stage.id}
                className="flex items-center gap-3 bg-muted/30 p-2 rounded-md border group"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab opacity-50 group-hover:opacity-100" />
                <Input
                  value={stage.name}
                  onChange={(e) => {
                    const newStages = [...stages]
                    newStages[idx].name = e.target.value
                    setStages(newStages)
                  }}
                  className="h-9 font-medium bg-background"
                />
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              className="w-full mt-4 border-dashed bg-muted/10"
              onClick={() =>
                setStages([
                  ...stages,
                  {
                    id: `stg_new_${Date.now()}`,
                    name: 'Nova Etapa',
                    processId: 'proc1',
                    order: stages.length + 1,
                  },
                ])
              }
            >
              <Plus className="h-4 w-4 mr-2" /> Adicionar Etapa
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
