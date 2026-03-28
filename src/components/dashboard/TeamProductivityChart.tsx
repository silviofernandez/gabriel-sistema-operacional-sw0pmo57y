import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Legend, Tooltip } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart'
import { teamProductivityData } from '@/lib/mock-data'

export function TeamProductivityChart() {
  const chartConfig = useMemo(
    () => ({
      completed: { label: 'Concluídas', color: 'hsl(var(--success))' },
      pending: { label: 'Pendentes', color: 'hsl(var(--primary))' },
    }),
    [],
  )

  return (
    <Card className="col-span-full lg:col-span-2 border-border shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Produtividade da Equipe</CardTitle>
        <CardDescription>Performance na resolução de tarefas por membro (SLA)</CardDescription>
      </CardHeader>
      <CardContent className="h-[300px] pt-4">
        <ChartContainer config={chartConfig}>
          <BarChart
            data={teamProductivityData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
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
              cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
              content={<ChartTooltipContent />}
            />
            <Legend
              iconType="circle"
              wrapperStyle={{ fontSize: '12px', paddingBottom: '10px' }}
              verticalAlign="top"
            />
            <Bar
              dataKey="completed"
              name="Tarefas Concluídas"
              fill="hsl(var(--success))"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
              stackId="a"
            />
            <Bar
              dataKey="pending"
              name="Tarefas Pendentes"
              fill="hsl(var(--primary))"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
              stackId="a"
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
