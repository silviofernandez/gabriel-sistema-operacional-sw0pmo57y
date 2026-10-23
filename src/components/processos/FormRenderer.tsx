import React from 'react'
import { CampoFormularioDef } from '@/types/processos'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Paperclip, Lock, ShieldCheck } from 'lucide-react'

interface FormRendererProps {
  campos: CampoFormularioDef[]
  valores: Record<string, any>
  onChange: (valores: Record<string, any>) => void
  somenteLeitura?: boolean
  tipoForm?: 'interno' | 'externo'
}

export function FormRenderer({
  campos,
  valores,
  onChange,
  somenteLeitura = false,
  tipoForm = 'interno',
}: FormRendererProps) {
  const handleChange = (campoNome: string, valor: any) => {
    if (somenteLeitura) return
    onChange({
      ...valores,
      [campoNome]: valor,
    })
  }

  // Avaliação de exibição condicional
  const isCampoVisivel = (c: CampoFormularioDef): boolean => {
    if (!c.condicao_exibicao) return true
    const { campo, operador, valor } = c.condicao_exibicao
    const valorPai = valores[campo]

    if (operador === 'preenchido') {
      return Boolean(valorPai && String(valorPai).trim().length > 0)
    }
    if (operador === 'igual') {
      return String(valorPai || '').toLowerCase() === String(valor || '').toLowerCase()
    }
    if (operador === 'diferente') {
      return String(valorPai || '').toLowerCase() !== String(valor || '').toLowerCase()
    }
    return true
  }

  const camposVisiveis = campos.filter(isCampoVisivel)

  if (campos.length === 0) {
    return (
      <div className="p-4 border rounded-lg text-center text-xs text-muted-foreground bg-muted/20">
        Nenhum campo definido para este formulário.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {tipoForm === 'externo' && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong>Formulário Externo Seguro:</strong> Link isolado por token único do caso. Dados
            preenchidos são validados diretamente na central.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {camposVisiveis.map((c) => {
          const val = valores[c.nome] ?? ''

          return (
            <div
              key={c.id}
              className={`space-y-1.5 ${
                c.tipo === 'texto' && c.nome.includes('observacao') ? 'md:col-span-2' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-foreground">
                  {c.label} {c.obrigatorio && <span className="text-destructive">*</span>}
                </Label>
                {c.condicao_exibicao && (
                  <Badge variant="outline" className="text-[10px] py-0 h-4">
                    Condicional
                  </Badge>
                )}
              </div>

              {c.tipo === 'selecao' ? (
                <Select
                  value={String(val)}
                  onValueChange={(newVal) => handleChange(c.nome, newVal)}
                  disabled={somenteLeitura}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {c.opcoes?.map((opt) => (
                      <SelectItem key={opt} value={opt} className="text-xs">
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : c.tipo === 'booleano' ? (
                <div className="flex items-center gap-2 pt-1.5">
                  <Switch
                    checked={Boolean(val)}
                    onCheckedChange={(checked) => handleChange(c.nome, checked)}
                    disabled={somenteLeitura}
                  />
                  <span className="text-xs text-muted-foreground">
                    {val ? 'Sim / Confirmado' : 'Não'}
                  </span>
                </div>
              ) : c.tipo === 'anexo' ? (
                <div className="border border-dashed rounded-lg p-3 text-center space-y-1 bg-muted/10">
                  <Paperclip className="w-4 h-4 mx-auto text-muted-foreground" />
                  <span className="text-xs text-muted-foreground block">
                    {val ? `Arquivo anexado: ${val}` : 'Clique para anexar arquivo (PDF ou imagem)'}
                  </span>
                  {!somenteLeitura && (
                    <Input
                      type="file"
                      className="text-xs h-8 cursor-pointer mt-1"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleChange(c.nome, file.name)
                      }}
                    />
                  )}
                </div>
              ) : (
                <Input
                  type={c.tipo === 'numero' ? 'number' : c.tipo === 'data' ? 'date' : 'text'}
                  value={val}
                  onChange={(e) => handleChange(c.nome, e.target.value)}
                  placeholder={
                    c.tipo === 'moeda'
                      ? 'R$ 0,00'
                      : c.tipo === 'cpf_cnpj'
                        ? '000.000.000-00 ou 00.000.000/0001-00'
                        : c.tipo === 'telefone'
                          ? '(00) 00000-0000'
                          : ''
                  }
                  disabled={somenteLeitura}
                  className="h-9 text-xs"
                />
              )}

              {c.ajuda && <p className="text-[10px] text-muted-foreground">{c.ajuda}</p>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
