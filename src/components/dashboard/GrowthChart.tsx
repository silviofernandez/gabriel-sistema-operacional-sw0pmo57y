import { useMemo } from 'react'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { growthData } from '@/lib/mock-data'

export function GrowthChart() {
  const chartConfig = useMemo(
    () => ({
      novos: {
        label: 'Novos Contratos',
        color: 'hsl(var(--chart-1))',
      },
      rescisoes: {
        label: 'Rescisões',
        color: 'hsl(var(--chart-4))',
      },
    }),
    [],
  )

  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader>
        <CardTitle>Crescimento de Contratos</CardTitle>
        <CardDescription>
          Evolução de novos contratos vs. rescisões nos últimos 6 meses
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ChartContainer config={chartConfig}>
          <AreaChart data={growthData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="fillNovos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-novos)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-novos)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillRescisoes" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-rescisoes)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-rescisoes)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Area
              type="monotone"
              dataKey="rescisoes"
              stroke="var(--color-rescisoes)"
              fillOpacity={1}
              fill="url(#fillRescisoes)"
            />
            <Area
              type="monotone"
              dataKey="novos"
              stroke="var(--color-novos)"
              fillOpacity={1}
              fill="url(#fillNovos)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
