require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const desligamentosRouter = require('./routes/desligamentos');

const app = express();
const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/desligest';

// ── Middlewares ────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Logging simples de requisições
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ── Rotas ─────────────────────────────────────────────────────────────────
app.use('/api/desligamentos', desligamentosRouter);

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// Rota 404 por padrão
app.use((_req, res) => res.status(404).json({ error: 'Rota não encontrada' }));

// Handler de erros global
app.use((err, _req, res, _next) => {
  console.error('[UNHANDLED ERROR]', err);
  res.status(500).json({ error: 'Erro interno', detail: err.message });
});

// ── Conexão MongoDB e inicialização ───────────────────────────────────────
async function start() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log(`✅ MongoDB conectado → ${MONGODB_URI}`);

    app.listen(PORT, () => {
      console.log(`🚀 API rodando em http://localhost:${PORT}`);
      console.log(`   Health: http://localhost:${PORT}/api/health`);
      console.log(`   Desligamentos: http://localhost:${PORT}/api/desligamentos`);
    });
  } catch (err) {
    console.error('❌ Falha ao conectar no MongoDB:', err.message);
    process.exit(1);
  }
}

// Reconexão automática em caso de queda
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB desconectado. Tentando reconectar...');
});

start();
