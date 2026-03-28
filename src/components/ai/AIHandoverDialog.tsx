import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Bot, Copy, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'

export function AIHandoverDialog({ task, open, onOpenChange }: any) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = () => {
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!task) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-indigo-500">
            <Bot className="w-6 h-6" /> Repasse Inteligente (IA)
          </DialogTitle>
          <DialogDescription>
            Resumo gerado por IA estruturando os dados da demanda para envio rápido via WhatsApp ou
            Email.
          </DialogDescription>
        </DialogHeader>
        <div className="bg-slate-900 p-5 rounded-xl border font-mono text-sm text-slate-300 leading-relaxed whitespace-pre-wrap shadow-inner overflow-x-auto">
          {`RESUMO OPERACIONAL - ${task.title}
----------------------------------------
ID da Tarefa: ${task.id}
Urgência (IA): ${task.aiUrgency || 'Normal'}
Prazo Limite: ${task.deadline || 'Não definido'}
Status Atual: ${task.status}

CONTEXTO ANALISADO:
O cliente reportou um problema que exige atenção técnica especializada. O histórico comportamental indica necessidade de priorização para evitar ofensores no NPS.

AÇÃO REQUERIDA (NEXT STEPS):
Favor analisar os anexos vinculados e emitir parecer ou orçamento em até 24h para mantermos o SLA.

> Gerado via AlugAI Copilot`}
        </div>
        <div className="flex justify-end mt-2">
          <Button
            onClick={copyToClipboard}
            className="w-full sm:w-auto bg-indigo-500 hover:bg-indigo-600 text-white shadow-md"
          >
            {copied ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
            {copied ? 'Copiado para Área de Transferência!' : 'Copiar Texto'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
