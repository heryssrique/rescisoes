/**
 * Promove um usuário existente a administrador.
 *
 * Substitui a antiga escalação automática do /register (primeiro cadastrado
 * virava admin), que permitia a qualquer visitante assumir o papel de admin
 * sempre que a coleção de usuários estivesse vazia.
 *
 * Uso (local, com MONGODB_URI apontando para o banco desejado):
 *   node api/scripts/promoteAdmin.cjs pessoa@empresa.com
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User.cjs');

async function run() {
  const email = (process.argv[2] || '').trim().toLowerCase();
  if (!email) {
    console.error('Uso: node api/scripts/promoteAdmin.cjs <email>');
    process.exit(1);
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI não definida. Configure api/.env ou a variável de ambiente.');
    process.exit(1);
  }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });

  const user = await User.findOne({ email });
  if (!user) {
    console.error(`Nenhum usuário encontrado com o e-mail "${email}".`);
    console.error('Cadastre-se primeiro pela tela de registro e rode este script em seguida.');
    await mongoose.disconnect();
    process.exit(1);
  }

  if (user.role === 'admin') {
    console.log(`"${email}" já é admin. Nada a fazer.`);
    await mongoose.disconnect();
    process.exit(0);
  }

  user.role = 'admin';
  await user.save();

  console.log(`✅ "${email}" promovido a admin.`);
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('❌ Erro ao promover admin:', err.message);
  process.exit(1);
});
