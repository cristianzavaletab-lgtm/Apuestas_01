const jwt = require('jsonwebtoken');
const User = require('../modules/auth/user.model');

const JWT_SECRET = process.env.JWT_SECRET || 'premium_betting_secret_2026';

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No autorizado: Falta Token' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    // Support for legacy admin mock from auth.routes
    if (decoded.id === 'admin_id') {
      req.user = { _id: 'admin_id', role: 'admin', plan: 'premium', username: 'Admin' };
      return next();
    }

    let user;
    const dbConfig = require('../../config/db');
    if (dbConfig.isMemoryMode()) {
       const memStore = dbConfig.getMemStore();
       user = memStore.users.get(decoded.id);
    } else {
       user = await User.findById(decoded.id);
    }

    if (!user) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Sesión inválida o expirada' });
  }
};

module.exports = authMiddleware;
