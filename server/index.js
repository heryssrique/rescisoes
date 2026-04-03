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
app.use(helmet()); // Secure HTTP headers

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

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

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
