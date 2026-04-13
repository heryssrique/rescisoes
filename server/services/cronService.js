const cron = require('node-cron');
const Desligamento = require('../models/Desligamento');
const { sendSummaryEmail } = require('./mailService');
const logger = require('../utils/logger');

const initCron = () => {
  // Roda todo dia às 08:30 da manhã
  cron.schedule('30 8 * * *', async () => {
    try {
      logger.info('⏰ Iniciando Cron de resumo diário...');
      
      const today = new Date().toISOString().split('T')[0];
      const urgentCount = await Desligamento.countDocuments({
        dataPagamento: today,
        status: { $nin: ['pago', 'cancelado', 'pendente_comprovante'] }
      });
      
      const pendingCount = await Desligamento.countDocuments({
        status: { $nin: ['pago', 'cancelado', 'pendente_comprovante'] }
      });

      if (urgentCount > 0 || pendingCount > 0) {
        // Obter e-mails dos admins aqui (ou usar um e-mail fixo por enquanto)
        await sendSummaryEmail(process.env.ADMIN_EMAIL || 'admin@desligest.com', {
          urgentCount,
          pendingCount
        });
      }
      
      logger.info('✅ Cron finalizado com sucesso.');
    } catch (err) {
      logger.error('❌ Erro no Cron:', err);
    }
  });
};

module.exports = { initCron };
