import { useState, useRef, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Zap, Lock, UserCheck } from 'lucide-react'
import useAuthStore from '@/stores/useAuthStore'
import useDataStore from '@/stores/useDataStore'
import { useToast } from '@/hooks/use-toast'
import { ConciergeRecord, ConciergeStage } from '@/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ConciergeDetailDialog } from '@/components/concierge/ConciergeDetailDialog'
import { cn } from '@/lib/utils'

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

export default function Concierge() {
  const { user, profileLevel, role } = useAuthStore()
  const { db, updateConciergeRecord, runConciergeDailyRoutine } = useDataStore()
  const { toast } = useToast()

  const [selectedRecord, setSelectedRecord] = useState<ConciergeRecord | null>(null)

  const isGestor =
    profileLevel === 'Gestor' || profileLevel === 'Diretor' || role === 'Administrador'

  const prevRecordsRef = useRef(db.conciergeRecords || [])
  useEffect(() => {
    const current = db.conciergeRecords || []
    const prev = prevRecordsRef.current
    current.forEach((currRec) => {
      const prevRec = prev.find((p) => p.id === currRec.id)
      if (
        (!prevRec && currRec.responsavel_atual === user.id) ||
        (prevRec &&
          prevRec.responsavel_atual !== currRec.responsavel_atual &&
          currRec.responsavel_atual === user.id)
      ) {
        toast({
          title: 'Atendimento Concierge Atribuído',
          description: `Você é o novo responsável pelo contrato de ${currRec.cliente_nome} (Etapa: ${currRec.etapa_atual}).`,
        })
      }
    })
    prevRecordsRef.current = current
  }, [db.conciergeRecords, user.id, toast])

  const handleDragStart = (e: React.DragEvent, recordId: string) => {
    e.dataTransfer.setData('recordId', recordId)
  }

  const handleDrop = (e: React.DragEvent, stageId: ConciergeStage) => {
    e.preventDefault()
    const recordId = e.dataTransfer.getData('recordId')
    if (!recordId) return

    const record = db.conciergeRecords?.find((r) => r.id === recordId)
    if (!record) return

    if (!isGestor && record.responsavel_atual !== user.id) {
      toast({
        title: 'Acesso Negado',
        description: 'Você não tem permissão para mover este atendimento.',
        variant: 'destructive',
      })
      return
    }

    updateConciergeRecord(recordId, { etapa_atual: stageId })
  }

  const handleDragOver = (e: React.DragEvent) => e.preventDefault()

  const handleRunAutomation = () => {
    runConciergeDailyRoutine()
    toast({
      title: 'Motor de Automação Executado',
      description: 'As etapas foram atualizadas baseadas nas datas e regras de risco definidas.',
    })
  }

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] animate-fade-in-up w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 shrink-0 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <UserCheck className="w-8 h-8 text-primary" /> Concierge | Jornada do Cliente
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestão do relacionamento pós-chaves e detecção proativa de riscos de churn.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleRunAutomation}
            className="gap-2 text-indigo-600 border-indigo-200 bg-indigo-50 hover:bg-indigo-100"
          >
            <Zap className="w-4 h-4 fill-indigo-600" /> Executar Automação Diária
          </Button>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 flex-1 scrollbar-hide snap-x">
        {STAGES.map((column) => {
          const columnRecords = (db.conciergeRecords || []).filter(
            (r) => r.etapa_atual === column.id,
          )

          return (
            <div
              key={column.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
              className="flex flex-col w-[300px] shrink-0 bg-muted/40 rounded-xl border border-border/80 p-3 snap-start h-full"
            >
              <div className="flex items-center justify-between mb-4 px-1 shrink-0">
                <h3
                  className={cn(
                    'font-semibold text-sm truncate pr-2 tracking-wide',
                    column.id === 'RISCO' ? 'text-destructive' : 'text-foreground',
                  )}
                >
                  {column.name}
                </h3>
                <span className="text-xs bg-background text-muted-foreground px-2 py-0.5 rounded font-medium shadow-sm border">
                  {columnRecords.length}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto scrollbar-hide h-full space-y-3 min-h-[100px]">
                {columnRecords.map((record) => {
                  const isMine = record.responsavel_atual === user.id
                  const canEdit = isGestor || isMine
                  const assignee = db.users.find((u) => u.id === record.responsavel_atual)

                  return (
                    <Card
                      key={record.id}
                      draggable={canEdit}
                      onDragStart={(e) => handleDragStart(e, record.id)}
                      onClick={() => setSelectedRecord(record)}
                      className={cn(
                        'transition-all group relative overflow-hidden border-l-4 border-y border-r bg-card',
                        canEdit ? 'cursor-grab hover:shadow-md' : 'cursor-pointer opacity-80',
                        record.etapa_atual === 'RISCO'
                          ? 'border-l-destructive ring-destructive/20'
                          : record.status_cliente === 'renovacao'
                            ? 'border-l-warning'
                            : 'border-l-primary',
                      )}
                    >
                      <CardContent className="p-3">
                        <div className="flex justify-between items-start mb-2">
                          <Badge
                            variant="secondary"
                            className="font-mono text-[10px] bg-muted truncate max-w-[120px]"
                          >
                            {record.contrato_id}
                          </Badge>
                          {!canEdit && (
                            <Lock
                              className="w-3 h-3 text-muted-foreground"
                              title="Somente Leitura"
                            />
                          )}
                        </div>
                        <h4
                          className="font-semibold text-sm leading-tight text-foreground truncate"
                          title={record.cliente_nome}
                        >
                          {record.cliente_nome}
                        </h4>
                        <p
                          className="text-xs text-muted-foreground mt-1 truncate"
                          title={record.imovel}
                        >
                          {record.imovel}
                        </p>

                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/60">
                          <div
                            className="flex items-center gap-1.5"
                            title={`Responsável: ${assignee?.name}`}
                          >
                            <Avatar className="w-5 h-5 border shadow-sm">
                              <AvatarImage src={assignee?.avatar} />
                              <AvatarFallback>{assignee?.name?.charAt(0) || 'U'}</AvatarFallback>
                            </Avatar>
                            <span className="text-[10px] text-muted-foreground font-medium truncate max-w-[80px]">
                              {isMine ? 'Você' : assignee?.name?.split(' ')[0]}
                            </span>
                          </div>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            Contato: {record.ultimo_contato}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
                {columnRecords.length === 0 && (
                  <div className="h-24 border border-dashed border-border/60 bg-background/50 rounded-xl flex items-center justify-center text-muted-foreground text-xs font-medium">
                    Arrastar para cá
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <ConciergeDetailDialog
        record={selectedRecord}
        open={!!selectedRecord}
        onOpenChange={(o) => !o && setSelectedRecord(null)}
      />
    </div>
  )
}
