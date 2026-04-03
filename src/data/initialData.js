import { addDays, format, subDays } from 'date-fns';

function getConfig(key, fallback) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch { return fallback; }
}

export const DEFAULT_COLIGADAS = {
  '1': { nome: 'Concreta', color: '#3b82f6' },
  '4': { nome: 'JPL Gomes', color: '#10b981' },
  '11': { nome: 'JC Gomes', color: '#8b5cf6' },
};

export const COLIGADAS = getConfig('desligest_coligadas', DEFAULT_COLIGADAS);

const today = new Date();

export const DEFAULT_MOTIVOS = [
  { value: 'pedido', label: 'Pedido de Demissão', class: 'motivo-pedido' },
  { value: 'demissao', label: 'Demissão sem Justa Causa', class: 'motivo-demissao' },
  { value: 'acordo', label: 'Acordo Mútuo (§6 da CLT)', class: 'motivo-acordo' },
  { value: 'justa', label: 'Demissão com Justa Causa', class: 'motivo-justa' },
  { value: 'aposentadoria', label: 'Aposentadoria', class: 'motivo-aposentadoria' },
  { value: 'termino_empresa', label: 'Término Antecipado — Empresa', class: 'motivo-termino' },
  { value: 'termino_empregado', label: 'Término Antecipado — Empregado', class: 'motivo-termino' },
  { value: 'termino_contrato', label: 'Término de Contrato', class: 'motivo-termino' },
];

export const MOTIVOS = getConfig('desligest_motivos', DEFAULT_MOTIVOS);

export const DEFAULT_STATUS_FLOW = [
  { key: 'comunicado', label: 'Comunicado', short: 'Com.', color: 'var(--accent-blue)' },
  { key: 'documentacao', label: 'Documentação', short: 'Doc.', color: 'var(--accent-yellow)' },
  { key: 'homologacao', label: 'Homologação', short: 'Hom.', color: 'var(--accent-purple)' },
  { key: 'aguardando', label: 'Ag. Pagamento', short: 'Ag. Pag.', color: 'var(--accent-orange)' },
  { key: 'pendente_comprovante', label: 'Pend. Comprovante', short: 'P. Comp.', color: 'var(--accent-red)' },
  { key: 'pago', label: 'Pago', short: 'Pago', color: 'var(--accent-green)' },
];

export const STATUS_FLOW = getConfig('desligest_status_flow', DEFAULT_STATUS_FLOW);

export const DEFAULT_CHECKLIST_TEMPLATE = [
  { id: 'c1', label: 'Comunicado de desligamento assinado', etapa: 'comunicado' },
  { id: 'c2', label: 'Aviso prévio calculado e registrado', etapa: 'comunicado' },
  { id: 'c3', label: 'Notificação ao eSocial enviada', etapa: 'comunicado' },
  { id: 'd1', label: 'Carta de demissão / termo de acordo', etapa: 'documentacao' },
  { id: 'd2', label: 'Exame demissional agendado', etapa: 'documentacao' },
  { id: 'd3', label: 'Exame demissional realizado', etapa: 'documentacao' },
  { id: 'd6', label: 'Horas extras e banco de horas levantados', etapa: 'documentacao' },
  { id: 'h1', label: 'Termo de rescisão gerado no sistema', etapa: 'homologacao' },
  { id: 'h2', label: 'Cálculo da rescisão conferido', etapa: 'homologacao' },
  { id: 'h3', label: 'TRCT assinado pelo funcionário', etapa: 'homologacao' },
  { id: 'h4', label: 'Guia FGTS (GRRF) emitida', etapa: 'homologacao' },
  { id: 'h5', label: 'FGTS rescisório recolhido', etapa: 'homologacao' },
  { id: 'p1', label: 'Depósito da rescisão realizado', etapa: 'aguardando' },
  { id: 'p2', label: 'Comprovante de pagamento arquivado', etapa: 'pago' },
  { id: 'p3', label: 'Processo encerrado no sistema', etapa: 'pago' },
];

export const CHECKLIST_TEMPLATE = getConfig('desligest_checklist', DEFAULT_CHECKLIST_TEMPLATE);

