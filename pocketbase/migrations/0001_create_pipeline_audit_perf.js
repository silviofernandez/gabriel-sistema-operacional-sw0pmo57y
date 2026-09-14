migrate(
  (app) => {
    // 1. log_auditoria (IMUTÁVEL — insert permitido, update e delete proibidos)
    const logAuditoria = new Collection({
      name: 'log_auditoria',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: null, // Proibido alterar log
      deleteRule: null, // Proibido deletar log
      fields: [
        { name: 'colaborador_id', type: 'text', required: true },
        { name: 'colaborador_nome', type: 'text', required: true },
        {
          name: 'acao_tipo',
          type: 'select',
          required: true,
          values: [
            'visualizou',
            'visualizou_adjacente',
            'editou',
            'avancou_etapa',
            'criou_tarefa',
            'concluiu_tarefa',
            'reabriu_tarefa',
            'acessou_com_permissao_extra',
            'tentou_acesso_negado',
          ],
          maxSelect: 1,
        },
        { name: 'etapa_id', type: 'text' },
        { name: 'etapa_propria', type: 'bool' },
        { name: 'contrato_id', type: 'text' },
        { name: 'dados_antes', type: 'json' },
        { name: 'dados_depois', type: 'json' },
        { name: 'ip', type: 'text' },
        { name: 'dispositivo', type: 'text' },
        { name: 'autorizado_por', type: 'text' },
        { name: 'motivo', type: 'text' },
        { name: 'timestamp', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_audit_colab ON log_auditoria (colaborador_id, created DESC)',
        'CREATE INDEX idx_audit_acao ON log_auditoria (acao_tipo)',
        'CREATE INDEX idx_audit_etapa ON log_auditoria (etapa_id)',
      ],
    })
    app.save(logAuditoria)

    // 2. etapas_permissoes
    const etapasPermissoes = new Collection({
      name: 'etapas_permissoes',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'colaborador_id', type: 'text', required: true },
        { name: 'etapa_id', type: 'text', required: true },
        {
          name: 'tipo',
          type: 'select',
          required: true,
          values: ['permanente', 'temporaria'],
          maxSelect: 1,
        },
        { name: 'data_inicio', type: 'text' },
        { name: 'data_fim', type: 'text' },
        { name: 'motivo', type: 'text' },
        { name: 'autorizado_por', type: 'text' },
        { name: 'is_active', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_etapas_perm_colab ON etapas_permissoes (colaborador_id)'],
    })
    app.save(etapasPermissoes)

    // 3. metricas_diarias
    const metricasDiarias = new Collection({
      name: 'metricas_diarias',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'colaborador_id', type: 'text', required: true },
        { name: 'colaborador_nome', type: 'text' },
        { name: 'data', type: 'text', required: true },
        { name: 'tarefas_total', type: 'number' },
        { name: 'tarefas_no_prazo', type: 'number' },
        { name: 'tarefas_atrasadas', type: 'number' },
        { name: 'tarefas_reabertas', type: 'number' },
        { name: 'tempo_medio_conclusao_min', type: 'number' },
        { name: 'acessos_negados', type: 'number' },
        { name: 'acessos_adjacentes', type: 'number' },
        { name: 'score_sla', type: 'number' },
        { name: 'score_qualidade', type: 'number' },
        { name: 'score_volume', type: 'number' },
        { name: 'score_comportamento', type: 'number' },
        { name: 'score_total', type: 'number' },
        {
          name: 'classificacao',
          type: 'select',
          values: ['Excelente', 'Bom', 'Atenção', 'Crítico'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_metricas_colab_data ON metricas_diarias (colaborador_id, data)'],
    })
    app.save(metricasDiarias)

    // 4. registros_formais (acertos e ocorrências)
    const registrosFormais = new Collection({
      name: 'registros_formais',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'colaborador_id', type: 'text', required: true },
        { name: 'colaborador_nome', type: 'text' },
        {
          name: 'tipo',
          type: 'select',
          required: true,
          values: ['acerto', 'ocorrencia'],
          maxSelect: 1,
        },
        { name: 'descricao', type: 'text', required: true },
        { name: 'contrato_id', type: 'text' },
        {
          name: 'impacto',
          type: 'select',
          required: true,
          values: ['Baixo', 'Médio', 'Alto', 'Crítico'],
          maxSelect: 1,
        },
        { name: 'registrado_por', type: 'text' },
        {
          name: 'visibilidade',
          type: 'select',
          required: true,
          values: ['todos', 'gestores'],
          maxSelect: 1,
        },
        { name: 'tipo_erro', type: 'text' },
        { name: 'plano_acao', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_regform_colab ON registros_formais (colaborador_id)'],
    })
    app.save(registrosFormais)

    // 5. coberturas (fluxo de ausência e substituição temporária)
    const coberturas = new Collection({
      name: 'coberturas',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'colaborador_ausente_id', type: 'text', required: true },
        { name: 'colaborador_ausente_nome', type: 'text' },
        { name: 'colaborador_substituto_id', type: 'text', required: true },
        { name: 'colaborador_substituto_nome', type: 'text' },
        { name: 'etapas_cobertas', type: 'json' }, // array de stage ids/names
        { name: 'data_inicio', type: 'text', required: true },
        { name: 'data_fim_prevista', type: 'text', required: true },
        { name: 'data_fim_real', type: 'text' },
        { name: 'motivo', type: 'text' },
        { name: 'autorizado_por', type: 'text' },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['ativa', 'concluida', 'cancelada'],
          maxSelect: 1,
        },
        { name: 'relatorio_acoes', type: 'json' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_coberturas_sub ON coberturas (colaborador_substituto_id, status)',
      ],
    })
    app.save(coberturas)

    // 6. notificacoes (para alertas e fila WhatsApp)
    const notificacoes = new Collection({
      name: 'notificacoes',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'destinatario_id', type: 'text' },
        { name: 'destinatario_nome', type: 'text' },
        { name: 'telefone', type: 'text' },
        { name: 'mensagem', type: 'text', required: true },
        {
          name: 'tipo',
          type: 'select',
          required: true,
          values: [
            'whatsapp_parabens',
            'whatsapp_sla_alerta',
            'whatsapp_cobertura',
            'whatsapp_gestor_tentativa',
            'whatsapp_gestor_retrabalho',
            'whatsapp_gestor_destaque',
            'whatsapp_retorno_cobertura',
            'sistema',
          ],
          maxSelect: 1,
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['pendente', 'enviada', 'lida'],
          maxSelect: 1,
        },
        { name: 'enviada_em', type: 'text' },
        { name: 'metadata', type: 'json' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_notif_dest ON notificacoes (destinatario_id, status)'],
    })
    app.save(notificacoes)
  },
  (app) => {
    const toDelete = [
      'notificacoes',
      'coberturas',
      'registros_formais',
      'metricas_diarias',
      'etapas_permissoes',
      'log_auditoria',
    ]
    for (const name of toDelete) {
      try {
        const col = app.findCollectionByNameOrId(name)
        app.delete(col)
      } catch (_) {}
    }
  },
)
