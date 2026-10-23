/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    // 1. Definir o agente nativo do Skip Cloud para a Gabriel Imobiliária
    $ai.agents.define(app, {
      slug: 'gabriel-copilot',
      name: 'Gabriel Copilot — Central & Processos',
      description:
        'Assistente de IA especialista em processos imobiliários, locação, contratos, manutenção e atendimento da Gabriel Imobiliária.',
      systemPrompt:
        'Você é o assistente inteligente oficial da Gabriel Imobiliária (atuando em Jaú, Pederneiras e Lençóis Paulista). Seu objetivo é auxiliar colaboradores e gestores a consultar o andamento de casos, identificar pendências e bloqueios, resumir solicitações, sugerir respostas em tom profissional e acolhedor ao cliente, e sugerir novos desenhos de processos operacionais com etapas, atividades humanas e automações. Distinga sempre claramente dados confirmados no sistema de estimativas ou dados indisponíveis. Se uma funcionalidade depender de integração externa não configurada (ex: envio real de WhatsApp via API ou chamada direta a ERP externo), informe com clareza seu status.',
      tier: 'fast',
      tools: [
        { collection: 'casos_processos', perms: { list: true, read: true } },
        { collection: 'atividades_casos', perms: { list: true, read: true } },
        { collection: 'modelos_processos', perms: { list: true, read: true } },
        { collection: 'comentarios_casos', perms: { list: true, read: true } },
        { collection: 'configuracoes_empresa', perms: { list: true, read: true } },
      ],
      memory: [
        {
          type: 'text',
          payload: {
            text: 'A Gabriel Imobiliária opera em Jaú, Pederneiras e Lençóis Paulista. O SLA padrão para primeira resposta útil ao cliente é de até 2 horas úteis. Casos de reclamação possuem alçada obrigatória de gestor. Os processos possuem atividades divididas em Ação Humana (👤) e Automática (⚡).',
          },
        },
        {
          type: 'text',
          payload: {
            text: 'Fluxo de Formalização de Locação: Etapa 1 Proposta; Etapa 2 Formalização e aceite (envio por WhatsApp pré-preenchido); Etapa 3 Documentação e análise (envio formulário WhatsApp + consulta de score CPF); Etapa 4 Cadastro no ERP (cadastrar proprietário, locatário, fiador e imóvel automaticamente; criação do contrato e card de vistoria de entrada).',
          },
        },
        {
          type: 'text',
          payload: {
            text: 'Fluxo de Manutenção Predial: Abertura (abrir chamado e vincular solicitante, anexar fotos à OS, triar urgência); Orçamento (consultar prestadores, registrar orçamentos, comparar 3 orçamentos e selecionar vencedor); Aprovação (enviar orçamento para aprovação do proprietário, registrar aceite ou recusa); segue para execução, conferência com fotos e despesa.',
          },
        },
      ],
    })

    // 2. Criar coleção de execuções de automação / jobs para rastrear o status real no banco
    if (!app.hasTable('execucoes_automacoes')) {
      const col = new Collection({
        name: 'execucoes_automacoes',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          { name: 'caso_id', type: 'text', required: true },
          { name: 'caso_protocolo', type: 'text', required: true },
          { name: 'atividade_id', type: 'text' },
          { name: 'tipo_acao', type: 'text', required: true },
          {
            name: 'status',
            type: 'select',
            required: true,
            values: [
              'Configurada e disponível',
              'Aguardando configuração',
              'Em execução',
              'Confirmada',
              'Com falha',
            ],
            maxSelect: 1,
          },
          { name: 'mensagem', type: 'text' },
          { name: 'tentativas', type: 'number' },
          { name: 'payload', type: 'json' },
          { name: 'resultado', type: 'json' },
          { name: 'executado_em', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
      })
      app.save(col)
    }
  },
  (app) => {
    try {
      $ai.agents.delete(app, 'gabriel-copilot')
    } catch (_) {}
    try {
      const col = app.findCollectionByNameOrId('execucoes_automacoes')
      app.delete(col)
    } catch (_) {}
  },
)
