const { z } = require('zod');

const loginSchema = z.object({
  body: z.object({
    email: z.string().email('E-mail inválido'),
    password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  }),
});

const registerSchema = z.object({
  body: z.object({
    name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres'),
    email: z.string().email('E-mail inválido'),
    password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  }),
});

module.exports = { loginSchema, registerSchema };
