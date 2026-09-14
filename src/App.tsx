import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Layout from './components/Layout'
import { AuthProvider } from './stores/useAuthStore'
import { GoalProvider } from './stores/useGoalStore'
import { DataProvider } from './stores/useDataStore'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'

// Pages
import Dashboard from './pages/Index'
import MeuDia from './pages/MeuDia'
import Tarefas from './pages/Tarefas'
import Contratos from './pages/Contratos'
import Clientes from './pages/Clientes'
import Imoveis from './pages/Imoveis'
import Kanban from './pages/Kanban'
import Financeiro from './pages/Financeiro'
import Vistorias from './pages/Vistorias'
import Manutencoes from './pages/Manutencoes'
import Renovacoes from './pages/Renovacoes'
import Desocupacoes from './pages/Desocupacoes'
import Relatorios from './pages/Relatorios'
import Performance from './pages/Performance'
import Configuracoes from './pages/Configuracoes'
import Concierge from './pages/Concierge'
import NotFound from './pages/NotFound'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import Feedback from './pages/Feedback'
import Auditoria from './pages/Auditoria'
import DesempenhoEquipe from './pages/DesempenhoEquipe'
import { PipelineAccessProvider } from './stores/usePipelineAccess'
import { RestrictedAccessModal } from './components/pipeline/RestrictedAccessModal'

const App = () => (
  <BrowserRouter>
    <ErrorBoundary>
      <AuthProvider>
        <PipelineAccessProvider>
          <DataProvider>
            <GoalProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <RestrictedAccessModal />
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/onboarding" element={<Onboarding />} />
                  <Route path="/feedback" element={<Feedback />} />
                  <Route element={<Layout />}>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/meu-dia" element={<MeuDia />} />
                    <Route path="/tarefas" element={<Tarefas />} />
                    <Route path="/kanban" element={<Kanban />} />
                    <Route path="/clientes" element={<Clientes />} />
                    <Route path="/contratos" element={<Contratos />} />
                    <Route path="/imoveis" element={<Imoveis />} />
                    <Route path="/vistorias" element={<Vistorias />} />
                    <Route path="/manutencoes" element={<Manutencoes />} />
                    <Route path="/concierge" element={<Concierge />} />
                    <Route path="/renovacoes" element={<Renovacoes />} />
                    <Route path="/desocupacoes" element={<Desocupacoes />} />
                    <Route path="/financeiro" element={<Financeiro />} />
                    <Route path="/relatorios" element={<Relatorios />} />
                    <Route path="/auditoria" element={<Auditoria />} />
                    <Route path="/desempenho-equipe" element={<DesempenhoEquipe />} />
                    <Route path="/performance" element={<Performance />} />
                    <Route path="/configuracoes" element={<Configuracoes />} />
                  </Route>
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </TooltipProvider>
            </GoalProvider>
          </DataProvider>
        </PipelineAccessProvider>
      </AuthProvider>
    </ErrorBoundary>{' '}
  </BrowserRouter>
)

export default App
