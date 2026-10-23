import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Database,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function DataImport() {
  const { toast } = useToast()
  const [importing, setImporting] = useState(false)
  const [selectedFile, setSelectedFile] = useState<string | null>(null)

  const handleSimularImport = () => {
    if (!selectedFile) return
    setImporting(true)
    setTimeout(() => {
      setImporting(false)
      toast({
        title: 'Planilha Analisada',
        description:
          'Mapeamento dos campos da planilha com as tabelas de contratos e imóveis da Gabriel validado.',
      })
    }, 1200)
  }

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" /> Importação e Carga de Dados
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Carga de contratos legados, cadastro de proprietários e imóveis das 3 praças (Jaú,
            Pederneiras, Lençóis).
          </p>
        </div>
        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
          Suporte XLSX / CSV
        </Badge>
      </div>

      <Card className="border">
        <CardHeader>
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Upload className="w-4 h-4 text-primary" /> Envio de Arquivo de Base de Dados
          </CardTitle>
          <CardDescription className="text-xs">
            Selecione uma planilha de exportação do sistema anterior para importar clientes,
            contratos e imóveis.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed rounded-xl p-6 text-center space-y-2 bg-muted/20">
            <FileSpreadsheet className="w-8 h-8 text-muted-foreground mx-auto" />
            <p className="text-xs text-muted-foreground">
              {selectedFile
                ? `Arquivo selecionado: ${selectedFile}`
                : 'Arraste ou selecione a planilha (XLSX, CSV)'}
            </p>
            <Input
              type="file"
              accept=".csv,.xlsx,.xls"
              className="max-w-xs mx-auto text-xs h-8 cursor-pointer"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) setSelectedFile(f.name)
              }}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              disabled={!selectedFile || importing}
              onClick={handleSimularImport}
              className="gap-1.5 text-xs"
            >
              <CheckCircle2 className="w-4 h-4" />{' '}
              {importing ? 'Validando Planilha...' : 'Validar e Processar'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
