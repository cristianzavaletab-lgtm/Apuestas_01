const express = require('express');
const router = express.Router();
let predictions = [];

router.get('/predictions', (req, res) => {
  res.json(predictions);
});

router.post('/predictions', (req, res) => {
  try {
    const prediction = req.body;
    console.log('Nueva predicción:', prediction);
    predictions.push(prediction);
    const io = req.app.get('io');
    io.emit('newPrediction', prediction);
    res.status(201).json(prediction);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al guardar la predicción' });
  }
});

module.exports = router;