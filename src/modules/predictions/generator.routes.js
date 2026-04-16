const express = require('express');
const router = express.Router();
const generatorController = require('./generator.controller');

const authMiddleware = require('../../middleware/authMiddleware');
const accessControl = require('../../middleware/accessControl');

router.post('/', authMiddleware, accessControl, generatorController.generatePicks);
router.get('/usage', authMiddleware, generatorController.getUsageStats);

module.exports = router;
