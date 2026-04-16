const Payment = require('../payments/payment.model');
const User = require('../auth/user.model');
const logger = require('../../utils/logger');
const dbConfig = require('../../config/db');
const { getGlobalApiTokens } = require('../ingestion/ingestion.service');

async function getPendingPayments(req, res) {
  try {
    if (dbConfig.isMemoryMode()) {
       const memStore = dbConfig.getMemStore();
       const payments = Array.from(memStore.payments.values())
         .filter(p => p.status === 'pending')
         .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
       return res.json(payments);
    }
    const payments = await Payment.find({ status: 'pending' })
      .populate('userId', 'username email')
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener pagos pendientes' });
  }
}

async function approvePayment(req, res) {
  try {
    const { id } = req.params;
    let payment;
    let user;

    if (dbConfig.isMemoryMode()) {
       const memStore = dbConfig.getMemStore();
       payment = memStore.payments.get(id);
       if (!payment) return res.status(404).json({ error: 'Pago no encontrado' });
       if (payment.status !== 'pending') return res.status(400).json({ error: 'El pago ya fue procesado' });

       payment.status = 'approved';
       payment.approvedAt = new Date();
       
       // Sync back to memory
       memStore.payments.set(id, payment);

       user = Array.from(memStore.users.values()).find(u => u._id === payment.userId || u.username === payment.username);
       if (user) {
         user.tokens = (user.tokens || 0) + 50;
         memStore.users.set(user._id, user);
       }
       dbConfig.saveMemDb();
    } else {
       payment = await Payment.findById(id);
       if (!payment) return res.status(404).json({ error: 'Pago no encontrado' });
       if (payment.status !== 'pending') return res.status(400).json({ error: 'El pago ya fue procesado' });

       payment.status = 'approved';
       payment.approvedAt = new Date();
       await payment.save();

       user = await User.findById(payment.userId);
       if (user) {
         user.tokens = (user.tokens || 0) + 50;
         await user.save();
       }
    }

    // Emitir evento para actualizar UI del admin (Real-time)
    const io = req.app.get('io');
    if(io) io.emit('admin:update');

    res.json({ message: 'Pago aprobado y 50 tokens añadidos', tokensAgregados: 50 });
  } catch (error) {
    logger.error('Error approving payment:', error);
    res.status(500).json({ error: 'Error al aprobar el pago' });
  }
}

async function rejectPayment(req, res) {
  try {
    const { id } = req.params;
    if (dbConfig.isMemoryMode()) {
       const memStore = dbConfig.getMemStore();
       const payment = memStore.payments.get(id);
       if (!payment) return res.status(404).json({ error: 'Pago no encontrado' });
       payment.status = 'rejected';
       memStore.payments.set(id, payment);
       dbConfig.saveMemDb();
    } else {
       const payment = await Payment.findById(id);
       if (!payment) return res.status(404).json({ error: 'Pago no encontrado' });
       payment.status = 'rejected';
       await payment.save();
    }
    
    const io = req.app.get('io');
    if(io) io.emit('admin:update');

    res.json({ message: 'Pago rechazado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al rechazar el pago' });
  }
}

async function getApiStats(req, res) {
  try {
    const tokens = getGlobalApiTokens();
    res.json({ rapidApiTokensRemaining: tokens });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener estadisticas de API' });
  }
}

async function getUsers(req, res) {
  try {
    if (dbConfig.isMemoryMode()) {
       const memStore = dbConfig.getMemStore();
       const users = Array.from(memStore.users.values())
         .sort((a, b) => (b._id > a._id ? 1 : -1));
       return res.json(users);
    }
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
}

async function addTokensToUser(req, res) {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    if (dbConfig.isMemoryMode()) {
       const memStore = dbConfig.getMemStore();
       const user = memStore.users.get(id);
       if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
       user.tokens = (user.tokens || 0) + Number(amount);
       memStore.users.set(id, user);
       dbConfig.saveMemDb();
       res.json({ message: 'Tokens actualizados (Memoria)', tokens: user.tokens });
    } else {
       const user = await User.findById(id);
       if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
       user.tokens = (user.tokens || 0) + Number(amount);
       await user.save();
       res.json({ message: 'Tokens actualizados', tokens: user.tokens });
    }
    
    const io = req.app.get('io');
    if(io) io.emit('admin:update');

  } catch (error) {
    logger.error('Error al añadir tokens:', error);
    res.status(500).json({ error: 'Error interno al actualizar tokens' });
  }
}

module.exports = {
  getPendingPayments,
  approvePayment,
  rejectPayment,
  getApiStats,
  getUsers,
  addTokensToUser
};
