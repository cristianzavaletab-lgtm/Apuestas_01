const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require('dotenv').config({ path: './.env' });

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log('Available Models:');
    if (data.models) {
      data.models.forEach(m => console.log(m.name));
    } else {
      console.log('Error Data:', JSON.stringify(data, null, 2));
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
}

listModels();
