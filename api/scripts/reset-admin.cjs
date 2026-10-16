/**
 * Reset password script — atualiza a senha do admin no MongoDB da Vercel.
 * Uso: node scripts/reset-admin.js
 * Precisa de MONGODB_URI no .env ou variáveis de ambiente.
 */
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('FALTA MONGODB_URI no ambiente.');
  process.exit(1);
}

const NEW_PASSWORD = 'osenhordosaneis'; // mesma do JWT_SECRET da .env

async function run() {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });

  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));

  // Hash da nova senha
  const hashed = await bcrypt.hash(NEW_PASSWORD, 10);

  // Busca admin por role (não por email, para não depender do valor seedado)
  const admin = await User.findOne({ role: 'admin' });
  if (!admin) {
    console.error('Nenhum admin encontrado.');
    await mongoose.disconnect();
    process.exit(1);
  }

  admin.password = hashed;
  await admin.save();
  console.log(`✅ Senha do admin (${admin.email}) atualizada para "${NEW_PASSWORD}"`);
  console.log(`   ID: ${admin._id}`);

  await mongoose.disconnect();
}

run().catch(err => {
  console.error('❌ Erro:', err.message);
  process.exit(1);
});
