import { AlertTriangle, ShieldCheck } from 'lucide-react'

interface AdjacentBannerProps {
  stageName: string
  stageNumber?: number | string
}

export function AdjacentAccessBanner({ stageName, stageNumber }: AdjacentBannerProps) {
  return (
    <div className="bg-amber-500/15 border-l-4 border-amber-500 text-amber-950 dark:text-amber-200 px-4 py-3 rounded-r-md flex items-center justify-between gap-3 text-sm shadow-sm animate-in fade-in slide-in-from-top-2 duration-300 mb-4">
      <div className="flex items-center gap-2.5">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
        <div>
          <span className="font-semibold">Modo de Leitura Adjacente: </span>
          <span>
            Você está visualizando uma etapa fora do seu escopo (
            {stageNumber ? `${stageNumber}. ` : ''}
            {stageName}).
          </span>
          <span className="block text-xs text-amber-800/80 dark:text-amber-300/80 mt-0.5">
            Os botões de ação e edição estão desabilitados para proteção do fluxo. Esta visualização
            foi automaticamente registrada na trilha de auditoria.
          </span>
        </div>
      </div>
      <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono bg-amber-500/20 px-2 py-1 rounded text-amber-900 dark:text-amber-100 whitespace-nowrap">
        <ShieldCheck className="w-3.5 h-3.5" /> Log Gravado
      </div>
    </div>
  )
}
