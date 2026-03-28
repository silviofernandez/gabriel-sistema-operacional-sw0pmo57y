import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import useGoalStore from '@/stores/useGoalStore'
import { Target, Trophy, Flame } from 'lucide-react'

interface ManagerOKRViewProps {
  atingido: number
}

export function ManagerOKRView({ atingido }: ManagerOKRViewProps) {
  const { meta1, meta2, supermeta } = useGoalStore()

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

  const renderMeta = (
    title: string,
    metaValue: number,
    icon: React.ReactNode,
    colorClass: string,
  ) => {
    const percentage = Math.min((atingido / metaValue) * 100, 100)
    const falta = Math.max(metaValue - atingido, 0)
    const isAchieved = atingido >= metaValue

    return (
      <div className="space-y-3 p-4 rounded-xl border bg-card shadow-sm hover:shadow-md transition-all duration-300">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            {icon} {title}
          </div>
          <div className="text-right">
            <span className="text-sm font-medium text-muted-foreground block">
              Meta: {formatCurrency(metaValue)}
            </span>
          </div>
        </div>
        <Progress
          value={percentage}
          indicatorColor={isAchieved ? 'bg-success' : colorClass}
          className="h-2.5 shadow-inner bg-muted"
        />
        <div className="flex justify-between text-[13px] mt-1 items-end">
          <span className="font-semibold text-primary">
            Atingido: <span className="text-foreground">{formatCurrency(atingido)}</span> (
            {percentage.toFixed(1)}%)
          </span>
          {!isAchieved ? (
            <span className="text-muted-foreground font-medium">
              Falta: {formatCurrency(falta)}
            </span>
          ) : (
            <span className="text-success font-bold flex items-center gap-1">Concluído! 🎉</span>
          )}
        </div>
      </div>
    )
  }

  return (
    <Card className="col-span-full border-border shadow-sm mb-2 bg-gradient-to-br from-background to-muted/20">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl flex items-center gap-2 text-foreground">
          <Target className="w-5 h-5 text-primary" /> Acompanhamento de Metas (OKRs)
        </CardTitle>
        <CardDescription className="text-[15px]">
          Sua produção atual baseada na inserção de novos contratos e fechamentos no período
          selecionado.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {renderMeta('Meta 1', meta1, <Target className="w-4 h-4 text-blue-500" />, 'bg-blue-500')}
        {renderMeta(
          'Meta 2',
          meta2,
          <Trophy className="w-4 h-4 text-purple-500" />,
          'bg-purple-500',
        )}
        {renderMeta(
          'Supermeta',
          supermeta,
          <Flame className="w-4 h-4 text-orange-500" />,
          'bg-orange-500',
        )}
      </CardContent>
    </Card>
  )
}
