import { useState, useMemo } from 'react'
import {
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Users,
  Building,
  BarChart3,
  Bot,
  Filter,
  ArrowRight,
  ShieldAlert,
  ChevronRight,
  RotateCcw,
  Sparkles,
} from 'lucide-react'
import { useProcessos } from '@/stores/useProcessosStore'
import { CasoProcesso, GabrielUnidade } from '@/types/processos'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CasoDetailDialog } from '@/components/processos/CasoDetailDialog'
import { formatarDataHoraBR } from '@/utils/expedienteSLA'
import { cn } from '@/lib/utils'

export function PainelGestor() {
  const { casos, modelos } = useProcessos()

  // Filtros
  const [selectedUnidade, setSelectedUnidade] = useState<GabrielUnidade | 'Todas'>('Todas')
  const [selectedPeriodo, setSelectedPeriodo] = useState<string>('30d')
  const [selectedProcesso, setSelectedProcesso] = useState<string>('Todos')

  // Drill-down Modal
  const [drillDownTitle, setDrillDownTitle] = useState('')
  const [drillDownDescription, setDrillDownDescription] = useState('')
  const [drillDownCasos, setDrillDownCasos] = useState<CasoProcesso[]>([])
  const [isDrillDownOpen, setIsDrillDownOpen] = useState(false)

  // Caso individual selecionado a partir do drill-down
  const [selectedCasoParaVer, setSelectedCasoParaVer] = useState<CasoProcesso | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  // Filtragem dos casos conforme controles do gestor
  const filteredCasos = useMemo(() => {
    return casos.filter((c) => {
      if (selectedUnidade !== 'Todas' && c.unidade !== selectedUnidade) return false
      if (selectedProcesso !== 'Todos' && c.modelo_id !== selectedProcesso) return false
      return true
    })
  }, [casos, selectedUnidade, selectedProcesso])

  // Indicadores
  const totalRecebido = filteredCasos.length
  const totalConcluido = filteredCasos.filter((c) => c.status === 'Resolvido').length
  const totalAbertos = filteredCasos.filter(
    (c) => c.status !== 'Resolvido' && c.status !== 'Cancelado',
  ).length

  const now = new Date()
  const casosAtrasados = filteredCasos.filter((c) => {
    if (c.status === 'Resolvido' || c.status === 'Cancelado') return false
    return c.prazo_resolucao && new Date(c.prazo_resolucao) < now
  })

  const casosSemProximaAcao = filteredCasos.filter((c) => {
    if (c.status === 'Resolvido' || c.status === 'Cancelado') return false
    return !c.proxima_acao || c.proxima_acao.trim().length === 0
  })

  const clientesSemRetorno = filteredCasos.filter((c) => {
    if (c.status === 'Resolvido' || c.status === 'Cancelado') return false
    return !c.data_primeira_resposta_humana && !c.data_ultimo_retorno_cliente
  })

  const casosReabertos = filteredCasos.filter(
    (c) => c.status === 'Reaberto' || c.historico_etapas?.some((h) => h.motivo_retorno),
  )

  // Gargalos por etapa
  const gargalosPorEtapa = useMemo(() => {
    const mapa: Record<string, number> = {}
    filteredCasos
      .filter((c) => c.status !== 'Resolvido' && c.status !== 'Cancelado')
      .forEach((c) => {
        const etapa = c.fase_atual_nome || 'Triagem Inicial'
        mapa[etapa] = (mapa[etapa] || 0) + 1
      })
    return Object.entries(mapa).sort((a, b) => b[1] - a[1])
  }, [filteredCasos])

  // Carga de trabalho por colaborador
  const cargaColaborador = useMemo(() => {
    const mapa: Record<string, number> = {}
    filteredCasos
      .filter((c) => c.status !== 'Resolvido' && c.status !== 'Cancelado')
      .forEach((c) => {
        const nome = c.responsavel_nome || 'Não Atribuído'
        mapa[nome] = (mapa[nome] || 0) + 1
      })
    return Object.entries(mapa).sort((a, b) => b[1] - a[1])
  }, [filteredCasos])

  // Função de Drill-Down
  const abrirDrillDown = (titulo: string, descricao: string, registros: CasoProcesso[]) => {
    setDrillDownTitle(titulo)
    setDrillDownDescription(descricao)
    setDrillDownCasos(registros)
    setIsDrillDownOpen(true)
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up max-w-7xl mx-auto w-full pb-12">
      {/* Header com filtros de cidade e período */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <TrendingUp className="w-8 h-8 text-primary" /> Painel do Gestor
            </h1>
            <Badge
              variant="outline"
              className="bg-primary/5 text-primary border-primary/20 text-xs"
            >
              Etapa 1
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Visão gerencial consolidada com SLA, gargalos, reaberturas e drill-down em todos os
            indicadores.
          </p>
        </div>

        {/* Barra de Filtros do Gestor */}
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={selectedUnidade} onValueChange={(val) => setSelectedUnidade(val as any)}>
            <SelectTrigger className="w-[160px] bg-background text-xs">
              <SelectValue placeholder="Cidade / Unidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todas">Todas as Cidades</SelectItem>
              <SelectItem value="Jaú">Jaú</SelectItem>
              <SelectItem value="Pederneiras">Pederneiras</SelectItem>
              <SelectItem value="Lençóis Paulista">Lençóis Paulista</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedProcesso} onValueChange={setSelectedProcesso}>
            <SelectTrigger className="w-[180px] bg-background text-xs">
              <SelectValue placeholder="Processo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos os Processos</SelectItem>
              {modelos.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedPeriodo} onValueChange={setSelectedPeriodo}>
            <SelectTrigger className="w-[140px] bg-background text-xs">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="mes">Mês Vigente</SelectItem>
              <SelectItem value="ano">Ano 2026</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Grid de KPIs Principais (Com Drill-down Clicável) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Casos em Aberto */}
        <Card
          onClick={() =>
            abrirDrillDown(
              'Casos em Aberto',
              'Lista de todos os atendimentos que estão em andamento ou em triagem.',
              filteredCasos.filter((c) => c.status !== 'Resolvido' && c.status !== 'Cancelado'),
            )
          }
          className="cursor-pointer hover:shadow-md transition-all border-l-4 border-l-blue-500 bg-card"
        >
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-semibold">
              Casos em Aberto
            </CardDescription>
            <CardTitle className="text-3xl font-bold flex items-center justify-between">
              {totalAbertos}
              <Badge variant="outline" className="text-xs font-normal">
                Drill-down
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground flex items-center justify-between">
            <span>{totalRecebido} recebidos no período</span>
            <ChevronRight className="w-4 h-4 text-primary" />
          </CardContent>
        </Card>

        {/* KPI 2: Casos Atrasados (SLA Estourado) */}
        <Card
          onClick={() =>
            abrirDrillDown(
              'Casos com SLA Vencido (Atrasados)',
              'Solicitações que ultrapassaram o prazo estimado de resolução útil sem conclusão.',
              casosAtrasados,
            )
          }
          className="cursor-pointer hover:shadow-md transition-all border-l-4 border-l-destructive bg-card"
        >
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-semibold text-destructive">
              Casos Atrasados
            </CardDescription>
            <CardTitle className="text-3xl font-bold text-destructive flex items-center justify-between">
              {casosAtrasados.length}
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground flex items-center justify-between">
            <span>Exigem escalonamento imediato</span>
            <ChevronRight className="w-4 h-4 text-destructive" />
          </CardContent>
        </Card>

        {/* KPI 3: Casos Concluídos */}
        <Card
          onClick={() =>
            abrirDrillDown(
              'Casos Concluídos e Resolvidos',
              'Atendimentos finalizados com sucesso dentro da esteira.',
              filteredCasos.filter((c) => c.status === 'Resolvido'),
            )
          }
          className="cursor-pointer hover:shadow-md transition-all border-l-4 border-l-emerald-500 bg-card"
        >
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-semibold text-emerald-700 dark:text-emerald-300">
              Casos Resolvidos
            </CardDescription>
            <CardTitle className="text-3xl font-bold text-emerald-700 dark:text-emerald-300 flex items-center justify-between">
              {totalConcluido}
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground flex items-center justify-between">
            <span>
              Taxa de resolução:{' '}
              {totalRecebido > 0 ? Math.round((totalConcluido / totalRecebido) * 100) : 0}%
            </span>
            <ChevronRight className="w-4 h-4 text-emerald-600" />
          </CardContent>
        </Card>

        {/* KPI 4: Clientes Sem Retorno */}
        <Card
          onClick={() =>
            abrirDrillDown(
              'Clientes Sem Retorno Humano',
              'Casos abertos que ainda não receberam primeira resposta oficial humana.',
              clientesSemRetorno,
            )
          }
          className="cursor-pointer hover:shadow-md transition-all border-l-4 border-l-amber-500 bg-card"
        >
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-semibold text-amber-800 dark:text-amber-300">
              Sem Retorno Humano
            </CardDescription>
            <CardTitle className="text-3xl font-bold text-amber-800 dark:text-amber-300 flex items-center justify-between">
              {clientesSemRetorno.length}
              <Clock className="w-5 h-5 text-amber-600" />
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground flex items-center justify-between">
            <span>SLA 1ª Resposta: 2h úteis</span>
            <ChevronRight className="w-4 h-4 text-amber-600" />
          </CardContent>
        </Card>
      </div>

      {/* Seção 2: KPIs de Qualidade Operacional */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Sem próxima ação definida */}
        <Card
          onClick={() =>
            abrirDrillDown(
              'Casos Sem Próxima Ação Definida',
              'Demandas órfãs ou sem definição clara do próximo passo a ser executado.',
              casosSemProximaAcao,
            )
          }
          className="cursor-pointer hover:shadow-sm border bg-card p-4 space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-muted-foreground">
              Sem Próxima Ação
            </span>
            <Badge variant="outline" className="font-mono text-xs">
              {casosSemProximaAcao.length}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            A regra da Gabriel exige responsável e próxima ação em todos os casos.
          </p>
          <div className="text-[11px] text-primary font-medium flex items-center justify-end gap-1">
            Ver registros <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </Card>

        {/* Reaberturas & Retrabalho */}
        <Card
          onClick={() =>
            abrirDrillDown(
              'Reaberturas e Retrabalho',
              'Casos reabertos após resolução ou retornados de etapas para complementação.',
              casosReabertos,
            )
          }
          className="cursor-pointer hover:shadow-sm border bg-card p-4 space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-muted-foreground">
              Reaberturas & Retrabalho
            </span>
            <Badge variant="outline" className="font-mono text-xs">
              {casosReabertos.length}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Histórico preservado com motivo da devolução e justificativa do cliente.
          </p>
          <div className="text-[11px] text-primary font-medium flex items-center justify-end gap-1">
            Ver registros <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </Card>

        {/* Consumo de IA & Automações */}
        <Card className="border bg-card p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-muted-foreground">
              Consumo de IA & Automações
            </span>
            <Badge
              variant="outline"
              className="text-[10px] bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/30"
            >
              Aguardando configuração
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Atividades de inteligência artificial em modo preparatório na Etapa 1 com execução
            manual alternativa.
          </p>
          <div className="text-[11px] text-muted-foreground font-mono">
            0 tokens cobrados · Motor nativo
          </div>
        </Card>
      </div>

      {/* Seção 3: Gargalos por Etapa & Carga de Trabalho por Colaborador */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gargalos por Etapa */}
        <Card className="border shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" /> Gargalos por Etapa do Processo
            </CardTitle>
            <CardDescription className="text-xs">
              Identifique em quais fases os casos passam mais tempo acumulados.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {gargalosPorEtapa.map(([etapa, qtd]) => {
              const perc = Math.round((qtd / (totalAbertos || 1)) * 100)
              return (
                <div
                  key={etapa}
                  onClick={() =>
                    abrirDrillDown(
                      `Casos na etapa "${etapa}"`,
                      `Registros atualmente retidos nesta fase.`,
                      filteredCasos.filter((c) => c.fase_atual_nome === etapa),
                    )
                  }
                  className="p-3 rounded-lg border bg-muted/20 hover:bg-muted/40 cursor-pointer transition-colors space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground">{etapa}</span>
                    <span className="font-mono text-muted-foreground">
                      {qtd} casos ({perc}%)
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full',
                        perc > 40 ? 'bg-destructive' : perc > 20 ? 'bg-amber-500' : 'bg-primary',
                      )}
                      style={{ width: `${perc}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Carga por Colaborador */}
        <Card className="border shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> Carga de Trabalho por Colaborador
            </CardTitle>
            <CardDescription className="text-xs">
              Distribuição de responsabilidade nos chamados ativos em Jaú, Pederneiras e Lençóis
              Paulista.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {cargaColaborador.map(([colab, qtd]) => {
              const perc = Math.round((qtd / (totalAbertos || 1)) * 100)
              return (
                <div
                  key={colab}
                  onClick={() =>
                    abrirDrillDown(
                      `Casos sob responsabilidade de ${colab}`,
                      `Chamados em andamento atribuídos a este profissional.`,
                      filteredCasos.filter(
                        (c) => (c.responsavel_nome || 'Não Atribuído') === colab,
                      ),
                    )
                  }
                  className="p-3 rounded-lg border bg-muted/20 hover:bg-muted/40 cursor-pointer transition-colors space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground">{colab}</span>
                    <span className="font-mono text-muted-foreground">{qtd} casos ativos</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${perc}%` }} />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      {/* MODAL DE DRILL-DOWN: Abre os registros exatos do indicador clicado */}
      <Dialog open={isDrillDownOpen} onOpenChange={setIsDrillDownOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" /> {drillDownTitle}
            </DialogTitle>
            <DialogDescription className="text-xs">{drillDownDescription}</DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground pb-2 border-b">
              <span>{drillDownCasos.length} registro(s) encontrado(s)</span>
              <span className="font-mono">Drill-down ativo</span>
            </div>

            {drillDownCasos.length > 0 ? (
              <div className="border rounded-lg divide-y text-xs">
                {drillDownCasos.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      setSelectedCasoParaVer(c)
                      setIsDetailOpen(true)
                    }}
                    className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-muted/30 cursor-pointer transition-colors"
                  >
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-primary">{c.protocolo}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {c.unidade}
                        </Badge>
                        <Badge
                          className={cn(
                            'text-[10px]',
                            c.prioridade === 'Urgente'
                              ? 'bg-destructive text-destructive-foreground'
                              : 'bg-muted text-muted-foreground',
                          )}
                        >
                          {c.prioridade}
                        </Badge>
                      </div>
                      <h5 className="font-semibold text-foreground truncate">{c.titulo}</h5>
                      <p className="text-[11px] text-muted-foreground">
                        Solicitante: {c.solicitante_nome} · Fase: {c.fase_atual_nome} · Resp:{' '}
                        {c.responsavel_nome}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center font-mono text-[11px] text-muted-foreground">
                      <span>Prazo: {c.prazo_resolucao?.slice(0, 10) || '-'}</span>
                      <Button variant="outline" size="sm" className="h-7 text-xs">
                        Abrir Caso
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-8 text-xs text-muted-foreground border border-dashed rounded-lg">
                Nenhum registro corresponde a este indicador no filtro selecionado.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Detalhe do caso aberto pelo drill-down */}
      <CasoDetailDialog
        caso={selectedCasoParaVer}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
      />
    </div>
  )
}

export default PainelGestor
