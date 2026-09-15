import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import {
  Target,
  Trophy,
  Plus,
  Coins,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  Edit,
  TrendingUp,
  Sparkles,
  Users,
  Eye,
  AlertCircle,
} from 'lucide-react'
import usePipelineAccess from '@/stores/usePipelineAccess'
import useAuthStore from '@/stores/useAuthStore'
import useDataStore from '@/stores/useDataStore'
import { useToast } from '@/hooks/use-toast'
import { MetaPremioItem, MetaMetricaTipo } from '@/types/pipeline'
import { calculateMetaProgress, formatBRL, METRICA_LABELS } from '@/utils/metaCalculations'

export function GoalsManagement() {
  const {
    stages,
    metas,
    tarefas,
    metrics,
    permissions,
    addMetaPremio,
    updateMetaPremio,
    removeMetaPremio,
  } = usePipelineAccess()
  const { user } = useAuthStore()
  const { db } = useDataStore()
  const { toast } = useToast()

  const [selectedEtapaFilter, setSelectedEtapaFilter] = useState<string>('todas')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMeta, setEditingMeta] = useState<MetaPremioItem | null>(null)

  // Form State
  const [formEtapaId, setFormEtapaId] = useState<string>('1')
  const [formTitulo, setFormTitulo] = useState<string>('')
  const [formDescricao, setFormDescricao] = useState<string>('')
  const [formTipoMetrica, setFormTipoMetrica] = useState<MetaMetricaTipo>('tarefas_concluidas')
  const [formValorAlvo, setFormValorAlvo] = useState<number>(5)
  const [formPremioValor, setFormPremioValor] = useState<number>(250)
  const [formDataInicio, setFormDataInicio] = useState<string>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
  )
  const [formDataFim, setFormDataFim] = useState<string>(
    new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().slice(0, 10),
  )

  // Colaboradores elegíveis do sistema
  const teamUsers = useMemo(() => {
    return (db.users || []).filter((u) => u.id !== 'u1') // Exclui Carlos Silva (Master) para ranking de bonificação
  }, [db.users])

  // Identifica quem tem acesso/opera cada etapa
  const getEligibleCollaboratorsForStage = (etapaId: string) => {
    // 1. Verifica permissões explícitas
    const perms = permissions.filter((p) => p.etapa_id === etapaId && p.is_active !== false)
    const directUserIds = perms.map((p) => p.colaborador_id)

    // 2. Fallbacks de papéis padrões para garantir que a equipe designada apareça
    const defaultStageUsers: Record<string, string[]> = {
      '1': ['u3'], // Captação: João Paulo
      '2': ['u3'], // Documentação: João Paulo
      '3': ['u3'], // Formalização: João Paulo
      '4': ['u4'], // Vistoria Entrada: Alice Santos
      '5': ['u2'], // Assinatura: Marina Costa
      '6': ['u6'], // Entrega de Chaves: Camila Torres
      '7': ['u6'], // Régua do Inquilino: Camila Torres
      '8': ['u4'], // Manutenções: Alice Santos
      '9': ['u5'], // Financeiro: Ricardo Mendes
      '10': ['u6'], // Renovações: Camila Torres
      '11': ['u2'], // Vistoria Saída: Marina Costa
      '12': ['u5'], // Rescisão: Ricardo Mendes
    }

    const assignedIds = Array.from(
      new Set([...directUserIds, ...(defaultStageUsers[etapaId] || [])]),
    )
    return teamUsers.filter((u) => assignedIds.includes(u.id))
  }

  // Filtragem de metas
  const filteredMetas = useMemo(() => {
    if (selectedEtapaFilter === 'todas') return metas
    return metas.filter((m) => m.etapa_id === selectedEtapaFilter)
  }, [metas, selectedEtapaFilter])

  // Cálculos consolidados para a visão do Master
  const { totalMetasAtivas, totalPremiosDisponiveis, totalPremiosAtingidos, metasComProgresso } =
    useMemo(() => {
      let premiosDisponiveis = 0
      let premiosAtingidos = 0

      const metasCalculadas = metas.map((meta) => {
        const eligible = getEligibleCollaboratorsForStage(meta.etapa_id)
        const progressList = eligible.map((colab) =>
          calculateMetaProgress(meta, colab.id, colab.name, tarefas, metrics),
        )

        const atingiram = progressList.filter((p) => p.isAtingida)
        premiosDisponiveis += meta.premio_valor * (eligible.length || 1)
        premiosAtingidos += meta.premio_valor * atingiram.length

        return {
          meta,
          eligible,
          progressList,
          atingiramCount: atingiram.length,
        }
      })

      return {
        totalMetasAtivas: metas.length,
        totalPremiosDisponiveis: premiosDisponiveis,
        totalPremiosAtingidos: premiosAtingidos,
        metasComProgresso: metasCalculadas,
      }
    }, [metas, teamUsers, permissions, tarefas, metrics])

  const openCreateModal = (etapaId?: string) => {
    setEditingMeta(null)
    setFormEtapaId(etapaId || '1')
    setFormTitulo('')
    setFormDescricao('')
    setFormTipoMetrica('tarefas_concluidas')
    setFormValorAlvo(5)
    setFormPremioValor(250)
    setIsModalOpen(true)
  }

  const openEditModal = (meta: MetaPremioItem) => {
    setEditingMeta(meta)
    setFormEtapaId(meta.etapa_id)
    setFormTitulo(meta.titulo)
    setFormDescricao(meta.descricao || '')
    setFormTipoMetrica(meta.tipo_metrica)
    setFormValorAlvo(meta.valor_alvo)
    setFormPremioValor(meta.premio_valor)
    setFormDataInicio(meta.data_inicio)
    setFormDataFim(meta.data_fim)
    setIsModalOpen(true)
  }

  const handleSaveMeta = async () => {
    if (!formTitulo.trim()) {
      toast({
        title: 'Título Obrigatório',
        description: 'Informe um título claro para a meta.',
        variant: 'destructive',
      })
      return
    }

    if (formValorAlvo <= 0) {
      toast({
        title: 'Valor-alvo Inválido',
        description: 'O valor-alvo numérico deve ser maior que zero.',
        variant: 'destructive',
      })
      return
    }

    if (formPremioValor < 0) {
      toast({
        title: 'Prêmio Inválido',
        description: 'O valor do prêmio em dinheiro deve ser positivo.',
        variant: 'destructive',
      })
      return
    }

    const payload = {
      etapa_id: formEtapaId,
      titulo: formTitulo.trim(),
      descricao: formDescricao.trim(),
      tipo_metrica: formTipoMetrica,
      valor_alvo: Number(formValorAlvo),
      premio_valor: Number(formPremioValor),
      data_inicio: formDataInicio,
      data_fim: formDataFim,
      criado_por: user.name || 'Carlos Silva (Master)',
      is_active: true,
    }

    if (editingMeta) {
      const ok = await updateMetaPremio(editingMeta.id, payload)
      if (ok) {
        toast({
          title: 'Meta Atualizada com Sucesso',
          description: `A meta "${payload.titulo}" foi alterada e registrada na auditoria.`,
        })
        setIsModalOpen(false)
      }
    } else {
      const ok = await addMetaPremio(payload)
      if (ok) {
        toast({
          title: 'Meta & Prêmio Criados!',
          description: `Meta cadastrada para a Etapa ${payload.etapa_id}. Agora ficará visível aos colaboradores responsáveis.`,
        })
        setIsModalOpen(false)
      }
    }
  }

  const handleDeleteMeta = async (id: string, titulo: string) => {
    if (
      confirm(
        `Tem certeza que deseja excluir a meta "${titulo}"? Esta ação será registrada na trilha de auditoria.`,
      )
    ) {
      const ok = await removeMetaPremio(id)
      if (ok) {
        toast({
          title: 'Meta Excluída',
          description: `A meta "${titulo}" foi removida e registrada na auditoria.`,
        })
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho do Módulo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-500" />
            Gestão de Metas & Prêmios da Esteira
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Painel exclusivo do Master: cadastre metas e bonificações em dinheiro para cada etapa da
            esteira.
            <strong> Em sigilo:</strong> nada é exibido ao colaborador até que você cadastre.
          </p>
        </div>

        <Button
          onClick={() => openCreateModal()}
          className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" /> Nova Meta & Prêmio
        </Button>
      </div>

      {/* Cartões de Indicadores Financeiros / Acompanhamento Geral */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border shadow-sm bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground tracking-wider flex items-center justify-between">
              Metas Cadastradas <Target className="w-4 h-4 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground font-mono">{totalMetasAtivas}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalMetasAtivas === 0
                ? 'Nenhuma meta no ar (modo oculto)'
                : 'Metas ativas em vigência'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-emerald-500/30 bg-emerald-500/5 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-emerald-700 dark:text-emerald-400 tracking-wider flex items-center justify-between">
              Prêmios Já Atingidos <Trophy className="w-4 h-4 text-emerald-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-400 font-mono">
              {formatBRL(totalPremiosAtingidos)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total garantido pela equipe no período
            </p>
          </CardContent>
        </Card>

        <Card className="border-amber-500/30 bg-amber-500/5 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-amber-700 dark:text-amber-400 tracking-wider flex items-center justify-between">
              Pool Total de Premiação <Coins className="w-4 h-4 text-amber-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-700 dark:text-amber-400 font-mono">
              {formatBRL(totalPremiosDisponiveis)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Teto orçado se 100% das metas forem batidas
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary/30 bg-primary/5 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-primary tracking-wider flex items-center justify-between">
              Sigilo Operacional <ShieldCheck className="w-4 h-4 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-semibold text-primary">Blindagem Ativa</div>
            <p className="text-xs text-muted-foreground mt-1">
              Colaborador só vê metas da sua etapa; sem comparação de prêmios alheios.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtro por Etapa */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/30 p-3 rounded-lg border">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-foreground">Filtrar por Etapa da Esteira:</span>
          <Select value={selectedEtapaFilter} onValueChange={setSelectedEtapaFilter}>
            <SelectTrigger className="w-56 h-8 text-xs bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as 12 Etapas</SelectItem>
              {stages.map((stg) => (
                <SelectItem key={stg.id} value={stg.id}>
                  {stg.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <span className="text-xs text-muted-foreground">
          Exibindo {filteredMetas.length} meta{filteredMetas.length === 1 ? '' : 's'} configurada
          {filteredMetas.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Lista de Metas Configuradas com Acompanhamento de Colaboradores */}
      {filteredMetas.length === 0 ? (
        <Card className="border-dashed border-2 bg-muted/10">
          <CardContent className="min-h-[260px] flex flex-col items-center justify-center text-center p-8">
            <div className="p-3 bg-muted rounded-full mb-3">
              <Trophy className="w-8 h-8 text-muted-foreground opacity-60" />
            </div>
            <h3 className="text-base font-semibold text-foreground">
              {selectedEtapaFilter === 'todas'
                ? 'Nenhuma meta configurada ainda'
                : 'Nenhuma meta cadastrada para esta etapa'}
            </h3>
            <p className="text-xs text-muted-foreground max-w-md mt-1 mb-4">
              Enquanto o Master não cadastrar uma meta, o painel do colaborador permanece limpo, sem
              avisos ou placeholders vazios, garantindo o sigilo total.
            </p>
            <Button
              size="sm"
              onClick={() =>
                openCreateModal(selectedEtapaFilter === 'todas' ? '1' : selectedEtapaFilter)
              }
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Plus className="w-4 h-4" /> Cadastrar Primeira Meta
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {metasComProgresso
            .filter(
              (item) =>
                selectedEtapaFilter === 'todas' || item.meta.etapa_id === selectedEtapaFilter,
            )
            .map(({ meta, eligible, progressList, atingiramCount }) => {
              const stage = stages.find((s) => s.id === meta.etapa_id)

              return (
                <Card key={meta.id} className="border shadow-sm overflow-hidden bg-card">
                  <div className="p-5 border-b bg-muted/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs font-mono bg-background">
                          [{meta.etapa_id}. {stage?.shortName || `Etapa ${meta.etapa_id}`}]
                        </Badge>
                        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                          {meta.titulo}
                        </h3>
                        <Badge className="bg-emerald-600 text-white font-mono text-xs gap-1">
                          <Coins className="w-3.5 h-3.5" /> Prêmio: {formatBRL(meta.premio_valor)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {meta.descricao || 'Sem descrição cadastrada'}
                      </p>
                      <div className="flex items-center gap-4 text-[11px] text-muted-foreground pt-1 flex-wrap">
                        <span>
                          <strong>Métrica:</strong>{' '}
                          {METRICA_LABELS[meta.tipo_metrica] || meta.tipo_metrica}
                        </span>
                        <span>
                          <strong>Alvo:</strong> {meta.valor_alvo}
                        </span>
                        <span>
                          <strong>Vigência:</strong> {meta.data_inicio} até {meta.data_fim}
                        </span>
                        <span>
                          <strong>Atingiram:</strong>{' '}
                          <span className="font-semibold text-emerald-600">
                            {atingiramCount} de {eligible.length} elegíveis
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(meta)}
                        className="h-8 text-xs gap-1"
                      >
                        <Edit className="w-3.5 h-3.5" /> Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteMeta(meta.id, meta.titulo)}
                        className="h-8 text-xs text-destructive hover:bg-destructive/10 gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Excluir
                      </Button>
                    </div>
                  </div>

                  {/* Tabela de Colaboradores Elegíveis & Progresso */}
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader className="bg-muted/30">
                        <TableRow className="text-xs">
                          <TableHead>Colaborador Operador</TableHead>
                          <TableHead>Métrica Apurada</TableHead>
                          <TableHead className="w-1/3">Progresso / Conquista</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                          <TableHead className="text-right">Prêmio Garantido</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {progressList.map((prog) => (
                          <TableRow key={prog.colaboradorId} className="text-xs hover:bg-muted/20">
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <Users className="w-3.5 h-3.5 text-muted-foreground" />
                                <span>{prog.colaboradorNome}</span>
                              </div>
                            </TableCell>
                            <TableCell className="font-mono">
                              <span className="font-semibold text-foreground">
                                {prog.labelAtual}
                              </span>
                              <span className="text-muted-foreground">
                                {' '}
                                / alvo: {prog.labelAlvo}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="font-mono text-muted-foreground">
                                    {prog.percentual}%
                                  </span>
                                  {prog.isAtingida && (
                                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3" /> Meta Batida
                                    </span>
                                  )}
                                </div>
                                <Progress
                                  value={prog.percentual}
                                  indicatorColor={prog.isAtingida ? 'bg-emerald-500' : 'bg-primary'}
                                  className="h-2"
                                />
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              {prog.isAtingida ? (
                                <Badge className="bg-emerald-600 text-white text-[10px] gap-1">
                                  <Trophy className="w-3 h-3" /> Atingida 🏆
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-[10px]">
                                  Em Andamento
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-mono font-bold">
                              {prog.isAtingida ? (
                                <span className="text-emerald-600">
                                  {formatBRL(meta.premio_valor)}
                                </span>
                              ) : (
                                <span className="text-muted-foreground font-normal">
                                  Aguardando meta
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}

                        {progressList.length === 0 && (
                          <TableRow>
                            <TableCell
                              colSpan={5}
                              className="text-center py-6 text-muted-foreground text-xs"
                            >
                              Nenhum colaborador atribuído a esta etapa no momento.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )
            })}
        </div>
      )}

      {/* Modal: Criar / Editar Meta & Prêmio */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Trophy className="w-5 h-5 text-amber-500" />
              {editingMeta ? 'Editar Meta & Prêmio' : 'Nova Meta com Prêmio em Dinheiro'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configuração exclusiva do Master. As alterações serão gravadas na trilha imutável de
              auditoria.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2 text-xs">
            <div className="space-y-1">
              <label className="font-medium text-foreground">Etapa da Esteira (Funil)</label>
              <Select value={formEtapaId} onValueChange={setFormEtapaId}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {stages.map((stg) => (
                    <SelectItem key={stg.id} value={stg.id}>
                      {stg.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground">Título da Meta</label>
              <Input
                value={formTitulo}
                onChange={(e) => setFormTitulo(e.target.value)}
                placeholder="Ex: 10 Vistorias de Entrada Sem Pendências"
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground">Descrição / Regras de Conquista</label>
              <Textarea
                value={formDescricao}
                onChange={(e) => setFormDescricao(e.target.value)}
                placeholder="Ex: Concluir as vistorias dentro do prazo de SLA estipulado no mês corrente..."
                className="text-xs min-h-[60px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-medium text-foreground">Tipo de Métrica</label>
                <Select
                  value={formTipoMetrica}
                  onValueChange={(val: MetaMetricaTipo) => setFormTipoMetrica(val)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tarefas_concluidas">Tarefas Concluídas</SelectItem>
                    <SelectItem value="sla_prazo_pct">% SLA no Prazo</SelectItem>
                    <SelectItem value="score_minimo">Score Mínimo (pts)</SelectItem>
                    <SelectItem value="contratos_avancados">Contratos Avançados</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground">
                  Valor-Alvo {formTipoMetrica === 'sla_prazo_pct' ? '(%)' : '(Numérico)'}
                </label>
                <Input
                  type="number"
                  value={formValorAlvo}
                  onChange={(e) => setFormValorAlvo(Number(e.target.value))}
                  min={1}
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1 col-span-1">
                <label className="font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5" /> Prêmio em R$
                </label>
                <Input
                  type="number"
                  value={formPremioValor}
                  onChange={(e) => setFormPremioValor(Number(e.target.value))}
                  min={0}
                  step={50}
                  className="h-8 text-xs font-mono font-bold text-emerald-600"
                />
              </div>

              <div className="space-y-1 col-span-1">
                <label className="font-medium text-foreground">Data Início</label>
                <Input
                  type="date"
                  value={formDataInicio}
                  onChange={(e) => setFormDataInicio(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1 col-span-1">
                <label className="font-medium text-foreground">Data Fim</label>
                <Input
                  type="date"
                  value={formDataFim}
                  onChange={(e) => setFormDataFim(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-muted/40 border text-[11px] text-muted-foreground flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <strong>Ação Auditada:</strong> Será gravada na tabela <code>log_auditoria</code>{' '}
                como <code>gerenciou_meta</code> por <strong>Carlos Silva (Master)</strong>.
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSaveMeta}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {editingMeta ? 'Salvar Alterações' : 'Criar Meta & Prêmio'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
