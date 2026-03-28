import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  change: string
  trend: 'up' | 'down' | 'warning' | 'neutral'
}

export function StatCard({ title, value, change, trend }: StatCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow duration-300 border-border">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-card">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="bg-card">
        <div className="text-3xl font-bold tracking-tight text-foreground">{value}</div>
        <p className="text-xs flex items-center mt-2 bg-muted/40 w-fit px-2 py-1 rounded-md">
          {trend === 'up' && <ArrowUpRight className="mr-1 h-3.5 w-3.5 text-success" />}
          {trend === 'down' && <ArrowDownRight className="mr-1 h-3.5 w-3.5 text-destructive" />}
          {trend === 'warning' && <Minus className="mr-1 h-3.5 w-3.5 text-warning" />}
          <span
            className={cn(
              'font-medium tracking-wide',
              trend === 'up' && 'text-success',
              trend === 'down' && 'text-destructive',
              trend === 'warning' && 'text-warning',
              trend === 'neutral' && 'text-muted-foreground',
            )}
          >
            {change}
          </span>
        </p>
      </CardContent>
    </Card>
  )
}
