const Payment = require('./payment.model');
const logger = require('../../utils/logger');

async function uploadPayment(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Falta el archivo del comprobante' });
    }

    // Validación de pagos duplicados pendientes
    const existingPending = await Payment.findOne({ 
      userId: req.user._id, 
      status: 'pending' 
    });
    
    if (existingPending) {
      return res.status(400).json({ 
        error: 'Ya tienes un pago en validación. Por favor espera a que sea procesado.' 
      });
    }

    const { amount } = req.body;
    const newPayment = new Payment({
      userId: req.user._id,
      username: req.user.username || req.user.name || "usuario",
      email: req.user.email || "sin-email",
      screenshotUrl: `/uploads/${req.file.filename}`,
      status: 'pending'
    });

    await newPayment.save();

    res.status(201).json({
      message: 'Comprobante subido exitosamente. Un administrador lo validará pronto.',
      paymentId: newPayment._id
    });
  } catch (error) {
    logger.error('Error uploading payment:', error);
    res.status(500).json({ error: 'Error al procesar la subida del pago' });
  }
}

async function getMyPayments(req, res) {
  try {
    const payments = await Payment.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener historial de pagos' });
  }
}

module.exports = {
  uploadPayment,
  getMyPayments
};
