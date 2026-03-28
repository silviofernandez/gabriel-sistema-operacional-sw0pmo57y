import { db } from '@/lib/mock-data'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { MessageSquare, FileSignature, AlertTriangle } from 'lucide-react'

export default function Renovacoes() {
  const parseDate = (dStr?: string) => {
    if (!dStr) return 0
    const [datePart] = dStr.split(' ') // Handle safely
    const parts = (datePart || '').split('/')
    if (parts.length === 3) {
      return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0])).getTime()
    }
    return 0
  }

  const renewals = db.contracts
    .filter((c) => c.status === 'Renovação Pendente' || c.status === 'Ativo')
    .sort((a, b) => parseDate(a.endDate) - parseDate(b.endDate))
    .slice(0, 5) // Mock logic to just show some upcoming

  const getClientName = (id: string) => db.clients.find((c) => c.id === id)?.name || 'N/A'
  const getPropertyTitle = (id: string) => db.properties.find((p) => p.id === id)?.title || 'N/A'

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pipeline de Renovações</h1>
        <p className="text-muted-foreground mt-1">Contratos a menos de 90 dias do vencimento.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-4">
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Para este mês</p>
              <h3 className="text-2xl font-bold mt-1">12</h3>
            </div>
            <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Em Negociação</p>
              <h3 className="text-2xl font-bold mt-1">8</h3>
            </div>
            <div className="h-12 w-12 bg-warning/10 rounded-full flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-warning" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Renovados (Mês)</p>
              <h3 className="text-2xl font-bold mt-1">15</h3>
            </div>
            <div className="h-12 w-12 bg-success/10 rounded-full flex items-center justify-center">
              <FileSignature className="h-6 w-6 text-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contrato</TableHead>
                <TableHead>Imóvel</TableHead>
                <TableHead>Inquilino</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Valor Atual</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {renewals.map((contract) => (
                <TableRow key={contract.id}>
                  <TableCell className="font-mono text-xs">{contract.id}</TableCell>
                  <TableCell className="font-medium">
                    {getPropertyTitle(contract.propertyId)}
                  </TableCell>
                  <TableCell>{getClientName(contract.tenantId)}</TableCell>
                  <TableCell>
                    <span className="font-medium text-destructive">{contract.endDate}</span>
                  </TableCell>
                  <TableCell>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                      contract.rentValue,
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={contract.status === 'Renovação Pendente' ? 'warning' : 'secondary'}
                    >
                      {contract.status === 'Renovação Pendente' ? 'Em Negociação' : 'A Vencer'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm">
                      Gerar Aditivo
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
