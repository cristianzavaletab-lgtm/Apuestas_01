const Payment = require('./payment.model');
const logger = require('../../utils/logger');
const dbConfig = require('../../config/db');

async function uploadPayment(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Falta el archivo del comprobante' });
    }

    const { amount } = req.body;
    let newPayment;

    if (dbConfig.isMemoryMode()) {
       const memStore = dbConfig.getMemStore();
       
       // Validación de pagos duplicados pendientes en Memoria
       const existingPending = Array.from(memStore.payments.values()).find(p => 
          p.userId === req.user._id && p.status === 'pending'
       );
       
       if (existingPending) {
         return res.status(400).json({ 
           error: 'Ya tienes un pago en validación. Por favor espera a que sea procesado.' 
         });
       }

       const paymentId = `pay_${Date.now()}`;
       newPayment = {
         _id: paymentId,
         userId: req.user._id,
         username: req.user.username || "usuario",
         email: req.user.email || "sin-email",
         screenshotUrl: `/uploads/${req.file.filename}`,
         status: 'pending',
         createdAt: new Date()
       };

       memStore.payments.set(paymentId, newPayment);
       dbConfig.saveMemDb();
    } else {
       // Validación de pagos duplicados pendientes en DB
       const existingPending = await Payment.findOne({ 
         userId: req.user._id, 
         status: 'pending' 
       });
       
       if (existingPending) {
         return res.status(400).json({ 
           error: 'Ya tienes un pago en validación. Por favor espera a que sea procesado.' 
         });
       }

       newPayment = new Payment({
         userId: req.user._id,
         username: req.user.username || req.user.name || "usuario",
         email: req.user.email || "sin-email",
         screenshotUrl: `/uploads/${req.file.filename}`,
         status: 'pending'
       });
       await newPayment.save();
    }

    // Real-time notification for Admin
    const io = req.app.get('io');
    if (io) io.emit('admin:update');

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
    if (dbConfig.isMemoryMode()) {
       const memStore = dbConfig.getMemStore();
       const payments = Array.from(memStore.payments.values())
         .filter(p => p.userId === req.user._id)
         .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
       return res.json(payments);
    }
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
