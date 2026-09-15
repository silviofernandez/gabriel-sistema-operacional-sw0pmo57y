migrate(
  (app) => {
    // 1. Atualizar log_auditoria adicionando "gerenciou_meta" e "atingiu_meta" aos values de acao_tipo
    const logAuditCol = app.findCollectionByNameOrId('log_auditoria')
    const acaoField = logAuditCol.fields.getByName('acao_tipo')
    if (acaoField) {
      acaoField.values = [
        'visualizou',
        'visualizou_adjacente',
        'editou',
        'avancou_etapa',
        'criou_tarefa',
        'concluiu_tarefa',
        'reabriu_tarefa',
        'acessou_com_permissao_extra',
        'tentou_acesso_negado',
        'gerenciou_meta',
        'atingiu_meta',
      ]
      app.save(logAuditCol)
    }

    // 2. Criar coleção metas_premios
    const metasPremios = new Collection({
      name: 'metas_premios',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'etapa_id', type: 'text', required: true }, // "1" .. "12"
        { name: 'titulo', type: 'text', required: true },
        { name: 'descricao', type: 'text' },
        {
          name: 'tipo_metrica',
          type: 'select',
          required: true,
          values: ['tarefas_concluidas', 'sla_prazo_pct', 'score_minimo', 'contratos_avancados'],
          maxSelect: 1,
        },
        { name: 'valor_alvo', type: 'number', required: true },
        { name: 'premio_valor', type: 'number', required: true }, // em R$
        { name: 'data_inicio', type: 'text', required: true }, // YYYY-MM-DD
        { name: 'data_fim', type: 'text', required: true }, // YYYY-MM-DD
        { name: 'criado_por', type: 'text' },
        { name: 'is_active', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_metas_etapa ON metas_premios (etapa_id)',
        'CREATE INDEX idx_metas_datas ON metas_premios (data_inicio, data_fim)',
      ],
    })
    app.save(metasPremios)
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('metas_premios')
      app.delete(col)
    } catch (_) {}

    try {
      const logAuditCol = app.findCollectionByNameOrId('log_auditoria')
      const acaoField = logAuditCol.fields.getByName('acao_tipo')
      if (acaoField) {
        acaoField.values = [
          'visualizou',
          'visualizou_adjacente',
          'editou',
          'avancou_etapa',
          'criou_tarefa',
          'concluiu_tarefa',
          'reabriu_tarefa',
          'acessou_com_permissao_extra',
          'tentou_acesso_negado',
        ]
        app.save(logAuditCol)
      }
    } catch (_) {}
  },
)
