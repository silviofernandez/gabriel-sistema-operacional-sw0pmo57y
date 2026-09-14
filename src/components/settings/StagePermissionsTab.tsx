import { useState, useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
  ShieldAlert,
  UserCheck,
  Plus,
  Clock,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  RotateCcw,
  Sparkles,
} from 'lucide-react'
import usePipelineAccess from '@/stores/usePipelineAccess'
import useDataStore from '@/stores/useDataStore'
import { useToast } from '@/hooks/use-toast'

export function StagePermissionsTab() {
  const {
    stages,
    permissions,
    coverages,
    addPermission,
    removePermission,
    startCoverage,
    endCoverage,
  } = usePipelineAccess()
  const { db } = useDataStore()
  const { toast } = useToast()

  // Modal: Conceder Permissão Livre pelo Master
  const [isPermModalOpen, setIsPermModalOpen] = useState(false)
  const [permColaboradorId, setPermColaboradorId] = useState('u4')
  const [permEtapaId, setPermEtapaId] = useState('4')
  const [permTipo, setPermTipo] = useState<'permanente' | 'temporaria'>('permanente')
  const [permMotivo, setPermMotivo] = useState('Atribuição definida pelo Master')
  const [permDataFim, setPermDataFim] = useState('')

  // Modal: Fluxo de Cobertura de Ausência
  const [isCoverageModalOpen, setIsCoverageModalOpen] = useState(false)
  const [covAusenteId, setCovAusenteId] = useState('u4') // Alice Santos
  const [covSubstitutoId, setCovSubstitutoId] = useState('u3') // João Paulo
  const [covEtapas, setCovEtapas] = useState<string[]>(['4'])
  const [covDataRetorno, setCovDataRetorno] = useState('2026-09-21')
  const [covMotivo, setCovMotivo] = useState('Cobertura de ausência / licença')

  // Sugestão automática de quem tem menor carga para cobrir
  const suggestedSubstitute = useMemo(() => {
    // João Paulo ou Camila Torres
    return {
      id: 'u3',
      name: 'João Paulo',
      reason: 'Menor carga ativa de tarefas críticas hoje (2 tarefas pendentes)',
    }
  }, [])

  // Agrupamento de permissões permanentes por colaborador
  const groupedPerms = useMemo(() => {
    const map = new Map<string, { colabId: string; colabNome: string; etapas: string[] }>()

    // Mock inicial caso a base ainda não tenha tudo sincronizado
    const defaultColabs = [
      { id: 'u4', nome: 'Alice Santos', etapas: ['4', '8'] },
      { id: 'u3', nome: 'João Paulo', etapas: ['1', '2', '3'] },
      { id: 'u6', nome: 'Camila Torres', etapas: ['6', '7', '10'] },
      { id: 'u5', nome: 'Ricardo Mendes', etapas: ['9', '12'] },
      { id: 'u2', nome: 'Marina Costa', etapas: ['5', '11'] },
    ]

    defaultColabs.forEach((c) => {
      map.set(c.id, { colabId: c.id, colabNome: c.nome, etapas: [...c.etapas] })
    })

    permissions
      .filter((p) => p.tipo === 'permanente')
      .forEach((p) => {
        const existing = map.get(p.colaborador_id)
        if (existing) {
          if (!existing.etapas.includes(p.etapa_id)) {
            existing.etapas.push(p.etapa_id)
          }
        }
      })

    return Array.from(map.values())
  }, [permissions])

  const handleAddPermission = async () => {
    const colab = db.users.find((u) => u.id === permColaboradorId)
    const stage = stages.find((s) => s.id === permEtapaId)
    const ok = await addPermission({
      colaborador_id: permColaboradorId,
      etapa_id: permEtapaId,
      tipo: permTipo,
      data_inicio: new Date().toISOString().slice(0, 10),
      data_fim: permTipo === 'temporaria' ? permDataFim : undefined,
      motivo: permMotivo || `Permissão ${permTipo} concedida pelo Master`,
      autorizado_por: 'Carlos Silva (Master)',
      is_active: true,
    })
    if (ok) {
      toast({
        title: 'Permissão Concedida pelo Master',
        description: `Etapa "${stage?.shortName || permEtapaId}" liberada para ${colab?.name || permColaboradorId}. Registrado na auditoria.`,
      })
      setIsPermModalOpen(false)
    }
  }

  const handleRemovePermission = async (id: string, colabNome: string, stageName: string) => {
    const ok = await removePermission(id)
    if (ok) {
      toast({
        title: 'Permissão Revogada',
        description: `Acesso de ${colabNome} à etapa "${stageName}" foi revogado e registrado na auditoria.`,
      })
    }
  }

  const handleStartCoverage = async () => {
    const ok = await startCoverage({
      colaboradorAusenteId: covAusenteId,
      colaboradorSubstitutoId: covSubstitutoId,
      etapasCobertas: covEtapas,
      dataFimPrevista: covDataRetorno,
      motivo: covMotivo,
    })
    if (ok) {
      toast({
        title: 'Cobertura Iniciada!',
        description:
          'Acesso temporário liberado, notificação via WhatsApp enviada e registrado na trilha.',
      })
      setIsCoverageModalOpen(false)
    }
  }

  const handleEndCoverage = async (id: string) => {
    const ok = await endCoverage(id)
    if (ok) {
      toast({
        title: 'Colaborador Retornou!',
        description:
          'Acesso temporário do substituto revogado automaticamente e ambas partes notificadas via WhatsApp.',
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Bloco 1: Coberturas de Ausência (Temporárias) */}
      <div className="p-4 rounded-xl border bg-muted/20 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold flex items-center gap-2 text-foreground">
              <UserCheck className="w-5 h-5 text-amber-600" /> Coberturas de Ausência & Permissões
              Temporárias
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Substituição temporária com liberação de etapas, notificação WhatsApp e revogação
              automática no retorno.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setIsCoverageModalOpen(true)}
            className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
          >
            <Plus className="w-4 h-4" /> Nova Cobertura de Ausência
          </Button>
        </div>

        <div className="border rounded-md overflow-hidden bg-card">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="text-xs">
                <TableHead>Colaborador Ausente</TableHead>
                <TableHead>Substituto Designado</TableHead>
                <TableHead>Etapas Cobertas</TableHead>
                <TableHead>Período Previsto</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ação do Gestor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coverages.map((cov) => {
                const stageNames = cov.etapas_cobertas
                  .map((id) => stages.find((s) => s.id === id)?.shortName || `Etapa ${id}`)
                  .join(', ')
                const isAtiva = cov.status === 'ativa'

                return (
                  <TableRow key={cov.id} className="text-xs">
                    <TableCell className="font-medium text-foreground">
                      {cov.colaborador_ausente_nome}
                    </TableCell>
                    <TableCell className="font-semibold text-primary">
                      {cov.colaborador_substituto_nome}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-background text-[11px]">
                        {stageNames}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground">
                      {cov.data_inicio} até {cov.data_fim_prevista}
                    </TableCell>
                    <TableCell className="max-w-[180px] truncate" title={cov.motivo}>
                      {cov.motivo}
                    </TableCell>
                    <TableCell>
                      {isAtiva ? (
                        <Badge className="bg-amber-500 text-white text-[10px]">Em Andamento</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">
                          Concluída
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {isAtiva && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEndCoverage(cov.id)}
                          className="h-7 text-xs border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10 gap-1"
                        >
                          <RotateCcw className="w-3 h-3" /> Marcar "Retornou"
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}

              {coverages.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-muted-foreground text-xs">
                    Nenhuma cobertura de ausência ativa no momento.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Bloco 2: Atribuição Permanente de Etapas da Esteira */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold flex items-center gap-2 text-foreground">
              <ShieldAlert className="w-5 h-5 text-primary" /> Atribuições Livres pelo Master (Quem
              Vê e Faz o Quê no Funil)
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              O Master pode conceder a qualquer colaborador acesso a quantas etapas quiser
              (permanentes ou temporárias), sem restrição. Tudo registrado na auditoria com
              autorizado_por = Master.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setIsPermModalOpen(true)}
            className="gap-1.5 shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Plus className="w-4 h-4" /> Conceder Nova Permissão
          </Button>
        </div>

        <div className="border rounded-md overflow-hidden bg-card">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="text-xs">
                <TableHead>Colaborador</TableHead>
                <TableHead>Etapas Concedidas pelo Master</TableHead>
                <TableHead>Perfil Funcional</TableHead>
                <TableHead className="text-right">Total Etapas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groupedPerms.map((g) => {
                const userObj = db.users.find((u) => u.id === g.colabId)
                return (
                  <TableRow key={g.colabId} className="text-xs">
                    <TableCell className="font-semibold text-foreground">
                      <div className="flex items-center gap-2">
                        <span>{g.colabNome}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        {g.etapas.map((eid) => {
                          const stg = stages.find((s) => s.id === eid)
                          const permRec = permissions.find(
                            (p) => p.colaborador_id === g.colabId && p.etapa_id === eid,
                          )
                          return (
                            <Badge
                              key={eid}
                              variant="outline"
                              className="text-[11px] bg-muted/30 border-primary/20 text-foreground py-0.5 flex items-center gap-1"
                            >
                              <span>
                                [{eid}. {stg?.shortName || `Etapa ${eid}`}]
                              </span>
                              {permRec && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRemovePermission(
                                      permRec.id,
                                      g.colabNome,
                                      stg?.shortName || eid,
                                    )
                                  }
                                  className="ml-1 hover:text-destructive text-muted-foreground font-bold"
                                  title="Revogar etapa"
                                >
                                  ×
                                </button>
                              )}
                            </Badge>
                          )
                        })}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {userObj?.role || 'Colaborador Operacional'}
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      {g.etapas.length} etapa{g.etapas.length > 1 && 's'}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Modal: Nova Cobertura de Ausência */}
      <Dialog open={isCoverageModalOpen} onOpenChange={setIsCoverageModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
              <UserCheck className="w-5 h-5 text-amber-600" /> Fluxo de Cobertura de Ausência
            </DialogTitle>
            <DialogDescription className="text-xs leading-relaxed">
              Passos guiados para transferir temporariamente a esteira sem perda de controle de
              auditoria.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            {/* Passo 2: Colaborador ausente */}
            <div className="space-y-1">
              <label className="font-medium text-foreground">
                Passo 1 — Selecione o Colaborador em Ausência:
              </label>
              <Select value={covAusenteId} onValueChange={setCovAusenteId}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="u4">Alice Santos (Vistorias)</SelectItem>
                  <SelectItem value="u3">João Paulo (Captação / Docs)</SelectItem>
                  <SelectItem value="u6">Camila Torres (Concierge)</SelectItem>
                  <SelectItem value="u5">Ricardo Mendes (Financeiro)</SelectItem>
                  <SelectItem value="u2">Marina Costa (Formalização)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sugestão automática de menor carga */}
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-900 dark:text-emerald-200 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong>Sugestão inteligente do sistema: </strong>
                {suggestedSubstitute.name} possui a menor carga de SLA no momento (
                {suggestedSubstitute.reason}).
              </div>
            </div>

            {/* Passo 3: Substituto */}
            <div className="space-y-1">
              <label className="font-medium text-foreground">
                Passo 2 — Selecione quem vai cobrir (Substituto):
              </label>
              <Select value={covSubstitutoId} onValueChange={setCovSubstitutoId}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="u3">João Paulo (Sugerido)</SelectItem>
                  <SelectItem value="u4">Alice Santos</SelectItem>
                  <SelectItem value="u6">Camila Torres</SelectItem>
                  <SelectItem value="u5">Ricardo Mendes</SelectItem>
                  <SelectItem value="u2">Marina Costa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Etapa adicional a liberar */}
            <div className="space-y-1">
              <label className="font-medium text-foreground">
                Passo 3 — Etapas Adicionais Liberadas:
              </label>
              <Select value={covEtapas[0]} onValueChange={(val) => setCovEtapas([val])}>
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

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-medium text-foreground">Data Prevista de Retorno:</label>
                <Input
                  type="date"
                  value={covDataRetorno}
                  onChange={(e) => setCovDataRetorno(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="font-medium text-foreground">Autorizado Por:</label>
                <Input value="Carlos Silva (Gestor)" readOnly className="h-8 text-xs bg-muted" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground">Motivo Formal da Cobertura:</label>
              <Textarea
                value={covMotivo}
                onChange={(e) => setCovMotivo(e.target.value)}
                placeholder="Ex: Cobertura de ausência de Alice Santos durante período de recesso..."
                className="text-xs min-h-[60px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsCoverageModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleStartCoverage}
              className="bg-amber-600 hover:bg-amber-700 text-white gap-1"
            >
              <UserCheck className="w-3.5 h-3.5" /> Confirmar & Disparar WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Conceder Permissão Livre pelo Master */}
      <Dialog open={isPermModalOpen} onOpenChange={setIsPermModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              Conceder Permissão de Etapa (Master)
            </DialogTitle>
            <DialogDescription className="text-xs">
              O Master pode definir livremente quem vai ver e operar cada etapa da esteira.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <label className="font-medium text-foreground">Colaborador</label>
              <Select value={permColaboradorId} onValueChange={setPermColaboradorId}>
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
              <label className="font-medium text-foreground">Etapa da Esteira (Funil)</label>
              <Select value={permEtapaId} onValueChange={setPermEtapaId}>
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

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-medium text-foreground">Tipo de Permissão</label>
                <Select value={permTipo} onValueChange={(val: any) => setPermTipo(val)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="permanente">Permanente</SelectItem>
                    <SelectItem value="temporaria">Temporária</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {permTipo === 'temporaria' && (
                <div className="space-y-1">
                  <label className="font-medium text-foreground">Data Fim / Retorno</label>
                  <Input
                    type="date"
                    value={permDataFim}
                    onChange={(e) => setPermDataFim(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground">Motivo / Justificativa</label>
              <Input
                value={permMotivo}
                onChange={(e) => setPermMotivo(e.target.value)}
                placeholder="Ex: Ampliação de escopo para vistorias no setor Leste"
                className="h-8 text-xs"
              />
            </div>
            <div className="text-[11px] text-muted-foreground bg-muted/40 p-2 rounded">
              Autorizado por: <strong>Carlos Silva (Master)</strong> — ação registrada imutavelmente
              na Trilha de Auditoria.
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsPermModalOpen(false)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleAddPermission}>
              Conceder Permissão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
