// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    console.log('🔍 Listing available Gemini models...\n');
    
    // Try to list models
    const models = await genAI.listModels();
    
    console.log('Available models:');
    models.forEach(model => {
      console.log(`- ${model.name}`);
      console.log(`  Display Name: ${model.displayName}`);
      console.log(`  Supported Methods: ${model.supportedGenerationMethods?.join(', ')}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error listing models:', error.message);
    
    // Try with a known working model
    console.log('\n🧪 Testing with gemini-1.5-flash...');
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      const result = await model.generateContent('Hello, world!');
      console.log('✅ gemini-1.5-flash works!');
      console.log('Response:', result.response.text());
      
    } catch (flashError) {
      console.log('❌ gemini-1.5-flash failed:', flashError.message);
      
      // Try gemini-pro
      console.log('\n🧪 Testing with gemini-pro...');
      try {
        const model2 = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const result2 = await model2.generateContent('Hello, world!');
        console.log('✅ gemini-pro works!');
        console.log('Response:', result2.response.text());
      } catch (proError) {
        console.log('❌ gemini-pro failed:', proError.message);
      }
    }
  }
}

listModels().catch(console.error);
