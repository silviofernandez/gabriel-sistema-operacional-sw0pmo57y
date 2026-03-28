import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '@/stores/useAuthStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Upload,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Settings,
  Zap,
  ArrowLeft,
  Download,
  PlayCircle,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

export default function Onboarding() {
  const { completeOnboarding, isAuthenticated, needsOnboarding } = useAuthStore()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [step, setStep] = useState(1)
  const [model, setModel] = useState<'standard' | 'custom' | null>(null)

  const [checklist, setChecklist] = useState({
    equipe: false,
    contratos: false,
    imoveis: false,
    automacoes: false,
    testar: false,
  })

  const [isActivating, setIsActivating] = useState(false)
  const [activationProgress, setActivationProgress] = useState(0)

  useEffect(() => {
    if (!isAuthenticated) navigate('/login')
    if (isAuthenticated && !needsOnboarding) navigate('/')
  }, [isAuthenticated, needsOnboarding, navigate])

  const handleSelectModel = (selectedModel: 'standard' | 'custom') => {
    setModel(selectedModel)
    if (selectedModel === 'standard') {
      toast({
        title: 'Modelo Padrão Selecionado',
        description: 'Gerando workflow, papéis e automações de comunicação...',
      })
      setTimeout(() => {
        setChecklist((prev) => ({ ...prev, automacoes: true }))
      }, 1500)
    }
    setStep(2)
  }

  const handleFileUpload = (type: 'clientes' | 'contratos' | 'imoveis') => {
    toast({
      title: `Importando ${type}...`,
      description: 'Processando a planilha enviada. Isso pode levar alguns segundos.',
    })

    setTimeout(() => {
      toast({
        title: 'Importação Concluída',
        description: `Dados de ${type} importados. As tarefas automáticas foram agendadas.`,
      })
      if (type === 'contratos') setChecklist((prev) => ({ ...prev, contratos: true }))
      if (type === 'imoveis') setChecklist((prev) => ({ ...prev, imoveis: true }))
      if (type === 'clientes') setChecklist((prev) => ({ ...prev, equipe: true }))
    }, 2000)
  }

  const toggleCheck = (key: keyof typeof checklist) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleActivation = () => {
    setStep(3)
    setIsActivating(true)

    let progress = 0
    const interval = setInterval(() => {
      progress += 25
      setActivationProgress(progress)
      if (progress >= 100) {
        clearInterval(interval)
        setIsActivating(false)
      }
    }, 1200)
  }

  const finishOnboarding = () => {
    completeOnboarding()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center py-12 px-4">
      <div className="w-full max-w-5xl animate-fade-in-up">
        {step === 1 && (
          <div className="space-y-10">
            <div className="text-center space-y-5">
              <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto shadow-lg mb-6">
                <Zap className="h-8 w-8 text-primary-foreground" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground max-w-3xl mx-auto leading-tight">
                Bem-vindo ao AlugAI. Vamos configurar sua operação em poucos minutos.
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Seu ambiente isolado da imobiliária já foi provisionado. Escolha como deseja iniciar
                a configuração do seu novo workspace.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mt-12 max-w-4xl mx-auto">
              <Card
                className="cursor-pointer hover:border-primary hover:shadow-lg transition-all group border-2"
                onClick={() => handleSelectModel('standard')}
              >
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Zap className="h-6 w-6 text-primary group-hover:text-primary-foreground" />
                  </div>
                  <CardTitle className="text-2xl">Modelo padrão AlugAI</CardTitle>
                  <CardDescription className="text-base mt-2">
                    Ideal para começar rápido. O sistema irá gerar automaticamente:
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-sm font-medium text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success" /> Workflow Stages (locação,
                      desocupação, concierge)
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success" /> Task Automations para
                      eventos de contrato
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success" /> Default Roles atribuídas às
                      tarefas
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success" /> Communication Automations
                      para clientes
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer hover:border-foreground hover:shadow-lg transition-all group border-2"
                onClick={() => handleSelectModel('custom')}
              >
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4 group-hover:bg-foreground group-hover:text-background transition-colors">
                    <Settings className="h-6 w-6 text-foreground group-hover:text-background" />
                  </div>
                  <CardTitle className="text-2xl">Configuração personalizada</CardTitle>
                  <CardDescription className="text-base mt-2">
                    Para imobiliárias com processos altamente específicos.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-sm font-medium text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Settings className="h-4 w-4" /> Criar etapas do Kanban do zero
                    </li>
                    <li className="flex items-center gap-2">
                      <Settings className="h-4 w-4" /> Importar base de dados limpa
                    </li>
                    <li className="flex items-center gap-2">
                      <Settings className="h-4 w-4" /> Desenhar motor de workflow e gatilhos
                      manualmente
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex items-center gap-4 mb-8">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setStep(1)}
                className="rounded-full"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h2 className="text-3xl font-bold">Setup Interativo da Operação</h2>
                <p className="text-muted-foreground mt-1">
                  Siga o checklist para ativar sua empresa. Suas configurações base{' '}
                  {model === 'standard' ? 'já estão pré-carregadas.' : 'estão em branco.'}
                </p>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8 items-start">
              <div className="lg:col-span-1 space-y-6 sticky top-6">
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle>Interactive Setup Checklist</CardTitle>
                    <CardDescription>
                      Acompanhe o progresso da sua configuração inicial.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="equipe"
                        checked={checklist.equipe}
                        onCheckedChange={() => toggleCheck('equipe')}
                        className="mt-0.5"
                      />
                      <label
                        htmlFor="equipe"
                        className={cn(
                          'text-sm font-medium leading-tight cursor-pointer',
                          checklist.equipe && 'line-through text-muted-foreground',
                        )}
                      >
                        Adicionar equipe
                      </label>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="contratos"
                        checked={checklist.contratos}
                        onCheckedChange={() => toggleCheck('contratos')}
                        className="mt-0.5"
                      />
                      <label
                        htmlFor="contratos"
                        className={cn(
                          'text-sm font-medium leading-tight cursor-pointer',
                          checklist.contratos && 'line-through text-muted-foreground',
                        )}
                      >
                        Importar contratos
                      </label>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="imoveis"
                        checked={checklist.imoveis}
                        onCheckedChange={() => toggleCheck('imoveis')}
                        className="mt-0.5"
                      />
                      <label
                        htmlFor="imoveis"
                        className={cn(
                          'text-sm font-medium leading-tight cursor-pointer',
                          checklist.imoveis && 'line-through text-muted-foreground',
                        )}
                      >
                        Cadastrar imóveis
                      </label>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="automacoes"
                        checked={checklist.automacoes}
                        onCheckedChange={() => toggleCheck('automacoes')}
                        className="mt-0.5"
                      />
                      <label
                        htmlFor="automacoes"
                        className={cn(
                          'text-sm font-medium leading-tight cursor-pointer',
                          checklist.automacoes && 'line-through text-muted-foreground',
                        )}
                      >
                        Configurar automações
                      </label>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="testar"
                        checked={checklist.testar}
                        onCheckedChange={() => toggleCheck('testar')}
                        className="mt-0.5"
                      />
                      <label
                        htmlFor="testar"
                        className={cn(
                          'text-sm font-medium leading-tight cursor-pointer',
                          checklist.testar && 'line-through text-muted-foreground',
                        )}
                      >
                        Testar sistema
                      </label>
                    </div>
                  </CardContent>
                </Card>

                <Button className="w-full h-12 text-base shadow-sm" onClick={handleActivation}>
                  Ativar Plataforma Global <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>

              <div className="lg:col-span-2">
                <Card className="h-full shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-xl">Data Import Module</CardTitle>
                    <CardDescription>
                      Faça upload de planilhas CSV/Excel para gerar registros em lote na sua base
                      isolada.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="clientes">
                      <TabsList className="grid w-full grid-cols-3 mb-6">
                        <TabsTrigger value="clientes">Clientes</TabsTrigger>
                        <TabsTrigger value="imoveis">Imóveis</TabsTrigger>
                        <TabsTrigger value="contratos">Contratos</TabsTrigger>
                      </TabsList>

                      {['clientes', 'imoveis', 'contratos'].map((tab) => (
                        <TabsContent key={tab} value={tab} className="space-y-4 outline-none">
                          <div
                            className="border-2 border-dashed border-border/80 rounded-xl p-16 flex flex-col items-center justify-center bg-muted/10 hover:bg-muted/30 transition-colors cursor-pointer"
                            onClick={() => handleFileUpload(tab as any)}
                          >
                            <div className="w-16 h-16 bg-background rounded-full shadow-sm flex items-center justify-center mb-6">
                              <Upload className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="font-semibold text-lg text-foreground">
                              Arraste sua planilha de <span className="capitalize">{tab}</span>
                            </h3>
                            <p className="text-sm text-muted-foreground text-center mt-2 max-w-sm">
                              Suportamos arquivos .csv e .xlsx. O sistema{' '}
                              {model === 'standard'
                                ? 'criará automações e tarefas'
                                : 'importará os dados'}{' '}
                              automaticamente.
                            </p>
                            <Button variant="secondary" className="mt-6 pointer-events-none">
                              Selecionar Arquivo
                            </Button>
                          </div>
                          <div className="flex justify-end">
                            <Button
                              variant="link"
                              className="text-muted-foreground text-xs hover:text-primary"
                            >
                              <Download className="h-3 w-3 mr-2" /> Baixar template de{' '}
                              <span className="capitalize ml-1">{tab}</span>
                            </Button>
                          </div>
                        </TabsContent>
                      ))}
                    </Tabs>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col items-center justify-center space-y-12 py-20 min-h-[60vh] animate-fade-in">
            {isActivating ? (
              <>
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <div className="absolute inset-0 border-4 border-muted rounded-full"></div>
                  <Loader2 className="h-14 w-14 text-primary animate-spin" />
                </div>
                <div className="text-center space-y-6 max-w-md w-full">
                  <div>
                    <h2 className="text-3xl font-bold">Global Feature Activation</h2>
                    <p className="text-muted-foreground mt-2">
                      Sincronizando os módulos com seu ambiente recém-criado...
                    </p>
                  </div>
                  <Progress value={activationProgress} className="h-3 rounded-full bg-muted/50" />
                  <div className="text-sm font-medium text-left space-y-4 pt-6 border-t border-border/50">
                    <div
                      className={cn(
                        'flex items-center transition-all duration-500',
                        activationProgress >= 25
                          ? 'opacity-100 translate-y-0 text-foreground'
                          : 'opacity-0 translate-y-2 text-muted-foreground',
                      )}
                    >
                      <CheckCircle2 className="h-5 w-5 mr-3 text-success shrink-0" />
                      <span>Task Management System ativado</span>
                    </div>
                    <div
                      className={cn(
                        'flex items-center transition-all duration-500',
                        activationProgress >= 50
                          ? 'opacity-100 translate-y-0 text-foreground'
                          : 'opacity-0 translate-y-2 text-muted-foreground',
                      )}
                    >
                      <CheckCircle2 className="h-5 w-5 mr-3 text-success shrink-0" />
                      <span>Kanban Operacional configurado com SLAs</span>
                    </div>
                    <div
                      className={cn(
                        'flex items-center transition-all duration-500',
                        activationProgress >= 75
                          ? 'opacity-100 translate-y-0 text-foreground'
                          : 'opacity-0 translate-y-2 text-muted-foreground',
                      )}
                    >
                      <CheckCircle2 className="h-5 w-5 mr-3 text-success shrink-0" />
                      <span>Módulo Concierge online e pronto</span>
                    </div>
                    <div
                      className={cn(
                        'flex items-center transition-all duration-500',
                        activationProgress >= 100
                          ? 'opacity-100 translate-y-0 text-foreground'
                          : 'opacity-0 translate-y-2 text-muted-foreground',
                      )}
                    >
                      <CheckCircle2 className="h-5 w-5 mr-3 text-success shrink-0" />
                      <span>Recursos de IA provisionados com sucesso</span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center space-y-6 animate-fade-in-up max-w-lg mx-auto">
                <div className="w-24 h-24 bg-success/10 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="h-12 w-12 text-success" />
                </div>
                <h2 className="text-4xl font-bold tracking-tight">Setup Concluído!</h2>
                <p className="text-lg text-muted-foreground">
                  A plataforma AlugAI da sua imobiliária está pronta e otimizada. Seja bem-vindo ao
                  futuro da gestão de locações.
                </p>
                <div className="pt-4">
                  <Button
                    size="lg"
                    onClick={finishOnboarding}
                    className="h-14 px-10 text-lg w-full sm:w-auto"
                  >
                    Acessar Dashboard <PlayCircle className="ml-2 h-6 w-6" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
