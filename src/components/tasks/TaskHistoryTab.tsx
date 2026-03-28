import { Task } from '@/types'
import { Clock } from 'lucide-react'

export function TaskHistoryTab({ task }: { task: Task }) {
  const history = task.history || []

  return (
    <div className="p-6 space-y-6 animate-in fade-in">
      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
        <Clock className="w-5 h-5 text-muted-foreground" />
        Log de Atividades
      </h3>
      {history.length > 0 ? (
        <div className="relative border-l-2 border-border/60 ml-3 pl-6 space-y-8">
          {history.map((h: any) => (
            <div key={h.id} className="relative">
              <div className="absolute -left-[31px] top-1 w-3 h-3 bg-primary/20 rounded-full ring-4 ring-background border border-primary" />
              <p className="text-xs text-muted-foreground mb-1.5 font-mono">
                {h.date} <span className="font-medium text-foreground mx-1">•</span> {h.user}
              </p>
              <p className="text-sm text-foreground bg-muted/30 p-3.5 rounded-lg border shadow-sm">
                {h.action}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground bg-muted/30 p-8 rounded-lg border border-dashed text-center">
          Nenhum registro no histórico desta tarefa.
        </p>
      )}
    </div>
  )
}
