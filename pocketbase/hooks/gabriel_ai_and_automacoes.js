// Hook & API Routes para Assistente IA Nativo e Gestão de Automações Gabriel
// Roda no Skip Cloud PocketBase

// 1. Rota POST /backend/v1/gabriel-ai/chat
routerAdd(
  'POST',
  '/backend/v1/gabriel-ai/chat',
  (e) => {
    try {
      const body = e.requestInfo().body || {}
      const userId = e.auth?.id
      if (!userId) {
        return e.json(401, { error: 'Autenticação necessária' })
      }
      if (!body.message || !body.message.trim()) {
        return e.json(400, { error: 'Mensagem é obrigatória' })
      }

      // Invoca o agente nativo gabriel-copilot
      try {
        const result = $ai.agent('gabriel-copilot').chat({
          user_id: userId,
          conversation_id: body.conversation_id || null,
          message: body.message,
        })

        return e.json(200, {
          conversation_id: result.conversation_id,
          content: result.content,
          citations: result.citations || [],
          message_id: result.message_id,
        })
      } catch (aiErr) {
        console.log('Erro ao chamar agente gabriel-copilot:', aiErr)
        return e.json(503, {
          error:
            'O serviço de IA do Gabriel Copilot está aguardando configuração de credenciais no servidor. Utilize as alternativas operacionais do sistema.',
          status_ia: 'Aguardando configuração',
        })
      }
    } catch (err) {
      console.log('Erro na rota /backend/v1/gabriel-ai/chat:', err)
      return e.json(500, { error: 'Erro interno ao processar solicitação de IA' })
    }
  },
  $apis.requireAuth(),
)

// 2. Rota POST /backend/v1/automacoes/executar
// Registra e processa de forma persistente execuções de atividades automáticas
routerAdd(
  'POST',
  '/backend/v1/automacoes/executar',
  (e) => {
    try {
      const body = e.requestInfo().body || {}
      const casoId = body.caso_id
      const atividadeId = body.atividade_id
      const tipoAcao = body.tipo_acao || 'envio_whatsapp'

      if (!casoId) {
        return e.json(400, { error: 'caso_id é obrigatório' })
      }

      const execCol = $app.findCollectionByNameOrId('execucoes_automacoes')

      // Verificar se já existe execução confirmada para evitar duplicidade
      const existentes = $app.findRecordsByFilter(
        'execucoes_automacoes',
        "caso_id = '" + casoId + "' && tipo_acao = '" + tipoAcao + "' && status = 'Confirmada'",
        '-created',
        1,
        0,
      )

      if (existentes.length > 0) {
        return e.json(200, {
          aviso: 'Esta automação já foi executada e confirmada anteriormente para este caso.',
          execucao: {
            id: existentes[0].id,
            status: existentes[0].getString('status'),
            mensagem: existentes[0].getString('mensagem'),
          },
        })
      }

      // As integrações externas reais (WhatsApp API, Assinatura Eletrônica e Superlógica ERP)
      // requerem chaves e conectores de terceiros. Sem credenciais, registramos formalmente
      // como "Aguardando configuração" e geramos fallback humano, NUNCA simulando falsamente.
      const nowIso = new Date().toISOString()
      const rec = new Record(execCol)
      rec.set('caso_id', casoId)
      rec.set('caso_protocolo', body.caso_protocolo || 'GAB-CASO')
      rec.set('atividade_id', atividadeId || '')
      rec.set('tipo_acao', tipoAcao)
      rec.set('status', 'Aguardando configuração')
      rec.set(
        'mensagem',
        'Integração externa para "' +
          tipoAcao +
          '" aguarda credenciais ativas do provedor. Ação encaminhada para execução humana na esteira.',
      )
      rec.set('tentativas', 1)
      rec.set('payload', JSON.stringify(body.payload || {}))
      rec.set('executado_em', nowIso.replace('T', ' ').slice(0, 19))
      $app.save(rec)

      return e.json(200, {
        sucesso: true,
        status: 'Aguardando configuração',
        mensagem:
          'Ação registrada no servidor. Provedor externo não configurado; encaminhado para tratamento humano.',
        execucao_id: rec.id,
      })
    } catch (err) {
      console.log('Erro ao executar automação:', err)
      return e.json(500, { error: 'Falha ao processar execução de automação' })
    }
  },
  $apis.requireAuth(),
)
