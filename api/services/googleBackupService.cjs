/**
 * Serviço de Backup Automático na Nuvem (Google Drive / Google Docs)
 *
 * Exporta todos os registros de desligamentos e metadados do sistema
 * e os salva como um documento no Google Drive / Google Docs.
 */
const { google } = require('googleapis');
const Desligamento = require('../models/Desligamento.cjs');
const Link = require('../models/Link.cjs');
const User = require('../models/User.cjs');
const logger = require('../utils/logger.cjs');

async function executarBackupGoogleDocs() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY || '';

  // Remove aspas externas e converte \n literais em quebras de linha reais
  privateKey = privateKey.replace(/^["']|["']$/g, '').replace(/\\n/g, '\n').trim();

  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  if (!clientEmail || !privateKey) {
    logger.info('ℹ️ Credenciais do Google (GOOGLE_CLIENT_EMAIL / GOOGLE_PRIVATE_KEY) não configuradas. Backup na nuvem ignorado.');
    return { success: false, reason: 'Credentials not configured' };
  }

  try {
    logger.info('☁️ Iniciando backup automático para o Google Docs...');

    // Autenticação com GoogleAuth (Service Account)
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
      scopes: [
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/documents',
      ],
    });

    const drive = google.drive({ version: 'v3', auth });
    const docs = google.docs({ version: 'v1', auth });

    // Coletar dados do MongoDB
    const desligamentos = await Desligamento.find().lean();
    const links = await Link.find().lean();
    const users = await User.find().select('-password').lean();

    const dataAtual = new Date().toISOString();
    const tituloDoc = `DesliGest - Backup Automático (${new Date().toLocaleDateString('pt-BR')})`;

    // 1. Criar um novo Google Doc
    const docResponse = await docs.documents.create({
      requestBody: {
        title: tituloDoc,
      },
    });

    const documentId = docResponse.data.documentId;

    // 2. Se houver uma pasta de destino no Drive, mover o arquivo para lá
    if (folderId) {
      try {
        // Recuperar pais atuais para remover
        const file = await drive.files.get({
          fileId: documentId,
          fields: 'parents',
        });
        const previousParents = file.data.parents ? file.data.parents.join(',') : '';

        await drive.files.update({
          fileId: documentId,
          addParents: folderId,
          removeParents: previousParents,
          fields: 'id, parents',
        });
      } catch (moveErr) {
        logger.warn('⚠️ Não foi possível mover o documento para a pasta do Drive: ' + moveErr.message);
      }
    }

    // 3. Montar o conteúdo do backup formatado
    let conteudoTexto = `RELATÓRIO DE BACKUP AUTOMÁTICO - DESLIGEST\n`;
    conteudoTexto += `Data/Hora: ${dataAtual}\n`;
    conteudoTexto += `Total de Processos de Desligamento: ${desligamentos.length}\n`;
    conteudoTexto += `Total de Usuários: ${users.length}\n`;
    conteudoTexto += `Total de Links Úteis: ${links.length}\n\n`;
    conteudoTexto += `========================================\n\n`;

    desligamentos.forEach((d, index) => {
      conteudoTexto += `${index + 1}. Funcionário: ${d.nome} (Matrícula: ${d.matricula || 'N/D'})\n`;
      conteudoTexto += `   - Cargo: ${d.cargo} | Depto: ${d.departamento || 'N/D'}\n`;
      conteudoTexto += `   - Motivo: ${d.motivo} | Status: ${d.status}\n`;
      conteudoTexto += `   - Data Desligamento: ${d.dataDesligamento || 'N/D'} | Pagamento: ${d.dataPagamento || 'N/D'}\n`;
      conteudoTexto += `   - Responsável: ${d.responsavel || 'N/D'}\n`;
      conteudoTexto += `   ------------------------------------\n`;
    });

    // 4. Inserir o conteúdo no Google Doc
    await docs.documents.batchUpdate({
      documentId,
      requestBody: {
        requests: [
          {
            insertText: {
              location: {
                index: 1,
              },
              text: conteudoTexto,
            },
          },
        ],
      },
    });

    logger.info(`✅ Backup realizado com sucesso no Google Docs! Documento ID: ${documentId}`);
    return { success: true, documentId, title: tituloDoc };
  } catch (error) {
    const errorMsg = error.response?.data?.error?.message || error.message;
    logger.error('❌ Erro ao executar backup no Google Docs: ' + errorMsg);
    if (error.code === 403 || errorMsg.includes('permission') || errorMsg.includes('disabled')) {
      logger.error('💡 Dica: Verifique se a Google Docs API e Google Drive API estão ativadas no Google Cloud Console para o projeto da conta de serviço e se a pasta do Drive está compartilhada com o e-mail da conta de serviço.');
    }
    throw error;
  }
}

module.exports = { executarBackupGoogleDocs };
