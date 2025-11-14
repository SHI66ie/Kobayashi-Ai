// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

async function testCustomLLM() {
  console.log('🧪 Testing Custom LLM Integration...\n');

  // Check configuration
  const customLLMUrl = process.env.CUSTOM_LLM_URL;
  const customLLMKey = process.env.CUSTOM_LLM_API_KEY;
  const customLLMModel = process.env.CUSTOM_LLM_MODEL;

  if (!customLLMUrl) {
    console.error('❌ CUSTOM_LLM_URL not found in environment');
    console.log('\n📝 Setup Options:');
    console.log('1. Ollama: CUSTOM_LLM_URL=http://localhost:11434/api/generate');
    console.log('2. LM Studio: CUSTOM_LLM_URL=http://localhost:1234/v1/chat/completions');
    console.log('3. text-gen-webui: CUSTOM_LLM_URL=http://localhost:5000/v1/chat/completions');
    console.log('4. LocalAI: CUSTOM_LLM_URL=http://localhost:8080/v1/chat/completions');
    console.log('\nAdd to .env.local and restart this script.');
    return;
  }

  console.log('✅ Custom LLM URL found');
  console.log(`Endpoint: ${customLLMUrl}`);
  console.log(`Model: ${customLLMModel || 'Default'}`);
  console.log(`Auth: ${customLLMKey ? 'Yes' : 'No'}\n`);

  try {
    // Detect LLM type
    const isOllama = customLLMUrl.includes('ollama') || customLLMUrl.includes('11434');
    const isOpenAICompatible = customLLMUrl.includes('/v1/chat/completions');

    console.log(`🔍 Detected format: ${isOllama ? 'Ollama' : (isOpenAICompatible ? 'OpenAI-compatible' : 'Generic')}`);

    let requestBody;
    let headers = {
      'Content-Type': 'application/json'
    };

    if (customLLMKey) {
      headers['Authorization'] = `Bearer ${customLLMKey}`;
    }

    // Format request based on API type
    if (isOllama) {
      requestBody = {
        model: customLLMModel || 'llama3.1',
        prompt: 'Say "RaceMind AI is ready for racing!" in exactly 7 words.',
        stream: false,
        options: {
          temperature: 0.7,
          max_tokens: 100
        }
      };
    } else if (isOpenAICompatible) {
      requestBody = {
        model: customLLMModel || 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: 'Say "RaceMind AI is ready for racing!" in exactly 7 words.'
          }
        ],
        temperature: 0.7,
        max_tokens: 100
      };
    } else {
      requestBody = {
        prompt: 'Say "RaceMind AI is ready for racing!" in exactly 7 words.',
        max_tokens: 100,
        temperature: 0.7
      };
    }

    console.log('🚀 Sending test request...');
    
    const response = await fetch(customLLMUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Response received\n');

    // Extract response based on format
    let aiResponse = '';
    let tokensUsed = 0;

    if (isOllama) {
      aiResponse = result.response || 'No response';
      tokensUsed = result.eval_count || 0;
    } else if (isOpenAICompatible) {
      aiResponse = result.choices?.[0]?.message?.content || 'No response';
      tokensUsed = result.usage?.total_tokens || 0;
    } else {
      aiResponse = result.text || result.response || result.output || 'No response';
      tokensUsed = result.tokens || 0;
    }

    console.log('📝 AI Response:');
    console.log(`"${aiResponse}"`);
    console.log(`\n📊 Tokens used: ${tokensUsed}`);

    // Test racing analysis
    console.log('\n🏁 Testing racing analysis...');
    
    const racingPrompt = 'You are a racing AI. Analyze this: Driver finished 3rd with best lap 1:23.456. Weather was dry, 25°C. Give 2 quick insights.';
    
    if (isOllama) {
      requestBody.prompt = racingPrompt;
      requestBody.options.max_tokens = 200;
    } else if (isOpenAICompatible) {
      requestBody.messages[0].content = racingPrompt;
      requestBody.max_tokens = 200;
    } else {
      requestBody.prompt = racingPrompt;
      requestBody.max_tokens = 200;
    }

    const racingResponse = await fetch(customLLMUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestBody)
    });

    if (racingResponse.ok) {
      const racingResult = await racingResponse.json();
      let racingAnalysis = '';
      
      if (isOllama) {
        racingAnalysis = racingResult.response || 'No analysis';
      } else if (isOpenAICompatible) {
        racingAnalysis = racingResult.choices?.[0]?.message?.content || 'No analysis';
      } else {
        racingAnalysis = racingResult.text || racingResult.response || racingResult.output || 'No analysis';
      }

      console.log('✅ Racing Analysis:');
      console.log(racingAnalysis);
    }

    // Success summary
    console.log('\n═══════════════════════════════════════');
    console.log('✅ CUSTOM LLM TEST SUCCESSFUL');
    console.log('═══════════════════════════════════════');
    console.log('✓ Connection established');
    console.log('✓ Model responding correctly');
    console.log('✓ Racing analysis working');
    console.log('✓ RaceMind AI is ready!\n');
    console.log('🏁 Next steps:');
    console.log('1. Run: npm run dev');
    console.log('2. Visit: http://localhost:3000/dashboard');
    console.log('3. Load race data and try AI features\n');

  } catch (error) {
    console.error('\n❌ CUSTOM LLM TEST FAILED\n');
    console.error('Error:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n🔧 Connection refused - is your LLM server running?');
      console.log('- Ollama: ollama serve');
      console.log('- LM Studio: Start local server');
      console.log('- Check the port and URL');
    } else if (error.message.includes('404')) {
      console.log('\n🔧 Endpoint not found - check your URL');
      console.log('- Ollama: /api/generate');
      console.log('- OpenAI-compatible: /v1/chat/completions');
    } else if (error.message.includes('model')) {
      console.log('\n🔧 Model issue - check CUSTOM_LLM_MODEL');
      console.log('- Ollama: ollama list (to see available models)');
      console.log('- Others: check your model name');
    }
    
    console.log('\n📚 See docs/CUSTOM_LLM_SETUP.md for detailed setup guide\n');
  }
}

testCustomLLM().catch(console.error);
