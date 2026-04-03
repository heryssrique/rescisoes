require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('mongo-sanitize');
const xss = require('xss-clean');
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

// ── Rate Limiting ──────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Limite de 100 requisições por IP
  message: { error: 'Muitas requisições vindas deste IP, tente novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// ── Middlewares ────────────────────────────────────────────────────────────
app.use(helmet()); // Secure HTTP headers
app.use(cors());
app.use(express.json({ limit: '10kb' })); // Body limit to prevent DoS
app.use(express.urlencoded({ limit: '10kb', extended: true }));

// Data sanitization against NoSQL query injection
app.use((req, res, next) => {
  req.body = mongoSanitize(req.body);
  req.query = mongoSanitize(req.query);
  req.params = mongoSanitize(req.params);
  next();
});

// Data sanitization against XSS
app.use(xss());

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
