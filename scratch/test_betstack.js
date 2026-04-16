const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testBetStack() {
  const apiKey = '071b39436fc5cbd768a920368538e38be90f5bace8891f74cc7f880c1b2721a1';
  const url = `https://api.betstack.dev/api/v1/events?api_key=${apiKey}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log('BetStack Response Status:', response.status);
    console.log('Events Found:', data.length);
    if (data.length > 0) {
      console.log('Sample Event:', JSON.stringify(data[0], null, 2));
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testBetStack();
