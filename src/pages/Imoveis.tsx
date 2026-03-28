import { db } from '@/lib/mock-data'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin } from 'lucide-react'

export default function Imoveis() {
  const getOwnerName = (ownerId: string) => {
    return db.clients.find((c) => c.id === ownerId)?.name || 'Desconhecido'
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Imóveis</h1>
        <p className="text-muted-foreground mt-1">Repositório de ativos em gestão.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {db.properties.map((imovel) => (
          <Card
            key={imovel.id}
            className="overflow-hidden group cursor-pointer hover:shadow-lg transition-all border-0 ring-1 ring-border"
          >
            <div className="relative h-48 overflow-hidden">
              <img
                src={imovel.image}
                alt={imovel.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-3 left-3 flex gap-2">
                <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm shadow-sm">
                  {imovel.type}
                </Badge>
              </div>
              <div className="absolute top-3 right-3">
                <Badge
                  variant={
                    imovel.status === 'Disponível'
                      ? 'success'
                      : imovel.status === 'Alugado'
                        ? 'secondary'
                        : imovel.status === 'Em Desocupação'
                          ? 'destructive'
                          : 'warning'
                  }
                >
                  {imovel.status}
                </Badge>
              </div>
            </div>
            <CardContent className="p-4">
              <h3 className="font-semibold text-lg line-clamp-1">{imovel.title}</h3>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-1 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {imovel.neighborhood}, {imovel.city}
                {imovel.state && ` - ${imovel.state}`}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 opacity-70 ml-4">
                {imovel.address}
                {imovel.number && `, ${imovel.number}`}
                {imovel.zipCode && ` - ${imovel.zipCode}`}
              </p>
              <div className="mt-4 flex items-center justify-between border-t pt-3">
                <p className="text-primary font-bold">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                    imovel.price,
                  )}
                  <span className="text-xs font-normal text-muted-foreground">/mês</span>
                </p>
                <div className="text-right">
                  <span className="text-[10px] text-muted-foreground block leading-tight">
                    Proprietário
                  </span>
                  <span className="text-xs font-medium leading-tight">
                    {getOwnerName(imovel.ownerId)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
