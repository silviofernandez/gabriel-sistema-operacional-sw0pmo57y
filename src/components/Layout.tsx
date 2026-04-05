import { useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from './AppSidebar'
import { AppHeader } from './AppHeader'
import useAuthStore from '@/stores/useAuthStore'
import useDataStore from '@/stores/useDataStore'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import { usePermissions } from '@/hooks/usePermissions'
import { useToast } from '@/hooks/use-toast'
import { AppModule } from '@/types'

export default function Layout() {
  const { isAuthenticated, needsOnboarding, loading, logout } = useAuthStore()
  const { db } = useDataStore()
  const location = useLocation()
  const { can } = usePermissions()
  const { toast } = useToast()

  // Enquanto carrega a sessão do Supabase, mostra loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (needsOnboarding) {
    return <Navigate to="/onboarding" replace />
  }

  const routeMap: Record<string, AppModule> = {
    '/': 'dashboard',
    '/imoveis': 'properties',
    '/tarefas': 'tasks',
    '/kanban': 'kanban',
    '/financeiro': 'financial',
    '/clientes': 'contacts',
    '/concierge': 'concierge',
  }

  const requiredModule = routeMap[location.pathname]

  if (requiredModule && !can(requiredModule, 'view')) {
    if (requiredModule !== 'dashboard' && can('dashboard', 'view')) {
      return <Navigate to="/" replace />
    }
    return <Navigate to="/meu-dia" replace />
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-background min-h-screen flex flex-col">
        <AppHeader />
        <main className="flex-1 p-4 md:p-6 lg:p-8 animate-fade-in relative flex flex-col h-full min-h-[calc(100vh-4rem)]">
          <ErrorBoundary key={location.pathname}>
            <Outlet />
          </ErrorBoundary>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
