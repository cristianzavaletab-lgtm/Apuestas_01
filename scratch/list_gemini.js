const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: './.env' });

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  try {
    const modelList = await genAI.listModels();
    console.log('Available Models:');
    modelList.models.forEach(m => console.log(m.name, m.supportedGenerationMethods));
  } catch (e) {
    console.error('Error listing models:', e.message);
  }
}

listModels();
