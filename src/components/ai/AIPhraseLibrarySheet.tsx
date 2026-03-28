import { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Copy, CheckCircle2, MessageSquareText } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface AIPhraseLibrarySheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const phrases = {
  inquilino: [
    {
      category: 'Abertura de atendimento',
      items: [
        'Olá! Recebemos sua solicitação. O número do seu atendimento é #TK-001. Gostaria de entender melhor o que aconteceu para te ajudar da melhor forma.',
        'Bom dia! Sua demanda foi registrada no nosso sistema. Vou avaliar os detalhes agora mesmo.',
      ],
    },
    {
      category: 'Acolhimento inicial',
      items: [
        'Entendo perfeitamente a situação. Gostaria de entender melhor o que aconteceu para te ajudar da melhor forma.',
        'Sinto muito pelo transtorno. Sei como isso pode ser frustrante, mas estamos aqui para resolver isso juntos.',
      ],
    },
    {
      category: 'Blindagem quando ainda não há solução',
      items: [
        'Ainda não recebi o retorno da área técnica, mas faço questão de te avisar que continuo cobrando uma resposta e acompanhando o caso.',
        'Passando apenas para te manter atualizado: o seu caso segue em análise e não esquecemos de você. Assim que houver novidades, te informo.',
      ],
    },
    {
      category: 'Comunicação de atraso',
      items: [
        'Nossa equipe de manutenção teve um imprevisto e precisou reagendar. O novo prazo para a visita técnica é amanhã, no mesmo horário. Pedimos desculpas pelo atraso.',
        'Infelizmente o fornecedor não conseguiu entregar a peça a tempo, mas já escalonamos a situação como urgente. Te dou um novo retorno até o final do dia.',
      ],
    },
    {
      category: 'Limites do papel do concierge',
      items: [
        'Compreendo sua urgência. Meu papel aqui é garantir que sua solicitação chegue com prioridade ao setor Financeiro, que é o responsável exclusivo por esta análise.',
        'Essa decisão envolve diretrizes específicas do seu contrato. Vou encaminhar agora mesmo para o nosso Jurídico e garantir que avaliem com atenção.',
      ],
    },
    {
      category: 'Validação de satisfação',
      items: [
        'Fico feliz que tudo tenha se resolvido! Posso encerrar este chamado ou há mais alguma coisa em que eu possa ajudar?',
        'O serviço foi concluído. A solução atendeu às suas expectativas? Você receberá uma breve pesquisa de satisfação em seguida.',
      ],
    },
  ],
  proprietario: [
    {
      category: 'Abertura de atendimento',
      items: [
        'Olá! É ótimo falar com você. Recebemos seu questionamento e vamos garantir a preservação do seu patrimônio.',
        'Bom dia! Recebemos sua solicitação de análise financeira. Já estou direcionando para o nosso time conferir os valores.',
      ],
    },
    {
      category: 'Acolhimento inicial',
      items: [
        'Entendi a sua preocupação em relação ao imóvel e vamos agir com cautela para garantir a melhor resolução.',
      ],
    },
    {
      category: 'Blindagem quando ainda não há solução',
      items: [
        'Estamos aguardando o retorno do inquilino sobre a visita técnica. Como não nos respondeu hoje, faremos nova tentativa amanhã cedo.',
        'Ainda estou levantando os orçamentos com os prestadores, mas faço questão de te manter informado sobre o andamento.',
      ],
    },
    {
      category: 'Comunicação de atraso',
      items: [
        'O levantamento de orçamentos levou um pouco mais de tempo que o previsto devido à complexidade do reparo. Apresentarei as melhores opções nesta sexta-feira.',
      ],
    },
    {
      category: 'Limites do papel do concierge',
      items: [
        'Como intermediadores, nossa missão é garantir que o contrato seja cumprido de forma imparcial. Por isso, repassamos sua orientação ao setor responsável para avaliação legal antes de prosseguir.',
      ],
    },
    {
      category: 'Validação de satisfação',
      items: [
        'O repasse já foi processado e o caso foi finalizado. Confirma o recebimento dos valores corretamente?',
      ],
    },
  ],
}

export function AIPhraseLibrarySheet({ open, onOpenChange }: AIPhraseLibrarySheetProps) {
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null)
  const { toast } = useToast()

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(id)
    toast({
      title: 'Mensagem copiada!',
      description: 'Você já pode colar a sugestão no chat com o cliente.',
    })
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const renderPhrases = (target: 'inquilino' | 'proprietario') => {
    return (
      <Accordion type="single" collapsible className="w-full space-y-2 mt-4">
        {phrases[target].map((group, gIndex) => (
          <AccordionItem
            key={gIndex}
            value={`item-${gIndex}`}
            className="border bg-card rounded-lg px-2 shadow-sm"
          >
            <AccordionTrigger className="hover:no-underline font-semibold text-sm py-3">
              {group.category}
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pb-4">
              {group.items.map((phrase, pIndex) => {
                const id = `${target}-${gIndex}-${pIndex}`
                const isCopied = copiedIndex === id
                return (
                  <div
                    key={pIndex}
                    className="flex flex-col gap-2 p-3 bg-muted/30 rounded-md border border-border/50 group hover:border-primary/30 transition-colors"
                  >
                    <p className="text-sm text-foreground/90 leading-snug">{phrase}</p>
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-7 text-xs ${isCopied ? 'text-success' : 'text-muted-foreground group-hover:text-primary'}`}
                        onClick={() => handleCopy(phrase, id)}
                      >
                        {isCopied ? (
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 mr-1.5" />
                        )}
                        {isCopied ? 'Copiado' : 'Copiar Frase'}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md p-0 flex flex-col h-full border-l">
        <div className="p-6 border-b bg-muted/10 shrink-0">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-xl">
              <MessageSquareText className="w-5 h-5 text-primary" />
              Biblioteca de Frases IA
            </SheetTitle>
            <SheetDescription>
              Sugestões humanizadas e estratégicas para o Concierge se comunicar mantendo a empatia
              e respeitando os limites operacionais.
            </SheetDescription>
          </SheetHeader>
        </div>

        <Tabs defaultValue="inquilino" className="flex-1 flex flex-col min-h-0">
          <div className="px-6 pt-4 border-b shrink-0 bg-background">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="inquilino">Para Inquilinos</TabsTrigger>
              <TabsTrigger value="proprietario">Para Proprietários</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="inquilino" className="flex-1 overflow-y-auto p-6 m-0">
            {renderPhrases('inquilino')}
          </TabsContent>

          <TabsContent value="proprietario" className="flex-1 overflow-y-auto p-6 m-0">
            {renderPhrases('proprietario')}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
