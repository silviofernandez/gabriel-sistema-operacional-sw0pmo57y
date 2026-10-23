import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Bot, Sparkles, Copy, CheckCircle2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { pb } from '@/lib/pocketbase/client'

interface AIAssistantWidgetProps {
  contextPrompt: string
}

export function AIAssistantWidget({ contextPrompt }: AIAssistantWidgetProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [message, setMessage] = useState('')
  const [isCopied, setIsCopied] = useState(false)
  const { toast } = useToast()

  const generateMessage = async () => {
    setIsGenerating(true)
    try {
      const data: any = await pb.send('/backend/v1/gabriel-ai/chat', {
        method: 'POST',
        body: {
          message: `Gere uma mensagem acolhedora e formal para o cliente da Gabriel Imobiliária sobre a seguinte etapa: "${contextPrompt}". Indique o que é necessário e se coloque à disposição.`,
        },
      })

      if (data?.content) {
        setMessage(data.content)
        toast({
          title: 'Mensagem Gerada pelo Gabriel Copilot',
          description: 'Sugestão redigida pelo agente de IA nativo.',
        })
      } else {
        setMessage(
          `Olá! Aqui é da equipe da Gabriel Imobiliária.\n\n` +
          `A respeito do seu atendimento, identificamos que o próximo passo necessário é: "${contextPrompt}".\n\n` +
          `Poderia nos retornar para darmos andamento com total agilidade? Caso tenha qualquer dúvida, conte conosco!\n\n` +
          `Gabriel Imobiliária — Atendimento Operacional`
        )
        toast({
          title: 'Sugestão Operacional Padronizada',
          description: 'Mensagem estruturada conforme padrões da Gabriel.',
        })
      }
    } catch {      setMessage(
        `Olá! Aqui é da equipe da Gabriel Imobiliária.\n\n` +
          `Sobre a sua solicitação, precisamos do seu retorno para o passo: "${contextPrompt}".\n\n` +
          `Qualquer dúvida, estamos à sua inteira disposição!`,
      )
    } finally {
      setIsGenerating(false)
    }
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
          <span className="font-semibold text-primary">Gabriel Copilot (IA Nativa)</span>
        </div>
        {!message && (
          <Button
            size="sm"
            onClick={generateMessage}
            disabled={isGenerating}
            className="bg-primary/10 text-primary hover:bg-primary/20 border-0"
          >
            <Sparkles className="w-3.5 h-3.5 mr-2" />
            {isGenerating ? 'Consultando Gabriel Copilot...' : 'Sugerir Mensagem'}
          </Button>
        )}
      </div>

      {message && (
        <div className="space-y-3 animate-fade-in">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-[120px] bg-background resize-none border-primary/20 focus-visible:ring-primary/30 text-xs"
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
