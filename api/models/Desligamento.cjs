const mongoose = require('mongoose');

const ChecklistItemSchema = new mongoose.Schema({
  id: { type: String, required: true },
  label: { type: String, required: true },
  etapa: { type: String, required: true },
  done: { type: Boolean, default: false },
  doneAt: { type: String, default: null },
  notApplicable: { type: Boolean, default: false },
  documento: {
    signed: { type: Boolean, default: null },
    motivo: { type: String, default: '' },
  },
}, { _id: false });

const HistoricoItemSchema = new mongoose.Schema({
  data: { type: String, required: true },
  acao: { type: String, required: true },
  nota: { type: String, default: '' },
}, { _id: false });

const DesligamentoSchema = new mongoose.Schema(
  {
    nome: { type: String, required: true, trim: true },
    coligada: { type: String, trim: true, default: '' },
    cargo: { type: String, trim: true, default: '' },
    departamento: { type: String, trim: true, default: '' },
    matricula: { type: String, trim: true, default: '' },
    dataAdmissao: { type: String, default: '' },
    dataComunicado: { type: String, default: '' },
    dataDesligamento: { type: String, default: '' },
    dataPagamento: { type: String, default: '' },
    dataProgramadaPagamento: { type: String, default: '' },
    prazoPagamento: { type: String, default: '10' },
    motivo: {
      type: String,
      enum: ['pedido', 'demissao', 'acordo', 'justa', 'aposentadoria', 'termino_empresa', 'termino_empregado', 'termino_contrato', 'falecimento'],
      default: 'demissao',
    },
    avisoPrevio: {
      type: String,
      enum: ['trabalhado', 'indenizado', 'descontado', 'nao_aplicavel'],
      default: 'indenizado',
    },
    diasAvisoTrabalhado: { type: String, enum: ['', '23', '30'], default: '' },
    status: {
      type: String,
      enum: ['comunicado', 'documentacao', 'homologacao', 'aguardando', 'pendente_comprovante', 'pago', 'cancelado', 'concluido'],
      default: 'comunicado',
    },
    responsavel: { type: String, trim: true, default: '' },
    observacoes: { type: String, default: '' },
    motivoCancelamento: { type: String, default: '' },
    arquivado: { type: Boolean, default: false },
    checklist: { type: [ChecklistItemSchema], default: [] },
    historico: { type: [HistoricoItemSchema], default: [] },
    anexos: { type: Array, default: [] },
  },
  {
    timestamps: true, // createdAt, updatedAt automáticos
    toJSON: {
      // Expõe _id como id string e __v como version para optimistic locking
      transform(doc, ret) {
        ret.id = ret._id.toString();
        ret.version = ret.__v; // Expõe versão para controle de concorrência
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

const { desligamentoStore } = require('../utils/memoryStore.cjs');

// Índices úteis para queries frequentes
DesligamentoSchema.index({ dataPagamento: 1 });
DesligamentoSchema.index({ status: 1 });
DesligamentoSchema.index({ nome: 'text', cargo: 'text', departamento: 'text', matricula: 'text' });

const MongooseModel = mongoose.models.Desligamento || mongoose.model('Desligamento', DesligamentoSchema);

// O target precisa ser uma função: um Proxy só expõe [[Construct]] quando o
// próprio target é construtível. Com o target `{}` usado antes,
// `new Desligamento(...)` lançava "Desligamento is not a constructor" ANTES de o
// trap `construct` abaixo ser consultado, tornando-o código morto.
const proxyModel = new Proxy(function () {}, {
  get(target, prop) {
    if (global.isMemoryFallback && typeof desligamentoStore[prop] === 'function') {
      return desligamentoStore[prop].bind(desligamentoStore);
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
        save: async function() { return desligamentoStore.create(args[0]); }
      };
    }
    return new MongooseModel(...args);
  }
});

module.exports = proxyModel;
