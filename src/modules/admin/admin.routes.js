const express = require('express');
const router = express.Router();
const adminController = require('./admin.controller');
const authMiddleware = require('../../middleware/authMiddleware');
const { requireAdmin } = require('../../middleware/roleMiddleware');

// All admin routes require auth AND admin role
router.use(authMiddleware, requireAdmin);

router.get('/payments', adminController.getPendingPayments);
router.post('/payments/:id/approve', adminController.approvePayment);
router.post('/payments/:id/reject', adminController.rejectPayment);
router.get('/apistats', adminController.getApiStats);
router.get('/users', adminController.getUsers);

module.exports = router;
