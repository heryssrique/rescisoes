require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('mongo-sanitize');
// xss-clean removido — incompatível com Express 5 (req.query é read-only)
const hpp = require('hpp');

const logger = require('./utils/logger');
const { errorHandler, ApiError } = require('./middleware/errorMiddleware');
const desligamentosRouter = require('./routes/desligamentos');
const authRouter = require('./routes/auth');
const linksRouter = require('./routes/links');
const { initCron } = require('./services/cronService');

const app = express();
const PORT = process.env.PORT || 3001;

// Render/Heroku Proxy trust for rate limits
app.set('trust proxy', 1);

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/desligest';

// ── Configuração de CORS (Segura) ──────────────────────────────────────────
const corsOptions = {
  origin: ['https://rescisoes.vercel.app', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200,
  preflightContinue: false
};
app.use(cors(corsOptions));

// ── Middlewares Globais ──────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false, // Desabilitado para simplificar conexão com Atlas e Vercel temporariamente
}));

// ── Rate Limiting ──────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 500, // Limite aumentado para evitar falsos positivos
  message: { error: 'Muitas requisições vindas deste IP, tente novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);
app.use(express.json({ limit: '10kb' })); // Body limit to prevent DoS
app.use(express.urlencoded({ limit: '10kb', extended: true }));

// Data sanitization against NoSQL query injection
// No Express 5, req.query e req.params são read-only (getters),
// então sanitizamos apenas req.body (principal vetor de injeção NoSQL).
app.use((req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = mongoSanitize(req.body);
  }
  next();
});

// Prevent HTTP parameter pollution
app.use(hpp());

// Professional Logging Middleware
app.use((req, res, next) => {
  logger.info(`Incoming Request: ${req.method} ${req.url}`);
  next();
});

