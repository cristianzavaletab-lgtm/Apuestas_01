// src/modules/matches/match.controller.js
const dbConfig = require('../../config/db');
const Match = require('../../models/Match');

async function getLiveMatches(req, res) {
  try {
    let matches;
    if (dbConfig.isMemoryMode()) {
      matches = Array.from(dbConfig.getMemStore().matches.values()).filter(m => m.status === 'live');
    } else {
      matches = await Match.find({ status: 'live' }).sort({ commenceTime: 1 });
    }
    res.json(matches);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve matches' });
  }
}

async function getAllActiveMatches(req, res) {
  try {
    let matches;
    if (dbConfig.isMemoryMode()) {
      matches = Array.from(dbConfig.getMemStore().matches.values());
    } else {
      matches = await Match.find({ status: { $in: ['live', 'scheduled'] } }).sort({ commenceTime: 1 });
    }
    res.json(matches);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve active matches' });
  }
}

async function getMatchDetails(req, res) {
  try {
    let match;
    const { id } = req.params;
    if (dbConfig.isMemoryMode()) {
      match = dbConfig.getMemStore().matches.get(id);
    } else {
      match = await Match.findOne({ externalId: id });
    }
    
    if (!match) return res.status(404).json({ error: 'Match not found' });
    res.json(match);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve match details' });
  }
}

module.exports = { getLiveMatches, getAllActiveMatches, getMatchDetails };
