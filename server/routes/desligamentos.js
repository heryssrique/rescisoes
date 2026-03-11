const express = require('express');
const router = express.Router();
const Desligamento = require('../models/Desligamento');

// ─── GET /api/desligamentos ─────────────────────────────────────────────────
// Lista todos, com filtros opcionais via query string:
//   ?status=comunicado  →  filtra por status
//   ?motivo=demissao    →  filtra por motivo
//   ?q=nome             →  busca por texto (nome, cargo, departamento, matrícula)
//   ?sort=dataPagamento →  campo de ordenação (padrão: dataPagamento asc)
router.get('/', async (req, res) => {
  try {
    const { status, motivo, q, sort = 'dataPagamento' } = req.query;
    const filter = {};

    if (status && status !== 'todos') filter.status = status;
    if (motivo && motivo !== 'todos') filter.motivo = motivo;
    if (q) {
      // Busca simples com regex (case-insensitive) em múltiplos campos
      const regex = new RegExp(q, 'i');
      filter.$or = [
        { nome: regex },
        { cargo: regex },
        { departamento: regex },
        { matricula: regex },
      ];
    }

    const desligamentos = await Desligamento.find(filter).sort({ [sort]: 1 });
    res.json(desligamentos);
  } catch (err) {
    console.error('[GET /desligamentos]', err);
    res.status(500).json({ error: 'Erro ao buscar desligamentos', detail: err.message });
  }
});

// ─── GET /api/desligamentos/:id ────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const doc = await Desligamento.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Não encontrado' });
    res.json(doc);
  } catch (err) {
    res.status(400).json({ error: 'ID inválido ou erro na busca', detail: err.message });
  }
});

// ─── POST /api/desligamentos ────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const doc = await Desligamento.create(req.body);
    res.status(201).json(doc);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(422).json({ error: 'Dados inválidos', detail: err.message });
    }
    console.error('[POST /desligamentos]', err);
    res.status(500).json({ error: 'Erro ao criar desligamento', detail: err.message });
  }
});

// ─── PUT /api/desligamentos/:id ─────────────────────────────────────────────
// Atualiza qualquer campo (incluindo checklist e status)
router.put('/:id', async (req, res) => {
  try {
    const doc = await Desligamento.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!doc) return res.status(404).json({ error: 'Não encontrado' });
    res.json(doc);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(422).json({ error: 'Dados inválidos', detail: err.message });
    }
    res.status(400).json({ error: 'Erro ao atualizar', detail: err.message });
  }
});

// ─── PATCH /api/desligamentos/:id/checklist/:itemId ─────────────────────────
// Toggle de um item específico do checklist sem substituir o array inteiro
router.patch('/:id/checklist/:itemId', async (req, res) => {
  try {
    const doc = await Desligamento.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Não encontrado' });

    const item = doc.checklist.find(c => c.id === req.params.itemId);
    if (!item) return res.status(404).json({ error: 'Item de checklist não encontrado' });

    item.done = !item.done;
    item.doneAt = item.done ? new Date().toISOString() : null;
    await doc.save();
    res.json(doc);
  } catch (err) {
    res.status(400).json({ error: 'Erro no toggle do checklist', detail: err.message });
  }
});

// ─── PATCH /api/desligamentos/:id/historico ─────────────────────────────────
// Adiciona uma entrada ao histórico sem substituir o array
router.patch('/:id/historico', async (req, res) => {
  try {
    const doc = await Desligamento.findByIdAndUpdate(
      req.params.id,
      { $push: { historico: req.body } },
      { new: true, runValidators: true }
    );
    if (!doc) return res.status(404).json({ error: 'Não encontrado' });
    res.json(doc);
  } catch (err) {
    res.status(400).json({ error: 'Erro ao adicionar histórico', detail: err.message });
  }
});

// ─── DELETE /api/desligamentos/:id ─────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const doc = await Desligamento.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Não encontrado' });
    res.json({ success: true, id: req.params.id });
  } catch (err) {
    res.status(400).json({ error: 'Erro ao excluir', detail: err.message });
  }
});

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
    const docs = await Desligamento.insertMany(data, { runValidators: true });
    res.status(201).json({ inserted: docs.length, docs });
  } catch (err) {
    if (err.name === 'ValidationError' || err.name === 'BulkWriteError') {
      return res.status(422).json({ error: 'Erro de validação em um ou mais registros', detail: err.message });
    }
    console.error('[POST /desligamentos/bulk]', err);
    res.status(500).json({ error: 'Erro ao importar dados', detail: err.message });
  }
});

module.exports = router;

