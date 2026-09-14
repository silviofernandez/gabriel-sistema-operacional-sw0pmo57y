import { useState, useEffect, useCallback } from 'react'
import { db } from '@/lib/mock-data'

export interface ContratoLocacao {
  id: string
  tenant_id: string | null
  owner_id: string | null
  property_id: string | null
  contract_number: string | null
  start_date: string
  end_date: string | null
  is_indefinite: boolean
  rent_value: number
  rent_due_day: number | null
  admin_fee_percent: number | null
  admin_fee_value: number | null
  guarantee_type: string | null
  guarantee_value: number | null
  guarantee_details: string | null
  readjust_index: string
  readjust_month: number | null
  last_readjust_date: string | null
  next_readjust_date: string | null
  key_delivery_date: string | null
  key_return_date: string | null
  status: string
  health_score: number
  general_responsible_id: string | null
  concierge_responsible_id: string | null
  first_rent_date: string | null
  deposit_value: number | null
  condominium_value: number | null
  iptu_value: number | null
  insurance_value: number | null
  legacy_id: string | null
  notes: string | null
  attachments: string[] | null
  extra_fields: Record<string, unknown> | null
  created_at: string
  updated_at: string
  tipo?: 'locacao' | 'prestacao_servico'
  nome_parte?: string
  cpf_cnpj?: string
  imovel_endereco?: string
  unidade?: string
  arquivo_nome?: string
  data_assinatura?: string
}

export interface ContratoUploadData {
  tipo: string
  nome_parte: string
  cpf_cnpj: string
  imovel: string
  unidade: string
  valor_aluguel: string | number
  indice_reajuste: string
  data_assinatura: string
  data_inicio: string
  data_fim: string
}

function diasParaVencimento(dataFim: string | null): number {
  if (!dataFim) return 365
  const fim = new Date(dataFim + 'T00:00:00')
  const hoje = new Date()
  return Math.round((fim.getTime() - hoje.getTime()) / 86400000)
}

