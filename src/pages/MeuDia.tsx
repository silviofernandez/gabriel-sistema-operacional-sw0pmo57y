import { useState, useMemo } from 'react'
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  UserCheck,
  Building,
  ArrowRight,
  TrendingUp,
  Inbox,
  Filter,
  Users,
  Briefcase,
} from 'lucide-react'
import { useProcessos } from '@/stores/useProcessosStore'
import useAuthStore from '@/stores/useAuthStore'
import { AtividadeCaso, CasoProcesso } from '@/types/processos'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CasoDetailDialog } from '@/components/processos/CasoDetailDialog'
import { formatarDataHoraBR } from '@/utils/expedienteSLA'
import { cn } from '@/lib/utils'

export function MeuDia() {
  const { user } = useAuthStore()
  const { casos, selectedUnidadeFiltro, setSelectedUnidadeFiltro } = useProcessos()

  const [selectedCaso, setSelectedCaso] = useState<CasoProcesso | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [funcaoFiltro, setFuncaoFiltro] = useState<string>('Todas')

  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)

  // 1. Atrasadas: prazo vencido e não resolvidas
  const casosAtrasados = useMemo(() => {
    return casos.filter((c) => {
      if (c.status === 'Resolvido' || c.status === 'Cancelado') return false
      if (!c.prazo_resolucao) return false
      return new Date(c.prazo_resolucao) < now
    })
  }, [casos, now])

  // 2. Para hoje: com prazo de resolução ou próxima ação para hoje
  const casosParaHoje = useMemo(() => {
    return casos.filter((c) => {
      if (c.status === 'Resolvido' || c.status === 'Cancelado') return false
      if (!c.prazo_resolucao) return false
      const d = c.prazo_resolucao.slice(0, 10)
      return d === todayStr
    })
  }, [casos, todayStr])

  // 3. Aguardando aprovação: alçada de gestor ou aprovação pendente
  const casosAguardandoAprovacao = useMemo(() => {
    return casos.filter((c) => c.status === 'Aguardando aprovação interna')
  }, [casos])

  // 4. Retornos prometidos: com prazo_prometido_cliente definido
  const casosRetornosPrometidos = useMemo(() => {
    return casos.filter(
      (c) => c.status !== 'Resolvido' && c.status !== 'Cancelado' && !!c.prazo_prometido_cliente,
    )
  }, [casos])

  // 5. Aguardando terceiros: proprietário, prestador ou cliente
  const casosAguardandoTerceiros = useMemo(() => {
    return casos.filter(
      (c) =>
        c.status === 'Aguardando cliente' ||
        c.status === 'Aguardando proprietário' ||
        c.status === 'Aguardando prestador',
    )
  }, [casos])

  // 6. Próximos vencimentos: prazo nos próximos 3 dias
  const casosProximosVencimentos = useMemo(() => {
    const daqui3dias = new Date(now.getTime() + 3 * 86400000)
    return casos.filter((c) => {
      if (c.status === 'Resolvido' || c.status === 'Cancelado') return false
      if (!c.prazo_resolucao) return false
      const d = new Date(c.prazo_resolucao)
      return d > now && d <= daqui3dias
    })
  }, [casos, now])

  const renderCasoCard = (c: CasoProcesso) => (
    <Card
      key={c.id}
      onClick={() => {
        setSelectedCaso(c)
        setIsDetailOpen(true)
      }}
      className="p-4 cursor-pointer hover:shadow-md transition-all border bg-card flex flex-col justify-between gap-3 group"
    >
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs font-bold text-primary group-hover:underline">
              {c.protocolo}
            </span>
            <Badge variant="outline" className="text-[10px] font-mono py-0">
              {c.unidade}
            </Badge>
          </div>
          <Badge
            className={cn(
              'text-[10px] py-0',
              c.prioridade === 'Urgente'
                ? 'bg-destructive text-destructive-foreground'
                : c.prioridade === 'Alta'
                  ? 'bg-orange-500 text-white'
                  : 'bg-muted text-muted-foreground',
            )}
          >
            {c.prioridade}
          </Badge>
        </div>

        <h4 className="font-semibold text-sm text-foreground line-clamp-2 leading-snug">
          {c.titulo}
        </h4>

        <div className="text-xs text-muted-foreground space-y-0.5">
          <p>
            <strong className="text-foreground">Para quem:</strong> {c.solicitante_nome}
          </p>
          <p>
            <strong className="text-foreground">O que fazer:</strong>{' '}
            {c.proxima_acao || 'Dar andamento na fase atual.'}
          </p>
          <p>
            <strong className="text-foreground">Fase atual:</strong> {c.fase_atual_nome}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t text-[11px] text-muted-foreground font-mono">
        <span className="flex items-center gap-1 text-primary">
          <Clock className="w-3.5 h-3.5" />
          Até {c.prazo_resolucao ? formatarDataHoraBR(c.prazo_resolucao).slice(0, 16) : 'S/ prazo'}
        </span>
        <span className="text-foreground font-medium group-hover:text-primary flex items-center gap-1">
          Abrir <ArrowRight className="w-3 h-3" />
        </span>
      </div>
    </Card>
  )

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up max-w-7xl mx-auto w-full pb-12">
      {/* Header com identificação do usuário e múltiplas funções */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Calendar className="w-8 h-8 text-primary" /> Meu Dia
            </h1>
            <Badge
              variant="outline"
              className="bg-primary/5 text-primary border-primary/20 text-xs"
            >
              Etapa 1
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Visão individual agrupada de atividades para o colaborador{' '}
            <strong className="text-foreground">{user.name || 'Carlos Silva'}</strong> (suporta
            múltiplas funções simultâneas).
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-muted-foreground" />
            <Select value={funcaoFiltro} onValueChange={setFuncaoFiltro}>
              <SelectTrigger className="w-[180px] bg-background text-xs">
                <SelectValue placeholder="Filtrar por Função" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todas">Todas as minhas funções</SelectItem>
                <SelectItem value="Atendimento">Atendimento</SelectItem>
                <SelectItem value="Gestor">Gestão Geral</SelectItem>
                <SelectItem value="Contratos">Contratos</SelectItem>
                <SelectItem value="Financeiro">Financeiro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Select
            value={selectedUnidadeFiltro}
            onValueChange={(val) => setSelectedUnidadeFiltro(val as any)}
          >
            <SelectTrigger className="w-[160px] bg-background text-xs">
              <SelectValue placeholder="Unidade Gabriel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todas">Todas as Cidades</SelectItem>
              <SelectItem value="Jaú">Jaú</SelectItem>
              <SelectItem value="Pederneiras">Pederneiras</SelectItem>
              <SelectItem value="Lençóis Paulista">Lençóis Paulista</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 6 Agrupamentos da Spec em Abas ou Painel */}
      <Tabs defaultValue="atrasadas" className="space-y-6">
        <TabsList className="bg-muted p-1 grid grid-cols-2 md:grid-cols-6 gap-1 h-auto">
          <TabsTrigger
            value="atrasadas"
            className="text-xs py-2 gap-1.5 data-[state=active]:bg-destructive data-[state=active]:text-white font-semibold"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Atrasadas ({casosAtrasados.length})
          </TabsTrigger>
          <TabsTrigger value="hoje" className="text-xs py-2 gap-1.5 font-semibold">
            <Clock className="w-3.5 h-3.5 text-primary" />
            Para hoje ({casosParaHoje.length})
          </TabsTrigger>
          <TabsTrigger value="aprovacao" className="text-xs py-2 gap-1.5 font-semibold">
            <UserCheck className="w-3.5 h-3.5 text-orange-500" />
            Aguardando aprovação ({casosAguardandoAprovacao.length})
          </TabsTrigger>
          <TabsTrigger value="prometidos" className="text-xs py-2 gap-1.5 font-semibold">
            <Inbox className="w-3.5 h-3.5 text-blue-500" />
            Retornos prometidos ({casosRetornosPrometidos.length})
          </TabsTrigger>
          <TabsTrigger value="terceiros" className="text-xs py-2 gap-1.5 font-semibold">
            <Users className="w-3.5 h-3.5 text-purple-500" />
            Aguardando terceiros ({casosAguardandoTerceiros.length})
          </TabsTrigger>
          <TabsTrigger value="proximos" className="text-xs py-2 gap-1.5 font-semibold">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            Próximos vencimentos ({casosProximosVencimentos.length})
          </TabsTrigger>
        </TabsList>

        {/* 1. Atrasadas */}
        <TabsContent value="atrasadas" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" /> Demandas com Prazo Vencido
            </h3>
            <span className="text-xs text-muted-foreground">
              Prioridade máxima de atendimento e escalonamento
            </span>
          </div>
          {casosAtrasados.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {casosAtrasados.map(renderCasoCard)}
            </div>
          ) : (
            <Card className="p-8 text-center text-xs text-muted-foreground border-dashed">
              Nenhuma atividade em atraso. Parabéns pelo cumprimento dos prazos!
            </Card>
          )}
        </TabsContent>

        {/* 2. Para Hoje */}
        <TabsContent value="hoje" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> Foco do Dia (Vencimento Hoje)
            </h3>
            <span className="text-xs text-muted-foreground">Conclua estas ações até as 18:00</span>
          </div>
          {casosParaHoje.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {casosParaHoje.map(renderCasoCard)}
            </div>
          ) : (
            <Card className="p-8 text-center text-xs text-muted-foreground border-dashed">
              Nenhum caso com prazo final para hoje.
            </Card>
          )}
        </TabsContent>

        {/* 3. Aguardando Aprovação */}
        <TabsContent value="aprovacao" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-orange-500" /> Pendências de Alçada & Aprovação do
              Gestor
            </h3>
            <span className="text-xs text-muted-foreground">
              Exige parecer formal para desbloquear avanço
            </span>
          </div>
          {casosAguardandoAprovacao.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {casosAguardandoAprovacao.map(renderCasoCard)}
            </div>
          ) : (
            <Card className="p-8 text-center text-xs text-muted-foreground border-dashed">
              Nenhuma aprovação pendente no momento.
            </Card>
          )}
        </TabsContent>

        {/* 4. Retornos Prometidos */}
        <TabsContent value="prometidos" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Inbox className="w-4 h-4 text-blue-500" /> Retornos Prometidos ao Cliente
            </h3>
            <span className="text-xs text-muted-foreground">
              Compromisso firmado com o locatário ou proprietário
            </span>
          </div>
          {casosRetornosPrometidos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {casosRetornosPrometidos.map(renderCasoCard)}
            </div>
          ) : (
            <Card className="p-8 text-center text-xs text-muted-foreground border-dashed">
              Nenhum retorno prometido aguardando execução.
            </Card>
          )}
        </TabsContent>

        {/* 5. Aguardando Terceiros */}
        <TabsContent value="terceiros" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-500" /> Aguardando Retorno de Terceiros
            </h3>
            <span className="text-xs text-muted-foreground">
              Aguardar terceiro não encerra o acompanhamento: faça cobrança ativa
            </span>
          </div>
          {casosAguardandoTerceiros.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {casosAguardandoTerceiros.map(renderCasoCard)}
            </div>
          ) : (
            <Card className="p-8 text-center text-xs text-muted-foreground border-dashed">
              Nenhum caso aguardando terceiros no momento.
            </Card>
          )}
        </TabsContent>

        {/* 6. Próximos Vencimentos */}
        <TabsContent value="proximos" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" /> Próximos Vencimentos (Próximos 3
              Dias)
            </h3>
            <span className="text-xs text-muted-foreground">
              Planejamento preventivo para evitar atrasos
            </span>
          </div>
          {casosProximosVencimentos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {casosProximosVencimentos.map(renderCasoCard)}
            </div>
          ) : (
            <Card className="p-8 text-center text-xs text-muted-foreground border-dashed">
              Nenhum caso com vencimento para os próximos 3 dias.
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog Detalhe do Caso */}
      <CasoDetailDialog caso={selectedCaso} open={isDetailOpen} onOpenChange={setIsDetailOpen} />
    </div>
  )
}

export default MeuDia
