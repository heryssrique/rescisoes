const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'hr' }, // admin, hr, etc
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
}, { timestamps: true });

// Check password before saving
UserSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const { userStore } = require('../utils/memoryStore.cjs');

const MongooseModel = mongoose.models.User || mongoose.model('User', UserSchema);

const proxyModel = new Proxy({}, {
  get(target, prop) {
    if (global.isMemoryFallback && typeof userStore[prop] === 'function') {
      return userStore[prop].bind(userStore);
    }
    if (typeof MongooseModel[prop] === 'function') {
      return MongooseModel[prop].bind(MongooseModel);
    }
    return MongooseModel[prop];
  },
  construct(target, args) {
    if (global.isMemoryFallback) {
      return {
        ...args[0],
        save: async function() { return userStore.create(args[0]); }
      };
    }
    return new MongooseModel(...args);
  }
});

module.exports = proxyModel;
