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
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
} from '@/components/ui/sidebar'
import useAuthStore, { UserProfileLevel } from '@/stores/useAuthStore'
import { usePermissions } from '@/hooks/usePermissions'
import { AppModule } from '@/types'

const navItems: {
  title: string
  url: string
  icon: any
  levels: UserProfileLevel[]
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
    levels: ['Diretor', 'Gestor'],
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
  },
  {
    title: 'Financeiro',
    url: '/financeiro',
    icon: DollarSign,
    levels: ['Diretor', 'Gestor'],
  },
  {
    title: 'Vistorias',
    url: '/vistorias',
    icon: ClipboardCheck,
    levels: ['Diretor', 'Gestor'],
  },
  {
    title: 'Manutenções',
    url: '/manutencoes',
    icon: Wrench,
    levels: ['Diretor', 'Gestor'],
  },
  {
    title: 'Desocupações',
    url: '/desocupacoes',
    icon: LogOut,
    levels: ['Diretor', 'Gestor'],
  },
  {
    title: 'Renovações',
    url: '/renovacoes',
    icon: RefreshCw,
    levels: ['Diretor', 'Gestor'],
  },
  { title: 'Relatórios', url: '/relatorios', icon: BarChart3, levels: ['Diretor', 'Gestor'] },
  { title: 'Desempenho', url: '/performance', icon: Activity, levels: ['Diretor', 'Gestor'] },
  { title: 'Painel Admin', url: '/configuracoes', icon: Settings, levels: ['Diretor'] },
]

export function AppSidebar() {
  const location = useLocation()
  const { profileLevel, role } = useAuthStore()
  const { can, isAdmin } = usePermissions()

  const routeModuleMap: Record<string, AppModule> = {
    '/': 'dashboard',
    '/imoveis': 'properties',
    '/tarefas': 'tasks',
    '/kanban': 'kanban',
    '/financeiro': 'financial',
    '/clientes': 'contacts',
    '/concierge': 'concierge',
  }

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
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url}
                    className="transition-all"
                  >
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4 mr-1" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
