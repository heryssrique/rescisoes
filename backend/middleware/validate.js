const { ApiError } = require('./errorMiddleware');

const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    // Atualizar request com o objeto limpo pelo Zod
    req.body = parsed.body;
    req.query = parsed.query;
    req.params = parsed.params;
    next();
  } catch (err) {
    if (err.errors) {
      const message = err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return next(new ApiError(400, `Erro de validação: ${message}`));
    }
    return next(new ApiError(400, 'Erro de validação inválido'));
  }
};

module.exports = validate;