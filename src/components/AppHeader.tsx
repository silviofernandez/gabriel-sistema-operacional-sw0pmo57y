import { Bell, Search, LogOut, AlertTriangle, Clock } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'

export function AppHeader() {
  const { user, profileLevel, setProfileLevel, logout } = useAuthStore()
  const { db } = useDataStore()

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

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b bg-background px-4 z-10 sticky top-0">
      <div className="flex items-center gap-4 flex-1">
        <SidebarTrigger />
        <div className="relative w-full max-w-md hidden md:flex items-center">
          <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar contratos, clientes ou imóveis..."
            className="w-full bg-muted/30 pl-9 rounded-md border-transparent focus-visible:ring-primary/30 shadow-none focus-visible:bg-background focus-visible:border-border transition-all"
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative hover:bg-muted/50 rounded-full">
              <Bell className="h-5 w-5 text-muted-foreground" />
              {criticalAlerts.length > 0 && profileLevel !== 'Colaborador' && (
                <span className="absolute top-2 right-2 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive border-2 border-background"></span>
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              Notificações e Alertas
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {profileLevel !== 'Colaborador' && criticalAlerts.length > 0 ? (
              <ScrollArea className="max-h-[300px]">
                <div className="flex flex-col gap-1.5 p-1.5">
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
                </div>
              </ScrollArea>
            ) : (
              <div className="p-6 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                <Bell className="w-8 h-8 opacity-20" />
                Nenhuma notificação urgente.
              </div>
            )}
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
