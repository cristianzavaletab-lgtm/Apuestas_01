// src/modules/combos/combo.routes.js
const express = require('express');
const router = express.Router();
const { getActiveCombos } = require('./combo.service');

router.get('/', async (req, res) => {
  try {
    const combos = await getActiveCombos();
    res.json(combos);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve combos' });
  }
});

module.exports = router;
