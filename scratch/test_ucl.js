const axios = require('axios');

async function testUCL() {
    console.log('🚀 Iniciando Prueba de Generación - UEFA Champions League');
    try {
        const response = await axios.post('http://localhost:3000/api/generate-picks', {
            date: new Date().toISOString().split('T')[0],
            leagues: ["Champions League"]
        });
        
        console.log('✅ Respuesta Recibida:', response.status);
        console.log('Partidos Encontrados:', response.data.matches_found);
        console.log('Picks Generados:', response.data.picks_generated);
        
        if (response.data.picks && response.data.picks.length > 0) {
            console.log('\n--- DETALLE DE PICKS ---');
            response.data.picks.forEach((p, i) => {
                console.log(`\nPick #${i + 1}: ${p.homeTeam} vs ${p.awayTeam}`);
                console.log(`Elección: ${p.pick} (${(p.confidence * 100).toFixed(1)}% confianza)`);
                console.log(`Razonamiento IA: ${p.reasoning}`);
            });
        } else {
            console.log('\n⚠️ No se generaron picks para los criterios seleccionados.');
        }
    } catch (error) {
        console.error('❌ Error en la prueba:', error.response ? error.response.data : error.message);
    }
}

testUCL();
