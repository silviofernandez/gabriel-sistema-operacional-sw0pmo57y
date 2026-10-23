import { useState, useMemo } from 'react'
import {
  Inbox,
  Search,
  Plus,
  Filter,
  Kanban as KanbanIcon,
  List as ListIcon,
  AlertTriangle,
  Clock,
  User,
  Building,
  Phone,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  MapPin,
  Calendar,
} from 'lucide-react'
import { useProcessos } from '@/stores/useProcessosStore'
import {
  CasoProcesso,
  CasoStatus,
  CasoPrioridade,
  GabrielUnidade,
  CanalOrigem,
} from '@/types/processos'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CasoDetailDialog } from '@/components/processos/CasoDetailDialog'
import { formatarDataHoraBR, isDentroDoExpediente } from '@/utils/expedienteSLA'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

const STATUS_COLUNAS: { status: CasoStatus; label: string; cor: string }[] = [
  { status: 'Novo', label: 'Novo', cor: 'border-t-blue-500' },
  { status: 'Em atendimento', label: 'Em Atendimento', cor: 'border-t-amber-500' },
  { status: 'Aguardando cliente', label: 'Aguardando Cliente', cor: 'border-t-purple-500' },
  {
    status: 'Aguardando terceiros' as any,
    label: 'Aguardando Terceiros',
    cor: 'border-t-indigo-500',
  },
  {
    status: 'Aguardando aprovação interna',
    label: 'Aguardando Aprovação',
    cor: 'border-t-orange-500',
  },
  { status: 'Resolvido', label: 'Resolvido', cor: 'border-t-emerald-500' },
]

