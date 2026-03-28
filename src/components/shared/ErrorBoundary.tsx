import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface Props {
  children?: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error inside ErrorBoundary:', error, errorInfo)
  }

  private resetError = () => {
    this.setState({ hasError: false, error: null })
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return <DefaultFallback error={this.state.error} resetError={this.resetError} />
    }

    return this.props.children
  }
}

function DefaultFallback({ error, resetError }: { error: Error | null; resetError: () => void }) {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-8 text-center animate-in fade-in zoom-in-95 duration-500 w-full h-full">
      <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mb-6 shadow-sm border border-destructive/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-destructive/5 animate-pulse" />
        <AlertTriangle className="h-10 w-10 text-destructive relative z-10" />
      </div>
      <h2 className="text-3xl font-bold mb-3 tracking-tight text-foreground">Algo deu errado</h2>
      <p className="text-muted-foreground mb-10 max-w-md text-base leading-relaxed">
        Ocorreu um erro inesperado ao processar esta seção. Nossa equipe já foi notificada. Por
        favor, tente recarregar a página ou retorne ao painel principal.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
        <button
          onClick={() => resetError()}
          className="group flex items-center justify-center gap-2 px-6 py-3 bg-background text-foreground rounded-lg font-medium hover:bg-muted transition-all shadow-sm border hover:border-border/80"
        >
          <RefreshCcw className="w-4 h-4 group-hover:-rotate-180 transition-transform duration-500" />
          Tentar Novamente
        </button>
        <button
          onClick={() => {
            resetError()
            navigate('/')
          }}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-all shadow-sm"
        >
          <Home className="w-4 h-4" />
          Voltar ao Início
        </button>
      </div>
      {error && import.meta.env?.DEV && (
        <div className="mt-12 p-5 bg-muted/30 rounded-xl text-left text-xs font-mono text-muted-foreground max-w-3xl overflow-auto w-full border border-border/50 shadow-inner">
          <p className="font-bold text-foreground mb-2">
            Detalhes técnicos (Visível apenas em Dev):
          </p>
          {error.toString()}
        </div>
      )}
    </div>
  )
}
