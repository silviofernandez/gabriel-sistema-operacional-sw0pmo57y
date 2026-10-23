import pb from '@/lib/pocketbase/client'

export interface EmpresaConfig {
  id?: string
  nome_fantasia: string
  razao_social?: string
  cnpj?: string
  telefone?: string
  email?: string
  cidade?: string
  logo?: string
  logo_url?: string
  cor_primaria?: string
}

export const empresaService = {
  async getConfig(): Promise<EmpresaConfig | null> {
    try {
      const records = await pb.collection('configuracoes_empresa').getFullList({
        sort: '-created',
        limit: 1,
      })
      if (records.length > 0) {
        const r = records[0]
        let logoUrl = r.logo_url || ''
        if (r.logo) {
          logoUrl = pb.files.getURL(r, r.logo)
        }
        return {
          id: r.id,
          nome_fantasia: r.nome_fantasia || 'Imobiliária Gabriel',
          razao_social: r.razao_social,
          cnpj: r.cnpj,
          telefone: r.telefone,
          email: r.email,
          cidade: r.cidade,
          logo: r.logo,
          logo_url: logoUrl,
          cor_primaria: r.cor_primaria || '#1e3a8a',
        }
      }
      return null
    } catch (err) {
      console.warn('Erro ao carregar configuracoes_empresa:', err)
      return null
    }
  },

  async updateConfig(id: string, data: Partial<EmpresaConfig>): Promise<EmpresaConfig | null> {
    try {
      const payload: Record<string, any> = { ...data }
      delete payload.id
      delete payload.logo_url // handled dynamically

      const updated = await pb.collection('configuracoes_empresa').update(id, payload)
      let logoUrl = updated.logo_url || ''
      if (updated.logo) {
        logoUrl = pb.files.getURL(updated, updated.logo)
      }
      return {
        id: updated.id,
        nome_fantasia: updated.nome_fantasia,
        razao_social: updated.razao_social,
        cnpj: updated.cnpj,
        telefone: updated.telefone,
        email: updated.email,
        cidade: updated.cidade,
        logo: updated.logo,
        logo_url: logoUrl,
        cor_primaria: updated.cor_primaria,
      }
    } catch (err) {
      console.error('Erro ao atualizar configurações da empresa:', err)
      return null
    }
  },

  async uploadLogo(id: string, file: File): Promise<string | null> {
    try {
      const formData = new FormData()
      formData.append('logo', file)
      const updated = await pb.collection('configuracoes_empresa').update(id, formData)
      if (updated.logo) {
        const logoUrl = pb.files.getURL(updated, updated.logo)
        // Salvar também no campo logo_url para redundância
        await pb.collection('configuracoes_empresa').update(id, { logo_url: logoUrl })
        return logoUrl
      }
      return null
    } catch (err) {
      console.error('Erro ao enviar logo da empresa:', err)
      return null
    }
  },

  async removerLogo(id: string): Promise<boolean> {
    try {
      await pb.collection('configuracoes_empresa').update(id, {
        logo: null,
        logo_url: '',
      })
      return true
    } catch (err) {
      console.error('Erro ao remover logo:', err)
      return false
    }
  },
}
