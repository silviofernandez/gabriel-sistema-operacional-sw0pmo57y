import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Bot } from 'lucide-react'

export function AIControlPanel() {
  return (
    <Card className="animate-in fade-in zoom-in-95 duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Bot className="w-6 h-6 text-indigo-500" /> Inteligência Artificial (Copilot)
        </CardTitle>
        <CardDescription>
          Ajuste as priorizações de IA, tom de voz para comunicação com clientes e consumo de
          tokens.
        </CardDescription>
      </CardHeader>
      <CardContent className="min-h-[300px] flex items-center justify-center text-muted-foreground border-2 border-dashed m-6 mt-0 rounded-xl bg-muted/10 text-sm font-medium">
        Painel de Configuração de IA em desenvolvimento.
      </CardContent>
    </Card>
  )
}
