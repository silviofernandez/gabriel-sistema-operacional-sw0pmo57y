import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ShieldAlert,
  Search,
  Filter,
  Download,
  Printer,
  Calendar,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Lock,
  Eye,
  FileText,
  UserCheck,
} from 'lucide-react'
import usePipelineAccess from '@/stores/usePipelineAccess'
import { AuditLogItem } from '@/types/pipeline'

export default function Auditoria() {
  const { auditLogs, stages } = usePipelineAccess()

  const [search, setSearch] = useState('')
  const [selectedColaborador, setSelectedColaborador] = useState<string>('todos')
  const [selectedEtapa, setSelectedEtapa] = useState<string>('todas')
  const [selectedAcao, setSelectedAcao] = useState<string>('todas')
  const [selectedPeriodo, setSelectedPeriodo] = useState<string>('todos')

  // Colaboradores únicos para filtro
  const colaboradores = useMemo(() => {
    const map = new Map<string, string>()
    auditLogs.forEach((l) => {
      if (l.colaborador_id && l.colaborador_nome) {
        map.set(l.colaborador_id, l.colaborador_nome)
      }
    })
    return Array.from(map.entries()).map(([id, nome]) => ({ id, nome }))
  }, [auditLogs])

  // Filtragem
  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      if (selectedColaborador !== 'todos' && log.colaborador_id !== selectedColaborador) {
        return false
      }
      if (selectedEtapa !== 'todas' && log.etapa_id !== selectedEtapa) {
        return false
      }
      if (selectedAcao !== 'todas' && log.acao_tipo !== selectedAcao) {
        return false
      }
      if (search) {
        const query = search.toLowerCase()
        const matchName = log.colaborador_nome?.toLowerCase().includes(query)
        const matchContract = log.contrato_id?.toLowerCase().includes(query)
        const matchMotivo = log.motivo?.toLowerCase().includes(query)
        if (!matchName && !matchContract && !matchMotivo) return false
      }
      return true
    })
  }, [auditLogs, selectedColaborador, selectedEtapa, selectedAcao, search])

  // Contadores para cartões resumo
  const totalNegados = useMemo(
    () => auditLogs.filter((l) => l.acao_tipo === 'tentou_acesso_negado').length,
    [auditLogs],
  )
  const totalAdjacentes = useMemo(
    () => auditLogs.filter((l) => l.acao_tipo === 'visualizou_adjacente').length,
    [auditLogs],
  )
  const totalRetrabalhos = useMemo(
    () => auditLogs.filter((l) => l.acao_tipo === 'reabriu_tarefa').length,
    [auditLogs],
  )
  const totalPermissaoExtra = useMemo(
    () => auditLogs.filter((l) => l.acao_tipo === 'acessou_com_permissao_extra').length,
    [auditLogs],
  )

  // Exportar CSV
  const handleExportCSV = () => {
    const headers = [
      'Timestamp',
      'Colaborador',
      'Acao',
      'Etapa',
      'Etapa Propria',
      'Contrato',
      'Motivo',
      'IP',
      'Dispositivo',
      'Autorizado Por',
    ]
    const rows = filteredLogs.map((l) => [
      l.timestamp,
      `"${l.colaborador_nome}"`,
      l.acao_tipo,
      l.etapa_id || '',
      l.etapa_propria ? 'Sim' : 'Nao',
      l.contrato_id || '',
      `"${(l.motivo || '').replace(/"/g, '""')}"`,
      l.ip || '',
      `"${(l.dispositivo || '').replace(/"/g, '""')}"`,
      `"${(l.autorizado_por || '').replace(/"/g, '""')}"`,
    ])

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `trilha_auditoria_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handlePrintPDF = () => {
    window.print()
  }

  const getActionBadge = (acao: string) => {
    switch (acao) {
      case 'tentou_acesso_negado':
        return (
          <Badge variant="destructive" className="gap-1 font-mono text-[11px]">
            <Lock className="w-3 h-3" /> Tentativa Negada
          </Badge>
        )
      case 'visualizou_adjacente':
        return (
          <Badge className="bg-amber-500 hover:bg-amber-600 text-white gap-1 font-mono text-[11px]">
            <Eye className="w-3 h-3" /> Leitura Adjacente
          </Badge>
        )
      case 'reabriu_tarefa':
        return (
          <Badge className="bg-amber-600 hover:bg-amber-700 text-white gap-1 font-mono text-[11px]">
            <RotateCcw className="w-3 h-3" /> Retrabalho (Reabriu)
          </Badge>
        )
      case 'acessou_com_permissao_extra':
        return (
          <Badge
            variant="secondary"
            className="gap-1 font-mono text-[11px] bg-primary/10 text-primary border-primary/20"
          >
            <UserCheck className="w-3 h-3" /> Permissão Extra
          </Badge>
        )
      case 'concluiu_tarefa':
        return (
          <Badge
            variant="outline"
            className="gap-1 text-emerald-600 border-emerald-500/30 bg-emerald-500/10 font-mono text-[11px]"
          >
            <CheckCircle2 className="w-3 h-3" /> Concluiu Tarefa
          </Badge>
        )
      case 'avancou_etapa':
        return (
          <Badge
            variant="outline"
            className="gap-1 text-blue-600 border-blue-500/30 bg-blue-500/10 font-mono text-[11px]"
          >
            Avançou Etapa
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="font-mono text-[11px]">
            {acao.replace('_', ' ')}
          </Badge>
        )
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up max-w-7xl mx-auto w-full pb-12 print:p-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 print:border-none">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Trilha de Auditoria Completa
            </h1>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            Registro imutável de todas as ações, movimentações de esteira, acessos adjacentes e
            tentativas negadas.
          </p>
        </div>
        <div className="flex items-center gap-2 print:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="gap-1.5 shadow-sm"
          >
            <Download className="w-4 h-4" /> Exportar CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrintPDF}
            className="gap-1.5 shadow-sm"
          >
            <Printer className="w-4 h-4" /> Imprimir / PDF
          </Button>
        </div>
      </div>

      {/* Cartões de Indicadores de Auditoria */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-destructive/30 bg-destructive/5 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-destructive tracking-wider flex items-center justify-between">
              Acessos Negados <Lock className="w-4 h-4" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive font-mono">{totalNegados}</div>
            <p className="text-xs text-muted-foreground mt-1">Tentativas fora do escopo (Alerta)</p>
          </CardContent>
        </Card>

        <Card className="border-amber-500/30 bg-amber-500/5 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-amber-700 dark:text-amber-400 tracking-wider flex items-center justify-between">
              Acessos Adjacentes <Eye className="w-4 h-4" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-700 dark:text-amber-400 font-mono">
              {totalAdjacentes}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Visualizações de contexto registradas
            </p>
          </CardContent>
        </Card>

        <Card className="border-amber-600/30 bg-amber-600/5 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-amber-800 dark:text-amber-300 tracking-wider flex items-center justify-between">
              Retrabalhos Detectados <RotateCcw className="w-4 h-4" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-800 dark:text-amber-300 font-mono">
              {totalRetrabalhos}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Tarefas reabertas após conclusão</p>
          </CardContent>
        </Card>

        <Card className="border-primary/30 bg-primary/5 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-primary tracking-wider flex items-center justify-between">
              Permissões Extras <UserCheck className="w-4 h-4" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary font-mono">{totalPermissaoExtra}</div>
            <p className="text-xs text-muted-foreground mt-1">Acessos com cobertura autorizada</p>
          </CardContent>
        </Card>
      </div>

      {/* Barra de Filtros */}
      <Card className="shadow-sm border print:hidden">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            <div className="relative md:col-span-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
              <Input
                placeholder="Buscar contrato, motivo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            <Select value={selectedColaborador} onValueChange={setSelectedColaborador}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Colaborador" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos Colaboradores</SelectItem>
                {colaboradores.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedEtapa} onValueChange={setSelectedEtapa}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Etapa da Esteira" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as Etapas (1-12)</SelectItem>
                {stages.map((stg) => (
                  <SelectItem key={stg.id} value={stg.id}>
                    {stg.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedAcao} onValueChange={setSelectedAcao}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Tipo de Ação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as Ações</SelectItem>
                <SelectItem value="tentou_acesso_negado">Tentativas Negadas (Vermelho)</SelectItem>
                <SelectItem value="visualizou_adjacente">Visualizou Adjacente (Amarelo)</SelectItem>
                <SelectItem value="reabriu_tarefa">Reabriu Tarefa / Retrabalho</SelectItem>
                <SelectItem value="acessou_com_permissao_extra">
                  Permissão Extra / Cobertura
                </SelectItem>
                <SelectItem value="avancou_etapa">Avançou Etapa</SelectItem>
                <SelectItem value="concluiu_tarefa">Concluiu Tarefa</SelectItem>
                <SelectItem value="visualizou">Visualizou Etapa Normal</SelectItem>
                <SelectItem value="editou">Editou Dados</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="ghost"
              size="sm"
              className="h-9 text-xs"
              onClick={() => {
                setSearch('')
                setSelectedColaborador('todos')
                setSelectedEtapa('todas')
                setSelectedAcao('todas')
              }}
            >
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Trilha de Auditoria */}
      <Card className="shadow-sm border">
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Registros de Auditoria</CardTitle>
              <CardDescription className="text-xs">
                Exibindo {filteredLogs.length} registros no período selecionado
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-destructive inline-block" /> Alerta
                Negado
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Adjacente /
                Retrabalho
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow className="text-xs">
                  <TableHead className="w-36">Timestamp</TableHead>
                  <TableHead>Colaborador</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Etapa</TableHead>
                  <TableHead>Contrato</TableHead>
                  <TableHead>Motivo / Detalhes</TableHead>
                  <TableHead>Dispositivo & IP</TableHead>
                  <TableHead>Autorização</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => {
                  const stageObj = stages.find((s) => s.id === log.etapa_id)
                  const isRed = log.acao_tipo === 'tentou_acesso_negado'
                  const isYellow =
                    log.acao_tipo === 'visualizou_adjacente' || log.acao_tipo === 'reabriu_tarefa'

                  return (
                    <TableRow
                      key={log.id}
                      className={`text-xs transition-colors ${
                        isRed
                          ? 'bg-destructive/10 hover:bg-destructive/15 border-l-4 border-l-destructive'
                          : isYellow
                            ? 'bg-amber-500/10 hover:bg-amber-500/15 border-l-4 border-l-amber-500'
                            : 'hover:bg-muted/40'
                      }`}
                    >
                      <TableCell className="font-mono text-muted-foreground whitespace-nowrap">
                        {log.timestamp}
                      </TableCell>
                      <TableCell className="font-medium whitespace-nowrap">
                        <div className="flex flex-col">
                          <span>{log.colaborador_nome}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {log.etapa_propria ? 'Escopo próprio' : 'Fora do escopo'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {getActionBadge(log.acao_tipo)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {stageObj ? (
                          <span className="font-medium">{stageObj.name}</span>
                        ) : log.etapa_id ? (
                          `Etapa ${log.etapa_id}`
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-muted-foreground whitespace-nowrap">
                        {log.contrato_id || '-'}
                      </TableCell>
                      <TableCell className="max-w-xs truncate" title={log.motivo}>
                        <div className="flex flex-col">
                          <span className="text-foreground">{log.motivo || '-'}</span>
                          {log.dados_depois && Object.keys(log.dados_depois).length > 0 && (
                            <span className="text-[10px] font-mono text-muted-foreground">
                              {JSON.stringify(log.dados_depois)}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-[11px] text-muted-foreground whitespace-nowrap">
                        <div className="flex flex-col">
                          <span>{log.ip || '187.22.45.10'}</span>
                          <span
                            className="text-[10px] truncate max-w-[120px]"
                            title={log.dispositivo}
                          >
                            {log.dispositivo || 'Navegador Web'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-[11px] text-muted-foreground whitespace-nowrap">
                        {log.autorizado_por ? (
                          <Badge variant="outline" className="text-[10px] bg-background">
                            {log.autorizado_por}
                          </Badge>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}

                {filteredLogs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                      Nenhum registro de auditoria encontrado para os filtros aplicados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
