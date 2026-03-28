const express = require('express');
const router = express.Router();
const Desligamento = require('../models/Desligamento');
const { auth, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { desligamentoCreateSchema } = require('../schemas/desligamentoSchema');
const { ApiError } = require('../middleware/errorMiddleware');

// ── GET /api/desligamentos (with Pagination) ───────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const { status, motivo, q, sort = 'dataPagamento', arquivado, page = 1, limit = 5000 } = req.query;
    const filter = {};

    const isArquivado = arquivado === 'true';
    filter.arquivado = isArquivado ? true : { $ne: true };

    if (status && status !== 'todos') filter.status = status;
    if (motivo && motivo !== 'todos') filter.motivo = motivo;
    
    if (q) {
      const regex = new RegExp(q, 'i');
      filter.$or = [
        { nome: regex },
        { cargo: regex },
        { departamento: regex },
        { matricula: regex },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [desligamentos, total] = await Promise.all([
      Desligamento.find(filter)
        .sort({ [sort]: 1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Desligamento.countDocuments(filter)
    ]);

    res.json({
      results: desligamentos.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      data: desligamentos
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/desligamentos/:id ────────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const doc = await Desligamento.findById(req.params.id);
    if (!doc) throw new ApiError(404, 'Processo não encontrado');
    res.json(doc);
  } catch (err) {
    next(err);
  }
});

// ── POST /api/desligamentos ────────────────────────────────────────────────
router.post('/', auth, validate(desligamentoCreateSchema), async (req, res, next) => {
  try {
    const doc = await Desligamento.create({
      ...req.body,
      responsavel: req.user.name // Auto-assign responsible if not provided
    });
    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
});

// ── PUT /api/desligamentos/:id ─────────────────────────────────────────────
router.put('/:id', auth, async (req, res, next) => {
  try {
    const existing = await Desligamento.findById(req.params.id);
    if (!existing) throw new ApiError(404, 'Processo não encontrado');

    const updates = req.body;
    const historyEntries = [];
    const ignoreFields = ['historico', 'checklist', 'updatedAt', 'createdAt', '__v', '_id', 'anexos'];

    for (const key in updates) {
      if (ignoreFields.includes(key) || updates[key] === undefined) continue;

      const oldVal = String(existing[key] || '');
      const newVal = String(updates[key] || '');

      if (oldVal !== newVal) {
        historyEntries.push({
          data: new Date().toISOString(),
          acao: `Campo '${key}' alterado por ${req.user.name}`,
          nota: `De: "${oldVal}" Para: "${newVal}"`
        });
      }
    }

    if (historyEntries.length > 0) {
      if (!updates.historico) updates.historico = existing.historico || [];
      updates.historico.push(...historyEntries);
    }

    const doc = await Desligamento.findByIdAndUpdate(
      req.params.id,
      updates,
      { returnDocument: 'after', runValidators: true }
    );
    
    res.json(doc);
  } catch (err) {
    next(err);
  }
});

// ── PATCH /api/desligamentos/:id/checklist/:itemId ─────────────────────────
router.patch('/:id/checklist/:itemId', auth, async (req, res, next) => {
  try {
    const doc = await Desligamento.findById(req.params.id);
    if (!doc) throw new ApiError(404, 'Processo não encontrado');

    const item = doc.checklist.find(c => c.id === req.params.itemId);
    if (!item) throw new ApiError(404, 'Item de checklist não encontrado');

    item.done = !item.done;
    item.doneAt = item.done ? new Date().toISOString() : null;
    if (item.done) item.notApplicable = false;
    
    await doc.save();
    res.json(doc);
  } catch (err) {
    next(err);
  }
});

// ── PATCH /api/desligamentos/:id/historico ─────────────────────────────────
router.patch('/:id/historico', auth, async (req, res, next) => {
  try {
    const doc = await Desligamento.findByIdAndUpdate(
      req.params.id,
      { $push: { historico: { ...req.body, data: new Date().toISOString() } } },
      { returnDocument: 'after', runValidators: true }
    );
    if (!doc) throw new ApiError(404, 'Processo não encontrado');
    res.json(doc);
  } catch (err) {
    next(err);
  }
});

// ── DELETE /api/desligamentos/:id ─────────────────────────────────────────
router.delete('/:id', auth, authorize('admin'), async (req, res, next) => {
  try {
    const doc = await Desligamento.findByIdAndDelete(req.params.id);
    if (!doc) throw new ApiError(404, 'Processo não encontrado');
    res.json({ success: true, id: req.params.id });
  } catch (err) {
    next(err);
  }
});

// ── Bulk Actions ──────────────────────────────────────────────────────────

router.post('/bulk-archive', auth, async (req, res, next) => {
  try {
    const { ids } = req.body;
    const result = await Desligamento.updateMany(
      { _id: { $in: ids }, status: { $in: ['pago', 'cancelado'] } },
      { 
        $set: { arquivado: true },
        $push: { historico: { data: new Date().toISOString(), acao: `Arquivado em lote por ${req.user.name}`, nota: '' } }
      }
    );
    res.json({ message: `${result.modifiedCount} registros arquivados`, ids });
  } catch (err) {
    next(err);
  }
});

router.post('/bulk-status', auth, async (req, res, next) => {
  try {
    const { ids, status } = req.body;
    const result = await Desligamento.updateMany(
      { _id: { $in: ids } },
      { 
        $set: { status },
        $push: { historico: { data: new Date().toISOString(), acao: `Status alterado em lote para '${status}' por ${req.user.name}`, nota: '' } }
      }
    );
    res.json({ message: `${result.modifiedCount} registros atualizados`, ids });
  } catch (err) {
    next(err);
  }
});

router.post('/bulk-delete', auth, authorize('admin'), async (req, res, next) => {
  try {
    const { ids } = req.body;
    const result = await Desligamento.deleteMany({ _id: { $in: ids } });
    res.json({ message: `${result.deletedCount} registros excluídos`, ids });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

// ─── POST /api/desligamentos/seed ──────────────────────────────────────────
// Popula o banco com dados de exemplo (só usar em dev)
router.post('/seed', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: 'Seed não permitido em produção' });
    }
    const { INITIAL_DATA } = require('../seed/initialData');
    await Desligamento.deleteMany({});
    const docs = await Desligamento.insertMany(INITIAL_DATA);
    res.status(201).json({ inserted: docs.length, docs });
  } catch (err) {
    console.error('[POST /desligamentos/seed]', err);
    res.status(500).json({ error: 'Erro no seed', detail: err.message });
  }
});

// ─── POST /api/desligamentos/bulk ───────────────────────────────────────────
// Importa múltiplos desligamentos de uma vez (ex: via planilha)
router.post('/bulk', async (req, res) => {
  try {
    const data = Array.isArray(req.body) ? req.body : [req.body];
    console.log(`[POST /desligamentos/bulk] Tentando importar ${data.length} registros`);
    
    // insertMany com runValidators garante que o schema seja respeitado
    const docs = await Desligamento.insertMany(data, { runValidators: true });
    
    console.log(`[POST /desligamentos/bulk] Sucesso: ${docs.length} registros inseridos`);
    res.status(201).json({ inserted: docs.length, docs });
  } catch (err) {
    console.error('[POST /desligamentos/bulk] Erro:', err);
    
    // Captura erros de validação do Mongoose
    if (err.name === 'ValidationError') {
      return res.status(422).json({ 
        error: 'Erro de validação nos dados', 
        detail: err.message,
        errors: err.errors // Detalhes por campo
      });
    }

    // Erros de escrita em lote do MongoDB
    if (err.name === 'MongoBulkWriteError' || err.name === 'BulkWriteError') {
      return res.status(422).json({ 
        error: 'Erro na escrita em lote (probabilidade de dados duplicados ou inválidos)', 
        detail: err.message 
      });
    }

    res.status(500).json({ error: 'Erro ao importar dados', detail: err.message });
  }
});

module.exports = router;

