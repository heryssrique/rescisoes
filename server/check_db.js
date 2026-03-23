require('dotenv').config();
const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const Desligamento = require('./models/Desligamento');

async function check() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    console.log('--- DB Check ---');
    console.log(`Connecting to: ${MONGODB_URI.split('@')[1]}`); // mask credentials
    await mongoose.connect(MONGODB_URI);
    console.log('Connected!');

    const count = await Desligamento.countDocuments();
    console.log(`\nTotal records in Desligamento collection: ${count}`);
    
    if (count > 0) {
      const samples = await Desligamento.find().limit(3).select('nome cargo createdAt');
      console.log('\nSample records:');
      samples.forEach(s => {
        console.log(`- ${s.nome} (${s.cargo}) created at: ${s.createdAt}`);
      });
    }

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

check();
