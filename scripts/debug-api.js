// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const { GoogleGenerativeAI } = require('@google/generative-ai');

async function debugAPI() {
  console.log('🔍 Debugging Gemini API Setup...\n');

  // Check API key format
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('❌ No API key found');
    return;
  }

  console.log('✅ API key found');
  console.log(`Key format: ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`);
  console.log(`Key length: ${apiKey.length} characters`);
  
  // Check if it looks like a valid Google API key
  if (!apiKey.startsWith('AIzaSy')) {
    console.log('⚠️  Warning: API key doesn\'t start with "AIzaSy" - this might not be a valid Google API key');
  } else {
    console.log('✅ API key format looks correct');
  }

  console.log('\n🔧 Troubleshooting Steps:');
  console.log('1. Verify your API key is from: https://makersuite.google.com/app/apikey');
  console.log('2. Make sure you\'ve enabled the "Generative Language API"');
  console.log('3. Check if your region supports Gemini API');
  console.log('4. Ensure billing is enabled (even for free tier)');
  
  console.log('\n📋 Next Steps:');
  console.log('1. Visit: https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com');
  console.log('2. Click "Enable" if not already enabled');
  console.log('3. Visit: https://console.cloud.google.com/billing');
  console.log('4. Ensure billing account is linked (required even for free usage)');
  
  console.log('\n🔄 Alternative: Try OpenAI instead');
  console.log('Add to .env.local:');
  console.log('OPENAI_API_KEY=sk-your-openai-key-here');
  console.log('Get key from: https://platform.openai.com/api-keys');
}

debugAPI().catch(console.error);
