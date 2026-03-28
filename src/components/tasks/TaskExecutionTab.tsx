import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { FileText, User } from 'lucide-react'

export function TaskExecutionTab({ assignees, localChecklists, toggleChecklist }: any) {
  return (
    <div className="p-6 space-y-8 animate-in fade-in">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-muted-foreground" />
          Checklist de Execução
        </h3>
        {localChecklists && localChecklists.length > 0 ? (
          <div className="space-y-3">
            {localChecklists.map((c: any) => (
              <label
                key={c.id}
                className="flex items-start gap-3 p-3.5 rounded-lg border bg-muted/10 hover:bg-muted/40 cursor-pointer transition-all"
              >
                <Checkbox
                  checked={c.isCompleted}
                  onCheckedChange={() => toggleChecklist(c.id)}
                  className="mt-0.5"
                />
                <div className="flex flex-col gap-1.5 leading-none">
                  <span className="text-sm font-medium text-foreground">{c.description}</span>
                  {c.isMandatory && (
                    <span className="text-[10px] uppercase font-bold text-destructive tracking-wider">
                      Obrigatório
                    </span>
                  )}
                </div>
              </label>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg border border-dashed text-center">
            Nenhum checklist definido para esta tarefa.
          </p>
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-muted-foreground" />
          Responsáveis
        </h3>
        <div className="flex flex-wrap gap-2">
          {assignees && assignees.length > 0 ? (
            assignees.map((user: any) => (
              <Badge
                key={user.id}
                variant="secondary"
                className="px-3 py-1.5 text-sm font-medium bg-background shadow-sm border"
              >
                {user.name}
              </Badge>
            ))
          ) : (
            <span className="text-sm text-muted-foreground">Não atribuído</span>
          )}
        </div>
      </div>
    </div>
  )
}
