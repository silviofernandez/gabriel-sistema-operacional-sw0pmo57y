import { useState } from 'react'
import { db } from '@/lib/mock-data'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus, AlertTriangle, KeySquare } from 'lucide-react'

const moveOutStages = [
  { id: 'aviso', name: 'Aviso Registrado' },
  { id: 'vistoria', name: 'Vistoria de Saída' },
  { id: 'comparar', name: 'Comparar & Danos' },
  { id: 'manutencao', name: 'Manutenção' },
  { id: 'acerto', name: 'Acerto & Contas' },
  { id: 'chaves', name: 'Chaves & Encerrar' },
]

export default function Desocupacoes() {
  const [flows, setFlows] = useState(db.moveOutFlows)

  const handleDragStart = (e: React.DragEvent, flowId: string) => {
    e.dataTransfer.setData('flowId', flowId)
  }

  const handleDrop = (e: React.DragEvent, stageId: string) => {
    e.preventDefault()
    const flowId = e.dataTransfer.getData('flowId')
    setFlows(flows.map((f) => (f.id === flowId ? { ...f, stage: stageId as any } : f)))
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const getContractDetails = (contractId: string) => {
    const contract = db.contracts.find((c) => c.id === contractId)
    const property = db.properties.find((p) => p.id === contract?.propertyId)
    const tenant = db.clients.find((c) => c.id === contract?.tenantId)
    return { contract, property, tenant }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] animate-fade-in-up">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workflow de Desocupação</h1>
          <p className="text-muted-foreground mt-1">
            Gestão inteligente de saída: vistorias, manutenções alocadas e rescisão de contrato.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button>
            <KeySquare className="mr-2 h-4 w-4" /> Registrar Aviso
          </Button>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 flex-1 scrollbar-hide snap-x">
        {moveOutStages.map((column) => (
          <div
            key={column.id}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
            className="flex flex-col w-[300px] shrink-0 bg-muted/40 rounded-xl border border-border/80 p-3 snap-start"
          >
            <div className="flex items-center justify-between mb-4 px-1">
              <h3 className="font-semibold text-sm truncate pr-2 tracking-wide text-foreground">
                {column.name}
              </h3>
              <span className="text-xs bg-background text-muted-foreground px-2 py-0.5 rounded font-medium shadow-sm border">
                {flows.filter((f) => f.stage === column.id).length}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-hide space-y-3">
              {flows
                .filter((f) => f.stage === column.id)
                .map((flow) => {
                  const { property, tenant } = getContractDetails(flow.contractId)
                  return (
                    <Card
                      key={flow.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, flow.id)}
                      className="cursor-grab hover:shadow-md transition-all group relative overflow-hidden border-l-4 border-l-warning hover:ring-2 ring-warning/20 border-y border-r"
                    >
                      <CardContent className="p-3">
                        <div className="flex justify-between items-start mb-2">
                          <Badge variant="secondary" className="font-mono text-[10px] bg-muted">
                            {flow.contractId}
                          </Badge>
                          <span className="text-[10px] font-bold text-warning flex items-center">
                            <AlertTriangle className="w-3 h-3 mr-1" /> Saída:{' '}
                            {flow.expectedExitDate}
                          </span>
                        </div>
                        <h4 className="font-semibold text-sm leading-tight line-clamp-2 text-foreground">
                          {property?.title}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          Inq: {tenant?.name}
                        </p>

                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50">
                          <div className="text-[10px] text-muted-foreground font-mono">
                            Aviso: {flow.noticeDate}
                          </div>
                          <span className="text-[10px] text-primary font-medium hover:underline cursor-pointer">
                            Ver Processo
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              {flows.filter((f) => f.stage === column.id).length === 0 && (
                <div className="h-24 border border-dashed border-border/60 bg-background/50 rounded-xl flex items-center justify-center text-muted-foreground text-xs font-medium">
                  Arrastar item para cá
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
