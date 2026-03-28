import { useMemo } from 'react'
import { CartesianGrid, XAxis, YAxis, ComposedChart, Bar, Line, Legend, Tooltip } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart'
import { portfolioGrowthData } from '@/lib/mock-data'

export function PortfolioBalanceChart() {
  const chartConfig = useMemo(
    () => ({
      novos: {
        label: 'Novos Contratos',
        color: 'hsl(var(--success))',
      },
      rescisoes: {
        label: 'Rescisões',
        color: 'hsl(var(--destructive))',
      },
      saldo: {
        label: 'Crescimento Líquido',
        color: 'hsl(var(--primary))',
      },
    }),
    [],
  )

  return (
    <Card className="col-span-full border-border shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Evolução do Portfólio (MoM)</CardTitle>
        <CardDescription>
          Visão de novos contratos inseridos vs rescindidos e a linha de crescimento líquido
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[320px] pt-4">
        <ChartContainer config={chartConfig}>
          <ComposedChart
            data={portfolioGrowthData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="month"
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
              content={<ChartTooltipContent />}
              cursor={{ fill: 'hsl(var(--muted))', opacity: 0.2 }}
            />
            <Legend
              verticalAlign="top"
              height={36}
              wrapperStyle={{ fontSize: '12px', paddingBottom: '10px' }}
              iconType="circle"
            />
            <Bar
              dataKey="novos"
              name="Novos Contratos"
              fill="hsl(var(--success))"
              radius={[4, 4, 0, 0]}
              maxBarSize={30}
            />
            <Bar
              dataKey="rescisoes"
              name="Rescisões"
              fill="hsl(var(--destructive))"
              radius={[4, 4, 0, 0]}
              maxBarSize={30}
            />
            <Line
              type="monotone"
              dataKey="saldo"
              name="Crescimento Líquido"
              stroke="hsl(var(--primary))"
              strokeWidth={3}
              dot={{ r: 4, strokeWidth: 2, fill: 'hsl(var(--background))' }}
              activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
            />
          </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
