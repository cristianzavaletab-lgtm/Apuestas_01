const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./user.model');
const dbConfig = require('../../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'premium_betting_secret_2026';

// --- REGISTER ---
router.post('/register', async (req, res) => {
  try {
    const { username, password, nombre, apellido, dni, fechaNacimiento } = req.body;
    if (!username || !password || !nombre || !apellido || !dni || !fechaNacimiento) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    // Validación DNI (Estrictamente 8 dígitos para Perú)
    const dniRegex = /^\d{8}$/;
    if (!dniRegex.test(dni)) {
      return res.status(400).json({ error: 'El DNI debe tener exactamente 8 dígitos numéricos' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    let userId;

    if (dbConfig.isMemoryMode()) {
      const memStore = dbConfig.getMemStore();
      const exists = Array.from(memStore.users.values()).find(u => u.username === username || u.dni === dni);
      if (exists) return res.status(400).json({ error: 'El usuario o DNI ya existe' });
      
      const newId = `usr_${Date.now()}`;
      const memUser = { _id: newId, username, password: hashedPassword, nombre, apellido, dni, fechaNacimiento, role: 'user', tokens: 10 };
      memStore.users.set(newId, memUser);
      userId = newId;
    } else {
      const existing = await User.findOne({ $or: [{ username }, { dni }] });
      if (existing) return res.status(400).json({ error: 'El usuario o DNI ya existe' });
      
      const newUser = new User({ username, password: hashedPassword, nombre, apellido, dni, fechaNacimiento });
      await newUser.save();
      userId = newUser._id;
    }

    const token = jwt.sign({ id: userId, username }, JWT_SECRET, { expiresIn: '7d' });
    return res.status(201).json({ token, user: username });
  } catch (error) {
    console.error("Register Error:", error);
    return res.status(500).json({ error: 'Error interno de servidor al registrar' });
  }
});

// --- LOGIN (DB + Fallback) ---
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Fallback original para admins
    if (username === 'admin' && password === 'admin123') {
       const token = jwt.sign({ id: 'admin_id', role: 'admin' }, JWT_SECRET, { expiresIn: '1d' });
       return res.json({ token, user: 'Admin' });
    }

    let userEntry;
    if (dbConfig.isMemoryMode()) {
       const memStore = dbConfig.getMemStore();
       userEntry = Array.from(memStore.users.values()).find(u => u.username === username || u.dni === username);
    } else {
       userEntry = await User.findOne({ $or: [{ username }, { dni: username }] });
    }

    if (!userEntry || !userEntry.password) {
       return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const isMatch = await bcrypt.compare(password, userEntry.password);
    if (!isMatch) return res.status(401).json({ error: 'Credenciales inválidas' });

    const token = jwt.sign({ id: userEntry._id, username: userEntry.username }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({ token, user: userEntry.username });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({ error: 'Error interno del servidor 500' });
  }
});

const authMiddleware = require('../../middleware/authMiddleware');

router.get('/me', authMiddleware, (req, res) => {
  res.json(req.user);
});

module.exports = router;
