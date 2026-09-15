export interface PipelineStage {
  id: string // "1" .. "12"
  number: number
  name: string
  shortName: string
  description: string
  route?: string
  responsibleRole: string
}

export const PIPELINE_STAGES: PipelineStage[] = [
  {
    id: '1',
    number: 1,
    name: '1. Captação / Proposta',
    shortName: 'Captação',
    description: 'Recepção de propostas, análise comercial inicial e intenção de locação.',
    route: '/clientes',
    responsibleRole: 'Equipe Comercial',
  },
  {
    id: '2',
    number: 2,
    name: '2. Documentação & Score',
    shortName: 'Documentação',
    description: 'Validação de documentos, score de crédito e análise de garantias.',
    route: '/contratos',
    responsibleRole: 'Equipe Administrativa',
  },
  {
    id: '3',
    number: 3,
    name: '3. Formalização do Contrato',
    shortName: 'Formalização',
    description: 'Elaboração de minutas contratuais e cláusulas particulares.',
    route: '/contratos',
    responsibleRole: 'Equipe Administrativa',
  },
  {
    id: '4',
    number: 4,
    name: '4. Vistoria de Entrada',
    shortName: 'Vistoria Entrada',
    description:
      'Inspeção inicial detalhada do imóvel com laudo fotográfico e conferência de avarias.',
    route: '/vistorias',
    responsibleRole: 'Equipe de Vistoria',
  },
  {
    id: '5',
    number: 5,
    name: '5. Assinatura & Ativação',
    shortName: 'Assinatura',
    description: 'Coleta de assinaturas digitais, ativação no sistema e seguro fiança.',
    route: '/contratos',
    responsibleRole: 'Gestor',
  },
  {
    id: '6',
    number: 6,
    name: '6. Entrega de Chaves',
    shortName: 'Entrega de Chaves',
    description: 'Termo de entrega de chaves físicas/tags e liberação ao locatário.',
    route: '/kanban',
    responsibleRole: 'Concierge',
  },
  {
    id: '7',
    number: 7,
    name: '7. Régua do Inquilino (Concierge)',
    shortName: 'Régua Concierge',
    description: 'Acolhimento pós-mudança (D+5), check-in de estabilização e acompanhamento NPS.',
    route: '/concierge',
    responsibleRole: 'Concierge',
  },
  {
    id: '8',
    number: 8,
    name: '8. Manutenções & Reparos',
    shortName: 'Manutenções',
    description:
      'Gestão de ordens de serviço, orçamentos e intervenções estruturais ou emergenciais.',
    route: '/manutencoes',
    responsibleRole: 'Equipe de Vistoria',
  },
  {
    id: '9',
    number: 9,
    name: '9. Financeiro & Repasses',
    shortName: 'Financeiro',
    description: 'Emissão de boletos, cobrança de encargos, conciliação e repasse aos locadores.',
    route: '/financeiro',
    responsibleRole: 'Equipe Financeira',
  },
  {
    id: '10',
    number: 10,
    name: '10. Renovações',
    shortName: 'Renovações',
    description: 'Negociação de reajustes anuais, repactuação e aditivos contratuais proativos.',
    route: '/renovacoes',
    responsibleRole: 'Concierge',
  },
  {
    id: '11',
    number: 11,
    name: '11. Desocupação & Vistoria de Saída',
    shortName: 'Vistoria Saída',
    description: 'Aviso de desocupação, conferência comparativa e apuração de reparos.',
    route: '/desocupacoes',
    responsibleRole: 'Equipe de Vistoria',
  },
  {
    id: '12',
    number: 12,
    name: '12. Rescisão & Acerto Final',
    shortName: 'Rescisão',
    description: 'Acerto de contas proporcional, rescisão formal e encerramento de garantia.',
    route: '/contratos',
    responsibleRole: 'Equipe Financeira',
  },
]

export type AuditActionType =
  | 'visualizou'
  | 'visualizou_adjacente'
  | 'editou'
  | 'avancou_etapa'
  | 'criou_tarefa'
  | 'concluiu_tarefa'
  | 'reabriu_tarefa'
  | 'acessou_com_permissao_extra'
  | 'tentou_acesso_negado'
  | 'gerenciou_meta'
  | 'atingiu_meta'

