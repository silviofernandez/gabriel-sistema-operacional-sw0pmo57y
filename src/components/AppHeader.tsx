import {
  Bell,
  Search,
  LogOut,
  AlertTriangle,
  Clock,
  ShieldCheck,
  UserCheck,
  MessageSquare,
} from 'lucide-react'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import useAuthStore, { UserProfileLevel } from '@/stores/useAuthStore'
import useDataStore from '@/stores/useDataStore'
import usePipelineAccess from '@/stores/usePipelineAccess'
import { Badge } from '@/components/ui/badge'

export function AppHeader() {
  const { user, profileLevel, setProfileLevel, logout, switchUser } = useAuthStore()
  const { db } = useDataStore()
  const { stages, assignedStageIds, temporaryStageIds, myActiveCoverage, notifications } =
    usePipelineAccess()

  const profileLevels: UserProfileLevel[] = ['Diretor', 'Gestor', 'Colaborador']

  const now = new Date().getTime()

  const parseDate = (dStr: string) => {
    if (!dStr) return 0
    try {
      const parts = dStr.split(' ')
      const [day, month, year] = parts[0].split('/')
      const [hour, minute] = (parts[1] || '23:59').split(':')
      return new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour),
        Number(minute),
      ).getTime()
    } catch {
      return 0
    }
  }

  const criticalAlerts = db.tasks.filter((t) => {
    if (t.status === 'Concluída' || t.priority !== 'Crítica') return false
    const deadlineTime = parseDate(t.deadline)
    if (deadlineTime === 0) return false
    const hoursDiff = (deadlineTime - now) / (1000 * 60 * 60)
    return hoursDiff <= 2
  })

  const formatTimeLeft = (deadline: string) => {
    const time = parseDate(deadline)
    const diff = (time - now) / (1000 * 60 * 60)
    if (diff < 0) return 'Atrasada'
    if (diff < 1) return `${Math.floor(diff * 60)} min restantes`
    return `${Math.floor(diff)}h ${Math.floor((diff % 1) * 60)}m restantes`
  }

  // Nomes das etapas ativas do colaborador
  const activeStagesList = stages
    .filter((s) => assignedStageIds.includes(s.id))
    .map((s) => s.shortName)

  // Etapas em cobertura temporária
  const temporaryStagesList = stages
    .filter((s) => temporaryStageIds.includes(s.id))
    .map((s) => s.shortName)

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b bg-background px-4 z-10 sticky top-0 gap-3">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <SidebarTrigger />

        {/* Barra superior de status de etapas do colaborador */}
        <div className="hidden lg:flex items-center gap-2 overflow-hidden text-xs">
          <span className="font-semibold text-foreground truncate">{user.name}</span>
          <span className="text-muted-foreground">·</span>
          {profileLevel === 'Colaborador' ? (
            <div className="flex items-center gap-1.5 flex-wrap">
              {activeStagesList.length > 0 ? (
                activeStagesList.map((stg) => (
                  <Badge
                    key={stg}
                    variant="outline"
                    className="text-[11px] font-normal bg-muted/40 border-primary/20 text-foreground py-0"
                  >
                    {stg}
                  </Badge>
                ))
              ) : (
                <span className="text-muted-foreground text-xs">Sem etapas fixas</span>
              )}

              {/* Badge visual de cobertura temporária */}
              {myActiveCoverage && (
                <Badge
                  variant="secondary"
                  className="bg-amber-500/15 border-amber-500/30 text-amber-900 dark:text-amber-200 text-[11px] gap-1 py-0 animate-pulse font-medium"
                >
                  <UserCheck className="w-3 h-3 text-amber-600" />+ Cobrindo:{' '}
                  {temporaryStagesList.join(', ') || 'Etapa'} (temporário até{' '}
                  {new Date(myActiveCoverage.data_fim_prevista).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                  })}
                  )
                </Badge>
              )}
            </div>
          ) : (
            <Badge
              variant="outline"
              className="text-[11px] bg-primary/5 text-primary border-primary/20"
            >
              <ShieldCheck className="w-3 h-3 mr-1" /> Visão Geral ({profileLevel})
            </Badge>
          )}
        </div>

        <div className="relative w-full max-w-xs hidden xl:flex items-center ml-auto">
          <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar na esteira..."
            className="w-full bg-muted/30 pl-9 h-8 text-xs rounded-md border-transparent focus-visible:ring-primary/30 shadow-none focus-visible:bg-background focus-visible:border-border transition-all"
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative hover:bg-muted/50 rounded-full">
              <Bell className="h-5 w-5 text-muted-foreground" />
              {(criticalAlerts.length > 0 || notifications.length > 0) && (
                <span className="absolute top-2 right-2 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive border-2 border-background"></span>
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-84 sm:w-96">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span className="font-semibold">Central de Notificações & WhatsApp</span>
              <Badge variant="outline" className="text-[10px] font-mono">
                {notifications.length} registros
              </Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <ScrollArea className="max-h-[350px]">
              <div className="flex flex-col gap-2 p-1.5">
                {/* Notificações no canal WhatsApp */}
                {notifications.slice(0, 5).map((n) => (
                  <div
                    key={n.id}
                    className="p-2.5 rounded-md border text-xs bg-muted/20 hover:bg-muted/40 transition-colors flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-semibold text-emerald-600 flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" /> WhatsApp Automático
                      </span>
                      <span className="text-muted-foreground font-mono">
                        {n.enviada_em ? n.enviada_em.slice(11, 16) : 'Agora'}
                      </span>
                    </div>
                    <p className="text-foreground leading-snug">{n.mensagem}</p>
                    <span className="text-[10px] text-muted-foreground">
                      Destinatário: {n.destinatario_nome || 'Equipe'}
                    </span>
                  </div>
                ))}

                {/* Alertas de SLA */}
                {criticalAlerts.map((t) => (
                  <div
                    key={t.id}
                    className="flex flex-col gap-1.5 p-3 rounded-md hover:bg-muted/50 bg-destructive/5 border border-destructive/10 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-destructive flex items-center gap-1 uppercase tracking-wider">
                        <AlertTriangle className="w-3.5 h-3.5" /> SLA Crítico
                      </span>
                      <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {formatTimeLeft(t.deadline)}
                      </span>
                    </div>
                    <span className="text-sm font-medium line-clamp-2 leading-tight text-foreground">
                      {t.title}
                    </span>
                  </div>
                ))}

                {notifications.length === 0 && criticalAlerts.length === 0 && (
                  <div className="p-6 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                    <Bell className="w-8 h-8 opacity-20" />
                    Nenhuma notificação urgente.
                  </div>
                )}
              </div>
            </ScrollArea>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full pl-0 ml-1">
              <Avatar className="h-9 w-9 border border-border">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user.name}</p>
                <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5">
              <Badge
                variant="secondary"
                className="w-fit text-[10px] uppercase font-bold tracking-wider"
              >
                {profileLevel}
              </Badge>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Mudar Perfil (Demo)</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {profileLevels.map((level) => (
                  <DropdownMenuItem
                    key={level}
                    onClick={() => setProfileLevel(level)}
                    className={profileLevel === level ? 'font-bold text-primary' : ''}
                  >
                    {level}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="text-primary font-medium">
                Alternar Usuário (Governança)
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-56">
                <DropdownMenuItem
                  onClick={() => switchUser('u1')}
                  className={user.id === 'u1' ? 'font-bold text-primary' : ''}
                >
                  Carlos Silva (Master / Gestor)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => switchUser('u4')}
                  className={user.id === 'u4' ? 'font-bold text-primary' : ''}
                >
                  Alice Santos (Vistoria)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => switchUser('u3')}
                  className={user.id === 'u3' ? 'font-bold text-primary' : ''}
                >
                  João Paulo (Captação / Docs)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => switchUser('u6')}
                  className={user.id === 'u6' ? 'font-bold text-primary' : ''}
                >
                  Camila Torres (Concierge)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => switchUser('u5')}
                  className={user.id === 'u5' ? 'font-bold text-primary' : ''}
                >
                  Ricardo Mendes (Financeiro)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => switchUser('u2')}
                  className={user.id === 'u2' ? 'font-bold text-primary' : ''}
                >
                  Marina Costa (Gestor)
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
              onClick={logout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair da plataforma
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
