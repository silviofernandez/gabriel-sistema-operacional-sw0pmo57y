import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, AlertCircle, FileText, PlayCircle, AlertTriangle, Bot } from 'lucide-react'
import useAuthStore from '@/stores/useAuthStore'
import { db } from '@/lib/mock-data'
import { Task } from '@/types'
import { TaskDetailDialog } from '@/components/tasks/TaskDetailDialog'
import { cn } from '@/lib/utils'

export default function MeuDia() {
  const { user } = useAuthStore()
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  const myTasks = useMemo(
    () => db.tasks.filter((t) => (t.assigneeIds || []).includes(user?.id || '')),
    [user?.id],
  )

  const todayStr = new Date().toLocaleDateString('pt-BR')
  const parseDate = (dStr?: string) => {
    if (!dStr) return 0
    const [datePart] = dStr.split(' ') // Safely handle formatting like "12/10/2023 10:00"
    const parts = (datePart || '').split('/')
    if (parts.length === 3) {
      return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0])).getTime()
    }
    return 0
  }
  const todayTime = parseDate(todayStr)

  const overdueTasks = myTasks.filter(
    (t) =>
      t.status !== 'Concluída' && (t.status === 'Atrasada' || parseDate(t.deadline) < todayTime),
  )
  const todayTasks = myTasks.filter(
    (t) =>
      t.status !== 'Concluída' &&
      (t.deadline || '').startsWith(todayStr) &&
      !overdueTasks.includes(t),
  )
  const inProgressTasks = myTasks.filter(
    (t) => t.status === 'Em Andamento' && !overdueTasks.includes(t) && !todayTasks.includes(t),
  )

  const TaskCard = ({
    task,
    variant = 'default',
  }: {
    task: Task
    variant?: 'overdue' | 'today' | 'progress' | 'default'
  }) => {
    const property = db.properties.find((p) => p.id === task.propertyId)
    const checklists = db.checklists.filter((c) => c.taskId === task.id)
    const checkCount = checklists.length
    const checkCompleted = checklists.filter((c) => c.isCompleted).length

    return (
      <Card
        onClick={() => setSelectedTask(task)}
        className={cn(
          'flex flex-col sm:flex-row sm:items-center p-4 hover:shadow-md transition-all cursor-pointer group border-l-4 bg-card hover:bg-muted/30 border-y border-r gap-4 relative overflow-hidden',
          variant === 'overdue'
            ? 'border-l-destructive border-destructive/20'
            : variant === 'progress'
              ? 'border-l-primary border-primary/20'
              : 'border-l-warning border-border',
          task.aiRiskFlag && 'bg-destructive/5 hover:bg-destructive/10 border-destructive/30',
        )}
      >
        <div className="flex items-center flex-1 min-w-0 gap-4">
          <div
            className={cn(
              'shrink-0 transition-colors',
              variant === 'overdue'
                ? 'text-destructive'
                : variant === 'progress'
                  ? 'text-primary'
                  : 'text-warning',
            )}
          >
            {variant === 'overdue' ? (
              <AlertCircle className="h-6 w-6" />
            ) : variant === 'progress' ? (
              <PlayCircle className="h-6 w-6" />
            ) : (
              <Clock className="h-6 w-6" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base truncate text-foreground flex items-center gap-2">
              {task.title}
              {task.aiRiskFlag && (
                <span className="flex items-center gap-1 text-[10px] bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">
                  <AlertTriangle className="w-3 h-3" /> Risco
                </span>
              )}
            </h3>
            <p className="text-sm text-muted-foreground truncate">
              {property?.title || 'Sem imóvel vinculado'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 shrink-0 mt-2 sm:mt-0 ml-10 sm:ml-0">
          {checkCount > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
              <FileText className="w-3.5 h-3.5" />
              <span>
                {checkCompleted}/{checkCount} checklist
              </span>
            </div>
          )}

          <div className="flex items-center gap-2">
            {task.aiUrgency && task.aiUrgency !== 'Normal' && (
              <Badge
                variant={task.aiUrgency === 'Crítica' ? 'destructive' : 'warning'}
                className="font-mono text-[10px] uppercase gap-1"
              >
                <Bot className="w-3 h-3" /> {task.aiUrgency}
              </Badge>
            )}
            <Badge variant="outline" className="font-mono text-xs bg-background">
              {task.deadline || 'S/ Prazo'}
            </Badge>
            <Badge
              variant={
                task.priority === 'Urgente' || task.priority === 'Alta'
                  ? 'destructive'
                  : task.priority === 'Média'
                    ? 'warning'
                    : 'secondary'
              }
            >
              {task.priority}
            </Badge>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8 animate-fade-in-up pt-4 pb-12 w-full">
      <div className="flex items-center justify-between border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 text-foreground">Meu Dia</h1>
          <p className="text-muted-foreground">
            Olá, {user?.name?.split(' ')[0] || 'Usuário'}. Aqui está o seu foco operacional para
            hoje.
          </p>
        </div>
        <div className="hidden md:flex">
          <img
            src="https://img.usecurling.com/i?q=target&color=multicolor&shape=lineal-color"
            alt="Target"
            className="h-16 opacity-80 mix-blend-multiply"
          />
        </div>
      </div>

      <div className="space-y-8">
        {overdueTasks.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" /> Tarefas em Atraso
              <Badge variant="destructive" className="ml-2 rounded-full">
                {overdueTasks.length}
              </Badge>
            </h2>
            <div className="grid gap-3">
              {overdueTasks.map((task) => (
                <TaskCard key={task.id} task={task} variant="overdue" />
              ))}
            </div>
          </section>
        )}

        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-foreground">
            <Clock className="w-5 h-5 text-warning" /> Tarefas do Dia ({todayStr})
            <Badge variant="secondary" className="ml-2 rounded-full bg-muted text-muted-foreground">
              {todayTasks.length}
            </Badge>
          </h2>
          {todayTasks.length > 0 ? (
            <div className="grid gap-3">
              {todayTasks.map((task) => (
                <TaskCard key={task.id} task={task} variant="today" />
              ))}
            </div>
          ) : (
            <div className="text-center p-8 border border-dashed rounded-xl bg-card text-muted-foreground shadow-sm">
              Nenhuma tarefa urgente para hoje. Bom trabalho!
            </div>
          )}
        </section>

        {inProgressTasks.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-primary">
              <PlayCircle className="w-5 h-5" /> Tarefas em Andamento
              <Badge variant="default" className="ml-2 rounded-full">
                {inProgressTasks.length}
              </Badge>
            </h2>
            <div className="grid gap-3">
              {inProgressTasks.map((task) => (
                <TaskCard key={task.id} task={task} variant="progress" />
              ))}
            </div>
          </section>
        )}
      </div>

      <TaskDetailDialog
        task={selectedTask}
        open={!!selectedTask}
        onOpenChange={(open) => !open && setSelectedTask(null)}
      />
    </div>
  )
}
