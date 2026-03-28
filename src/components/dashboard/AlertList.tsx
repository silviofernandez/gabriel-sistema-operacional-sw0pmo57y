import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { alertsData } from '@/lib/mock-data'
import { AlertCircle, AlertTriangle, Info, BellRing } from 'lucide-react'
import { cn } from '@/lib/utils'

export function AlertList() {
  return (
    <Card className="h-full border-destructive/20 shadow-sm">
      <CardHeader className="pb-3 border-b border-border/50">
        <CardTitle className="text-lg flex items-center gap-2">
          <BellRing className="w-5 h-5 text-destructive animate-pulse" />
          Central de Escalonamentos
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-3">
          {alertsData.map((alert) => (
            <div
              key={alert.id}
              className={cn(
                'flex items-start gap-3 p-3.5 rounded-lg border transition-all hover:shadow-md',
                alert.type === 'danger' &&
                  'bg-destructive/10 border-destructive/30 text-destructive-foreground',
                alert.type === 'warning' && 'bg-warning/10 border-warning/30',
                alert.type === 'info' && 'bg-primary/10 border-primary/30',
              )}
            >
              <div className="mt-0.5 shrink-0">
                {alert.type === 'danger' && <AlertCircle className="h-5 w-5 text-destructive" />}
                {alert.type === 'warning' && <AlertTriangle className="h-5 w-5 text-warning" />}
                {alert.type === 'info' && <Info className="h-5 w-5 text-primary" />}
              </div>
              <div className="flex flex-col gap-1">
                <p
                  className={cn(
                    'text-sm font-semibold leading-tight',
                    alert.type === 'danger' ? 'text-destructive' : 'text-foreground',
                  )}
                >
                  {alert.title}
                </p>
                {alert.type === 'danger' && (
                  <span className="text-[10px] font-mono opacity-80 uppercase tracking-wider">
                    Ação Requerida - Notificado Gestor
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
