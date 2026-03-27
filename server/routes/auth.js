const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { auth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { loginSchema, registerSchema } = require('../schemas/authSchema');
const { ApiError } = require('../middleware/errorMiddleware');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_desligest';

// Register User
router.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    
    let user = await User.findOne({ email });
    if (user) {
      throw new ApiError(400, 'Usuário já existe. Faça login.');
    }

    user = new User({ name, email, password });
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
router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
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

module.exports = router;
