require('dotenv').config();
const dns = require('dns');

// Força resolução de SRV via Google/Cloudflare (evita ECONNREFUSED em alguns ambientes)
dns.setServers(['8.8.8.8', '1.1.1.1']);

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const desligamentosRouter = require('./routes/desligamentos');
const authRouter = require('./routes/auth');
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
app.use('/api/auth', authRouter);
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
    console.log('⏳ Iniciando conexão com o MongoDB...');
    const connectOptions = {
      serverSelectionTimeoutMS: 10000, // 10 segundos para desistir de encontrar o servidor
      heartbeatFrequencyMS: 2000,      // Checa a saúde da conexão a cada 2 segundos
    };

    await mongoose.connect(MONGODB_URI, connectOptions);
    console.log(`✅ MongoDB conectado com sucesso`);

    app.listen(PORT, () => {
      console.log(`🚀 API rodando na porta ${PORT}`);
      console.log(`   Health: http://localhost:${PORT}/api/health`);
    });
  } catch (err) {
    console.error('❌ ERRO CRÍTICO NA CONEXÃO MONGODB:');
    console.error('   Nome do Erro:', err.name);
    console.error('   Mensagem:', err.message);
    if (err.reason) console.error('   Razão:', JSON.stringify(err.reason, null, 2));
    
    console.log('\n🔍 DICA DO ANALISTA:');
    console.log('1. Verifique se o IP do servidor de produção está liberado no Atlas (Network Access).');
    console.log('2. Em produção, tente usar "0.0.0.0/0" se o IP for dinâmico.');
    console.log('3. Verifique se a variável MONGODB_URI está configurada e correta nas variáveis de ambiente do Render.');
    
    process.exit(1);
  }
}

// Reconexão automática em caso de queda
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB desconectado. Tentando reconectar...');
});

start();
