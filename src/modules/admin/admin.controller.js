const Payment = require('../payments/payment.model');
const User = require('../auth/user.model');
const logger = require('../../utils/logger');
const { getGlobalApiTokens } = require('../ingestion/ingestion.service');

async function getPendingPayments(req, res) {
  try {
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
    const payment = await Payment.findById(id);

    if (!payment) return res.status(404).json({ error: 'Pago no encontrado' });
    if (payment.status !== 'pending') return res.status(400).json({ error: 'El pago ya fue procesado' });

    // 1. Marcar pago como aprobado
    payment.status = 'approved';
    payment.approvedAt = new Date();
    await payment.save();

    // 2. Dar 50 Tokens al usuario
    const user = await User.findById(payment.userId);
    if (user) {
      user.tokens = (user.tokens || 0) + 50;
      await user.save();
    }

    res.json({ message: 'Pago aprobado y 50 tokens añadidos', tokensAgregados: 50 });
  } catch (error) {
    logger.error('Error approving payment:', error);
    res.status(500).json({ error: 'Error al aprobar el pago' });
  }
}

async function rejectPayment(req, res) {
  try {
    const { id } = req.params;
    const payment = await Payment.findById(id);

    if (!payment) return res.status(404).json({ error: 'Pago no encontrado' });

    payment.status = 'rejected';
    await payment.save();

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
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    
    user.tokens = (user.tokens || 0) + Number(amount);
    await user.save();
    
    res.json({ message: 'Tokens actualizados', tokens: user.tokens });
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
