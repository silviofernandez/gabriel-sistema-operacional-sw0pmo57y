import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'
import {
  ModeloProcesso,
  CasoProcesso,
  AtividadeCaso,
  ComentarioCaso,
  ConfiguracaoExpediente,
  VersaoProcessoSnapshot,
  GabrielUnidade,
  CasoStatus,
} from '@/types/processos'
import { processoService } from '@/services/processoService'
import { pipelineService } from '@/services/pipelineService'
import useAuthStore from './useAuthStore'
import { adicionarHorasUteis } from '@/utils/expedienteSLA'
import { useToast } from '@/hooks/use-toast'

interface ProcessosContextType {
  // Modelos
  modelos: ModeloProcesso[]
  selectedModelo: ModeloProcesso | null
  setSelectedModelo: (m: ModeloProcesso | null) => void
  refreshModelos: () => Promise<void>
  salvarModelo: (m: Partial<ModeloProcesso>) => Promise<ModeloProcesso | null>
  publicarModelo: (
    modeloId: string,
    notaVersao: string,
  ) => Promise<{ sucesso: boolean; novaVersao?: number; erro?: string }>
  duplicarModelo: (modeloId: string) => Promise<ModeloProcesso | null>
  fetchVersoes: (modeloId: string) => Promise<VersaoProcessoSnapshot[]>

  // Casos
  casos: CasoProcesso[]
  selectedCaso: CasoProcesso | null
  setSelectedCaso: (c: CasoProcesso | null) => void
  selectedUnidadeFiltro: GabrielUnidade | 'Todas'
  setSelectedUnidadeFiltro: (u: GabrielUnidade | 'Todas') => void
  refreshCasos: () => Promise<void>
  abrirCaso: (
    dados: Omit<CasoProcesso, 'id' | 'created' | 'updated'>,
  ) => Promise<CasoProcesso | null>
  atualizarCaso: (id: string, updates: Partial<CasoProcesso>) => Promise<boolean>
  avancarFaseCaso: (
    casoId: string,
    proximaFaseId: string,
    proximaFaseNome: string,
  ) => Promise<{ sucesso: boolean; erro?: string }>
  devolverFaseCaso: (
    casoId: string,
    faseDestinoId: string,
    faseDestinoNome: string,
    motivo: string,
  ) => Promise<boolean>
  reabrirCaso: (casoId: string, motivo: string) => Promise<boolean>
  pausarCaso: (casoId: string, motivo: string) => Promise<boolean>
  cancelarCaso: (casoId: string, motivo: string) => Promise<boolean>

  // Atividades do Caso
  atividadesCaso: AtividadeCaso[]
  carregarAtividadesCaso: (casoId: string) => Promise<void>
  concluirAtividade: (
    atividadeId: string,
    dadosFormulario?: Record<string, any>,
    documentosAnexados?: any[],
  ) => Promise<{ sucesso: boolean; erro?: string }>
  aprovarAtividade: (atividadeId: string, parecer: string) => Promise<boolean>
  recusarAtividade: (atividadeId: string, motivo: string) => Promise<boolean>

  // Comentários
  comentariosCaso: ComentarioCaso[]
  carregarComentariosCaso: (casoId: string) => Promise<void>
  adicionarComentario: (
    casoId: string,
    protocolo: string,
    mensagem: string,
    visibilidade: 'interno' | 'externo_cliente',
  ) => Promise<boolean>

  // Expediente
  configExpediente: ConfiguracaoExpediente[]
  loading: boolean
}

const ProcessosContext = createContext<ProcessosContextType | undefined>(undefined)

