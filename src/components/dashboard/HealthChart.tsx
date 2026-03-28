import { useMemo } from 'react'
import { PieChart, Pie, Cell, Legend, Tooltip } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart'
import { operationalHealthData } from '@/lib/mock-data'

export function HealthChart() {
  const chartConfig = useMemo(
    () => ({
      concluidas: { label: 'Concluídas', color: 'hsl(var(--success))' },
      andamento: { label: 'Em Andamento', color: 'hsl(var(--primary))' },
      atrasadas: { label: 'Atrasadas', color: 'hsl(var(--destructive))' },
    }),
    [],
  )

  return (
    <Card className="col-span-full lg:col-span-1 border-border shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Saúde Operacional (SLA)</CardTitle>
        <CardDescription>Status das tarefas geradas automatica e manualmente</CardDescription>
      </CardHeader>
      <CardContent className="h-[300px] flex items-center justify-center pb-6">
        <ChartContainer config={chartConfig} className="w-full h-full">
          <PieChart>
            <Tooltip content={<ChartTooltipContent hideLabel />} />
            <Pie
              data={operationalHealthData}
              dataKey="value"
              nameKey="name"
              innerRadius={65}
              outerRadius={90}
              paddingAngle={4}
              stroke="none"
            >
              {operationalHealthData.map((entry, index) => (
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
  )
}
