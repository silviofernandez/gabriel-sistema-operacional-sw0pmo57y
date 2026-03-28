import { Task } from '@/types'
import { MessageSquare } from 'lucide-react'

export function TaskManagementComments({ task }: { task: Task }) {
  const comments = task.comments || []

  return (
    <div className="space-y-6 animate-in fade-in">
      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-muted-foreground" />
        Comentários da Equipe
      </h3>
      {comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((c: any) => (
            <div key={c.id} className="p-4 bg-muted/20 rounded-xl border shadow-sm relative">
              <div className="flex items-center justify-between mb-3 border-b pb-2">
                <span className="font-semibold text-sm text-foreground">{c.author}</span>
                <span className="text-xs text-muted-foreground font-mono bg-background px-2 py-0.5 rounded border">
                  {c.date}
                </span>
              </div>
              <p className="text-sm text-foreground/90 leading-relaxed">{c.text}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground bg-muted/30 p-8 rounded-lg border border-dashed text-center">
          Nenhum comentário registrado. Use esta seção para alinhar pendências da demanda.
        </p>
      )}
    </div>
  )
}
