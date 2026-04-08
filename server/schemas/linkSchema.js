const { z } = require('zod');

const linkSchema = z.object({
  body: z.object({
    label: z.string().min(1, 'Nome do link é obrigatório').max(100),
    url: z.string().url('URL inválida'),
    category: z.enum(['Cálculos', 'Legislação', 'Portais', 'Consultas', 'Geral']).default('Geral'),
    description: z.string().max(300).optional().default(''),
    order: z.number().int().optional().default(0),
  }),
});

module.exports = { linkSchema };
