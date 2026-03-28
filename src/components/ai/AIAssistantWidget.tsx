import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Bot, Sparkles, Copy, CheckCircle2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface AIAssistantWidgetProps {
  contextPrompt: string
}

export function AIAssistantWidget({ contextPrompt }: AIAssistantWidgetProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [message, setMessage] = useState('')
  const [isCopied, setIsCopied] = useState(false)
  const { toast } = useToast()

  const generateMessage = () => {
    setIsGenerating(true)
    // Simulate AI delay
    setTimeout(() => {
      setMessage(`Olá! Tudo bem? Sou o concierge da AlugAI. 

Analisando a sua jornada atual, vi que precisamos do seu apoio para o seguinte passo: "${contextPrompt}". 

Poderia nos retornar assim que possível para darmos andamento de forma ágil?
Qualquer dúvida, estou à disposição!`)
      setIsGenerating(false)
      toast({
        title: 'Mensagem Gerada',
        description: 'A IA gerou uma sugestão baseada no contexto.',
      })
    }, 1200)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(message)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
    toast({ title: 'Copiado!', description: 'Mensagem copiada para a área de transferência.' })
  }

  return (
    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" />
          <span className="font-semibold text-primary">AI Concierge</span>
        </div>
        {!message && (
          <Button
            size="sm"
            onClick={generateMessage}
            disabled={isGenerating}
            className="bg-primary/10 text-primary hover:bg-primary/20 border-0"
          >
            <Sparkles className="w-3.5 h-3.5 mr-2" />
            {isGenerating ? 'Analisando contexto...' : 'Sugerir Mensagem'}
          </Button>
        )}
      </div>

      {message && (
        <div className="space-y-3 animate-fade-in">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-[120px] bg-background resize-none border-primary/20 focus-visible:ring-primary/30"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setMessage('')}>
              Descartar
            </Button>
            <Button size="sm" onClick={copyToClipboard} className="gap-2">
              {isCopied ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              {isCopied ? 'Copiado' : 'Copiar e Usar'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
