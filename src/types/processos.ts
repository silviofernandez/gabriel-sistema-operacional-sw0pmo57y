export type GabrielUnidade = 'Jaú' | 'Pederneiras' | 'Lençóis Paulista'

export type GabrielRole =
  | 'Administrador'
  | 'Gestor'
  | 'Atendimento'
  | 'Contratos'
  | 'Manutenção'
  | 'Financeiro'
  | 'Consulta'

export type CasoStatus =
  | 'Novo'
  | 'Em atendimento'
  | 'Aguardando cliente'
  | 'Aguardando proprietário'
  | 'Aguardando prestador'
  | 'Aguardando aprovação interna'
  | 'Resolvido'
  | 'Cancelado'
  | 'Reaberto'

export type CasoPrioridade = 'Baixa' | 'Média' | 'Alta' | 'Urgente'

export type CanalOrigem = 'WhatsApp' | 'Site' | 'Telefone' | 'Balcão' | 'E-mail' | 'Interno'

export type TipoAtividade =
  | 'Humana'
  | 'Automação por regra'
  | 'IA'
  | 'Aprovação'
  | 'Formulário'
  | 'Aguardar evento externo'

export type AtividadeStatus =
  | 'Pendente'
  | 'Em Andamento'
  | 'Aguardando aprovação'
  | 'Aguardando terceiros'
  | 'Concluída'
  | 'Recusada'
  | 'Atrasada'

export interface CampoFormularioDef {
  id: string
  nome: string
  label: string
  tipo:
    | 'texto'
    | 'numero'
    | 'moeda'
    | 'data'
    | 'selecao'
    | 'multipla_selecao'
    | 'cpf_cnpj'
    | 'telefone'
    | 'email'
    | 'anexo'
    | 'booleano'
  obrigatorio?: boolean
  opcoes?: string[]
  condicao_exibicao?: {
    campo: string
    operador: 'igual' | 'diferente' | 'preenchido'
    valor?: any
  }
  grupo_repetivel?: boolean
  ajuda?: string
}

export interface AtividadeModeloDef {
  id: string
  titulo: string
  descricao?: string
  tipo: TipoAtividade
  funcao_responsavel?: GabrielRole | 'Qualquer'
  responsavel_id?: string
  prazo_horas_uteis: number
  obrigatoria?: boolean
  is_paralela?: boolean
  depende_de_atividades?: string[]
  documentos_obrigatorios?: string[]
  formulario_campos?: CampoFormularioDef[]
  etapa_retorno_id?: string
  ai_config_status?: string
}

export interface FaseModeloDef {
  id: string
  ordem: number
  nome: string
  descricao?: string
  atividades: AtividadeModeloDef[]
}

export interface ModeloProcesso {
  id: string
  codigo: string
  nome: string
  descricao?: string
  categoria?: string
  status: 'rascunho' | 'publicado' | 'arquivado'
  versao_atual: number
  fases: FaseModeloDef[]
  configuracao_sla?: {
    sla_primeira_resposta_horas: number
    sla_resolucao_horas: number
    alerta_sem_retorno_horas?: number
  }
  criado_por?: string
  publicado_em?: string
  is_demo?: boolean
  created?: string
  updated?: string
}

export interface VersaoProcessoSnapshot {
  id: string
  modelo_id: string
  versao: number
  snapshot: {
    codigo: string
    nome: string
    descricao?: string
    fases: FaseModeloDef[]
    configuracao_sla?: Record<string, any>
  }
  nota_versao?: string
  publicado_por?: string
  is_demo?: boolean
  created?: string
}

export interface BloqueioPendente {
  tipo: 'documento' | 'aprovacao' | 'formulario'
  descricao: string
  detalhe?: string
}

export interface HistoricoEtapa {
  fase: string
  fase_id?: string
  data_inicio: string
  data_conclusao: string | null
  usuario: string
  motivo_retorno?: string
}

export interface CasoProcesso {
  id: string
  protocolo: string
  titulo: string
  modelo_id: string
  versao_modelo: number
  unidade: GabrielUnidade
  status: CasoStatus
  prioridade: CasoPrioridade
  justificativa_prioridade?: string
  fase_atual_id: string
  fase_atual_nome: string
  solicitante_nome: string
  solicitante_email?: string
  solicitante_telefone?: string
  canal_origem: CanalOrigem
  cliente_id?: string
  cliente_nome?: string
  imovel_id?: string
  imovel_titulo?: string
  contrato_id?: string
  responsavel_id?: string
  responsavel_nome?: string
  equipe?: string
  proxima_acao?: string
  data_abertura: string
  prazo_primeira_resposta?: string
  data_primeira_resposta_humana?: string
  prazo_resolucao?: string
  prazo_prometido_cliente?: string
  data_ultimo_retorno_cliente?: string
  motivo_pausa?: string
  motivo_cancelamento?: string
  motivo_reabertura?: string
  caso_origem_protocolo?: string
  casos_relacionados?: string[]
  dados_formulario?: Record<string, any>
  bloqueios_pendentes?: BloqueioPendente[]
  historico_etapas?: HistoricoEtapa[]
  is_demo?: boolean
  created?: string
  updated?: string
}

export interface AtividadeCaso {
  id: string
  caso_id: string
  caso_protocolo: string
  fase_id: string
  titulo: string
  descricao?: string
  tipo: TipoAtividade
  status: AtividadeStatus
  responsavel_tipo?: 'pessoa' | 'equipe' | 'funcao' | 'sistema'
  responsavel_id?: string
  responsavel_nome?: string
  funcao_responsavel?: string
  substituto_id?: string
  prazo?: string
  data_conclusao?: string
  depende_de_atividades?: string[]
  is_paralela?: boolean
  condicoes_conclusao?: Record<string, any>
  documentos_obrigatorios?: string[]
  documentos_anexados?: { nome: string; url?: string; data: string }[]
  formulario_dados?: Record<string, any>
  aprovado_por?: string
  parecer_aprovacao?: string
  motivo_recusa?: string
  etapa_retorno_id?: string
  ai_config_status?: string
  is_demo?: boolean
  created?: string
  updated?: string
}

export interface ComentarioCaso {
  id: string
  caso_id: string
  caso_protocolo: string
  visibilidade: 'interno' | 'externo_cliente'
  autor_id: string
  autor_nome: string
  mensagem: string
  anexos?: { nome: string; url: string }[]
  is_demo?: boolean
  created?: string
}

export interface ConfiguracaoExpediente {
  id: string
  unidade: string
  fuso_horario: string
  dias_uteis: number[] // [1,2,3,4,5]
  hora_inicio: string // "08:30"
  hora_fim: string // "18:00"
  hora_almoco_inicio?: string // "12:00"
  hora_almoco_fim?: string // "13:30"
  feriados: string[] // ["2026-01-01", ...]
  sla_primeira_resposta_horas: number
  permite_plantao_emergencia: boolean
  is_demo?: boolean
}
