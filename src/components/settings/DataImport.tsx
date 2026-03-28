import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Upload } from 'lucide-react'

export function DataImport() {
  return (
    <Card className="animate-in fade-in zoom-in-95 duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Upload className="w-6 h-6 text-primary" /> Importar Dados (Lote)
        </CardTitle>
        <CardDescription>
          Faça upload de planilhas para migrar rapidamente clientes, contratos e imóveis para o
          AlugAI.
        </CardDescription>
      </CardHeader>
      <CardContent className="min-h-[300px] flex items-center justify-center text-muted-foreground border-2 border-dashed m-6 mt-0 rounded-xl bg-muted/10 text-sm font-medium">
        Módulo de Importação CSV/Excel em desenvolvimento.
      </CardContent>
    </Card>
  )
}
