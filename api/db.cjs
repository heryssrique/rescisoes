const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const logger = require('./utils/logger.cjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/desligest';

// O fallback em memória existe APENAS para desenvolvimento local sem MongoDB.
// Ele contém usuários de teste e NUNCA deve atender tráfego real: em produção
// a ausência do banco precisa falhar de forma visível (503), não ser mascarada.
const ALLOW_MEMORY_FALLBACK =
  process.env.VERCEL_ENV !== 'production' &&
  process.env.NODE_ENV !== 'production' &&
  process.env.ALLOW_MEMORY_FALLBACK === 'true';

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
        serverSelectionTimeoutMS: 10000,
        heartbeatFrequencyMS: 2000,
      })
      .then((conn) => {
        logger.info('Conectado ao MongoDB com sucesso.');
        return conn;
      })
      .catch((err) => {
        cachedPromise = null; // permite nova tentativa na próxima requisição
        if (ALLOW_MEMORY_FALLBACK) {
          logger.warn(
            'Falha ao conectar ao MongoDB (' + err.message + '). Ativando fallback em memória (apenas desenvolvimento).'
          );
          global.isMemoryFallback = true;
          return null;
        }
        throw err;
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
      logger.error('Falha ao conectar ao MongoDB: ' + err.message);
      res.status(503).json({
        status: 'error',
        message: 'Banco de dados indisponível. Tente novamente em instantes.',
      });
    });
}

module.exports = { connectDB, requireDB, MONGODB_URI };