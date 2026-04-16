// src/modules/matches/match.routes.js
const express = require('express');
const router = express.Router();
const controller = require('./match.controller');

router.get('/', controller.getAllActiveMatches);
router.get('/live', controller.getLiveMatches);
router.get('/active', controller.getAllActiveMatches);
router.get('/:id', controller.getMatchDetails);

module.exports = router;
