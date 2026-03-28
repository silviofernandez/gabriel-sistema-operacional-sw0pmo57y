import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AlignLeft, History, Clock, Bot, AlertTriangle, MessageSquare } from 'lucide-react'
import { Task } from '@/types'
import { db } from '@/lib/mock-data'
import { useToast } from '@/hooks/use-toast'
import { TaskExecutionTab } from './TaskExecutionTab'
import { TaskHistoryTab } from './TaskHistoryTab'
import { AIHandoverDialog } from '@/components/ai/AIHandoverDialog'
import { TaskManagementComments } from './TaskManagementComments'
import { usePermissions } from '@/hooks/usePermissions'

interface TaskDetailDialogProps {
  task: Task | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TaskDetailDialog({ task, open, onOpenChange }: TaskDetailDialogProps) {
  const [activeTab, setActiveTab] = useState('details')
  const [localChecklists, setLocalChecklists] = useState<any[]>([])
  const [localStatus, setLocalStatus] = useState<Task['status']>('Pendente')
  const [showHandover, setShowHandover] = useState(false)
  const { toast } = useToast()
  const { can } = usePermissions()

  const canEditTask = can('tasks', 'edit') || can('kanban', 'edit')

  useEffect(() => {
    if (task) {
      setLocalChecklists(db.checklists.filter((c) => c.taskId === task.id))
      setLocalStatus(task.status)
      setActiveTab('details')
    }
  }, [task])

  if (!task) return null

  const property = db.properties.find((p) => p.id === task.propertyId)
  const assignees = task.assigneeIds.map((id) => db.users.find((u) => u.id === id)).filter(Boolean)

  const toggleChecklist = (id: string) => {
    if (!canEditTask) return
    setLocalChecklists((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isCompleted: !c.isCompleted } : c)),
    )
  }

  const handleStatusChange = (value: Task['status']) => {
    if (!canEditTask) return
    if (value === 'Concluída') {
      const pendingMandatory = localChecklists.some((c) => c.isMandatory && !c.isCompleted)
      if (pendingMandatory) {
        toast({
          title: 'Conclusão Bloqueada',
          description: 'A tarefa contém itens obrigatórios no checklist pendentes.',
          variant: 'destructive',
        })
        return
      }
    }
    setLocalStatus(value)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl p-0 overflow-hidden bg-background gap-0 flex flex-col h-[85vh]">
          <DialogHeader className="p-6 pb-4 border-b bg-muted/20 shrink-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <DialogTitle className="text-xl font-semibold leading-tight text-foreground flex items-start gap-2">
                  {task.title}
                </DialogTitle>
                <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-muted-foreground">
                  <Badge variant="outline" className="font-normal bg-card shrink-0">
                    {property?.title || 'Sem Imóvel'}
                  </Badge>
                  <span className="hidden sm:inline">•</span>
                  <span className="flex items-center gap-1 font-mono text-xs shrink-0">
                    <Clock className="w-3.5 h-3.5" /> Prazo: {task.deadline}
                  </span>

                  {task.aiUrgency && task.aiUrgency !== 'Normal' && (
                    <Badge
                      variant={task.aiUrgency === 'Crítica' ? 'destructive' : 'warning'}
                      className="font-mono text-[10px] uppercase ml-auto sm:ml-0"
                    >
                      IA Urgência: {task.aiUrgency}
                    </Badge>
                  )}
                  {task.aiRiskFlag && (
                    <Badge
                      variant="destructive"
                      className="font-mono text-[10px] bg-destructive/10 text-destructive border-destructive/20 ml-auto sm:ml-0"
                    >
                      <AlertTriangle className="w-3 h-3 mr-1" /> Risco Churn
                    </Badge>
                  )}
                </div>
              </div>
              <div className="shrink-0 flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowHandover(true)}
                  className="hidden sm:flex bg-indigo-500/10 text-indigo-500 border-indigo-500/20 hover:bg-indigo-500/20 h-9"
                  title="Gerar repasse formatado para o Jurídico/Manutenção"
                >
                  <Bot className="w-4 h-4 mr-2" />
                  Repasse IA
                </Button>
                <div className="w-36 sm:w-40">
                  <Select
                    value={localStatus}
                    onValueChange={handleStatusChange}
                    disabled={!canEditTask}
                  >
                    <SelectTrigger
                      className={`h-9 font-medium bg-card ${localStatus === 'Concluída' ? 'text-success border-success bg-success/5' : localStatus === 'Atrasada' ? 'text-destructive border-destructive bg-destructive/5' : ''}`}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pendente">Pendente</SelectItem>
                      <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                      <SelectItem value="Concluída" className="text-success font-semibold">
                        Concluída
                      </SelectItem>
                      <SelectItem value="Atrasada">Atrasada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </DialogHeader>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <div className="px-6 border-b shrink-0 bg-card overflow-x-auto scrollbar-hide">
              <TabsList className="bg-transparent h-12 w-max min-w-full justify-start gap-4 sm:gap-6">
                <TabsTrigger
                  value="details"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 text-muted-foreground data-[state=active]:text-foreground"
                >
                  <AlignLeft className="w-4 h-4 mr-2" /> Execução & IA
                </TabsTrigger>
                <TabsTrigger
                  value="comments"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 text-muted-foreground data-[state=active]:text-foreground"
                >
                  <MessageSquare className="w-4 h-4 mr-2" /> Comentários
                </TabsTrigger>
                <TabsTrigger
                  value="history"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 text-muted-foreground data-[state=active]:text-foreground"
                >
                  <History className="w-4 h-4 mr-2" /> Histórico (Log)
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="details" className="flex-1 overflow-y-auto m-0">
              <TaskExecutionTab
                task={task}
                assignees={assignees}
                localChecklists={localChecklists}
                toggleChecklist={toggleChecklist}
              />
            </TabsContent>

            <TabsContent value="comments" className="flex-1 overflow-y-auto m-0 p-6 bg-background">
              <TaskManagementComments task={task} />
            </TabsContent>

            <TabsContent value="history" className="flex-1 overflow-y-auto m-0">
              <TaskHistoryTab task={task} />
            </TabsContent>
          </Tabs>

          <div className="p-4 border-t bg-card shrink-0 flex items-center justify-between shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHandover(true)}
              className="sm:hidden text-indigo-500"
            >
              <Bot className="w-4 h-4 mr-2" />
              Repasse IA
            </Button>
            <div className="flex justify-end gap-3 w-full sm:w-auto">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              {canEditTask && (
                <Button
                  onClick={() => {
                    toast({
                      title: 'Ação Registrada',
                      description: 'As alterações na tarefa foram salvas.',
                    })
                    onOpenChange(false)
                  }}
                >
                  Salvar e Atualizar
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AIHandoverDialog task={task} open={showHandover} onOpenChange={setShowHandover} />
    </>
  )
}
