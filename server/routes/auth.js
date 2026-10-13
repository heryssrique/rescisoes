const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const authAttemptLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { error: 'Muitas tentativas. Tente novamente em 15 minutos.' },
});
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const { auth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { loginSchema, registerSchema } = require('../schemas/authSchema');
const { ApiError } = require('../middleware/errorMiddleware');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('CRÍTICO: JWT_SECRET não está definido nas variáveis de ambiente.');
}

// Register User
router.post('/register', authAttemptLimiter, validate(registerSchema), async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (mongoose.connection.readyState !== 1) {
      throw new ApiError(503, 'Serviço de banco de dados temporariamente indisponível. Tente novamente mais tarde.');
    }

    let user;
    try {
      user = await User.findOne({ email });
    } catch (dbErr) {
      throw new ApiError(503, 'Erro ao conectar ao banco de dados.');
    }

    if (user) {
      throw new ApiError(400, 'Usuário já existe. Faça login.');
    }

    // Primeiro usuário cadastrado vira admin automaticamente
    const userCount = await User.countDocuments();
    const role = userCount === 0 ? 'admin' : 'hr';

    user = new User({ name, email, password, role });
    await user.save();

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    next(err);
  }
});

// Login User
router.post('/login', authAttemptLimiter, validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (mongoose.connection.readyState !== 1) {
      throw new ApiError(503, 'Serviço de banco de dados temporariamente indisponível.');
    }

    let user;
    try {
      user = await User.findOne({ email });
    } catch (dbErr) {
      throw new ApiError(503, 'Erro de conexão com o banco de dados.');
    }

    if (!user) {
      throw new ApiError(400, 'E-mail ou senha incorretos');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new ApiError(400, 'E-mail ou senha incorretos');
    }

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    next(err);
  }
});

// Get current user
router.get('/me', auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// List all users (admin only)
router.get('/users', auth, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') throw new ApiError(403, 'Acesso negado.');
    const users = await User.find().select('-password').sort({ createdAt: 1 });
    res.json(users);
  } catch (err) {
    next(err);
  }
});

// Promote/change role of a user (admin only)
router.patch('/users/:id/role', auth, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') throw new ApiError(403, 'Apenas admins podem alterar funções.');
    const { role } = req.body;
    if (!['admin', 'hr'].includes(role)) throw new ApiError(400, 'Role inválido. Use: admin ou hr.');
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');
    if (!user) throw new ApiError(404, 'Usuário não encontrado.');
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// Create user (admin only)
router.post('/users', auth, validate(registerSchema), async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') throw new ApiError(403, 'Apenas admins podem criar usuários.');
    const { name, email, password } = req.body;

    if (mongoose.connection.readyState !== 1) {
      throw new ApiError(503, 'Serviço de banco de dados temporariamente indisponível.');
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ApiError(400, 'E-mail já está em uso.');
    }

    // Default role is 'hr' for admin-created users
    const user = new User({ name, email, password, role: 'hr' });
    await user.save();

    res.status(201).json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    });
  } catch (err) {
    next(err);
  }
});

// Delete user (admin only)
router.delete('/users/:id', auth, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') throw new ApiError(403, 'Apenas admins podem deletar usuários.');

    // Prevent self-deletion
    if (req.params.id === req.user.id) {
      throw new ApiError(400, 'Você não pode deletar sua própria conta.');
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) throw new ApiError(404, 'Usuário não encontrado.');

    res.json({ message: 'Usuário deletado com sucesso.', id: req.params.id });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
