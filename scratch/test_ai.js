const axios = require('axios');

async function testGeneration() {
  try {
    console.log('Testing AI Pick Generation...');
    const response = await axios.post('http://localhost:3000/api/generate-picks', {
      date: new Date().toISOString().split('T')[0],
      leagues: ["Champions League", "League 1", "Saudi Pro League"]
    });
    
    console.log('Response Status:', response.status);
    console.log('Matches Found:', response.data.matches.length);
    console.log('Picks Generated:', response.data.picks.length);
    
    if (response.data.picks.length > 0) {
      console.log('First Pick AI Reasoning:', response.data.picks[0].reasoning);
    }
  } catch (error) {
    console.error('Error during test:', error.response ? error.response.data : error.message);
  }
}

testGeneration();
