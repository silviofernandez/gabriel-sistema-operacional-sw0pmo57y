import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ConciergeRecord, ConciergeStage } from '@/types'
import useAuthStore from '@/stores/useAuthStore'
import useDataStore from '@/stores/useDataStore'
import { Badge } from '@/components/ui/badge'
import { Building, ShieldAlert } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Props {
  record: ConciergeRecord | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const STAGES: { id: ConciergeStage; name: string }[] = [
  { id: 'INICIO', name: 'Início' },
  { id: 'D+5', name: 'D+5' },
  { id: 'FINANCEIRO', name: 'Financeiro' },
  { id: 'ESTABILIZACAO', name: 'Estabilização' },
  { id: 'OPERACAO', name: 'Operação' },
  { id: 'MANUTENCAO_6M', name: 'Manutenção 6M' },
  { id: 'PRE_RENOVACAO', name: 'Pré-Renovação' },
  { id: 'NEGOCIACAO', name: 'Negociação' },
  { id: 'RISCO', name: 'Em Risco' },
  { id: 'FINALIZADO', name: 'Finalizado' },
]

export function ConciergeDetailDialog({ record, open, onOpenChange }: Props) {
  const { user, profileLevel, role } = useAuthStore()
  const { db, updateConciergeRecord } = useDataStore()
  const { toast } = useToast()

  const [formData, setFormData] = useState<Partial<ConciergeRecord>>({})

  useEffect(() => {
    if (record && open) {
      setFormData(record)
    }
  }, [record, open])

  if (!record) return null

  const isGestor =
    profileLevel === 'Gestor' || profileLevel === 'Diretor' || role === 'Administrador'
  const isMine = record.responsavel_atual === user.id
  const canEdit = isGestor || isMine

  const handleSave = () => {
    if (!canEdit) return
    updateConciergeRecord(record.id, formData)
    toast({ title: 'Sucesso', description: 'Atendimento atualizado com sucesso.' })
    onOpenChange(false)
  }

  const responsibleUser = db.users.find((u) => u.id === formData.responsavel_atual)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Atendimento Concierge</span>
            <Badge variant="outline" className="font-mono text-xs bg-muted">
              {record.contrato_id}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Detalhes da jornada pós-chaves do cliente.
            {!canEdit && (
              <span className="block text-destructive mt-1 flex items-center mt-2 font-medium bg-destructive/10 w-fit px-2 py-1 rounded">
                <ShieldAlert className="inline w-3.5 h-3.5 mr-1.5" /> Somente leitura. Você não é o
                responsável ou gestor.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4 bg-muted/20 p-3 rounded-lg border">
            <div>
              <Label className="text-xs text-muted-foreground">Inquilino</Label>
              <div className="font-medium">{record.cliente_nome}</div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Proprietário</Label>
              <div className="font-medium">{record.proprietario_nome}</div>
            </div>
            <div className="col-span-2">
              <Label className="text-xs text-muted-foreground">Imóvel</Label>
              <div className="font-medium text-sm flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-primary" /> {record.imovel}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Etapa Atual</Label>
              <Select
                value={formData.etapa_atual}
                onValueChange={(val: ConciergeStage) =>
                  setFormData((prev) => ({ ...prev, etapa_atual: val }))
                }
                disabled={!canEdit}
              >
                <SelectTrigger className="bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAGES.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Responsável</Label>
              <Select
                value={formData.responsavel_atual}
                onValueChange={(val) =>
                  setFormData((prev) => ({ ...prev, responsavel_atual: val }))
                }
                disabled={!isGestor}
              >
                <SelectTrigger className="bg-card">
                  <SelectValue>{responsibleUser?.name || 'Selecione'}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {db.users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!isGestor && canEdit && (
                <span className="text-[10px] text-muted-foreground block leading-tight">
                  Apenas gestores podem reatribuir livremente. A automação ajustará em mudanças de
                  etapa.
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Último Contato</Label>
              <Input
                value={formData.ultimo_contato || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, ultimo_contato: e.target.value }))
                }
                disabled={!canEdit}
                placeholder="DD/MM/YYYY"
                className="bg-card"
              />
            </div>
            <div className="space-y-2">
              <Label>Próximo Contato</Label>
              <Input
                value={formData.proximo_contato || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, proximo_contato: e.target.value }))
                }
                disabled={!canEdit}
                placeholder="DD/MM/YYYY"
                className="bg-card"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 border-t pt-4 mt-2">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-muted-foreground">Entrega Chaves</Label>
              <div className="text-sm font-mono bg-muted/50 px-2 py-1 rounded inline-block">
                {record.data_entrega_chave}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-muted-foreground">Fim Contrato</Label>
              <div className="text-sm font-mono bg-muted/50 px-2 py-1 rounded inline-block">
                {record.data_fim_contrato}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-muted-foreground">
                Vencimento Atual
              </Label>
              <div className="text-sm font-mono bg-muted/50 px-2 py-1 rounded inline-block">
                {record.data_vencimento_boleto}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 mt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          {canEdit && <Button onClick={handleSave}>Salvar Alterações</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