function makeChecklist() {
  return CHECKLIST_TEMPLATE.map(item => ({ ...item, done: false, doneAt: null }));
}

export const INITIAL_DATA = [
  {
    id: '1',
    nome: 'Carlos Eduardo Souza',
    cargo: 'Analista de TI',
    departamento: 'Tecnologia',
    matricula: 'TI-2019-045',
    dataAdmissao: '2019-03-15',
    dataComunicado: format(subDays(today, 20), 'yyyy-MM-dd'),
    dataDesligamento: format(subDays(today, 10), 'yyyy-MM-dd'),
    dataPagamento: format(addDays(today, 5), 'yyyy-MM-dd'),
    motivo: 'pedido',
    avisoPrevio: 'indenizado',
    status: 'homologacao',
    observacoes: 'Funcionário solicitou desligamento para assumir outra posição no mercado.',
    responsavel: 'Ana Lima (RH)',
    checklist: CHECKLIST_TEMPLATE.map(item => ({
      ...item,
      done: ['c1','c2','c3','d1','d2','d3','d4','d5','d6','h1','h2','h3'].includes(item.id),
      doneAt: ['c1','c2','c3','d1','d2','d3','d4','d5','d6','h1','h2','h3'].includes(item.id) ? format(subDays(today, 5), 'yyyy-MM-dd') : null,
    })),
    historico: [
      { data: format(subDays(today, 20), 'yyyy-MM-dd HH:mm'), acao: 'Comunicado emitido', nota: 'Pedido de demissão protocaldo.' },
      { data: format(subDays(today, 18), 'yyyy-MM-dd HH:mm'), acao: 'Documentação iniciada', nota: '' },
      { data: format(subDays(today, 10), 'yyyy-MM-dd HH:mm'), acao: 'Exame demissional realizado', nota: 'Apto.' },
      { data: format(subDays(today, 6), 'yyyy-MM-dd HH:mm'), acao: 'Rescisão gerada no sistema', nota: '' },
    ],
  },
  {
    id: '2',
    nome: 'Mariana Costa Alves',
    cargo: 'Supervisora de Vendas',
    departamento: 'Comercial',
    matricula: 'COM-2021-012',
    dataAdmissao: '2021-06-01',
    dataComunicado: format(subDays(today, 8), 'yyyy-MM-dd'),
    dataDesligamento: format(addDays(today, 22), 'yyyy-MM-dd'),
    dataPagamento: format(addDays(today, 12), 'yyyy-MM-dd'),
    motivo: 'demissao',
    avisoPrevio: 'trabalhado',
    status: 'documentacao',
    observacoes: 'Demissão sem justa causa por reestruturação do departamento.',
    responsavel: 'João Pedro (RH)',
    checklist: CHECKLIST_TEMPLATE.map(item => ({
      ...item,
      done: ['c1','c2','c3','d1'].includes(item.id),
      doneAt: ['c1','c2','c3','d1'].includes(item.id) ? format(subDays(today, 4), 'yyyy-MM-dd') : null,
    })),
    historico: [
      { data: format(subDays(today, 8), 'yyyy-MM-dd HH:mm'), acao: 'Comunicado emitido', nota: 'Reestruturação organizacional.' },
      { data: format(subDays(today, 6), 'yyyy-MM-dd HH:mm'), acao: 'Documentação iniciada', nota: '' },
    ],
  },
  {
    id: '3',
    nome: 'Roberto Fernandes',
    cargo: 'Auxiliar Administrativo',
    departamento: 'Administrativo',
    matricula: 'ADM-2017-089',
    dataAdmissao: '2017-01-10',
    dataComunicado: format(subDays(today, 35), 'yyyy-MM-dd'),
    dataDesligamento: format(subDays(today, 5), 'yyyy-MM-dd'),
    dataPagamento: format(addDays(today, 2), 'yyyy-MM-dd'),
    motivo: 'acordo',
    avisoPrevio: 'indenizado',
    status: 'aguardando',
    observacoes: 'Acordo rescisório negociado com base no §6 do art. 484-A da CLT.',
    responsavel: 'Ana Lima (RH)',
    checklist: CHECKLIST_TEMPLATE.map(item => ({
      ...item,
      done: !['p2','p3'].includes(item.id),
      doneAt: !['p2','p3'].includes(item.id) ? format(subDays(today, 3), 'yyyy-MM-dd') : null,
    })),
    historico: [
      { data: format(subDays(today, 35), 'yyyy-MM-dd HH:mm'), acao: 'Comunicado emitido', nota: 'Acordo mútuo entre as partes.' },
      { data: format(subDays(today, 30), 'yyyy-MM-dd HH:mm'), acao: 'Documentação concluída', nota: '' },
      { data: format(subDays(today, 20), 'yyyy-MM-dd HH:mm'), acao: 'Homologação realizada', nota: 'TRCT assinado.' },
      { data: format(subDays(today, 10), 'yyyy-MM-dd HH:mm'), acao: 'FGTS recolhido', nota: 'GRRF emitida e paga.' },
    ],
  },
  {
    id: '4',
    nome: 'Juliana Mendes Ribeiro',
    cargo: 'Gerente Financeira',
    departamento: 'Financeiro',
    matricula: 'FIN-2016-003',
    dataAdmissao: '2016-08-22',
    dataComunicado: format(subDays(today, 40), 'yyyy-MM-dd'),
    dataDesligamento: format(subDays(today, 12), 'yyyy-MM-dd'),
    dataPagamento: format(subDays(today, 2), 'yyyy-MM-dd'),
    motivo: 'aposentadoria',
    avisoPrevio: 'nao_aplicavel',
    status: 'pago',
    observacoes: 'Aposentadoria por tempo de contribuição. Processo concluído com sucesso.',
    responsavel: 'Carla Nunes (RH)',
    checklist: CHECKLIST_TEMPLATE.map(item => ({ ...item, done: true, doneAt: format(subDays(today, 5), 'yyyy-MM-dd') })),
    historico: [
      { data: format(subDays(today, 40), 'yyyy-MM-dd HH:mm'), acao: 'Comunicado emitido', nota: 'Aposentadoria por tempo de contribuição.' },
      { data: format(subDays(today, 35), 'yyyy-MM-dd HH:mm'), acao: 'Documentação concluída', nota: '' },
      { data: format(subDays(today, 20), 'yyyy-MM-dd HH:mm'), acao: 'Homologação realizada', nota: '' },
      { data: format(subDays(today, 10), 'yyyy-MM-dd HH:mm'), acao: 'Aguardando pagamento', nota: '' },
      { data: format(subDays(today, 2), 'yyyy-MM-dd HH:mm'), acao: 'Pagamento realizado', nota: 'Rescisão quitada.' },
    ],
  },
  {
    id: '5',
    nome: 'Fernando Gomes Pereira',
    cargo: 'Operador de Produção',
    departamento: 'Produção',
    matricula: 'PRD-2022-156',
    dataAdmissao: '2022-02-28',
    dataComunicado: format(today, 'yyyy-MM-dd'),
    dataDesligamento: format(addDays(today, 30), 'yyyy-MM-dd'),
    dataPagamento: format(addDays(today, 15), 'yyyy-MM-dd'),
    motivo: 'demissao',
    avisoPrevio: 'trabalhado',
    status: 'comunicado',
    observacoes: '',
    responsavel: 'João Pedro (RH)',
    checklist: makeChecklist(),
    historico: [
      { data: format(today, 'yyyy-MM-dd HH:mm'), acao: 'Comunicado emitido', nota: 'Processo de desligamento iniciado.' },
    ],
  },
];

export const DEFAULT_LINKS_UTEIS = [
  { id: '1', label: 'Cálculo Exato', url: 'https://calculoexato.com.br/', category: 'Cálculos' },
  { id: '2', label: 'Portal eSocial', url: 'https://login.esocial.gov.br/', category: 'Portais' },
  { id: '3', label: 'Consultar CBO', url: 'https://mtecbo.gov.br/cbosite/pages/home.jsf', category: 'Consultas' },
  { id: '4', label: 'FGTS (Conectividade)', url: 'https://conectividadesocial.caixa.gov.br/', category: 'Portais' },
];

export const LINKS_UTEIS = getConfig('desligest_links', DEFAULT_LINKS_UTEIS);
