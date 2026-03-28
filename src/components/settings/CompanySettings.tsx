import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Settings } from 'lucide-react'

export function CompanySettings() {
  return (
    <Card className="animate-in fade-in zoom-in-95 duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Settings className="w-6 h-6 text-primary" /> Identidade & Empresa
        </CardTitle>
        <CardDescription>
          Gerencie o logotipo, CNPJ, dados de faturamento e chaves de API externas da sua
          imobiliária.
        </CardDescription>
      </CardHeader>
      <CardContent className="min-h-[300px] flex items-center justify-center text-muted-foreground border-2 border-dashed m-6 mt-0 rounded-xl bg-muted/10 text-sm font-medium">
        Configurações Organizacionais em desenvolvimento.
      </CardContent>
    </Card>
  )
}
