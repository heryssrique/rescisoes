/**
 * Dados iniciais para seed do MongoDB.
 * Execute via: POST /api/desligamentos/seed
 * Ou via script: node seed/run.js
 */

const { addDays, format, subDays } = require('date-fns');

const today = new Date();

const CHECKLIST_TEMPLATE = [
  { id: 'c1', label: 'Comunicado de desligamento assinado', etapa: 'comunicado', done: false, doneAt: null },
  { id: 'c2', label: 'Aviso prévio calculado e registrado', etapa: 'comunicado', done: false, doneAt: null },
  { id: 'c3', label: 'Notificação ao eSocial enviada', etapa: 'comunicado', done: false, doneAt: null },
  { id: 'd1', label: 'Carta de demissão / termo de acordo', etapa: 'documentacao', done: false, doneAt: null },
  { id: 'd2', label: 'Exame demissional agendado', etapa: 'documentacao', done: false, doneAt: null },
  { id: 'd3', label: 'Exame demissional realizado', etapa: 'documentacao', done: false, doneAt: null },
  { id: 'd4', label: 'Cópia CTPS para baixa', etapa: 'documentacao', done: false, doneAt: null },
  { id: 'd5', label: 'Comprovante de salário base', etapa: 'documentacao', done: false, doneAt: null },
  { id: 'd6', label: 'Horas extras e banco de horas levantados', etapa: 'documentacao', done: false, doneAt: null },
  { id: 'h1', label: 'Termo de rescisão gerado no sistema', etapa: 'homologacao', done: false, doneAt: null },
  { id: 'h2', label: 'Cálculo da rescisão conferido', etapa: 'homologacao', done: false, doneAt: null },
  { id: 'h3', label: 'TRCT assinado pelo funcionário', etapa: 'homologacao', done: false, doneAt: null },
  { id: 'h4', label: 'Guia FGTS (GRRF) emitida', etapa: 'homologacao', done: false, doneAt: null },
  { id: 'h5', label: 'FGTS rescisório recolhido', etapa: 'homologacao', done: false, doneAt: null },
  { id: 'h6', label: 'Guia INSS rescisória emitida', etapa: 'homologacao', done: false, doneAt: null },
  { id: 'h7', label: 'CTPS com baixa anotada entregue', etapa: 'homologacao', done: false, doneAt: null },
  { id: 'p1', label: 'Depósito da rescisão realizado', etapa: 'aguardando', done: false, doneAt: null },
  { id: 'p2', label: 'Comprovante de pagamento arquivado', etapa: 'pago', done: false, doneAt: null },
  { id: 'p3', label: 'Processo encerrado no sistema', etapa: 'pago', done: false, doneAt: null },
];

function makeChecklist(doneIds = []) {
  return CHECKLIST_TEMPLATE.map(item => ({
    ...item,
    done: doneIds.includes(item.id),
    doneAt: doneIds.includes(item.id) ? format(subDays(today, 5), "yyyy-MM-dd'T'HH:mm:ss") : null,
  }));
}

const INITIAL_DATA = [
  {
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
    checklist: makeChecklist(['c1','c2','c3','d1','d2','d3','d4','d5','d6','h1','h2','h3']),
    historico: [
      { data: format(subDays(today, 20), "yyyy-MM-dd'T'HH:mm:ss"), acao: 'Comunicado emitido', nota: 'Pedido de demissão protocolado.' },
      { data: format(subDays(today, 18), "yyyy-MM-dd'T'HH:mm:ss"), acao: 'Documentação iniciada', nota: '' },
      { data: format(subDays(today, 10), "yyyy-MM-dd'T'HH:mm:ss"), acao: 'Exame demissional realizado', nota: 'Apto.' },
      { data: format(subDays(today, 6), "yyyy-MM-dd'T'HH:mm:ss"), acao: 'Rescisão gerada no sistema', nota: '' },
    ],
  },
  {
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
    checklist: makeChecklist(['c1','c2','c3','d1']),
    historico: [
      { data: format(subDays(today, 8), "yyyy-MM-dd'T'HH:mm:ss"), acao: 'Comunicado emitido', nota: 'Reestruturação organizacional.' },
      { data: format(subDays(today, 6), "yyyy-MM-dd'T'HH:mm:ss"), acao: 'Documentação iniciada', nota: '' },
    ],
  },
  {
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
    checklist: makeChecklist(['c1','c2','c3','d1','d2','d3','d4','d5','d6','h1','h2','h3','h4','h5','h6','h7','p1']),
    historico: [
      { data: format(subDays(today, 35), "yyyy-MM-dd'T'HH:mm:ss"), acao: 'Comunicado emitido', nota: 'Acordo mútuo entre as partes.' },
      { data: format(subDays(today, 30), "yyyy-MM-dd'T'HH:mm:ss"), acao: 'Documentação concluída', nota: '' },
      { data: format(subDays(today, 20), "yyyy-MM-dd'T'HH:mm:ss"), acao: 'Homologação realizada', nota: 'TRCT assinado.' },
      { data: format(subDays(today, 10), "yyyy-MM-dd'T'HH:mm:ss"), acao: 'FGTS recolhido', nota: 'GRRF emitida e paga.' },
    ],
  },
  {
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
    observacoes: 'Aposentadoria por tempo de contribuição.',
    responsavel: 'Carla Nunes (RH)',
    checklist: makeChecklist(['c1','c2','c3','d1','d2','d3','d4','d5','d6','h1','h2','h3','h4','h5','h6','h7','p1','p2','p3']),
    historico: [
      { data: format(subDays(today, 40), "yyyy-MM-dd'T'HH:mm:ss"), acao: 'Comunicado emitido', nota: 'Aposentadoria por tempo de contribuição.' },
      { data: format(subDays(today, 35), "yyyy-MM-dd'T'HH:mm:ss"), acao: 'Documentação concluída', nota: '' },
      { data: format(subDays(today, 20), "yyyy-MM-dd'T'HH:mm:ss"), acao: 'Homologação realizada', nota: '' },
      { data: format(subDays(today, 10), "yyyy-MM-dd'T'HH:mm:ss"), acao: 'Aguardando pagamento', nota: '' },
      { data: format(subDays(today, 2), "yyyy-MM-dd'T'HH:mm:ss"), acao: 'Pagamento realizado', nota: 'Rescisão quitada.' },
    ],
  },
  {
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
    checklist: makeChecklist([]),
    historico: [
      { data: format(today, "yyyy-MM-dd'T'HH:mm:ss"), acao: 'Comunicado emitido', nota: 'Processo de desligamento iniciado.' },
    ],
  },
];

module.exports = { INITIAL_DATA };
