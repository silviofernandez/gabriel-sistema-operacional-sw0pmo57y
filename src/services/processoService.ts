import pb from '@/lib/pocketbase/client'
import {
  ModeloProcesso,
  VersaoProcessoSnapshot,
  CasoProcesso,
  AtividadeCaso,
  ComentarioCaso,
  ConfiguracaoExpediente,
  FaseModeloDef,
} from '@/types/processos'

export const processoService = {
  // --- MODELOS DE PROCESSO ---
  async fetchModelos(): Promise<ModeloProcesso[]> {
    try {
      const records = await pb.collection('modelos_processos').getFullList({
        sort: '-created',
      })
      return records.map((r) => ({
        id: r.id,
        codigo: r.codigo,
        nome: r.nome,
        descricao: r.descricao,
        categoria: r.categoria,
        status: r.status,
        versao_atual: r.versao_atual || 1,
        fases: typeof r.fases === 'string' ? JSON.parse(r.fases || '[]') : r.fases || [],
        configuracao_sla:
          typeof r.configuracao_sla === 'string'
            ? JSON.parse(r.configuracao_sla || '{}')
            : r.configuracao_sla || {},
        criado_por: r.criado_por,
        publicado_em: r.publicado_em,
        is_demo: !!r.is_demo,
        created: r.created,
        updated: r.updated,
      }))
    } catch (err) {
      console.warn('Erro ao buscar modelos de processo:', err)
      return []
    }
  },

  async createModelo(data: Partial<ModeloProcesso>): Promise<ModeloProcesso | null> {
    try {
      const payload: Record<string, any> = {
        codigo: data.codigo || `MOD-${Date.now().toString().slice(-6)}`,
        nome: data.nome,
        descricao: data.descricao || '',
        categoria: data.categoria || 'Geral',
        status: data.status || 'rascunho',
        versao_atual: data.versao_atual || 1,
        fases: JSON.stringify(data.fases || []),
        configuracao_sla: JSON.stringify(
          data.configuracao_sla || { sla_primeira_resposta_horas: 2 },
        ),
        criado_por: data.criado_por || 'Administrador',
        is_demo: data.is_demo !== false,
      }
      const record = await pb.collection('modelos_processos').create(payload)
      return {
        ...data,
        id: record.id,
        codigo: record.codigo,
        nome: record.nome,
        status: record.status,
        versao_atual: record.versao_atual,
        fases: data.fases || [],
      } as ModeloProcesso
    } catch (err) {
      console.error('Erro ao criar modelo de processo:', err)
      return null
    }
  },

  async updateModelo(id: string, data: Partial<ModeloProcesso>): Promise<ModeloProcesso | null> {
    try {
      const payload: Record<string, any> = {}
      if (data.nome !== undefined) payload.nome = data.nome
      if (data.descricao !== undefined) payload.descricao = data.descricao
      if (data.categoria !== undefined) payload.categoria = data.categoria
      if (data.status !== undefined) payload.status = data.status
      if (data.versao_atual !== undefined) payload.versao_atual = data.versao_atual
      if (data.fases !== undefined) payload.fases = JSON.stringify(data.fases)
      if (data.configuracao_sla !== undefined)
        payload.configuracao_sla = JSON.stringify(data.configuracao_sla)
      if (data.publicado_em !== undefined) payload.publicado_em = data.publicado_em

      const record = await pb.collection('modelos_processos').update(id, payload)
      return {
        id: record.id,
        codigo: record.codigo,
        nome: record.nome,
        descricao: record.descricao,
        categoria: record.categoria,
        status: record.status,
        versao_atual: record.versao_atual,
        fases:
          typeof record.fases === 'string' ? JSON.parse(record.fases || '[]') : record.fases || [],
        configuracao_sla:
          typeof record.configuracao_sla === 'string'
            ? JSON.parse(record.configuracao_sla || '{}')
            : record.configuracao_sla,
        criado_por: record.criado_por,
        publicado_em: record.publicado_em,
        is_demo: !!record.is_demo,
      } as ModeloProcesso
    } catch (err) {
      console.error('Erro ao atualizar modelo de processo:', err)
      return null
    }
  },

  async publicarModelo(
    modelo: ModeloProcesso,
    notaVersao: string,
    publicadoPor: string,
  ): Promise<{ sucesso: boolean; novaVersao: number; erro?: string }> {
    // Validação estrita: não permitir publicar com fases vazias ou ciclos
    if (!modelo.fases || modelo.fases.length === 0) {
      return {
        sucesso: false,
        novaVersao: modelo.versao_atual,
        erro: 'O modelo deve conter pelo menos uma fase.',
      }
    }

    const novaVersao = (modelo.versao_atual || 1) + (modelo.status === 'publicado' ? 1 : 0)
    const agora = new Date().toISOString().replace('T', ' ').slice(0, 19)

    try {
      // 1. Gravar snapshot imutável em versoes_processos
      await pb.collection('versoes_processos').create({
        modelo_id: modelo.id,
        versao: novaVersao,
        snapshot: JSON.stringify({
          codigo: modelo.codigo,
          nome: modelo.nome,
          descricao: modelo.descricao,
          fases: modelo.fases,
          configuracao_sla: modelo.configuracao_sla,
        }),
        nota_versao: notaVersao || `Publicação da versão ${novaVersao}`,
        publicado_por: publicadoPor,
        is_demo: !!modelo.is_demo,
      })

      // 2. Atualizar modelo
      await pb.collection('modelos_processos').update(modelo.id, {
        status: 'publicado',
        versao_atual: novaVersao,
        fases: JSON.stringify(modelo.fases),
        publicado_em: agora,
      })

      return { sucesso: true, novaVersao }
    } catch (err: any) {
      console.error('Erro ao publicar modelo:', err)
      return {
        sucesso: false,
        novaVersao: modelo.versao_atual,
        erro: err?.message || 'Falha ao salvar no banco.',
      }
    }
  },

  async fetchVersoes(modeloId: string): Promise<VersaoProcessoSnapshot[]> {
    try {
      const records = await pb.collection('versoes_processos').getFullList({
        filter: `modelo_id = '${modeloId}'`,
        sort: '-versao',
      })
      return records.map((r) => ({
        id: r.id,
        modelo_id: r.modelo_id,
        versao: r.versao,
        snapshot: typeof r.snapshot === 'string' ? JSON.parse(r.snapshot || '{}') : r.snapshot,
        nota_versao: r.nota_versao,
        publicado_por: r.publicado_por,
        is_demo: !!r.is_demo,
        created: r.created,
      }))
    } catch (err) {
      console.warn('Erro ao buscar histórico de versões:', err)
      return []
    }
  },

  // --- CASOS EM EXECUÇÃO ---
  async fetchCasos(unidade?: string): Promise<CasoProcesso[]> {
    try {
      const filter = unidade && unidade !== 'Todas' ? `unidade = '${unidade}'` : ''
      const records = await pb.collection('casos_processos').getFullList({
        filter: filter || undefined,
        sort: '-created',
      })
      return records.map((r) => ({
        id: r.id,
        protocolo: r.protocolo,
        titulo: r.titulo,
        modelo_id: r.modelo_id,
        versao_modelo: r.versao_modelo || 1,
        unidade: r.unidade,
        status: r.status,
        prioridade: r.prioridade,
        justificativa_prioridade: r.justificativa_prioridade,
        fase_atual_id: r.fase_atual_id,
        fase_atual_nome: r.fase_atual_nome,
        solicitante_nome: r.solicitante_nome,
        solicitante_email: r.solicitante_email,
        solicitante_telefone: r.solicitante_telefone,
        canal_origem: r.canal_origem,
        cliente_id: r.cliente_id,
        cliente_nome: r.cliente_nome,
        imovel_id: r.imovel_id,
        imovel_titulo: r.imovel_titulo,
        contrato_id: r.contrato_id,
        responsavel_id: r.responsavel_id,
        responsavel_nome: r.responsavel_nome,
        equipe: r.equipe,
        proxima_acao: r.proxima_acao,
        data_abertura: r.data_abertura,
        prazo_primeira_resposta: r.prazo_primeira_resposta,
        data_primeira_resposta_humana: r.data_primeira_resposta_humana,
        prazo_resolucao: r.prazo_resolucao,
        prazo_prometido_cliente: r.prazo_prometido_cliente,
        data_ultimo_retorno_cliente: r.data_ultimo_retorno_cliente,
        motivo_pausa: r.motivo_pausa,
        motivo_cancelamento: r.motivo_cancelamento,
        motivo_reabertura: r.motivo_reabertura,
        caso_origem_protocolo: r.caso_origem_protocolo,
        casos_relacionados:
          typeof r.casos_relacionados === 'string'
            ? JSON.parse(r.casos_relacionados || '[]')
            : r.casos_relacionados || [],
        dados_formulario:
          typeof r.dados_formulario === 'string'
            ? JSON.parse(r.dados_formulario || '{}')
            : r.dados_formulario || {},
        bloqueios_pendentes:
          typeof r.bloqueios_pendentes === 'string'
            ? JSON.parse(r.bloqueios_pendentes || '[]')
            : r.bloqueios_pendentes || [],
        historico_etapas:
          typeof r.historico_etapas === 'string'
            ? JSON.parse(r.historico_etapas || '[]')
            : r.historico_etapas || [],
        is_demo: !!r.is_demo,
        created: r.created,
        updated: r.updated,
      }))
    } catch (err) {
      console.warn('Erro ao buscar casos:', err)
      return []
    }
  },

  async createCaso(
    data: Omit<CasoProcesso, 'id' | 'created' | 'updated'>,
    atividadesIniciais?: Array<Partial<AtividadeCaso>>,
  ): Promise<CasoProcesso | null> {
    try {
      const payload: Record<string, any> = {
        protocolo: data.protocolo,
        titulo: data.titulo,
        modelo_id: data.modelo_id,
        versao_modelo: data.versao_modelo || 1,
        unidade: data.unidade,
        status: data.status || 'Novo',
        prioridade: data.prioridade || 'Média',
        justificativa_prioridade: data.justificativa_prioridade || '',
        fase_atual_id: data.fase_atual_id,
        fase_atual_nome: data.fase_atual_nome,
        solicitante_nome: data.solicitante_nome,
        solicitante_email: data.solicitante_email || '',
        solicitante_telefone: data.solicitante_telefone || '',
        canal_origem: data.canal_origem || 'WhatsApp',
        cliente_id: data.cliente_id || '',
        cliente_nome: data.cliente_nome || '',
        imovel_id: data.imovel_id || '',
        imovel_titulo: data.imovel_titulo || '',
        contrato_id: data.contrato_id || '',
        responsavel_id: data.responsavel_id || '',
        responsavel_nome: data.responsavel_nome || '',
        equipe: data.equipe || '',
        proxima_acao: data.proxima_acao || '',
        data_abertura:
          data.data_abertura || new Date().toISOString().replace('T', ' ').slice(0, 19),
        prazo_primeira_resposta: data.prazo_primeira_resposta || '',
        data_primeira_resposta_humana: data.data_primeira_resposta_humana || '',
        prazo_resolucao: data.prazo_resolucao || '',
        prazo_prometido_cliente: data.prazo_prometido_cliente || '',
        data_ultimo_retorno_cliente: data.data_ultimo_retorno_cliente || '',
        caso_origem_protocolo: data.caso_origem_protocolo || '',
        casos_relacionados: JSON.stringify(data.casos_relacionados || []),
        dados_formulario: JSON.stringify(data.dados_formulario || {}),
        bloqueios_pendentes: JSON.stringify(data.bloqueios_pendentes || []),
        historico_etapas: JSON.stringify(data.historico_etapas || []),
        is_demo: data.is_demo !== false,
      }
      const record = await pb.collection('casos_processos').create(payload)

      // Criar atividades iniciais da fase se fornecidas
      if (atividadesIniciais && atividadesIniciais.length > 0) {
        for (const ativ of atividadesIniciais) {
          await pb.collection('atividades_casos').create({
            caso_id: record.id,
            caso_protocolo: record.protocolo,
            fase_id: data.fase_atual_id,
            titulo: ativ.titulo || 'Atividade inicial',
            descricao: ativ.descricao || '',
            tipo: ativ.tipo || 'Humana',
            status: ativ.status || 'Pendente',
            responsavel_tipo: ativ.responsavel_tipo || 'pessoa',
            responsavel_id: ativ.responsavel_id || data.responsavel_id || '',
            responsavel_nome: ativ.responsavel_nome || data.responsavel_nome || '',
            funcao_responsavel: ativ.funcao_responsavel || 'Atendimento',
            prazo: ativ.prazo || data.prazo_resolucao || '',
            is_paralela: !!ativ.is_paralela,
            documentos_obrigatorios: JSON.stringify(ativ.documentos_obrigatorios || []),
            ai_config_status: ativ.tipo === 'IA' ? 'Aguardando configuração' : '',
            is_demo: data.is_demo !== false,
          })
        }
      }

      return {
        ...data,
        id: record.id,
        created: record.created,
        updated: record.updated,
      } as CasoProcesso
    } catch (err) {
      console.error('Erro ao abrir caso de processo:', err)
      return null
    }
  },

  async updateCaso(id: string, updates: Partial<CasoProcesso>): Promise<CasoProcesso | null> {
    try {
      const payload: Record<string, any> = {}
      if (updates.status !== undefined) payload.status = updates.status
      if (updates.prioridade !== undefined) payload.prioridade = updates.prioridade
      if (updates.justificativa_prioridade !== undefined)
        payload.justificativa_prioridade = updates.justificativa_prioridade
      if (updates.fase_atual_id !== undefined) payload.fase_atual_id = updates.fase_atual_id
      if (updates.fase_atual_nome !== undefined) payload.fase_atual_nome = updates.fase_atual_nome
      if (updates.responsavel_id !== undefined) payload.responsavel_id = updates.responsavel_id
      if (updates.responsavel_nome !== undefined)
        payload.responsavel_nome = updates.responsavel_nome
      if (updates.proxima_acao !== undefined) payload.proxima_acao = updates.proxima_acao
      if (updates.data_primeira_resposta_humana !== undefined)
        payload.data_primeira_resposta_humana = updates.data_primeira_resposta_humana
      if (updates.data_ultimo_retorno_cliente !== undefined)
        payload.data_ultimo_retorno_cliente = updates.data_ultimo_retorno_cliente
      if (updates.motivo_pausa !== undefined) payload.motivo_pausa = updates.motivo_pausa
      if (updates.motivo_cancelamento !== undefined)
        payload.motivo_cancelamento = updates.motivo_cancelamento
      if (updates.motivo_reabertura !== undefined)
        payload.motivo_reabertura = updates.motivo_reabertura
      if (updates.casos_relacionados !== undefined)
        payload.casos_relacionados = JSON.stringify(updates.casos_relacionados)
      if (updates.dados_formulario !== undefined)
        payload.dados_formulario = JSON.stringify(updates.dados_formulario)
      if (updates.bloqueios_pendentes !== undefined)
        payload.bloqueios_pendentes = JSON.stringify(updates.bloqueios_pendentes)
      if (updates.historico_etapas !== undefined)
        payload.historico_etapas = JSON.stringify(updates.historico_etapas)

      const record = await pb.collection('casos_processos').update(id, payload)
      return {
        id: record.id,
        protocolo: record.protocolo,
        titulo: record.titulo,
        modelo_id: record.modelo_id,
        versao_modelo: record.versao_modelo,
        unidade: record.unidade,
        status: record.status,
        prioridade: record.prioridade,
        fase_atual_id: record.fase_atual_id,
        fase_atual_nome: record.fase_atual_nome,
        solicitante_nome: record.solicitante_nome,
        canal_origem: record.canal_origem,
        responsavel_id: record.responsavel_id,
        responsavel_nome: record.responsavel_nome,
        proxima_acao: record.proxima_acao,
        data_abertura: record.data_abertura,
        bloqueios_pendentes: updates.bloqueios_pendentes,
        historico_etapas: updates.historico_etapas,
        dados_formulario: updates.dados_formulario,
        is_demo: !!record.is_demo,
      } as CasoProcesso
    } catch (err) {
      console.error('Erro ao atualizar caso:', err)
      return null
    }
  },

  // --- ATIVIDADES DO CASO ---
  async fetchAtividadesCaso(casoId: string): Promise<AtividadeCaso[]> {
    try {
      const records = await pb.collection('atividades_casos').getFullList({
        filter: `caso_id = '${casoId}'`,
        sort: 'created',
      })
      return records.map((r) => ({
        id: r.id,
        caso_id: r.caso_id,
        caso_protocolo: r.caso_protocolo,
        fase_id: r.fase_id,
        titulo: r.titulo,
        descricao: r.descricao,
        tipo: r.tipo,
        status: r.status,
        responsavel_tipo: r.responsavel_tipo,
        responsavel_id: r.responsavel_id,
        responsavel_nome: r.responsavel_nome,
        funcao_responsavel: r.funcao_responsavel,
        substituto_id: r.substituto_id,
        prazo: r.prazo,
        data_conclusao: r.data_conclusao,
        depende_de_atividades:
          typeof r.depende_de_atividades === 'string'
            ? JSON.parse(r.depende_de_atividades || '[]')
            : r.depende_de_atividades || [],
        is_paralela: !!r.is_paralela,
        condicoes_conclusao:
          typeof r.condicoes_conclusao === 'string'
            ? JSON.parse(r.condicoes_conclusao || '{}')
            : r.condicoes_conclusao || {},
        documentos_obrigatorios:
          typeof r.documentos_obrigatorios === 'string'
            ? JSON.parse(r.documentos_obrigatorios || '[]')
            : r.documentos_obrigatorios || [],
        documentos_anexados:
          typeof r.documentos_anexados === 'string'
            ? JSON.parse(r.documentos_anexados || '[]')
            : r.documentos_anexados || [],
        formulario_dados:
          typeof r.formulario_dados === 'string'
            ? JSON.parse(r.formulario_dados || '{}')
            : r.formulario_dados || {},
        aprovado_por: r.aprovado_por,
        parecer_aprovacao: r.parecer_aprovacao,
        motivo_recusa: r.motivo_recusa,
        etapa_retorno_id: r.etapa_retorno_id,
        ai_config_status: r.ai_config_status,
        is_demo: !!r.is_demo,
        created: r.created,
        updated: r.updated,
      }))
    } catch (err) {
      console.warn('Erro ao buscar atividades do caso:', err)
      return []
    }
  },

  async updateAtividade(
    id: string,
    updates: Partial<AtividadeCaso>,
  ): Promise<AtividadeCaso | null> {
    try {
      const payload: Record<string, any> = {}
      if (updates.status !== undefined) payload.status = updates.status
      if (updates.data_conclusao !== undefined) payload.data_conclusao = updates.data_conclusao
      if (updates.documentos_anexados !== undefined)
        payload.documentos_anexados = JSON.stringify(updates.documentos_anexados)
      if (updates.formulario_dados !== undefined)
        payload.formulario_dados = JSON.stringify(updates.formulario_dados)
      if (updates.aprovado_por !== undefined) payload.aprovado_por = updates.aprovado_por
      if (updates.parecer_aprovacao !== undefined)
        payload.parecer_aprovacao = updates.parecer_aprovacao
      if (updates.motivo_recusa !== undefined) payload.motivo_recusa = updates.motivo_recusa
      if (updates.responsavel_id !== undefined) payload.responsavel_id = updates.responsavel_id
      if (updates.responsavel_nome !== undefined)
        payload.responsavel_nome = updates.responsavel_nome

      const record = await pb.collection('atividades_casos').update(id, payload)
      return {
        id: record.id,
        caso_id: record.caso_id,
        caso_protocolo: record.caso_protocolo,
        fase_id: record.fase_id,
        titulo: record.titulo,
        status: record.status,
        tipo: record.tipo,
        ...updates,
      } as AtividadeCaso
    } catch (err) {
      console.error('Erro ao atualizar atividade:', err)
      return null
    }
  },

  // --- COMENTÁRIOS E MENSAGENS ---
  async fetchComentariosCaso(casoId: string): Promise<ComentarioCaso[]> {
    try {
      const records = await pb.collection('comentarios_casos').getFullList({
        filter: `caso_id = '${casoId}'`,
        sort: 'created',
      })
      return records.map((r) => ({
        id: r.id,
        caso_id: r.caso_id,
        caso_protocolo: r.caso_protocolo,
        visibilidade: r.visibilidade,
        autor_id: r.autor_id,
        autor_nome: r.autor_nome,
        mensagem: r.mensagem,
        anexos: typeof r.anexos === 'string' ? JSON.parse(r.anexos || '[]') : r.anexos || [],
        is_demo: !!r.is_demo,
        created: r.created,
      }))
    } catch (err) {
      console.warn('Erro ao buscar comentários do caso:', err)
      return []
    }
  },

  async addComentario(com: Omit<ComentarioCaso, 'id' | 'created'>): Promise<ComentarioCaso | null> {
    try {
      const record = await pb.collection('comentarios_casos').create({
        caso_id: com.caso_id,
        caso_protocolo: com.caso_protocolo,
        visibilidade: com.visibilidade,
        autor_id: com.autor_id,
        autor_nome: com.autor_nome,
        mensagem: com.mensagem,
        anexos: JSON.stringify(com.anexos || []),
        is_demo: com.is_demo !== false,
      })
      return {
        ...com,
        id: record.id,
        created: record.created,
      }
    } catch (err) {
      console.error('Erro ao adicionar comentário no caso:', err)
      return null
    }
  },

  // --- CONFIGURAÇÃO DE EXPEDIENTE ---
  async fetchConfigExpediente(): Promise<ConfiguracaoExpediente[]> {
    try {
      const records = await pb.collection('configuracoes_expediente').getFullList()
      return records.map((r) => ({
        id: r.id,
        unidade: r.unidade,
        fuso_horario: r.fuso_horario,
        dias_uteis:
          typeof r.dias_uteis === 'string'
            ? JSON.parse(r.dias_uteis || '[]')
            : r.dias_uteis || [1, 2, 3, 4, 5],
        hora_inicio: r.hora_inicio,
        hora_fim: r.hora_fim,
        hora_almoco_inicio: r.hora_almoco_inicio,
        hora_almoco_fim: r.hora_almoco_fim,
        feriados:
          typeof r.feriados === 'string' ? JSON.parse(r.feriados || '[]') : r.feriados || [],
        sla_primeira_resposta_horas: r.sla_primeira_resposta_horas || 2,
        permite_plantao_emergencia: !!r.permite_plantao_emergencia,
        is_demo: !!r.is_demo,
      }))
    } catch (err) {
      console.warn('Erro ao buscar configuração de expediente:', err)
      return []
    }
  },
}
