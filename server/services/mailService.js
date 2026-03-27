const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || 'smtp.mailtrap.io',
  port: process.env.MAIL_PORT || 2525,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

const sendSummaryEmail = async (to, data) => {
  try {
    const info = await transporter.sendMail({
      from: '"DesliGest Admin" <admin@desligest.com>',
      to,
      subject: `Resumo Diário de Rescisões - ${new Date().toLocaleDateString()}`,
      html: `
        <h1>Resumo do Dia</h1>
        <p>Olá, existem ${data.urgentCount} processos vencendo hoje e ${data.pendingCount} pendentes.</p>
        <a href="${process.env.FRONTEND_URL}">Acessar Sistema</a>
      `,
    });
    logger.info('E-mail enviado: %s', info.messageId);
  } catch (err) {
    logger.error('Erro ao enviar e-mail:', err);
  }
};

module.exports = { sendSummaryEmail };