export default function CentralAtendimento() {
  const {
    casos,
    modelos,
    abrirCaso,
    selectedUnidadeFiltro,
    setSelectedUnidadeFiltro,
    configExpediente,
  } = useProcessos()
  const { toast } = useToast()

  const [viewMode, setViewMode] = useState<'kanban' | 'lista'>('kanban')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPrioridade, setSelectedPrioridade] = useState<string>('Todas')
  const [selectedStatus, setSelectedStatus] = useState<string>('Todos')

  // Detalhe do Caso
  const [selectedCasoDetail, setSelectedCasoDetail] = useState<CasoProcesso | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  // Modal Novo Atendimento
  const [isNewCaseModalOpen, setIsNewCaseModalOpen] = useState(false)
  const [newCaseForm, setNewCaseForm] = useState<{
    titulo: string
    modelo_id: string
    unidade: GabrielUnidade
    prioridade: CasoPrioridade
    justificativa_prioridade: string
    solicitante_nome: string
    solicitante_email: string
    solicitante_telefone: string
    canal_origem: CanalOrigem
    imovel_titulo: string
    contrato_id: string
    proxima_acao: string
  }>({
    titulo: '',
    modelo_id: '',
    unidade: 'Jaú',
    prioridade: 'Média',
    justificativa_prioridade: '',
    solicitante_nome: '',
    solicitante_email: '',
    solicitante_telefone: '',
    canal_origem: 'WhatsApp',
    imovel_titulo: '',
    contrato_id: '',
    proxima_acao: 'Triagem preliminar e primeiro contato humano.',
  })

  // Checagem de expediente atual
  const confAtual =
    configExpediente.find((c) => c.unidade === selectedUnidadeFiltro) || configExpediente[0]
  const dentroExpediente = isDentroDoExpediente(new Date(), confAtual)

  // Busca e Filtros
  const filteredCasos = useMemo(() => {
    return casos.filter((c) => {
      // Unidade
      if (selectedUnidadeFiltro !== 'Todas' && c.unidade !== selectedUnidadeFiltro) return false
      // Prioridade
      if (selectedPrioridade !== 'Todas' && c.prioridade !== selectedPrioridade) return false
      // Status
      if (selectedStatus !== 'Todos' && c.status !== selectedStatus) return false
      // Busca geral: protocolo, pessoa, imóvel, contrato, título
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase()
        const match =
          c.protocolo.toLowerCase().includes(term) ||
          c.titulo.toLowerCase().includes(term) ||
          c.solicitante_nome.toLowerCase().includes(term) ||
          (c.cliente_nome && c.cliente_nome.toLowerCase().includes(term)) ||
          (c.imovel_titulo && c.imovel_titulo.toLowerCase().includes(term)) ||
          (c.contrato_id && c.contrato_id.toLowerCase().includes(term))
        if (!match) return false
      }
      return true
    })
  }, [casos, selectedUnidadeFiltro, selectedPrioridade, selectedStatus, searchTerm])

  // Verificação de possíveis duplicidades ao cadastrar (regra da spec: sugere duplicidade, NUNCA une automaticamente)
  const duplicidadesSugeridas = useMemo(() => {
    if (!newCaseForm.solicitante_nome.trim() || newCaseForm.solicitante_nome.length < 3) return []
    const term = newCaseForm.solicitante_nome.toLowerCase()
    return casos.filter(
      (c) =>
        c.solicitante_nome.toLowerCase().includes(term) ||
        (newCaseForm.solicitante_telefone &&
          c.solicitante_telefone &&
          c.solicitante_telefone === newCaseForm.solicitante_telefone),
    )
  }, [newCaseForm.solicitante_nome, newCaseForm.solicitante_telefone, casos])

  // Abrir chamado
  const handleConfirmarAbertura = async () => {
    if (!newCaseForm.titulo.trim() || !newCaseForm.solicitante_nome.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Informe o título do caso e o nome do solicitante.',
        variant: 'destructive',
      })
      return
    }

    const mod =
      modelos.find((m) => m.id === newCaseForm.modelo_id) ||
      modelos.find((m) => m.status === 'publicado') ||
      modelos[0]

    const ano = new Date().getFullYear()
    const rand = Math.floor(1000 + Math.random() * 9000)
    const protocoloGerado = `GAB-${ano}-${rand}`

    const criado = await abrirCaso({
      protocolo: protocoloGerado,
      titulo: newCaseForm.titulo,
      modelo_id: mod?.id || 'mod-geral',
      versao_modelo: mod?.versao_atual || 1,
      unidade: newCaseForm.unidade,
      status: 'Novo',
      prioridade: newCaseForm.prioridade,
      justificativa_prioridade: newCaseForm.justificativa_prioridade,
      fase_atual_id: mod?.fases[0]?.id || 'fase-1',
      fase_atual_nome: mod?.fases[0]?.nome || 'Triagem & Classificação',
      solicitante_nome: newCaseForm.solicitante_nome,
      solicitante_email: newCaseForm.solicitante_email,
      solicitante_telefone: newCaseForm.solicitante_telefone,
      canal_origem: newCaseForm.canal_origem,
      imovel_titulo: newCaseForm.imovel_titulo,
      contrato_id: newCaseForm.contrato_id,
      responsavel_nome: 'Carlos Silva (Gestor)',
      responsavel_id: 'u1',
      proxima_acao: newCaseForm.proxima_acao || 'Realizar primeiro retorno humano.',
      data_abertura: new Date().toISOString().replace('T', ' ').slice(0, 19),
      is_demo: true,
    })

    if (criado) {
      toast({
        title: 'Atendimento Aberto com Sucesso',
        description: `Protocolo gerado: ${protocoloGerado}. Confirmação automática emitida.`,
      })
      setIsNewCaseModalOpen(false)
      setNewCaseForm({
        titulo: '',
        modelo_id: '',
        unidade: 'Jaú',
        prioridade: 'Média',
        justificativa_prioridade: '',
        solicitante_nome: '',
        solicitante_email: '',
        solicitante_telefone: '',
        canal_origem: 'WhatsApp',
        imovel_titulo: '',
        contrato_id: '',
        proxima_acao: 'Triagem preliminar e primeiro contato humano.',
      })
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up max-w-7xl mx-auto w-full pb-12">
      {/* Header com Unidades e Expediente */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Inbox className="w-8 h-8 text-primary" /> Central de Atendimento
            </h1>
            <Badge
              variant="outline"
              className="bg-primary/5 text-primary border-primary/20 text-xs"
            >
              Etapa 1
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Gestão unificada de chamados em Jaú, Pederneiras e Lençóis Paulista com SLA útil e
            rastreamento.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Indicador de Expediente */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-muted/40 text-xs">
            <span
              className={cn(
                'w-2 h-2 rounded-full',
                dentroExpediente ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500',
              )}
            />
            <span className="font-medium text-foreground">
              {dentroExpediente ? 'Expediente Útil Ativo' : 'Fora do Expediente (SLA no prox. dia)'}
            </span>
          </div>

          <Button onClick={() => setIsNewCaseModalOpen(true)} className="gap-1.5 shadow-sm">
            <Plus className="w-4 h-4" /> Nova Solicitação
          </Button>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 bg-muted/20 p-4 rounded-xl border">
        <div className="md:col-span-2 relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por protocolo, solicitante, imóvel ou contrato..."
            className="pl-9 bg-background"
          />
        </div>

        <div>
          <Select
            value={selectedUnidadeFiltro}
            onValueChange={(val) => setSelectedUnidadeFiltro(val as any)}
          >
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Unidade Gabriel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todas">Todas as Unidades</SelectItem>
              <SelectItem value="Jaú">Jaú</SelectItem>
              <SelectItem value="Pederneiras">Pederneiras</SelectItem>
              <SelectItem value="Lençóis Paulista">Lençóis Paulista</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Select value={selectedPrioridade} onValueChange={setSelectedPrioridade}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todas">Todas as Prioridades</SelectItem>
              <SelectItem value="Urgente">Urgente</SelectItem>
              <SelectItem value="Alta">Alta</SelectItem>
              <SelectItem value="Média">Média</SelectItem>
              <SelectItem value="Baixa">Baixa</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'kanban' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('kanban')}
            className="flex-1 gap-1 text-xs"
          >
            <KanbanIcon className="w-4 h-4" /> Kanban
          </Button>
          <Button
            variant={viewMode === 'lista' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('lista')}
            className="flex-1 gap-1 text-xs"
          >
            <ListIcon className="w-4 h-4" /> Lista
          </Button>
        </div>
      </div>

      {/* VISÃO KANBAN */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-start overflow-x-auto pb-4">
          {STATUS_COLUNAS.map((col) => {
            const casosDaColuna = filteredCasos.filter((c) => {
              if (col.status === ('Aguardando terceiros' as any)) {
                return c.status === 'Aguardando proprietário' || c.status === 'Aguardando prestador'
              }
              return c.status === col.status
            })

            return (
              <div
                key={col.label}
                className={cn(
                  'flex flex-col rounded-xl border bg-muted/15 p-3 min-h-[500px]',
                  col.cor,
                )}
              >
                <div className="flex items-center justify-between pb-3 border-b mb-3">
                  <span className="font-semibold text-xs text-foreground">{col.label}</span>
                  <Badge variant="secondary" className="font-mono text-[10px]">
                    {casosDaColuna.length}
                  </Badge>
                </div>

                <div className="space-y-3 flex-1">
                  {casosDaColuna.map((c) => (
                    <Card
                      key={c.id}
                      onClick={() => {
                        setSelectedCasoDetail(c)
                        setIsDetailOpen(true)
                      }}
                      className="cursor-pointer hover:shadow-md transition-all border bg-card p-3 space-y-2 group"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-mono text-[11px] font-bold text-primary group-hover:underline">
                          {c.protocolo}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px] px-1.5 py-0 font-semibold',
                            c.prioridade === 'Urgente'
                              ? 'border-destructive text-destructive bg-destructive/5'
                              : c.prioridade === 'Alta'
                                ? 'border-orange-500 text-orange-600 bg-orange-500/5'
                                : 'text-muted-foreground',
                          )}
                        >
                          {c.prioridade}
                        </Badge>
                      </div>

                      <h4 className="text-xs font-semibold text-foreground line-clamp-2 leading-snug">
                        {c.titulo}
                      </h4>

                      <div className="text-[11px] text-muted-foreground space-y-0.5">
                        <p className="truncate flex items-center gap-1">
                          <User className="w-3 h-3 text-primary" /> {c.solicitante_nome}
                        </p>
                        {c.imovel_titulo && (
                          <p className="truncate flex items-center gap-1">
                            <Building className="w-3 h-3" /> {c.imovel_titulo}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t text-[10px] text-muted-foreground font-mono">
                        <Badge variant="secondary" className="text-[9px] px-1 py-0">
                          {c.unidade}
                        </Badge>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {c.data_abertura?.slice(5, 10)}
                        </span>
                      </div>
                    </Card>
                  ))}

                  {casosDaColuna.length === 0 && (
                    <div className="text-center p-6 text-[11px] text-muted-foreground border border-dashed rounded-lg">
                      Nenhum caso
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* VISÃO EM LISTA */}
      {viewMode === 'lista' && (
        <Card className="border shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/40 text-muted-foreground font-semibold border-b">
                <tr>
                  <th className="p-3">Protocolo</th>
                  <th className="p-3">Solicitante & Unidade</th>
                  <th className="p-3">Título & Categoria</th>
                  <th className="p-3">Fase Atual</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Prioridade</th>
                  <th className="p-3">1ª Resposta</th>
                  <th className="p-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredCasos.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => {
                      setSelectedCasoDetail(c)
                      setIsDetailOpen(true)
                    }}
                    className="hover:bg-muted/20 cursor-pointer transition-colors"
                  >
                    <td className="p-3 font-mono font-bold text-primary">{c.protocolo}</td>
                    <td className="p-3">
                      <div className="font-semibold text-foreground">{c.solicitante_nome}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {c.unidade} · {c.canal_origem}
                      </div>
                    </td>
                    <td className="p-3 max-w-xs">
                      <span className="font-medium text-foreground line-clamp-1">{c.titulo}</span>
                      {c.imovel_titulo && (
                        <span className="text-[11px] text-muted-foreground line-clamp-1">
                          {c.imovel_titulo}
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-semibold text-primary">{c.fase_atual_nome}</td>
                    <td className="p-3">
                      <Badge variant="outline" className="text-[11px]">
                        {c.status}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <Badge
                        className={cn(
                          'text-[10px]',
                          c.prioridade === 'Urgente'
                            ? 'bg-destructive text-destructive-foreground'
                            : c.prioridade === 'Alta'
                              ? 'bg-orange-500 text-white'
                              : 'bg-muted text-muted-foreground',
                        )}
                      >
                        {c.prioridade}
                      </Badge>
                    </td>
                    <td className="p-3 font-mono text-muted-foreground">
                      {c.data_primeira_resposta_humana
                        ? formatarDataHoraBR(c.data_primeira_resposta_humana).slice(0, 16)
                        : 'Pendente'}
                    </td>
                    <td className="p-3 text-right">
                      <Button variant="ghost" size="sm" className="h-7 text-xs">
                        Abrir
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* MODAL: NOVO ATENDIMENTO */}
      <Dialog open={isNewCaseModalOpen} onOpenChange={setIsNewCaseModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Inbox className="w-5 h-5 text-primary" /> Abrir Nova Solicitação / Atendimento
            </DialogTitle>
            <DialogDescription className="text-xs">
              Cadastre um novo caso com geração imediata de protocolo único e notificação de
              confirmação.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* Duplicidades Sugeridas */}
            {duplicidadesSugeridas.length > 0 && (
              <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 space-y-1.5">
                <div className="flex items-center gap-1.5 text-amber-900 dark:text-amber-200 font-bold">
                  <AlertTriangle className="w-4 h-4" /> Possível duplicidade detectada (Atenção):
                </div>
                <p className="text-muted-foreground">
                  Já existem {duplicidadesSugeridas.length} atendimento(s) em aberto para este
                  solicitante:
                </p>
                <div className="space-y-1 font-mono text-[11px]">
                  {duplicidadesSugeridas.map((dup) => (
                    <div key={dup.id} className="text-foreground">
                      • {dup.protocolo} — "{dup.titulo}" ({dup.status} · {dup.unidade})
                    </div>
                  ))}
                </div>
                <span className="text-[10px] text-muted-foreground block pt-1">
                  * A Gabriel nunca une registros automaticamente; você pode prosseguir com a
                  abertura se for uma nova demanda.
                </span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs">Título / Assunto da Solicitação *</Label>
              <Input
                value={newCaseForm.titulo}
                onChange={(e) => setNewCaseForm({ ...newCaseForm, titulo: e.target.value })}
                placeholder="Ex: Vazamento de água no banheiro social"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Unidade da Imobiliária *</Label>
                <Select
                  value={newCaseForm.unidade}
                  onValueChange={(val) =>
                    setNewCaseForm({ ...newCaseForm, unidade: val as GabrielUnidade })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Jaú">Jaú</SelectItem>
                    <SelectItem value="Pederneiras">Pederneiras</SelectItem>
                    <SelectItem value="Lençóis Paulista">Lençóis Paulista</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Canal de Origem</Label>
                <Select
                  value={newCaseForm.canal_origem}
                  onValueChange={(val) =>
                    setNewCaseForm({ ...newCaseForm, canal_origem: val as CanalOrigem })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                    <SelectItem value="Site">Site</SelectItem>
                    <SelectItem value="Telefone">Telefone</SelectItem>
                    <SelectItem value="Balcão">Balcão</SelectItem>
                    <SelectItem value="E-mail">E-mail</SelectItem>
                    <SelectItem value="Interno">Interno</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Prioridade</Label>
                <Select
                  value={newCaseForm.prioridade}
                  onValueChange={(val) =>
                    setNewCaseForm({ ...newCaseForm, prioridade: val as CasoPrioridade })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Baixa">Baixa</SelectItem>
                    <SelectItem value="Média">Média</SelectItem>
                    <SelectItem value="Alta">Alta</SelectItem>
                    <SelectItem value="Urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Processo a Utilizar</Label>
              <Select
                value={newCaseForm.modelo_id}
                onValueChange={(val) => setNewCaseForm({ ...newCaseForm, modelo_id: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o fluxo do processo" />
                </SelectTrigger>
                <SelectContent>
                  {modelos.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.nome} (v{m.versao_atual})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Nome do Solicitante *</Label>
                <Input
                  value={newCaseForm.solicitante_nome}
                  onChange={(e) =>
                    setNewCaseForm({ ...newCaseForm, solicitante_nome: e.target.value })
                  }
                  placeholder="Nome completo"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Telefone / WhatsApp</Label>
                <Input
                  value={newCaseForm.solicitante_telefone}
                  onChange={(e) =>
                    setNewCaseForm({ ...newCaseForm, solicitante_telefone: e.target.value })
                  }
                  placeholder="(14) 99999-9999"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">E-mail</Label>
                <Input
                  value={newCaseForm.solicitante_email}
                  onChange={(e) =>
                    setNewCaseForm({ ...newCaseForm, solicitante_email: e.target.value })
                  }
                  placeholder="email@exemplo.com.br"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Imóvel Vinculado (Opcional)</Label>
                <Input
                  value={newCaseForm.imovel_titulo}
                  onChange={(e) =>
                    setNewCaseForm({ ...newCaseForm, imovel_titulo: e.target.value })
                  }
                  placeholder="Ex: Apto 42 Ed. Jardins Jaú"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Contrato de Locação (Opcional)</Label>
                <Input
                  value={newCaseForm.contrato_id}
                  onChange={(e) => setNewCaseForm({ ...newCaseForm, contrato_id: e.target.value })}
                  placeholder="Ex: CTR-2024-0089"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Justificativa da Prioridade / Observações</Label>
              <Textarea
                rows={2}
                value={newCaseForm.justificativa_prioridade}
                onChange={(e) =>
                  setNewCaseForm({ ...newCaseForm, justificativa_prioridade: e.target.value })
                }
                placeholder="Detalhes adicionais relatados pelo cliente..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewCaseModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmarAbertura}
              className="bg-primary text-primary-foreground"
            >
              Abrir Atendimento & Gerar Protocolo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG DETALHE DO CASO */}
      <CasoDetailDialog
        caso={selectedCasoDetail}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
      />
    </div>
  )
}
