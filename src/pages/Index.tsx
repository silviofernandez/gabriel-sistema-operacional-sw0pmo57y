import { useState, useMemo } from 'react'
import { StatCard } from '@/components/dashboard/StatCard'
import { PortfolioBalanceChart } from '@/components/dashboard/PortfolioBalanceChart'
import { HealthChart } from '@/components/dashboard/HealthChart'
import { ManagerOKRView } from '@/components/dashboard/ManagerOKRView'
import { AlertList } from '@/components/dashboard/AlertList'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { db } from '@/lib/mock-data'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import useAuthStore from '@/stores/useAuthStore'
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export default function Dashboard() {
  const [month, setMonth] = useState('julho-2026')
  const { profileLevel } = useAuthStore()

  const comparisonData = [
    { name: 'Jan', alugados: 40, desocupacoes: 10 },
    { name: 'Fev', alugados: 45, desocupacoes: 12 },
    { name: 'Mar', alugados: 35, desocupacoes: 15 },
    { name: 'Abr', alugados: 50, desocupacoes: 11 },
    { name: 'Mai', alugados: 60, desocupacoes: 14 },
    { name: 'Jun', alugados: 55, desocupacoes: 16 },
    { name: 'Jul', alugados: 65, desocupacoes: 12 },
  ]

  const isDiretor = profileLevel === 'Diretor'

  const atingido = useMemo(() => {
    const base = db.contracts
      .filter((c) => c.status === 'Ativo' || c.status === 'Em Desocupação')
      .reduce((sum, c) => sum + c.rentValue, 0)

    // Simulando variação de produção conforme o mês selecionado
    if (month === 'maio-2026') return base * 0.65
    if (month === 'junho-2026') return base * 0.85
    return base
  }, [month])

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up pb-10 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Visão Geral</h1>
          <p className="text-muted-foreground mt-1">
            Dashboard estratégico e operacional da carteira AlugAI.
          </p>
        </div>
        <div className="w-full sm:w-64">
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="bg-card">
              <SelectValue placeholder="Selecione o mês (Histórico)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="maio-2026">Maio 2026</SelectItem>
              <SelectItem value="junho-2026">Junho 2026</SelectItem>
              <SelectItem value="julho-2026">Julho 2026</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="operacional" className="space-y-6">
        {isDiretor && (
          <TabsList className="bg-muted p-1 h-12 w-full md:w-auto grid grid-cols-2 md:inline-grid">
            <TabsTrigger
              value="operacional"
              className="data-[state=active]:bg-card h-full font-medium"
            >
              Operacional (Mês)
            </TabsTrigger>
            <TabsTrigger
              value="estrategico"
              className="data-[state=active]:bg-card h-full font-medium"
            >
              Estratégico (Carteira)
            </TabsTrigger>
          </TabsList>
        )}

        <TabsContent value="operacional" className="space-y-6 focus-visible:outline-none">
          {!isDiretor && <ManagerOKRView atingido={atingido} />}

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Contratos Ativos" value="1.248" change="+12 vs mês ant." trend="up" />
            <StatCard title="Alugados (Entradas)" value="65" change="+10 vs mês ant." trend="up" />
            <StatCard
              title="Desocupações (Saídas)"
              value="12"
              change="-4 vs mês ant."
              trend="down"
            />
            <StatCard
              title="Tarefas Atrasadas"
              value={db.tasks.filter((t) => t.status === 'Atrasada').length.toString()}
              change="Atenção requerida nos SLAs"
              trend="warning"
            />
          </div>

          <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
            <div className="col-span-full lg:col-span-2 flex flex-col gap-6">
              <Card className="flex-1">
                <CardHeader>
                  <CardTitle>Alugados vs Desocupações</CardTitle>
                  <CardDescription>
                    Comparativo mensal de entrada e saída de inquilinos
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={comparisonData}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorAlugados" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorDesocupacoes" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        vertical={false}
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                      />
                      <XAxis
                        dataKey="name"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: '8px',
                          border: '1px solid hsl(var(--border))',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="desocupacoes"
                        name="Desocupações"
                        stroke="hsl(var(--destructive))"
                        fillOpacity={1}
                        fill="url(#colorDesocupacoes)"
                      />
                      <Area
                        type="monotone"
                        dataKey="alugados"
                        name="Alugados"
                        stroke="hsl(var(--primary))"
                        fillOpacity={1}
                        fill="url(#colorAlugados)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
            <div className="flex flex-col gap-6">
              <HealthChart />
              <AlertList />
            </div>
          </div>
        </TabsContent>

        {isDiretor && (
          <TabsContent value="estrategico" className="space-y-6 focus-visible:outline-none">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <StatCard title="Total da Carteira" value="R$ 4.2M" change="+R$ 150k" trend="up" />
              <StatCard title="Taxa de Adm (10%)" value="R$ 420k" change="+R$ 15k" trend="up" />
              <StatCard title="Novos Contratos" value="R$ 180k" change="+15%" trend="up" />
              <StatCard title="Contratos Encerrados" value="R$ 45k" change="-5%" trend="down" />
              <StatCard title="Crescimento Líquido" value="R$ 135k" change="+8%" trend="up" />
            </div>
            <div className="grid gap-6 grid-cols-1">
              <PortfolioBalanceChart />
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