export const ProcessosProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuthStore()
  const { toast } = useToast()

  const [modelos, setModelos] = useState<ModeloProcesso[]>([])
  const [selectedModelo, setSelectedModelo] = useState<ModeloProcesso | null>(null)
  const [casos, setCasos] = useState<CasoProcesso[]>([])
  const [selectedCaso, setSelectedCaso] = useState<CasoProcesso | null>(null)
  const [selectedUnidadeFiltro, setSelectedUnidadeFiltro] = useState<GabrielUnidade | 'Todas'>(
    'Todas',
  )
  const [atividadesCaso, setAtividadesCaso] = useState<AtividadeCaso[]>([])
  const [comentariosCaso, setComentariosCaso] = useState<ComentarioCaso[]>([])
  const [configExpediente, setConfigExpediente] = useState<ConfiguracaoExpediente[]>([])
  const [loading, setLoading] = useState(false)

  const refreshModelos = useCallback(async () => {
    const list = await processoService.fetchModelos()
    setModelos(list)
  }, [])

  const refreshCasos = useCallback(async () => {
    const list = await processoService.fetchCasos(
      selectedUnidadeFiltro !== 'Todas' ? selectedUnidadeFiltro : undefined,
    )
    setCasos(list)
  }, [selectedUnidadeFiltro])

  const refreshExpediente = useCallback(async () => {
    const conf = await processoService.fetchConfigExpediente()
    setConfigExpediente(conf)
  }, [])

  useEffect(() => {
    setLoading(true)
    Promise.all([refreshModelos(), refreshCasos(), refreshExpediente()]).finally(() => {
      setLoading(false)
    })
  }, [refreshModelos, refreshCasos, refreshExpediente])

  // Salvar rascunho de modelo
  const salvarModelo = useCallback(
    async (m: Partial<ModeloProcesso>) => {
      let saved: ModeloProcesso | null = null
      if (m.id) {
        saved = await processoService.updateModelo(m.id, m)
      } else {
        saved = await processoService.createModelo({
          ...m,
          criado_por: user.name || 'Carlos Silva (Administrador)',
        })
      }
      if (saved) {
        await refreshModelos()
        // Auditoria
        await pipelineService.logAction({
          colaborador_id: user.id || 'u1',
          colaborador_nome: user.name || 'Carlos Silva',
          acao_tipo: 'editou',
          motivo: `Modelo de processo "${saved.nome}" salvo (v${saved.versao_atual}).`,
          dados_depois: { modelo_id: saved.id, codigo: saved.codigo, versao: saved.versao_atual },
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        })
      }
      return saved
    },
    [user.id, user.name, refreshModelos],
  )

  // Publicar modelo com snapshot imutável
  const publicarModelo = useCallback(
    async (
      modeloId: string,
      notaVersao: string,
    ): Promise<{ sucesso: boolean; novaVersao?: number; erro?: string }> => {
      const modelo = modelos.find((m) => m.id === modeloId)
      if (!modelo) return { sucesso: false, erro: 'Modelo não encontrado' }

      const res = await processoService.publicarModelo(
        modelo,
        notaVersao,
        user.name || 'Carlos Silva (Administrador)',
      )
      if (res.sucesso) {
        await refreshModelos()
        // Auditoria
        await pipelineService.logAction({
          colaborador_id: user.id || 'u1',
          colaborador_nome: user.name || 'Carlos Silva',
          acao_tipo: 'editou',
          motivo: `Modelo "${modelo.nome}" PUBLICADO com sucesso (Versão ${res.novaVersao}). ${notaVersao}`,
          dados_depois: { modelo_id: modelo.id, versao: res.novaVersao },
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        })
      }
      return res
    },
    [modelos, user.id, user.name, refreshModelos],
  )

  // Duplicar modelo
  const duplicarModelo = useCallback(
    async (modeloId: string) => {
      const original = modelos.find((m) => m.id === modeloId)
      if (!original) return null

      const novo = await processoService.createModelo({
        codigo: `MOD-${Date.now().toString().slice(-6)}`,
        nome: `${original.nome} (Cópia)`,
        descricao: original.descricao,
        categoria: original.categoria,
        status: 'rascunho',
        versao_atual: 1,
        fases: original.fases,
        configuracao_sla: original.configuracao_sla,
        criado_por: user.name || 'Administrador',
        is_demo: true,
      })
      if (novo) {
        await refreshModelos()
      }
      return novo
    },
    [modelos, user.name, refreshModelos],
  )

  const fetchVersoes = useCallback(async (modeloId: string) => {
    return await processoService.fetchVersoes(modeloId)
  }, [])

  // Abertura de caso com protocolo único e cálculo de SLA útil
  const abrirCaso = useCallback(
    async (dados: Omit<CasoProcesso, 'id' | 'created' | 'updated'>) => {
      const confUnidade =
        configExpediente.find((c) => c.unidade === dados.unidade) ||
        configExpediente.find((c) => c.unidade === 'Geral')
      const now = new Date()
      const horasSlaResp = confUnidade?.sla_primeira_resposta_horas || 2
      const prazoResp = adicionarHorasUteis(now, horasSlaResp, confUnidade).toISOString()
      const prazoRes = adicionarHorasUteis(now, 24, confUnidade).toISOString()

      // Buscar fases do modelo para gerar atividades da 1ª fase
      const modelo = modelos.find((m) => m.id === dados.modelo_id)
      const primeiraFase = modelo?.fases[0]

      const ativsIniciais = primeiraFase?.atividades.map((a) => ({
        titulo: a.titulo,
        descricao: a.descricao,
        tipo: a.tipo,
        status: 'Pendente' as const,
        responsavel_id: dados.responsavel_id,
        responsavel_nome: dados.responsavel_nome,
        funcao_responsavel: a.funcao_responsavel || 'Atendimento',
        prazo: adicionarHorasUteis(now, a.prazo_horas_uteis || 4, confUnidade).toISOString(),
        is_paralela: !!a.is_paralela,
        documentos_obrigatorios: a.documentos_obrigatorios,
        ai_config_status: a.tipo === 'IA' ? 'Aguardando configuração' : undefined,
      }))

      const casoCriado = await processoService.createCaso(
        {
          ...dados,
          fase_atual_id: dados.fase_atual_id || primeiraFase?.id || 'fase-1',
          fase_atual_nome: dados.fase_atual_nome || primeiraFase?.nome || 'Triagem',
          prazo_primeira_resposta: prazoResp,
          prazo_resolucao: prazoRes,
          historico_etapas: [
            {
              fase: primeiraFase?.nome || 'Triagem',
              fase_id: primeiraFase?.id || 'fase-1',
              data_inicio: new Date().toISOString().replace('T', ' ').slice(0, 19),
              data_conclusao: null,
              usuario: user.name || 'Sistema',
            },
          ],
        },
        ativsIniciais,
      )

      if (casoCriado) {
        await refreshCasos()

        // 1. Notificação automática de confirmação de recebimento com protocolo
        await pipelineService.sendNotification({
          destinatario_nome: casoCriado.solicitante_nome,
          telefone: casoCriado.solicitante_telefone || '(14) 99999-0000',
          mensagem: `Olá, ${casoCriado.solicitante_nome.split(' ')[0]}! Sua solicitação foi recebida com sucesso. Protocolo: ${casoCriado.protocolo}. Previsão de primeiro retorno útil: até 2h úteis. Gabriel Imobiliária (${casoCriado.unidade}).`,
          tipo: 'sistema',
          status: 'enviada',
        })

        // 2. Registrar no log de auditoria
        await pipelineService.logAction({
          colaborador_id: user.id || 'u1',
          colaborador_nome: user.name || 'Carlos Silva',
          acao_tipo: 'criou_tarefa',
          contrato_id: casoCriado.contrato_id,
          motivo: `Caso aberto: Protocolo ${casoCriado.protocolo} - "${casoCriado.titulo}" (${casoCriado.unidade})`,
          dados_depois: {
            protocolo: casoCriado.protocolo,
            unidade: casoCriado.unidade,
            solicitante: casoCriado.solicitante_nome,
            responsavel: casoCriado.responsavel_nome,
          },
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        })
      }

      return casoCriado
    },
    [configExpediente, modelos, user.id, user.name, refreshCasos],
  )

  const atualizarCaso = useCallback(
    async (id: string, updates: Partial<CasoProcesso>) => {
      const atualizado = await processoService.updateCaso(id, updates)
      if (atualizado) {
        await refreshCasos()
        if (selectedCaso?.id === id) {
          setSelectedCaso((prev) => (prev ? { ...prev, ...updates } : null))
        }
        return true
      }
      return false
    },
    [selectedCaso?.id, refreshCasos],
  )

  const carregarAtividadesCaso = useCallback(async (casoId: string) => {
    const list = await processoService.fetchAtividadesCaso(casoId)
    setAtividadesCaso(list)
  }, [])

  const carregarComentariosCaso = useCallback(async (casoId: string) => {
    const list = await processoService.fetchComentariosCaso(casoId)
    setComentariosCaso(list)
  }, [])

  // Concluir atividade com checagem de documentos e formulários
  const concluirAtividade = useCallback(
    async (
      atividadeId: string,
      dadosFormulario?: Record<string, any>,
      documentosAnexados?: any[],
    ) => {
      const ativ = atividadesCaso.find((a) => a.id === atividadeId)
      if (!ativ) return { sucesso: false, erro: 'Atividade não encontrada' }

      // Validação no servidor/store: documentos obrigatórios
      if (ativ.documentos_obrigatorios && ativ.documentos_obrigatorios.length > 0) {
        const anexadosNomes = (documentosAnexados || ativ.documentos_anexados || []).map(
          (d: any) => d.nome,
        )
        const faltantes = ativ.documentos_obrigatorios.filter((obr) => !anexadosNomes.includes(obr))
        if (faltantes.length > 0) {
          return {
            sucesso: false,
            erro: `Bloqueio: É obrigatório anexar os documentos: ${faltantes.join(', ')}`,
          }
        }
      }

      const agora = new Date().toISOString().replace('T', ' ').slice(0, 19)
      const res = await processoService.updateAtividade(atividadeId, {
        status: 'Concluída',
        data_conclusao: agora,
        formulario_dados: dadosFormulario,
        documentos_anexados: documentosAnexados || ativ.documentos_anexados,
      })

      if (res) {
        await carregarAtividadesCaso(ativ.caso_id)
        // Auditoria
        await pipelineService.logAction({
          colaborador_id: user.id || 'u3',
          colaborador_nome: user.name || 'Colaborador',
          acao_tipo: 'concluiu_tarefa',
          motivo: `Atividade "${ativ.titulo}" concluída no protocolo ${ativ.caso_protocolo}.`,
          timestamp: agora,
        })
        return { sucesso: true }
      }
      return { sucesso: false, erro: 'Falha ao atualizar atividade no banco de dados.' }
    },
    [atividadesCaso, carregarAtividadesCaso, user.id, user.name],
  )

  const aprovarAtividade = useCallback(
    async (atividadeId: string, parecer: string) => {
      const ativ = atividadesCaso.find((a) => a.id === atividadeId)
      if (!ativ) return false

      const agora = new Date().toISOString().replace('T', ' ').slice(0, 19)
      const res = await processoService.updateAtividade(atividadeId, {
        status: 'Concluída',
        data_conclusao: agora,
        aprovado_por: user.name || 'Carlos Silva (Gestor)',
        parecer_aprovacao: parecer,
      })

      if (res) {
        await carregarAtividadesCaso(ativ.caso_id)
        // Auditoria
        await pipelineService.logAction({
          colaborador_id: user.id || 'u1',
          colaborador_nome: user.name || 'Gestor',
          acao_tipo: 'concluiu_tarefa',
          motivo: `Aprovação de alçada concedida para "${ativ.titulo}" no caso ${ativ.caso_protocolo}. Parecer: ${parecer}`,
          timestamp: agora,
        })
        return true
      }
      return false
    },
    [atividadesCaso, carregarAtividadesCaso, user.id, user.name],
  )

  const recusarAtividade = useCallback(
    async (atividadeId: string, motivo: string) => {
      const ativ = atividadesCaso.find((a) => a.id === atividadeId)
      if (!ativ) return false

      const agora = new Date().toISOString().replace('T', ' ').slice(0, 19)
      const res = await processoService.updateAtividade(atividadeId, {
        status: 'Recusada',
        motivo_recusa: motivo,
        data_conclusao: agora,
      })

      if (res) {
        await carregarAtividadesCaso(ativ.caso_id)
        // Se a atividade possui etapa_retorno_id configurada, retornar o caso para ela
        if (ativ.etapa_retorno_id && selectedCaso) {
          const modelo = modelos.find((m) => m.id === selectedCaso.modelo_id)
          const faseDestino = modelo?.fases.find((f) => f.id === ativ.etapa_retorno_id)
          if (faseDestino) {
            await devolverFaseCaso(
              ativ.caso_id,
              faseDestino.id,
              faseDestino.nome,
              `Recusa em aprovação: ${motivo}`,
            )
          }
        }

        // Auditoria
        await pipelineService.logAction({
          colaborador_id: user.id || 'u1',
          colaborador_nome: user.name || 'Gestor',
          acao_tipo: 'editou',
          motivo: `Atividade "${ativ.titulo}" RECUSADA no caso ${ativ.caso_protocolo}. Motivo: ${motivo}`,
          timestamp: agora,
        })
        return true
      }
      return false
    },
    [atividadesCaso, carregarAtividadesCaso, user.id, user.name, selectedCaso, modelos],
  )

  // Avançar fase do caso com validação de bloqueios
  const avancarFaseCaso = useCallback(
    async (casoId: string, proximaFaseId: string, proximaFaseNome: string) => {
      const caso = casos.find((c) => c.id === casoId)
      if (!caso) return { sucesso: false, erro: 'Caso não encontrado' }

      // Checar se existem atividades obrigatórias pendentes na fase atual
      const ativsDaFase = atividadesCaso.filter((a) => a.fase_id === caso.fase_atual_id)
      const pendentesObrigatorias = ativsDaFase.filter(
        (a) => a.status !== 'Concluída' && a.tipo !== 'IA',
      )

      if (pendentesObrigatorias.length > 0) {
        const titulos = pendentesObrigatorias.map((a) => a.titulo).join('; ')
        return {
          sucesso: false,
          erro: `Bloqueio de Avanço: Conclua todas as atividades obrigatórias da fase antes de avançar (${titulos}).`,
        }
      }

      const agora = new Date().toISOString().replace('T', ' ').slice(0, 19)
      const novoHistorico = [
        ...(caso.historico_etapas || []).map((h) =>
          h.fase_id === caso.fase_atual_id && !h.data_conclusao
            ? { ...h, data_conclusao: agora }
            : h,
        ),
        {
          fase: proximaFaseNome,
          fase_id: proximaFaseId,
          data_inicio: agora,
          data_conclusao: null,
          usuario: user.name || 'Colaborador',
        },
      ]

      const ok = await atualizarCaso(casoId, {
        fase_atual_id: proximaFaseId,
        fase_atual_nome: proximaFaseNome,
        status:
          proximaFaseId.includes('conclusao') || proximaFaseNome.includes('Conclusão')
            ? 'Resolvido'
            : 'Em atendimento',
        historico_etapas: novoHistorico,
      })

      if (ok) {
        // Criar atividades da nova fase baseadas no modelo
        const modelo = modelos.find((m) => m.id === caso.modelo_id)
        const novaFaseDef = modelo?.fases.find((f) => f.id === proximaFaseId)
        if (novaFaseDef) {
          const conf =
            configExpediente.find((c) => c.unidade === caso.unidade) || configExpediente[0]
          for (const ativDef of novaFaseDef.atividades) {
            await processoService.updateAtividade(`nova_${Date.now()}`, {
              caso_id: caso.id,
              caso_protocolo: caso.protocolo,
              fase_id: proximaFaseId,
              titulo: ativDef.titulo,
              descricao: ativDef.descricao,
              tipo: ativDef.tipo,
              status: 'Pendente',
              responsavel_id: caso.responsavel_id,
              responsavel_nome: caso.responsavel_nome,
              funcao_responsavel: ativDef.funcao_responsavel || 'Atendimento',
              prazo: adicionarHorasUteis(
                new Date(),
                ativDef.prazo_horas_uteis || 4,
                conf,
              ).toISOString(),
              is_paralela: !!ativDef.is_paralela,
              documentos_obrigatorios: ativDef.documentos_obrigatorios,
              ai_config_status: ativDef.tipo === 'IA' ? 'Aguardando configuração' : undefined,
            } as any)
          }
        }

        await pipelineService.logAction({
          colaborador_id: user.id || 'u3',
          colaborador_nome: user.name || 'Colaborador',
          acao_tipo: 'avancou_etapa',
          motivo: `Caso ${caso.protocolo} avançou para a fase "${proximaFaseNome}".`,
          timestamp: agora,
        })
        return { sucesso: true }
      }

      return { sucesso: false, erro: 'Falha ao salvar no banco.' }
    },
    [casos, atividadesCaso, modelos, configExpediente, atualizarCaso, user.id, user.name],
  )

  // Devolver etapa com justificativa e preservação de histórico
  const devolverFaseCaso = useCallback(
    async (casoId: string, faseDestinoId: string, faseDestinoNome: string, motivo: string) => {
      const caso = casos.find((c) => c.id === casoId)
      if (!caso) return false

      const agora = new Date().toISOString().replace('T', ' ').slice(0, 19)
      const novoHistorico = [
        ...(caso.historico_etapas || []),
        {
          fase: `Retorno para: ${faseDestinoNome}`,
          fase_id: faseDestinoId,
          data_inicio: agora,
          data_conclusao: null,
          usuario: user.name || 'Gestor',
          motivo_retorno: motivo,
        },
      ]

      const ok = await atualizarCaso(casoId, {
        fase_atual_id: faseDestinoId,
        fase_atual_nome: faseDestinoNome,
        status: 'Em atendimento',
        historico_etapas: novoHistorico,
        proxima_acao: `Complemento/revisão solicitada: ${motivo}`,
      })

      if (ok) {
        await pipelineService.logAction({
          colaborador_id: user.id || 'u1',
          colaborador_nome: user.name || 'Gestor',
          acao_tipo: 'editou',
          motivo: `Caso ${caso.protocolo} RETORNADO para etapa "${faseDestinoNome}". Motivo: ${motivo}`,
          timestamp: agora,
        })
      }
      return ok
    },
    [casos, atualizarCaso, user.id, user.name],
  )

  // Reabertura de caso resolvido
  const reabrirCaso = useCallback(
    async (casoId: string, motivo: string) => {
      const caso = casos.find((c) => c.id === casoId)
      if (!caso) return false

      const agora = new Date().toISOString().replace('T', ' ').slice(0, 19)
      const novoHistorico = [
        ...(caso.historico_etapas || []),
        {
          fase: 'Reabertura de Atendimento',
          data_inicio: agora,
          data_conclusao: null,
          usuario: user.name || 'Gestor',
          motivo_retorno: motivo,
        },
      ]

      const ok = await atualizarCaso(casoId, {
        status: 'Reaberto',
        motivo_reabertura: motivo,
        historico_etapas: novoHistorico,
        proxima_acao: `Tratar demanda de reabertura: ${motivo}`,
      })

      if (ok) {
        await pipelineService.logAction({
          colaborador_id: user.id || 'u1',
          colaborador_nome: user.name || 'Gestor',
          acao_tipo: 'reabriu_tarefa',
          motivo: `Caso ${caso.protocolo} REABERTO. Motivo: ${motivo}`,
          timestamp: agora,
        })
      }
      return ok
    },
    [casos, atualizarCaso, user.id, user.name],
  )

  const pausarCaso = useCallback(
    async (casoId: string, motivo: string) => {
      return await atualizarCaso(casoId, {
        status: 'Aguardando cliente',
        motivo_pausa: motivo,
      })
    },
    [atualizarCaso],
  )

  const cancelarCaso = useCallback(
    async (casoId: string, motivo: string) => {
      return await atualizarCaso(casoId, {
        status: 'Cancelado',
        motivo_cancelamento: motivo,
      })
    },
    [atualizarCaso],
  )

  const adicionarComentario = useCallback(
    async (
      casoId: string,
      protocolo: string,
      mensagem: string,
      visibilidade: 'interno' | 'externo_cliente',
    ) => {
      const res = await processoService.addComentario({
        caso_id: casoId,
        caso_protocolo: protocolo,
        visibilidade,
        autor_id: user.id || 'u3',
        autor_nome: user.name || 'Colaborador',
        mensagem,
      })
      if (res) {
        await carregarComentariosCaso(casoId)
        // Se for mensagem externa ao cliente, atualiza data de resposta humana
        if (visibilidade === 'externo_cliente') {
          const agora = new Date().toISOString().replace('T', ' ').slice(0, 19)
          await atualizarCaso(casoId, {
            data_ultimo_retorno_cliente: agora,
            data_primeira_resposta_humana: selectedCaso?.data_primeira_resposta_humana || agora,
          })
        }
        return true
      }
      return false
    },
    [user.id, user.name, carregarComentariosCaso, atualizarCaso, selectedCaso],
  )

  const value = useMemo(
    () => ({
      modelos,
      selectedModelo,
      setSelectedModelo,
      refreshModelos,
      salvarModelo,
      publicarModelo,
      duplicarModelo,
      fetchVersoes,
      casos,
      selectedCaso,
      setSelectedCaso,
      selectedUnidadeFiltro,
      setSelectedUnidadeFiltro,
      refreshCasos,
      abrirCaso,
      atualizarCaso,
      avancarFaseCaso,
      devolverFaseCaso,
      reabrirCaso,
      pausarCaso,
      cancelarCaso,
      atividadesCaso,
      carregarAtividadesCaso,
      concluirAtividade,
      aprovarAtividade,
      recusarAtividade,
      comentariosCaso,
      carregarComentariosCaso,
      adicionarComentario,
      configExpediente,
      loading,
    }),
    [
      modelos,
      selectedModelo,
      refreshModelos,
      salvarModelo,
      publicarModelo,
      duplicarModelo,
      fetchVersoes,
      casos,
      selectedCaso,
      selectedUnidadeFiltro,
      refreshCasos,
      abrirCaso,
      atualizarCaso,
      avancarFaseCaso,
      devolverFaseCaso,
      reabrirCaso,
      pausarCaso,
      cancelarCaso,
      atividadesCaso,
      carregarAtividadesCaso,
      concluirAtividade,
      aprovarAtividade,
      recusarAtividade,
      comentariosCaso,
      carregarComentariosCaso,
      adicionarComentario,
      configExpediente,
      loading,
    ],
  )

  return <ProcessosContext.Provider value={value}>{children}</ProcessosContext.Provider>
}

export function useProcessos() {
  const context = useContext(ProcessosContext)
  if (!context) {
    throw new Error('useProcessos deve ser usado dentro de ProcessosProvider')
  }
  return context
}
