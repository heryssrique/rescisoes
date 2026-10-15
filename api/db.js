const mongoose = require('mongoose');
const logger = require('./utils/logger');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/desligest';

// Na Vercel o módulo é reaproveitado entre requisições na mesma instância.
// Sem este cache, cada invocação abriria um novo pool e esgotaria as
// conexões do Atlas.
let cachedPromise = null;

function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return Promise.resolve(mongoose.connection);
  }
  if (!cachedPromise) {
    cachedPromise = mongoose
      .connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
        heartbeatFrequencyMS: 2000,
      })
      .catch((err) => {
        cachedPromise = null; // permite nova tentativa na próxima requisição
        throw err;
      });
  }
  return cachedPromise;
}

/**
 * Garante o banco conectado antes de uma rota de dados.
 * Em processo contínuo resolve de imediato; na Vercel é o que substitui
 * a conexão que antes era feita no boot.
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