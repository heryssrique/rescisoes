require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const mongoose = require('mongoose');
const { executarBackupGoogleDocs } = require('./services/googleBackupService.cjs');

async function runTestBackup() {
  console.log('MONGODB_URI carregada:', process.env.MONGODB_URI ? 'Sim (tamanho ' + process.env.MONGODB_URI.length + ')' : 'NÃO');
  console.log('Conectando ao MongoDB...');
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB conectado.');

    console.log('Executando backup no Google Docs...');
    const result = await executarBackupGoogleDocs();
    console.log('✅ Backup executado com sucesso!', result);
  } catch (error) {
    console.error('❌ Erro durante o processo de backup de teste:', error.message);
    if (error.response && error.response.data) {
      console.error('Detalhes da API do Google:', JSON.stringify(error.response.data, null, 2));
    }
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB desconectado.');
  }
}

runTestBackup();
