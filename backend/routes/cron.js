const express = require('express');
const Desligamento = require('../models/Desligamento');
const { connectDB } = require('../db');
const { sendSummaryEmail } = require('../services/mailService');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * GET /api/cron/resumo-diario
 *
 * Substitui o node-cron (que exigia um processo sempre ligado) pelo Vercel Cron.
 * O agendamento fica em vercel.json; a Vercel chama esta rota com o header
 * Authorization: Bearer ${CRON_SECRET}.
 */
router.get('/resumo-diario', async (req, res, next) => {
  const expected = process.env.CRON_SECRET;

  if (!expected) {
    logger.error('CRON_SECRET não configurado — rota de cron desabilitada.');
    return res.status(503).json({ error: 'Cron não configurado neste ambiente.' });
  }

  if (req.headers.authorization !== `Bearer ${expected}`) {
    logger.warn('Tentativa de acesso ao cron com token inválido.');
    return res.status(401).json({ error: 'Não autorizado.' });
  }

  try {
    logger.info('⏰ Iniciando resumo diário (Vercel Cron)...');

    // Conecta só depois de validar o token, para que uma chamada não
    // autorizada não gaste conexão com o banco.
    await connectDB();

    const hoje = new Date().toISOString().split('T')[0];

    const urgentCount = await Desligamento.countDocuments({
      dataPagamento: hoje,
      status: { $nin: ['pago', 'cancelado', 'pendente_comprovante'] },
      checklist: { $not: { $elemMatch: { id: 'p1', done: true } } },
    });

    const pendingCount = await Desligamento.countDocuments({
      status: { $nin: ['pago', 'cancelado', 'pendente_comprovante'] },
      checklist: { $not: { $elemMatch: { id: 'p1', done: true } } },
    });

    let emailSent = false;
    if (urgentCount > 0 || pendingCount > 0) {
      emailSent = await sendSummaryEmail(
        process.env.ADMIN_EMAIL || 'admin@desligest.com',
        { urgentCount, pendingCount }
      );
    }

    logger.info('✅ Resumo diário concluído (urgentes: %d, pendentes: %d)', urgentCount, pendingCount);
    res.json({ ok: true, urgentCount, pendingCount, emailSent });
  } catch (err) {
    next(err);
  }
});

module.exports = router;