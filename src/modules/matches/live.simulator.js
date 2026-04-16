const logger = require('../../utils/logger');
const dbConfig = require('../../config/db');
const Match = require('../../models/Match');

class LiveSimulator {
  constructor() {
    this.io = null;
    this.intervalId = null;
  }

  start(io) {
    this.io = io;
    logger.info('⚽ iniciando Live Simulator (Motor de Simulación en Tiempo Real)...');
    
    // Ejecutar cada 10 segundos
    this.intervalId = setInterval(() => this.simulateCycle(), 10000);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  async simulateCycle() {
    try {
      let liveMatches = [];

      if (dbConfig.isMemoryMode()) {
        const store = dbConfig.getMemStore();
        if (!store.matches) return;
        liveMatches = Array.from(store.matches.values()).filter(m => m.status === 'scheduled' || m.status === 'live');
        
        liveMatches.forEach(match => {
            if (match.status === 'scheduled') {
                match.status = 'live';
                match.liveState = { minute: 1, homeScore: 0, awayScore: 0, homeCorners: 0, awayCorners: 0, possession: '50-50' };
            } else if (match.status === 'live') {
                // Avanzar minuto
                match.liveState.minute += 2; // acelerado
                
                // Simulación probabilística de eventos
                const rand = Math.random();
                if (rand > 0.95) match.liveState.homeScore += 1;
                else if (rand > 0.90) match.liveState.awayScore += 1;
                
                if (rand > 0.8) match.liveState.homeCorners += 1;
                else if (rand > 0.7) match.liveState.awayCorners += 1;

                match.liveState.possession = (Math.floor(Math.random() * 40) + 30) + '-' + (Math.floor(Math.random() * 40) + 30);

                if (match.liveState.minute >= 90) {
                    match.status = 'finished';
                }
            }
            store.matches.set(match.externalId, match);
        });

      } else {
        // Modo MongoDB
        liveMatches = await Match.find({ status: { $in: ['scheduled', 'live'] } });
        
        const bulkOps = liveMatches.map(match => {
            let update = {};
            if (match.status === 'scheduled') {
                update = { status: 'live', liveState: { minute: 1, homeScore: 0, awayScore: 0, homeCorners: 0, awayCorners: 0, possession: '50-50' }};
            } else {
                let m = match.liveState || { minute: 1, homeScore: 0, awayScore: 0, homeCorners: 0, awayCorners: 0 };
                m.minute += 2;
                const rand = Math.random();
                if (rand > 0.95) m.homeScore += 1;
                else if (rand > 0.90) m.awayScore += 1;
                if (rand > 0.8) m.homeCorners += 1;
                else if (rand > 0.7) m.awayCorners += 1;
                
                if (m.minute >= 90) update.status = 'finished';
                update.liveState = m;
            }
            return {
                updateOne: {
                    filter: { _id: match._id },
                    update: { $set: update }
                }
            };
        });

        if (bulkOps.length > 0) {
             await Match.bulkWrite(bulkOps);
             liveMatches = await Match.find({ status: 'live' });
        }
      }

      // Emitir Snapshot en vivo
      if (this.io && liveMatches.length > 0) {
         this.io.emit('liveMatchesUpdate', liveMatches.filter(m => m.status === 'live'));
      }

    } catch (err) {
       logger.error('Error in Live Simulator cycle:', err.message);
    }
  }
}

module.exports = new LiveSimulator();
