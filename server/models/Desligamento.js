const mongoose = require('mongoose');

const ChecklistItemSchema = new mongoose.Schema({
  id: { type: String, required: true },
  label: { type: String, required: true },
  etapa: { type: String, required: true },
  done: { type: Boolean, default: false },
  doneAt: { type: String, default: null },
}, { _id: false });

const HistoricoItemSchema = new mongoose.Schema({
  data: { type: String, required: true },
  acao: { type: String, required: true },
  nota: { type: String, default: '' },
}, { _id: false });

const DesligamentoSchema = new mongoose.Schema(
  {
    nome: { type: String, required: true, trim: true },
    cargo: { type: String, required: true, trim: true },
    departamento: { type: String, trim: true, default: '' },
    matricula: { type: String, trim: true, default: '' },
    dataAdmissao: { type: String, default: '' },
    dataComunicado: { type: String, required: true },
    dataDesligamento: { type: String, required: true },
    dataPagamento: { type: String, required: true },
    motivo: {
      type: String,
      enum: ['pedido', 'demissao', 'acordo', 'justa', 'aposentadoria'],
      default: 'demissao',
    },
    avisoPrevio: {
      type: String,
      enum: ['trabalhado', 'indenizado', 'nao_aplicavel'],
      default: 'indenizado',
    },
    status: {
      type: String,
      enum: ['comunicado', 'documentacao', 'homologacao', 'aguardando', 'pago', 'cancelado'],
      default: 'comunicado',
    },
    responsavel: { type: String, trim: true, default: '' },
    observacoes: { type: String, default: '' },
    checklist: { type: [ChecklistItemSchema], default: [] },
    historico: { type: [HistoricoItemSchema], default: [] },
  },
  {
    timestamps: true, // createdAt, updatedAt automáticos
    toJSON: {
      // Expõe _id como id string para facilitar uso no frontend
      transform(doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Índices úteis para queries frequentes
DesligamentoSchema.index({ dataPagamento: 1 });
DesligamentoSchema.index({ status: 1 });
DesligamentoSchema.index({ nome: 'text', cargo: 'text', departamento: 'text', matricula: 'text' });

module.exports = mongoose.model('Desligamento', DesligamentoSchema);
