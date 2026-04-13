require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const User = require('./models/User');

async function checkUsers() {
  try {
    console.log('Connecting to:', process.env.MONGODB_URI);
    await mongoose.connect(process.env.MONGODB_URI);
    const users = await User.find({}).select('email role');
    console.log('Total users:', users.length);
    users.forEach(u => console.log(`- ${u.email} (${u.role})`));
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkUsers();
