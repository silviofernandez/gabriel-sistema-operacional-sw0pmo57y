import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Sun,
  CheckSquare,
  FileText,
  Users,
  Building,
  KanbanSquare,
  ClipboardCheck,
  Wrench,
  RefreshCw,
  BarChart3,
  Settings,
  LogOut,
  Home,
  Activity,
  DollarSign,
  UserCheck,
  ShieldAlert,
  Award,
  Lock,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import useAuthStore, { UserProfileLevel } from '@/stores/useAuthStore'
import usePipelineAccess from '@/stores/usePipelineAccess'
import { usePermissions } from '@/hooks/usePermissions'
import { AppModule } from '@/types'

const routeModuleMap: Record<string, AppModule> = {
  '/': 'dashboard',
  '/imoveis': 'properties',
  '/tarefas': 'tasks',
  '/kanban': 'kanban',
  '/financeiro': 'financial',
  '/clientes': 'contacts',
  '/concierge': 'concierge',
}

const navItems: {
  title: string
  url: string
  icon: any
  levels: UserProfileLevel[]
  stageId?: string
}[] = [
  { title: 'Painel', url: '/', icon: LayoutDashboard, levels: ['Diretor', 'Gestor'] },
  {
    title: 'Meu Dia',
    url: '/meu-dia',
    icon: Sun,
    levels: ['Diretor', 'Gestor', 'Colaborador'],
  },
  {
    title: 'Tarefas & OS',
    url: '/tarefas',
    icon: CheckSquare,
    levels: ['Diretor', 'Gestor'],
  },
  {
    title: 'Contratos',
    url: '/contratos',
    icon: FileText,
    levels: ['Diretor', 'Gestor', 'Colaborador'],
    stageId: '3',
  },
  {
    title: 'Clientes',
    url: '/clientes',
    icon: Users,
    levels: ['Diretor', 'Gestor'],
  },
  {
    title: 'Imóveis',
    url: '/imoveis',
    icon: Building,
    levels: ['Diretor', 'Gestor'],
  },
  {
    title: 'Kanban Operacional',
    url: '/kanban',
    icon: KanbanSquare,
    levels: ['Diretor', 'Gestor', 'Colaborador'],
  },
  {
    title: 'Jornada (Concierge)',
    url: '/concierge',
    icon: UserCheck,
    levels: ['Diretor', 'Gestor', 'Colaborador'],
    stageId: '7',
  },
  {
    title: 'Financeiro',
    url: '/financeiro',
    icon: DollarSign,
    levels: ['Diretor', 'Gestor', 'Colaborador'],
    stageId: '9',
  },
  {
    title: 'Vistorias',
    url: '/vistorias',
    icon: ClipboardCheck,
    levels: ['Diretor', 'Gestor', 'Colaborador'],
    stageId: '4',
  },
  {
    title: 'Manutenções',
    url: '/manutencoes',
    icon: Wrench,
    levels: ['Diretor', 'Gestor', 'Colaborador'],
    stageId: '8',
  },
  {
    title: 'Desocupações',
    url: '/desocupacoes',
    icon: LogOut,
    levels: ['Diretor', 'Gestor', 'Colaborador'],
    stageId: '11',
  },
  {
    title: 'Renovações',
    url: '/renovacoes',
    icon: RefreshCw,
    levels: ['Diretor', 'Gestor', 'Colaborador'],
    stageId: '10',
  },
  { title: 'Relatórios', url: '/relatorios', icon: BarChart3, levels: ['Diretor', 'Gestor'] },
  {
    title: 'Desempenho da Equipe',
    url: '/desempenho-equipe',
    icon: Award,
    levels: ['Diretor', 'Gestor'],
  },
  {
    title: 'Auditoria & Logs',
    url: '/auditoria',
    icon: ShieldAlert,
    levels: ['Diretor', 'Gestor'],
  },
  {
    title: 'Performance Sistema',
    url: '/performance',
    icon: Activity,
    levels: ['Diretor', 'Gestor'],
  },
  { title: 'Painel Admin', url: '/configuracoes', icon: Settings, levels: ['Diretor', 'Gestor'] },
]

export function AppSidebar() {
  const location = useLocation()
  const { profileLevel, role } = useAuthStore()
  const { can, isAdmin } = usePermissions()
  const { stages, canOperateStage, canReadAdjacentStage, openRestrictedModal, logAuditAction } =
    usePipelineAccess()

  const isColaborador = profileLevel === 'Colaborador'

  const filteredItems = navItems.filter((item) => {
    // Painel Admin available for Admins, Diretores and Gestores to manage settings
    if (item.url === '/configuracoes') {
      return (
        isAdmin ||
        role === 'Administrador' ||
        profileLevel === 'Diretor' ||
        profileLevel === 'Gestor'
      )
    }

    const reqMod = routeModuleMap[item.url]
    if (reqMod) return can(reqMod, 'view')

    // Fallback for non-mapped items
    return item.levels.includes(profileLevel)
  })

  return (
    <Sidebar>
      <SidebarHeader className="h-20 flex flex-col justify-center border-b px-4 bg-muted/30">
        <div className="flex items-center gap-2 w-full text-primary">
          <div className="bg-primary text-primary-foreground p-1.5 rounded-lg shadow-sm">
            <Home className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg leading-tight tracking-tight">AlugAI</span>
            <span className="text-[10px] text-muted-foreground leading-tight tracking-widest uppercase">
              Gestão Inteligente
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="uppercase text-[10px] tracking-wider mb-2">
            Menu Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => {
                const stageId = item.stageId
                const isBlocked =
                  isColaborador &&
                  stageId &&
                  !canOperateStage(stageId) &&
                  !canReadAdjacentStage(stageId)
                const isAdjacent =
                  isColaborador &&
                  stageId &&
                  !canOperateStage(stageId) &&
                  canReadAdjacentStage(stageId)

                return (
                  <SidebarMenuItem key={item.title}>
                    {isBlocked ? (
                      <SidebarMenuButton
                        onClick={() => {
                          const pipeStage = stages.find((s) => s.id === stageId)
                          if (pipeStage) openRestrictedModal(pipeStage)
                          logAuditAction({
                            acao: 'tentou_acesso_negado',
                            etapaId: stageId,
                            motivo: `Tentativa de acesso via menu lateral à etapa restrita: ${item.title}`,
                          })
                        }}
                        className="text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted/30 cursor-not-allowed justify-between"
                      >
                        <div className="flex items-center">
                          <item.icon className="h-4 w-4 mr-1 opacity-50" />
                          <span className="opacity-70">{item.title}</span>
                        </div>
                        <Lock className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
                      </SidebarMenuButton>
                    ) : (
                      <SidebarMenuButton
                        asChild
                        isActive={location.pathname === item.url}
                        className="transition-all justify-between"
                      >
                        <Link
                          to={item.url}
                          onClick={() => {
                            if (isAdjacent && stageId) {
                              logAuditAction({
                                acao: 'visualizou_adjacente',
                                etapaId: stageId,
                                motivo: `Acesso a etapa adjacente via menu: ${item.title}`,
                              })
                            }
                          }}
                        >
                          <div className="flex items-center">
                            <item.icon className="h-4 w-4 mr-1" />
                            <span>{item.title}</span>
                          </div>
                          {isAdjacent && (
                            <span className="text-[10px] text-amber-600 bg-amber-500/10 px-1 rounded font-mono">
                              Leitura
                            </span>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    )}
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
