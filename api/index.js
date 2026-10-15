const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('mongo-sanitize');
const hpp = require('hpp');

const logger = require('../backend/utils/logger');
const { connectDB, requireDB } = require('../backend/db');
const { errorHandler, ApiError } = require('../backend/middleware/errorMiddleware');
const desligamentosRouter = require('../backend/routes/desligamentos');
const authRouter = require('../backend/routes/auth');
const linksRouter = require('../backend/routes/links');
const cronRouter = require('../backend/routes/cron');

const app = express();

// Proxy reverso (Vercel/Render) — necessário para o rate limit ler o IP real
app.set('trust proxy', 1);

// ── Configuração de CORS ───────────────────────────────────────────────────
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || origin.includes('localhost') || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(null, true);
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
    contentSecurityPolicy: false,
  })
);

// ── Rate Limiting ──────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { error: 'Muitas requisições vindas deste IP, tente novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Data sanitization against NoSQL query injection
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
  const baseUrl = req.url.split('?')[0];
  logger.info(`Incoming Request: ${req.method} ${baseUrl}`);
  next();
});

// ── Rotas ──────────────────────────────────────────────────────────────────
app.use('/api/auth', requireDB, authRouter);
app.use('/api/desligamentos', requireDB, desligamentosRouter);
app.use('/api/links', requireDB, linksRouter);
app.use('/api/cron', cronRouter);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// ── 404 Handler ────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  next(new ApiError(404, `A rota ${req.method} ${req.url} não foi encontrada.`));
});

// Global Error Handler
app.use(errorHandler);

// Export app for Vercel serverless functions
module.exports = app;