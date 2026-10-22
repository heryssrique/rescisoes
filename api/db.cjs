const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // ignore
}
const logger = require('./utils/logger.cjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/desligest';

// Na Vercel o módulo é reaproveitado entre requisições na mesma instância.
// Sem este cache, cada invocação abriria um novo pool e esgotaria as
// conexões do Atlas.
let cachedPromise = null;

function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return Promise.resolve(mongoose.connection);
  }
  if (global.isMemoryFallback) {
    return Promise.resolve(mongoose.connection);
  }
  if (!cachedPromise) {
    cachedPromise = mongoose
      .connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 3000,
        heartbeatFrequencyMS: 2000,
      })
      .then((conn) => {
        logger.info('Conectado ao MongoDB com sucesso.');
        return conn;
      })
      .catch((err) => {
        logger.warn('⚠️ Falha ao conectar ao MongoDB (' + err.message + '). Ativando Modo Fallback em Memória.');
        global.isMemoryFallback = true;
        cachedPromise = null;
        return null;
      });
  }
  return cachedPromise;
}

/**
 * Garante o banco conectado antes de uma rota de dados.
 */
function requireDB(req, res, next) {
  connectDB()
    .then(() => next())
    .catch((err) => {
      if (global.isMemoryFallback) {
        return next();
      }
      logger.error('Falha ao conectar ao MongoDB: ' + err.message);
      res.status(503).json({
        status: 'error',
        message: 'Banco de dados indisponível. Tente novamente em instantes.',
      });
    });
}

module.exports = { connectDB, requireDB, MONGODB_URI };