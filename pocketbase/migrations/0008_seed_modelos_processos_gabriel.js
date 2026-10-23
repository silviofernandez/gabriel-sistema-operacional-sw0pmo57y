migrate(
  (app) => {
    const modCol = app.findCollectionByNameOrId('modelos_processos')
    const verCol = app.findCollectionByNameOrId('versoes_processos')

    const modelosParaCriar = [
      // A. ATENDIMENTO GERAL
      {
        codigo: 'MOD-ATEND-GERAL-V2',
        nome: 'A. Atendimento Geral & Demandas de Clientes',
        descricao:
          'Recebimento, Identificação, Classificação (Locação, Financeiro, Manutenção, Renovação, Desocupação, Documentos, Reclamação, Comercial), Encaminhamento, Tratativa, Retorno, Solução e Encerramento. Reclamação com alçada de gestor e compromisso.',
        categoria: 'Atendimento',
        status: 'publicado',
        versao_atual: 1,
        fases: [
          {
            id: 'fase-ag-1',
            ordem: 1,
            nome: '1. Recebimento & Identificação',
            descricao:
              'Identificar canal, solicitante, imóvel/contrato e confirmar dados de contato.',
            atividades: [
              {
                id: 'ativ-ag-101',
                titulo:
                  'Identificar solicitante, papel (proprietário/inquilino/fiador/terceiro) e imóvel',
                tipo: 'Humana',
                funcao_responsavel: 'Atendimento',
                prazo_horas_uteis: 2,
                obrigatoria: true,
                documentos_obrigatorios: [],
              },
              {
                id: 'ativ-ag-102',
                titulo: 'Checar duplicidade com outros protocolos abertos no mesmo imóvel',
                tipo: 'Humana',
                funcao_responsavel: 'Atendimento',
                prazo_horas_uteis: 1,
                obrigatoria: true,
              },
            ],
          },
          {
            id: 'fase-ag-2',
            ordem: 2,
            nome: '2. Classificação & Encaminhamento',
            descricao:
              'Classificar por categoria: Locação, Financeiro, Manutenção, Renovação, Desocupação, Documentos, Reclamação ou Comercial.',
            atividades: [
              {
                id: 'ativ-ag-201',
                titulo: 'Classificar demanda e determinar criticidade/urgência justificada',
                tipo: 'Formulário',
                funcao_responsavel: 'Atendimento',
                prazo_horas_uteis: 2,
                obrigatoria: true,
              },
              {
                id: 'ativ-ag-202',
                titulo:
                  'Encaminhamento especial ao Gestor com compromisso registrado (se Reclamação)',
                tipo: 'Aprovação',
                funcao_responsavel: 'Gestor',
                prazo_horas_uteis: 4,
                obrigatoria: false,
                etapa_retorno_id: 'fase-ag-1',
              },
            ],
          },
          {
            id: 'fase-ag-3',
            ordem: 3,
            nome: '3. Tratativa & Retorno ao Cliente',
            descricao: 'Execução da ação devida com atualizações periódicas obrigatórias.',
            atividades: [
              {
                id: 'ativ-ag-301',
                titulo: 'Executar tratativa técnica/operacional com equipe responsável',
                tipo: 'Humana',
                funcao_responsavel: 'Atendimento',
                prazo_horas_uteis: 8,
                obrigatoria: true,
              },
              {
                id: 'ativ-ag-302',
                titulo: 'Registrar retorno intermediário/prometido com o cliente',
                tipo: 'Humana',
                funcao_responsavel: 'Atendimento',
                prazo_horas_uteis: 4,
                obrigatoria: true,
              },
            ],
          },
          {
            id: 'fase-ag-4',
            ordem: 4,
            nome: '4. Confirmação da Solução & Encerramento',
            descricao: 'Confirmação com o cliente antes do fechamento final.',
            atividades: [
              {
                id: 'ativ-ag-401',
                titulo: 'Confirmação expressa da solução com o cliente (WhatsApp/E-mail)',
                tipo: 'Humana',
                funcao_responsavel: 'Atendimento',
                prazo_horas_uteis: 4,
                obrigatoria: true,
              },
              {
                id: 'ativ-ag-402',
                titulo: 'Auditoria de encerramento e envio de pesquisa de satisfação',
                tipo: 'Automação por regra',
                funcao_responsavel: 'Atendimento',
                prazo_horas_uteis: 24,
                obrigatoria: false,
              },
            ],
          },
        ],
        configuracao_sla: {
          sla_primeira_resposta_horas: 2,
          sla_resolucao_horas: 24,
          alerta_sem_retorno_horas: 12,
        },
      },

      // B. NOVA LOCAÇÃO (10 fases com bloqueios obrigatórios)
      {
        codigo: 'MOD-LOC-10FASES',
        nome: 'B. Esteira Completa de Nova Locação (10 Fases)',
        descricao:
          'Solicitação e reserva → Negociação e aceite → Cadastro e documentos → Análise e garantia → Cadastro no sistema → Minuta → Vistoria de entrada → Assinaturas → Ativação e chaves → Acompanhamento inicial. Bloqueio estrito de avanço sem requisitos.',
        categoria: 'Contratos',
        status: 'publicado',
        versao_atual: 1,
        fases: [
          {
            id: 'fase-nl-1',
            ordem: 1,
            nome: '1. Solicitação e Reserva',
            descricao: 'Formalização da intenção de locação e bloqueio de agenda de visitas.',
            atividades: [
              {
                id: 'at-nl-1',
                titulo: 'Registrar ficha de reserva e sinal financeiro (se aplicável)',
                tipo: 'Formulário',
                funcao_responsavel: 'Comercial',
                prazo_horas_uteis: 4,
                obrigatoria: true,
              },
            ],
          },
          {
            id: 'fase-nl-2',
            ordem: 2,
            nome: '2. Negociação e Aceite',
            descricao:
              'Alinhamento de carência, valor final de locação e encargos com o proprietário.',
            atividades: [
              {
                id: 'at-nl-2',
                titulo: 'Colher aceite formal do proprietário sobre condições negociadas',
                tipo: 'Aprovação',
                funcao_responsavel: 'Gestor',
                prazo_horas_uteis: 4,
                obrigatoria: true,
                etapa_retorno_id: 'fase-nl-1',
              },
            ],
          },
          {
            id: 'fase-nl-3',
            ordem: 3,
            nome: '3. Cadastro e Documentos',
            descricao: 'Coleta de documentação pessoal, comprovantes de renda e fiadores.',
            atividades: [
              {
                id: 'at-nl-3',
                titulo: 'Receber e conferir documentos de identidade e renda',
                tipo: 'Formulário',
                funcao_responsavel: 'Atendimento',
                prazo_horas_uteis: 8,
                obrigatoria: true,
                documentos_obrigatorios: [
                  'RG e CPF com foto',
                  'Comprovante de Renda Atualizado',
                  'Comprovante de Residência',
                ],
              },
            ],
          },
          {
            id: 'fase-nl-4',
            ordem: 4,
            nome: '4. Análise e Garantia Locatícia',
            descricao: 'Aprovação da garantia (CredPago, Fiador, Seguro Fiança ou Caução).',
            atividades: [
              {
                id: 'at-nl-4',
                titulo: 'Aprovação de alçada da garantia locatícia',
                tipo: 'Aprovação',
                funcao_responsavel: 'Financeiro',
                prazo_horas_uteis: 4,
                obrigatoria: true,
                etapa_retorno_id: 'fase-nl-3',
              },
            ],
          },
          {
            id: 'fase-nl-5',
            ordem: 5,
            nome: '5. Cadastro no Sistema de Gestão',
            descricao:
              'Parametrização completa do contrato, repasses, taxas e datas de vencimento.',
            atividades: [
              {
                id: 'at-nl-5',
                titulo: 'Cadastrar contrato no sistema de gestão com regras de repasse',
                tipo: 'Humana',
                funcao_responsavel: 'Administrativo',
                prazo_horas_uteis: 4,
                obrigatoria: true,
              },
            ],
          },
          {
            id: 'fase-nl-6',
            ordem: 6,
            nome: '6. Minuta Contratual',
            descricao: 'Emissão e conferência jurídica da minuta locatícia.',
            atividades: [
              {
                id: 'at-nl-6',
                titulo: 'Emitir e conferir minuta contratual com cláusulas específicas',
                tipo: 'Humana',
                funcao_responsavel: 'Contratos',
                prazo_horas_uteis: 4,
                obrigatoria: true,
              },
            ],
          },
          {
            id: 'fase-nl-7',
            ordem: 7,
            nome: '7. Vistoria de Entrada',
            descricao: 'Vistoria fotográfica e laudo descritivo completo do imóvel.',
            atividades: [
              {
                id: 'at-nl-7',
                titulo: 'Realizar laudo de vistoria de entrada com fotos detalhadas',
                tipo: 'Formulário',
                funcao_responsavel: 'Vistorias',
                prazo_horas_uteis: 8,
                obrigatoria: true,
                documentos_obrigatorios: ['Laudo de Vistoria de Entrada com Fotos'],
              },
            ],
          },
          {
            id: 'fase-nl-8',
            ordem: 8,
            nome: '8. Assinaturas Eletrônicas',
            descricao:
              'Colheita de assinaturas digitais válidas (locador, locatário, fiador e Gabriel).',
            atividades: [
              {
                id: 'at-nl-8',
                titulo: 'Acompanhar e validar assinaturas digitais de todas as partes',
                tipo: 'Humana',
                funcao_responsavel: 'Contratos',
                prazo_horas_uteis: 24,
                obrigatoria: true,
                documentos_obrigatorios: ['Contrato Assinado por Todas as Partes'],
              },
            ],
          },
          {
            id: 'fase-nl-9',
            ordem: 9,
            nome: '9. Ativação e Entrega de Chaves',
            descricao:
              'Liberação de chaves e termo de entrega assinado. Bloqueio sem assinatura prévia.',
            atividades: [
              {
                id: 'at-nl-9',
                titulo: 'Emitir Termo de Entrega de Chaves assinado pelo locatário',
                tipo: 'Humana',
                funcao_responsavel: 'Atendimento',
                prazo_horas_uteis: 4,
                obrigatoria: true,
                documentos_obrigatorios: ['Termo de Entrega de Chaves'],
              },
            ],
          },
          {
            id: 'fase-nl-10',
            ordem: 10,
            nome: '10. Acompanhamento Inicial (Concierge)',
            descricao:
              'Apoio nos primeiros 30 dias: transferência de titularidade de energia e água.',
            atividades: [
              {
                id: 'at-nl-10',
                titulo: 'Confirmar transferência de água/luz e primeiro pagamento',
                tipo: 'Humana',
                funcao_responsavel: 'Concierge',
                prazo_horas_uteis: 48,
                obrigatoria: true,
              },
            ],
          },
        ],
        configuracao_sla: {
          sla_primeira_resposta_horas: 2,
          sla_resolucao_horas: 72,
          alerta_sem_retorno_horas: 24,
        },
      },

      // C. MANUTENÇÃO (3 orçamentos, aprovação da versão exata, evidências, emergências)
      {
        codigo: 'MOD-MANUT-COMPLETO',
        nome: 'C. Manutenção Predial & Reparos',
        descricao:
          'Abertura → Triagem → Orçamentos (3 por padrão) → Aprovação de versão exata → Agendamento → Execução → Conferência com fotos → Despesa → Retorno e encerramento. Rota própria para emergências.',
        categoria: 'Manutenção',
        status: 'publicado',
        versao_atual: 1,
        fases: [
          {
            id: 'fase-man-1',
            ordem: 1,
            nome: '1. Abertura & Triagem de Emergência',
            descricao:
              'Avaliação de responsabilidade (inquilino vs proprietário) e rota emergencial.',
            atividades: [
              {
                id: 'at-man-1',
                titulo: 'Classificar responsabilidade contratual e verificar se é emergência',
                tipo: 'Formulário',
                funcao_responsavel: 'Manutenção',
                prazo_horas_uteis: 2,
                obrigatoria: true,
              },
            ],
          },
          {
            id: 'fase-man-2',
            ordem: 2,
            nome: '2. Cotação de Orçamentos (Três Cotações)',
            descricao: 'Coleta de 3 orçamentos comparativos ou justificativa formal de exceção.',
            atividades: [
              {
                id: 'at-man-2',
                titulo: 'Anexar 3 orçamentos de prestadores credenciados (ou justificativa)',
                tipo: 'Formulário',
                funcao_responsavel: 'Manutenção',
                prazo_horas_uteis: 16,
                obrigatoria: true,
                documentos_obrigatorios: ['Orçamentos Comparativos de Prestadores'],
              },
            ],
          },
          {
            id: 'fase-man-3',
            ordem: 3,
            nome: '3. Aprovação da Versão Exata',
            descricao: 'Aprovação formal do proprietário/gestor da versão exata do orçamento.',
            atividades: [
              {
                id: 'at-man-3',
                titulo: 'Aprovar versão exata do orçamento selecionado',
                tipo: 'Aprovação',
                funcao_responsavel: 'Gestor',
                prazo_horas_uteis: 8,
                obrigatoria: true,
                etapa_retorno_id: 'fase-man-2',
              },
            ],
          },
          {
            id: 'fase-man-4',
            ordem: 4,
            nome: '4. Agendamento & Execução do Serviço',
            descricao: 'Marcação com inquilino e acompanhamento dos trabalhos do prestador.',
            atividades: [
              {
                id: 'at-man-4',
                titulo: 'Confirmar agendamento de entrada com o morador e prestador',
                tipo: 'Humana',
                funcao_responsavel: 'Manutenção',
                prazo_horas_uteis: 8,
                obrigatoria: true,
              },
            ],
          },
          {
            id: 'fase-man-5',
            ordem: 5,
            nome: '5. Conferência de Evidências & Despesa',
            descricao:
              'Exige fotos antes/depois; declaração isolada do prestador não conclui automaticamente.',
            atividades: [
              {
                id: 'at-man-5',
                titulo: 'Validar fotos comprobatórias do serviço concluído e nota fiscal',
                tipo: 'Formulário',
                funcao_responsavel: 'Manutenção',
                prazo_horas_uteis: 4,
                obrigatoria: true,
                documentos_obrigatorios: [
                  'Fotos Comprobatórias Antes e Depois',
                  'Nota Fiscal ou Recibo do Prestador',
                ],
              },
              {
                id: 'at-man-6',
                titulo: 'Lançar despesa para abatimento ou cobrança devida',
                tipo: 'Humana',
                funcao_responsavel: 'Financeiro',
                prazo_horas_uteis: 4,
                obrigatoria: true,
              },
            ],
          },
          {
            id: 'fase-man-6',
            ordem: 6,
            nome: '6. Retorno ao Cliente & Encerramento',
            descricao: 'Confirmação com o morador da qualidade do reparo e encerramento.',
            atividades: [
              {
                id: 'at-man-7',
                titulo: 'Colher aceite do morador e fechar ordem de serviço',
                tipo: 'Humana',
                funcao_responsavel: 'Atendimento',
                prazo_horas_uteis: 8,
                obrigatoria: true,
              },
            ],
          },
        ],
        configuracao_sla: {
          sla_primeira_resposta_horas: 2,
          sla_resolucao_horas: 48,
          alerta_sem_retorno_horas: 12,
        },
      },

      // D. DESPESAS E PAGAMENTOS (Duplicidade, separação de alçadas, conciliação)
      {
        codigo: 'MOD-FIN-DESPESAS',
        nome: 'D. Despesas e Pagamentos Operacionais',
        descricao:
          'Recebimento → Extração e classificação → Conferência de duplicidade → Aprovação de alçada → Lançamento → Programação → Confirmação de pagamento → Conciliação bancária.',
        categoria: 'Financeiro',
        status: 'publicado',
        versao_atual: 1,
        fases: [
          {
            id: 'fase-desp-1',
            ordem: 1,
            nome: '1. Recebimento & Checagem de Duplicidade',
            descricao:
              'Conferência por código de barras/documento para evitar pagamento em duplicidade.',
            atividades: [
              {
                id: 'at-desp-1',
                titulo: 'Conferir código de barras, CNPJ e valor para checar duplicidade',
                tipo: 'Formulário',
                funcao_responsavel: 'Financeiro',
                prazo_horas_uteis: 4,
                obrigatoria: true,
                documentos_obrigatorios: ['Boleto ou Guia de Pagamento'],
              },
            ],
          },
          {
            id: 'fase-desp-2',
            ordem: 2,
            nome: '2. Aprovação de Alçada da Despesa',
            descricao: 'Aprovação isolada antes de qualquer lançamento no contas a pagar.',
            atividades: [
              {
                id: 'at-desp-2',
                titulo: 'Aprovação de alçada da despesa pelo Gestor Financeiro',
                tipo: 'Aprovação',
                funcao_responsavel: 'Gestor',
                prazo_horas_uteis: 4,
                obrigatoria: true,
                etapa_retorno_id: 'fase-desp-1',
              },
            ],
          },
          {
            id: 'fase-desp-3',
            ordem: 3,
            nome: '3. Lançamento & Programação Bancária',
            descricao: 'Lançar com centro de custos, conta de origem e agendamento bancário.',
            atividades: [
              {
                id: 'at-desp-3',
                titulo: 'Efetuar lançamento e agendar pagamento no banco credenciado',
                tipo: 'Humana',
                funcao_responsavel: 'Financeiro',
                prazo_horas_uteis: 4,
                obrigatoria: true,
              },
            ],
          },
          {
            id: 'fase-desp-4',
            ordem: 4,
            nome: '4. Confirmação & Conciliação Bancária',
            descricao:
              'Pagamento só confirmado com comprovante de liquidação e conciliação de extrato.',
            atividades: [
              {
                id: 'at-desp-4',
                titulo: 'Anexar comprovante de liquidação e realizar conciliação no extrato',
                tipo: 'Formulário',
                funcao_responsavel: 'Financeiro',
                prazo_horas_uteis: 4,
                obrigatoria: true,
                documentos_obrigatorios: ['Comprovante de Liquidação Bancária'],
              },
            ],
          },
        ],
        configuracao_sla: {
          sla_primeira_resposta_horas: 2,
          sla_resolucao_horas: 24,
          alerta_sem_retorno_horas: 8,
        },
      },

      // E. RENOVAÇÃO E REAJUSTE (90 dias antes, separação reajuste/renovação/revisão)
      {
        codigo: 'MOD-RENOV-REAJUSTE',
        nome: 'E. Renovações Contratuais e Reajustes Anuais',
        descricao:
          'Acompanhamento preventivo 90 dias antes do término. Separação de reajuste por índice, renovação de prazo e revisão de valor. Não encerra contrato automaticamente.',
        categoria: 'Contratos',
        status: 'publicado',
        versao_atual: 1,
        fases: [
          {
            id: 'fase-ren-1',
            ordem: 1,
            nome: '1. Monitoramento Preventivo (90 Dias Antes)',
            descricao:
              'Identificação de contratos a vencer e cálculo de índices oficiais (IGP-M/IPCA).',
            atividades: [
              {
                id: 'at-ren-1',
                titulo: 'Gerar extrato de vencimento e calcular reajuste contratual pelo índice',
                tipo: 'Humana',
                funcao_responsavel: 'Contratos',
                prazo_horas_uteis: 8,
                obrigatoria: true,
              },
            ],
          },
          {
            id: 'fase-ren-2',
            ordem: 2,
            nome: '2. Sondagem de Interesse das Partes',
            descricao: 'Contato estruturado com proprietário e inquilino sobre continuidade.',
            atividades: [
              {
                id: 'at-ren-2',
                titulo: 'Consultar proprietário sobre pretensão de renovação e valor',
                tipo: 'Humana',
                funcao_responsavel: 'Atendimento',
                prazo_horas_uteis: 16,
                obrigatoria: true,
              },
              {
                id: 'at-ren-3',
                titulo: 'Consultar locatário sobre proposta de renovação e reajuste',
                tipo: 'Humana',
                funcao_responsavel: 'Atendimento',
                prazo_horas_uteis: 16,
                obrigatoria: true,
              },
            ],
          },
          {
            id: 'fase-ren-3',
            ordem: 3,
            nome: '3. Negociação ou Revisão de Mercado',
            descricao: 'Tratamento de contrapropostas de reajuste e alinhamento de alçada.',
            atividades: [
              {
                id: 'at-ren-4',
                titulo: 'Aprovação de condições negociadas de renovação',
                tipo: 'Aprovação',
                funcao_responsavel: 'Gestor',
                prazo_horas_uteis: 8,
                obrigatoria: true,
                etapa_retorno_id: 'fase-ren-2',
              },
            ],
          },
          {
            id: 'fase-ren-4',
            ordem: 4,
            nome: '4. Emissão de Aditivo & Assinaturas',
            descricao: 'Emissão de aditamento contratual formal e atualização de garantias.',
            atividades: [
              {
                id: 'at-ren-5',
                titulo: 'Emitir aditivo contratual e colher assinaturas digitais',
                tipo: 'Humana',
                funcao_responsavel: 'Contratos',
                prazo_horas_uteis: 24,
                obrigatoria: true,
                documentos_obrigatorios: ['Termo Aditivo de Renovação Assinado'],
              },
            ],
          },
        ],
        configuracao_sla: {
          sla_primeira_resposta_horas: 4,
          sla_resolucao_horas: 72,
          alerta_sem_retorno_horas: 24,
        },
      },

      // F. DESOCUPAÇÃO (Não encerrar só por entrega de chaves; conferência completa)
      {
        codigo: 'MOD-DESOCUP-COMPLETO',
        nome: 'F. Desocupação e Rescisão de Contrato',
        descricao:
          'Aviso prévio → Conferência contratual → Orientações de entrega → Agendamento de vistoria → Vistoria de saída → Pendências e reparos → Acerto financeiro → Chaves → Encerramento e destinação.',
        categoria: 'Vistorias',
        status: 'publicado',
        versao_atual: 1,
        fases: [
          {
            id: 'fase-desoc-1',
            ordem: 1,
            nome: '1. Aviso Prévio & Conferência Contratual',
            descricao:
              'Registro formal da data de saída e cálculo de multa rescisória proporcional.',
            atividades: [
              {
                id: 'at-desoc-1',
                titulo: 'Registrar aviso prévio de 30 dias e conferir multas/isenções',
                tipo: 'Formulário',
                funcao_responsavel: 'Atendimento',
                prazo_horas_uteis: 4,
                obrigatoria: true,
              },
            ],
          },
          {
            id: 'fase-desoc-2',
            ordem: 2,
            nome: '2. Vistoria de Saída Comparativa',
            descricao: 'Comparação detalhada com o laudo de entrada (pintura, pisos, elétrica).',
            atividades: [
              {
                id: 'at-desoc-2',
                titulo: 'Realizar vistoria de saída e emitir laudo comparativo com entrada',
                tipo: 'Formulário',
                funcao_responsavel: 'Vistorias',
                prazo_horas_uteis: 8,
                obrigatoria: true,
                documentos_obrigatorios: ['Laudo Comparativo de Vistoria de Saída'],
              },
            ],
          },
          {
            id: 'fase-desoc-3',
            ordem: 3,
            nome: '3. Reparos & Tratativa de Avarias',
            descricao: 'Acompanhamento dos reparos pelo inquilino ou indenização pecuniária.',
            atividades: [
              {
                id: 'at-desoc-3',
                titulo: 'Conferir execução de reparos ou obter acordo indenizatório',
                tipo: 'Humana',
                funcao_responsavel: 'Vistorias',
                prazo_horas_uteis: 24,
                obrigatoria: true,
              },
            ],
          },
          {
            id: 'fase-desoc-4',
            ordem: 4,
            nome: '4. Acerto Financeiro Final & Rescisão',
            descricao:
              'Quitação de consumo final (CPFL/SAAE), condomínio, aluguel pro-rata e termo de quitação.',
            atividades: [
              {
                id: 'at-desoc-4',
                titulo: 'Emitir demonstrativo rescisório com contas de consumo quitadas',
                tipo: 'Formulário',
                funcao_responsavel: 'Financeiro',
                prazo_horas_uteis: 8,
                obrigatoria: true,
                documentos_obrigatorios: ['Comprovantes de Quitação Final de Consumo (Água/Luz)'],
              },
              {
                id: 'at-desoc-5',
                titulo: 'Aprovar termo de rescisão e quitação mútua',
                tipo: 'Aprovação',
                funcao_responsavel: 'Gestor',
                prazo_horas_uteis: 4,
                obrigatoria: true,
                etapa_retorno_id: 'fase-desoc-3',
              },
            ],
          },
          {
            id: 'fase-desoc-5',
            ordem: 5,
            nome: '5. Devolução de Chaves & Destinação do Imóvel',
            descricao:
              'Recebimento formal das chaves e direcionamento para recolocação no mercado.',
            atividades: [
              {
                id: 'at-desoc-6',
                titulo: 'Termo de entrega de chaves e encaminhamento para anúncio de vacância',
                tipo: 'Humana',
                funcao_responsavel: 'Atendimento',
                prazo_horas_uteis: 4,
                obrigatoria: true,
                documentos_obrigatorios: ['Termo de Entrega Final de Chaves'],
              },
            ],
          },
        ],
        configuracao_sla: {
          sla_primeira_resposta_horas: 2,
          sla_resolucao_horas: 96,
          alerta_sem_retorno_horas: 24,
        },
      },

      // G. RELACIONAMENTO E SATISFAÇÃO (NPS, pós-manutenção, recuperação de detrator)
      {
        codigo: 'MOD-SATISFACAO-NPS',
        nome: 'G. Relacionamento e Gestão de Satisfação (NPS)',
        descricao:
          'Contatos programados pós-entrada, pós-manutenção, periódicos e pré-renovação. Pesquisas separadas proprietário/inquilino. Avaliação negativa gera tarefa de recuperação automática.',
        categoria: 'Atendimento',
        status: 'publicado',
        versao_atual: 1,
        fases: [
          {
            id: 'fase-sat-1',
            ordem: 1,
            nome: '1. Disparo de Pesquisa Programada',
            descricao: 'Envio de pesquisa de satisfação estruturada via WhatsApp/E-mail.',
            atividades: [
              {
                id: 'at-sat-1',
                titulo: 'Disparar pesquisa NPS segmentada (inquilino ou proprietário)',
                tipo: 'Automação por regra',
                funcao_responsavel: 'Concierge',
                prazo_horas_uteis: 24,
                obrigatoria: true,
              },
            ],
          },
          {
            id: 'fase-sat-2',
            ordem: 2,
            nome: '2. Análise do Retorno & Classificação',
            descricao: 'Separação de Promotores (9-10), Neutros (7-8) e Detratores (0-6).',
            atividades: [
              {
                id: 'at-sat-2',
                titulo: 'Avaliar nota e comentários recebidos do cliente',
                tipo: 'Humana',
                funcao_responsavel: 'Concierge',
                prazo_horas_uteis: 4,
                obrigatoria: true,
              },
            ],
          },
          {
            id: 'fase-sat-3',
            ordem: 3,
            nome: '3. Plano de Recuperação de Detratores',
            descricao: 'Contato direto do gestor em até 24h para reverter insatisfação.',
            atividades: [
              {
                id: 'at-sat-3',
                titulo: 'Contato humanizado do Gestor para plano de recuperação de cliente',
                tipo: 'Humana',
                funcao_responsavel: 'Gestor',
                prazo_horas_uteis: 8,
                obrigatoria: true,
              },
            ],
          },
        ],
        configuracao_sla: {
          sla_primeira_resposta_horas: 2,
          sla_resolucao_horas: 24,
          alerta_sem_retorno_horas: 8,
        },
      },

      // H. VACÂNCIA E RECOLOCAÇÃO (30/60/90 dias de revisão de preço, anúncios)
      {
        codigo: 'MOD-VACANCIA-RECOLOC',
        nome: 'H. Vacância e Recolocação de Imóveis',
        descricao:
          'Liberação → Conferência cadastral → Avaliação de preço de mercado → Preparação do anúncio com fotos profissionais → Publicação → Acompanhamento de visitas → Revisões sugeridas aos 30/60/90 dias → Propostas → Locação.',
        categoria: 'Contratos',
        status: 'publicado',
        versao_atual: 1,
        fases: [
          {
            id: 'fase-vac-1',
            ordem: 1,
            nome: '1. Liberação & Avaliação de Preço de Mercado',
            descricao:
              'Análise de liquidez e precificação comparativa na região de Jaú/Pederneiras/Lençóis.',
            atividades: [
              {
                id: 'at-vac-1',
                titulo: 'Emitir parecer comparativo de valor de aluguel e IPTU/condomínio',
                tipo: 'Formulário',
                funcao_responsavel: 'Comercial',
                prazo_horas_uteis: 8,
                obrigatoria: true,
              },
            ],
          },
          {
            id: 'fase-vac-2',
            ordem: 2,
            nome: '2. Produção de Mídia & Publicação',
            descricao:
              'Fotos profissionais, tour virtual, placa no imóvel e publicação nos portais.',
            atividades: [
              {
                id: 'at-vac-2',
                titulo: 'Fotografia profissional, descrição atrativa e anúncio em portais',
                tipo: 'Humana',
                funcao_responsavel: 'Comercial',
                prazo_horas_uteis: 16,
                obrigatoria: true,
                documentos_obrigatorios: ['Fotos Profissionais do Imóvel'],
              },
            ],
          },
          {
            id: 'fase-vac-3',
            ordem: 3,
            nome: '3. Acompanhamento & Revisões 30/60/90 Dias',
            descricao:
              'Revisão periódica de visitas, leads e alinhamento de desconto com o proprietário.',
            atividades: [
              {
                id: 'at-vac-3',
                titulo:
                  'Apresentar relatório de visualizações e sugestão de ajuste de preço ao proprietário',
                tipo: 'Humana',
                funcao_responsavel: 'Comercial',
                prazo_horas_uteis: 24,
                obrigatoria: true,
              },
            ],
          },
          {
            id: 'fase-vac-4',
            ordem: 4,
            nome: '4. Recepção de Proposta & Conclusão',
            descricao:
              'Encaminhamento da proposta aceita diretamente para a esteira de Nova Locação.',
            atividades: [
              {
                id: 'at-vac-4',
                titulo: 'Formalizar aceite de proposta e migrar para Esteira de Nova Locação',
                tipo: 'Aprovação',
                funcao_responsavel: 'Gestor',
                prazo_horas_uteis: 4,
                obrigatoria: true,
                etapa_retorno_id: 'fase-vac-3',
              },
            ],
          },
        ],
        configuracao_sla: {
          sla_primeira_resposta_horas: 4,
          sla_resolucao_horas: 72,
          alerta_sem_retorno_horas: 24,
        },
      },
    ]

    for (const mod of modelosParaCriar) {
      try {
        const existing = app.findRecordsByFilter(
          'modelos_processos',
          "codigo = '" + mod.codigo + "'",
          '',
          1,
          0,
        )

        if (existing.length === 0) {
          const m = new Record(modCol)
          m.set('codigo', mod.codigo)
          m.set('nome', mod.nome)
          m.set('descricao', mod.descricao)
          m.set('categoria', mod.categoria)
          m.set('status', mod.status)
          m.set('versao_atual', mod.versao_atual)
          m.set('fases', JSON.stringify(mod.fases))
          m.set('configuracao_sla', JSON.stringify(mod.configuracao_sla))
          m.set('criado_por', 'Carlos Silva (Administrador)')
          m.set('publicado_em', '2026-06-01 10:00:00')
          m.set('is_demo', true)
          app.save(m)

          // Snapshot de versão inicial no histórico imutável
          const ver = new Record(verCol)
          ver.set('modelo_id', m.id)
          ver.set('versao', 1)
          ver.set(
            'snapshot',
            JSON.stringify({
              codigo: mod.codigo,
              nome: mod.nome,
              descricao: mod.descricao,
              fases: mod.fases,
              configuracao_sla: mod.configuracao_sla,
            }),
          )
          ver.set('nota_versao', 'Modelo padrão operacional Gabriel v1 publicado.')
          ver.set('publicado_por', 'Carlos Silva (Administrador)')
          ver.set('is_demo', true)
          app.save(ver)
        }
      } catch (err) {
        console.log('Erro ao criar modelo ' + mod.codigo + ': ' + err)
      }
    }
  },
  (app) => {
    // rollback
  },
)
