import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Zap } from 'lucide-react'

export function AutomationRules() {
  return (
    <Card className="animate-in fade-in zoom-in-95 duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Zap className="w-6 h-6 text-primary" /> Automações & Gatilhos
        </CardTitle>
        <CardDescription>
          Configure regras de automação (Ex: Enviar NPS 7 dias após entrega de chaves).
        </CardDescription>
      </CardHeader>
      <CardContent className="min-h-[300px] flex items-center justify-center text-muted-foreground border-2 border-dashed m-6 mt-0 rounded-xl bg-muted/10 text-sm font-medium">
        Motor de Automações em desenvolvimento.
      </CardContent>
    </Card>
  )
}
