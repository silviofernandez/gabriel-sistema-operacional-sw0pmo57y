import React from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GitBranch, ArrowRight, Layers, Sliders, CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useProcessos } from '@/stores/useProcessosStore'

export function WorkflowConfigurator() {
  const { modelos } = useProcessos()

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-primary" /> Modelos & Regras dos Processos
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gerenciamento de versões, fases, checklists e matriz de execução dos fluxos de trabalho.
          </p>
        </div>

        <Button asChild size="sm" className="gap-2">
          <Link to="/processos">
            Abrir Construtor de Processos <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-4">
        {modelos.map((mod) => (
          <Card key={mod.id} className="border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary" /> {mod.nome}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    v{mod.versao_atual}
                  </Badge>
                  <Badge
                    variant={mod.publicado_em ? 'default' : 'secondary'}
                    className={mod.publicado_em ? 'bg-emerald-600 text-xs' : 'text-xs'}
                  >
                    {mod.publicado_em ? 'Publicado' : 'Rascunho'}
                  </Badge>
                </div>
              </div>
              <CardDescription className="text-xs text-muted-foreground">
                {mod.descricao}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3 text-xs">
              <div className="flex flex-wrap gap-2">
                {mod.fases.map((f, idx) => (
                  <Badge
                    key={f.id}
                    variant="outline"
                    className="text-[11px] bg-muted/40 font-medium py-1 px-2.5"
                  >
                    {idx + 1}. {f.nome} ({f.atividades.length} ativ.)
                  </Badge>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2 border-t text-[11px] text-muted-foreground">
                <span>
                  Código: <strong className="font-mono">{mod.codigo}</strong>
                </span>
                <span>{mod.fases.length} Fases estruturadas</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
