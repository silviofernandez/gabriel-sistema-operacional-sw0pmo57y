import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { BrainCircuit, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function AISummaryWidget({ clientId }: { clientId: string }) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [summary, setSummary] = useState<string[] | null>(null)
  const { toast } = useToast()

  const generateSummary = () => {
    setIsGenerating(true)
    setTimeout(() => {
      setSummary([
        'Cliente possui um histórico longo e positivo (score 95%).',
        'Último contato foi referente à "Vistoria Preventiva" em abril, resolvido sem atritos.',
        'Não há pendências financeiras ativas ou registros de atraso.',
        'Sugestão: Abordagem amigável para sondagem de renovação de contrato nos próximos meses.',
      ])
      setIsGenerating(false)
      toast({ title: 'Resumo Concluído', description: 'A IA sintetizou os eventos do cliente.' })
    }, 1500)
  }

  return (
    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-primary" />
          <span className="font-semibold text-primary">Sintetizador IA</span>
        </div>
        {!summary && (
          <Button
            size="sm"
            onClick={generateSummary}
            disabled={isGenerating}
            className="bg-primary/10 text-primary hover:bg-primary/20 border-0"
          >
            {isGenerating ? (
              <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
            ) : (
              <BrainCircuit className="w-3.5 h-3.5 mr-2" />
            )}
            Gerar Resumo do CRM
          </Button>
        )}
      </div>

      {summary && (
        <div className="space-y-2 animate-fade-in mt-2 text-sm text-foreground/80">
          <ul className="list-disc pl-4 space-y-1.5">
            {summary.map((point, idx) => (
              <li key={idx} className="leading-snug">
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
