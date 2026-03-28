import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Target } from 'lucide-react'

export function GoalsManagement() {
  return (
    <Card className="animate-in fade-in zoom-in-95 duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Target className="w-6 h-6 text-primary" /> Metas & OKRs
        </CardTitle>
        <CardDescription>
          Defina as metas mensais de aluguéis e faturamento para acompanhamento no Dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent className="min-h-[300px] flex items-center justify-center text-muted-foreground border-2 border-dashed m-6 mt-0 rounded-xl bg-muted/10 text-sm font-medium">
        Gestão de Metas em desenvolvimento.
      </CardContent>
    </Card>
  )
}
