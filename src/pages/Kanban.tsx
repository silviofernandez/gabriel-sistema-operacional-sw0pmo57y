import { useState, useMemo, useEffect } from 'react'
import { db } from '@/lib/mock-data'
import { KanbanCard } from '@/components/kanban/KanbanCard'
import { TaskDetailDialog } from '@/components/tasks/TaskDetailDialog'
import { NewTaskDialog } from '@/components/kanban/NewTaskDialog'
import { Button } from '@/components/ui/button'
import { Plus, Settings, GripVertical, Trash2, Filter, X } from 'lucide-react'
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
import { useToast } from '@/hooks/use-toast'
import { Task } from '@/types'
import { RoleGate } from '@/components/shared/RoleGate'
import { usePermissions } from '@/hooks/usePermissions'

export default function Kanban() {
  const { user, profileLevel } = useAuthStore()
  const { toast } = useToast()
  const { can } = usePermissions()

  const canCreateTask = can('tasks', 'create') || can('kanban', 'create')

  const initialStages = useMemo(() => {
    return db.stages.filter((s) => s.processId === 'proc1').sort((a, b) => a.order - b.order)
  }, [])

  const [stages, setStages] = useState(initialStages)

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

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId)
  }

  const handleDrop = (e: React.DragEvent, columnId: string) => {
    e.preventDefault()
    const taskId = e.dataTransfer.getData('taskId')
    if (!taskId) return
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, stageId: columnId } : t)))
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleCreateTask = (newTask: Task) => {
    const firstStageId = stages[0]?.id || ''
    const taskWithStage = { ...newTask, stageId: firstStageId }
    setTasks((prev) => [taskWithStage, ...prev])
    setIsNewTaskOpen(false)
    toast({
      title: 'Tarefa Criada',
      description: 'A nova tarefa foi adicionada com sucesso ao Kanban.',
    })
  }

  const resetFilters = () => {
    setFilterPriority('Todas')
    setFilterType('Todos')
  }

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] animate-fade-in-up w-full">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kanban Operacional</h1>
          <p className="text-muted-foreground mt-1">
            Acompanhe o Fluxo Padrão de cada contrato pelas etapas automáticas.
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

      <div className="flex gap-4 overflow-x-auto pb-4 flex-1 scrollbar-hide snap-x">
        {stages.map((column) => (
          <div
            key={column.id}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
            className="flex flex-col w-[320px] shrink-0 bg-muted/40 rounded-xl border border-border/80 p-3 snap-start h-full"
          >
            <div className="flex items-center justify-between mb-4 px-1 shrink-0">
              <h3 className="font-semibold text-sm truncate pr-2 text-foreground tracking-wide">
                {column.name}
              </h3>
              <span className="text-xs bg-background text-muted-foreground px-2 py-0.5 rounded font-medium shadow-sm border">
                {enrichedTasks.filter((t) => t.stageId === column.id).length}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-hide h-full min-h-[100px]">
              {enrichedTasks
                .filter((task) => task.stageId === column.id)
                .map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onClick={() => setSelectedTask(tasks.find((t) => t.id === task.id) || null)}
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
                  Arrastar para cá
                </div>
              )}
            </div>
          </div>
        ))}
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
