// src/modules/predictions/prediction.routes.js
const express = require('express');
const router = express.Router();
const { getActivePredictions } = require('./prediction.service');
const dbConfig = require('../../config/db');
const Prediction = require('../../models/Prediction');

router.get('/', async (req, res) => {
  try {
    const preds = await getActivePredictions();
    res.json(preds);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve predictions' });
  }
});

router.get('/:matchId', async (req, res) => {
  try {
    const { matchId } = req.params;
    let pred;
    if (dbConfig.isMemoryMode()) {
      pred = dbConfig.getMemStore().predictions.get(matchId);
    } else {
      pred = await Prediction.findOne({ matchId });
    }
    if (!pred) return res.status(404).json({ error: 'Prediction not found for match' });
    res.json(pred);
  } catch (err) {
    res.status(500).json({ error: 'Failed' });
  }
});

module.exports = router;
