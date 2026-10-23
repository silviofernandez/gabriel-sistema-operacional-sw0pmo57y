migrate(
  (app) => {
    // 1. modelos_processos
    const modelosProcessos = new Collection({
      name: 'modelos_processos',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'codigo', type: 'text', required: true },
        { name: 'nome', type: 'text', required: true },
        { name: 'descricao', type: 'text' },
        { name: 'categoria', type: 'text' },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['rascunho', 'publicado', 'arquivado'],
          maxSelect: 1,
        },
        { name: 'versao_atual', type: 'number' },
        { name: 'fases', type: 'json' }, // array de fases e regras
        { name: 'configuracao_sla', type: 'json' },
        { name: 'criado_por', type: 'text' },
        { name: 'publicado_em', type: 'text' },
        { name: 'is_demo', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_mod_proc_cod ON modelos_processos (codigo)',
        'CREATE INDEX idx_mod_proc_status ON modelos_processos (status)',
      ],
    })
    app.save(modelosProcessos)

    // 2. versoes_processos (histórico imutável de publicações)
    const versoesProcessos = new Collection({
      name: 'versoes_processos',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'modelo_id', type: 'text', required: true },
        { name: 'versao', type: 'number', required: true },
        { name: 'snapshot', type: 'json', required: true }, // cópia integral do modelo e fases
        { name: 'nota_versao', type: 'text' },
        { name: 'publicado_por', type: 'text' },
        { name: 'is_demo', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_ver_proc_mod ON versoes_processos (modelo_id, versao)'],
    })
    app.save(versoesProcessos)

    // 3. casos_processos (casos em execução)
    const casosProcessos = new Collection({
      name: 'casos_processos',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'protocolo', type: 'text', required: true },
        { name: 'titulo', type: 'text', required: true },
        { name: 'modelo_id', type: 'text', required: true },
        { name: 'versao_modelo', type: 'number', required: true },
        {
          name: 'unidade',
          type: 'select',
          required: true,
          values: ['Jaú', 'Pederneiras', 'Lençóis Paulista'],
          maxSelect: 1,
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: [
            'Novo',
            'Em atendimento',
            'Aguardando cliente',
            'Aguardando proprietário',
            'Aguardando prestador',
            'Aguardando aprovação interna',
            'Resolvido',
            'Cancelado',
            'Reaberto',
          ],
          maxSelect: 1,
        },
        {
          name: 'prioridade',
          type: 'select',
          required: true,
          values: ['Baixa', 'Média', 'Alta', 'Urgente'],
          maxSelect: 1,
        },
        { name: 'justificativa_prioridade', type: 'text' },
        { name: 'fase_atual_id', type: 'text' },
        { name: 'fase_atual_nome', type: 'text' },
        { name: 'solicitante_nome', type: 'text', required: true },
        { name: 'solicitante_email', type: 'text' },
        { name: 'solicitante_telefone', type: 'text' },
        {
          name: 'canal_origem',
          type: 'select',
          values: ['WhatsApp', 'Site', 'Telefone', 'Balcão', 'E-mail', 'Interno'],
          maxSelect: 1,
        },
        { name: 'cliente_id', type: 'text' },
        { name: 'cliente_nome', type: 'text' },
        { name: 'imovel_id', type: 'text' },
        { name: 'imovel_titulo', type: 'text' },
        { name: 'contrato_id', type: 'text' },
        { name: 'responsavel_id', type: 'text' },
        { name: 'responsavel_nome', type: 'text' },
        { name: 'equipe', type: 'text' },
        { name: 'proxima_acao', type: 'text' },
        { name: 'data_abertura', type: 'text' },
        { name: 'prazo_primeira_resposta', type: 'text' },
        { name: 'data_primeira_resposta_humana', type: 'text' },
        { name: 'prazo_resolucao', type: 'text' },
        { name: 'prazo_prometido_cliente', type: 'text' },
        { name: 'data_ultimo_retorno_cliente', type: 'text' },
        { name: 'motivo_pausa', type: 'text' },
        { name: 'motivo_cancelamento', type: 'text' },
        { name: 'motivo_reabertura', type: 'text' },
        { name: 'caso_origem_protocolo', type: 'text' },
        { name: 'casos_relacionados', type: 'json' }, // array de protocolos
        { name: 'dados_formulario', type: 'json' },
        { name: 'bloqueios_pendentes', type: 'json' }, // documentos ou aprovações faltantes
        { name: 'historico_etapas', type: 'json' },
        { name: 'is_demo', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_casos_proc_proto ON casos_processos (protocolo)',
        'CREATE INDEX idx_casos_proc_status ON casos_processos (status)',
        'CREATE INDEX idx_casos_proc_unidade ON casos_processos (unidade)',
        'CREATE INDEX idx_casos_proc_resp ON casos_processos (responsavel_id)',
      ],
    })
    app.save(casosProcessos)

    // 4. atividades_casos (tarefas/atividades filhas do caso)
    const atividadesCasos = new Collection({
      name: 'atividades_casos',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'caso_id', type: 'text', required: true },
        { name: 'caso_protocolo', type: 'text', required: true },
        { name: 'fase_id', type: 'text', required: true },
        { name: 'titulo', type: 'text', required: true },
        { name: 'descricao', type: 'text' },
        {
          name: 'tipo',
          type: 'select',
          required: true,
          values: [
            'Humana',
            'Automação por regra',
            'IA',
            'Aprovação',
            'Formulário',
            'Aguardar evento externo',
          ],
          maxSelect: 1,
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: [
            'Pendente',
            'Em Andamento',
            'Aguardando aprovação',
            'Aguardando terceiros',
            'Concluída',
            'Recusada',
            'Atrasada',
          ],
          maxSelect: 1,
        },
        { name: 'responsavel_tipo', type: 'text' }, // pessoa, equipe, funcao, sistema
        { name: 'responsavel_id', type: 'text' },
        { name: 'responsavel_nome', type: 'text' },
        { name: 'funcao_responsavel', type: 'text' }, // Atendimento, Gestor, Financeiro, Contratos, etc.
        { name: 'substituto_id', type: 'text' },
        { name: 'prazo', type: 'text' },
        { name: 'data_conclusao', type: 'text' },
        { name: 'depende_de_atividades', type: 'json' }, // ids de atividades pré-requisito
        { name: 'is_paralela', type: 'bool' },
        { name: 'condicoes_conclusao', type: 'json' },
        { name: 'documentos_obrigatorios', type: 'json' },
        { name: 'documentos_anexados', type: 'json' },
        { name: 'formulario_dados', type: 'json' },
        { name: 'aprovado_por', type: 'text' },
        { name: 'parecer_aprovacao', type: 'text' },
        { name: 'motivo_recusa', type: 'text' },
        { name: 'etapa_retorno_id', type: 'text' }, // etapa para a qual retornar em caso de recusa
        { name: 'ai_config_status', type: 'text' }, // "Aguardando configuração" na Etapa 1
        { name: 'is_demo', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_ativ_caso ON atividades_casos (caso_id)',
        'CREATE INDEX idx_ativ_resp ON atividades_casos (responsavel_id, status)',
        'CREATE INDEX idx_ativ_proto ON atividades_casos (caso_protocolo)',
      ],
    })
    app.save(atividadesCasos)

    // 5. comentarios_casos (comentários internos separados de mensagens ao cliente)
    const comentariosCasos = new Collection({
      name: 'comentarios_casos',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'caso_id', type: 'text', required: true },
        { name: 'caso_protocolo', type: 'text', required: true },
        {
          name: 'visibilidade',
          type: 'select',
          required: true,
          values: ['interno', 'externo_cliente'],
          maxSelect: 1,
        },
        { name: 'autor_id', type: 'text', required: true },
        { name: 'autor_nome', type: 'text', required: true },
        { name: 'mensagem', type: 'text', required: true },
        { name: 'anexos', type: 'json' },
        { name: 'is_demo', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_coment_caso ON comentarios_casos (caso_id, created DESC)'],
    })
    app.save(comentariosCasos)

    // 6. configuracoes_expediente (horário útil, feriados e regras de contagem SLA)
    const confExpediente = new Collection({
      name: 'configuracoes_expediente',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'unidade', type: 'text', required: true }, // 'Geral', 'Jaú', 'Pederneiras', 'Lençóis Paulista'
        { name: 'fuso_horario', type: 'text', required: true }, // America/Sao_Paulo
        { name: 'dias_uteis', type: 'json', required: true }, // [1,2,3,4,5] (seg-sex)
        { name: 'hora_inicio', type: 'text', required: true }, // "08:30"
        { name: 'hora_fim', type: 'text', required: true }, // "18:00"
        { name: 'hora_almoco_inicio', type: 'text' }, // "12:00"
        { name: 'hora_almoco_fim', type: 'text' }, // "13:30"
        { name: 'feriados', type: 'json' }, // lista de datas YYYY-MM-DD
        { name: 'sla_primeira_resposta_horas', type: 'number' }, // padrão 2
        { name: 'permite_plantao_emergencia', type: 'bool' },
        { name: 'is_demo', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_conf_exp_unidade ON configuracoes_expediente (unidade)'],
    })
    app.save(confExpediente)
  },
  (app) => {
    const toDelete = [
      'configuracoes_expediente',
      'comentarios_casos',
      'atividades_casos',
      'casos_processos',
      'versoes_processos',
      'modelos_processos',
    ]
    for (const name of toDelete) {
      try {
        const col = app.findCollectionByNameOrId(name)
        app.delete(col)
      } catch (_) {}
    }
  },
)
