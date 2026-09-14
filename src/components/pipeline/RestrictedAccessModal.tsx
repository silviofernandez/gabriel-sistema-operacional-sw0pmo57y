import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Lock, ShieldAlert, Send } from 'lucide-react'
import usePipelineAccess from '@/stores/usePipelineAccess'
import { Badge } from '@/components/ui/badge'

export function RestrictedAccessModal() {
  const { restrictedModalState, closeRestrictedModal, requestAccess } = usePipelineAccess()
  const { isOpen, stage } = restrictedModalState
  const [motivo, setMotivo] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!stage) return null

  const handleRequest = async () => {
    setIsSubmitting(true)
    await requestAccess(stage, motivo)
    setIsSubmitting(false)
    setMotivo('')
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeRestrictedModal()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-left space-y-3">
          <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
          <DialogTitle className="text-xl font-bold flex items-center justify-between">
            <span>Acesso Restrito</span>
            <Badge variant="destructive" className="text-xs uppercase">
              Bloqueado
            </Badge>
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
            Você não possui permissão ativa para operar ou visualizar a etapa{' '}
            <strong className="text-foreground">{stage.name}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2 text-xs bg-muted/40 p-3 rounded-lg border">
          <div className="flex items-start gap-2 text-muted-foreground">
            <ShieldAlert className="w-4 h-4 text-warning shrink-0 mt-0.5" />
            <span>
              Qualquer tentativa de navegação fora da sua esteira é registrada na trilha de
              auditoria e visível à gestão.
            </span>
          </div>
          <p className="text-muted-foreground">
            Caso precise cobrir um colega ou realizar uma operação urgente nesta etapa, envie uma
            solicitação formal para liberação temporária pelo gestor:
          </p>
          <Textarea
            placeholder="Descreva o motivo da solicitação de acesso emergencial..."
            className="text-xs min-h-[70px] bg-background"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
          />
        </div>

        <DialogFooter className="flex flex-row justify-end gap-2 sm:gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={closeRestrictedModal}
            disabled={isSubmitting}
          >
            Fechar
          </Button>
          <Button
            size="sm"
            variant="default"
            className="gap-1.5"
            onClick={handleRequest}
            disabled={isSubmitting}
          >
            <Send className="w-3.5 h-3.5" />
            {isSubmitting ? 'Enviando...' : 'Solicitar Acesso ao Gestor'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
