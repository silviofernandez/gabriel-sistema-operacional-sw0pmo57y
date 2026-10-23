import { useState, useMemo } from 'react'
import {
  X,
  FileText,
  Clock,
  User,
  Building,
  CheckCircle2,
  AlertTriangle,
  PlayCircle,
  RotateCcw,
  MessageSquare,
  ShieldAlert,
  ArrowRight,
  Bot,
  Paperclip,
  Send,
  Lock,
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CasoProcesso, AtividadeCaso, ComentarioCaso } from '@/types/processos'
import { useProcessos } from '@/stores/useProcessosStore'
import { useToast } from '@/hooks/use-toast'
import { formatarDataHoraBR } from '@/utils/expedienteSLA'
import { cn } from '@/lib/utils'

interface CasoDetailDialogProps {
  caso: CasoProcesso | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CasoDetailDialog({ caso, open, onOpenChange }: CasoDetailDialogProps) {
  const {
    modelos,
    atividadesCaso,
    carregarAtividadesCaso,
    concluirAtividade,
    aprovarAtividade,
    recusarAtividade,
    avancarFaseCaso,
    devolverFaseCaso,
    reabrirCaso,
    pausarCaso,
    comentariosCaso,
    carregarComentariosCaso,
    adicionarComentario,
  } = useProcessos()
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState<'fluxo' | 'atividades' | 'mensagens' | 'historico'>(
    'fluxo',
  )
  const [novoComentario, setNovoComentario] = useState('')
  const [comentarioTipo, setComentarioTipo] = useState<'interno' | 'externo_cliente'>('interno')

  // Modais de ações de fluxo
  const [isDevolverModalOpen, setIsDevolverModalOpen] = useState(false)
  const [motivoDevolucao, setMotivoDevolucao] = useState('')
  const [faseDestinoId, setFaseDestinoId] = useState('')

  const [isReabrirModalOpen, setIsReabrirModalOpen] = useState(false)
  const [motivoReabertura, setMotivoReabertura] = useState('')

  const [isAprovarModalOpen, setIsAprovarModalOpen] = useState(false)
  const [selectedAtividadeParaAprovacao, setSelectedAtividadeParaAprovacao] =
    useState<AtividadeCaso | null>(null)
  const [parecerAprovacao, setParecerAprovacao] = useState('')

  const [isRecusarModalOpen, setIsRecusarModalOpen] = useState(false)
  const [selectedAtividadeParaRecusa, setSelectedAtividadeParaRecusa] =
    useState<AtividadeCaso | null>(null)
  const [motivoRecusa, setMotivoRecusa] = useState('')

  // Efeito para carregar atividades e comentários quando o caso é aberto
  useMemo(() => {
    if (caso?.id && open) {
      carregarAtividadesCaso(caso.id)
      carregarComentariosCaso(caso.id)
    }
  }, [caso?.id, open, carregarAtividadesCaso, carregarComentariosCaso])

  if (!caso) return null

  const modelo = modelos.find((m) => m.id === caso.modelo_id)
  const fases = modelo?.fases || []
  const faseAtualIndex = fases.findIndex((f) => f.id === caso.fase_atual_id)
  const proximaFase =
    faseAtualIndex >= 0 && faseAtualIndex < fases.length - 1 ? fases[faseAtualIndex + 1] : null

  // Enviar comentário / mensagem externa
  const handleEnviarComentario = async () => {
    if (!novoComentario.trim()) return
    const ok = await adicionarComentario(caso.id, caso.protocolo, novoComentario, comentarioTipo)
    if (ok) {
      setNovoComentario('')
      toast({
        title:
          comentarioTipo === 'interno' ? 'Nota interna registrada' : 'Mensagem enviada ao cliente',
        description:
          comentarioTipo === 'externo_cliente'
            ? 'A data do último retorno foi atualizada e conta como atendimento humano.'
            : 'Visível apenas para colaboradores da Gabriel.',
      })
    }
  }

  // Avançar Fase
  const handleAvancarFase = async () => {
    if (!proximaFase) return
    const res = await avancarFaseCaso(caso.id, proximaFase.id, proximaFase.nome)
    if (res.sucesso) {
      toast({
        title: 'Etapa Avançada',
        description: `O caso avançou para "${proximaFase.nome}".`,
      })
    } else {
      toast({
        title: 'Bloqueio de Avanço',
        description: res.erro,
        variant: 'destructive',
      })
    }
  }

  // Confirmar Devolução de Fase
  const handleConfirmarDevolucao = async () => {
    if (!faseDestinoId || !motivoDevolucao.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Selecione a fase de destino e informe o motivo do retorno.',
        variant: 'destructive',
      })
      return
    }
    const fDestino = fases.find((f) => f.id === faseDestinoId)
    if (!fDestino) return

