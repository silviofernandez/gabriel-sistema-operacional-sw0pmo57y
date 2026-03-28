import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { FileSearch } from 'lucide-react'

export function InspectionCompareDialog({ inspection, open, onOpenChange }: any) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col">
        <DialogHeader className="shrink-0 border-b pb-4">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileSearch className="w-6 h-6 text-primary" />
            Comparador de Vistorias (Entrada vs Saída)
          </DialogTitle>
          <DialogDescription className="text-base">
            Análise lado a lado das fotos de entrada e saída para facilitar a identificação de danos
            e gerar o relatório final.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0 mt-4 overflow-hidden">
          <div className="border rounded-xl bg-card flex flex-col overflow-hidden shadow-sm">
            <div className="p-3 border-b bg-muted/50 font-semibold text-sm flex items-center justify-between">
              <span>Vistoria de Entrada (Referência)</span>
            </div>
            <div className="flex-1 p-4 flex items-center justify-center bg-muted/10 overflow-hidden">
              {inspection?.entryPhotoUrl ? (
                <img
                  src={inspection.entryPhotoUrl}
                  alt="Foto Entrada"
                  className="max-h-full w-full object-contain rounded-md"
                />
              ) : (
                <span className="text-muted-foreground text-sm flex flex-col items-center">
                  Não há registros fotográficos de entrada vinculados.
                </span>
              )}
            </div>
          </div>
          <div className="border border-warning/30 rounded-xl bg-card flex flex-col overflow-hidden shadow-sm">
            <div className="p-3 border-b bg-warning/10 font-semibold text-sm text-warning-foreground flex items-center justify-between">
              <span>Vistoria de Saída (Atual)</span>
              <span className="text-[10px] uppercase font-bold bg-background px-2 py-0.5 rounded border border-warning/20 text-warning">
                Aguardando Fotos
              </span>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center border-dashed border-2 m-6 rounded-xl border-border/50 text-muted-foreground bg-muted/5 gap-3">
              <FileSearch className="w-10 h-10 opacity-20" />
              <p className="text-sm font-medium">As fotos de saída ainda não foram carregadas.</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
