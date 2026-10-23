migrate(
  (app) => {
    // 1. Seed Configuração de Expediente para Jaú, Pederneiras, Lençóis Paulista e Geral
    const confCol = app.findCollectionByNameOrId('configuracoes_expediente')
    const unidades = ['Geral', 'Jaú', 'Pederneiras', 'Lençóis Paulista']

    for (const uni of unidades) {
      try {
        const existing = app.findRecordsByFilter(
          'configuracoes_expediente',
          "unidade = '" + uni + "'",
          '',
          1,
          0,
        )
        if (existing.length === 0) {
          const rec = new Record(confCol)
          rec.set('unidade', uni)
          rec.set('fuso_horario', 'America/Sao_Paulo')
          rec.set('dias_uteis', JSON.stringify([1, 2, 3, 4, 5]))
          rec.set('hora_inicio', '08:30')
          rec.set('hora_fim', '18:00')
          rec.set('hora_almoco_inicio', '12:00')
          rec.set('hora_almoco_fim', '13:30')
          rec.set(
            'feriados',
            JSON.stringify([
              '2026-01-01',
              '2026-04-21',
              '2026-05-01',
              '2026-09-07',
              '2026-10-12',
              '2026-11-02',
              '2026-11-15',
              '2026-12-25',
            ]),
          )
          rec.set('sla_primeira_resposta_horas', 2)
          rec.set('permite_plantao_emergencia', true)
          rec.set('is_demo', true)
          app.save(rec)
        }
      } catch (_) {}
    }

    // 2. Seed Modelos de Processo (1: Atendimento Geral publicado; 2: Nova Locação simplificado rascunho)
    const modCol = app.findCollectionByNameOrId('modelos_processos')
    const verCol = app.findCollectionByNameOrId('versoes_processos')

    // Modelo 1: Atendimento Geral
    let mod1Id = ''
    try {
      const existing = app.findRecordsByFilter(
        'modelos_processos',
        "codigo = 'MOD-ATEND-GERAL'",
        '',
        1,
        0,
      )
      if (existing.length === 0) {
        const m1 = new Record(modCol)
        m1.set('codigo', 'MOD-ATEND-GERAL')
        m1.set('nome', 'Atendimento Geral & Demandas')
        m1.set(
          'descricao',
          'Fluxo padrão para triagem, esclarecimento e direcionamento de chamados de clientes em Jaú, Pederneiras e Lençóis Paulista.',
        )
        m1.set('categoria', 'Atendimento')
        m1.set('status', 'publicado')
        m1.set('versao_atual', 1)
        m1.set('is_demo', true)
        m1.set('criado_por', 'Carlos Silva (Administrador)')
        m1.set('publicado_em', '2026-06-01 09:00:00')

        const fasesM1 = [
          {
            id: 'fase-triagem',
            ordem: 1,
            nome: 'Triagem & Classificação',
            descricao: 'Recebimento inicial, checagem de duplicidade e atribuição de responsável.',
            atividades: [
              {
                id: 'ativ-101',
                titulo: 'Confirmar dados do solicitante e vínculo contratual',
                tipo: 'Humana',
                funcao_responsavel: 'Atendimento',
                prazo_horas_uteis: 2,
                obrigatoria: true,
                documentos_obrigatorios: [],
              },
              {
                id: 'ativ-102',
                titulo: 'Triagem automatizada de urgência por IA',
                tipo: 'IA',
                funcao_responsavel: 'Atendimento',
                prazo_horas_uteis: 1,
                obrigatoria: false,
                ai_config_status: 'Aguardando configuração',
              },
            ],
          },
          {
            id: 'fase-analise',
            ordem: 2,
            nome: 'Análise Técnica & Verificação',
            descricao: 'Exame minucioso da solicitação com as partes ou prestadores.',
            atividades: [
              {
                id: 'ativ-103',
                titulo: 'Preencher parecer preliminar de atendimento',
                tipo: 'Formulário',
                funcao_responsavel: 'Atendimento',
                prazo_horas_uteis: 4,
                obrigatoria: true,
                formulario_id: 'form-parecer-tecnico',
              },
              {
                id: 'ativ-104',
                titulo: 'Aprovação de alçada do gestor de atendimento',
                tipo: 'Aprovação',
                funcao_responsavel: 'Gestor',
                prazo_horas_uteis: 4,
                obrigatoria: true,
                etapa_retorno_id: 'fase-triagem',
              },
            ],
          },
          {
            id: 'fase-resolucao',
            ordem: 3,
            nome: 'Execução & Resolução',
            descricao: 'Execução da solução e comunicação externa ao solicitante.',
            atividades: [
              {
                id: 'ativ-105',
                titulo: 'Enviar comunicação formal ao cliente',
                tipo: 'Humana',
                funcao_responsavel: 'Atendimento',
                prazo_horas_uteis: 4,
                obrigatoria: true,
              },
              {
                id: 'ativ-106',
                titulo: 'Colher avaliação de satisfação (NPS)',
                tipo: 'Automação por regra',
                funcao_responsavel: 'Atendimento',
                prazo_horas_uteis: 24,
                obrigatoria: false,
              },
            ],
          },
          {
            id: 'fase-conclusao',
            ordem: 4,
            nome: 'Conclusão & Arquivamento',
            descricao: 'Fechamento do protocolo com confirmação de atendimento.',
            atividades: [
              {
                id: 'ativ-107',
                titulo: 'Auditoria de encerramento do chamado',
                tipo: 'Humana',
                funcao_responsavel: 'Gestor',
                prazo_horas_uteis: 2,
                obrigatoria: true,
              },
            ],
          },
        ]
        m1.set('fases', JSON.stringify(fasesM1))
        m1.set(
          'configuracao_sla',
          JSON.stringify({
            sla_primeira_resposta_horas: 2,
            sla_resolucao_horas: 24,
            alerta_sem_retorno_horas: 12,
          }),
        )
        app.save(m1)
        mod1Id = m1.id

        // Registrar Versão 1 no histórico imutável
        const ver1 = new Record(verCol)
        ver1.set('modelo_id', m1.id)
        ver1.set('versao', 1)
        ver1.set(
          'snapshot',
          JSON.stringify({
            codigo: m1.getString('codigo'),
            nome: m1.getString('nome'),
            fases: fasesM1,
            configuracao_sla: { sla_primeira_resposta_horas: 2, sla_resolucao_horas: 24 },
          }),
        )
        ver1.set(
          'nota_versao',
          'Versão inicial publicada com triagem, análise técnica e auditoria.',
        )
        ver1.set('publicado_por', 'Carlos Silva (Administrador)')
        ver1.set('is_demo', true)
        app.save(ver1)
      } else {
        mod1Id = existing[0].id
      }
    } catch (_) {}

    // Modelo 2: Nova Locação (Rascunho para demonstrar o construtor visual)
    try {
      const existing = app.findRecordsByFilter(
        'modelos_processos',
        "codigo = 'MOD-LOC-NOVA'",
        '',
        1,
        0,
      )
      if (existing.length === 0) {
        const m2 = new Record(modCol)
        m2.set('codigo', 'MOD-LOC-NOVA')
        m2.set('nome', 'Esteira de Nova Locação Residencial/Comercial')
        m2.set(
          'descricao',
          'Processo simplificado em rascunho para configuração de captação, análise de crédito, minuta e entrega de chaves.',
        )
        m2.set('categoria', 'Contratos')
        m2.set('status', 'rascunho')
        m2.set('versao_atual', 1)
        m2.set('is_demo', true)
        m2.set('criado_por', 'Carlos Silva (Administrador)')

        const fasesM2 = [
          {
            id: 'fase-proposta',
            ordem: 1,
            nome: 'Proposta & Ficha Cadastral',
            descricao: 'Recebimento de documentos pessoais e comprovação de renda.',
            atividades: [
              {
                id: 'ativ-201',
                titulo: 'Coleta de RG/CPF, Comprovante de Renda e Estado Civil',
                tipo: 'Formulário',
                funcao_responsavel: 'Atendimento',
                prazo_horas_uteis: 8,
                obrigatoria: true,
                documentos_obrigatorios: [
                  'Documento de Identidade com Foto',
                  'Comprovante de Renda (3 últimos holerites)',
                ],
              },
            ],
          },
          {
            id: 'fase-analise-credito',
            ordem: 2,
            nome: 'Análise de Crédito & Garantia',
            descricao: 'Consulta Serasa/Boa Vista e aprovação de garantia locatícia.',
            atividades: [
              {
                id: 'ativ-202',
                titulo: 'Aprovação de Alçada Financeira / CredPago',
                tipo: 'Aprovação',
                funcao_responsavel: 'Financeiro',
                prazo_horas_uteis: 4,
                obrigatoria: true,
                etapa_retorno_id: 'fase-proposta',
              },
            ],
          },
          {
            id: 'fase-contrato',
            ordem: 3,
            nome: 'Confecção de Minuta & Assinaturas',
            descricao: 'Elaboração do contrato e envio para assinatura eletrônica.',
            atividades: [
              {
                id: 'ativ-203',
                titulo: 'Emitir minuta padrão Gabriel e colher assinaturas',
                tipo: 'Humana',
                funcao_responsavel: 'Contratos',
                prazo_horas_uteis: 12,
                obrigatoria: true,
              },
            ],
          },
        ]
        m2.set('fases', JSON.stringify(fasesM2))
        m2.set(
          'configuracao_sla',
          JSON.stringify({
            sla_primeira_resposta_horas: 2,
            sla_resolucao_horas: 48,
          }),
        )
        app.save(m2)
      }
    } catch (_) {}

    // 3. Seed Casos de Atendimento Demonstrativos nas 3 Cidades (Jaú, Pederneiras, Lençóis Paulista)
    const casosCol = app.findCollectionByNameOrId('casos_processos')
    const ativsCol = app.findCollectionByNameOrId('atividades_casos')
    const comCol = app.findCollectionByNameOrId('comentarios_casos')

    const demoCasos = [
      {
        protocolo: 'GAB-2026-001',
        titulo: 'Vazamento urgente na tubulação do banheiro da suíte',
        unidade: 'Jaú',
        status: 'Em atendimento',
        prioridade: 'Urgente',
        justificativa_prioridade:
          'Risco iminente de danificar o assoalho e infiltração no imóvel inferior.',
        fase_atual_id: 'fase-analise',
        fase_atual_nome: 'Análise Técnica & Verificação',
        solicitante_nome: 'Mariana Duarte Prado',
        solicitante_email: 'mariana.prado@exemplo.com.br',
        solicitante_telefone: '(14) 99712-3456',
        canal_origem: 'WhatsApp',
        cliente_id: 'c1',
        cliente_nome: 'Mariana Duarte Prado',
        imovel_id: 'p1',
        imovel_titulo: 'Apto 42 Ed. Jardins Jaú',
        contrato_id: 'CTR-2024-0089',
        responsavel_id: 'u3',
        responsavel_nome: 'João Paulo',
        equipe: 'Atendimento & Operações',
        proxima_acao:
          'Aguardando aprovação de orçamento pelo gestor para acionamento do encanador.',
        data_abertura: '2026-10-20 09:30:00',
        prazo_primeira_resposta: '2026-10-20 11:30:00',
        data_primeira_resposta_humana: '2026-10-20 10:15:00',
        prazo_resolucao: '2026-10-24 18:00:00',
        prazo_prometido_cliente: '2026-10-24 18:00:00',
        data_ultimo_retorno_cliente: '2026-10-22 14:00:00',
        casos_relacionados: ['GAB-2026-004'],
        dados_formulario: {
          comodo: 'Banheiro Suíte',
          gravidade: 'Gotejamento constante com estufamento de piso',
        },
        bloqueios_pendentes: [],
        historico_etapas: [
          {
            fase: 'Triagem & Classificação',
            data_inicio: '2026-10-20 09:30',
            data_conclusao: '2026-10-20 10:45',
            usuario: 'João Paulo',
          },
          {
            fase: 'Análise Técnica & Verificação',
            data_inicio: '2026-10-20 10:45',
            data_conclusao: null,
            usuario: 'João Paulo',
          },
        ],
      },
      {
        protocolo: 'GAB-2026-002',
        titulo: 'Revisão de valores de condomínio e IPTU no boleto',
        unidade: 'Pederneiras',
        status: 'Aguardando cliente',
        prioridade: 'Média',
        justificativa_prioridade:
          'Divergência apontada pelo locatário com relação à cota condominial ordinária.',
        fase_atual_id: 'fase-analise',
        fase_atual_nome: 'Análise Técnica & Verificação',
        solicitante_nome: 'Carlos Eduardo Nogueira',
        solicitante_email: 'carlos.nogueira@exemplo.com.br',
        solicitante_telefone: '(14) 99823-7711',
        canal_origem: 'E-mail',
        cliente_id: 'c2',
        cliente_nome: 'Carlos Eduardo Nogueira',
        imovel_id: 'p2',
        imovel_titulo: 'Casa 04 Condomínio Parque das Árvores (Pederneiras)',
        contrato_id: 'CTR-2025-0142',
        responsavel_id: 'u5',
        responsavel_nome: 'Ricardo Mendes',
        equipe: 'Financeiro',
        proxima_acao: 'Cobrar comprovante enviado pelo condomínio ao inquilino.',
        data_abertura: '2026-10-18 14:10:00',
        prazo_primeira_resposta: '2026-10-18 16:10:00',
        data_primeira_resposta_humana: '2026-10-18 15:00:00',
        prazo_resolucao: '2026-10-23 18:00:00',
        prazo_prometido_cliente: '2026-10-23 12:00:00',
        data_ultimo_retorno_cliente: '2026-10-21 16:30:00',
        casos_relacionados: [],
        dados_formulario: { valor_divergente: 'R$ 142,50', referencia: 'Outubro/2026' },
        bloqueios_pendentes: [
          { tipo: 'documento', descricao: 'Boleto original da administradora do condomínio' },
        ],
        historico_etapas: [
          {
            fase: 'Triagem & Classificação',
            data_inicio: '2026-10-18 14:10',
            data_conclusao: '2026-10-18 15:30',
            usuario: 'Ricardo Mendes',
          },
        ],
      },
      {
        protocolo: 'GAB-2026-003',
        titulo: 'Solicitação de rescisão antecipada e agendamento de vistoria',
        unidade: 'Lençóis Paulista',
        status: 'Aguardando aprovação interna',
        prioridade: 'Alta',
        justificativa_prioridade:
          'Locatário transferido de cidade pela empresa; requer cálculo da multa proporcional.',
        fase_atual_id: 'fase-analise',
        fase_atual_nome: 'Análise Técnica & Verificação',
        solicitante_nome: 'Fernanda Albuquerque Lima',
        solicitante_email: 'fernanda.lima@exemplo.com.br',
        solicitante_telefone: '(14) 99654-9988',
        canal_origem: 'Balcão',
        cliente_id: 'c3',
        cliente_nome: 'Fernanda Albuquerque Lima',
        imovel_id: 'p3',
        imovel_titulo: 'Sobrado Rua XV de Novembro, 820 (Lençóis Paulista)',
        contrato_id: 'CTR-2023-0055',
        responsavel_id: 'u1',
        responsavel_nome: 'Carlos Silva',
        equipe: 'Contratos & Desocupação',
        proxima_acao:
          'Aprovação da isenção de multa com base na carta de transferência de emprego.',
        data_abertura: '2026-10-19 11:00:00',
        prazo_primeira_resposta: '2026-10-19 13:00:00',
        data_primeira_resposta_humana: '2026-10-19 11:45:00',
        prazo_resolucao: '2026-10-26 18:00:00',
        prazo_prometido_cliente: '2026-10-24 17:00:00',
        data_ultimo_retorno_cliente: '2026-10-22 10:00:00',
        casos_relacionados: [],
        dados_formulario: { motivo: 'Transferência de emprego', carta_anexada: true },
        bloqueios_pendentes: [
          {
            tipo: 'aprovacao',
            descricao: 'Aprovação formal do Gestor Geral para dispensa de multa contratual',
          },
        ],
        historico_etapas: [
          {
            fase: 'Triagem & Classificação',
            data_inicio: '2026-10-19 11:00',
            data_conclusao: '2026-10-19 12:00',
            usuario: 'Alice Santos',
          },
        ],
      },
      {
        protocolo: 'GAB-2026-004',
        titulo: 'Reembolso de reparo emergencial em fechadura eletrônica',
        unidade: 'Jaú',
        status: 'Resolvido',
        prioridade: 'Média',
        justificativa_prioridade: 'Cliente trocou bateria e fechadura travou em feriado.',
        fase_atual_id: 'fase-conclusao',
        fase_atual_nome: 'Conclusão & Arquivamento',
        solicitante_nome: 'Mariana Duarte Prado',
        solicitante_email: 'mariana.prado@exemplo.com.br',
        solicitante_telefone: '(14) 99712-3456',
        canal_origem: 'Site',
        cliente_id: 'c1',
        cliente_nome: 'Mariana Duarte Prado',
        imovel_id: 'p1',
        imovel_titulo: 'Apto 42 Ed. Jardins Jaú',
        contrato_id: 'CTR-2024-0089',
        responsavel_id: 'u3',
        responsavel_nome: 'João Paulo',
        equipe: 'Atendimento & Operações',
        proxima_acao: 'Caso finalizado e arquivado.',
        data_abertura: '2026-10-10 08:30:00',
        prazo_primeira_resposta: '2026-10-10 10:30:00',
        data_primeira_resposta_humana: '2026-10-10 09:10:00',
        prazo_resolucao: '2026-10-15 18:00:00',
        prazo_prometido_cliente: '2026-10-14 18:00:00',
        data_ultimo_retorno_cliente: '2026-10-14 15:00:00',
        casos_relacionados: ['GAB-2026-001'],
        dados_formulario: { valor_reembolso: 'R$ 280,00', forma_pagamento: 'PIX' },
        bloqueios_pendentes: [],
        historico_etapas: [
          {
            fase: 'Triagem & Classificação',
            data_inicio: '2026-10-10 08:30',
            data_conclusao: '2026-10-10 10:00',
            usuario: 'João Paulo',
          },
          {
            fase: 'Análise Técnica & Verificação',
            data_inicio: '2026-10-10 10:00',
            data_conclusao: '2026-10-12 11:00',
            usuario: 'João Paulo',
          },
          {
            fase: 'Execução & Resolução',
            data_inicio: '2026-10-12 11:00',
            data_conclusao: '2026-10-14 15:00',
            usuario: 'Ricardo Mendes',
          },
          {
            fase: 'Conclusão & Arquivamento',
            data_inicio: '2026-10-14 15:00',
            data_conclusao: '2026-10-14 15:30',
            usuario: 'Carlos Silva',
          },
        ],
      },
      {
        protocolo: 'GAB-2026-005',
        titulo: 'Dúvida sobre renovação contratual com reajuste pelo IPCA',
        unidade: 'Jaú',
        status: 'Novo',
        prioridade: 'Baixa',
        justificativa_prioridade:
          'Dúvida rotineira sobre aplicação do índice acordado em contrato.',
        fase_atual_id: 'fase-triagem',
        fase_atual_nome: 'Triagem & Classificação',
        solicitante_nome: 'Rodrigo Mendonça',
        solicitante_email: 'rodrigo.mendonca@exemplo.com.br',
        solicitante_telefone: '(14) 99111-2233',
        canal_origem: 'WhatsApp',
        cliente_id: 'c4',
        cliente_nome: 'Rodrigo Mendonça',
        imovel_id: 'p4',
        imovel_titulo: 'Sala Comercial 301 Centro Empresarial Jaú',
        contrato_id: 'CTR-2024-0019',
        responsavel_id: 'u3',
        responsavel_nome: 'João Paulo',
        equipe: 'Atendimento & Operações',
        proxima_acao: 'Realizar primeiro contato e esclarecer cálculo de IPCA.',
        data_abertura: '2026-10-23 09:00:00',
        prazo_primeira_resposta: '2026-10-23 11:00:00',
        data_primeira_resposta_humana: '',
        prazo_resolucao: '2026-10-24 18:00:00',
        prazo_prometido_cliente: '2026-10-23 15:00:00',
        data_ultimo_retorno_cliente: '',
        casos_relacionados: [],
        dados_formulario: {},
        bloqueios_pendentes: [],
        historico_etapas: [
          {
            fase: 'Triagem & Classificação',
            data_inicio: '2026-10-23 09:00',
            data_conclusao: null,
            usuario: 'João Paulo',
          },
        ],
      },
    ]

    for (const c of demoCasos) {
      try {
        const existing = app.findRecordsByFilter(
          'casos_processos',
          "protocolo = '" + c.protocolo + "'",
          '',
          1,
          0,
        )
        if (existing.length === 0) {
          const rec = new Record(casosCol)
          rec.set('protocolo', c.protocolo)
          rec.set('titulo', c.titulo)
          rec.set('modelo_id', mod1Id || 'mod-demo-atend')
          rec.set('versao_modelo', 1)
          rec.set('unidade', c.unidade)
          rec.set('status', c.status)
          rec.set('prioridade', c.prioridade)
          rec.set('justificativa_prioridade', c.justificativa_prioridade)
          rec.set('fase_atual_id', c.fase_atual_id)
          rec.set('fase_atual_nome', c.fase_atual_nome)
          rec.set('solicitante_nome', c.solicitante_nome)
          rec.set('solicitante_email', c.solicitante_email)
          rec.set('solicitante_telefone', c.solicitante_telefone)
          rec.set('canal_origem', c.canal_origem)
          rec.set('cliente_id', c.cliente_id)
          rec.set('cliente_nome', c.cliente_nome)
          rec.set('imovel_id', c.imovel_id)
          rec.set('imovel_titulo', c.imovel_titulo)
          rec.set('contrato_id', c.contrato_id)
          rec.set('responsavel_id', c.responsavel_id)
          rec.set('responsavel_nome', c.responsavel_nome)
          rec.set('equipe', c.equipe)
          rec.set('proxima_acao', c.proxima_acao)
          rec.set('data_abertura', c.data_abertura)
          rec.set('prazo_primeira_resposta', c.prazo_primeira_resposta)
          rec.set('data_primeira_resposta_humana', c.data_primeira_resposta_humana)
          rec.set('prazo_resolucao', c.prazo_resolucao)
          rec.set('prazo_prometido_cliente', c.prazo_prometido_cliente)
          rec.set('data_ultimo_retorno_cliente', c.data_ultimo_retorno_cliente)
          rec.set('casos_relacionados', JSON.stringify(c.casos_relacionados))
          rec.set('dados_formulario', JSON.stringify(c.dados_formulario))
          rec.set('bloqueios_pendentes', JSON.stringify(c.bloqueios_pendentes))
          rec.set('historico_etapas', JSON.stringify(c.historico_etapas))
          rec.set('is_demo', true)
          app.save(rec)

          // Criar atividades filhas para o caso
          const ativ1 = new Record(ativsCol)
          ativ1.set('caso_id', rec.id)
          ativ1.set('caso_protocolo', c.protocolo)
          ativ1.set('fase_id', c.fase_atual_id)
          ativ1.set('titulo', 'Contato com locatário e checagem de dados')
          ativ1.set(
            'descricao',
            'Verificar histórico de chamados e esclarecer a urgência reportada.',
          )
          ativ1.set('tipo', 'Humana')
          ativ1.set('status', c.status === 'Resolvido' ? 'Concluída' : 'Em Andamento')
          ativ1.set('responsavel_tipo', 'pessoa')
          ativ1.set('responsavel_id', c.responsavel_id)
          ativ1.set('responsavel_nome', c.responsavel_nome)
          ativ1.set('funcao_responsavel', 'Atendimento')
          ativ1.set('prazo', '2026-10-24 18:00:00')
          ativ1.set('is_paralela', false)
          ativ1.set('is_demo', true)
          app.save(ativ1)

          // Atividade de IA com estado "Aguardando configuração"
          const ativIA = new Record(ativsCol)
          ativIA.set('caso_id', rec.id)
          ativIA.set('caso_protocolo', c.protocolo)
          ativIA.set('fase_id', c.fase_atual_id)
          ativIA.set('titulo', 'Classificação semântica de urgência e transcrição')
          ativIA.set(
            'descricao',
            'Motor inteligente para extrair entidades e avaliar criticidade do áudio/texto.',
          )
          ativIA.set('tipo', 'IA')
          ativIA.set('status', 'Pendente')
          ativIA.set('responsavel_tipo', 'sistema')
          ativIA.set('ai_config_status', 'Aguardando configuração')
          ativIA.set('is_paralela', true)
          ativIA.set('is_demo', true)
          app.save(ativIA)

          // Criar comentário interno e mensagem externa de demonstração
          const cInt = new Record(comCol)
          cInt.set('caso_id', rec.id)
          cInt.set('caso_protocolo', c.protocolo)
          cInt.set('visibilidade', 'interno')
          cInt.set('autor_id', 'u1')
          cInt.set('autor_nome', 'Carlos Silva (Gestor)')
          cInt.set(
            'mensagem',
            '[Nota Interna] Cliente prioritário da carteira Gabriel Jaú. Atenção redobrada ao cumprimento do SLA.',
          )
          cInt.set('is_demo', true)
          app.save(cInt)

          const cExt = new Record(comCol)
          cExt.set('caso_id', rec.id)
          cExt.set('caso_protocolo', c.protocolo)
          cExt.set('visibilidade', 'externo_cliente')
          cExt.set('autor_id', c.responsavel_id)
          cExt.set('autor_nome', c.responsavel_nome)
          cExt.set(
            'mensagem',
            'Olá, confirmamos o recebimento da sua solicitação através do protocolo ' +
              c.protocolo +
              '. Nossa equipe técnica já está acompanhando o caso.',
          )
          cExt.set('is_demo', true)
          app.save(cExt)
        }
      } catch (_) {}
    }
  },
  (app) => {
    // Reversão limpa
    try {
      const casos = app.findRecordsByFilter('casos_processos', 'is_demo = true', '', 100, 0)
      for (const c of casos) app.delete(c)
    } catch (_) {}
  },
)
