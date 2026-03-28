import { CalendarDays } from 'lucide-react'

export function EventTimeline({ events }: { events: any[] }) {
  if (!events || events.length === 0) {
    return (
      <div className="p-8 border border-dashed rounded-xl bg-muted/20 flex flex-col items-center justify-center text-center">
        <p className="text-sm text-muted-foreground">
          Nenhum evento registrado nesta linha do tempo.
        </p>
      </div>
    )
  }

  return (
    <div className="relative border-l-2 border-border/60 ml-4 pl-6 space-y-8 py-2">
      {events.map((ev) => (
        <div key={ev.id} className="relative group">
          <div className="absolute -left-[31px] top-1 w-3 h-3 bg-primary/20 rounded-full ring-4 ring-background border border-primary transition-transform group-hover:scale-125" />
          <div className="flex items-center gap-2 mb-2">
            <CalendarDays className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-mono font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">
              {ev.date}
            </span>
          </div>
          <div className="bg-card border shadow-sm p-4 rounded-xl hover:shadow-md transition-shadow">
            <p className="font-semibold text-[15px] text-foreground leading-tight mb-1.5">
              {ev.title}
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">{ev.description}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
