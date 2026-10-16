const jwt = require('jsonwebtoken');
const User = require('../models/User.cjs');
const { ApiError } = require('./errorMiddleware.cjs');

// JWT_SECRET deve ser obrigatoriamente definido em variáveis de ambiente
if (!process.env.JWT_SECRET) {
  throw new Error('CRÍTICO: JWT_SECRET não está definido nas variáveis de ambiente. Defina antes de iniciar o servidor.');
}

const JWT_SECRET = process.env.JWT_SECRET;

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) throw new ApiError(401, 'Por favor, autentique-se.');

    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    const user = await User.findOne({ _id: decoded.id });

    if (!user) throw new ApiError(401, 'Usuário não encontrado.');

    req.token = token;
    req.user = user;
    next();
  } catch (err) {
    next(new ApiError(401, 'Falha na autenticação: ' + err.message));
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, 'Você não tem permissão para realizar esta ação.'));
    }
    next();
  };
};

module.exports = { auth, authorize };