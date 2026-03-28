import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { DollarSign, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react'

export default function Financeiro() {
  return (
    <div className="flex flex-col gap-6 animate-fade-in-up pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
        <p className="text-muted-foreground mt-1">
          Gestão de repasses, conciliação bancária, cobranças e pagamentos de manutenção.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-2">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              Receita Projetada (Mês) <DollarSign className="h-4 w-4 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 145.200,00</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3 text-success" /> +4% em relação ao mês anterior
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              Repasses Pendentes <Activity className="h-4 w-4 text-warning" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 32.500,00</div>
            <p className="text-xs text-muted-foreground mt-1">12 proprietários aguardando</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              Inadimplência <ArrowDownRight className="h-4 w-4 text-destructive" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">4.2%</div>
            <p className="text-xs text-muted-foreground mt-1">Risco controlado (Tolerância: 5%)</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Visão Geral de Extratos</CardTitle>
          <CardDescription>Consolidação e conciliação em tempo real</CardDescription>
        </CardHeader>
        <CardContent className="h-64 flex flex-col items-center justify-center text-muted-foreground bg-muted/10 border border-dashed rounded-lg mx-6 mb-6 mt-2">
          <DollarSign className="h-12 w-12 opacity-20 mb-4" />
          <p className="font-medium">Módulo Financeiro Integrado em desenvolvimento.</p>
        </CardContent>
      </Card>
    </div>
  )
}
