/**
 * Script de recuperação: reinserção dos processos deletados
 * Dados extraídos manualmente dos prints fornecidos pelo usuário
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Desligamento = require('../models/Desligamento');

const PROCESSOS = [
  // ── PRINT 1 ──────────────────────────────────────────────────────────────
  {
    nome: 'Alexandre Costa da Silva',
    coligada: '1',
    cargo: 'Coletor de Lixo Domiciliar',
    departamento: 'Coleta de Lixo Varzea Grande MT',
    matricula: '00001892',
    dataAdmissao: '2026-02-05',
    dataComunicado: '2026-03-08',
    dataDesligamento: '2026-04-05',
    dataPagamento: '2026-04-15',
    prazoPagamento: '10',
    motivo: 'termino_contrato',
    avisoPrevio: 'nao_aplicavel',
    status: 'comunicado',
    responsavel: 'Henrique Silva',
    observacoes: '',
    arquivado: false,
    checklist: [],
    historico: [
      { data: '2026-03-08T08:00:00.000Z', acao: 'Comunicado emitido', nota: 'Recuperado de print — término de contrato' }
    ]
  },
  {
    nome: 'Elyelton do Nascimento Souza',
    coligada: '1',
    cargo: 'Coletor de Lixo Domiciliar',
    departamento: 'Coleta de Lixo Varzea Grande MT',
    matricula: '00001890',
    dataAdmissao: '2026-02-05',
    dataComunicado: '2026-04-03',
    dataDesligamento: '2026-04-05',
    dataPagamento: '2026-04-15',
    prazoPagamento: '10',
    motivo: 'termino_contrato',
    avisoPrevio: 'nao_aplicavel',
    status: 'comunicado',
    responsavel: 'Henrique Silva',
    observacoes: '',
    arquivado: false,
    checklist: [],
    historico: [
      { data: '2026-04-03T08:00:00.000Z', acao: 'Comunicado emitido', nota: 'Recuperado de print — término de contrato' }
    ]
  },
  {
    nome: 'Elyelton do Nascimento Souza',
    coligada: '1',
    cargo: 'Coletor de Lixo Domiciliar',
    departamento: 'Coleta de Lixo Varzea Grande MT',
    matricula: '00001890',
    dataAdmissao: '2026-02-05',
    dataComunicado: '2026-04-06',
    dataDesligamento: '2026-04-05',
    dataPagamento: '2026-04-15',
    prazoPagamento: '10',
    motivo: 'termino_contrato',
    avisoPrevio: 'nao_aplicavel',
    status: 'comunicado',
    responsavel: 'Henrique Silva',
    observacoes: '',
    arquivado: false,
    checklist: [],
    historico: [
      { data: '2026-04-06T08:00:00.000Z', acao: 'Comunicado emitido', nota: 'Recuperado de print — término de contrato' }
    ]
  },
  // ── PRINT 2 ──────────────────────────────────────────────────────────────
  {
    nome: 'Elton da Silva Soares',
    coligada: '4',
    cargo: 'Serviços Gerais',
    departamento: 'BR-060/MS - Sidrolândia MS',
    matricula: '00000787',
    dataAdmissao: '2026-02-20',
    dataComunicado: '2026-04-06',
    dataDesligamento: '2026-04-06',
    dataPagamento: '2026-04-16',
    prazoPagamento: '10',
    motivo: 'termino_empregado',
    avisoPrevio: 'nao_aplicavel',
    status: 'documentacao',
    responsavel: 'Henrique Silva',
    observacoes: '',
    arquivado: false,
    checklist: [],
    historico: [
      { data: '2026-04-06T08:00:00.000Z', acao: 'Comunicado emitido', nota: 'Recuperado de print — término antecipado empregado' },
      { data: '2026-04-06T09:00:00.000Z', acao: 'Documentação iniciada', nota: 'Recuperado de print' }
    ]
  },
  {
    nome: 'Juan Marx Siqueira Moreira',
    coligada: '4',
    cargo: 'Assistente de Gestão de Pessoas',
    departamento: 'Financeiro',
    matricula: '00000726',
    dataAdmissao: '2025-06-23',
    dataComunicado: '2026-04-06',
    dataDesligamento: '2026-04-06',
    dataPagamento: '2026-04-16',
    prazoPagamento: '10',
    motivo: 'demissao',
    avisoPrevio: 'indenizado',
    diasAvisoTrabalhado: '30',
    status: 'comunicado',
    responsavel: 'Henrique Silva',
    observacoes: '',
    arquivado: false,
    checklist: [],
    historico: [
      { data: '2026-04-06T08:00:00.000Z', acao: 'Comunicado emitido', nota: 'Recuperado de print — demissão sem justa causa' }
    ]
  },
  {
    nome: 'Gabriel Campos Teles',
    coligada: '4',
    cargo: 'Aux. Administrativo',
    departamento: 'Oficina',
    matricula: '00000561',
    dataAdmissao: '2024-09-16',
    dataComunicado: '2026-04-29',
    dataDesligamento: '2026-04-29',
    dataPagamento: '2026-05-08',
    prazoPagamento: '10',
    motivo: 'termino_contrato',
    avisoPrevio: 'nao_aplicavel',
    status: 'comunicado',
    responsavel: 'Henrique Silva',
    observacoes: '',
    arquivado: false,
    checklist: [],
    historico: [
      { data: '2026-04-29T08:00:00.000Z', acao: 'Comunicado emitido', nota: 'Recuperado de print — término de contrato' }
    ]
  },
  // ── PRINT 3 ──────────────────────────────────────────────────────────────
  {
    nome: 'Leonardo Vinicius de Souza',
    coligada: '4',
    cargo: 'Auxiliar de Logística',
    departamento: 'Financeiro',
    matricula: '00000560',
    dataAdmissao: '2024-09-16',
    dataComunicado: '2026-04-29',
    dataDesligamento: '2026-04-29',
    dataPagamento: '2026-05-08',
    prazoPagamento: '10',
    motivo: 'termino_contrato',
    avisoPrevio: 'nao_aplicavel',
    status: 'comunicado',
    responsavel: 'Henrique Silva',
    observacoes: '',
    arquivado: false,
    checklist: [],
    historico: [
      { data: '2026-04-29T08:00:00.000Z', acao: 'Comunicado emitido', nota: 'Recuperado de print — término de contrato' }
    ]
  },
  {
    nome: 'Flavio Carlos de Souza Ortega',
    coligada: '4',
    cargo: 'Serviços Gerais',
    departamento: 'BR-060/MS - Pedra',
    matricula: '00000656',
    dataAdmissao: '2025-02-24',
    dataComunicado: '2026-04-02',
    dataDesligamento: '2026-05-02',
    dataPagamento: '2026-05-12',
    prazoPagamento: '10',
    motivo: 'demissao',
    avisoPrevio: 'trabalhado',
    diasAvisoTrabalhado: '30',
    status: 'comunicado',
    responsavel: 'Henrique Silva',
    observacoes: 'Aviso prévio trabalhado (30d) + 3d a pagar',
    arquivado: false,
    checklist: [],
    historico: [
      { data: '2026-04-02T08:00:00.000Z', acao: 'Comunicado emitido', nota: 'Recuperado de print — demissão sem justa causa' }
    ]
  },
];

async function recuperar() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Conectado ao MongoDB');

  const docs = await Desligamento.insertMany(PROCESSOS, { runValidators: true });
  
  console.log(`\n✅ ${docs.length} processos reinseridos com sucesso:\n`);
  docs.forEach((d, i) => {
    console.log(`  ${i + 1}. ${d.nome} [${d.coligada}] — ${d.status} — pag: ${d.dataPagamento}`);
  });

  await mongoose.disconnect();
}

recuperar().catch(err => {
  console.error('❌ Erro:', err.message);
  process.exit(1);
});
