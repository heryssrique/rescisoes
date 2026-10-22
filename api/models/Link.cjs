const mongoose = require('mongoose');

const LinkSchema = new mongoose.Schema({
  label: { type: String, required: true, trim: true },
  url: { type: String, required: true, trim: true },
  category: { 
    type: String, 
    required: true, 
    enum: ['Cálculos', 'Legislação', 'Portais', 'Consultas', 'Geral'],
    default: 'Geral'
  },
  description: { type: String, default: '', trim: true },
  order: { type: Number, default: 0 },
}, { timestamps: true });

// Virtual para mapear _id para id no JSON
LinkSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret.__v;
    return ret;
  }
});

const { linkStore } = require('../utils/memoryStore.cjs');

const MongooseModel = mongoose.models.Link || mongoose.model('Link', LinkSchema);

const proxyModel = new Proxy({}, {
  get(target, prop) {
    if (global.isMemoryFallback && typeof linkStore[prop] === 'function') {
      return linkStore[prop].bind(linkStore);
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
        save: async function() { return linkStore.create(args[0]); }
      };
    }
    return new MongooseModel(...args);
  }
});

module.exports = proxyModel;
