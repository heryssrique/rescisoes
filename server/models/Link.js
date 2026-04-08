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

module.exports = mongoose.model('Link', LinkSchema);
