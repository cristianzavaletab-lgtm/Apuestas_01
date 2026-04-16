const express = require('express');
const router = express.Router();
const { OAuth2Client } = require('google-auth-library');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./user.model');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '169815181391-7j8k9g2j9hvb8d2andbqimcq9vfese0q.apps.googleusercontent.com';
const client = new OAuth2Client(GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET || 'premium_betting_secret_2026';

// --- REGISTER ---
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Usuario y contraseña requeridos' });

    const existing = await User.findOne({ username });
    if (existing) return res.status(400).json({ error: 'El usuario ya existe' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();

    const token = jwt.sign({ id: newUser._id, username: newUser.username }, JWT_SECRET, { expiresIn: '7d' });
    return res.status(201).json({ token, user: newUser.username });
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

    const userEntry = await User.findOne({ username });
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

// --- GOOGLE AUTH ---
const authMiddleware = require('../../middleware/authMiddleware');

router.get('/me', authMiddleware, (req, res) => {
  res.json(req.user);
});

const dbConfig = require('../../config/db');

router.post('/google', async (req, res) => {
  try {
     const { token } = req.body;
     const ticket = await client.verifyIdToken({
         idToken: token,
         audience: GOOGLE_CLIENT_ID
     });
     const payload = ticket.getPayload();
     
     let userId;
     let username = payload.email.split('@')[0];

     if (dbConfig.isMemoryMode()) {
         const memStore = dbConfig.getMemStore();
         let memUser = Array.from(memStore.users.values()).find(u => u.googleId === payload.sub);
         if(!memUser) {
             const newId = `usr_${Date.now()}`;
             memUser = { _id: newId, googleId: payload.sub, username, name: payload.name, tokens: 0, plan: 'free' };
             memStore.users.set(newId, memUser);
         }
         userId = memUser._id;
     } else {
         // Buscar o crear usuario en DB
         let userQuery = await User.findOne({ googleId: payload.sub });
         if (!userQuery) {
            userQuery = new User({
                googleId: payload.sub,
                username: username,
                name: payload.name
            });
            await userQuery.save();
         }
         userId = userQuery._id;
         username = userQuery.username;
     }
     
     const appToken = jwt.sign({ id: userId, username: username }, JWT_SECRET, { expiresIn: '7d' });
     return res.json({ token: appToken, user: username });
  } catch(e) {
     console.error("Google Auth Error:", e.message);
     return res.status(401).json({ error: 'Token Inválido o Error Google' });
  }
});

module.exports = router;
