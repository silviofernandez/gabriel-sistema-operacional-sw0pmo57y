import { Client } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EventTimeline } from '@/components/shared/EventTimeline'
import { Phone, Mail, FileText, Activity, ShieldAlert } from 'lucide-react'

export function ClientDetailView({ client, events }: { client: Client; events: any[] }) {
  return (
    <div className="flex flex-col h-full bg-background overflow-y-auto animate-in slide-in-from-right-8 duration-300">
      <div className="p-6 border-b bg-muted/10">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">{client.name}</h2>
            <p className="text-sm text-muted-foreground mt-1 tracking-wider">{client.document}</p>
          </div>
          <Badge variant="outline" className="font-mono bg-background">
            {client.type}
          </Badge>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mt-6 bg-card p-4 rounded-xl border shadow-sm">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Mail className="w-4 h-4 text-primary" />{' '}
            <span className="truncate text-foreground font-medium">{client.email}</span>
          </div>
          <div className="flex items-center gap-3 text-muted-foreground">
            <Phone className="w-4 h-4 text-primary" />{' '}
            <span className="text-foreground font-medium">{client.whatsapp}</span>
          </div>
          <div className="flex items-center gap-3 text-muted-foreground">
            <Activity className="w-4 h-4 text-primary" />
            <span className="text-foreground font-medium flex items-center gap-2">
              Score CS:
              <Badge
                variant={
                  client.healthScore >= 80
                    ? 'success'
                    : client.healthScore >= 50
                      ? 'warning'
                      : 'destructive'
                }
              >
                {client.healthScore}/100
              </Badge>
            </span>
          </div>
          <div className="flex items-center gap-3 text-muted-foreground">
            <FileText className="w-4 h-4 text-primary" />
            <span className="text-foreground font-medium">Status: {client.status}</span>
          </div>
        </div>

        {client.healthScore < 50 && (
          <div className="mt-4 bg-destructive/10 border border-destructive/20 p-3 rounded-lg flex items-start gap-3 text-destructive text-sm">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <p className="leading-relaxed">
              <strong>Atenção:</strong> Este cliente encontra-se na zona de risco crítico. Priorize
              as demandas abertas para evitar quebra de contrato.
            </p>
          </div>
        )}
      </div>
      <div className="p-6">
        <h3 className="font-semibold text-lg flex items-center gap-2 mb-6">
          <Activity className="w-5 h-5 text-muted-foreground" /> Trilha de Relacionamento (CRM)
        </h3>
        <EventTimeline events={events} />
      </div>
    </div>
  )
}