export default function useContratos() {
  const [contratos, setContratos] = useState<ContratoLocacao[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchContratos = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const saved = localStorage.getItem('alugai_contratos')
      if (saved) {
        const parsed = JSON.parse(saved)
        setContratos(parsed)
      } else {
        // Inicializar com contratos mockados
        const mockContratos: ContratoLocacao[] = db.contracts.map((c) => {
          const tenant = db.clients.find((cl) => cl.id === c.tenantId)
          const property = db.properties.find((p) => p.id === c.propertyId)
          return {
            id: c.id,
            tenant_id: c.tenantId,
            owner_id: c.ownerId,
            property_id: c.propertyId,
            contract_number: c.id,
            start_date: c.startDate ? c.startDate.split('/').reverse().join('-') : '2023-10-12',
            end_date: c.endDate ? c.endDate.split('/').reverse().join('-') : '2025-10-12',
            is_indefinite: false,
            rent_value: c.rentValue,
            rent_due_day: c.rentDueDate || 5,
            admin_fee_percent: 10,
            admin_fee_value: c.rentValue * 0.1,
            guarantee_type: c.guaranteeType || 'Caução',
            guarantee_value: c.guaranteeValue || null,
            guarantee_details: null,
            readjust_index: 'IGPM',
            readjust_month: null,
            last_readjust_date: null,
            next_readjust_date: null,
            key_delivery_date: c.keyDeliveryDate
              ? c.keyDeliveryDate.split('/').reverse().join('-')
              : null,
            key_return_date: null,
            status: c.status === 'Ativo' ? 'Ativo' : 'Encerrado',
            health_score: c.healthScore || 100,
            general_responsible_id: c.generalResponsibleId || null,
            concierge_responsible_id: c.conciergeResponsibleId || null,
            first_rent_date: null,
            deposit_value: null,
            condominium_value: 450,
            iptu_value: 120,
            insurance_value: 45,
            legacy_id: null,
            notes: null,
            attachments: ['contratos/' + c.id + '/contrato_assinado.pdf'],
            extra_fields: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            tipo: 'locacao',
            nome_parte: tenant?.name || 'Inquilino AlugAI',
            cpf_cnpj: tenant?.document || '123.456.789-00',
            imovel_endereco: property?.address
              ? `${property.address}, ${property.number || ''}`
              : 'Endereço Imóvel',
            unidade: property?.neighborhood || 'Jaú Locação',
            arquivo_nome: 'contrato_assinado.pdf',
            data_assinatura: c.startDate
              ? c.startDate.split('/').reverse().join('-')
              : '2023-10-12',
          }
        })
        setContratos(mockContratos)
        localStorage.setItem('alugai_contratos', JSON.stringify(mockContratos))
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar contratos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchContratos()
  }, [fetchContratos])

  const uploadDocumento = useCallback(async (file: File, contratoId: string) => {
    const ext = file.name.split('.').pop()
    const path = `contratos/${contratoId}/${Date.now()}.${ext}`
    return path
  }, [])

  const getDocumentoUrl = useCallback(async (_path: string) => {
    // Return sample PDF view or download URL
    return 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
  }, [])

  const criarContrato = useCallback(
    async (dados: ContratoUploadData, arquivo?: File) => {
      const rentValue =
        typeof dados.valor_aluguel === 'string'
          ? parseFloat(dados.valor_aluguel.replace(',', '.'))
          : dados.valor_aluguel

      const newId = `CTR-${String(Date.now()).slice(-4)}`
      const storagePath = arquivo ? await uploadDocumento(arquivo, newId) : null

      const novoContrato: ContratoLocacao = {
        id: newId,
        tenant_id: null,
        owner_id: null,
        property_id: null,
        contract_number: newId,
        start_date: dados.data_inicio || new Date().toISOString().slice(0, 10),
        end_date: dados.data_fim || null,
        is_indefinite: !dados.data_fim,
        rent_value: Number(rentValue) || 0,
        rent_due_day: 5,
        admin_fee_percent: 10,
        admin_fee_value: (Number(rentValue) || 0) * 0.1,
        guarantee_type: 'Caução',
        guarantee_value: null,
        guarantee_details: null,
        readjust_index: dados.indice_reajuste || 'IGPM',
        readjust_month: null,
        last_readjust_date: null,
        next_readjust_date: null,
        key_delivery_date: null,
        key_return_date: null,
        status: 'Ativo',
        health_score: 100,
        general_responsible_id: 'u2',
        concierge_responsible_id: 'u6',
        first_rent_date: null,
        deposit_value: null,
        condominium_value: null,
        iptu_value: null,
        insurance_value: null,
        legacy_id: null,
        notes: null,
        attachments: storagePath ? [storagePath] : [],
        extra_fields: {
          tipo: dados.tipo,
          nome_parte: dados.nome_parte,
          cpf_cnpj: dados.cpf_cnpj,
          imovel_endereco: dados.imovel,
          unidade: dados.unidade,
          data_assinatura: dados.data_assinatura,
          arquivo_nome: arquivo?.name || null,
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        tipo: (dados.tipo as 'locacao' | 'prestacao_servico') || 'locacao',
        nome_parte: dados.nome_parte,
        cpf_cnpj: dados.cpf_cnpj,
        imovel_endereco: dados.imovel,
        unidade: dados.unidade,
        arquivo_nome: arquivo?.name || undefined,
        data_assinatura: dados.data_assinatura,
      }

      setContratos((prev) => {
        const updated = [novoContrato, ...prev]
        try {
          localStorage.setItem('alugai_contratos', JSON.stringify(updated))
        } catch {
          // ignore
        }
        return updated
      })

      return novoContrato
    },
    [uploadDocumento],
  )

  const adicionarDocumento = useCallback(
    async (contratoId: string, arquivo: File) => {
      const path = await uploadDocumento(arquivo, contratoId)

      setContratos((prev) => {
        const updated = prev.map((c) => {
          if (c.id === contratoId) {
            const currentAtt = c.attachments || []
            return {
              ...c,
              attachments: [...currentAtt, path],
            }
          }
          return c
        })
        try {
          localStorage.setItem('alugai_contratos', JSON.stringify(updated))
        } catch {
          // ignore
        }
        return updated
      })

      return path
    },
    [uploadDocumento],
  )

  const stats = {
    total: contratos.length,
    ativos: contratos.filter((c) => {
      const dias = diasParaVencimento(c.end_date)
      return dias > 30 && c.status === 'Ativo'
    }).length,
    vencendo30: contratos.filter((c) => {
      const dias = diasParaVencimento(c.end_date)
      return dias >= 0 && dias <= 30
    }).length,
    vencidos: contratos.filter((c) => diasParaVencimento(c.end_date) < 0).length,
  }

  return {
    contratos,
    loading,
    error,
    stats,
    fetchContratos,
    criarContrato,
    adicionarDocumento,
    getDocumentoUrl,
    diasParaVencimento,
  }
}
