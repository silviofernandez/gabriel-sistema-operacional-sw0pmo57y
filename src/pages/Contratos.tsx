import { useState } from 'react'
import { db } from '@/lib/mock-data'
import { Contract } from '@/types'
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { EventTimeline } from '@/components/shared/EventTimeline'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Download, Filter, Activity, LogOut, Key } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import useDataStore from '@/stores/useDataStore'

export default function Contratos() {
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null)
  const { toast } = useToast()
  const { db: dataDb, updateContract, createConciergeRecord } = useDataStore()

  const contractEvents = selectedContract
    ? dataDb.contractEvents.filter((ev) => ev.contractId === selectedContract.id)
    : []

  const getClientName = (id: string) => dataDb.clients.find((c) => c.id === id)?.name || 'N/A'
  const getPropertyTitle = (id: string) =>
    dataDb.properties.find((p) => p.id === id)?.title || 'N/A'
  const getUserName = (id?: string) => (id ? dataDb.users.find((u) => u.id === id)?.name : 'N/A')

  const getHealthBadge = (score: number) => {
    if (score >= 80)
      return (
        <Badge variant="success" className="w-20 justify-center">
          Saudável
        </Badge>
      )
    if (score >= 50)
      return (
        <Badge variant="warning" className="w-20 justify-center">
          Atenção
        </Badge>
      )
    return (
      <Badge variant="destructive" className="w-20 justify-center">
        Risco
      </Badge>
    )
  }

  const handleDesocupacao = () => {
    toast({
      title: 'Aviso de Desocupação Registrado',
      description: 'O fluxo de desocupação foi iniciado. Vistoria de saída agendada.',
    })
    setSelectedContract((prev) => (prev ? { ...prev, status: 'Em Desocupação' } : null))
  }

  const handleEntregaChaves = (id: string) => {
    updateContract(id, { keyDeliveryDate: new Date().toLocaleDateString('pt-BR'), status: 'Ativo' })
    createConciergeRecord(id)
    toast({
      title: 'Chaves Entregues',
      description: 'A jornada do Concierge foi iniciada automaticamente e o contrato ativado.',
    })
    setSelectedContract((prev) =>
      prev
        ? { ...prev, keyDeliveryDate: new Date().toLocaleDateString('pt-BR'), status: 'Ativo' }
        : null,
    )
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contratos</h1>
          <p className="text-muted-foreground mt-1">
            Gestão do ciclo de vida dos contratos e visualização de Customer Health.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" /> Filtros
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" /> Exportar
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Locatário (Inquilino)</TableHead>
                <TableHead>Locador (Proprietário)</TableHead>
                <TableHead>Imóvel</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[120px] text-center">Saúde (CS)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dataDb.contracts.map((contract) => (
                <TableRow
                  key={contract.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setSelectedContract(contract)}
                >
                  <TableCell className="font-mono text-xs">{contract.id}</TableCell>
                  <TableCell className="font-medium">{getClientName(contract.tenantId)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {getClientName(contract.ownerId)}
                  </TableCell>
                  <TableCell>{getPropertyTitle(contract.propertyId)}</TableCell>
                  <TableCell>{contract.endDate}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        contract.status === 'Ativo'
                          ? 'outline'
                          : contract.status === 'Em Desocupação'
                            ? 'destructive'
                            : 'secondary'
                      }
                      className={contract.status === 'Ativo' ? 'border-primary text-primary' : ''}
                    >
                      {contract.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {getHealthBadge(contract.healthScore)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Sheet open={!!selectedContract} onOpenChange={(open) => !open && setSelectedContract(null)}>
        <SheetContent className="sm:max-w-md p-0 flex flex-col h-full border-l">
          {selectedContract && (
            <>
              <div className="p-6 border-b bg-muted/10">
                <SheetHeader>
                  <div className="flex items-center justify-between">
                    <SheetTitle className="text-2xl font-mono">{selectedContract.id}</SheetTitle>
                    {getHealthBadge(selectedContract.healthScore)}
                  </div>
                  <SheetDescription>
                    {getPropertyTitle(selectedContract.propertyId)}
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6 grid grid-cols-2 gap-y-4 gap-x-2 text-sm bg-background p-4 rounded-lg border shadow-sm">
                  <div>
                    <span className="text-muted-foreground block text-xs mb-1">Inquilino</span>
                    <span className="font-medium">{getClientName(selectedContract.tenantId)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs mb-1">Proprietário</span>
                    <span className="font-medium">{getClientName(selectedContract.ownerId)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs mb-1">Vigência</span>
                    <span className="font-medium">
                      {selectedContract.startDate} - {selectedContract.endDate}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs mb-1">Aluguel</span>
                    <span className="font-medium text-primary">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(selectedContract.rentValue)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs mb-1">Garantia</span>
                    <span className="font-medium">
                      {selectedContract.guaranteeType || 'N/A'}
                      {selectedContract.guaranteeValue &&
                        ` - R$ ${selectedContract.guaranteeValue}`}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs mb-1">
                      Responsável / Concierge
                    </span>
                    <span className="font-medium">
                      {getUserName(selectedContract.generalResponsibleId)}
                      {selectedContract.conciergeResponsibleId &&
                        ` / ${getUserName(selectedContract.conciergeResponsibleId)}`}
                    </span>
                  </div>
                </div>

                {selectedContract.status !== 'Em Desocupação' &&
                  selectedContract.status !== 'Encerrado' && (
                    <div className="mt-4 flex flex-col gap-2">
                      {!selectedContract.keyDeliveryDate ? (
                        <Button
                          variant="outline"
                          className="w-full border-primary/50 text-primary hover:bg-primary/10"
                          onClick={() => handleEntregaChaves(selectedContract.id)}
                        >
                          <Key className="w-4 h-4 mr-2" />
                          Registrar Entrega de Chaves
                        </Button>
                      ) : (
                        <div className="bg-muted text-muted-foreground p-3 rounded-md text-sm font-medium flex items-center justify-center gap-2 border">
                          <Key className="w-4 h-4" /> Chaves entregues em{' '}
                          {selectedContract.keyDeliveryDate}
                        </div>
                      )}
                      <Button variant="destructive" className="w-full" onClick={handleDesocupacao}>
                        <LogOut className="w-4 h-4 mr-2" />
                        Registrar Aviso de Desocupação
                      </Button>
                    </div>
                  )}
                {selectedContract.status === 'Em Desocupação' && (
                  <div className="mt-4 bg-destructive/10 text-destructive border border-destructive/20 p-3 rounded-md text-sm font-medium text-center">
                    Contrato em processo de desocupação
                  </div>
                )}
              </div>
              <ScrollArea className="flex-1 p-6">
                <h3 className="font-semibold mb-6 text-lg flex items-center gap-2">
                  <Activity className="w-5 h-5 text-muted-foreground" /> Trilha de Eventos
                </h3>
                <EventTimeline events={contractEvents} />
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
