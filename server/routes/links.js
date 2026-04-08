const express = require('express');
const router = express.Router();
const Link = require('../models/Link');
const { auth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { linkSchema } = require('../schemas/linkSchema');
const { ApiError } = require('../middleware/errorMiddleware');

// Todas as rotas requerem autenticação
router.use(auth);

// GET /api/links — Listar todos os links
router.get('/', async (req, res, next) => {
  try {
    const links = await Link.find().sort({ order: 1, createdAt: 1 });
    res.json(links);
  } catch (err) {
    next(err);
  }
});

// POST /api/links — Criar um novo link
router.post('/', validate(linkSchema), async (req, res, next) => {
  try {
    const { label, url, category, description, order } = req.body;
    
    // Se não informou order, coloca no final
    let finalOrder = order;
    if (finalOrder === undefined || finalOrder === 0) {
      const last = await Link.findOne().sort({ order: -1 });
      finalOrder = last ? last.order + 1 : 0;
    }

    const link = new Link({ label, url, category, description, order: finalOrder });
    await link.save();
    res.status(201).json(link);
  } catch (err) {
    next(err);
  }
});

// PUT /api/links/:id — Atualizar um link
router.put('/:id', validate(linkSchema), async (req, res, next) => {
  try {
    const { label, url, category, description, order } = req.body;
    const link = await Link.findByIdAndUpdate(
      req.params.id,
      { label, url, category, description, order },
      { new: true, runValidators: true }
    );
    if (!link) throw new ApiError(404, 'Link não encontrado.');
    res.json(link);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/links/:id — Excluir um link
router.delete('/:id', async (req, res, next) => {
  try {
    const link = await Link.findByIdAndDelete(req.params.id);
    if (!link) throw new ApiError(404, 'Link não encontrado.');
    res.json({ message: 'Link excluído com sucesso.' });
  } catch (err) {
    next(err);
  }
});

// POST /api/links/seed — Popular links padrão (apenas se vazio)
router.post('/seed', async (req, res, next) => {
  try {
    const count = await Link.countDocuments();
    if (count > 0) {
      return res.json({ message: `Já existem ${count} links cadastrados.`, seeded: false });
    }

    const defaultLinks = [
      { label: 'Cálculo Exato', url: 'https://calculoexato.com.br/', category: 'Cálculos', order: 0 },
      { label: 'Portal eSocial', url: 'https://login.esocial.gov.br/', category: 'Portais', order: 1 },
      { label: 'Consultar CBO', url: 'https://mtecbo.gov.br/cbosite/pages/home.jsf', category: 'Consultas', order: 2 },
      { label: 'FGTS (Conectividade)', url: 'https://conectividadesocial.caixa.gov.br/', category: 'Portais', order: 3 },
    ];

    const inserted = await Link.insertMany(defaultLinks);
    res.status(201).json({ message: `${inserted.length} links padrão inseridos.`, seeded: true, links: inserted });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
