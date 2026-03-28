import { useState, useEffect, useCallback } from 'react'
import useAuthStore from '@/stores/useAuthStore'
import useDataStore from '@/stores/useDataStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid } from 'recharts'
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Activity,
  Server,
  Users,
  Clock,
  AlertTriangle,
  PlayCircle,
  Trash2,
  Cpu,
  Database,
  CheckCircle2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface LogEntry {
  id: string
  time: string
  message: string
  type: 'info' | 'warning' | 'success' | 'error'
}

export default function Performance() {
  const { profileLevel } = useAuthStore()
  const { db, clients, injectStressData, clearStressData } = useDataStore()

  const [simulatedUsers, setSimulatedUsers] = useState(124)
  const [latencyData, setLatencyData] = useState<{ time: string; ms: number }[]>([])
  const [isStressing, setIsStressing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [stressVolume, setStressVolume] = useState('5000')

  const totalRecords = clients.length + db.tasks.length + db.maintenances.length
  let statusLevel: 'Normal' | 'Warning' | 'Critical' = 'Normal'
  if (totalRecords > 15000) statusLevel = 'Critical'
  else if (totalRecords > 5000) statusLevel = 'Warning'

  const addLog = useCallback((message: string, type: LogEntry['type'] = 'info') => {
    setLogs((prev) => [
      {
        id: Math.random().toString(36).substr(2, 9),
        time: new Date().toLocaleTimeString('pt-BR', { hour12: false }),
        message,
        type,
      },
      ...prev,
    ])
  }, [])

  // Simulate real-time metrics
  useEffect(() => {
    if (profileLevel === 'Colaborador') return

    // Initial chart data
    const initialData = Array.from({ length: 20 }).map((_, i) => ({
      time: new Date(Date.now() - (19 - i) * 1000).toLocaleTimeString('pt-BR', {
        second: '2-digit',
        minute: '2-digit',
      }),
      ms: Math.floor(Math.random() * 30) + 20,
    }))
    setLatencyData(initialData)

    const metricsInterval = setInterval(() => {
      // Simulate users fluctuation
      setSimulatedUsers((prev) => {
        const change = Math.floor(Math.random() * 11) - 5
        return Math.max(10, prev + change)
      })

      // Simulate API latency mapping to total records
      setLatencyData((prev) => {
        const now = new Date()
        const baseLatency = statusLevel === 'Critical' ? 150 : statusLevel === 'Warning' ? 80 : 30
        const jitter = Math.floor(Math.random() * (baseLatency * 0.4))
        const newPoint = {
          time: now.toLocaleTimeString('pt-BR', { second: '2-digit', minute: '2-digit' }),
          ms: baseLatency + jitter,
        }
        return [...prev.slice(1), newPoint]
      })
    }, 2000)

    return () => clearInterval(metricsInterval)
  }, [statusLevel, profileLevel])

  // Prevent access for Colaborador
  if (profileLevel === 'Colaborador') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4 animate-in fade-in">
        <AlertTriangle className="h-16 w-16 text-warning" />
        <h2 className="text-2xl font-bold">Acesso Restrito</h2>
        <p className="text-muted-foreground text-center max-w-md">
          Este painel de Monitoramento de Performance é exclusivo para perfis Gestor ou Diretor.
        </p>
      </div>
    )
  }

  const runStressTest = () => {
    const volume = parseInt(stressVolume, 10)
    if (isNaN(volume)) return

    setIsStressing(true)
    setProgress(0)
    addLog(`Iniciando teste de stress: injeção de ${volume} registros.`, 'info')

    const chunkSize = 1000
    const chunks = Math.ceil(volume / chunkSize)
    let currentChunk = 0

    const processChunk = () => {
      if (currentChunk < chunks) {
        const remaining = volume - currentChunk * chunkSize
        const toInject = Math.min(chunkSize, remaining)

        const start = performance.now()
        // Inject data into the global store - this triggers the dynamic Health Score useMemo
        injectStressData(toInject)
        const end = performance.now()

        currentChunk++
        setProgress(Math.round((currentChunk / chunks) * 100))
        addLog(
          `Lote ${currentChunk}/${chunks} (${toInject} registros) processado em ${(
            end - start
          ).toFixed(2)}ms.`,
          end - start > 100 ? 'warning' : 'info',
        )

        // Give the UI thread a moment to breathe and render the progress bar
        setTimeout(processChunk, 250)
      } else {
        setIsStressing(false)
        setProgress(100)
        addLog(
          `Teste de stress concluído com sucesso. Base de dados atual: ${clients.length} clientes.`,
          'success',
        )
      }
    }

    // Start first chunk
    setTimeout(processChunk, 100)
  }

  const handleClearData = () => {
    clearStressData()
    addLog('Dados de stress removidos. Base restaurada ao estado inicial.', 'success')
    setProgress(0)
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up pb-12 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Activity className="h-8 w-8 text-primary" /> Performance & Stress
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitore a saúde dos recursos, latência de API e teste a capacidade de renderização com
            grandes volumes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={
              statusLevel === 'Normal'
                ? 'success'
                : statusLevel === 'Warning'
                  ? 'warning'
                  : 'destructive'
            }
            className="px-3 py-1 text-sm uppercase tracking-wider"
          >
            {statusLevel === 'Normal' && <CheckCircle2 className="w-4 h-4 mr-1.5" />}
            {statusLevel === 'Warning' && <AlertTriangle className="w-4 h-4 mr-1.5" />}
            {statusLevel === 'Critical' && <Server className="w-4 h-4 mr-1.5 animate-pulse" />}
            Status: {statusLevel}
          </Badge>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              Usuários Simultâneos (Simulação) <Users className="h-4 w-4 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold font-mono text-foreground">
              {simulatedUsers.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Sessões ativas no tenant</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              Volume de Registros <Database className="h-4 w-4 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold font-mono text-foreground">
              {totalRecords.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Clientes, tarefas e manutenções</p>
          </CardContent>
        </Card>

        <Card
          className={cn(
            'shadow-sm transition-colors duration-500',
            statusLevel === 'Critical' ? 'border-destructive/50 bg-destructive/5' : '',
          )}
        >
          <CardHeader className="pb-2">
            <CardTitle
              className={cn(
                'text-sm font-medium flex items-center justify-between',
                statusLevel === 'Critical' ? 'text-destructive' : 'text-muted-foreground',
              )}
            >
              Latência Média da API <Clock className="h-4 w-4" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                'text-4xl font-bold font-mono',
                statusLevel === 'Critical' ? 'text-destructive' : 'text-foreground',
              )}
            >
              {latencyData.length > 0 ? latencyData[latencyData.length - 1].ms : 0}ms
            </div>
            <p className="text-xs text-muted-foreground mt-1">Tempo de resposta backend</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Charts and Controls */}
        <div className="col-span-1 lg:col-span-2 flex flex-col gap-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Monitoramento de Latência</CardTitle>
              <CardDescription>
                Tempo de resposta das interações de API em milissegundos.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ChartContainer
                config={{
                  ms: {
                    label: 'Latência (ms)',
                    color:
                      statusLevel === 'Critical'
                        ? 'hsl(var(--destructive))'
                        : statusLevel === 'Warning'
                          ? 'hsl(var(--warning))'
                          : 'hsl(var(--primary))',
                  },
                }}
                className="w-full h-full"
              >
                <LineChart data={latencyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid
                    vertical={false}
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="time"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <RechartsTooltip content={<ChartTooltipContent indicator="line" />} />
                  <Line
                    type="monotone"
                    dataKey="ms"
                    stroke="var(--color-ms)"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-primary/20">
            <CardHeader className="bg-primary/5 border-b border-primary/10">
              <CardTitle className="flex items-center gap-2">
                <Cpu className="h-5 w-5 text-primary" /> Stress Test Controller
              </CardTitle>
              <CardDescription>
                Injete milhares de registros para testar a responsividade do cálculo dinâmico de
                Health Score.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="w-full sm:w-64 space-y-2">
                  <label className="text-sm font-medium">Volume de Registros</label>
                  <Select
                    value={stressVolume}
                    onValueChange={setStressVolume}
                    disabled={isStressing}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o volume" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1000">1.000 Registros</SelectItem>
                      <SelectItem value="5000">5.000 Registros</SelectItem>
                      <SelectItem value="10000">10.000 Registros</SelectItem>
                      <SelectItem value="25000">25.000 Registros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={runStressTest}
                  disabled={isStressing}
                  className="w-full sm:w-auto min-w-[160px]"
                >
                  {isStressing ? (
                    <>Processando...</>
                  ) : (
                    <>
                      <PlayCircle className="mr-2 h-4 w-4" /> Run Stress Test
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleClearData}
                  disabled={isStressing}
                  className="w-full sm:w-auto"
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Limpar Dados
                </Button>
              </div>

              {(isStressing || progress > 0) && (
                <div className="mt-6 space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Progresso da Injeção</span>
                    <span className="font-mono">{progress}%</span>
                  </div>
                  <Progress
                    value={progress}
                    className="h-2"
                    indicatorColor={
                      progress === 100 ? 'bg-success' : isStressing ? 'bg-primary' : 'bg-secondary'
                    }
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Logs */}
        <div className="col-span-1 h-full">
          <Card className="shadow-sm h-full flex flex-col">
            <CardHeader className="pb-3 border-b shrink-0">
              <CardTitle className="text-lg flex items-center justify-between">
                System Logs
                <Badge variant="secondary" className="font-normal text-[10px]">
                  Live
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden relative min-h-[400px]">
              <ScrollArea className="h-full w-full absolute inset-0">
                <div className="p-4 space-y-3 font-mono text-xs">
                  {logs.length === 0 && (
                    <div className="text-muted-foreground text-center py-8">
                      Aguardando eventos do sistema...
                    </div>
                  )}
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className={cn(
                        'flex flex-col pb-3 border-b border-border/50 last:border-0',
                        log.type === 'error'
                          ? 'text-destructive'
                          : log.type === 'warning'
                            ? 'text-warning'
                            : log.type === 'success'
                              ? 'text-success'
                              : 'text-foreground',
                      )}
                    >
                      <span className="text-muted-foreground mb-0.5 opacity-70">[{log.time}]</span>
                      <span className="break-words leading-relaxed">{log.message}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
