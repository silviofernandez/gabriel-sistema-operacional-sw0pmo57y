migrate(
  (app) => {
    // Coleção tarefas_ordens para gerenciamento centralizado de tarefas pelo Master
    const tarefas = new Collection({
      name: 'tarefas_ordens',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'titulo', type: 'text', required: true },
        { name: 'descricao', type: 'text' },
        { name: 'responsavel_id', type: 'text', required: true },
        { name: 'responsavel_nome', type: 'text' },
        { name: 'etapa_id', type: 'text', required: true }, // "1" .. "12"
        { name: 'contrato_id', type: 'text' },
        { name: 'imovel_titulo', type: 'text' },
        {
          name: 'prioridade',
          type: 'select',
          required: true,
          values: ['Baixa', 'Média', 'Alta', 'Crítica'],
          maxSelect: 1,
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['Pendente', 'Em Andamento', 'Concluída', 'Atrasada'],
          maxSelect: 1,
        },
        {
          name: 'tipo',
          type: 'select',
          values: [
            'Operacional',
            'Concierge',
            'Demanda',
            'Manutenção',
            'Vistoria',
            'Administrativo',
          ],
          maxSelect: 1,
        },
        { name: 'prazo', type: 'text' },
        { name: 'sla_horas', type: 'number' },
        { name: 'criado_por', type: 'text' },
        { name: 'ai_urgency', type: 'text' },
        { name: 'ai_risk_flag', type: 'bool' },
        { name: 'checklists', type: 'json' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_tarefas_resp ON tarefas_ordens (responsavel_id, status)',
        'CREATE INDEX idx_tarefas_etapa ON tarefas_ordens (etapa_id)',
      ],
    })
    app.save(tarefas)

    // Seed de tarefas iniciais atribuídas pelo Master Carlos Silva aos colaboradores
    const colTarefas = app.findCollectionByNameOrId('tarefas_ordens')
    const sampleTarefas = [
      // Alice Santos (u4) - Etapa 4 (Vistoria Entrada) & Etapa 8 (Manutenções)
      {
        titulo: 'Vistoria de Entrada - CTR-001 (Ap 102)',
        descricao:
          'Realizar vistoria detalhada de entrada com registro fotográfico e checklist elétrico.',
        responsavel_id: 'u4',
        responsavel_nome: 'Alice Santos',
        etapa_id: '4',
        contrato_id: 'CTR-001',
        imovel_titulo: 'Ap 102 - Bela Vista',
        prioridade: 'Alta',
        status: 'Em Andamento',
        tipo: 'Vistoria',
        prazo: '2026-09-17 14:00',
        sla_horas: 24,
        criado_por: 'Carlos Silva (Master)',
        ai_urgency: 'Alta',
        ai_risk_flag: false,
        checklists: [
          { id: 'c1', text: 'Fotografar quadro de luz', done: true },
          { id: 'c2', text: 'Testar torneiras e descargas', done: false },
          { id: 'c3', text: 'Conferir pintura geral', done: false },
        ],
      },
      {
        titulo: 'Ordem de Reparo Hidráulico - CTR-003',
        descricao: 'Verificar vazamento reportado na tubulação do banheiro social.',
        responsavel_id: 'u4',
        responsavel_nome: 'Alice Santos',
        etapa_id: '8',
        contrato_id: 'CTR-003',
        imovel_titulo: 'Sala Comercial - Centro',
        prioridade: 'Média',
        status: 'Pendente',
        tipo: 'Manutenção',
        prazo: '2026-09-18 10:00',
        sla_horas: 48,
        criado_por: 'Carlos Silva (Master)',
        ai_urgency: 'Normal',
        ai_risk_flag: false,
        checklists: [
          { id: 'c4', text: 'Acionar encanador credenciado', done: false },
          { id: 'c5', text: 'Coletar nota fiscal do reparo', done: false },
        ],
      },

      // João Paulo (u3) - Etapa 1 (Captação), 2 (Documentação), 3 (Formalização)
      {
        titulo: 'Análise de Score & Garantias - CTR-001',
        descricao: 'Validar comprovantes de renda e aprovação junto à seguradora do fiador.',
        responsavel_id: 'u3',
        responsavel_nome: 'João Paulo',
        etapa_id: '2',
        contrato_id: 'CTR-001',
        imovel_titulo: 'Ap 102 - Bela Vista',
        prioridade: 'Crítica',
        status: 'Atrasada',
        tipo: 'Operacional',
        prazo: '2026-09-16 11:00',
        sla_horas: 12,
        criado_por: 'Carlos Silva (Master)',
        ai_urgency: 'Crítica',
        ai_risk_flag: true,
        checklists: [
          { id: 'c6', text: 'Validar DocuSign Fiador', done: false },
          { id: 'c7', text: 'Consulta Serasa e Score 360', done: true },
        ],
      },
      {
        titulo: 'Elaboração de Minuta Contratual - CTR-004',
        descricao: 'Inserir cláusula especial de carência de 30 dias para benfeitorias.',
        responsavel_id: 'u3',
        responsavel_nome: 'João Paulo',
        etapa_id: '3',
        contrato_id: 'CTR-004',
        imovel_titulo: 'Ap 102 - Bela Vista',
        prioridade: 'Alta',
        status: 'Pendente',
        tipo: 'Administrativo',
        prazo: '2026-09-17 18:00',
        sla_horas: 24,
        criado_por: 'Carlos Silva (Master)',
        ai_urgency: 'Normal',
        ai_risk_flag: false,
        checklists: [],
      },

      // Camila Torres (u6) - Etapa 6 (Entrega Chaves), 7 (Concierge), 10 (Renovações)
      {
        titulo: 'Check-in D+5 Boas-Vindas Inquilino - CTR-001',
        descricao: 'Contato humanizado de acolhimento pós-mudança e conferência de adaptação.',
        responsavel_id: 'u6',
        responsavel_nome: 'Camila Torres',
        etapa_id: '7',
        contrato_id: 'CTR-001',
        imovel_titulo: 'Ap 102 - Bela Vista',
        prioridade: 'Alta',
        status: 'Em Andamento',
        tipo: 'Concierge',
        prazo: '2026-09-17 16:00',
        sla_horas: 24,
        criado_por: 'Carlos Silva (Master)',
        ai_urgency: 'Alta',
        ai_risk_flag: false,
        checklists: [
          { id: 'c8', text: 'Mensagem de boas-vindas no WhatsApp', done: true },
          { id: 'c9', text: 'Confirmar funcionamento de gás e água', done: false },
        ],
      },
      {
        titulo: 'Sondagem de Renovação Proativa - CTR-002',
        descricao: 'Contrato a 90 dias do vencimento. Propor renovação com reajuste pelo IPCA.',
        responsavel_id: 'u6',
        responsavel_nome: 'Camila Torres',
        etapa_id: '10',
        contrato_id: 'CTR-002',
        imovel_titulo: 'Casa 4 - Pinheiros',
        prioridade: 'Média',
        status: 'Pendente',
        tipo: 'Concierge',
        prazo: '2026-09-19 12:00',
        sla_horas: 72,
        criado_por: 'Carlos Silva (Master)',
        ai_urgency: 'Normal',
        ai_risk_flag: false,
        checklists: [],
      },

      // Ricardo Mendes (u5) - Etapa 9 (Financeiro) & Etapa 12 (Rescisão)
      {
        titulo: 'Conciliação de Boleto e Repasse Locador - CTR-001',
        descricao:
          'Conferir liquidação bancária e emitir ordem de repasse com taxa de administração.',
        responsavel_id: 'u5',
        responsavel_nome: 'Ricardo Mendes',
        etapa_id: '9',
        contrato_id: 'CTR-001',
        imovel_titulo: 'Ap 102 - Bela Vista',
        prioridade: 'Alta',
        status: 'Pendente',
        tipo: 'Operacional',
        prazo: '2026-09-17 15:00',
        sla_horas: 24,
        criado_por: 'Carlos Silva (Master)',
        ai_urgency: 'Normal',
        ai_risk_flag: false,
        checklists: [],
      },

      // Marina Costa (u2) - Etapa 5 (Assinatura) & Etapa 11 (Vistoria de Saída)
      {
        titulo: 'Coleta de Assinatura Digital e Seguro - CTR-003',
        descricao: 'Finalizar via Clicksign e ativar apólice de seguro contra incêndio.',
        responsavel_id: 'u2',
        responsavel_nome: 'Marina Costa',
        etapa_id: '5',
        contrato_id: 'CTR-003',
        imovel_titulo: 'Sala Comercial - Centro',
        prioridade: 'Média',
        status: 'Em Andamento',
        tipo: 'Administrativo',
        prazo: '2026-09-17 17:00',
        sla_horas: 24,
        criado_por: 'Carlos Silva (Master)',
        ai_urgency: 'Normal',
        ai_risk_flag: false,
        checklists: [],
      },
    ]

    for (const t of sampleTarefas) {
      const rec = new Record(colTarefas)
      rec.set('titulo', t.titulo)
      rec.set('descricao', t.descricao)
      rec.set('responsavel_id', t.responsavel_id)
      rec.set('responsavel_nome', t.responsavel_nome)
      rec.set('etapa_id', t.etapa_id)
      rec.set('contrato_id', t.contrato_id)
      rec.set('imovel_titulo', t.imovel_titulo)
      rec.set('prioridade', t.prioridade)
      rec.set('status', t.status)
      rec.set('tipo', t.tipo)
      rec.set('prazo', t.prazo)
      rec.set('sla_horas', t.sla_horas)
      rec.set('criado_por', t.criado_por)
      rec.set('ai_urgency', t.ai_urgency)
      rec.set('ai_risk_flag', t.ai_risk_flag)
      rec.set('checklists', t.checklists)
      app.save(rec)
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('tarefas_ordens')
      app.delete(col)
    } catch (_) {}
  },
)
