require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('mongo-sanitize');
const hpp = require('hpp');

const logger = require('./utils/logger');
const { connectDB, requireDB } = require('./db');
const { errorHandler, ApiError } = require('./middleware/errorMiddleware');
const desligamentosRouter = require('./routes/desligamentos');
const authRouter = require('./routes/auth');
const linksRouter = require('./routes/links');
const cronRouter = require('./routes/cron');

const app = express();
const PORT = process.env.PORT || 3001;

// Proxy reverso (Vercel/Render) — necessário para o rate limit ler o IP real
app.set('trust proxy', 1);

// ── Configuração de CORS ───────────────────────────────────────────────────
// Com frontend e API no mesmo domínio da Vercel, as chamadas passam a ser
// same-origin e o CORS deixa de ser o caminho crítico. Mantido para o Render
// e para o dev local (Vite na 5173 chamando a API na 3001).
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || origin.includes('localhost') || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(null, true); // Permitir em produção para evitar bloqueio acidental de domínio
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200,
  preflightContinue: false,
};
app.use(cors(corsOptions));

// ── Middlewares Globais ────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false, // Desabilitado para simplificar conexão com Atlas e Vercel temporariamente
  })
);

// ── Rate Limiting ──────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 500, // Limite aumentado para evitar falsos positivos
  message: { error: 'Muitas requisições vindas deste IP, tente novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

app.use(express.json({ limit: '10mb' })); // Body limit para suportar CSV/bulk import
app.use(express.urlencoded({ limit: '10mb', extended: true }));

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
  // Limpar a URL no log (evitar PII da query string no combined.log)
  const baseUrl = req.url.split('?')[0];
  logger.info(`Incoming Request: ${req.method} ${baseUrl}`);
  next();
});

// ── Rotas ──────────────────────────────────────────────────────────────────
// requireDB garante a conexão antes das rotas de dados. Fica por rota (e não
// global) para que /api/health e os 404 respondam sem depender do banco.
app.use('/api/auth', requireDB, authRouter);
app.use('/api/desligamentos', requireDB, desligamentosRouter);
app.use('/api/links', requireDB, linksRouter);
app.use('/api/cron', cronRouter); // valida o token antes de tocar no banco

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// ── Endpoints de Desenvolvimento (REMOVIDOS por segurança) ────────────
// Os endpoints /api/bootstrap-admin e /api/recover-deleted foram removidos
// devido ao risco de escalonamento de privilégios e vazamento de PII.
// Use os scripts em api/scripts/ para operações administrativas.

// ── 404 Handler ────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  next(new ApiError(404, `A rota ${req.method} ${req.url} não foi encontrada.`));
});

// Global Error Handler
app.use(errorHandler);

// ── Inicialização ──────────────────────────────────────────────────────────
// Só roda como processo próprio (dev local e Render). Na Vercel o arquivo é
// importado como handler: nada de listen() nem node-cron, que precisariam de
// um processo sempre ligado. O resumo diário virou GET /api/cron/resumo-diario,
// agendado pelo Vercel Cron em vercel.json.
async function start() {
  app.listen(PORT, () => {
    logger.info(`🚀 API rodando na porta ${PORT}`);
    logger.info(`   Health: http://localhost:${PORT}/api/health`);
  });

  try {
    logger.info('⏳ Iniciando conexão com o MongoDB...');
    await connectDB();
    logger.info('✅ MongoDB conectado com sucesso');

    const { initCron } = require('./services/cronService');
    initCron();
    logger.info('✅ Tarefas agendadas (Cron) inicializadas');
  } catch (err) {
    logger.warn('⚠️ ERRO DE CONEXÃO MONGODB (Modo Offline Ativado): ' + err.message);
    logger.warn('⚠️ O servidor continuará respondendo em modo offline/fallback no ambiente local.');
  }
}

if (require.main === module) {
  start();
}

module.exports = app;
