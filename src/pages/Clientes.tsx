import { useState, useMemo } from 'react'
import useDataStore from '@/stores/useDataStore'
import { Client } from '@/types'
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
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ClientDetailView } from '@/components/crm/ClientDetailView'
import { cn } from '@/lib/utils'

export default function Clientes() {
  const { clients, db } = useDataStore()
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [healthFilter, setHealthFilter] = useState('Todos')

  const filteredClients = useMemo(() => {
    return clients
      .filter((c) => {
        const matchesSearch =
          (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (c.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (c.document || '').includes(searchTerm)

        let matchesHealth = true
        if (healthFilter === 'Saudável') matchesHealth = c.healthScore >= 80
        if (healthFilter === 'Atenção') matchesHealth = c.healthScore >= 50 && c.healthScore < 80
        if (healthFilter === 'Risco') matchesHealth = c.healthScore < 50

        return matchesSearch && matchesHealth
      })
      .sort((a, b) => a.healthScore - b.healthScore)
  }, [clients, searchTerm, healthFilter])

  const getTrafficLight = (score: number) => {
    if (score >= 80) return 'bg-success'
    if (score >= 50) return 'bg-warning'
    return 'bg-destructive animate-pulse'
  }

  const clientEvents = selectedClient
    ? db.contractEvents.filter((ev) => {
        const contract = db.contracts.find((c) => c.id === ev.contractId)
        return contract?.tenantId === selectedClient.id || contract?.ownerId === selectedClient.id
      })
    : []

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clientes CRM</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie a base relacional e monitore o Health Score dinâmico dos seus clientes.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <Select value={healthFilter} onValueChange={setHealthFilter}>
            <SelectTrigger className="w-full sm:w-[180px] bg-card">
              <SelectValue placeholder="Filtro de Saúde" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Status (Todos)</SelectItem>
              <SelectItem value="Saudável">Saudável (Verde)</SelectItem>
              <SelectItem value="Atenção">Atenção (Amarelo)</SelectItem>
              <SelectItem value="Risco">Em Risco (Vermelho)</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou documento..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome / Documento</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Status Operacional</TableHead>
                <TableHead>Health Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow
                  key={client.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setSelectedClient(client)}
                >
                  <TableCell>
                    <div className="font-medium">{client.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{client.document}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs">
                      {client.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{client.email}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{client.whatsapp}</div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        client.status === 'Ativo'
                          ? 'success'
                          : client.status === 'Em Risco'
                            ? 'destructive'
                            : 'secondary'
                      }
                    >
                      {client.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'w-3.5 h-3.5 rounded-full ring-2 ring-background shadow-sm shrink-0',
                          getTrafficLight(client.healthScore),
                        )}
                        title={`Score: ${client.healthScore}`}
                      />
                      <span className="text-sm font-semibold tracking-tight">
                        {client.healthScore}/100
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredClients.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhum cliente encontrado com os filtros atuais.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Sheet open={!!selectedClient} onOpenChange={(open) => !open && setSelectedClient(null)}>
        <SheetContent className="sm:max-w-md p-0 flex flex-col h-full border-l">
          {selectedClient && <ClientDetailView client={selectedClient} events={clientEvents} />}
        </SheetContent>
      </Sheet>
    </div>
  )
}
