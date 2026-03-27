const { z } = require('zod');

const desligamentoCreateSchema = z.object({
  body: z.object({
    nome: z.string().min(3, 'Nome é obrigatório'),
    cargo: z.string().min(2, 'Cargo é obrigatório'),
    coligada: z.string().min(1, 'Empresa/Coligada é obrigatória'),
    dataAdmissao: z.string().optional(),
    dataDesligamento: z.string().optional(),
    dataComunicado: z.string().optional(),
    dataPagamento: z.string().optional(),
    motivo: z.string().optional(),
    status: z.string().optional(),
    avisoPrevio: z.string().optional(),
    diasAvisoTrabalhado: z.number().optional().default(30),
    departamento: z.string().optional(),
    matricula: z.string().optional(),
    responsavel: z.string().optional(),
    observacoes: z.string().optional(),
    checklist: z.array(z.any()).optional(),
  }),
});

module.exports = { desligamentoCreateSchema };