export interface AuditLogItem {
  id: string
  colaborador_id: string
  colaborador_nome: string
  acao_tipo: AuditActionType
  etapa_id?: string
  etapa_propria?: boolean
  contrato_id?: string
  dados_antes?: Record<string, unknown>
  dados_depois?: Record<string, unknown>
  ip?: string
  dispositivo?: string
  autorizado_por?: string
  motivo?: string
  timestamp: string
  created?: string
}

export interface StagePermissionItem {
  id: string
  colaborador_id: string
  etapa_id: string
  tipo: 'permanente' | 'temporaria'
  data_inicio?: string
  data_fim?: string
  motivo?: string
  autorizado_por?: string
  is_active?: boolean
}

export interface EmployeeCoverage {
  id: string
  colaborador_ausente_id: string
  colaborador_ausente_nome: string
  colaborador_substituto_id: string
  colaborador_substituto_nome: string
  etapas_cobertas: string[]
  data_inicio: string
  data_fim_prevista: string
  data_fim_real?: string
  motivo: string
  autorizado_por: string
  status: 'ativa' | 'concluida' | 'cancelada'
  relatorio_acoes?: { data: string; acao: string }[]
}

export interface DailyMetricItem {
  id: string
  colaborador_id: string
  colaborador_nome: string
  data: string
  tarefas_total: number
  tarefas_no_prazo: number
  tarefas_atrasadas: number
  tarefas_reabertas: number
  tempo_medio_conclusao_min: number
  acessos_negados: number
  acessos_adjacentes: number
  score_sla: number
  score_qualidade: number
  score_volume: number
  score_comportamento: number
  score_total: number
  classificacao: 'Excelente' | 'Bom' | 'Atenção' | 'Crítico'
}

export interface FormalRecordItem {
  id: string
  colaborador_id: string
  colaborador_nome?: string
  tipo: 'acerto' | 'ocorrencia'
  descricao: string
  contrato_id?: string
  impacto: 'Baixo' | 'Médio' | 'Alto' | 'Crítico'
  registrado_por: string
  visibilidade: 'todos' | 'gestores'
  tipo_erro?: string
  plano_acao?: string
  created?: string
}

export interface NotificationItem {
  id: string
  destinatario_id?: string
  destinatario_nome?: string
  telefone?: string
  mensagem: string
  tipo:
    | 'whatsapp_parabens'
    | 'whatsapp_sla_alerta'
    | 'whatsapp_cobertura'
    | 'whatsapp_gestor_tentativa'
    | 'whatsapp_gestor_retrabalho'
    | 'whatsapp_gestor_destaque'
    | 'whatsapp_retorno_cobertura'
    | 'sistema'
  status: 'pendente' | 'enviada' | 'lida'
  enviada_em?: string
  metadata?: Record<string, unknown>
  created?: string
}

export interface TarefaOrdemItem {
  id: string
  titulo: string
  descricao?: string
  responsavel_id: string
  responsavel_nome?: string
  etapa_id: string
  contrato_id?: string
  imovel_titulo?: string
  prioridade: 'Baixa' | 'Média' | 'Alta' | 'Crítica'
  status: 'Pendente' | 'Em Andamento' | 'Concluída' | 'Atrasada'
  tipo?: 'Operacional' | 'Concierge' | 'Demanda' | 'Manutenção' | 'Vistoria' | 'Administrativo'
  prazo?: string
  sla_horas?: number
  criado_por?: string
  ai_urgency?: string
  ai_risk_flag?: boolean
  checklists?: { id: string; text: string; done: boolean }[]
  created?: string
  updated?: string
}

export type MetaMetricaTipo =
  | 'tarefas_concluidas'
  | 'sla_prazo_pct'
  | 'score_minimo'
  | 'contratos_avancados'

export interface MetaPremioItem {
  id: string
  etapa_id: string // "1" .. "12"
  titulo: string
  descricao?: string
  tipo_metrica: MetaMetricaTipo
  valor_alvo: number
  premio_valor: number // R$
  data_inicio: string // YYYY-MM-DD
  data_fim: string // YYYY-MM-DD
  criado_por?: string
  is_active?: boolean
  created?: string
  updated?: string
}
