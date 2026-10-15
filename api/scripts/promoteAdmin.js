require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

async function promoteToAdmin() {
  await mongoose.connect(process.env.MONGODB_URI);
  const result = await User.updateMany({}, { role: 'admin' });
  console.log(`✅ ${result.modifiedCount} usuário(s) promovido(s) para admin.`);
  await mongoose.disconnect();
}

promoteToAdmin().catch(console.error);
