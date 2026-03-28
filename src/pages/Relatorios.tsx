import { useState } from 'react'
import useAuthStore from '@/stores/useAuthStore'
import useDataStore from '@/stores/useDataStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  Legend,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts'
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertTriangle, TrendingUp, Users, CheckCircle2, Clock } from 'lucide-react'

export default function Relatorios() {
  const { profileLevel } = useAuthStore()
  const { clients, db } = useDataStore()
  const [period, setPeriod] = useState('30')

  if (profileLevel === 'Colaborador') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4 animate-in fade-in">
        <AlertTriangle className="h-16 w-16 text-warning" />
        <h2 className="text-2xl font-bold">Acesso Restrito</h2>
        <p className="text-muted-foreground text-center max-w-md">
          Esta visualização de Performance e Customer Success é exclusiva para perfis Gestor ou
          Diretor.
        </p>
      </div>
    )
  }

  const filterDate = (dateStr: string) => {
    if (period === 'all') return true
    const parts = dateStr.split('/')
    if (parts.length !== 3) return true
    const d = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0])).getTime()
    const now = new Date().getTime()
    const diffDays = (now - d) / (1000 * 3600 * 24)
    return diffDays <= Number(period)
  }

  const filteredNps = db.npsResponses.filter((n) => filterDate(n.date))

  const promoters = filteredNps.filter((n) => n.classification === 'Promotor').length
  const detractors = filteredNps.filter((n) => n.classification === 'Detrator').length
  const totalNps = filteredNps.length
  const globalNps = totalNps > 0 ? Math.round(((promoters - detractors) / totalNps) * 100) : 0

  const green = clients.filter((c) => c.healthScore >= 80).length
  const yellow = clients.filter((c) => c.healthScore >= 50 && c.healthScore < 80).length
  const red = clients.filter((c) => c.healthScore < 50).length

  const healthData = [
    { name: 'Saudável (Verde)', value: green, fill: 'hsl(var(--success))' },
    { name: 'Atenção (Amarelo)', value: yellow, fill: 'hsl(var(--warning))' },
    { name: 'Crítico (Vermelho)', value: red, fill: 'hsl(var(--destructive))' },
  ]

  const conciergeUsers = db.users.filter(
    (u) => u.role === 'Concierge' || u.role === 'Gestor' || u.profileLevel === 'Colaborador',
  )

  const performanceData = conciergeUsers
    .map((user) => {
      const userTasks = db.tasks.filter((t) => t.assigneeIds.includes(user.id))
      const resolved = userTasks.filter((t) => t.status === 'Concluída').length

      const userClients = clients.filter((c) => c.responsibleId === user.id).map((c) => c.id)
      const userNps = filteredNps.filter((n) => userClients.includes(n.clientId))

      const uPromoters = userNps.filter((n) => n.classification === 'Promotor').length
      const uDetractors = userNps.filter((n) => n.classification === 'Detrator').length
      const uTotalNps = userNps.length
      const uNpsScore =
        uTotalNps > 0 ? Math.round(((uPromoters - uDetractors) / uTotalNps) * 100) : 0

      return { name: user.name, resolved, nps: uNpsScore, responses: uTotalNps }
    })
    .filter((p) => p.resolved > 0 || p.responses > 0)

  const churnRiskClients = clients.filter((c) => (c.inRedForDays ?? 0) > 15 || c.healthScore < 50)

  // Eficiência Operacional Mock Data mapped by period
  const leadTimeData = [
    {
      priority: 'Crítica',
      time: period === '7' ? 1.8 : period === '30' ? 2.1 : 2.5,
      fill: 'hsl(var(--destructive))',
    },
    {
      priority: 'Alta',
      time: period === '7' ? 6.5 : period === '30' ? 7.2 : 8.0,
      fill: 'hsl(var(--warning))',
    },
    {
      priority: 'Média',
      time: period === '7' ? 22 : period === '30' ? 24 : 26,
      fill: 'hsl(var(--primary))',
    },
    {
      priority: 'Baixa',
      time: period === '7' ? 42 : period === '30' ? 45 : 50,
      fill: 'hsl(var(--secondary))',
    },
  ]

  const baseCompleted = db.tasks.filter((t) => t.status === 'Concluída').length
  let completedInPeriod = baseCompleted
  if (period === '7') completedInPeriod = Math.floor(baseCompleted * 0.3)
  if (period === '30') completedInPeriod = Math.floor(baseCompleted * 0.8)

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up pb-12 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Gerencial</h1>
          <p className="text-muted-foreground mt-1">
            Visão estratégica da saúde da carteira e eficiência da equipe (Lead Time).
          </p>
        </div>
        <div className="w-full sm:w-48 shrink-0">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="bg-card">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="all">Todo o período</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="cs" className="space-y-6">
        <TabsList className="bg-muted p-1 h-12 w-full md:w-auto grid grid-cols-2 md:inline-grid mb-2">
          <TabsTrigger value="cs" className="data-[state=active]:bg-card h-full font-medium">
            Customer Success
          </TabsTrigger>
          <TabsTrigger
            value="eficiencia"
            className="data-[state=active]:bg-card h-full font-medium"
          >
            Performance da Equipe
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cs" className="space-y-6 focus-visible:outline-none">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                  NPS Global (Período) <TrendingUp className="h-4 w-4 text-primary" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{globalNps}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Baseado em {totalNps} respostas
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                  Clientes Saudáveis <Users className="h-4 w-4 text-success" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{green}</div>
                <p className="text-xs text-success mt-1 font-medium">
                  {clients.length > 0 ? Math.round((green / clients.length) * 100) : 0}% da base
                </p>
              </CardContent>
            </Card>

            <Card className="border-destructive/30 bg-destructive/5 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-destructive flex items-center justify-between">
                  Risco de Churn <AlertTriangle className="h-4 w-4" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-destructive">{churnRiskClients.length}</div>
                <p className="text-xs text-destructive/80 mt-1 font-medium">
                  Clientes em estado crítico
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="col-span-1 flex flex-col shadow-sm">
              <CardHeader>
                <CardTitle>Distribuição Health Score</CardTitle>
                <CardDescription>Status atual da carteira baseado em SLA e NPS</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 pb-4 flex items-center justify-center">
                <ChartContainer config={{}} className="h-[280px] w-full">
                  <PieChart>
                    <RechartsTooltip content={<ChartTooltipContent hideLabel />} />
                    <Pie
                      data={healthData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={90}
                      paddingAngle={4}
                      stroke="none"
                    >
                      {healthData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                      wrapperStyle={{ fontSize: '12px' }}
                    />
                  </PieChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="col-span-1 lg:col-span-2 shadow-sm">
              <CardHeader>
                <CardTitle>NPS por Colaborador</CardTitle>
                <CardDescription>
                  Volume de demandas concluídas e Score NPS vinculado ao responsável
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="pl-6">Colaborador</TableHead>
                      <TableHead className="text-center">Demandas Resolvidas</TableHead>
                      <TableHead className="text-center">Score NPS Pessoal</TableHead>
                      <TableHead className="text-right pr-6">Volume Respostas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {performanceData.map((perf, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium pl-6">{perf.name}</TableCell>
                        <TableCell className="text-center">{perf.resolved}</TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={
                              perf.nps >= 75
                                ? 'success'
                                : perf.nps >= 50
                                  ? 'warning'
                                  : 'destructive'
                            }
                          >
                            {perf.nps}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-6 text-muted-foreground">
                          {perf.responses}
                        </TableCell>
                      </TableRow>
                    ))}
                    {performanceData.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          Nenhum dado encontrado no período selecionado.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {churnRiskClients.length > 0 && (
            <div className="mt-4 space-y-4">
              <h2 className="text-xl font-bold text-destructive flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" /> Monitoramento de Risco Crítico
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {churnRiskClients.map((client) => (
                  <Card
                    key={client.id}
                    className="border-destructive/30 shadow-sm relative overflow-hidden group hover:border-destructive/60 transition-colors"
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-destructive" />
                    <CardContent className="p-4 pl-5">
                      <div className="flex justify-between items-start mb-2 gap-2">
                        <h3 className="font-bold truncate" title={client.name}>
                          {client.name}
                        </h3>
                        <Badge variant="destructive" className="shrink-0">
                          Score {client.healthScore}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">
                        {client.type} • Resp:{' '}
                        {db.users.find((u) => u.id === client.responsibleId)?.name || 'N/A'}
                      </p>
                      <div className="text-xs bg-destructive/10 text-destructive px-2.5 py-1.5 rounded font-medium border border-destructive/20">
                        {(client.inRedForDays ?? 0) > 0
                          ? `Zona crítica (Red) há ${client.inRedForDays} dias.`
                          : 'SLA Crítico / Detrator recente.'}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="eficiencia" className="space-y-6 focus-visible:outline-none">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="shadow-sm border-success/30 bg-success/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-success flex items-center justify-between">
                  Tarefas Concluídas (Período) <CheckCircle2 className="h-4 w-4" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-success">{completedInPeriod}</div>
                <p className="text-xs text-success/80 mt-1 font-medium">
                  Total de demandas resolvidas
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" /> Tempo Médio de Resolução (Lead Time)
              </CardTitle>
              <CardDescription>
                Média de horas para a conclusão de tarefas segmentado por nível de prioridade.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[350px] pt-4">
              <ChartContainer
                config={{ time: { label: 'Tempo Médio (Horas)' } }}
                className="w-full h-full"
              >
                <BarChart data={leadTimeData} margin={{ top: 20, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid
                    vertical={false}
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="priority"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontWeight: 500 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <RechartsTooltip
                    cursor={{ fill: 'hsl(var(--muted))' }}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Bar dataKey="time" radius={[6, 6, 0, 0]} maxBarSize={80}>
                    {leadTimeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
