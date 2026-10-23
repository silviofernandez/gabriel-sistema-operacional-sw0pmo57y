import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Building2, UploadCloud, Trash2, CheckCircle2, ShieldCheck, RefreshCw } from 'lucide-react'
import { useEmpresa } from '@/stores/useEmpresaStore'
import { useToast } from '@/hooks/use-toast'

export function CompanySettings() {
  const { config, logoUrl, salvarConfig, fazerUploadLogo, removerLogo } = useEmpresa()
  const { toast } = useToast()

  const [nomeFantasia, setNomeFantasia] = useState(config?.nome_fantasia || 'Imobiliária Gabriel')
  const [razaoSocial, setRazaoSocial] = useState(
    config?.razao_social || 'Gabriel Negócios Imobiliários Ltda',
  )
  const [cnpj, setCnpj] = useState(config?.cnpj || '45.123.890/0001-12')
  const [telefone, setTelefone] = useState(config?.telefone || '(14) 3622-0000')
  const [email, setEmail] = useState(config?.email || 'atendimento@gabrielimoveis.com.br')
  const [cidade, setCidade] = useState(config?.cidade || 'Jaú / Pederneiras / Lençóis Paulista')
  const [salvando, setSalvando] = useState(false)
  const [enviandoLogo, setEnviandoLogo] = useState(false)

  // Sincronizar quando carregar do backend
  React.useEffect(() => {
    if (config) {
      setNomeFantasia(config.nome_fantasia || 'Imobiliária Gabriel')
      setRazaoSocial(config.razao_social || '')
      setCnpj(config.cnpj || '')
      setTelefone(config.telefone || '')
      setEmail(config.email || '')
      setCidade(config.cidade || '')
    }
  }, [config])

  const handleSalvarDados = async (e: React.FormEvent) => {
    e.preventDefault()
    setSalvando(true)
    try {
      const ok = await salvarConfig({
        nome_fantasia: nomeFantasia,
        razao_social: razaoSocial,
        cnpj,
        telefone,
        email,
        cidade,
      })
      if (ok) {
        toast({
          title: 'Dados atualizados',
          description: 'As informações da Imobiliária Gabriel foram salvas no PocketBase.',
        })
      } else {
        toast({
          title: 'Falha ao salvar',
          description: 'Não foi possível gravar as alterações.',
          variant: 'destructive',
        })
      }
    } finally {
      setSalvando(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo e tamanho (máx 5MB)
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Formato inválido',
        description: 'Selecione uma imagem válida (PNG, JPG, SVG ou WEBP).',
        variant: 'destructive',
      })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: 'O logotipo deve ter no máximo 5MB.',
        variant: 'destructive',
      })
      return
    }

    setEnviandoLogo(true)
    try {
      const ok = await fazerUploadLogo(file)
      if (ok) {
        toast({
          title: 'Logotipo atualizado',
          description:
            'O logotipo oficial da Gabriel foi armazenado no PocketBase e agora está ativo na barra lateral e topo.',
        })
      } else {
        toast({
          title: 'Erro no upload',
          description: 'Não foi possível enviar a imagem para o servidor.',
          variant: 'destructive',
        })
      }
    } finally {
      setEnviandoLogo(false)
    }
  }

  const handleRemoverLogo = async () => {
    const ok = await removerLogo()
    if (ok) {
      toast({
        title: 'Logotipo removido',
        description: 'O sistema voltou a utilizar o ícone padrão da Gabriel.',
      })
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      {/* Bloco 1: Logotipo Oficial */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Building2 className="w-5 h-5 text-primary" /> Logotipo Oficial da Imobiliária Gabriel
          </CardTitle>
          <CardDescription>
            Faça o upload do logotipo oficial da empresa salvo diretamente no PocketBase. Ele será
            exibido no menu lateral (sidebar) e no cabeçalho superior (topbar) do sistema
            operacional.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center gap-6 p-6 border rounded-xl bg-muted/20">
            {/* Visualização do logo atual */}
            <div className="flex flex-col items-center justify-center w-48 h-32 rounded-lg border-2 border-dashed bg-background p-2 text-center relative overflow-hidden shadow-xs">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Logotipo Oficial Gabriel"
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                  <Building2 className="w-8 h-8 mb-1 text-primary/60" />
                  <span className="text-xs font-semibold">Ícone Padrão Ativo</span>
                  <span className="text-[10px]">Sem logo customizada</span>
                </div>
              )}
            </div>

            {/* Ações de upload */}
            <div className="space-y-3 flex-1 text-center sm:text-left">
              <div>
                <h4 className="font-semibold text-sm text-foreground">
                  {logoUrl ? 'Logotipo Personalizado Ativo' : 'Carregar Imagem da Marca'}
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Formatos aceitos: PNG, JPG, SVG ou WEBP (fundo transparente recomendado). Limite
                  de 5MB.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={enviandoLogo}
                  className="relative overflow-hidden cursor-pointer"
                  asChild
                >
                  <label>
                    <UploadCloud className="w-4 h-4 mr-1.5 text-primary" />
                    {enviandoLogo ? 'Enviando...' : logoUrl ? 'Substituir Logo' : 'Fazer Upload'}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml,image/webp"
                      className="sr-only"
                      onChange={handleFileChange}
                      disabled={enviandoLogo}
                    />
                  </label>
                </Button>

                {logoUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoverLogo}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4 mr-1.5" /> Remover Logo
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Integração ativa com o armazenamento em nuvem do Skip Cloud PocketBase</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bloco 2: Dados Institucionais */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Dados Institucionais e Unidades</CardTitle>
          <CardDescription>
            Identificação da imobiliária utilizada em notificações de WhatsApp, e-mails de SLA e
            protocolos oficiais.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSalvarDados} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="nomeFantasia" className="text-xs">
                  Nome Fantasia
                </Label>
                <Input
                  id="nomeFantasia"
                  value={nomeFantasia}
                  onChange={(e) => setNomeFantasia(e.target.value)}
                  placeholder="Imobiliária Gabriel"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="razaoSocial" className="text-xs">
                  Razão Social
                </Label>
                <Input
                  id="razaoSocial"
                  value={razaoSocial}
                  onChange={(e) => setRazaoSocial(e.target.value)}
                  placeholder="Gabriel Negócios Imobiliários Ltda"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cnpj" className="text-xs">
                  CNPJ
                </Label>
                <Input
                  id="cnpj"
                  value={cnpj}
                  onChange={(e) => setCnpj(e.target.value)}
                  placeholder="00.000.000/0001-00"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="telefone" className="text-xs">
                  Telefone / WhatsApp Oficial
                </Label>
                <Input
                  id="telefone"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="(14) 3622-0000"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs">
                  E-mail de Contato Central
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="atendimento@gabrielimoveis.com.br"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cidade" className="text-xs">
                  Unidades de Atendimento
                </Label>
                <Input
                  id="cidade"
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  placeholder="Jaú, Pederneiras, Lençóis Paulista"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button type="submit" disabled={salvando} className="gap-2">
                {salvando ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Salvando...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" /> Salvar Alterações
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
export default CompanySettings
