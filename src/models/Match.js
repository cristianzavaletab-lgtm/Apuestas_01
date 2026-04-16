const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  externalId: { type: String, required: true, unique: true },
  homeTeam: { type: String, required: true },
  awayTeam: { type: String, required: true },
  league: { type: String },
  commenceTime: { type: Date, required: true },
  status: { type: String, required: true, enum: ['scheduled', 'live', 'completed'] },
  score: {
    home: { type: Number, default: 0 },
    away: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  odds: {
    homeMoneyline: Number,
    awayMoneyline: Number,
    homeSpread: Number,
    homeSpreadPrice: Number,
    awaySpread: Number,
    awaySpreadPrice: Number,
    overUnder: Number,
    overPrice: Number,
    underPrice: Number
  },
  stats: {
    // Add stats if API supports it later
  },
  lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Match', matchSchema);
