import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Task } from '@/types'
import { TaskManagementDetails } from './TaskManagementDetails'
import { TaskManagementComments } from './TaskManagementComments'
import { TaskHistoryTab } from './TaskHistoryTab'
import { Settings, CheckSquare, MessageSquare, History } from 'lucide-react'
import { db } from '@/lib/mock-data'
import { Checkbox } from '@/components/ui/checkbox'

interface Props {
  task: Task | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TaskManagementSheet({ task, open, onOpenChange }: Props) {
  if (!task) return null

  const checklists = db.checklists.filter((c) => c.taskId === task.id)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md md:max-w-xl overflow-hidden p-0 flex flex-col bg-background">
        <SheetHeader className="p-6 pb-4 border-b bg-muted/20 shrink-0">
          <SheetTitle className="text-xl font-bold leading-tight flex items-center gap-2">
            {task.title}
          </SheetTitle>
          <SheetDescription className="text-sm">
            Gestão interativa de tarefa e acompanhamento de SLA.
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="details" className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 border-b shrink-0 bg-card overflow-x-auto no-scrollbar">
            <TabsList className="bg-transparent h-12 w-full justify-start gap-6 min-w-max">
              <TabsTrigger
                value="details"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0"
              >
                <Settings className="w-4 h-4 mr-2" /> Gestão
              </TabsTrigger>
              <TabsTrigger
                value="checklist"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0"
              >
                <CheckSquare className="w-4 h-4 mr-2" /> Checklist
              </TabsTrigger>
              <TabsTrigger
                value="comments"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0"
              >
                <MessageSquare className="w-4 h-4 mr-2" /> Comentários
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0"
              >
                <History className="w-4 h-4 mr-2" /> Histórico
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="details" className="flex-1 overflow-y-auto p-6 m-0">
            <TaskManagementDetails task={task} onClose={() => onOpenChange(false)} />
          </TabsContent>

          <TabsContent value="checklist" className="flex-1 overflow-y-auto p-6 m-0">
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground border-b pb-2">
                Progresso da Execução (Checklist)
              </h4>
              {checklists.length > 0 ? (
                <div className="space-y-3">
                  {checklists.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 p-3 bg-muted/10 border rounded-lg transition-all"
                    >
                      <Checkbox
                        checked={item.isCompleted}
                        disabled
                        className="mt-0.5 opacity-100 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                      />
                      <label
                        className={`text-sm leading-tight flex-1 ${item.isCompleted ? 'text-muted-foreground line-through opacity-70' : 'text-foreground font-medium'}`}
                      >
                        {item.description}
                      </label>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center bg-muted/20 p-6 rounded-xl border border-dashed">
                  Nenhum checklist de verificação associado a esta etapa.
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="comments" className="flex-1 overflow-y-auto p-6 m-0 flex flex-col">
            <TaskManagementComments task={task} />
          </TabsContent>

          <TabsContent value="history" className="flex-1 overflow-y-auto p-6 m-0">
            <TaskHistoryTab task={task} />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
