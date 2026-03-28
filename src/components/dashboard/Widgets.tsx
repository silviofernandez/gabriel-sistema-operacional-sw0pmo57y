import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { db } from '@/lib/mock-data'
import { Clock, ShieldAlert, RefreshCw } from 'lucide-react'

export function OverdueTasksWidget() {
  const overdueTasks = db.tasks.filter((t) => t.status === 'Atrasada')

  return (
    <Card className="h-full border-destructive/20 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3 border-b border-border/50 bg-destructive/5">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Clock className="w-4 h-4 text-destructive" />
          Tarefas Atrasadas ({overdueTasks.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-3">
        {overdueTasks.slice(0, 4).map((task) => (
          <div
            key={task.id}
            className="flex flex-col gap-1.5 border-b border-border/50 pb-3 last:border-0 last:pb-0"
          >
            <span className="text-sm font-medium leading-snug line-clamp-2">{task.title}</span>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                SLA: {task.sla}h
              </span>
              <Badge variant="destructive" className="text-[9px] py-0 h-4 uppercase tracking-wider">
                Atrasada
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export function ContractsRiskWidget() {
  const riskContracts = db.contracts.filter((c) => c.healthScore < 50)

  return (
    <Card className="h-full border-warning/20 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3 border-b border-border/50 bg-warning/5">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-warning" />
          Contratos em Risco ({riskContracts.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-3">
        {riskContracts.map((contract) => {
          const client = db.clients.find((c) => c.id === contract.tenantId)
          return (
            <div
              key={contract.id}
              className="flex flex-col gap-1.5 border-b border-border/50 pb-3 last:border-0 last:pb-0"
            >
              <span className="text-sm font-medium leading-snug">
                {contract.id} • {client?.name}
              </span>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  Score CS: {contract.healthScore}
                </span>
                <Badge variant="warning" className="text-[9px] py-0 h-4 uppercase tracking-wider">
                  Atenção
                </Badge>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

export function UpcomingRenewalsWidget() {
  const renewals = db.contracts.filter(
    (c) => c.status === 'Renovação Pendente' || c.status === 'Em Desocupação',
  )

  return (
    <Card className="h-full border-primary/20 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3 border-b border-border/50 bg-primary/5">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-primary" />
          Atenção Comercial ({renewals.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-3">
        {renewals.map((contract) => {
          const client = db.clients.find((c) => c.id === contract.tenantId)
          const isMoveout = contract.status === 'Em Desocupação'
          return (
            <div
              key={contract.id}
              className="flex flex-col gap-1.5 border-b border-border/50 pb-3 last:border-0 last:pb-0"
            >
              <span className="text-sm font-medium leading-snug">
                {contract.id} • {client?.name}
              </span>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  Vence: {contract.endDate}
                </span>
                <Badge
                  variant={isMoveout ? 'destructive' : 'secondary'}
                  className="text-[9px] py-0 h-4 uppercase tracking-wider"
                >
                  {isMoveout ? 'Desocupação' : 'Renovação'}
                </Badge>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
