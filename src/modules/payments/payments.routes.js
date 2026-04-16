const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const paymentsController = require('./payments.controller');
const authMiddleware = require('../../middleware/authMiddleware');

// Multer Storage Config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// All payment routes require auth
router.use(authMiddleware);

router.post('/upload', upload.single('screenshot'), paymentsController.uploadPayment);
router.get('/my', paymentsController.getMyPayments);

module.exports = router;
