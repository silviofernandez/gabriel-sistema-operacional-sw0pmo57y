import React, { useState } from 'react'
import { Plus, Trash2, Sliders, CheckCircle2 } from 'lucide-react'
import { CampoFormularioDef } from '@/types/processos'
import { Button } from '@/components/ui/button'
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
import { Badge } from '@/components/ui/badge'

interface FormBuilderProps {
  campos: CampoFormularioDef[]
  onChange: (campos: CampoFormularioDef[]) => void
}

export function FormBuilder({ campos, onChange }: FormBuilderProps) {
  const [novoCampo, setNovoCampo] = useState<Partial<CampoFormularioDef>>({
    label: '',
    tipo: 'texto',
    obrigatorio: false,
    opcoes: [],
  })
  const [opcoesStr, setOpcoesStr] = useState('')
  const [condicaoHabilitada, setCondicaoHabilitada] = useState(false)
  const [condicaoCampo, setCondicaoCampo] = useState('')
  const [condicaoOperador, setCondicaoOperador] = useState<'igual' | 'diferente' | 'preenchido'>(
    'igual',
  )
  const [condicaoValor, setCondicaoValor] = useState('')

  const handleAddCampo = () => {
    if (!novoCampo.label?.trim()) return

    const id = `campo_${Date.now()}`
    const nome = novoCampo.label
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '_')

    const field: CampoFormularioDef = {
      id,
      nome,
      label: novoCampo.label.trim(),
      tipo: novoCampo.tipo || 'texto',
      obrigatorio: !!novoCampo.obrigatorio,
      opcoes:
        novoCampo.tipo === 'selecao' || novoCampo.tipo === 'multipla_selecao'
          ? opcoesStr
              .split(',')
              .map((o) => o.trim())
              .filter(Boolean)
          : undefined,
      condicao_exibicao:
        condicaoHabilitada && condicaoCampo
          ? {
              campo: condicaoCampo,
              operador: condicaoOperador,
              valor: condicaoValor,
            }
          : undefined,
    }

    onChange([...campos, field])
    setNovoCampo({ label: '', tipo: 'texto', obrigatorio: false })
    setOpcoesStr('')
    setCondicaoHabilitada(false)
    setCondicaoCampo('')
    setCondicaoValor('')
  }

  const handleRemoveCampo = (id: string) => {
    onChange(campos.filter((c) => c.id !== id))
  }

  return (
    <div className="space-y-4 text-xs">
      {/* Lista de campos existentes */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Campos Configurados ({campos.length})
        </Label>
        {campos.length === 0 ? (
          <div className="p-4 border border-dashed rounded-lg text-center text-muted-foreground text-xs">
            Nenhum campo configurado para este formulário ainda.
          </div>
        ) : (
          <div className="grid gap-2">
            {campos.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between p-2.5 rounded-lg border bg-muted/20 text-xs"
              >
                <div className="space-y-0.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-foreground">{c.label}</span>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {c.tipo}
                    </Badge>
                    {c.obrigatorio && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] bg-amber-500/10 text-amber-800"
                      >
                        Obrigatório
                      </Badge>
                    )}
                    {c.condicao_exibicao && (
                      <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-700">
                        Condicional ({c.condicao_exibicao.campo} {c.condicao_exibicao.operador}{' '}
                        {c.condicao_exibicao.valor})
                      </Badge>
                    )}
                  </div>
                  {c.opcoes && c.opcoes.length > 0 && (
                    <span className="text-[11px] text-muted-foreground block truncate">
                      Opções: {c.opcoes.join(', ')}
                    </span>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive"
                  onClick={() => handleRemoveCampo(c.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Formulário para adicionar novo campo */}
      <div className="p-3.5 rounded-xl border bg-card space-y-3">
        <span className="font-semibold text-xs text-foreground block">
          Adicionar Novo Campo ao Formulário
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Rótulo / Pergunta *</Label>
            <Input
              value={novoCampo.label}
              onChange={(e) => setNovoCampo({ ...novoCampo, label: e.target.value })}
              placeholder="Ex: CPF ou CNPJ do Locatário"
              className="h-8 text-xs"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Tipo de Entrada</Label>
            <Select
              value={novoCampo.tipo}
              onValueChange={(val: any) => setNovoCampo({ ...novoCampo, tipo: val })}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="texto">Texto Curto</SelectItem>
                <SelectItem value="cpf_cnpj">CPF ou CNPJ (com máscara)</SelectItem>
                <SelectItem value="telefone">Telefone / WhatsApp</SelectItem>
                <SelectItem value="email">E-mail</SelectItem>
                <SelectItem value="moeda">Valor em Moeda (R$)</SelectItem>
                <SelectItem value="numero">Número</SelectItem>
                <SelectItem value="data">Data</SelectItem>
                <SelectItem value="selecao">Seleção Única (Dropdown)</SelectItem>
                <SelectItem value="anexo">Anexo de Documento / Foto</SelectItem>
                <SelectItem value="booleano">Sim / Não (Checkbox)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {(novoCampo.tipo === 'selecao' || novoCampo.tipo === 'multipla_selecao') && (
          <div className="space-y-1">
            <Label className="text-xs">Opções (separadas por vírgula)</Label>
            <Input
              value={opcoesStr}
              onChange={(e) => setOpcoesStr(e.target.value)}
              placeholder="Ex: Pessoa Física, Pessoa Jurídica"
              className="h-8 text-xs"
            />
          </div>
        )}

        <div className="flex items-center gap-2 pt-1">
          <Switch
            checked={!!novoCampo.obrigatorio}
            onCheckedChange={(chk) => setNovoCampo({ ...novoCampo, obrigatorio: chk })}
            id="chk-obrig"
          />
          <Label htmlFor="chk-obrig" className="text-xs cursor-pointer">
            Campo Obrigatório (impede envio se vazio)
          </Label>
        </div>

        {/* Lógica Condicional */}
        <div className="pt-2 border-t space-y-2">
          <div className="flex items-center gap-2">
            <Switch
              checked={condicaoHabilitada}
              onCheckedChange={setCondicaoHabilitada}
              id="chk-cond"
            />
            <Label htmlFor="chk-cond" className="text-xs font-semibold cursor-pointer">
              Exibir este campo apenas sob condição (Ex: Se Tipo = Pessoa Jurídica)
            </Label>
          </div>

          {condicaoHabilitada && (
            <div className="grid grid-cols-3 gap-2 bg-muted/30 p-2.5 rounded-lg">
              <div>
                <Label className="text-[10px]">Depende do campo:</Label>
                <Select value={condicaoCampo} onValueChange={setCondicaoCampo}>
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue placeholder="Escolha" />
                  </SelectTrigger>
                  <SelectContent>
                    {campos.map((c) => (
                      <SelectItem key={c.nome} value={c.nome}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-[10px]">Regra:</Label>
                <Select value={condicaoOperador} onValueChange={(v: any) => setCondicaoOperador(v)}>
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="igual">Igual a</SelectItem>
                    <SelectItem value="diferente">Diferente de</SelectItem>
                    <SelectItem value="preenchido">Está preenchido</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-[10px]">Valor esperado:</Label>
                <Input
                  value={condicaoValor}
                  onChange={(e) => setCondicaoValor(e.target.value)}
                  placeholder="Ex: Pessoa Jurídica"
                  className="h-7 text-xs"
                />
              </div>
            </div>
          )}
        </div>

        <Button
          type="button"
          size="sm"
          onClick={handleAddCampo}
          disabled={!novoCampo.label?.trim()}
          className="w-full gap-1.5 text-xs h-8"
        >
          <Plus className="w-3.5 h-3.5" /> Adicionar Campo ao Formulário
        </Button>
      </div>
    </div>
  )
}
