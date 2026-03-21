require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/rescisoes';

async function run() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Conectado ao MongoDB para limpeza de checklist.');

    const Desligamento = mongoose.model('Desligamento', new mongoose.Schema({
        checklist: Array
    }, { strict: false }));

    const idsToRemove = ['d4', 'd5', 'h6', 'h7'];

    const result = await Desligamento.updateMany(
      {},
      { $pull: { checklist: { id: { $in: idsToRemove } } } }
    );

    console.log(`Atualização concluída. Documentos modificados: ${result.modifiedCount}`);
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Desconectado.');
  }
}

run();
