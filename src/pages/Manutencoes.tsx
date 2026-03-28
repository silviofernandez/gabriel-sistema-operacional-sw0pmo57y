import { useMemo } from 'react'
import useDataStore from '@/stores/useDataStore'
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
import { ShieldAlert, MoreHorizontal, CheckCircle2, Scale, PlayCircle } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'

export default function Manutencoes() {
  const { toast } = useToast()
  const { db: dataDb, completeMaintenance } = useDataStore()
  const maintenances = dataDb.maintenances

  const getPropertyTitle = (id: string) =>
    dataDb.properties.find((p) => p.id === id)?.title || 'N/A'

  const handleAction = (id: string, action: string) => {
    if (action === 'cobranca') {
      toast({
        title: 'Processo de Cobrança Iniciado',
        description: 'Departamento jurídico notificado sobre a recusa de pagamento.',
        variant: 'destructive',
      })
    } else if (action === 'aprovar') {
      toast({
        title: 'Orçamento Aprovado',
        description: 'Manutenção movida para execução.',
      })
    } else if (action === 'concluir') {
      completeMaintenance(id)
      const target = maintenances.find((m) => m.id === id)

      toast({
        title: 'Manutenção Concluída',
        description:
          'Automação ativada: Link de pesquisa de satisfação (NPS) enviado para o cliente.',
        action: (
          <a
            href={`/feedback?clientId=${target?.requesterId}&ticketId=${id}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-8 items-center justify-center rounded-md border border-primary/50 bg-primary/10 px-3 text-xs font-semibold text-primary ring-offset-background transition-colors hover:bg-primary hover:text-primary-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            Responder NPS
          </a>
        ),
        duration: 10000,
      })
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Manutenções & Reparos</h1>
        <p className="text-muted-foreground mt-1">
          Registro de ordens de serviço, rateio de custos e chamados técnicos.
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Imóvel</TableHead>
                <TableHead>Pagador</TableHead>
                <TableHead>Responsável (Profissional)</TableHead>
                <TableHead>Custo</TableHead>
                <TableHead>Data de Abertura</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {maintenances.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-mono text-xs">{m.id}</TableCell>
                  <TableCell className="font-medium">{m.description}</TableCell>
                  <TableCell>{getPropertyTitle(m.propertyId)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs bg-muted/50">
                      {m.payer || 'A definir'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {m.assignedProfessional || 'Não atribuído'}
                  </TableCell>
                  <TableCell className="font-medium text-primary">
                    {m.cost
                      ? new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(m.cost)
                      : '-'}
                  </TableCell>
                  <TableCell>{m.reportedDate}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        m.status === 'Concluído'
                          ? 'success'
                          : m.status === 'Em Execução'
                            ? 'default'
                            : m.status === 'Em Orçamento'
                              ? 'warning'
                              : 'secondary'
                      }
                    >
                      {m.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Ações da O.S.</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {m.status === 'Em Orçamento' && (
                          <DropdownMenuItem onClick={() => handleAction(m.id, 'aprovar')}>
                            <PlayCircle className="mr-2 h-4 w-4 text-primary" />
                            Aprovar Orçamento
                          </DropdownMenuItem>
                        )}
                        {m.status === 'Em Execução' && (
                          <DropdownMenuItem onClick={() => handleAction(m.id, 'concluir')}>
                            <CheckCircle2 className="mr-2 h-4 w-4 text-success" />
                            Marcar como Concluído
                          </DropdownMenuItem>
                        )}
                        {m.status !== 'Concluído' && (
                          <DropdownMenuItem>
                            <Scale className="mr-2 h-4 w-4" />
                            Ajustar Rateio
                          </DropdownMenuItem>
                        )}
                        {m.payer === 'Inquilino' && m.status !== 'Concluído' && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:bg-destructive/10"
                              onClick={() => handleAction(m.id, 'cobranca')}
                            >
                              <ShieldAlert className="mr-2 h-4 w-4" />
                              Iniciar Cobrança
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
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