    const ok = await devolverFaseCaso(caso.id, fDestino.id, fDestino.nome, motivoDevolucao)
    if (ok) {
      toast({
        title: 'Caso Retornado',
        description: `Retornado para "${fDestino.nome}". Motivo gravado no histórico.`,
      })
      setIsDevolverModalOpen(false)
      setMotivoDevolucao('')
    }
  }

  // Confirmar Reabertura
  const handleConfirmarReabertura = async () => {
    if (!motivoReabertura.trim()) {
      toast({
        title: 'Motivo obrigatório',
        description: 'Descreva a razão de reabrir este atendimento.',
        variant: 'destructive',
      })
      return
    }
    const ok = await reabrirCaso(caso.id, motivoReabertura)
    if (ok) {
      toast({
        title: 'Caso Reaberto',
        description: 'Histórico preservado e status alterado para Reaberto.',
      })
      setIsReabrirModalOpen(false)
      setMotivoReabertura('')
    }
  }

  // Concluir Atividade Individual
  const handleConcluirAtividade = async (ativ: AtividadeCaso) => {
    const res = await concluirAtividade(ativ.id)
    if (res.sucesso) {
      toast({
        title: 'Atividade Concluída',
        description: `"${ativ.titulo}" concluída com sucesso.`,
      })
    } else {
      toast({
        title: 'Bloqueio de Requisito',
        description: res.erro,
        variant: 'destructive',
      })
    }
  }

  // Aprovar Atividade de Alçada
  const handleConfirmarAprovacao = async () => {
    if (!selectedAtividadeParaAprovacao) return
    const ok = await aprovarAtividade(selectedAtividadeParaAprovacao.id, parecerAprovacao)
    if (ok) {
      toast({
        title: 'Aprovação Concedida',
        description: 'Parecer registrado no histórico de auditoria.',
      })
      setIsAprovarModalOpen(false)
      setParecerAprovacao('')
    }
  }

  // Recusar Atividade de Alçada
  const handleConfirmarRecusa = async () => {
    if (!selectedAtividadeParaRecusa || !motivoRecusa.trim()) return
    const ok = await recusarAtividade(selectedAtividadeParaRecusa.id, motivoRecusa)
    if (ok) {
      toast({
        title: 'Atividade Recusada',
        description: 'O processo retornou à etapa anterior configurada.',
      })
      setIsRecusarModalOpen(false)
      setMotivoRecusa('')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Top Header do Caso */}
        <DialogHeader className="p-4 sm:p-6 border-b bg-muted/20 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="font-mono text-xs bg-background">
                  {caso.protocolo}
                </Badge>
                <Badge
                  className={cn(
                    'text-xs font-semibold',
                    caso.prioridade === 'Urgente'
                      ? 'bg-destructive text-destructive-foreground'
                      : caso.prioridade === 'Alta'
                        ? 'bg-orange-500 text-white'
                        : 'bg-muted text-muted-foreground',
                  )}
                >
                  {caso.prioridade}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {caso.unidade}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {caso.status}
                </Badge>
                {caso.is_demo && (
                  <Badge className="bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/30 text-[10px]">
                    Demonstrativo
                  </Badge>
                )}
              </div>
              <DialogTitle className="text-xl font-bold leading-tight text-foreground">
                {caso.titulo}
              </DialogTitle>
            </div>

            {/* Ações Rápidas de Fluxo */}
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              {caso.status === 'Resolvido' ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsReabrirModalOpen(true)}
                  className="gap-1.5"
                >
                  <RotateCcw className="w-4 h-4 text-amber-600" /> Reabrir Caso
                </Button>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsDevolverModalOpen(true)}
                    className="gap-1.5 text-xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Devolver Etapa
                  </Button>
                  {proximaFase && (
                    <Button
                      size="sm"
                      onClick={handleAvancarFase}
                      className="gap-1.5 text-xs bg-primary text-primary-foreground"
                    >
                      Avançar para {proximaFase.nome} <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* SLA e Próxima Ação */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 text-xs border-t mt-3">
            <div>
              <span className="text-muted-foreground block">Responsável Principal:</span>
              <span className="font-semibold text-foreground flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-primary" />{' '}
                {caso.responsavel_nome || 'Não atribuído'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block">Solicitante:</span>
              <span className="font-semibold text-foreground truncate block">
                {caso.solicitante_nome} ({caso.canal_origem})
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block">Primeira Resposta Humana:</span>
              <span className="font-mono text-foreground font-semibold">
                {caso.data_primeira_resposta_humana
                  ? formatarDataHoraBR(caso.data_primeira_resposta_humana)
                  : 'Pendente (SLA 2h)'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block">Fase Atual:</span>
              <span className="font-semibold text-primary">{caso.fase_atual_nome}</span>
            </div>
          </div>
        </DialogHeader>

        {/* Corpo com Abas */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as any)}
            className="space-y-4"
          >
            <TabsList className="bg-muted p-1">
              <TabsTrigger value="fluxo" className="text-xs gap-1.5">
                <PlayCircle className="w-4 h-4" /> Esteira & Fases
              </TabsTrigger>
              <TabsTrigger value="atividades" className="text-xs gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Atividades do Caso ({atividadesCaso.length})
              </TabsTrigger>
              <TabsTrigger value="mensagens" className="text-xs gap-1.5">
                <MessageSquare className="w-4 h-4" /> Comentários & Cliente (
                {comentariosCaso.length})
              </TabsTrigger>
              <TabsTrigger value="historico" className="text-xs gap-1.5">
                <FileText className="w-4 h-4" /> Histórico de Alterações
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: ESTEIRA & FASES */}
            <TabsContent value="fluxo" className="space-y-4">
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Progresso das Fases no Modelo (v{caso.versao_modelo})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  {fases.map((f, i) => {
                    const isPassed = i < faseAtualIndex
                    const isCurrent = i === faseAtualIndex

                    return (
                      <div
                        key={f.id}
                        className={cn(
                          'p-3 rounded-lg border text-xs flex flex-col justify-between gap-2',
                          isCurrent
                            ? 'border-primary bg-primary/5 font-semibold text-foreground ring-1 ring-primary/30'
                            : isPassed
                              ? 'border-emerald-500/40 bg-emerald-500/5 text-muted-foreground'
                              : 'border-border bg-muted/20 text-muted-foreground opacity-60',
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] uppercase font-bold">
                            Fase {f.ordem}
                          </span>
                          {isPassed ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          ) : isCurrent ? (
                            <Clock className="w-3.5 h-3.5 text-primary animate-pulse" />
                          ) : (
                            <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                          )}
                        </div>
                        <span className="text-sm font-semibold leading-tight">{f.nome}</span>
                        <span className="text-[10px] text-muted-foreground line-clamp-1">
                          {f.atividades.length} atividades
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Informações detalhadas do caso */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl border bg-muted/10 space-y-2 text-xs">
                  <h5 className="font-semibold text-foreground uppercase tracking-wider text-[11px]">
                    Vínculos do Atendimento
                  </h5>
                  <div className="space-y-1 text-muted-foreground">
                    <p>
                      <strong className="text-foreground">Cliente / Solicitante:</strong>{' '}
                      {caso.cliente_nome || caso.solicitante_nome}
                    </p>
                    <p>
                      <strong className="text-foreground">Imóvel:</strong>{' '}
                      {caso.imovel_titulo || 'Não vinculado'}
                    </p>
                    <p>
                      <strong className="text-foreground">Contrato:</strong>{' '}
                      {caso.contrato_id || 'Não vinculado'}
                    </p>
                    <p>
                      <strong className="text-foreground">Equipe:</strong> {caso.equipe || 'Geral'}
                    </p>
                    {caso.casos_relacionados && caso.casos_relacionados.length > 0 && (
                      <p>
                        <strong className="text-foreground">Casos Relacionados:</strong>{' '}
                        {caso.casos_relacionados.join(', ')}
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-xl border bg-muted/10 space-y-2 text-xs">
                  <h5 className="font-semibold text-foreground uppercase tracking-wider text-[11px]">
                    Próxima Ação & Justificativa
                  </h5>
                  <p className="text-foreground font-medium">
                    {caso.proxima_acao || 'Aguardando definição pelo responsável.'}
                  </p>
                  {caso.justificativa_prioridade && (
                    <p className="text-muted-foreground italic">
                      "Justificativa da prioridade: {caso.justificativa_prioridade}"
                    </p>
                  )}
                  {caso.motivo_reabertura && (
                    <p className="text-amber-800 dark:text-amber-300 bg-amber-500/10 p-2 rounded border border-amber-500/20">
                      <strong>Motivo de Reabertura:</strong> {caso.motivo_reabertura}
                    </p>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* TAB 2: ATIVIDADES DO CASO */}
            <TabsContent value="atividades" className="space-y-4">
              <div className="space-y-2">
                {atividadesCaso.map((ativ) => {
                  const isDone = ativ.status === 'Concluída'
                  const isAprovacao = ativ.tipo === 'Aprovação'

                  return (
                    <div
                      key={ativ.id}
                      className={cn(
                        'p-4 rounded-lg border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card',
                        isDone
                          ? 'border-emerald-500/30 bg-emerald-500/5 opacity-80'
                          : ativ.status === 'Atrasada'
                            ? 'border-destructive bg-destructive/5'
                            : 'border-border',
                      )}
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <button
                          type="button"
                          onClick={() => !isDone && !isAprovacao && handleConcluirAtividade(ativ)}
                          disabled={isDone || isAprovacao}
                          className={cn(
                            'mt-0.5 p-1 rounded-full border transition-colors',
                            isDone
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'border-muted-foreground/40 hover:border-primary',
                          )}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={cn(
                                'font-semibold text-sm text-foreground',
                                isDone && 'line-through text-muted-foreground',
                              )}
                            >
                              {ativ.titulo}
                            </span>
                            <Badge variant="outline" className="text-[10px] font-mono">
                              {ativ.tipo}
                            </Badge>
                            {ativ.is_paralela && (
                              <Badge variant="secondary" className="text-[10px]">
                                Paralela
                              </Badge>
                            )}
                            {ativ.ai_config_status && (
                              <Badge
                                variant="outline"
                                className="text-[10px] bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/30"
                              >
                                {ativ.ai_config_status}
                              </Badge>
                            )}
                          </div>
                          {ativ.descricao && (
                            <p className="text-xs text-muted-foreground mt-0.5">{ativ.descricao}</p>
                          )}
                          {ativ.documentos_obrigatorios &&
                            ativ.documentos_obrigatorios.length > 0 && (
                              <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                                <span className="font-semibold">Exige:</span>
                                <span>{ativ.documentos_obrigatorios.join(', ')}</span>
                              </div>
                            )}
                          {ativ.parecer_aprovacao && (
                            <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1 font-medium">
                              Aprovado por {ativ.aprovado_por}: "{ativ.parecer_aprovacao}"
                            </p>
                          )}
                          {ativ.motivo_recusa && (
                            <p className="text-xs text-destructive mt-1 font-medium">
                              Recusado: "{ativ.motivo_recusa}"
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center text-xs">
                        {isAprovacao && !isDone && ativ.status !== 'Recusada' ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedAtividadeParaRecusa(ativ)
                                setIsRecusarModalOpen(true)
                              }}
                              className="h-7 text-xs text-destructive border-destructive/30"
                            >
                              Recusar
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedAtividadeParaAprovacao(ativ)
                                setIsAprovarModalOpen(true)
                              }}
                              className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              Aprovar Alçada
                            </Button>
                          </>
                        ) : !isDone ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleConcluirAtividade(ativ)}
                            className="h-7 text-xs"
                          >
                            Concluir
                          </Button>
                        ) : (
                          <Badge className="bg-emerald-600 text-white text-[10px]">Concluída</Badge>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </TabsContent>

            {/* TAB 3: COMENTÁRIOS E MENSAGENS AO CLIENTE */}
            <TabsContent value="mensagens" className="space-y-4">
              <div className="space-y-3">
                <div className="p-3 rounded-lg border bg-muted/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold">Novo Registro / Resposta</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={comentarioTipo === 'interno' ? 'default' : 'outline'}
                        onClick={() => setComentarioTipo('interno')}
                        className="h-7 text-xs"
                      >
                        Nota Interna (Equipe)
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={comentarioTipo === 'externo_cliente' ? 'default' : 'outline'}
                        onClick={() => setComentarioTipo('externo_cliente')}
                        className="h-7 text-xs"
                      >
                        Mensagem ao Cliente (SLA Humano)
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    rows={2}
                    value={novoComentario}
                    onChange={(e) => setNovoComentario(e.target.value)}
                    placeholder={
                      comentarioTipo === 'interno'
                        ? 'Escreva uma anotação interna visível apenas para os gestores e equipe...'
                        : 'Escreva a mensagem que será enviada ao cliente com o protocolo do atendimento...'
                    }
                    className="text-xs"
                  />
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-muted-foreground">
                      {comentarioTipo === 'externo_cliente'
                        ? 'Conta como resposta humana oficial ao solicitante.'
                        : 'Segredo interno de governança da Gabriel.'}
                    </span>
                    <Button
                      size="sm"
                      onClick={handleEnviarComentario}
                      className="h-7 gap-1 text-xs"
                    >
                      <Send className="w-3.5 h-3.5" /> Registrar
                    </Button>
                  </div>
                </div>

                {/* Lista de Comentários */}
                <div className="space-y-2.5">
                  {comentariosCaso.map((c) => (
                    <div
                      key={c.id}
                      className={cn(
                        'p-3 rounded-lg border text-xs space-y-1',
                        c.visibilidade === 'interno'
                          ? 'bg-amber-500/5 border-amber-500/30'
                          : 'bg-primary/5 border-primary/20',
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-foreground">{c.autor_nome}</span>
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-[10px] py-0',
                              c.visibilidade === 'interno'
                                ? 'bg-amber-500/10 text-amber-800 dark:text-amber-300'
                                : 'bg-primary/10 text-primary',
                            )}
                          >
                            {c.visibilidade === 'interno' ? 'Nota Interna' : 'Mensagem ao Cliente'}
                          </Badge>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {c.created?.slice(0, 16)}
                        </span>
                      </div>
                      <p className="text-foreground leading-relaxed">{c.mensagem}</p>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* TAB 4: HISTÓRICO DE ALTERAÇÕES */}
            <TabsContent value="historico" className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Rastreabilidade de Etapas & Auditoria
              </h4>
              <div className="border rounded-lg divide-y text-xs">
                {(caso.historico_etapas || []).map((h, idx) => (
                  <div key={idx} className="p-3 flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className="font-semibold text-foreground">{h.fase}</span>
                      <p className="text-muted-foreground">Responsável: {h.usuario}</p>
                      {h.motivo_retorno && (
                        <p className="text-destructive font-medium">
                          Motivo/Observação: {h.motivo_retorno}
                        </p>
                      )}
                    </div>
                    <div className="text-right font-mono text-[11px] text-muted-foreground shrink-0">
                      <span>Início: {h.data_inicio?.slice(0, 16)}</span>
                      {h.data_conclusao && <p>Fim: {h.data_conclusao.slice(0, 16)}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>

      {/* MODAL: DEVOLVER ETAPA */}
      <Dialog open={isDevolverModalOpen} onOpenChange={setIsDevolverModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Devolver Caso para Etapa Anterior</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs">Fase de Destino</Label>
              <Select value={faseDestinoId} onValueChange={setFaseDestinoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione para qual etapa retornar" />
                </SelectTrigger>
                <SelectContent>
                  {fases
                    .filter((_, i) => i < faseAtualIndex)
                    .map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        Fase {f.ordem}: {f.nome}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Motivo / Complemento Exigido</Label>
              <Textarea
                rows={3}
                value={motivoDevolucao}
                onChange={(e) => setMotivoDevolucao(e.target.value)}
                placeholder="Explique o que precisa ser ajustado ou qual documento faltou..."
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" size="sm" onClick={() => setIsDevolverModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmarDevolucao}
              className="bg-amber-600 text-white"
            >
              Confirmar Retorno
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL: REABRIR CASO */}
      <Dialog open={isReabrirModalOpen} onOpenChange={setIsReabrirModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reabrir Caso de Atendimento</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs">Motivo da Reabertura</Label>
              <Textarea
                rows={3}
                value={motivoReabertura}
                onChange={(e) => setMotivoReabertura(e.target.value)}
                placeholder="Ex: O cliente retornou informando que o vazamento voltou a ocorrer..."
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" size="sm" onClick={() => setIsReabrirModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmarReabertura}
              className="bg-primary text-primary-foreground"
            >
              Confirmar Reabertura
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL: APROVAR ALÇADA */}
      <Dialog open={isAprovarModalOpen} onOpenChange={setIsAprovarModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Aprovação de Alçada (Gestor)</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <p className="text-muted-foreground">
              Atividade:{' '}
              <strong className="text-foreground">{selectedAtividadeParaAprovacao?.titulo}</strong>
            </p>
            <div className="space-y-1.5">
              <Label className="text-xs">Parecer de Aprovação</Label>
              <Textarea
                rows={2}
                value={parecerAprovacao}
                onChange={(e) => setParecerAprovacao(e.target.value)}
                placeholder="Ex: Aprovado conforme limites de alçada da unidade Jaú."
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" size="sm" onClick={() => setIsAprovarModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmarAprovacao}
              className="bg-emerald-600 text-white"
            >
              Conceder Aprovação
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL: RECUSAR ALÇADA */}
      <Dialog open={isRecusarModalOpen} onOpenChange={setIsRecusarModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Recusar Aprovação de Alçada</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <p className="text-muted-foreground">
              Atividade:{' '}
              <strong className="text-foreground">{selectedAtividadeParaRecusa?.titulo}</strong>
            </p>
            <div className="space-y-1.5">
              <Label className="text-xs">Justificativa da Recusa</Label>
              <Textarea
                rows={3}
                value={motivoRecusa}
                onChange={(e) => setMotivoRecusa(e.target.value)}
                placeholder="Informe o motivo da reprovação para que a equipe revise a solicitação..."
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" size="sm" onClick={() => setIsRecusarModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmarRecusa}
              className="bg-destructive text-destructive-foreground"
            >
              Confirmar Recusa
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
