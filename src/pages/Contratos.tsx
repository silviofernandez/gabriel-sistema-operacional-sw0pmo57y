import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Download, Filter, Plus, Search, FileText, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import useContratos from '@/hooks/useContratos'
import type { ContratoLocacao, ContratoUploadData } from '@/hooks/useContratos'
import ContractUploadZone from '@/components/contratos/ContractUploadZone'
import ContractDetailSheet from '@/components/contratos/ContractDetailSheet'

const fmt = (v: number | null | undefined) =>
  v != null
    ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : '—'

const fmtDate = (d: string | null | undefined) => {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR')
}

export default function Contratos() {
  const [view, setView] = useState<'lista' | 'upload'>('lista')
  const [selectedContract, setSelectedContract] = useState<ContratoLocacao | null>(null)
  const [filtro, setFiltro] = useState('todos')
  const [buscaTexto, setBuscaTexto] = useState('')
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const {
    contratos,
    loading,
    stats,
    criarContrato,
    adicionarDocumento,
    getDocumentoUrl,
    diasParaVencimento,
  } = useContratos()

  // Filtros
  const contratosFiltrados = contratos.filter((c) => {
    const dias = diasParaVencimento(c.end_date)
    const matchFiltro =
      filtro === 'todos' ||
      c.tipo === filtro ||
      (filtro === 'vencendo' && dias >= 0 && dias <= 90) ||
      (filtro === 'vencidos' && dias < 0)
    const texto = buscaTexto.toLowerCase()
    const matchBusca =
      !texto ||
      (c.nome_parte || '').toLowerCase().includes(texto) ||
      (c.imovel_endereco || '').toLowerCase().includes(texto) ||
      (c.contract_number || '').toLowerCase().includes(texto)
    return matchFiltro && matchBusca
  })

  const handleSave = async (dados: ContratoUploadData, arquivo?: File) => {
    setSaving(true)
    try {
      await criarContrato(dados, arquivo)
      toast({
        title: 'Contrato salvo com sucesso',
        description: arquivo
          ? 'O PDF foi enviado e os dados registrados.'
          : 'Os dados do contrato foram registrados.',
      })
      setView('lista')
    } catch (e: unknown) {
      toast({
        title: 'Erro ao salvar',
        description: e instanceof Error ? e.message : 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleAddDocument = async (contratoId: string, file: File) => {
    try {
      await adicionarDocumento(contratoId, file)
      toast({ title: 'Documento anexado', description: file.name })
      setSelectedContract((prev) => {
        if (!prev || prev.id !== contratoId) return prev
        return {
          ...prev,
          attachments: [...(prev.attachments || []), `contratos/${contratoId}/${file.name}`],
        }
      })
    } catch (e: unknown) {
      toast({
        title: 'Erro ao anexar',
        description: e instanceof Error ? e.message : 'Tente novamente.',
        variant: 'destructive',
      })
    }
  }

  const getDiasVencBadge = (dataFim: string | null) => {
    if (!dataFim) return <Badge variant="secondary">Indeterminado</Badge>
    const dias = diasParaVencimento(dataFim)
    if (dias < 0)
      return <Badge variant="destructive">Vencido há {Math.abs(dias)}d</Badge>
    if (dias <= 30) return <Badge variant="warning">Vence em {dias}d</Badge>
    if (dias <= 90)
      return (
        <Badge variant="outline" className="border-amber-400 text-amber-600">
          {dias}d
        </Badge>
      )
    return (
      <Badge variant="outline" className="border-green-500 text-green-600">
        {dias}d
      </Badge>
    )
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contratos Digitais</h1>
          <p className="text-muted-foreground mt-1">
            Gestão de contratos com upload, extração por IA e armazenamento digital.
          </p>
        </div>
        <div className="flex gap-2">
          {view === 'lista' ? (
            <Button onClick={() => setView('upload')}>
              <Plus className="mr-2 h-4 w-4" /> Novo Contrato
            </Button>
          ) : (
            <Button variant="outline" onClick={() => setView('lista')}>
              Voltar à Lista
            </Button>
          )}
        </div>
      </div>

      {/* View: Upload */}
      {view === 'upload' && (
        <ContractUploadZone
          onSave={handleSave}
          onCancel={() => setView('lista')}
          saving={saving}
        />
      )}

      {/* View: Lista */}
      {view === 'lista' && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total', value: stats.total, color: 'text-primary' },
              { label: 'Ativos', value: stats.ativos, color: 'text-green-500' },
              { label: 'Vencendo em 30d', value: stats.vencendo30, color: 'text-amber-500' },
              { label: 'Vencidos', value: stats.vencidos, color: 'text-red-500' },
            ].map((k) => (
              <Card key={k.label}>
                <CardContent className="pt-4 pb-4">
                  <div className={`text-2xl font-bold ${k.color}`}>{k.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{k.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex gap-2 flex-wrap">
              {[
                { key: 'todos', label: 'Todos' },
                { key: 'locacao', label: 'Locação' },
                { key: 'prestacao_servico', label: 'Prest. Serviço' },
                { key: 'vencendo', label: 'Vencendo' },
                { key: 'vencidos', label: 'Vencidos' },
              ].map((f) => (
                <Button
                  key={f.key}
                  variant={filtro === f.key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFiltro(f.key)}
                >
                  {f.label}
                </Button>
              ))}
            </div>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou imóvel..."
                value={buscaTexto}
                onChange={(e) => setBuscaTexto(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Tabela */}
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Carregando contratos...</span>
                </div>
              ) : contratosFiltrados.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <FileText className="h-12 w-12 mb-3 opacity-30" />
                  <p>Nenhum contrato encontrado</p>
                  <Button variant="link" onClick={() => setView('upload')} className="mt-2">
                    Cadastrar primeiro contrato
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Parte</TableHead>
                      <TableHead>Imóvel</TableHead>
                      <TableHead>Aluguel</TableHead>
                      <TableHead>Vigência</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">Vencimento</TableHead>
                      <TableHead className="text-center w-[50px]">Doc</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contratosFiltrados.map((c) => (
                      <TableRow
                        key={c.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => setSelectedContract(c)}
                      >
                        <TableCell>
                          <Badge variant="outline" className="text-xs font-normal">
                            {c.tipo === 'prestacao_servico' ? 'PREST. SERV.' : 'LOCAÇÃO'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {c.nome_parte || c.contract_number || c.id.slice(0, 8)}
                        </TableCell>
                        <TableCell className="text-muted-foreground max-w-[200px] truncate">
                          {c.imovel_endereco || '—'}
                        </TableCell>
                        <TableCell className="text-primary font-medium">
                          {fmt(c.rent_value)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {fmtDate(c.start_date)} — {fmtDate(c.end_date)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              c.status === 'Ativo'
                                ? 'outline'
                                : c.status === 'Encerrado'
                                  ? 'secondary'
                                  : 'destructive'
                            }
                            className={c.status === 'Ativo' ? 'border-primary text-primary' : ''}
                          >
                            {c.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {getDiasVencBadge(c.end_date)}
                        </TableCell>
                        <TableCell className="text-center">
                          {(c.attachments?.length || 0) > 0 && (
                            <FileText className="h-4 w-4 text-primary mx-auto" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Sheet de detalhes */}
      <ContractDetailSheet
        contrato={selectedContract}
        open={!!selectedContract}
        onClose={() => setSelectedContract(null)}
        onGetDocUrl={getDocumentoUrl}
        onAddDocument={handleAddDocument}
      />
    </div>
  )
}
