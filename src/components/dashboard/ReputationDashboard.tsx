import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { db } from '@/lib/mock-data'
import { ThumbsUp, ThumbsDown, MessageCircle, ExternalLink, Activity } from 'lucide-react'

export function ReputationDashboard() {
  const npsData = db.npsResponses
  // Mock total sent slightly higher to show a response rate
  const totalSent = 85
  const responses = npsData.length

  const promoters = npsData.filter((r) => r.classification === 'Promotor').length
  const neutrals = npsData.filter((r) => r.classification === 'Neutro').length
  const detractors = npsData.filter((r) => r.classification === 'Detrator').length

  const npsScore = Math.round(((promoters - detractors) / responses) * 100) || 0

  const googleReviews = npsData.filter((r) => r.googleReviewSent).length
  const conversionRate = promoters > 0 ? Math.round((googleReviews / promoters) * 100) : 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Score NPS Atual</CardTitle>
          <Activity className="w-4 h-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {npsScore} <span className="text-sm font-normal text-muted-foreground">pontos</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Zona de{' '}
            {npsScore >= 75
              ? 'Excelência'
              : npsScore >= 50
                ? 'Qualidade'
                : npsScore >= 0
                  ? 'Aperfeiçoamento'
                  : 'Crítica'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Total de Respostas</CardTitle>
          <MessageCircle className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{responses}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Taxa de resposta de {Math.round((responses / totalSent) * 100)}%
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Distribuição</CardTitle>
          <div className="flex items-center gap-1">
            <ThumbsUp className="w-3 h-3 text-success" />
            <ThumbsDown className="w-3 h-3 text-destructive" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 items-center text-sm font-medium">
            <span className="text-success">{promoters} P</span>
            <span className="text-muted-foreground">{neutrals} N</span>
            <span className="text-destructive">{detractors} D</span>
          </div>
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden flex mt-2">
            <div
              className="h-full bg-success"
              style={{ width: `${(promoters / responses) * 100}%` }}
            ></div>
            <div
              className="h-full bg-slate-400"
              style={{ width: `${(neutrals / responses) * 100}%` }}
            ></div>
            <div
              className="h-full bg-destructive"
              style={{ width: `${(detractors / responses) * 100}%` }}
            ></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Google Reviews</CardTitle>
          <ExternalLink className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {googleReviews}{' '}
            <span className="text-sm font-normal text-muted-foreground">geradas</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {conversionRate}% conversão (de Promotores)
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
