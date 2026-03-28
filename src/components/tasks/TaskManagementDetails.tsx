import { useState } from 'react'
import { Task } from '@/types'
import { db } from '@/lib/mock-data'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Badge } from '@/components/ui/badge'

interface Props {
  task: Task
  onClose?: () => void
}

export function TaskManagementDetails({ task, onClose }: Props) {
  const { toast } = useToast()
  const [assignee, setAssignee] = useState(task.assigneeIds[0] || '')
  const [priority, setPriority] = useState(task.priority)
  const [deadline, setDeadline] = useState(task.deadline)
  const [sla, setSla] = useState(task.sla.toString())
  const [specialStatus, setSpecialStatus] = useState(task.specialStatus || 'Nenhum')

  const handleSave = () => {
    let changed = false
    if (!task.history) task.history = []

    if (assignee !== task.assigneeIds[0]) {
      task.history.unshift({
        id: Date.now().toString(),
        date: new Date().toLocaleString('pt-BR'),
        user: 'Gestor (Você)',
        action: `Tarefa reatribuída para o usuário correspondente.`,
      })
      changed = true
      toast({
        title: 'Responsável Notificado',
        description: 'O novo responsável foi notificado e a tarefa atualizada no Meu Dia.',
      })
    }

    if (priority !== task.priority) {
      task.history.unshift({
        id: Date.now().toString() + '1',
        date: new Date().toLocaleString('pt-BR'),
        user: 'Gestor (Você)',
        action: `Prioridade ajustada para ${priority}.`,
      })
      changed = true
    }

    if (deadline !== task.deadline || specialStatus !== (task.specialStatus || 'Nenhum')) {
      changed = true
    }

    if (changed) {
      toast({
        title: 'Tarefa Atualizada',
        description: 'As configurações de gestão foram salvas e registradas no histórico.',
      })
    } else {
      toast({
        title: 'Sem Alterações',
        description: 'Nenhuma modificação detectada nos parâmetros.',
      })
    }

    onClose?.()
  }

  const propertyTitle =
    db.properties.find((p) => p.id === task.propertyId)?.title || 'Sem Imóvel Vinculado'

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg border">
        <div>
          <Label className="text-muted-foreground text-xs uppercase tracking-wider">
            Tipo de Tarefa
          </Label>
          <div className="font-medium text-sm mt-1">{task.type || 'N/A'}</div>
        </div>
        <div>
          <Label className="text-muted-foreground text-xs uppercase tracking-wider">
            Status Atual
          </Label>
          <div className="mt-1">
            <Badge
              variant={
                task.status === 'Concluída'
                  ? 'success'
                  : task.status === 'Atrasada'
                    ? 'destructive'
                    : 'default'
              }
            >
              {task.status}
            </Badge>
          </div>
        </div>
        <div className="col-span-2">
          <Label className="text-muted-foreground text-xs uppercase tracking-wider">
            Contrato Vinculado
          </Label>
          <div className="font-medium text-sm mt-1">
            {task.contractId ? `${task.contractId} - ${propertyTitle}` : 'N/A'}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-semibold text-foreground border-b pb-2">Controles de Gestão</h4>

        <div className="space-y-2">
          <Label>Reatribuir Responsável</Label>
          <Select value={assignee} onValueChange={setAssignee}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um usuário..." />
            </SelectTrigger>
            <SelectContent>
              {db.users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Prioridade</Label>
            <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
              <SelectTrigger>
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
          <div className="space-y-2">
            <Label>Status Especial</Label>
            <Select value={specialStatus} onValueChange={(v: any) => setSpecialStatus(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Nenhum">Nenhum</SelectItem>
                <SelectItem value="Em acompanhamento">Em acompanhamento</SelectItem>
                <SelectItem value="Crítica">Crítica</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Prazo (Deadline)</Label>
            <Input value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>SLA (Horas)</Label>
            <Input type="number" value={sla} onChange={(e) => setSla(e.target.value)} />
          </div>
        </div>
      </div>

      <Button onClick={handleSave} className="w-full mt-4">
        Salvar Alterações
      </Button>
    </div>
  )
}
