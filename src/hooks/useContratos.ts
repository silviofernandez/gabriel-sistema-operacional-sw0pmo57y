import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

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
      const { data, error: err } = await supabase
        .from('contratos_locacao')
        .select('*')
        .order('created_at', { ascending: false })

      if (err) throw err
      setContratos(
        (data || []).map((c: ContratoLocacao) => ({
          ...c,
          tipo: c.extra_fields?.tipo as ContratoLocacao['tipo'],
          nome_parte: c.extra_fields?.nome_parte as string,
          cpf_cnpj: c.extra_fields?.cpf_cnpj as string,
          imovel_endereco: c.extra_fields?.imovel_endereco as string,
          unidade: c.extra_fields?.unidade as string,
          arquivo_nome: c.extra_fields?.arquivo_nome as string,
          data_assinatura: c.extra_fields?.data_assinatura as string,
        }))
      )
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

    const { error: uploadErr } = await supabase.storage
      .from('documentos')
      .upload(path, file, { contentType: file.type, upsert: false })

    if (uploadErr) throw uploadErr
    return path
  }, [])

  const getDocumentoUrl = useCallback(async (path: string) => {
    const { data } = await supabase.storage
      .from('documentos')
      .createSignedUrl(path, 3600) // 1h de validade

    return data?.signedUrl || null
  }, [])

  const criarContrato = useCallback(
    async (dados: ContratoUploadData, arquivo?: File) => {
      const rentValue = typeof dados.valor_aluguel === 'string'
        ? parseFloat(dados.valor_aluguel.replace(',', '.'))
        : dados.valor_aluguel

      const insertData: Record<string, unknown> = {
        start_date: dados.data_inicio || null,
        end_date: dados.data_fim || null,
        rent_value: rentValue || 0,
        readjust_index: dados.indice_reajuste || 'IGPM',
        status: 'Ativo',
        health_score: 100,
        extra_fields: {
          tipo: dados.tipo,
          nome_parte: dados.nome_parte,
          cpf_cnpj: dados.cpf_cnpj,
          imovel_endereco: dados.imovel,
          unidade: dados.unidade,
          data_assinatura: dados.data_assinatura,
          arquivo_nome: arquivo?.name || null,
        },
      }

      const { data: contrato, error: insertErr } = await supabase
        .from('contratos_locacao')
        .insert(insertData)
        .select()
        .single()

      if (insertErr) throw insertErr

      let storagePath: string | null = null
      if (arquivo && contrato) {
        storagePath = await uploadDocumento(arquivo, contrato.id)
        await supabase
          .from('contratos_locacao')
          .update({ attachments: [storagePath] })
          .eq('id', contrato.id)
      }

      await fetchContratos()
      return contrato
    },
    [fetchContratos, uploadDocumento]
  )

  const adicionarDocumento = useCallback(
    async (contratoId: string, arquivo: File) => {
      const path = await uploadDocumento(arquivo, contratoId)

      const { data: current } = await supabase
        .from('contratos_locacao')
        .select('attachments')
        .eq('id', contratoId)
        .single()

      const existingAttachments = current?.attachments || []

      await supabase
        .from('contratos_locacao')
        .update({ attachments: [...existingAttachments, path] })
        .eq('id', contratoId)

      await fetchContratos()
      return path
    },
    [fetchContratos, uploadDocumento]
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

