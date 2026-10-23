import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sparkles, Bot, CheckCircle2, ShieldCheck, Cpu, Database } from 'lucide-react'
import { pb } from '@/lib/pocketbase/client'
import { useToast } from '@/hooks/use-toast'

export function AIControlPanel() {
  const { toast } = useToast()
  const [testMessage, setTestMessage] = useState('Resuma as pendências do caso GAB-LOC-001')
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)

  const handleTestChat = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const data: any = await pb.send('/backend/v1/gabriel-ai/chat', {
        method: 'POST',
        body: { message: testMessage },
      })
      setTestResult(data.content)
      toast({
        title: 'IA Conectada',
        description: 'Resposta obtida com sucesso do agente gabriel-copilot.',
      })
    } catch (err: any) {
      setTestResult(err.message || 'Aguardando configuração de credenciais no servidor.')
      toast({
        title: 'Status: Aguardando configuração',
        description: err.message || 'Configuração pendente de chave de IA.',
        variant: 'default',
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" /> Gabriel Copilot (Agente Nativo Skip
            Cloud)
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configuração e monitoramento do assistente operacional de processos imobiliários da
            Gabriel.
          </p>
        </div>
        <Badge variant="outline" className="bg-purple-500/10 text-purple-800 border-purple-500/30">
          Native AI Agent: gabriel-copilot
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              Status do Motor
              <Cpu className="w-4 h-4 text-purple-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-emerald-600 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Ativo & Vinculado
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Definido nativamente via migration no Skip Cloud com memória operacional.
            </p>
          </CardContent>
        </Card>

        <Card className="border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              Acesso a Dados
              <Database className="w-4 h-4 text-blue-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-foreground">5 Coleções</div>
            <p className="text-xs text-muted-foreground mt-1">
              casos_processos, atividades_casos, modelos, comentarios, configs.
            </p>
          </CardContent>
        </Card>

        <Card className="border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              Segurança & Permissão
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-foreground">RBAC / Servidor</div>
            <p className="text-xs text-muted-foreground mt-1">
              Respostas distinguem dados confirmados de estimativas.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Bot className="w-4 h-4 text-purple-600" /> Teste de Interação Operacional
          </CardTitle>
          <CardDescription className="text-xs">
            Envie uma consulta ao agente gabriel-copilot para validar a leitura dos processos em
            tempo real.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Mensagem de Consulta</Label>
            <div className="flex gap-2">
              <Input
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="Digite a solicitação para o Copilot..."
                className="text-xs"
              />
              <Button
                size="sm"
                onClick={handleTestChat}
                disabled={testing}
                className="bg-purple-600 hover:bg-purple-700 text-white shrink-0"
              >
                {testing ? 'Consultando...' : 'Consultar Agente'}
              </Button>
            </div>
          </div>

          {testResult && (
            <div className="p-3.5 rounded-lg border bg-muted/30 text-xs space-y-1">
              <span className="font-semibold text-foreground block">Retorno do Assistente:</span>
              <p className="text-muted-foreground whitespace-pre-wrap">{testResult}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
