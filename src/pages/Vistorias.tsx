import { useState } from 'react'
import { db } from '@/lib/mock-data'
import { Inspection } from '@/types'
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
import { FileText, SplitSquareHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { InspectionCompareDialog } from '@/components/inspections/InspectionCompareDialog'

export default function Vistorias() {
  const [selectedCompare, setSelectedCompare] = useState<Inspection | null>(null)

  const getPropertyTitle = (id: string) => db.properties.find((p) => p.id === id)?.title || 'N/A'
  const getInspectorName = (id: string) => db.users.find((u) => u.id === id)?.name || 'N/A'

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Vistorias</h1>
        <p className="text-muted-foreground mt-1">Laudos de inspeção estrutural, rotina e saída.</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Imóvel</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Vistoriador</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {db.inspections.map((i) => (
                <TableRow key={i.id}>
                  <TableCell className="font-mono text-xs">{i.id}</TableCell>
                  <TableCell className="font-medium">{getPropertyTitle(i.propertyId)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{i.type}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {getInspectorName(i.inspectorId)}
                  </TableCell>
                  <TableCell>{i.date}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        i.status === 'Concluída'
                          ? 'success'
                          : i.status === 'Agendada'
                            ? 'warning'
                            : 'secondary'
                      }
                    >
                      {i.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right flex items-center justify-end gap-2">
                    {i.type === 'Saída' && i.entryPhotoUrl && (
                      <Button variant="outline" size="sm" onClick={() => setSelectedCompare(i)}>
                        <SplitSquareHorizontal className="h-4 w-4 mr-2" /> Comparar
                      </Button>
                    )}
                    {i.reportUrl ? (
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Ver Laudo">
                        <FileText className="h-4 w-4 text-primary" />
                      </Button>
                    ) : (
                      <span className="text-muted-foreground text-xs italic w-8 text-center">
                        Pendente
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <InspectionCompareDialog
        open={!!selectedCompare}
        onOpenChange={(open) => !open && setSelectedCompare(null)}
        inspection={selectedCompare}
      />
    </div>
  )
}
