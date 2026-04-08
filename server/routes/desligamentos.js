const express = require('express');
const router = express.Router();
const Desligamento = require('../models/Desligamento');
const { auth, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { desligamentoCreateSchema } = require('../schemas/desligamentoSchema');
const { ApiError } = require('../middleware/errorMiddleware');

// ── GET /api/desligamentos (with Pagination) ───────────────────────────────
router.get('/', auth, async (req, res, next) => {
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
router.get('/:id', auth, async (req, res, next) => {
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

      // Safe comparison for dates and complex objects
      let oldVal = existing[key];
      let newVal = updates[key];

      // Convert mongoose items to JS objects if needed
      if (oldVal && typeof oldVal.toObject === 'function') oldVal = oldVal.toObject();

      const oldClean = (oldVal instanceof Date) ? oldVal.toISOString() : (typeof oldVal === 'object' ? JSON.stringify(oldVal) : String(oldVal || ''));
      const newClean = (newVal instanceof Date) ? newVal.toISOString() : (typeof newVal === 'object' ? JSON.stringify(newVal) : String(newVal || ''));

      if (oldClean !== newClean) {
        historyEntries.push({
          data: new Date().toISOString(),
          acao: `Campo '${key}' alterado por ${req.user.name}`,
          nota: `De: "${oldClean.substring(0, 50)}${oldClean.length > 50 ? '...' : ''}" Para: "${newClean.substring(0, 50)}${newClean.length > 50 ? '...' : ''}"`
        });
      }
    }

    if (historyEntries.length > 0) {
      // Ensure we don't accidentally wipe existing history if it wasn't sent
      const currentHistory = Array.isArray(existing.historico) ? existing.historico.map(h => (h.toObject ? h.toObject() : h)) : [];
      updates.historico = [...currentHistory, ...historyEntries];
    }

    const doc = await Desligamento.findByIdAndUpdate(
      req.params.id,
      updates,
      { returnDocument: 'after', runValidators: true }
    );
    
    res.json(doc);
  } catch (err) {
    console.error(`[PUT /desligamentos/${req.params.id}] Error:`, err);
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

// ── PATCH /api/desligamentos/:id/checklist/:itemId/nao-aplicavel ────────────
router.patch('/:id/checklist/:itemId/nao-aplicavel', auth, async (req, res, next) => {
  try {
    const doc = await Desligamento.findById(req.params.id);
    if (!doc) throw new ApiError(404, 'Processo não encontrado');

    const item = doc.checklist.find(c => c.id === req.params.itemId);
    if (!item) throw new ApiError(404, 'Item de checklist não encontrado');

    item.notApplicable = !item.notApplicable;
    if (item.notApplicable) {
      // Marcar como N/A limpa o done
      item.done = false;
      item.doneAt = null;
    }

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
router.post('/bulk', auth, async (req, res) => {
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

// ── GET /api/desligamentos/migrate-diagnostics (debug) ─────────────────────
router.get('/migrate-diagnostics', auth, async (req, res, next) => {
  try {
    const total = await Desligamento.countDocuments({});
    const naoArquivados = await Desligamento.countDocuments({ arquivado: { $ne: true } });
    const sample = await Desligamento.find({ arquivado: { $ne: true } }).limit(10).select('nome dataPagamento dataDesligamento arquivado');
    res.json({ total, naoArquivados, sample });
  } catch (err) { next(err); }
});

// ── POST /api/desligamentos/migrate-archive-old (One-time use) ───────────
router.post('/migrate-archive-old', auth, async (req, res, next) => {
  try {
    const CUTOFF_DATE = new Date('2026-03-01T00:00:00.000Z');
    const now = new Date().toISOString().slice(0, 19);

    function parseDate(str) {
      if (!str || !String(str).trim()) return null;
      let s = String(str).trim();
      if (/^\d{5}$/.test(s)) {
        const d = new Date(Math.round((parseInt(s) - 25569) * 86400 * 1000));
        return isNaN(d) ? null : d;
      }
      const parts = s.split(/[\/\-]/);
      if (parts.length === 3) {
        const [a, b, c] = parts;
        if (c.length === 4) s = `${c}-${b.padStart(2,'0')}-${a.padStart(2,'0')}`;
        else if (a.length === 4) s = `${a}-${b.padStart(2,'0')}-${c.padStart(2,'0')}`;
        else if (c.length === 2) s = `20${c}-${b.padStart(2,'0')}-${a.padStart(2,'0')}`;
      }
      const d = new Date(s);
      return isNaN(d) ? null : d;
    }

    const todas = await Desligamento.find({ arquivado: { $ne: true } });
    const debugSample = todas.slice(0, 5).map(d => ({ nome: d.nome, dataPagamento: d.dataPagamento, dataDesligamento: d.dataDesligamento, createdAt: d.createdAt }));

    const docs = todas.filter(doc => {
      const d = parseDate(doc.dataPagamento)
             || parseDate(doc.dataDesligamento)
             || (doc.createdAt ? new Date(doc.createdAt) : null);
      return d && d < CUTOFF_DATE;
    });

    if (docs.length === 0) {
      return res.json({ message: 'Nenhum registro encontrado para arquivar.', updated: 0, totalNaoArquivados: todas.length, cutoffDate: CUTOFF_DATE.toISOString(), debugSample });
    }

    let updated = 0;
    for (const doc of docs) {
      const updatedChecklist = (doc.checklist || []).map(item => {
        if (item.id === 'p1' || item.id === 'p2') {
          return { ...item.toObject(), done: true, doneAt: now, notApplicable: false };
        }
        return item;
      });

      await Desligamento.findByIdAndUpdate(doc._id, {
        $set: { arquivado: true, status: 'pago', checklist: updatedChecklist },
        $push: {
          historico: {
            data: now,
            acao: 'Arquivado automaticamente (migração)',
            nota: `Processo arquivado em lote — pagamento anterior a 01/03/2026.`
          }
        }
      });
      updated++;
    }

    res.json({
      message: `Migração concluída com sucesso.`,
      updated,
      cutoffDate: '2026-03-01',
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

