import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Award,
  AlertTriangle,
  CheckCircle2,
  ThumbsUp,
  AlertOctagon,
  Clock,
  TrendingUp,
  Plus,
  ShieldAlert,
  UserCheck,
  Flame,
} from 'lucide-react'
import usePipelineAccess from '@/stores/usePipelineAccess'
import useAuthStore from '@/stores/useAuthStore'
import { useToast } from '@/hooks/use-toast'
import { DailyMetricItem } from '@/types/pipeline'

export default function DesempenhoEquipe() {
  const { metrics, formalRecords, addFormalRecord } = usePipelineAccess()
  const { profileLevel, user } = useAuthStore()
  const { toast } = useToast()

  const [periodo, setPeriodo] = useState<'semana' | 'mes' | 'trimestre'>('mes')

  // Modais de reconhecimento formal (Acerto / Ocorrência)
  const [isAcertoModalOpen, setIsAcertoModalOpen] = useState(false)
  const [isOcorrenciaModalOpen, setIsOcorrenciaModalOpen] = useState(false)

  const [formColaboradorId, setFormColaboradorId] = useState('u4')
  const [formDescricao, setFormDescricao] = useState('')
  const [formContratoId, setFormContratoId] = useState('CTR-001')
  const [formImpacto, setFormImpacto] = useState<'Baixo' | 'Médio' | 'Alto' | 'Crítico'>('Alto')
  const [formTipoErro, setFormTipoErro] = useState('Erro de valor | Retrabalho')
  const [formPlanoAcao, setFormPlanoAcao] = useState('')

  const colaboradoresList = [
    { id: 'u4', nome: 'Alice Santos' },
    { id: 'u2', nome: 'Marina Costa' },
    { id: 'u3', nome: 'João Paulo' },
    { id: 'u6', nome: 'Camila Torres' },
    { id: 'u5', nome: 'Ricardo Mendes' },
  ]

  // Ranking ordenado pelo Score Total
  const sortedRanking = useMemo(() => {
    return [...metrics].sort((a, b) => b.score_total - a.score_total)
  }, [metrics])

  // Classificação de cor do score
  const getScoreBadge = (score: number, classif: string) => {
    if (score >= 90) {
      return (
        <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-mono">
          {score} · {classif}
        </Badge>
      )
    }
    if (score >= 70) {
      return (
        <Badge className="bg-amber-500 hover:bg-amber-600 text-white font-mono">
          {score} · {classif}
        </Badge>
      )
    }
    if (score >= 50) {
      return (
        <Badge className="bg-orange-500 hover:bg-orange-600 text-white font-mono">
          {score} · {classif}
        </Badge>
      )
    }
    return (
      <Badge variant="destructive" className="font-mono">
        {score} · {classif}
      </Badge>
    )
  }

  const getRankMedal = (index: number) => {
    if (index === 0) return '🥇'
    if (index === 1) return '🥈'
    if (index === 2) return '🥉'
    return `${index + 1}º`
  }

  // Submeter Acerto
  const handleSubmitAcerto = async () => {
    if (!formDescricao) {
      toast({ title: 'Descrição necessária', variant: 'destructive' })
      return
    }
    const colabNome = colaboradoresList.find((c) => c.id === formColaboradorId)?.nome
    const ok = await addFormalRecord({
      colaborador_id: formColaboradorId,
      colaborador_nome: colabNome,
      tipo: 'acerto',
      descricao: formDescricao,
      contrato_id: formContratoId,
      impacto: formImpacto,
      registrado_por: user.name || 'Carlos Silva (Gestor)',
      visibilidade: 'todos',
    })

    if (ok) {
      toast({
        title: 'Acerto Formal Registrado!',
        description: `Elogio registrado com sucesso para ${colabNome}. Notificação WhatsApp enviada.`,
      })
      setIsAcertoModalOpen(false)
      setFormDescricao('')
    }
  }

  // Submeter Ocorrência
  const handleSubmitOcorrencia = async () => {
    if (!formDescricao) {
      toast({ title: 'Descrição necessária', variant: 'destructive' })
      return
    }
    const colabNome = colaboradoresList.find((c) => c.id === formColaboradorId)?.nome
    const ok = await addFormalRecord({
      colaborador_id: formColaboradorId,
      colaborador_nome: colabNome,
      tipo: 'ocorrencia',
      descricao: formDescricao,
      contrato_id: formContratoId,
      impacto: formImpacto,
      registrado_por: user.name || 'Carlos Silva (Gestor)',
      visibilidade: 'gestores',
      tipo_erro: formTipoErro,
      plano_acao: formPlanoAcao,
    })

    if (ok) {
      toast({
        title: 'Ocorrência Registrada',
        description: `Ocorrência gravada no histórico de ${colabNome} (visível a gestores).`,
      })
      setIsOcorrenciaModalOpen(false)
      setFormDescricao('')
      setFormPlanoAcao('')
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up max-w-7xl mx-auto w-full pb-12">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Award className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Desempenho da Equipe
            </h1>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            Métricas individuais calculadas automaticamente: SLA, Retrabalho, Volume e
            Comportamento.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={periodo} onValueChange={(v: any) => setPeriodo(v)}>
            <SelectTrigger className="w-36 h-9 text-xs">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semana">Esta Semana</SelectItem>
              <SelectItem value="mes">Este Mês</SelectItem>
              <SelectItem value="trimestre">Este Trimestre</SelectItem>
            </SelectContent>
          </Select>

          <Button
            size="sm"
            onClick={() => setIsAcertoModalOpen(true)}
            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
          >
            <ThumbsUp className="w-3.5 h-3.5" /> Registrar Acerto
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsOcorrenciaModalOpen(true)}
            className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"
          >
            <AlertOctagon className="w-3.5 h-3.5" /> Registrar Ocorrência
          </Button>
        </div>
      </div>

      {/* Alertas Automáticos para o Gestor */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-lg border border-destructive/30 bg-destructive/5 flex items-start gap-3">
          <AlertOctagon className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-semibold text-destructive block">SLA Crítico em Atraso</span>
            <span className="text-foreground">
              Ricardo Mendes tem 3 tarefas críticas atrasadas há mais de 48h.
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-lg border border-amber-500/30 bg-amber-500/5 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-semibold text-amber-700 dark:text-amber-400 block">
              Tentativa Fora do Escopo
            </span>
            <span className="text-foreground">
              Camila Torres tentou acessar Financeiro sem permissão 2x hoje.
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-lg border border-emerald-500/30 bg-emerald-500/5 flex items-start gap-3">
          <Flame className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-semibold text-emerald-700 dark:text-emerald-400 block">
              Destaque Operacional
            </span>
            <span className="text-foreground">
              Alice Santos concluiu 12 tarefas ontem — desempenho acima da média.
            </span>
          </div>
        </div>
      </div>

      {/* Tabela de Ranking Consolidado */}
      <Card className="shadow-sm border">
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                Ranking de Desempenho Operacional
              </CardTitle>
              <CardDescription className="text-xs">
                Score Ponderado = SLA (40%) + Qualidade (35%) + Volume (15%) + Comportamento (10%)
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs uppercase tracking-wider font-mono">
              Período: {periodo}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="text-xs">
                <TableHead className="w-16 text-center">Posição</TableHead>
                <TableHead>Colaborador</TableHead>
                <TableHead>Score Geral</TableHead>
                <TableHead className="text-center">SLA no Prazo</TableHead>
                <TableHead className="text-center">Taxa Retrabalho</TableHead>
                <TableHead className="text-center">Total Tarefas</TableHead>
                <TableHead className="text-center">Tentativas Negadas</TableHead>
                <TableHead className="text-center">Acessos Adjacentes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRanking.map((m, idx) => {
                const taxaRetrabalho = Math.round(
                  (m.tarefas_reabertas / (m.tarefas_total || 1)) * 100,
                )
                const hasAcessoNegadoBadge = m.acessos_negados > 0
                const hasRetrabalhoBadge = taxaRetrabalho >= 8
                const isAboveAverage = m.score_total >= 85

                return (
                  <TableRow key={m.id} className="text-xs hover:bg-muted/40 transition-colors">
                    <TableCell className="text-center font-bold text-base">
                      {getRankMedal(idx)}
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span>{m.colaborador_nome}</span>
                        {/* Badges de gestor no avatar/nome */}
                        {hasAcessoNegadoBadge && (
                          <span
                            title="Tentativa de acesso negado registrada"
                            className="w-2.5 h-2.5 rounded-full bg-destructive inline-block"
                          />
                        )}
                        {hasRetrabalhoBadge && (
                          <span
                            title="Retrabalho acima do limite (≥ 8%)"
                            className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"
                          />
                        )}
                        {isAboveAverage && (
                          <span
                            title="Desempenho acima da média da equipe"
                            className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"
                          />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getScoreBadge(m.score_total, m.classificacao)}</TableCell>
                    <TableCell className="text-center font-mono">
                      <span className={m.score_sla >= 90 ? 'text-emerald-600 font-bold' : ''}>
                        {m.score_sla}%
                      </span>
                    </TableCell>
                    <TableCell className="text-center font-mono">
                      <span className={taxaRetrabalho >= 8 ? 'text-destructive font-bold' : ''}>
                        {taxaRetrabalho}%
                      </span>
                    </TableCell>
                    <TableCell className="text-center font-mono font-medium">
                      {m.tarefas_total}
                    </TableCell>
                    <TableCell className="text-center font-mono">
                      {m.acessos_negados > 0 ? (
                        <Badge variant="destructive" className="h-5 text-[10px]">
                          {m.acessos_negados}x
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center font-mono">
                      {m.acessos_adjacentes > 0 ? (
                        <span className="text-amber-700 dark:text-amber-300 font-medium">
                          {m.acessos_adjacentes}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Histórico de Acertos e Ocorrências */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Acertos */}
        <Card className="shadow-sm border border-emerald-500/20">
          <CardHeader className="bg-emerald-500/5 pb-3 border-b border-emerald-500/10">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <ThumbsUp className="w-4 h-4 text-emerald-600" />
                Mural de Reconhecimento de Acertos
              </CardTitle>
              <Badge variant="outline" className="text-[10px] bg-background">
                Transparência Positiva
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Elogios formalizados que bonificam o Score e notificam no WhatsApp.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {formalRecords
              .filter((r) => r.tipo === 'acerto')
              .map((r) => (
                <div
                  key={r.id}
                  className="p-3 rounded-lg border bg-card text-xs flex flex-col gap-1.5 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground text-sm">
                      {r.colaborador_nome || 'Alice Santos'}
                    </span>
                    <Badge className="bg-emerald-600 text-white text-[10px]">
                      Impacto {r.impacto}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground italic">"{r.descricao}"</p>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t">
                    <span>Contrato: {r.contrato_id || 'Geral'}</span>
                    <span>Registrado por: {r.registrado_por}</span>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>

        {/* Ocorrências */}
        <Card className="shadow-sm border border-destructive/20">
          <CardHeader className="bg-destructive/5 pb-3 border-b border-destructive/10">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base text-destructive flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-destructive" />
                Ocorrências & Planos de Ação
              </CardTitle>
              <Badge variant="outline" className="text-[10px] bg-background text-destructive">
                Gestores & ADM
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Erros registrados com plano corretivo para alinhamento operacional.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {formalRecords
              .filter((r) => r.tipo === 'ocorrencia')
              .map((r) => (
                <div
                  key={r.id}
                  className="p-3 rounded-lg border bg-card text-xs flex flex-col gap-1.5 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground text-sm">
                      {r.colaborador_nome || 'Ricardo Mendes'}
                    </span>
                    <Badge variant="destructive" className="text-[10px]">
                      Impacto {r.impacto}
                    </Badge>
                  </div>
                  <span className="text-[11px] font-semibold text-destructive">
                    {r.tipo_erro || 'Falha Operacional'}
                  </span>
                  <p className="text-muted-foreground">"{r.descricao}"</p>
                  {r.plano_acao && (
                    <div className="p-2 rounded bg-muted/40 border text-[11px] text-foreground">
                      <strong>Plano de Ação:</strong> {r.plano_acao}
                    </div>
                  )}
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t">
                    <span>Contrato: {r.contrato_id || 'Geral'}</span>
                    <span>Registrado por: {r.registrado_por}</span>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>

      {/* Modal: Registrar Acerto */}
      <Dialog open={isAcertoModalOpen} onOpenChange={setIsAcertoModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-700">
              <ThumbsUp className="w-5 h-5 text-emerald-600" /> Registrar Acerto Formal
            </DialogTitle>
            <DialogDescription className="text-xs">
              Reconhecimento formal visível a todos e que bonifica o score de desempenho.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <label className="font-medium">Colaborador</label>
              <Select value={formColaboradorId} onValueChange={setFormColaboradorId}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {colaboradoresList.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-medium">Contrato Relacionado</label>
                <Input
                  value={formContratoId}
                  onChange={(e) => setFormContratoId(e.target.value)}
                  className="h-8 text-xs font-mono"
                  placeholder="CTR-001"
                />
              </div>
              <div className="space-y-1">
                <label className="font-medium">Impacto</label>
                <Select value={formImpacto} onValueChange={(v: any) => setFormImpacto(v)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Baixo">Baixo</SelectItem>
                    <SelectItem value="Médio">Médio</SelectItem>
                    <SelectItem value="Alto">Alto</SelectItem>
                    <SelectItem value="Crítico">Crítico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-medium">Descrição do Acerto / Elogio</label>
              <Textarea
                value={formDescricao}
                onChange={(e) => setFormDescricao(e.target.value)}
                placeholder="Ex: Identificou proativamente dano na vistoria que evitou disputa na rescisão..."
                className="text-xs min-h-[80px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsAcertoModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSubmitAcerto}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Confirmar e Enviar WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Registrar Ocorrência */}
      <Dialog open={isOcorrenciaModalOpen} onOpenChange={setIsOcorrenciaModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertOctagon className="w-5 h-5" /> Registrar Ocorrência Operacional
            </DialogTitle>
            <DialogDescription className="text-xs">
              Histórico confidencial visível apenas para Gestores e Diretores.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <label className="font-medium">Colaborador</label>
              <Select value={formColaboradorId} onValueChange={setFormColaboradorId}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {colaboradoresList.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-medium">Contrato</label>
                <Input
                  value={formContratoId}
                  onChange={(e) => setFormContratoId(e.target.value)}
                  className="h-8 text-xs font-mono"
                  placeholder="CTR-004"
                />
              </div>
              <div className="space-y-1">
                <label className="font-medium">Impacto</label>
                <Select value={formImpacto} onValueChange={(v: any) => setFormImpacto(v)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Baixo">Baixo</SelectItem>
                    <SelectItem value="Médio">Médio</SelectItem>
                    <SelectItem value="Alto">Alto</SelectItem>
                    <SelectItem value="Crítico">Crítico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-medium">Tipo de Erro</label>
              <Input
                value={formTipoErro}
                onChange={(e) => setFormTipoErro(e.target.value)}
                className="h-8 text-xs"
                placeholder="Ex: Erro de valor | Retrabalho"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium">Descrição da Falha</label>
              <Textarea
                value={formDescricao}
                onChange={(e) => setFormDescricao(e.target.value)}
                placeholder="Ex: Extrato enviado com valor incorreto e causou retrabalho..."
                className="text-xs min-h-[70px]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium">Plano de Ação Corretivo</label>
              <Textarea
                value={formPlanoAcao}
                onChange={(e) => setFormPlanoAcao(e.target.value)}
                placeholder="O que o colaborador deve executar de diferente para sanar o problema..."
                className="text-xs min-h-[60px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsOcorrenciaModalOpen(false)}>
              Cancelar
            </Button>
            <Button size="sm" variant="destructive" onClick={handleSubmitOcorrencia}>
              Salvar Ocorrência
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