// ── Rotas ─────────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/desligamentos', desligamentosRouter);
app.use('/api/links', linksRouter);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// ── Endpoint temporário de bootstrap (apenas em desenvolvimento) ───────────
if (process.env.NODE_ENV !== 'production') {
  const User = require('./models/User');
  const Desligamento = require('./models/Desligamento');

  app.post('/api/bootstrap-admin', async (req, res) => {
    try {
      const result = await User.updateMany({}, { role: 'admin' });
      const users = await User.find().select('name email role');
      res.json({ message: `${result.modifiedCount} usuário(s) promovido(s) para admin.`, users });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Recuperação de dados deletados acidentalmente ──────────────────────
  app.post('/api/recover-deleted', async (req, res) => {
    try {
      const PROCESSOS = [
        {
          nome: 'Alexandre Costa da Silva', coligada: '1',
          cargo: 'Coletor de Lixo Domiciliar', departamento: 'Coleta de Lixo Varzea Grande MT',
          matricula: '00001892', dataAdmissao: '2026-02-05', dataComunicado: '2026-03-08',
          dataDesligamento: '2026-04-05', dataPagamento: '2026-04-15', prazoPagamento: '10',
          motivo: 'termino_contrato', avisoPrevio: 'nao_aplicavel', status: 'comunicado',
          responsavel: 'Henrique Silva', arquivado: false, checklist: [], historico: [
            { data: new Date().toISOString(), acao: 'Processo recuperado', nota: 'Reinserido a partir de print — término de contrato' }
          ]
        },
        {
          nome: 'Elyelton do Nascimento Souza', coligada: '1',
          cargo: 'Coletor de Lixo Domiciliar', departamento: 'Coleta de Lixo Varzea Grande MT',
          matricula: '00001890', dataAdmissao: '2026-02-05', dataComunicado: '2026-04-03',
          dataDesligamento: '2026-04-05', dataPagamento: '2026-04-15', prazoPagamento: '10',
          motivo: 'termino_contrato', avisoPrevio: 'nao_aplicavel', status: 'comunicado',
          responsavel: 'Henrique Silva', arquivado: false, checklist: [], historico: [
            { data: new Date().toISOString(), acao: 'Processo recuperado', nota: 'Reinserido a partir de print — término de contrato' }
          ]
        },
        {
          nome: 'Elyelton do Nascimento Souza', coligada: '1',
          cargo: 'Coletor de Lixo Domiciliar', departamento: 'Coleta de Lixo Varzea Grande MT',
          matricula: '00001890', dataAdmissao: '2026-02-05', dataComunicado: '2026-04-06',
          dataDesligamento: '2026-04-05', dataPagamento: '2026-04-15', prazoPagamento: '10',
          motivo: 'termino_contrato', avisoPrevio: 'nao_aplicavel', status: 'comunicado',
          responsavel: 'Henrique Silva', arquivado: false, checklist: [], historico: [
            { data: new Date().toISOString(), acao: 'Processo recuperado', nota: 'Reinserido a partir de print — término de contrato' }
          ]
        },
        {
          nome: 'Elton da Silva Soares', coligada: '4',
          cargo: 'Serviços Gerais', departamento: 'BR-060/MS - Sidrolândia MS',
          matricula: '00000787', dataAdmissao: '2026-02-20', dataComunicado: '2026-04-06',
          dataDesligamento: '2026-04-06', dataPagamento: '2026-04-16', prazoPagamento: '10',
          motivo: 'termino_empregado', avisoPrevio: 'nao_aplicavel', status: 'documentacao',
          responsavel: 'Henrique Silva', arquivado: false, checklist: [], historico: [
            { data: new Date().toISOString(), acao: 'Processo recuperado', nota: 'Reinserido a partir de print — término antecipado pelo empregado' }
          ]
        },
        {
          nome: 'Juan Marx Siqueira Moreira', coligada: '4',
          cargo: 'Assistente de Gestão de Pessoas', departamento: 'Financeiro',
          matricula: '00000726', dataAdmissao: '2025-06-23', dataComunicado: '2026-04-06',
          dataDesligamento: '2026-04-06', dataPagamento: '2026-04-16', prazoPagamento: '10',
          motivo: 'demissao', avisoPrevio: 'indenizado', diasAvisoTrabalhado: '30',
          status: 'comunicado', responsavel: 'Henrique Silva', arquivado: false, checklist: [], historico: [
            { data: new Date().toISOString(), acao: 'Processo recuperado', nota: 'Reinserido a partir de print — demissão sem justa causa, aviso indenizado 30d' }
          ]
        },
        {
          nome: 'Gabriel Campos Teles', coligada: '4',
          cargo: 'Aux. Administrativo', departamento: 'Oficina',
          matricula: '00000561', dataAdmissao: '2024-09-16', dataComunicado: '2026-04-29',
          dataDesligamento: '2026-04-29', dataPagamento: '2026-05-08', prazoPagamento: '10',
          motivo: 'termino_contrato', avisoPrevio: 'nao_aplicavel', status: 'comunicado',
          responsavel: 'Henrique Silva', arquivado: false, checklist: [], historico: [
            { data: new Date().toISOString(), acao: 'Processo recuperado', nota: 'Reinserido a partir de print — término de contrato' }
          ]
        },
        {
          nome: 'Leonardo Vinicius de Souza', coligada: '4',
          cargo: 'Auxiliar de Logística', departamento: 'Financeiro',
          matricula: '00000560', dataAdmissao: '2024-09-16', dataComunicado: '2026-04-29',
          dataDesligamento: '2026-04-29', dataPagamento: '2026-05-08', prazoPagamento: '10',
          motivo: 'termino_contrato', avisoPrevio: 'nao_aplicavel', status: 'comunicado',
          responsavel: 'Henrique Silva', arquivado: false, checklist: [], historico: [
            { data: new Date().toISOString(), acao: 'Processo recuperado', nota: 'Reinserido a partir de print — término de contrato' }
          ]
        },
        {
          nome: 'Flavio Carlos de Souza Ortega', coligada: '4',
          cargo: 'Serviços Gerais', departamento: 'BR-060/MS - Pedra',
          matricula: '00000656', dataAdmissao: '2025-02-24', dataComunicado: '2026-04-02',
          dataDesligamento: '2026-05-02', dataPagamento: '2026-05-12', prazoPagamento: '10',
          motivo: 'demissao', avisoPrevio: 'trabalhado', diasAvisoTrabalhado: '30',
          status: 'comunicado', responsavel: 'Henrique Silva',
          observacoes: 'Aviso prévio trabalhado (30d) + 3d a pagar',
          arquivado: false, checklist: [], historico: [
            { data: new Date().toISOString(), acao: 'Processo recuperado', nota: 'Reinserido a partir de print — demissão sem justa causa, aviso trabalhado 30d + 3d' }
          ]
        },
      ];

      const docs = await Desligamento.insertMany(PROCESSOS, { runValidators: true });
      res.json({
        message: `✅ ${docs.length} processos recuperados com sucesso.`,
        processos: docs.map(d => ({ id: d._id, nome: d.nome, coligada: d.coligada, status: d.status, dataPagamento: d.dataPagamento }))
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
}

// 404 Handler
app.use((req, res, next) => {
  next(new ApiError(404, `A rota ${req.method} ${req.url} não foi encontrada.`));
});

// Global Error Handler
app.use(errorHandler);

// ── Conexão MongoDB e inicialização ───────────────────────────────────────
async function start() {
  try {
    logger.info('⏳ Iniciando conexão com o MongoDB...');
    const connectOptions = {
      serverSelectionTimeoutMS: 10000,
      heartbeatFrequencyMS: 2000,
    };

    await mongoose.connect(MONGODB_URI, connectOptions);
    logger.info(`✅ MongoDB conectado com sucesso`);

    // Iniciar tarefas agendadas
    initCron();
    logger.info(`✅ Tarefas agendadas (Cron) inicializadas`);

    app.listen(PORT, () => {
      logger.info(`🚀 API rodada na porta ${PORT}`);
      logger.info(`   Health: http://localhost:${PORT}/api/health`);
    });
  } catch (err) {
    logger.error('❌ ERRO CRÍTICO NA CONEXÃO MONGODB:', err);
    process.exit(1);
  }
}

mongoose.connection.on('disconnected', () => {
  logger.warn('⚠️  MongoDB desconectado. Tentando reconectar...');
});

start();
