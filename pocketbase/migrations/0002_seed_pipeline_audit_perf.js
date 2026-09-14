migrate(
  (app) => {
    // 1. Seed de permissões permanentes por etapa
    // 12 Etapas:
    // 1: Captação / Proposta
    // 2: Documentação & Score
    // 3: Formalização do Contrato
    // 4: Vistoria de Entrada
    // 5: Assinatura & Ativação
    // 6: Entrega de Chaves
    // 7: Régua do Inquilino (Concierge)
    // 8: Manutenções & Reparos
    // 9: Financeiro & Repasses
    // 10: Renovações
    // 11: Desocupação & Vistoria de Saída
    // 12: Rescisão & Acerto Final

    const colEtapasPerm = app.findCollectionByNameOrId('etapas_permissoes')
    const colAuditoria = app.findCollectionByNameOrId('log_auditoria')
    const colMetricas = app.findCollectionByNameOrId('metricas_diarias')
    const colRegistros = app.findCollectionByNameOrId('registros_formais')
    const colCoberturas = app.findCollectionByNameOrId('coberturas')
    const colNotif = app.findCollectionByNameOrId('notificacoes')

    // Atribuições permanentes iniciais:
    // Alice Santos (u4): 4 (Vistoria de Entrada), 8 (Manutenções & Reparos)
    // João Paulo (u3): 1 (Captação / Proposta), 2 (Documentação & Score), 3 (Formalização)
    // Camila Torres (u6): 6 (Entrega de Chaves), 7 (Régua do Inquilino), 10 (Renovações)
    // Ricardo Mendes (u5): 9 (Financeiro & Repasses), 12 (Rescisão & Acerto Final)
    // Marina Costa (u2): 5 (Assinatura & Ativação), 11 (Desocupação & Vistoria de Saída)
    // Carlos Silva (u1): Gestor/Admin com supervisão

    const initialPerms = [
      { colabId: 'u4', colabNome: 'Alice Santos', etapa: '4', tipo: 'permanente', autor: 'u1' },
      { colabId: 'u4', colabNome: 'Alice Santos', etapa: '8', tipo: 'permanente', autor: 'u1' },
      { colabId: 'u3', colabNome: 'João Paulo', etapa: '1', tipo: 'permanente', autor: 'u1' },
      { colabId: 'u3', colabNome: 'João Paulo', etapa: '2', tipo: 'permanente', autor: 'u1' },
      { colabId: 'u3', colabNome: 'João Paulo', etapa: '3', tipo: 'permanente', autor: 'u1' },
      { colabId: 'u6', colabNome: 'Camila Torres', etapa: '6', tipo: 'permanente', autor: 'u1' },
      { colabId: 'u6', colabNome: 'Camila Torres', etapa: '7', tipo: 'permanente', autor: 'u1' },
      { colabId: 'u6', colabNome: 'Camila Torres', etapa: '10', tipo: 'permanente', autor: 'u1' },
      { colabId: 'u5', colabNome: 'Ricardo Mendes', etapa: '9', tipo: 'permanente', autor: 'u1' },
      { colabId: 'u5', colabNome: 'Ricardo Mendes', etapa: '12', tipo: 'permanente', autor: 'u1' },
      { colabId: 'u2', colabNome: 'Marina Costa', etapa: '5', tipo: 'permanente', autor: 'u1' },
      { colabId: 'u2', colabNome: 'Marina Costa', etapa: '11', tipo: 'permanente', autor: 'u1' },
    ]

    for (const perm of initialPerms) {
      const rec = new Record(colEtapasPerm)
      rec.set('colaborador_id', perm.colabId)
      rec.set('etapa_id', perm.etapa)
      rec.set('tipo', perm.tipo)
      rec.set('data_inicio', '2026-01-01')
      rec.set('motivo', 'Atribuição permanente de função')
      rec.set('autorizado_por', perm.autor)
      rec.set('is_active', true)
      app.save(rec)
    }

    // Permissão temporária ativa para João Paulo cobrindo Vistoria de Entrada (4)
    const tempPerm = new Record(colEtapasPerm)
    tempPerm.set('colaborador_id', 'u3')
    tempPerm.set('etapa_id', '4')
    tempPerm.set('tipo', 'temporaria')
    tempPerm.set('data_inicio', '2026-09-14')
    tempPerm.set('data_fim', '2026-09-21')
    tempPerm.set('motivo', 'Cobertura de ausência de Alice Santos')
    tempPerm.set('autorizado_por', 'Carlos Silva (Gestor)')
    tempPerm.set('is_active', true)
    app.save(tempPerm)

    // Cobertura formal correspondente
    const recCob = new Record(colCoberturas)
    recCob.set('colaborador_ausente_id', 'u4')
    recCob.set('colaborador_ausente_nome', 'Alice Santos')
    recCob.set('colaborador_substituto_id', 'u3')
    recCob.set('colaborador_substituto_nome', 'João Paulo')
    recCob.set('etapas_cobertas', ['4'])
    recCob.set('data_inicio', '2026-09-14')
    recCob.set('data_fim_prevista', '2026-09-21')
    recCob.set('motivo', 'Cobertura de licença médica/ausência')
    recCob.set('autorizado_por', 'Carlos Silva')
    recCob.set('status', 'ativa')
    recCob.set('relatorio_acoes', [
      { data: '2026-09-15 10:14', acao: 'Realizou vistoria preliminar CTR-001' },
      { data: '2026-09-16 14:30', acao: 'Anexou 12 fotos no laudo CTR-003' },
    ])
    app.save(recCob)

    // 2. Seed de logs de auditoria realistas
    const sampleLogs = [
      {
        colaborador_id: 'u4',
        colaborador_nome: 'Alice Santos',
        acao_tipo: 'visualizou',
        etapa_id: '4',
        etapa_propria: true,
        contrato_id: 'CTR-001',
        motivo: 'Rotina operacional',
        dados_antes: { status: 'Agendada' },
        dados_depois: { status: 'Agendada' },
        ip: '187.22.45.10',
        dispositivo: 'Chrome / Windows 11',
        timestamp: '2026-09-16 09:12:00',
      },
      {
        colaborador_id: 'u4',
        colaborador_nome: 'Alice Santos',
        acao_tipo: 'concluiu_tarefa',
        etapa_id: '4',
        etapa_propria: true,
        contrato_id: 'CTR-001',
        motivo: 'Vistoria concluída sem pendências',
        dados_antes: { status: 'Em Andamento' },
        dados_depois: { status: 'Concluída' },
        ip: '187.22.45.10',
        dispositivo: 'Chrome / Windows 11',
        timestamp: '2026-09-16 11:45:00',
      },
      {
        colaborador_id: 'u3',
        colaborador_nome: 'João Paulo',
        acao_tipo: 'acessou_com_permissao_extra',
        etapa_id: '4',
        etapa_propria: false,
        contrato_id: 'CTR-003',
        motivo: 'Cobertura autorizada de Alice Santos',
        autorizado_por: 'Carlos Silva',
        dados_antes: { stage: '4' },
        dados_depois: { stage: '4' },
        ip: '177.105.12.8',
        dispositivo: 'Safari / macOS',
        timestamp: '2026-09-16 14:10:00',
      },
      {
        colaborador_id: 'u3',
        colaborador_nome: 'João Paulo',
        acao_tipo: 'visualizou_adjacente',
        etapa_id: '5',
        etapa_propria: false,
        contrato_id: 'CTR-001',
        motivo: 'Verificação de contexto adjacente',
        ip: '177.105.12.8',
        dispositivo: 'Safari / macOS',
        timestamp: '2026-09-16 15:02:00',
      },
      {
        colaborador_id: 'u5',
        colaborador_nome: 'Ricardo Mendes',
        acao_tipo: 'reabriu_tarefa',
        etapa_id: '9',
        etapa_propria: true,
        contrato_id: 'CTR-004',
        motivo: 'Extrato com divergência de cálculo',
        dados_antes: { status: 'Concluída' },
        dados_depois: { status: 'Reaberta', motivo: 'Retrabalho financeiro' },
        ip: '201.86.34.19',
        dispositivo: 'Firefox / Ubuntu',
        timestamp: '2026-09-16 16:30:00',
      },
      {
        colaborador_id: 'u6',
        colaborador_nome: 'Camila Torres',
        acao_tipo: 'tentou_acesso_negado',
        etapa_id: '9',
        etapa_propria: false,
        contrato_id: 'CTR-002',
        motivo: 'Sem autorização para etapa Financeiro',
        ip: '189.120.40.5',
        dispositivo: 'Edge / Windows 10',
        timestamp: '2026-09-16 16:45:12',
      },
      {
        colaborador_id: 'u6',
        colaborador_nome: 'Camila Torres',
        acao_tipo: 'tentou_acesso_negado',
        etapa_id: '9',
        etapa_propria: false,
        contrato_id: 'CTR-003',
        motivo: 'Sem autorização para etapa Financeiro',
        ip: '189.120.40.5',
        dispositivo: 'Edge / Windows 10',
        timestamp: '2026-09-16 17:10:04',
      },
      {
        colaborador_id: 'u5',
        colaborador_nome: 'Ricardo Mendes',
        acao_tipo: 'tentou_acesso_negado',
        etapa_id: '1',
        etapa_propria: false,
        contrato_id: 'CTR-001',
        motivo: 'Acesso fora do escopo',
        ip: '201.86.34.19',
        dispositivo: 'Firefox / Ubuntu',
        timestamp: '2026-09-16 17:40:00',
      },
    ]

    for (const item of sampleLogs) {
      const rec = new Record(colAuditoria)
      rec.set('colaborador_id', item.colaborador_id)
      rec.set('colaborador_nome', item.colaborador_nome)
      rec.set('acao_tipo', item.acao_tipo)
      rec.set('etapa_id', item.etapa_id)
      rec.set('etapa_propria', item.etapa_propria)
      rec.set('contrato_id', item.contrato_id)
      rec.set('dados_antes', item.dados_antes || {})
      rec.set('dados_depois', item.dados_depois || {})
      rec.set('ip', item.ip)
      rec.set('dispositivo', item.dispositivo)
      rec.set('autorizado_por', item.autorizado_por || '')
      rec.set('motivo', item.motivo || '')
      rec.set('timestamp', item.timestamp)
      app.save(rec)
    }

    // 3. Seed de métricas diárias e ranking da equipe conforme especificação:
    // Alice Santos: Score 94 | SLA 98% | Retrabalho 0% | 47 tarefas
    // Marina Costa: Score 87 | SLA 91% | Retrabalho 2% | 38 tarefas
    // João Paulo: Score 76 | SLA 82% | Retrabalho 5% | 31 tarefas
    // Camila Torres: Score 61 | SLA 70% | Retrabalho 8% | 29 tarefas
    // Ricardo Mendes: Score 48 | SLA 55% | Retrabalho 12% | 19 tarefas

    const metricsData = [
      {
        colabId: 'u4',
        colabNome: 'Alice Santos',
        total: 47,
        noPrazo: 46,
        atrasadas: 1,
        reabertas: 0,
        tempoMedio: 45,
        negados: 0,
        adjacentes: 2,
        scoreSLA: 98,
        scoreQual: 96,
        scoreVol: 92,
        scoreComp: 95,
        scoreTotal: 94,
        classif: 'Excelente',
      },
      {
        colabId: 'u2',
        colabNome: 'Marina Costa',
        total: 38,
        noPrazo: 35,
        atrasadas: 3,
        reabertas: 1,
        tempoMedio: 55,
        negados: 0,
        adjacentes: 3,
        scoreSLA: 91,
        scoreQual: 88,
        scoreVol: 82,
        scoreComp: 92,
        scoreTotal: 87,
        classif: 'Bom',
      },
      {
        colabId: 'u3',
        colabNome: 'João Paulo',
        total: 31,
        noPrazo: 25,
        atrasadas: 6,
        reabertas: 2,
        tempoMedio: 70,
        negados: 0,
        adjacentes: 4,
        scoreSLA: 82,
        scoreQual: 78,
        scoreVol: 72,
        scoreComp: 80,
        scoreTotal: 76,
        classif: 'Bom',
      },
      {
        colabId: 'u6',
        colabNome: 'Camila Torres',
        total: 29,
        noPrazo: 20,
        atrasadas: 9,
        reabertas: 3,
        tempoMedio: 85,
        negados: 2,
        adjacentes: 5,
        scoreSLA: 70,
        scoreQual: 62,
        scoreVol: 65,
        scoreComp: 50,
        scoreTotal: 61,
        classif: 'Atenção',
      },
      {
        colabId: 'u5',
        colabNome: 'Ricardo Mendes',
        total: 19,
        noPrazo: 10,
        atrasadas: 9,
        reabertas: 4,
        tempoMedio: 120,
        negados: 1,
        adjacentes: 2,
        scoreSLA: 55,
        scoreQual: 45,
        scoreVol: 48,
        scoreComp: 45,
        scoreTotal: 48,
        classif: 'Crítico',
      },
    ]

    for (const m of metricsData) {
      const rec = new Record(colMetricas)
      rec.set('colaborador_id', m.colabId)
      rec.set('colaborador_nome', m.colabNome)
      rec.set('data', '2026-09-16')
      rec.set('tarefas_total', m.total)
      rec.set('tarefas_no_prazo', m.noPrazo)
      rec.set('tarefas_atrasadas', m.atrasadas)
      rec.set('tarefas_reabertas', m.reabertas)
      rec.set('tempo_medio_conclusao_min', m.tempoMedio)
      rec.set('acessos_negados', m.negados)
      rec.set('acessos_adjacentes', m.adjacentes)
      rec.set('score_sla', m.scoreSLA)
      rec.set('score_qualidade', m.scoreQual)
      rec.set('score_volume', m.scoreVol)
      rec.set('score_comportamento', m.scoreComp)
      rec.set('score_total', m.scoreTotal)
      rec.set('classificacao', m.classif)
      app.save(rec)
    }

    // 4. Seed de registros formais (acertos e ocorrências)
    const formalRecords = [
      {
        colabId: 'u4',
        colabNome: 'Alice Santos',
        tipo: 'acerto',
        descricao:
          'Identificou proativamente dano na vistoria que evitou disputa na rescisão. Proprietário elogiou o cuidado.',
        contratoId: 'CTR-001',
        impacto: 'Alto',
        registradoPor: 'Carlos Silva (Gestor)',
        visibilidade: 'todos',
        tipoErro: '',
        planoAcao: '',
      },
      {
        colabId: 'u5',
        colabNome: 'Ricardo Mendes',
        tipo: 'ocorrencia',
        descricao:
          'Extrato enviado ao proprietário com valor incorreto. Precisou ser refeito e causou reclamação.',
        contratoId: 'CTR-004',
        impacto: 'Médio',
        registradoPor: 'Carlos Silva (Gestor)',
        visibilidade: 'gestores',
        tipoErro: 'Erro de valor | Retrabalho',
        planoAcao: 'Conferir checklist duplo antes do envio de extratos bancários',
      },
    ]

    for (const fr of formalRecords) {
      const rec = new Record(colRegistros)
      rec.set('colaborador_id', fr.colabId)
      rec.set('colaborador_nome', fr.colabNome)
      rec.set('tipo', fr.tipo)
      rec.set('descricao', fr.descricao)
      rec.set('contrato_id', fr.contratoId)
      rec.set('impacto', fr.impacto)
      rec.set('registrado_por', fr.registradoPor)
      rec.set('visibilidade', fr.visibilidade)
      rec.set('tipo_erro', fr.tipoErro)
      rec.set('plano_acao', fr.planoAcao)
      app.save(rec)
    }

    // 5. Seed de notificações no modelo WhatsApp/Sistema
    const initialNotifs = [
      {
        destinatario_id: 'u4',
        destinatario_nome: 'Alice Santos',
        telefone: '(11) 98765-4321',
        mensagem: 'Parabéns, Alice! Carlos registrou um acerto seu no CTR-001. Continue assim!',
        tipo: 'whatsapp_parabens',
        status: 'enviada',
        enviada_em: '2026-09-14 10:30:00',
      },
      {
        destinatario_id: 'u3',
        destinatario_nome: 'João Paulo',
        telefone: '(11) 97654-3210',
        mensagem: 'João, você tem 2 tarefas com SLA vencido. Acesse o Meu Dia para ver.',
        tipo: 'whatsapp_sla_alerta',
        status: 'enviada',
        enviada_em: '2026-09-15 08:00:00',
      },
      {
        destinatario_id: 'u3',
        destinatario_nome: 'João Paulo',
        telefone: '(11) 97654-3210',
        mensagem: 'João, você está cobrindo Vistoria de Entrada de Alice até 21/09. Bom trabalho!',
        tipo: 'whatsapp_cobertura',
        status: 'enviada',
        enviada_em: '2026-09-14 09:00:00',
      },
      {
        destinatario_id: 'u1',
        destinatario_nome: 'Carlos Silva (Gestor)',
        telefone: '(11) 99999-8888',
        mensagem: 'Ricardo tentou acessar Financeiro sem permissão às 14:23.',
        tipo: 'whatsapp_gestor_tentativa',
        status: 'enviada',
        enviada_em: '2026-09-16 14:25:00',
      },
      {
        destinatario_id: 'u1',
        destinatario_nome: 'Carlos Silva (Gestor)',
        telefone: '(11) 99999-8888',
        mensagem: 'Camila tem taxa de retrabalho de 12% este mês — acima do limite de 8%.',
        tipo: 'whatsapp_gestor_retrabalho',
        status: 'enviada',
        enviada_em: '2026-09-16 17:00:00',
      },
      {
        destinatario_id: 'u1',
        destinatario_nome: 'Carlos Silva (Gestor)',
        telefone: '(11) 99999-8888',
        mensagem: 'Alice é a colaboradora com melhor SLA do mês: 98%. Considere reconhecê-la.',
        tipo: 'whatsapp_gestor_destaque',
        status: 'enviada',
        enviada_em: '2026-09-16 17:30:00',
      },
    ]

    for (const n of initialNotifs) {
      const rec = new Record(colNotif)
      rec.set('destinatario_id', n.destinatario_id)
      rec.set('destinatario_nome', n.destinatario_nome)
      rec.set('telefone', n.telefone)
      rec.set('mensagem', n.mensagem)
      rec.set('tipo', n.tipo)
      rec.set('status', n.status)
      rec.set('enviada_em', n.enviada_em)
      rec.set('metadata', {})
      app.save(rec)
    }
  },
  (app) => {
    // Rollback opcional
  },
)
