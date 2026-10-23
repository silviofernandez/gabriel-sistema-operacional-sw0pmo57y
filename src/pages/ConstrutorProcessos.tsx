import { useState, useMemo } from 'react'
import {
  Workflow,
  Plus,
  Copy,
  UploadCloud,
  Layers,
  ArrowRight,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileText,
  FileCheck,
  Bot,
  Play,
  RotateCcw,
  History,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { useProcessos } from '@/stores/useProcessosStore'
import {
  ModeloProcesso,
  FaseModeloDef,
  AtividadeModeloDef,
  TipoAtividade,
  GabrielRole,
  VersaoProcessoSnapshot,
} from '@/types/processos'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

export default function ConstrutorProcessos() {
  const {
    modelos,
    selectedModelo,
    setSelectedModelo,
    salvarModelo,
    publicarModelo,
    duplicarModelo,
    fetchVersoes,
  } = useProcessos()
  const { toast } = useToast()

  // Estado do modelo em edição local
  const [editingModelo, setEditingModelo] = useState<ModeloProcesso | null>(null)
  const [activeTab, setActiveTab] = useState<'visual' | 'simulador' | 'historico'>('visual')

  // Modais
  const [isNewProcessModalOpen, setIsNewProcessModalOpen] = useState(false)
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false)
  const [publishNote, setPublishNote] = useState('')
  const [versoesHistorico, setVersoesHistorico] = useState<VersaoProcessoSnapshot[]>([])

  // Modal para adicionar/editar atividade
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false)
  const [targetFaseId, setTargetFaseId] = useState<string | null>(null)
  const [activityForm, setActivityForm] = useState<Partial<AtividadeModeloDef>>({
    titulo: '',
    descricao: '',
    tipo: 'Humana',
    funcao_responsavel: 'Atendimento',
    prazo_horas_uteis: 4,
    obrigatoria: true,
    is_paralela: false,
    documentos_obrigatorios: [],
  })
  const [docInput, setDocInput] = useState('')

  // Simulador interativo
  const [simulationState, setSimulationState] = useState<{
    faseIndex: number
    atividadesCompletas: string[]
    logs: string[]
  }>({
    faseIndex: 0,
    atividadesCompletas: [],
    logs: ['Simulação iniciada com sucesso. Nenhuma alteração aplicada ao banco de dados.'],
  })

  // Seleção de modelo para editar
  const handleSelectModelo = (m: ModeloProcesso) => {
    setSelectedModelo(m)
    setEditingModelo(JSON.parse(JSON.stringify(m)))
    setSimulationState({
      faseIndex: 0,
      atividadesCompletas: [],
      logs: [`Simulação pronta para o processo: ${m.nome}`],
    })
  }

  // Criar novo modelo em branco
  const handleCreateNew = () => {
    const novo: ModeloProcesso = {
      id: '',
      codigo: `MOD-${Date.now().toString().slice(-6)}`,
      nome: 'Novo Processo Operacional',
      descricao: 'Descrição do processo configurável pela interface.',
      categoria: 'Atendimento',
      status: 'rascunho',
      versao_atual: 1,
      fases: [
        {
          id: `fase_${Date.now()}_1`,
          ordem: 1,
          nome: 'Fase 1: Entrada & Triagem',
          descricao: 'Triagem preliminar e coleta de informações.',
          atividades: [
            {
              id: `ativ_${Date.now()}_1`,
              titulo: 'Identificar cliente e registrar solicitação',
              tipo: 'Humana',
              funcao_responsavel: 'Atendimento',
              prazo_horas_uteis: 2,
              obrigatoria: true,
            },
          ],
        },
      ],
      configuracao_sla: {
        sla_primeira_resposta_horas: 2,
        sla_resolucao_horas: 24,
      },
      is_demo: true,
    }
    setEditingModelo(novo)
    setIsNewProcessModalOpen(false)
  }

  // Fases: adicionar nova fase
  const handleAddFase = () => {
    if (!editingModelo) return
    const novaOrdem = editingModelo.fases.length + 1
    const novaFase: FaseModeloDef = {
      id: `fase_${Date.now()}`,
      ordem: novaOrdem,
      nome: `Fase ${novaOrdem}: Nova Etapa`,
      descricao: 'Descrição dos passos e critérios desta etapa.',
      atividades: [],
    }
    setEditingModelo({
      ...editingModelo,
      fases: [...editingModelo.fases, novaFase],
    })
  }

  // Fases: remover
  const handleRemoveFase = (faseId: string) => {
    if (!editingModelo) return
    if (editingModelo.fases.length <= 1) {
      toast({
        title: 'Operação não permitida',
        description: 'O processo deve ter no mínimo uma fase.',
        variant: 'destructive',
      })
      return
    }
    const filtered = editingModelo.fases
      .filter((f) => f.id !== faseId)
      .map((f, idx) => ({ ...f, ordem: idx + 1 }))
    setEditingModelo({ ...editingModelo, fases: filtered })
  }

  // Fases: reordenar
  const handleMoveFase = (index: number, direction: 'up' | 'down') => {
    if (!editingModelo) return
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= editingModelo.fases.length) return

    const fases = [...editingModelo.fases]
    const [moved] = fases.splice(index, 1)
    fases.splice(targetIndex, 0, moved)
    const reordered = fases.map((f, i) => ({ ...f, ordem: i + 1 }))
    setEditingModelo({ ...editingModelo, fases: reordered })
  }

  // Atividades: abrir modal
  const handleOpenAddActivity = (faseId: string) => {
    setTargetFaseId(faseId)
    setActivityForm({
      titulo: '',
      descricao: '',
      tipo: 'Humana',
      funcao_responsavel: 'Atendimento',
      prazo_horas_uteis: 4,
      obrigatoria: true,
      is_paralela: false,
      documentos_obrigatorios: [],
    })
    setDocInput('')
    setIsActivityModalOpen(true)
  }

  const handleSaveActivity = () => {
    if (!editingModelo || !targetFaseId) return
    if (!activityForm.titulo?.trim()) {
      toast({
        title: 'Título obrigatório',
        description: 'Informe o título da atividade.',
        variant: 'destructive',
      })
      return
    }

    const novaAtiv: AtividadeModeloDef = {
      id: `ativ_${Date.now()}`,
      titulo: activityForm.titulo,
      descricao: activityForm.descricao || '',
      tipo: (activityForm.tipo as TipoAtividade) || 'Humana',
      funcao_responsavel: (activityForm.funcao_responsavel as GabrielRole) || 'Atendimento',
      prazo_horas_uteis: Number(activityForm.prazo_horas_uteis) || 4,
      obrigatoria: activityForm.obrigatoria !== false,
      is_paralela: !!activityForm.is_paralela,
      documentos_obrigatorios: activityForm.documentos_obrigatorios || [],
      etapa_retorno_id: activityForm.etapa_retorno_id || undefined,
      ai_config_status: activityForm.tipo === 'IA' ? 'Aguardando configuração' : undefined,
    }

    const updatedFases = editingModelo.fases.map((f) => {
      if (f.id === targetFaseId) {
        return { ...f, atividades: [...f.atividades, novaAtiv] }
      }
      return f
    })

    setEditingModelo({ ...editingModelo, fases: updatedFases })
    setIsActivityModalOpen(false)
  }

  const handleRemoveActivity = (faseId: string, ativId: string) => {
    if (!editingModelo) return
    const updatedFases = editingModelo.fases.map((f) => {
      if (f.id === faseId) {
        return { ...f, atividades: f.atividades.filter((a) => a.id !== ativId) }
      }
      return f
    })
    setEditingModelo({ ...editingModelo, fases: updatedFases })
  }

  // Salvar rascunho
  const handleSalvarRascunho = async () => {
    if (!editingModelo) return
    const saved = await salvarModelo(editingModelo)
    if (saved) {
      setEditingModelo(saved)
      toast({
        title: 'Rascunho salvo',
        description: `O modelo "${saved.nome}" foi salvo com sucesso.`,
      })
    }
  }

  // Publicar versão
  const handleConfirmPublish = async () => {
    if (!editingModelo) return

    // Validação de publicação: sem fases vazias
    for (const f of editingModelo.fases) {
      if (f.atividades.length === 0) {
        toast({
          title: 'Não é possível publicar',
          description: `A fase "${f.nome}" não possui nenhuma atividade configurada. Adicione ao menos uma atividade antes de publicar.`,
          variant: 'destructive',
        })
        return
      }
    }

    const res = await publicarModelo(editingModelo.id, publishNote)
    if (res.sucesso) {
      toast({
        title: 'Processo Publicado com Sucesso',
        description: `Nova versão ${res.novaVersao} agora está ativa para novos casos. Casos em andamento preservam suas versões originais.`,
      })
      setIsPublishModalOpen(false)
      setPublishNote('')
    } else {
      toast({
        title: 'Erro na publicação',
        description: res.erro || 'Falha ao publicar.',
        variant: 'destructive',
      })
    }
  }

  // Carregar histórico de versões
  const handleLoadHistorico = async () => {
    if (!editingModelo?.id) return
    const list = await fetchVersoes(editingModelo.id)
    setVersoesHistorico(list)
    setActiveTab('historico')
  }

  // Simulação interativa do fluxo
  const handleSimularAvanco = () => {
    if (!editingModelo) return
    const curFase = editingModelo.fases[simulationState.faseIndex]
    if (!curFase) return

    // Checa atividades pendentes
    const pendentes = curFase.atividades.filter(
      (a) => a.obrigatoria && !simulationState.atividadesCompletas.includes(a.id),
    )

    if (pendentes.length > 0) {
      setSimulationState((prev) => ({
        ...prev,
        logs: [
          `[BLOQUEIO DE SIMULAÇÃO] A fase "${curFase.nome}" não pode ser concluída pois há ${pendentes.length} atividade(s) obrigatória(s) pendente(s): ${pendentes.map((p) => p.titulo).join(', ')}.`,
          ...prev.logs,
        ],
      }))
      return
    }

    if (simulationState.faseIndex + 1 < editingModelo.fases.length) {
      const proxFase = editingModelo.fases[simulationState.faseIndex + 1]
      setSimulationState((prev) => ({
        ...prev,
        faseIndex: prev.faseIndex + 1,
        logs: [
          `[AVANÇO DE FASE] O caso fictício avançou com sucesso para "${proxFase.nome}". Próximas ações liberadas.`,
          ...prev.logs,
        ],
      }))
    } else {
      setSimulationState((prev) => ({
        ...prev,
        logs: [
          `[CONCLUSÃO DO PROCESSO] O fluxo completo foi executado com sucesso até o desfecho final! Validação OK.`,
          ...prev.logs,
        ],
      }))
    }
  }

  const toggleSimularAtividade = (ativId: string) => {
    setSimulationState((prev) => {
      const isDone = prev.atividadesCompletas.includes(ativId)
      const nextDone = isDone
        ? prev.atividadesCompletas.filter((id) => id !== ativId)
        : [...prev.atividadesCompletas, ativId]
      return {
        ...prev,
        atividadesCompletas: nextDone,
        logs: [
          `Atividade ${ativId} marcada como ${isDone ? 'Pendente' : 'Concluída'} na simulação.`,
          ...prev.logs,
        ],
      }
    })
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up max-w-7xl mx-auto w-full pb-12">
      {/* Header com seleção de modelo e botões de ação */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Workflow className="w-8 h-8 text-primary" /> Construtor de Processos
            </h1>
            <Badge
              variant="outline"
              className="bg-primary/5 text-primary border-primary/20 text-xs"
            >
              Etapa 1
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Crie e altere processos, etapas, atividades sequenciais/paralelas, formulários e regras
            sem editar código.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsNewProcessModalOpen(true)}
            className="gap-1.5"
          >
            <Plus className="w-4 h-4" /> Novo Processo
          </Button>

          {editingModelo?.id && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => duplicarModelo(editingModelo.id)}
              className="gap-1.5"
            >
              <Copy className="w-4 h-4" /> Duplicar Modelo
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleSalvarRascunho}
            disabled={!editingModelo}
            className="gap-1.5"
          >
            Salvar Rascunho
          </Button>

          <Button
            size="sm"
            onClick={() => setIsPublishModalOpen(true)}
            disabled={!editingModelo}
            className="gap-1.5 bg-primary text-primary-foreground shadow-sm"
          >
            <UploadCloud className="w-4 h-4" /> Publicar Versão
          </Button>
        </div>
      </div>

      {/* Seletor de Modelo Ativo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-muted/30 p-4 rounded-xl border">
        <div className="space-y-1.5 md:col-span-1">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Modelo em Edição
          </Label>
          <Select
            value={editingModelo?.id || ''}
            onValueChange={(val) => {
              const m = modelos.find((x) => x.id === val)
              if (m) handleSelectModelo(m)
            }}
          >
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Selecione um processo cadastrado" />
            </SelectTrigger>
            <SelectContent>
              {modelos.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.nome} (v{m.versao_atual}) - {m.status.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {editingModelo && (
          <div className="md:col-span-2 flex items-center justify-between gap-4 flex-wrap text-xs">
            <div>
              <span className="text-muted-foreground block">Código & Versão:</span>
              <span className="font-mono font-semibold text-foreground">
                {editingModelo.codigo} · Versão {editingModelo.versao_atual}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block">Status Atual:</span>
              <Badge
                className={cn(
                  'text-xs font-semibold',
                  editingModelo.status === 'publicado'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-amber-500 text-white',
                )}
              >
                {editingModelo.status.toUpperCase()}
              </Badge>
            </div>
            <div>
              <span className="text-muted-foreground block">Garantia de Versionamento:</span>
              <span className="text-foreground">Casos em andamento mantêm a versão original</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLoadHistorico}
              className="gap-1 text-xs"
            >
              <History className="w-3.5 h-3.5" /> Histórico de Versões
            </Button>
          </div>
        )}
      </div>

      {editingModelo ? (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-6">
          <TabsList className="bg-muted p-1">
            <TabsTrigger value="visual" className="gap-1.5 data-[state=active]:bg-card">
              <Layers className="w-4 h-4" /> Construtor Visual de Fases & Atividades
            </TabsTrigger>
            <TabsTrigger value="simulador" className="gap-1.5 data-[state=active]:bg-card">
              <Play className="w-4 h-4 text-emerald-600" /> Simulador de Fluxo
            </TabsTrigger>
            <TabsTrigger value="historico" className="gap-1.5 data-[state=active]:bg-card">
              <History className="w-4 h-4" /> Histórico de Versões
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: CONSTRUTOR VISUAL */}
          <TabsContent value="visual" className="space-y-6">
            {/* Dados básicos do modelo */}
            <Card className="border shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">
                  Configuração Geral do Processo
                </CardTitle>
                <CardDescription className="text-xs">
                  Identificação do processo, categoria e prazos padrão de atendimento.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Nome do Processo</Label>
                  <Input
                    value={editingModelo.nome}
                    onChange={(e) => setEditingModelo({ ...editingModelo, nome: e.target.value })}
                    placeholder="Ex: Atendimento Geral"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Categoria</Label>
                  <Select
                    value={editingModelo.categoria || 'Atendimento'}
                    onValueChange={(val) => setEditingModelo({ ...editingModelo, categoria: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Atendimento">Atendimento & Triagem</SelectItem>
                      <SelectItem value="Contratos">Contratos & Locação</SelectItem>
                      <SelectItem value="Manutenção">Manutenção & Reparos</SelectItem>
                      <SelectItem value="Financeiro">Financeiro & Cobrança</SelectItem>
                      <SelectItem value="Vistorias">Vistorias</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">SLA Primeira Resposta (Horas Úteis)</Label>
                  <Input
                    type="number"
                    value={editingModelo.configuracao_sla?.sla_primeira_resposta_horas || 2}
                    onChange={(e) =>
                      setEditingModelo({
                        ...editingModelo,
                        configuracao_sla: {
                          ...editingModelo.configuracao_sla,
                          sla_primeira_resposta_horas: Number(e.target.value) || 2,
                          sla_resolucao_horas:
                            editingModelo.configuracao_sla?.sla_resolucao_horas || 24,
                        },
                      })
                    }
                  />
                </div>
                <div className="md:col-span-3 space-y-1.5">
                  <Label className="text-xs">Descrição Operacional</Label>
                  <Textarea
                    rows={2}
                    value={editingModelo.descricao || ''}
                    onChange={(e) =>
                      setEditingModelo({ ...editingModelo, descricao: e.target.value })
                    }
                    placeholder="Explique o objetivo e quando este processo deve ser instaurado..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Fases do Processo em Colunas / Sequência */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <Layers className="w-5 h-5 text-primary" /> Fases & Atividades
                    Sequenciais/Paralelas
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Hierarquia: Processo → Fases → Cards de Casos → Atividades (com tipo explícito,
                    aprovação e prazos).
                  </p>
                </div>
                <Button size="sm" onClick={handleAddFase} className="gap-1.5">
                  <Plus className="w-4 h-4" /> Adicionar Fase
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {editingModelo.fases.map((fase, idx) => (
                  <Card key={fase.id} className="border-l-4 border-l-primary shadow-sm bg-card">
                    <CardHeader className="pb-3 bg-muted/15 border-b">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1">
                          <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                          <Badge variant="outline" className="font-mono text-xs bg-background">
                            Fase {fase.ordem}
                          </Badge>
                          <Input
                            value={fase.nome}
                            onChange={(e) => {
                              const updatedFases = editingModelo.fases.map((f) =>
                                f.id === fase.id ? { ...f, nome: e.target.value } : f,
                              )
                              setEditingModelo({ ...editingModelo, fases: updatedFases })
                            }}
                            className="font-bold text-base h-8 bg-background max-w-sm"
                          />
                        </div>

                        <div className="flex items-center gap-1.5 self-end sm:self-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            disabled={idx === 0}
                            onClick={() => handleMoveFase(idx, 'up')}
                            title="Mover para cima"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            disabled={idx === editingModelo.fases.length - 1}
                            onClick={() => handleMoveFase(idx, 'down')}
                            title="Mover para baixo"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={() => handleRemoveFase(fase.id)}
                            title="Excluir fase"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <Input
                        value={fase.descricao || ''}
                        onChange={(e) => {
                          const updatedFases = editingModelo.fases.map((f) =>
                            f.id === fase.id ? { ...f, descricao: e.target.value } : f,
                          )
                          setEditingModelo({ ...editingModelo, fases: updatedFases })
                        }}
                        placeholder="Objetivo resumido desta fase..."
                        className="text-xs h-7 bg-transparent border-dashed text-muted-foreground mt-2"
                      />
                    </CardHeader>

                    <CardContent className="p-4 space-y-3">
                      {/* Lista de Atividades da Fase */}
                      <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        <span>Atividades Obrigatórias & Paralelas ({fase.atividades.length})</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenAddActivity(fase.id)}
                          className="h-7 text-xs gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" /> Adicionar Atividade
                        </Button>
                      </div>

                      {fase.atividades.length > 0 ? (
                        <div className="grid gap-2.5">
                          {fase.atividades.map((ativ) => (
                            <div
                              key={ativ.id}
                              className={cn(
                                'flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors gap-3',
                                ativ.tipo === 'IA' && 'border-amber-500/30 bg-amber-500/5',
                              )}
                            >
                              <div className="flex items-start gap-3 flex-1 min-w-0">
                                <div className="mt-0.5">
                                  {ativ.tipo === 'IA' ? (
                                    <Bot className="w-4 h-4 text-amber-600" />
                                  ) : ativ.tipo === 'Aprovação' ? (
                                    <FileCheck className="w-4 h-4 text-primary" />
                                  ) : ativ.tipo === 'Formulário' ? (
                                    <FileText className="w-4 h-4 text-emerald-600" />
                                  ) : (
                                    <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-semibold text-sm text-foreground">
                                      {ativ.titulo}
                                    </span>
                                    <Badge variant="outline" className="text-[10px] font-mono">
                                      {ativ.tipo}
                                    </Badge>
                                    {ativ.is_paralela && (
                                      <Badge
                                        variant="secondary"
                                        className="text-[10px] bg-blue-500/10 text-blue-700 dark:text-blue-300"
                                      >
                                        Paralela
                                      </Badge>
                                    )}
                                    {ativ.ai_config_status && (
                                      <Badge
                                        variant="outline"
                                        className="text-[10px] bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/30"
                                      >
                                        Aguardando configuração
                                      </Badge>
                                    )}
                                  </div>
                                  {ativ.descricao && (
                                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                      {ativ.descricao}
                                    </p>
                                  )}
                                  {ativ.documentos_obrigatorios &&
                                    ativ.documentos_obrigatorios.length > 0 && (
                                      <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                                        <span className="font-medium">Documentos exigidos:</span>
                                        <span>{ativ.documentos_obrigatorios.join(', ')}</span>
                                      </div>
                                    )}
                                </div>
                              </div>

                              <div className="flex items-center gap-3 shrink-0 self-end sm:self-center text-xs">
                                <div className="flex items-center gap-1 text-muted-foreground font-mono">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>{ativ.prazo_horas_uteis}h úteis</span>
                                </div>
                                <Badge variant="outline" className="text-[11px]">
                                  {ativ.funcao_responsavel || 'Atendimento'}
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                  onClick={() => handleRemoveActivity(fase.id, ativ.id)}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center p-6 border border-dashed rounded-lg text-xs text-muted-foreground">
                          Nenhuma atividade nesta fase. Adicione uma atividade para viabilizar a
                          publicação do modelo.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: SIMULADOR DE FLUXO */}
          <TabsContent value="simulador" className="space-y-6">
            <Card className="border shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Play className="w-5 h-5 text-emerald-600" /> Simulador Interativo do Processo
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Teste a ordem das fases, bloqueios de atividades pendentes e avanços antes de
                      publicar a versão.
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setSimulationState({
                        faseIndex: 0,
                        atividadesCompletas: [],
                        logs: ['Simulação reiniciada.'],
                      })
                    }
                    className="gap-1.5"
                  >
                    <RotateCcw className="w-4 h-4" /> Reiniciar Simulação
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Stepper das Fases */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  {editingModelo.fases.map((f, i) => (
                    <div key={f.id} className="flex items-center gap-2 shrink-0">
                      <div
                        className={cn(
                          'flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium',
                          i === simulationState.faseIndex
                            ? 'bg-primary text-primary-foreground border-primary font-bold shadow-xs'
                            : i < simulationState.faseIndex
                              ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/30'
                              : 'bg-muted/40 text-muted-foreground',
                        )}
                      >
                        <span>
                          {i + 1}. {f.nome}
                        </span>
                      </div>
                      {i < editingModelo.fases.length - 1 && (
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  ))}
                </div>

                {/* Fase Ativa na Simulação */}
                {editingModelo.fases[simulationState.faseIndex] && (
                  <div className="p-4 rounded-xl border bg-card space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs uppercase font-bold text-primary">
                          Etapa em Simulação
                        </span>
                        <h4 className="text-base font-bold text-foreground">
                          {editingModelo.fases[simulationState.faseIndex].nome}
                        </h4>
                      </div>
                      <Button onClick={handleSimularAvanco} className="gap-2">
                        Tentar Avançar Fase <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        Marque as atividades concluídas para liberar o avanço:
                      </Label>
                      {editingModelo.fases[simulationState.faseIndex].atividades.map((a) => {
                        const isDone = simulationState.atividadesCompletas.includes(a.id)
                        return (
                          <div
                            key={a.id}
                            onClick={() => toggleSimularAtividade(a.id)}
                            className={cn(
                              'flex items-center justify-between p-3 rounded-lg border text-xs cursor-pointer transition-colors',
                              isDone
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
                                : 'bg-muted/20 hover:bg-muted/40',
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <CheckCircle2
                                className={cn(
                                  'w-4 h-4',
                                  isDone ? 'text-emerald-600' : 'text-muted-foreground',
                                )}
                              />
                              <span className="font-semibold">{a.titulo}</span>
                              {a.obrigatoria && (
                                <Badge variant="outline" className="text-[10px]">
                                  Obrigatória
                                </Badge>
                              )}
                            </div>
                            <span className="font-mono text-[11px] text-muted-foreground">
                              {a.tipo} · {a.prazo_horas_uteis}h úteis
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Logs do Simulador */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Console de Validação e Eventos
                  </Label>
                  <div className="p-3 rounded-lg bg-black text-emerald-400 font-mono text-xs max-h-48 overflow-y-auto space-y-1">
                    {simulationState.logs.map((log, idx) => (
                      <div key={idx} className="leading-relaxed">
                        &gt; {log}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: HISTÓRICO DE VERSÕES */}
          <TabsContent value="historico" className="space-y-6">
            <Card className="border shadow-sm">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <History className="w-5 h-5 text-primary" /> Histórico de Versões Publicadas
                </CardTitle>
                <CardDescription className="text-xs">
                  Snapshots imutáveis gravados a cada publicação. Alterações no modelo não alteram
                  silenciosamente casos em andamento.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {versoesHistorico.length > 0 ? (
                  <div className="space-y-3">
                    {versoesHistorico.map((v) => (
                      <div
                        key={v.id}
                        className="p-4 rounded-lg border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-foreground">
                              Versão {v.versao}
                            </span>
                            <Badge variant="outline" className="font-mono text-[10px]">
                              {v.snapshot?.fases?.length || 0} fases configuradas
                            </Badge>
                          </div>
                          <p className="text-muted-foreground">
                            {v.nota_versao || 'Sem notas registradas.'}
                          </p>
                          <span className="text-[11px] text-muted-foreground block">
                            Publicado por: {v.publicado_por || 'Administrador'} ·{' '}
                            {v.created?.slice(0, 16)}
                          </span>
                        </div>
                        <Badge variant="secondary" className="font-mono self-start sm:self-center">
                          Snapshot Imutável
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-8 text-xs text-muted-foreground border border-dashed rounded-lg">
                    Nenhuma publicação prévia registrada para este modelo.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Card className="border-dashed p-12 text-center text-muted-foreground space-y-3">
          <Workflow className="w-12 h-12 mx-auto text-primary/40" />
          <h3 className="font-bold text-lg text-foreground">Nenhum Processo Selecionado</h3>
          <p className="text-sm max-w-md mx-auto">
            Selecione um processo existente na lista acima ou clique em "Novo Processo" para começar
            a desenhar fases e regras.
          </p>
          <Button onClick={() => setIsNewProcessModalOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Criar Primeiro Processo
          </Button>
        </Card>
      )}

      {/* MODAL: NOVO PROCESSO */}
      <Dialog open={isNewProcessModalOpen} onOpenChange={setIsNewProcessModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Criar Novo Processo</DialogTitle>
            <DialogDescription className="text-xs">
              Inicie um modelo configurável para Jaú, Pederneiras e Lençóis Paulista.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-xs text-muted-foreground">
              O novo processo começará como Rascunho. Você poderá adicionar fases, atividades,
              aprovações e formulários antes de publicar.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewProcessModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateNew}>Criar Processo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: PUBLICAR VERSÃO */}
      <Dialog open={isPublishModalOpen} onOpenChange={setIsPublishModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-primary" /> Publicar Versão do Processo
            </DialogTitle>
            <DialogDescription className="text-xs">
              Gera um snapshot imutável no banco de dados. Os casos em andamento continuarão usando
              a versão com a qual foram abertos.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-900 dark:text-amber-200">
              <span className="font-bold block mb-1">Regra de Integridade:</span>
              Casos já abertos permanecem na sua versão atual. Apenas novas solicitações usarão a
              versão que você publicar agora.
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Nota de Atualização da Versão</Label>
              <Textarea
                rows={3}
                value={publishNote}
                onChange={(e) => setPublishNote(e.target.value)}
                placeholder="Ex: Ajuste no prazo de triagem e inclusão de validação de documentos obrigatórios..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPublishModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmPublish} className="bg-primary text-primary-foreground">
              Confirmar Publicação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: ADICIONAR ATIVIDADE */}
      <Dialog open={isActivityModalOpen} onOpenChange={setIsActivityModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Adicionar Atividade à Fase</DialogTitle>
            <DialogDescription className="text-xs">
              Defina o tipo explícito, o responsável, prazo útil e exigências de
              documentos/aprovação.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs">Título da Ação</Label>
              <Input
                value={activityForm.titulo || ''}
                onChange={(e) => setActivityForm({ ...activityForm, titulo: e.target.value })}
                placeholder="Ex: Checar certidão negativa de débitos"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Tipo de Atividade</Label>
                <Select
                  value={activityForm.tipo || 'Humana'}
                  onValueChange={(val) =>
                    setActivityForm({ ...activityForm, tipo: val as TipoAtividade })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Humana">Humana</SelectItem>
                    <SelectItem value="Automação por regra">Automação por regra</SelectItem>
                    <SelectItem value="IA">IA (Aguardando configuração)</SelectItem>
                    <SelectItem value="Aprovação">Aprovação (Alçada)</SelectItem>
                    <SelectItem value="Formulário">Formulário de Entrada</SelectItem>
                    <SelectItem value="Aguardar evento externo">Aguardar evento externo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Função Responsável</Label>
                <Select
                  value={activityForm.funcao_responsavel || 'Atendimento'}
                  onValueChange={(val) =>
                    setActivityForm({ ...activityForm, funcao_responsavel: val as GabrielRole })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Atendimento">Atendimento</SelectItem>
                    <SelectItem value="Gestor">Gestor</SelectItem>
                    <SelectItem value="Contratos">Contratos</SelectItem>
                    <SelectItem value="Manutenção">Manutenção</SelectItem>
                    <SelectItem value="Financeiro">Financeiro</SelectItem>
                    <SelectItem value="Administrador">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Prazo Estimado (Horas Úteis)</Label>
                <Input
                  type="number"
                  value={activityForm.prazo_horas_uteis || 4}
                  onChange={(e) =>
                    setActivityForm({
                      ...activityForm,
                      prazo_horas_uteis: Number(e.target.value) || 4,
                    })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Execução Paralela</Label>
                <Select
                  value={activityForm.is_paralela ? 'sim' : 'nao'}
                  onValueChange={(val) =>
                    setActivityForm({ ...activityForm, is_paralela: val === 'sim' })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nao">Sequencial (Padrão)</SelectItem>
                    <SelectItem value="sim">Paralela (Executa junto com outras)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Documentos Obrigatórios */}
            <div className="space-y-2 pt-1 border-t">
              <Label className="text-xs font-semibold">Documentos Exigidos para Conclusão</Label>
              <div className="flex gap-2">
                <Input
                  value={docInput}
                  onChange={(e) => setDocInput(e.target.value)}
                  placeholder="Ex: Comprovante de Renda, RG com foto..."
                  className="h-8 text-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (docInput.trim()) {
                      const current = activityForm.documentos_obrigatorios || []
                      setActivityForm({
                        ...activityForm,
                        documentos_obrigatorios: [...current, docInput.trim()],
                      })
                      setDocInput('')
                    }
                  }}
                  className="h-8 text-xs"
                >
                  Adicionar
                </Button>
              </div>

              {(activityForm.documentos_obrigatorios || []).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {(activityForm.documentos_obrigatorios || []).map((doc, idx) => (
                    <Badge key={idx} variant="secondary" className="text-[11px] gap-1">
                      {doc}
                      <button
                        type="button"
                        onClick={() => {
                          const updated = (activityForm.documentos_obrigatorios || []).filter(
                            (_, i) => i !== idx,
                          )
                          setActivityForm({ ...activityForm, documentos_obrigatorios: updated })
                        }}
                        className="hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsActivityModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveActivity}>Adicionar Atividade</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
