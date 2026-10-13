const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

const getTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.MAIL_HOST || 'smtp.mailtrap.io',
    port: parseInt(process.env.MAIL_PORT) || 2525,
    secure: process.env.MAIL_SECURE === 'true',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });
};

const sendSummaryEmail = async (to, data) => {
  try {
    const transporter = getTransporter();
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const info = await transporter.sendMail({
      from: `"DesliGest" <${process.env.MAIL_FROM || 'noreply@desligest.com'}>`,
      to,
      subject: `Resumo Diário de Rescisões - ${new Date().toLocaleDateString()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #4f46e5;">Resumo do Dia - DesliGest</h1>
          <p>Olá, existem <strong>${data.urgentCount}</strong> processos vencendo hoje e <strong>${data.pendingCount}</strong> pendentes.</p>
          <a href="${frontendUrl}" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 16px;">Acessar Sistema</a>
        </div>
      `,
    });
    logger.info('E-mail enviado: %s', info.messageId);
  } catch (err) {
    logger.error('Erro ao enviar e-mail de resumo:', err);
  }
};

const sendPasswordResetEmail = async (to, resetToken) => {
  try {
    const transporter = getTransporter();
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/auth?mode=reset&token=${resetToken}`;

    const info = await transporter.sendMail({
      from: `"DesliGest" <${process.env.MAIL_FROM || 'noreply@desligest.com'}>`,
      to,
      subject: 'Recuperação de Senha - DesliGest',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #4f46e5; margin: 0;">DesliGest</h1>
            <p style="color: #6b7280; margin-top: 8px;">Gestão de Rescisões</p>
          </div>

          <div style="background: #f9fafb; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <h2 style="color: #111827; margin-top: 0;">Recuperação de Senha</h2>
            <p style="color: #4b5563; line-height: 1.6;">
              Você solicitou a recuperação de senha da sua conta no DesliGest.
            </p>
            <p style="color: #4b5563; line-height: 1.6;">
              Clique no botão abaixo para criar uma nova senha. Este link é válido por <strong>1 hora</strong>.
            </p>

            <div style="text-align: center; margin: 32px 0;">
              <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                Redefinir Senha
              </a>
            </div>

            <p style="color: #9ca3af; font-size: 14px; line-height: 1.6;">
              Se você não solicitou esta recuperação, ignore este e-mail ou entre em contato com o administrador.
            </p>
            <p style="color: #9ca3af; font-size: 12px; margin-top: 24px; border-top: 1px solid #e5e7eb; padding-top: 16px;">
              Este e-mail foi enviado automaticamente. Por favor, não responda.
            </p>
          </div>
        </div>
      `,
      text: `
        DesliGest - Recuperação de Senha

        Você solicitou a recuperação de senha da sua conta no DesliGest.

        Acesse o link abaixo para criar uma nova senha (válido por 1 hora):
        ${resetUrl}

        Se você não solicitou esta recuperação, ignore este e-mail.
      `,
    });

    logger.info('E-mail de recuperação enviado para %s: %s', to, info.messageId);
    return true;
  } catch (err) {
    logger.error('Erro ao enviar e-mail de recuperação:', err);
    return false;
  }
};

module.exports = { sendSummaryEmail, sendPasswordResetEmail };
