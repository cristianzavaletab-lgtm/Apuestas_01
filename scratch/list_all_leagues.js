const axios = require('axios');
require('dotenv').config({ path: './.env' });

async function listAllSoccerSports() {
  const apiKey = process.env.SPORTS_API_KEY;
  const url = `https://api.the-odds-api.com/v4/sports/?apiKey=${apiKey}`;
  
  try {
    const response = await axios.get(url);
    const soccerSports = response.data.filter(s => s.group === 'Soccer');
    console.log(JSON.stringify(soccerSports, null, 2));
  } catch (e) {
    console.error('Error fetching sports:', e.message);
  }
}

listAllSoccerSports();
