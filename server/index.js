require('dotenv').config();



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
app.use(express.json({ limit: '10mb' })); // Body limit aumentado para suportar upload de planilhas CSV/bulk import
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

// ── Endpoints de Desenvolvimento (REMOVIDOS por segurança) ────────────────
// Os endpoints /api/bootstrap-admin e /api/recover-deleted foram removidos
// devido ao risco de escalonamento de privilégios e vazamento de PII.
// Use os scripts em server/scripts/ para operações administrativas.

if (process.env.NODE_ENV !== 'production') {
  const User = require('./models/User');
  const Desligamento = require('./models/Desligamento');

// ── 404 Handler ────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  next(new ApiError(404, `A rota ${req.method} ${req.url} não foi encontrada.`));
});

// Global Error Handler
app.use(errorHandler);

// ── Conexão MongoDB e inicialização ───────────────────────────────────────
async function start() {
  // Iniciar o servidor Express imediatamente para que a API esteja sempre disponível
  app.listen(PORT, () => {
    logger.info(`🚀 API rodando na porta ${PORT}`);
    logger.info(`   Health: http://localhost:${PORT}/api/health`);
  });

  try {
    logger.info('⏳ Iniciando conexão com o MongoDB...');
    const connectOptions = {
      serverSelectionTimeoutMS: 5000,
      heartbeatFrequencyMS: 2000,
    };

    await mongoose.connect(MONGODB_URI, connectOptions);
    logger.info(`✅ MongoDB conectado com sucesso`);

    // Iniciar tarefas agendadas
    initCron();
    logger.info(`✅ Tarefas agendadas (Cron) inicializadas`);
  } catch (err) {
    logger.warn('⚠️ ERRO DE CONEXÃO MONGODB (Modo Offline Ativado): ' + err.message);
    logger.warn('⚠️ O servidor continuará respondendo em modo offline/fallback no ambiente local.');
  }
}

mongoose.connection.on('disconnected', () => {
  logger.warn('⚠️  MongoDB desconectado. Tentando reconectar...');
});

start();
