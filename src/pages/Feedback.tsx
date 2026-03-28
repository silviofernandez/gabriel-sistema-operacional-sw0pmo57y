import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import useDataStore from '@/stores/useDataStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle2, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Feedback() {
  const [searchParams] = useSearchParams()
  const clientId = searchParams.get('clientId') || 'c1'
  const ticketId = searchParams.get('ticketId') || 'm1'

  const { clients, addNPSResponse } = useDataStore()

  const [score, setScore] = useState<number | null>(null)
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const client = clients.find((c) => c.id === clientId)

  const handleSubmit = () => {
    if (score === null) return

    let classification: 'Promotor' | 'Neutro' | 'Detrator' = 'Detrator'
    if (score >= 9) {
      classification = 'Promotor'
    } else if (score >= 7) {
      classification = 'Neutro'
    } else {
      classification = 'Detrator'
    }

    addNPSResponse({
      clientId: clientId,
      score,
      classification,
      comment,
      sourceTrigger: `fechamento_ticket_${ticketId}`,
      googleReviewSent: classification === 'Promotor',
    })

    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4 animate-fade-in">
        <Card className="w-full max-w-md shadow-xl text-center p-6 border-success/20">
          <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-10 w-10 text-success" />
          </div>
          <CardTitle className="text-2xl mb-2">Muito obrigado!</CardTitle>
          <CardDescription className="text-base text-muted-foreground mb-8">
            Sua avaliação foi registrada e o Health Score do cliente será recalculado dinamicamente.
          </CardDescription>
          <Button variant="outline" className="w-full h-12" onClick={() => window.close()}>
            Fechar Página
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 animate-fade-in-up">
      <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-inner mb-8">
        <Home className="h-8 w-8 text-primary-foreground" />
      </div>

      <Card className="w-full max-w-xl shadow-xl border-border/60">
        <CardHeader className="text-center pb-8">
          <CardTitle className="text-2xl font-bold">Pesquisa de Satisfação</CardTitle>
          <CardDescription className="text-base mt-2">
            Olá {client?.name?.split(' ')[0] || ''}, o seu chamado <strong>#{ticketId}</strong> foi
            concluído. Baseado na sua experiência, de 0 a 10, o quanto você recomendaria nossos
            serviços?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div>
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <button
                  key={n}
                  onClick={() => setScore(n)}
                  className={cn(
                    'w-10 h-10 sm:w-11 sm:h-11 rounded-md font-bold transition-all text-sm sm:text-base',
                    score === n
                      ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 scale-110 shadow-md'
                      : 'bg-muted text-muted-foreground hover:bg-primary/20 hover:text-primary',
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
            <div className="flex justify-between items-center mt-3 text-xs font-medium text-muted-foreground px-2">
              <span>0 - Nada Provável</span>
              <span>10 - Muito Provável</span>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">
              O que motivou sua nota? (Opcional)
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Conte-nos um pouco mais sobre sua experiência..."
              className="resize-none min-h-[120px] bg-background"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={score === null}
            className="w-full h-12 text-base"
          >
            Enviar Avaliação
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
