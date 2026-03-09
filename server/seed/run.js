/**
 * Script de seed standalone.
 * Uso: node seed/run.js
 * (requer MongoDB rodando e .env configurado)
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Desligamento = require('../models/Desligamento');
const { INITIAL_DATA } = require('./initialData');

async function run() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/desligest';
  console.log(`Conectando em ${uri}...`);
  await mongoose.connect(uri);

  console.log('Limpando coleção...');
  await Desligamento.deleteMany({});

  console.log(`Inserindo ${INITIAL_DATA.length} registros...`);
  const docs = await Desligamento.insertMany(INITIAL_DATA);
  console.log(`✅ ${docs.length} registros inseridos com sucesso!`);

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => {
  console.error('❌ Erro no seed:', err);
  process.exit(1);
});
