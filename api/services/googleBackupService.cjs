/**
 * Serviço de Backup Automático na Nuvem (Google Drive / Google Docs)
 *
 * Exporta todos os registros de desligamentos e metadados do sistema
 * e os salva como um documento no Google Drive / Google Docs.
 *
 * OBSERVAÇÃO: O Google Docs API tem limite de ~100KB por operação de batchUpdate.
 * Para contornar isso, o conteúdo é dividido em chunks e inserido sequencialmente.
 */
const zlib = require('zlib');
const { google } = require('googleapis');

// Marcador que identifica um payload de backup compactado com gzip antes do
// Base64. A restauração usa este prefixo para saber que precisa descompactar,
// mantendo compatibilidade com backups antigos em Base64 puro.
const PAYLOAD_GZIP_PREFIX = 'GZIP:';
const Desligamento = require('../models/Desligamento.cjs');
const Link = require('../models/Link.cjs');
const User = require('../models/User.cjs');
const logger = require('../utils/logger.cjs');

// Limite seguro por chunk (Google Docs API tem limite de ~100KB por operação)
const CHUNK_SIZE = 80000; // 80KB por chunk para ter margem de segurança

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

    // 1. Definir o documento de destino.
    //
    // IMPORTANTE: contas de serviço NÃO possuem cota de armazenamento no Google
    // Drive e por isso não podem ser donas de arquivos. Qualquer tentativa de
    // criar um documento novo falha com 403 ("Drive storage quota has been
    // exceeded"), mesmo que a conta tenha permissão de escrita na pasta.
    // Por isso reutilizamos um documento pré-existente (dono = usuário real),
    // informado em GOOGLE_DOC_ID, e apenas sobrescrevemos seu conteúdo.
    let documentId = process.env.GOOGLE_DOC_ID;

    if (!documentId) {
      // Fallback: tenta criar um documento. Só funciona em Shared Drives ou
      // com delegação de domínio (impersonation de um usuário real).
      try {
        const docResponse = await docs.documents.create({
          requestBody: {
            title: tituloDoc,
          },
        });

        documentId = docResponse.data.documentId;

        // 2. Se houver uma pasta de destino no Drive, mover o arquivo para lá
        if (folderId) {
          try {
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
      } catch (createErr) {
        throw new Error(
          'Não foi possível criar o documento de backup: ' + createErr.message +
          '\n💡 Contas de serviço não possuem cota de armazenamento no Drive. ' +
          'Crie um Google Doc no seu Drive pessoal, compartilhe-o como Editor com ' +
          clientEmail + ' e defina GOOGLE_DOC_ID=<id> no .env / nas variáveis da Vercel.'
        );
      }
    } else {
      logger.info(`📌 Reutilizando documento de backup existente: ${documentId}`);
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

    const backupPayload = {
      versao: "2.0",
      dataBackup: dataAtual,
      desligamentos,
      links,
      users
    };
    // JSON compacto + gzip antes do Base64.
    //
    // Um Google Doc aceita no máximo ~1.020.000 caracteres. O payload em JSON
    // identado e Base64 puro chegava a ~12,4 milhões de caracteres (160 chunks),
    // estourando o limite e fazendo o batchUpdate falhar com FAILED_PRECONDITION.
    // Compactando, os mesmos dados cabem em ~140.000 caracteres (redução de ~88x).
    const payloadJson = JSON.stringify(backupPayload);
    const payloadBase64 = zlib.gzipSync(Buffer.from(payloadJson, 'utf8'), { level: 9 }).toString('base64');

    logger.info(
      `🗜️ Payload compactado: ${payloadJson.length.toLocaleString()} chars de JSON ` +
      `→ ${payloadBase64.length.toLocaleString()} chars em gzip+Base64`
    );

    conteudoTexto += `\n========================================\n`;
    conteudoTexto += `PAYLOAD DE RESTAURAÇÃO DE DADOS (JSON GZIP+BASE64):\n`;
    conteudoTexto += `(Guarde este código. Para restaurar, cole-o na aba Configurações > Restaurar Backup. O sistema descompacta automaticamente.)\n\n`;
    conteudoTexto += `${PAYLOAD_GZIP_PREFIX}${payloadBase64}\n`;

    logger.info(`📄 Conteúdo do backup gerado: ${conteudoTexto.length.toLocaleString()} caracteres`);

    // 4. Inserir o conteúdo no Google Doc usando chunks
    // Primeiro, obter o documento atual para saber o endIndex
    logger.info('📖 Lendo documento atual...');
    const currentDoc = await docs.documents.get({ documentId });
    const bodyContent = currentDoc.data.body.content;
    const lastElement = bodyContent[bodyContent.length - 1];
    const endIndex = lastElement.endIndex;

    logger.info(`📊 EndIndex atual do documento: ${endIndex}`);

    // Limpar conteúdo existente (se houver)
    if (endIndex > 2) {
      logger.info('🗑️ Limpando conteúdo existente...');
      try {
        await docs.documents.batchUpdate({
          documentId,
          requestBody: {
            requests: [{
              deleteContentRange: {
                range: {
                  startIndex: 1,
                  endIndex: endIndex - 1,
                },
              },
            }],
          },
        });
        logger.info('✅ Conteúdo existente removido');
      } catch (e) {
        logger.warn('⚠️ Erro ao limpar conteúdo existente: ' + e.message);
      }
    }

    // Dividir o conteúdo em chunks
    const chunks = [];
    for (let i = 0; i < conteudoTexto.length; i += CHUNK_SIZE) {
      chunks.push(conteudoTexto.slice(i, i + CHUNK_SIZE));
    }

    logger.info(`📦 Enviando ${chunks.length} chunk(s) para o documento...`);

    // Inserir cada chunk
    for (let i = 0; i < chunks.length; i++) {
      logger.info(`📝 Inserindo chunk ${i + 1}/${chunks.length} (${chunks[i].length.toLocaleString()} chars)...`);

      try {
        await docs.documents.batchUpdate({
          documentId,
          requestBody: {
            requests: [{
              insertText: {
                // Insere sempre no FIM do corpo do documento.
                // Usar `location: { index: 1 }` empurraria os chunks anteriores
                // para frente, gravando-os em ordem inversa e corrompendo o
                // payload Base64 de restauração.
                endOfSegmentLocation: { segmentId: '' },
                text: chunks[i],
              },
            }],
          },
        });
        logger.info(`✅ Chunk ${i + 1} inserido com sucesso`);
      } catch (chunkErr) {
        logger.error(`❌ Erro ao inserir chunk ${i + 1}: ${chunkErr.message}`);
        throw chunkErr;
      }
    }

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
