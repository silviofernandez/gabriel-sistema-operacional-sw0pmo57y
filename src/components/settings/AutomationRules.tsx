import React from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Zap, MessageSquare, FileCheck2, Database, ShieldAlert, CheckCircle2 } from 'lucide-react'

export function AutomationRules() {
  const automacoes = [
    {
      id: 'auto_1',
      nome: 'Disparo de WhatsApp para Aceite de Proposta',
      tipo: 'WhatsApp API Oficial (Meta / Z-API / Gupshup)',
      status: 'Aguardando configuração' as const,
      gatilho: 'Entrada na fase "Formalização e aceite"',
      descricao:
        'Envia formulário interativo de aceite ao locatário e proprietário com link pré-preenchido seguro.',
      fallback: 'Encaminhamento automático para envio manual por operador na esteira.',
    },
    {
      id: 'auto_2',
      nome: 'Consulta de Score e Restrição CPF (Serasa / Boa Vista)',
      tipo: 'Bureau de Crédito API',
      status: 'Aguardando configuração' as const,
      gatilho: 'Entrada na fase "Documentação e análise"',
      descricao:
        'Consulta automática de pontuação de crédito do proponente e alerta sobre restrições judiciais ou protestos.',
      fallback: 'Operador realiza consulta manual no portal do bureau e anexa o PDF.',
    },
    {
      id: 'auto_3',
      nome: 'Sincronização e Cadastro no ERP Superlógica Imobi',
      tipo: 'Superlógica Marketplace / API V1',
      status: 'Aguardando configuração' as const,
      gatilho: 'Entrada na fase "Cadastro no ERP"',
      descricao:
        'Cadastra/atualiza proprietário, inquilino, fiador e cria a pasta do imóvel no ERP imobiliário.',
      fallback: 'Operador preenche a ficha no ERP e confirma o código gerado no card da Gabriel.',
    },
    {
      id: 'auto_4',
      nome: 'Envio para Assinatura Eletrônica (Clicksign / DocuSign)',
      tipo: 'Plataforma de Assinatura Digital',
      status: 'Aguardando configuração' as const,
      gatilho: 'Aprovação jurídica da minuta de contrato de locação',
      descricao:
        'Cria o envelope de signatários, envia chaves por WhatsApp/e-mail e aguarda webhook de assinatura concluída.',
      fallback: 'Operador sobe a minuta diretamente na plataforma e insere link de acompanhamento.',
    },
    {
      id: 'auto_5',
      nome: 'Abertura de Card de Vistoria de Entrada',
      tipo: 'Regra Interna do Servidor (PocketBase Hooks)',
      status: 'Confirmada' as const,
      gatilho: 'Conclusão da assinatura ou cadastro no ERP',
      descricao:
        'Gera automaticamente o card na esteira de Vistorias com checklist vinculado ao imóvel.',
      fallback: 'Nenhum; automação interna 100% ativa no servidor.',
    },
  ]

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" /> Automações & Conectores Operacionais
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Estado real das automações da esteira. Ações sem credenciais ativas operam com fallback
            humano seguro.
          </p>
        </div>
        <Badge variant="outline" className="bg-amber-500/10 text-amber-800 border-amber-500/30">
          Modo Transparente (Sem Simulação)
        </Badge>
      </div>

      <div className="grid gap-4">
        {automacoes.map((item) => (
          <Card key={item.id} className="border">
            <CardHeader className="pb-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                  {item.status === 'Confirmada' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                  )}
                  {item.nome}
                </CardTitle>
                <Badge
                  variant={item.status === 'Confirmada' ? 'default' : 'outline'}
                  className={
                    item.status === 'Confirmada'
                      ? 'bg-emerald-600 text-white text-xs'
                      : 'bg-amber-500/10 text-amber-800 border-amber-500/30 text-xs'
                  }
                >
                  {item.status}
                </Badge>
              </div>
              <CardDescription className="text-xs text-muted-foreground font-mono">
                Conector: {item.tipo} · Gatilho: {item.gatilho}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-2 text-xs">
              <p className="text-foreground">{item.descricao}</p>
              <div className="p-2.5 rounded-lg bg-muted/30 border text-[11px] text-muted-foreground">
                <strong className="text-foreground">Comportamento Operacional: </strong>
                {item.fallback}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
