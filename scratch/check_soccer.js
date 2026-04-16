const axios = require('axios');
require('dotenv').config({ path: './.env' });

async function checkSoccer() {
  const apiKey = process.env.SPORTS_API_KEY;
  console.log('Using API Key:', apiKey ? 'FOUND' : 'MISSING');
  
  const url = `https://api.the-odds-api.com/v4/sports/soccer/odds`;
  
  try {
    const response = await axios.get(url, {
      params: {
        regions: "eu,us",
        markets: "h2h",
        oddsFormat: "decimal",
        apiKey: apiKey
      }
    });
    
    console.log('Total Soccer Events Found:', response.data.length);
    if (response.data.length > 0) {
      console.log('Sample Event Structure:');
      console.log(JSON.stringify(response.data[0], null, 2));
      
      const dates = response.data.map(e => e.commence_time.split('T')[0]);
      const uniqueDates = [...new Set(dates)];
      console.log('Dates Available:', uniqueDates);
      
      const leagues = response.data.map(e => e.sport_title);
      const uniqueLeagues = [...new Set(leagues)];
      console.log('Leagues Available:', uniqueLeagues);
    }
  } catch (e) {
    console.error('Error fetching:', e.response ? e.response.data : e.message);
  }
}

checkSoccer();
