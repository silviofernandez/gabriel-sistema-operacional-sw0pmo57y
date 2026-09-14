import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Clock,
  AlertCircle,
  FileText,
  PlayCircle,
  AlertTriangle,
  Bot,
  Award,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react'
import useAuthStore from '@/stores/useAuthStore'
import usePipelineAccess from '@/stores/usePipelineAccess'
import { db } from '@/lib/mock-data'
import { Task } from '@/types'
import { TaskDetailDialog } from '@/components/tasks/TaskDetailDialog'
import { cn } from '@/lib/utils'

export default function MeuDia() {
  const { user } = useAuthStore()
  const { metrics, myActiveCoverage, temporaryStageIds, stages, tarefas, updateTarefaStatus } =
    usePipelineAccess()
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [selectedOrdem, setSelectedOrdem] = useState<
    import('@/types/pipeline').TarefaOrdemItem | null
  >(null)

  // Métricas do usuário logado
  const myMetric = useMemo(() => {
    return (
      metrics.find((m) => m.colaborador_id === user?.id) || {
        score_total: 87,
        classificacao: 'Bom',
        score_sla: 91,
        tarefas_reabertas: 1,
        tarefas_total: 38,
        acessos_adjacentes: 2,
      }
    )
  }, [metrics, user?.id])

  const coverageStageNames = useMemo(() => {
    return stages
      .filter((s) => temporaryStageIds.includes(s.id))
      .map((s) => s.shortName)
      .join(', ')
  }, [stages, temporaryStageIds])

  // Tarefas da coleção tarefas_ordens (atribuídas pelo Master) exclusivamente para o colaborador logado
  const myOrdens = useMemo(
    () => tarefas.filter((t) => t.responsavel_id === user?.id),
    [tarefas, user?.id],
  )

  // Tarefas locais mockadas (fallback sincronizado com o ID do usuário logado)
  const myMockTasks = useMemo(
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

  // Separação das ordens do backend
  const overdueOrdens = myOrdens.filter(
    (t) =>
      t.status !== 'Concluída' &&
      (t.status === 'Atrasada' || (t.prazo && parseDate(t.prazo) < todayTime)),
  )
  const todayOrdens = myOrdens.filter(
    (t) =>
      t.status !== 'Concluída' &&
      !overdueOrdens.includes(t) &&
      ((t.prazo || '').includes(todayStr) ||
        t.status === 'Em Andamento' ||
        t.status === 'Pendente'),
  )
  const completedOrdens = myOrdens.filter((t) => t.status === 'Concluída')

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
                task.priority === 'Crítica' || task.priority === 'Alta'
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

      {/* Card: Seu Desempenho Este Mês */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="col-span-1 md:col-span-2 shadow-sm border bg-gradient-to-r from-card to-muted/30">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Award className="w-4 h-4 text-primary" /> Seu Desempenho Este Mês
              </CardTitle>
              <Badge
                className={
                  myMetric.score_total >= 90
                    ? 'bg-emerald-600 text-white'
                    : myMetric.score_total >= 70
                      ? 'bg-amber-500 text-white'
                      : 'bg-orange-500 text-white'
                }
              >
                Score: {myMetric.score_total}/100 {myMetric.classificacao}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3 pt-1 text-center">
              <div className="p-2 rounded-lg bg-background border">
                <span className="text-xs text-muted-foreground block">SLA no Prazo</span>
                <span className="text-xl font-bold font-mono text-emerald-600">
                  {myMetric.score_sla}%
                </span>
              </div>
              <div className="p-2 rounded-lg bg-background border">
                <span className="text-xs text-muted-foreground block">Retrabalho</span>
                <span className="text-xl font-bold font-mono text-foreground">
                  {Math.round((myMetric.tarefas_reabertas / (myMetric.tarefas_total || 1)) * 100)}%
                </span>
              </div>
              <div className="p-2 rounded-lg bg-background border">
                <span className="text-xs text-muted-foreground block">Tarefas</span>
                <span className="text-xl font-bold font-mono text-foreground">
                  {myMetric.tarefas_total}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3 text-xs text-emerald-600 font-medium">
              <TrendingUp className="w-4 h-4" /> Evolução: ↑ +5 pontos vs mês anterior
            </div>
          </CardContent>
        </Card>

        {/* Card de Cobertura Ativa se houver */}
        {myActiveCoverage ? (
          <Card className="shadow-sm border border-amber-500/30 bg-amber-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-amber-600" /> Cobertura Ativa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-xs">
              <p className="font-semibold text-foreground">
                Você está cobrindo: {coverageStageNames || 'Vistoria de Entrada'}
              </p>
              <p className="text-muted-foreground">
                Titular: {myActiveCoverage.colaborador_ausente_nome}
              </p>
              <Badge
                variant="outline"
                className="bg-background text-[10px] mt-1 border-amber-500/30"
              >
                Até {new Date(myActiveCoverage.data_fim_prevista).toLocaleDateString('pt-BR')}
              </Badge>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-sm border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Escopo de Atuação
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-1">
              <p className="text-foreground font-medium">Etapas da Esteira Atribuídas</p>
              <p>Operando em conformidade com as regras de acesso da Gabriel.</p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="space-y-8">
        {/* Bloco 1: Ordens e Tarefas atribuídas pelo Master diretamente a este colaborador */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-foreground">
              <Clock className="w-5 h-5 text-primary" /> Minhas Tarefas de Hoje ({user?.name})
              <Badge
                variant="outline"
                className="ml-1 bg-primary/10 text-primary border-primary/20"
              >
                {myOrdens.length} atribuída{myOrdens.length > 1 ? 's' : ''} pelo Master
              </Badge>
            </h2>
            <span className="text-xs text-muted-foreground">
              Apenas as tarefas atribuídas a você são visíveis
            </span>
          </div>

          {myOrdens.length > 0 ? (
            <div className="grid gap-3">
              {myOrdens.map((ordem) => {
                const stageObj = stages.find((s) => s.id === ordem.etapa_id)
                const isConcluida = ordem.status === 'Concluída'
                const isAtrasada = ordem.status === 'Atrasada'

                return (
                  <Card
                    key={ordem.id}
                    className={cn(
                      'p-4 border-l-4 transition-all hover:shadow-sm bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-4',
                      isConcluida
                        ? 'border-l-emerald-500 bg-muted/10 opacity-80'
                        : isAtrasada
                          ? 'border-l-destructive bg-destructive/5'
                          : 'border-l-primary',
                    )}
                  >
                    <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() =>
                          updateTarefaStatus(
                            ordem.id,
                            isConcluida ? 'Em Andamento' : 'Concluída',
                            isConcluida
                              ? `Colaborador ${user?.name} reabriu a tarefa`
                              : `Colaborador ${user?.name} concluiu a tarefa com sucesso`,
                          )
                        }
                        className={cn(
                          'mt-1 sm:mt-0 p-1.5 rounded-full transition-colors border',
                          isConcluida
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'border-muted-foreground/30 hover:border-primary text-muted-foreground hover:text-primary',
                        )}
                        title={isConcluida ? 'Clique para reabrir tarefa' : 'Marcar como concluída'}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3
                            className={cn(
                              'font-semibold text-base text-foreground truncate',
                              isConcluida && 'line-through text-muted-foreground',
                            )}
                          >
                            {ordem.titulo}
                          </h3>
                          {ordem.ai_risk_flag && (
                            <Badge variant="destructive" className="text-[10px] uppercase">
                              <AlertTriangle className="w-3 h-3 mr-1" /> Risco
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-[11px] bg-background">
                            [{ordem.etapa_id}. {stageObj?.shortName || `Etapa ${ordem.etapa_id}`}]
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {ordem.descricao || ordem.imovel_titulo || 'Sem observações'}
                        </p>
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1">
                          <span>Criado por: {ordem.criado_por || 'Master'}</span>
                          {ordem.contrato_id && <span>Contrato: {ordem.contrato_id}</span>}
                          {ordem.prazo && <span>Prazo: {ordem.prazo}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <Badge
                        variant={
                          ordem.prioridade === 'Crítica' || ordem.prioridade === 'Alta'
                            ? 'destructive'
                            : ordem.prioridade === 'Média'
                              ? 'warning'
                              : 'secondary'
                        }
                        className="text-xs"
                      >
                        {ordem.prioridade}
                      </Badge>
                      <Badge
                        className={cn(
                          'text-xs font-semibold',
                          ordem.status === 'Concluída'
                            ? 'bg-emerald-600 text-white'
                            : ordem.status === 'Atrasada'
                              ? 'bg-destructive text-destructive-foreground'
                              : ordem.status === 'Em Andamento'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground',
                        )}
                      >
                        {ordem.status}
                      </Badge>
                    </div>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="text-center p-8 border border-dashed rounded-xl bg-card text-muted-foreground shadow-sm text-sm">
              Nenhuma tarefa atribuída a você no momento. Aguarde designações do Master no funil.
            </div>
          )}
        </section>

        {/* Bloco 2: Tarefas Operacionais Adicionais */}
        {myMockTasks.length > 0 && (
          <section className="space-y-4 pt-4 border-t">
            <h2 className="text-base font-semibold flex items-center gap-2 text-muted-foreground">
              <PlayCircle className="w-4 h-4 text-primary" /> Outras Demandas Atribuídas (
              {myMockTasks.length})
            </h2>
            <div className="grid gap-3">
              {myMockTasks.map((task) => (
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
