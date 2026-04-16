const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testTheOddsAPI() {
  const apiKey = 'a5e0b7795a01b699076276812b1b624c';
  // Try to list sports to see if it works
  const url = `https://api.the-odds-api.com/v4/sports/?apiKey=${apiKey}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log('The Odds API Response Status:', response.status);
    if (response.status === 200) {
      console.log('Success! Found', data.length, 'sports.');
    } else {
      console.log('Error Data:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testTheOddsAPI();
