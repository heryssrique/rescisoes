const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { ApiError } = require('./errorMiddleware');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) throw new ApiError(401, 'Por favor, autentique-se.');

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
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
