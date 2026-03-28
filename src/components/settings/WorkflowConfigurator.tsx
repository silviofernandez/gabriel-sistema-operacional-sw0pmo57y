import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { KanbanSquare } from 'lucide-react'

export function WorkflowConfigurator() {
  return (
    <Card className="animate-in fade-in zoom-in-95 duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <KanbanSquare className="w-6 h-6 text-primary" /> Editor de Kanban & SLA
        </CardTitle>
        <CardDescription>
          Crie etapas personalizadas para os processos de Locação e Desocupação e defina SLAs
          globais.
        </CardDescription>
      </CardHeader>
      <CardContent className="min-h-[300px] flex items-center justify-center text-muted-foreground border-2 border-dashed m-6 mt-0 rounded-xl bg-muted/10 text-sm font-medium">
        Editor Visual de Fluxos em desenvolvimento.
      </CardContent>
    </Card>
  )
}
