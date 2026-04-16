import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Download, Eye, FileText, Upload, Loader2 } from 'lucide-react'
import type { ContratoLocacao } from '@/hooks/useContratos'

interface ContractDetailSheetProps {
  contrato: ContratoLocacao | null
  open: boolean
  onClose: () => void
  onGetDocUrl: (path: string) => Promise<string | null>
  onAddDocument: (contratoId: string, file: File) => Promise<void>
}

const fmt = (v: number | null | undefined) =>
  v != null
    ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : 'N/A'

const fmtDate = (d: string | null | undefined) => {
  if (!d) return 'N/A'
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR')
}

function diasLabel(dataFim: string | null): { text: string; variant: 'success' | 'warning' | 'destructive' | 'secondary' } {
  if (!dataFim) return { text: 'Indeterminado', variant: 'secondary' }
  const dias = Math.round(
    (new Date(dataFim + 'T00:00:00').getTime() - Date.now()) / 86400000
  )
  if (dias < 0) return { text: `Vencido há ${Math.abs(dias)} dias`, variant: 'destructive' }
  if (dias <= 30) return { text: `Vence em ${dias} dias`, variant: 'warning' }
  if (dias <= 90) return { text: `Vence em ${dias} dias`, variant: 'warning' }
  return { text: `${dias} dias restantes`, variant: 'success' }
}

export default function ContractDetailSheet({
  contrato,
  open,
  onClose,
  onGetDocUrl,
  onAddDocument,
}: ContractDetailSheetProps) {
  const [loadingDoc, setLoadingDoc] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  if (!contrato) return null

  const venc = diasLabel(contrato.end_date)
  const attachments = contrato.attachments || []

  const handleDownload = async (path: string) => {
    setLoadingDoc(path)
    try {
      const url = await onGetDocUrl(path)
      if (url) window.open(url, '_blank')
    } finally {
      setLoadingDoc(null)
    }
  }

  const handleAddFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      await onAddDocument(contrato.id, file)
    } finally {
      setUploading(false)
    }
  }

  const fields = [
    { label: 'Parte', value: contrato.nome_parte || contrato.contract_number || contrato.id.slice(0, 8) },
    { label: 'CPF / CNPJ', value: contrato.cpf_cnpj || 'N/A' },
    { label: 'Endereço', value: contrato.imovel_endereco || 'N/A', span: true },
    { label: 'Unidade', value: contrato.unidade || 'N/A' },
    { label: 'Índice de Reajuste', value: contrato.readjust_index || 'N/A' },
    { label: 'Aluguel', value: fmt(contrato.rent_value) },
    { label: 'Condomínio', value: fmt(contrato.condominium_value) },
    { label: 'IPTU', value: fmt(contrato.iptu_value) },
    { label: 'Seguro', value: fmt(contrato.insurance_value) },
    { label: 'Garantia', value: contrato.guarantee_type || 'N/A' },
    { label: 'Valor Garantia', value: fmt(contrato.guarantee_value) },
    { label: 'Assinatura', value: fmtDate(contrato.data_assinatura) },
    { label: 'Início', value: fmtDate(contrato.start_date) },
    { label: 'Fim', value: fmtDate(contrato.end_date) },
    { label: 'Entrega Chaves', value: fmtDate(contrato.key_delivery_date) },
  ]

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="sm:max-w-lg p-0 flex flex-col h-full border-l">
        <div className="p-6 border-b bg-muted/10">
          <SheetHeader>
            <div className="flex items-center justify-between gap-2">
              <SheetTitle className="text-xl">
                {contrato.nome_parte || `Contrato ${contrato.contract_number || contrato.id.slice(0, 8)}`}
              </SheetTitle>
              <Badge variant={venc.variant}>{venc.text}</Badge>
            </div>
            <SheetDescription className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {contrato.tipo === 'prestacao_servico' ? 'PREST. SERVIÇO' : 'LOCAÇÃO'}
              </Badge>
              <Badge
                variant={
                  contrato.status === 'Ativo' ? 'outline' : contrato.status === 'Encerrado' ? 'secondary' : 'destructive'
                }
                className={contrato.status === 'Ativo' ? 'border-primary text-primary' : ''}
              >
                {contrato.status}
              </Badge>
            </SheetDescription>
          </SheetHeader>
        </div>

        <ScrollArea className="flex-1">
          {/* Dados do contrato */}
          <div className="p-6">
            <div className="grid grid-cols-2 gap-y-4 gap-x-4 text-sm">
              {fields.map((f) => (
                <div key={f.label} className={f.span ? 'col-span-2' : ''}>
                  <span className="text-muted-foreground block text-xs mb-0.5">{f.label}</span>
                  <span className="font-medium">{f.value}</span>
                </div>
              ))}
            </div>

            {contrato.notes && (
              <div className="mt-4">
                <span className="text-muted-foreground block text-xs mb-0.5">Observações</span>
                <p className="text-sm">{contrato.notes}</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Documentos anexados */}
          <div className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Documentos ({attachments.length})
            </h3>

            {attachments.length === 0 && (
              <p className="text-sm text-muted-foreground mb-4">
                Nenhum documento anexado ainda.
              </p>
            )}

            <div className="space-y-2 mb-4">
              {attachments.map((path, i) => {
                const fileName = path.split('/').pop() || `Documento ${i + 1}`
                return (
                  <div
                    key={path}
                    className="flex items-center gap-3 p-3 rounded-md border bg-muted/30"
                  >
                    <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="flex-1 text-sm truncate">{contrato.arquivo_nome || fileName}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDownload(path)}
                      disabled={loadingDoc === path}
                    >
                      {loadingDoc === path ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDownload(path)}
                      disabled={loadingDoc === path}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                )
              })}
            </div>

            {/* Adicionar mais documentos */}
            <div className="relative">
              <Button variant="outline" className="w-full" disabled={uploading}>
                {uploading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...</>
                ) : (
                  <><Upload className="mr-2 h-4 w-4" /> Anexar Documento</>
                )}
              </Button>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handleAddFile}
                disabled={uploading}
              />
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

