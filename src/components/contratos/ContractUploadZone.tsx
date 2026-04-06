import { useState, useRef, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Upload, FileText, Sparkles, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react'
import type { ContratoUploadData } from '@/hooks/useContratos'

const UNIDADES = [
  'Jaú Vendas',
  'Jaú Lançamentos',
  'Jaú Locação',
  'Pederneiras Vendas',
  'Lençóis Paulista Vendas',
  'Lençóis Paulista Locação',
]

interface ExtractedData extends ContratoUploadData {
  confianca?: 'alta' | 'media' | 'baixa'
}

interface ContractUploadZoneProps {
  onSave: (dados: ContratoUploadData, arquivo?: File) => Promise<void>
  onCancel: () => void
  saving?: boolean
}

export default function ContractUploadZone({ onSave, onCancel, saving }: ContractUploadZoneProps) {
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [arrastando, setArrastando] = useState(false)
  const [extraindo, setExtraindo] = useState(false)
  const [dadosExtraidos, setDadosExtraidos] = useState<ExtractedData | null>(null)
  const [erroIA, setErroIA] = useState<string | null>(null)
  const [form, setForm] = useState<ContratoUploadData>({
    tipo: 'locacao',
    nome_parte: '',
    cpf_cnpj: '',
    imovel: '',
    unidade: '',
    valor_aluguel: '',
    indice_reajuste: 'IGPM',
    data_assinatura: '',
    data_inicio: '',
    data_fim: '',
  })

  const fileRef = useRef<HTMLInputElement>(null)

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setArrastando(false)
    const f = e.dataTransfer?.files?.[0]
    if (f && f.type === 'application/pdf') {
      setArquivo(f)
      setDadosExtraidos(null)
    }
  }, [])

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) {
      setArquivo(f)
      setDadosExtraidos(null)
    }
  }

  const extrairComIA = async () => {
    if (!arquivo) return
    setExtraindo(true)
    setErroIA(null)

    try {
      const base64 = await new Promise<string>((res, rej) => {
        const r = new FileReader()
        r.onload = () => res((r.result as string).split(',')[1])
        r.onerror = rej
        r.readAsDataURL(arquivo)
      })

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: `Você é um assistente especializado em leitura de contratos imobiliários. Extraia os dados do contrato e retorne SOMENTE um JSON válido, sem texto adicional. Formato obrigatório:
{
  "tipo": "locacao" ou "prestacao_servico",
  "nome_parte": "nome completo",
  "cpf_cnpj": "CPF ou CNPJ formatado",
  "imovel": "endereço completo",
  "valor_aluguel": 0.00,
  "indice_reajuste": "IGPM" ou "IPCA" ou "outro",
  "data_assinatura": "YYYY-MM-DD",
  "data_inicio": "YYYY-MM-DD",
  "data_fim": "YYYY-MM-DD",
  "confianca": "alta" ou "media" ou "baixa"
}
Se não encontrar um campo, use null.`,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'document',
                  source: { type: 'base64', media_type: 'application/pdf', data: base64 },
                },
                { type: 'text', text: 'Extraia os dados deste contrato imobiliário.' },
              ],
            },
          ],
        }),
      })

      const data = await response.json()
      const texto = data.content?.find((b: { type: string }) => b.type === 'text')?.text || ''
      const clean = texto.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(clean) as ExtractedData
      setDadosExtraidos(parsed)

      // Pré-preencher formulário
      setForm((prev) => ({
        ...prev,
        tipo: parsed.tipo || prev.tipo,
        nome_parte: parsed.nome_parte || '',
        cpf_cnpj: parsed.cpf_cnpj || '',
        imovel: parsed.imovel || '',
        valor_aluguel: parsed.valor_aluguel || '',
        indice_reajuste: parsed.indice_reajuste || 'IGPM',
        data_assinatura: parsed.data_assinatura || '',
        data_inicio: parsed.data_inicio || '',
        data_fim: parsed.data_fim || '',
      }))
    } catch {
      setErroIA('Não foi possível extrair os dados automaticamente. Preencha manualmente.')
    } finally {
      setExtraindo(false)
    }
  }

  const handleSave = async () => {
    await onSave(form, arquivo || undefined)
  }

  const updateField = (field: keyof ContratoUploadData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h2 className="text-xl font-semibold">Novo Contrato Digital</h2>

      {/* Drop zone */}
      <Card
        className={`border-2 border-dashed transition-colors cursor-pointer ${
          arrastando ? 'border-primary bg-primary/5' : arquivo ? 'border-green-500 bg-green-500/5' : 'border-muted-foreground/25 hover:border-primary/50'
        }`}
        onDragOver={(e) => { e.preventDefault(); setArrastando(true) }}
        onDragLeave={() => setArrastando(false)}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
      >
        <CardContent className="flex flex-col items-center justify-center py-10 gap-3">
          <input
            ref={fileRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={onFileSelect}
          />
          {arquivo ? (
            <>
              <FileText className="h-10 w-10 text-green-500" />
              <p className="font-medium text-green-600">{arquivo.name}</p>
              <p className="text-sm text-muted-foreground">
                {(arquivo.size / 1024).toFixed(0)} KB — clique para trocar
              </p>
            </>
          ) : (
            <>
              <Upload className="h-10 w-10 text-muted-foreground" />
              <p className="text-muted-foreground">Arraste o PDF aqui ou clique para selecionar</p>
              <p className="text-xs text-muted-foreground/70">Apenas arquivos .pdf</p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Botão IA */}
      {arquivo && !dadosExtraidos && (
        <Button
          onClick={extrairComIA}
          disabled={extraindo}
          className="w-full"
          variant="outline"
        >
          {extraindo ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Extraindo dados com IA...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" /> Extrair dados automaticamente com IA
            </>
          )}
        </Button>
      )}

      {/* Badge de confiança */}
      {dadosExtraidos && (
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <span className="text-sm">Dados extraídos</span>
          <Badge
            variant={
              dadosExtraidos.confianca === 'alta'
                ? 'success'
                : dadosExtraidos.confianca === 'media'
                  ? 'warning'
                  : 'destructive'
            }
          >
            Confiança: {dadosExtraidos.confianca || 'N/A'}
          </Badge>
        </div>
      )}

      {/* Erro IA */}
      {erroIA && (
        <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-md">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          {erroIA}
        </div>
      )}

      {/* Formulário */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={(v) => updateField('tipo', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="locacao">Locação</SelectItem>
                  <SelectItem value="prestacao_servico">Prestação de Serviço</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Unidade</Label>
              <Select value={form.unidade} onValueChange={(v) => updateField('unidade', v)}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {UNIDADES.map((u) => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Nome do Inquilino / Proprietário</Label>
              <Input
                value={form.nome_parte}
                onChange={(e) => updateField('nome_parte', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>CPF / CNPJ</Label>
              <Input
                value={form.cpf_cnpj}
                onChange={(e) => updateField('cpf_cnpj', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Índice de Reajuste</Label>
              <Select value={form.indice_reajuste} onValueChange={(v) => updateField('indice_reajuste', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="IGPM">IGP-M</SelectItem>
                  <SelectItem value="IPCA">IPCA</SelectItem>
                  <SelectItem value="Fixo">Fixo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Endereço do Imóvel</Label>
              <Input
                value={form.imovel}
                onChange={(e) => updateField('imovel', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Valor do Aluguel / Contrato</Label>
              <Input
                value={String(form.valor_aluguel)}
                onChange={(e) => updateField('valor_aluguel', e.target.value)}
                placeholder="0,00"
              />
            </div>

            <div className="space-y-2">
              <Label>Data de Assinatura</Label>
              <Input
                type="date"
                value={form.data_assinatura}
                onChange={(e) => updateField('data_assinatura', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Início da Vigência</Label>
              <Input
                type="date"
                value={form.data_inicio}
                onChange={(e) => updateField('data_inicio', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Fim da Vigência</Label>
              <Input
                type="date"
                value={form.data_fim}
                onChange={(e) => updateField('data_fim', e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button
              onClick={handleSave}
              disabled={!form.nome_parte || !form.imovel || saving}
              className="flex-1"
            >
              {saving ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</>
              ) : (
                'Salvar Contrato'
              )}
            </Button>
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

