import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import useAuthStore from '@/stores/useAuthStore'
import { UserManagement } from '@/components/settings/UserManagement'
import { AutomationRules } from '@/components/settings/AutomationRules'
import { WorkflowConfigurator } from '@/components/settings/WorkflowConfigurator'
import { AIControlPanel } from '@/components/settings/AIControlPanel'
import { CompanySettings } from '@/components/settings/CompanySettings'
import { DataImport } from '@/components/settings/DataImport'
import { GoalsManagement } from '@/components/settings/GoalsManagement'
import { Lock } from 'lucide-react'

export default function Configuracoes() {
  const { profileLevel, role } = useAuthStore()

  const isAuthorized =
    role === 'Administrador' || profileLevel === 'Diretor' || profileLevel === 'Gestor'

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] p-8 text-center animate-in fade-in zoom-in-95 duration-500">
        <div className="bg-muted p-4 rounded-full mb-4">
          <Lock className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold mb-2 tracking-tight">Acesso Restrito</h2>
        <p className="text-muted-foreground max-w-md">
          Você não possui permissões suficientes para acessar o painel de configurações. Esta área é
          restrita para Administradores e Gestores.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up max-w-7xl mx-auto w-full pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Painel Admin</h1>
        <p className="text-muted-foreground mt-1 text-lg">
          Gerencie a equipe, permissões granulares, processos operacionais, importação em lote e
          configurações de IA.
        </p>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <div className="overflow-x-auto pb-2 scrollbar-hide">
          <TabsList className="bg-muted p-1 h-auto flex gap-1 w-max min-w-full justify-start rounded-lg border">
            <TabsTrigger
              value="users"
              className="data-[state=active]:bg-card data-[state=active]:shadow-sm text-sm px-5 py-2.5 font-medium transition-all"
            >
              Equipe & Acessos
            </TabsTrigger>
            <TabsTrigger
              value="company"
              className="data-[state=active]:bg-card data-[state=active]:shadow-sm text-sm px-5 py-2.5 font-medium transition-all"
            >
              Identidade & Empresa
            </TabsTrigger>
            <TabsTrigger
              value="goals"
              className="data-[state=active]:bg-card data-[state=active]:shadow-sm text-sm px-5 py-2.5 font-medium transition-all"
            >
              Metas & OKRs
            </TabsTrigger>
            <TabsTrigger
              value="import"
              className="data-[state=active]:bg-card data-[state=active]:shadow-sm text-sm px-5 py-2.5 font-medium transition-all"
            >
              Importar Dados Lote
            </TabsTrigger>
            <TabsTrigger
              value="workflows"
              className="data-[state=active]:bg-card data-[state=active]:shadow-sm text-sm px-5 py-2.5 font-medium transition-all"
            >
              Editor de Kanban & SLA
            </TabsTrigger>
            <TabsTrigger
              value="automations"
              className="data-[state=active]:bg-card data-[state=active]:shadow-sm text-sm px-5 py-2.5 font-medium transition-all"
            >
              Automações & Gatilhos
            </TabsTrigger>
            <TabsTrigger
              value="ai"
              className="data-[state=active]:bg-card data-[state=active]:shadow-sm text-sm px-5 py-2.5 font-medium transition-all"
            >
              Inteligência Artificial
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="users"
          className="focus-visible:outline-none animate-in fade-in-50 duration-500"
        >
          <UserManagement />
        </TabsContent>

        <TabsContent
          value="company"
          className="focus-visible:outline-none animate-in fade-in-50 duration-500"
        >
          <CompanySettings />
        </TabsContent>

        <TabsContent
          value="goals"
          className="focus-visible:outline-none animate-in fade-in-50 duration-500"
        >
          <GoalsManagement />
        </TabsContent>

        <TabsContent
          value="import"
          className="focus-visible:outline-none animate-in fade-in-50 duration-500"
        >
          <DataImport />
        </TabsContent>

        <TabsContent
          value="workflows"
          className="focus-visible:outline-none animate-in fade-in-50 duration-500"
        >
          <WorkflowConfigurator />
        </TabsContent>

        <TabsContent
          value="automations"
          className="focus-visible:outline-none animate-in fade-in-50 duration-500"
        >
          <AutomationRules />
        </TabsContent>

        <TabsContent
          value="ai"
          className="focus-visible:outline-none animate-in fade-in-50 duration-500"
        >
          <AIControlPanel />
        </TabsContent>
      </Tabs>
    </div>
  )
}
