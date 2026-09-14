import { useState, useMemo } from 'react'
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
import {
  Plus,
  Search,
  CheckSquare,
  Clock,
  AlertTriangle,
  UserCheck,
  CheckCircle2,
  Trash2,
} from 'lucide-react'
import useAuthStore from '@/stores/useAuthStore'
import usePipelineAccess from '@/stores/usePipelineAccess'
import useDataStore from '@/stores/useDataStore'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

export default function Tarefas() {
  const { user, profileLevel, role } = useAuthStore()
  const { stages, tarefas, addTarefa, updateTarefaStatus, removeTarefa } = usePipelineAccess()
  const { db } = useDataStore()
  const { toast } = useToast()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedColabFilter, setSelectedColabFilter] = useState<string>('todos')
  const [selectedEtapaFilter, setSelectedEtapaFilter] = useState<string>('todas')
  const [isNewModalOpen, setIsNewModalOpen] = useState(false)

  // Campos do formulário de criação de tarefa pelo Master
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [responsavelId, setResponsavelId] = useState('u4') // Alice
  const [etapaId, setEtapaId] = useState('4') // Vistoria Entrada
  const [contratoId, setContratoId] = useState('CTR-001')
  const [prioridade, setPrioridade] = useState<'Baixa' | 'Média' | 'Alta' | 'Crítica'>('Alta')
  const [tipo, setTipo] = useState<
    'Operacional' | 'Concierge' | 'Demanda' | 'Manutenção' | 'Vistoria' | 'Administrativo'
  >('Operacional')
  const [prazo, setPrazo] = useState(new Date().toISOString().slice(0, 10))
  const [slaHoras, setSlaHoras] = useState(24)

  const isMaster =
    user.id === 'u1' ||
    role === 'Administrador' ||
    profileLevel === 'Diretor' ||
    profileLevel === 'Gestor'

  // Filtrar tarefas visíveis
  const filteredTarefas = useMemo(() => {
    return tarefas.filter((t) => {
      // Se não for master, vê apenas as suas
      if (!isMaster && t.responsavel_id !== user.id) return false

      if (selectedColabFilter !== 'todos' && t.responsavel_id !== selectedColabFilter) return false
      if (selectedEtapaFilter !== 'todas' && t.etapa_id !== selectedEtapaFilter) return false
      if (
        searchTerm &&
        !t.titulo.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !(t.descricao || '').toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false
      }
      return true
    })
  }, [tarefas, isMaster, user.id, selectedColabFilter, selectedEtapaFilter, searchTerm])

  const pendingCount = filteredTarefas.filter((t) => t.status !== 'Concluída').length
  const delayedCount = filteredTarefas.filter((t) => t.status === 'Atrasada').length

  const handleCreateTarefa = async () => {
    if (!titulo.trim()) {
      toast({
        title: 'Título Obrigatório',
        description: 'Por favor dê um título para a tarefa.',
        variant: 'destructive',
      })
      return
    }

    const colabObj = db.users.find((u) => u.id === responsavelId)
    const imovelObj = db.properties[0]?.title || 'Imóvel Gabriel'

    const ok = await addTarefa({
      titulo,
      descricao,
      responsavel_id: responsavelId,
      responsavel_nome: colabObj?.name || 'Colaborador',
      etapa_id: etapaId,
      contrato_id: contratoId,
      imovel_titulo: imovelObj,
      prioridade,
      status: 'Pendente',
      tipo,
      prazo,
      sla_horas: Number(slaHoras),
      criado_por: `${user.name} (Master)`,
      ai_urgency: prioridade === 'Crítica' ? 'Crítica' : 'Normal',
      ai_risk_flag: prioridade === 'Crítica',
      checklists: [],
    })

    if (ok) {
      toast({
        title: 'Tarefa Criada e Atribuída!',
        description: `Tarefa destinada a ${colabObj?.name || responsavelId} na Etapa ${etapaId}. Registrada na auditoria.`,
      })
      setIsNewModalOpen(false)
      setTitulo('')
      setDescricao('')
    }
  }

  const handleDeleteTarefa = async (id: string, tit: string) => {
    const ok = await removeTarefa(id)
    if (ok) {
      toast({
        title: 'Tarefa Excluída',
        description: `A tarefa "${tit}" foi removida e registrada na auditoria.`,
      })
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Crítica':
        return 'text-destructive bg-destructive/10'
      case 'Alta':
        return 'text-orange-600 bg-orange-50'
      case 'Média':
        return 'text-blue-600 bg-blue-50'
      default:
        return 'text-slate-600 bg-slate-50'
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in-up space-y-6 pb-10">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <CheckSquare className="w-8 h-8 text-primary" /> Tarefas & Ordens de Serviço (OS)
          </h1>
          <p className="text-muted-foreground mt-1 text-base">
            {isMaster
              ? 'Defina e atribua tarefas para cada colaborador no funil (quantas quiser). Tudo registrado na auditoria.'
              : `Painel de demandas de ${user.name}. Você visualiza apenas tarefas atribuídas a você.`}
          </p>
        </div>

        {isMaster && (
          <Button
            onClick={() => setIsNewModalOpen(true)}
            className="shadow-sm gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Plus className="w-4 h-4" /> Atribuir Tarefa (Master)
          </Button>
        )}
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border bg-card shadow-sm flex items-center gap-4">
          <div className="p-3 bg-primary/10 text-primary rounded-lg">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Tarefas no Escopo</p>
            <p className="text-2xl font-bold">{filteredTarefas.length}</p>
          </div>
        </div>
        <div className="p-4 rounded-xl border bg-card shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 text-blue-500 rounded-lg">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Pendentes / Ativas</p>
            <p className="text-2xl font-bold">{pendingCount}</p>
          </div>
        </div>
        <div className="p-4 rounded-xl border bg-card shadow-sm flex items-center gap-4">
          <div className="p-3 bg-destructive/10 text-destructive rounded-lg">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Tarefas Atrasadas</p>
            <p className="text-2xl font-bold text-destructive">{delayedCount}</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar tarefa por título, imóvel ou descrição..."
            className="pl-9 bg-card h-9 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {isMaster && (
          <div className="w-full sm:w-56">
            <Select value={selectedColabFilter} onValueChange={setSelectedColabFilter}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Filtrar por Colaborador" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Colaboradores</SelectItem>
                <SelectItem value="u4">Alice Santos</SelectItem>
                <SelectItem value="u3">João Paulo</SelectItem>
                <SelectItem value="u6">Camila Torres</SelectItem>
                <SelectItem value="u5">Ricardo Mendes</SelectItem>
                <SelectItem value="u2">Marina Costa</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="w-full sm:w-56">
          <Select value={selectedEtapaFilter} onValueChange={setSelectedEtapaFilter}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Filtrar por Etapa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as Etapas do Funil</SelectItem>
              {stages.map((stg) => (
                <SelectItem key={stg.id} value={stg.id}>
                  {stg.id}. {stg.shortName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Task List */}
      <div className="grid gap-3">
        {filteredTarefas.length > 0 ? (
          filteredTarefas.map((t) => {
            const stageObj = stages.find((s) => s.id === t.etapa_id)
            const isConcluida = t.status === 'Concluída'

            return (
              <div
                key={t.id}
                className={cn(
                  'p-5 border rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row gap-4 sm:items-center justify-between',
                  isConcluida && 'opacity-75 bg-muted/10',
                )}
              >
                <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() =>
                      updateTarefaStatus(
                        t.id,
                        isConcluida ? 'Em Andamento' : 'Concluída',
                        isConcluida
                          ? `Tarefa reaberta por ${user.name}`
                          : `Tarefa concluída por ${user.name}`,
                      )
                    }
                    className={cn(
                      'p-1.5 rounded-full transition-colors border shrink-0 mt-0.5 sm:mt-0',
                      isConcluida
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'border-muted-foreground/30 hover:border-primary text-muted-foreground hover:text-primary',
                    )}
                    title={isConcluida ? 'Clique para reabrir tarefa' : 'Marcar como concluída'}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3
                        className={cn(
                          'font-semibold text-base text-foreground',
                          isConcluida && 'line-through text-muted-foreground',
                        )}
                      >
                        {t.titulo}
                      </h3>
                      <Badge variant="outline" className="text-[11px] bg-muted/20">
                        [{t.etapa_id}. {stageObj?.shortName || `Etapa ${t.etapa_id}`}]
                      </Badge>
                      <Badge
                        className={cn(
                          'text-[11px] font-semibold',
                          t.status === 'Concluída'
                            ? 'bg-emerald-600 text-white'
                            : t.status === 'Atrasada'
                              ? 'bg-destructive text-destructive-foreground'
                              : 'bg-muted text-muted-foreground',
                        )}
                      >
                        {t.status}
                      </Badge>
                    </div>

                    {t.descricao && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{t.descricao}</p>
                    )}

                    <div className="text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 mt-1">
                      <span className="font-medium text-foreground">
                        Responsável: <strong>{t.responsavel_nome || t.responsavel_id}</strong>
                      </span>
                      {t.contrato_id && <span>Contrato: {t.contrato_id}</span>}
                      {t.prazo && <span>Prazo: {t.prazo}</span>}
                      <span>Criado por: {t.criado_por || 'Master'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  <div
                    className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getPriorityColor(t.prioridade)}`}
                  >
                    {t.prioridade}
                  </div>
                  {isMaster && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive h-8 w-8"
                      onClick={() => handleDeleteTarefa(t.id, t.titulo)}
                      title="Excluir tarefa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            )
          })
        ) : (
          <div className="p-12 text-center border-2 border-dashed rounded-xl text-muted-foreground bg-muted/10">
            Nenhuma tarefa encontrada com os filtros atuais.
          </div>
        )}
      </div>

      {/* Modal: Atribuir Nova Tarefa (Master) */}
      <Dialog open={isNewModalOpen} onOpenChange={setIsNewModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              Atribuir Nova Tarefa / OS (Master)
            </DialogTitle>
            <DialogDescription className="text-xs">
              Defina quem vai ver e fazer o quê dentro do funil. O colaborador verá esta tarefa no
              seu &quot;Meu Dia&quot;.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <label className="font-medium text-foreground">Título da Tarefa / OS *</label>
              <Input
                placeholder="Ex: Realizar Vistoria de Entrada - CTR-002"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground">Descrição / Instruções</label>
              <Textarea
                placeholder="Detalhes operacionais, requisitos e orientações para o colaborador..."
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="min-h-[60px] text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-medium text-foreground">Colaborador Responsável *</label>
                <Select value={responsavelId} onValueChange={setResponsavelId}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="u4">Alice Santos (Vistoria)</SelectItem>
                    <SelectItem value="u3">João Paulo (Captação / Docs)</SelectItem>
                    <SelectItem value="u6">Camila Torres (Concierge)</SelectItem>
                    <SelectItem value="u5">Ricardo Mendes (Financeiro)</SelectItem>
                    <SelectItem value="u2">Marina Costa (Formalização)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground">Etapa do Funil *</label>
                <Select value={etapaId} onValueChange={setEtapaId}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {stages.map((stg) => (
                      <SelectItem key={stg.id} value={stg.id}>
                        {stg.id}. {stg.shortName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="font-medium text-foreground">Prioridade</label>
                <Select value={prioridade} onValueChange={(v: any) => setPrioridade(v)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Baixa">Baixa</SelectItem>
                    <SelectItem value="Média">Média</SelectItem>
                    <SelectItem value="Alta">Alta</SelectItem>
                    <SelectItem value="Crítica">Crítica</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground">Tipo de OS</label>
                <Select value={tipo} onValueChange={(v: any) => setTipo(v)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Operacional">Operacional</SelectItem>
                    <SelectItem value="Vistoria">Vistoria</SelectItem>
                    <SelectItem value="Manutenção">Manutenção</SelectItem>
                    <SelectItem value="Concierge">Concierge</SelectItem>
                    <SelectItem value="Administrativo">Administrativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground">Contrato Ref.</label>
                <Input
                  value={contratoId}
                  onChange={(e) => setContratoId(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-medium text-foreground">Prazo Final</label>
                <Input
                  type="date"
                  value={prazo}
                  onChange={(e) => setPrazo(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground">SLA (horas)</label>
                <Input
                  type="number"
                  value={slaHoras}
                  onChange={(e) => setSlaHoras(Number(e.target.value))}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="text-[11px] text-muted-foreground bg-muted/40 p-2 rounded">
              Ação executada por <strong>{user.name} (Master)</strong>. O registro será gravado de
              forma imutável em <code>log_auditoria</code>.
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsNewModalOpen(false)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleCreateTarefa}>
              Salvar e Atribuir Tarefa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
