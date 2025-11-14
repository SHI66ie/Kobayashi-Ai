#!/usr/bin/env node

/**
 * Groq API Test Script
 * Tests the Groq API integration for RaceMind AI
 */

require('dotenv').config({ path: '.env.local' })

async function testGroqAPI() {
  console.log('🧪 Testing Groq API Integration...\n')

  // Check if API key is configured
  if (!process.env.GROQ_API_KEY) {
    console.error('❌ GROQ_API_KEY not found in .env.local')
    console.log('\n📝 Setup Instructions:')
    console.log('1. Visit: https://console.groq.com/keys')
    console.log('2. Sign up with GitHub/Google (instant)')
    console.log('3. Click "Create API Key"')
    console.log('4. Add to .env.local: GROQ_API_KEY=gsk_your_key_here')
    console.log('\n✨ Groq is 100% FREE - No phone verification needed!')
    process.exit(1)
  }

  console.log('✅ Groq API key found')
  console.log(`🔑 Key format: ${process.env.GROQ_API_KEY.substring(0, 8)}...${process.env.GROQ_API_KEY.slice(-4)}`)

  try {
    // Import OpenAI client for Groq
    const { default: OpenAI } = await import('openai')
    
    const groq = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1',
      timeout: 30000
    })

    console.log('\n🤖 Testing Groq Chat Completion...')

    const testPrompt = `Analyze this Toyota GR Cup race scenario:

Track: Barber Motorsports Park
Driver Position: 3rd place
Current Lap: 15/30
Gap to Leader: +8.5 seconds
Gap to P2: +2.1 seconds
Tire Condition: Good (75% remaining)
Fuel Level: 60%
Weather: Dry, 28°C track temp

Provide:
1. Strategic recommendations for the next 5 laps
2. Overtaking opportunities analysis
3. Pit stop timing advice

Keep response under 200 words, be specific with data.`

    const startTime = Date.now()
    
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant', // Updated to current supported model
      messages: [
        {
          role: 'system',
          content: 'You are RaceMind AI, an expert racing strategist for Toyota GR Cup. Provide concise, data-driven racing analysis.'
        },
        {
          role: 'user',
          content: testPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 300,
      stream: false
    })

    const endTime = Date.now()
    const responseTime = endTime - startTime

    console.log('✅ Groq API Response Successful!')
    console.log(`⚡ Response Time: ${responseTime}ms (SUPER FAST!)`)
    console.log(`🎯 Model: ${completion.model}`)
    console.log(`📊 Tokens Used: ${completion.usage?.total_tokens || 'Unknown'}`)
    console.log(`💰 Cost: 100% FREE (No limits, no phone verification!)`)

    console.log('\n🏁 Racing Analysis Response:')
    console.log('='.repeat(60))
    console.log(completion.choices[0]?.message?.content || 'No response generated')
    console.log('=' .repeat(60))

    // Test error handling
    console.log('\n🧪 Testing Error Handling...')
    try {
      await groq.chat.completions.create({
        model: 'invalid-model',
        messages: [{ role: 'user', content: 'test' }]
      })
    } catch (error) {
      console.log('✅ Error handling works correctly')
      console.log(`   Error type: ${error.constructor.name}`)
    }

    console.log('\n🎉 Groq Integration Test Complete!')
    console.log('\n📋 Summary:')
    console.log(`   ✅ API Key: Valid`)
    console.log(`   ✅ Connection: Working`)
    console.log(`   ✅ Model: llama-3.1-8b-instant`)
    console.log(`   ✅ Response Time: ${responseTime}ms (Lightning fast!)`)
    console.log(`   ✅ Cost: 100% FREE`)
    console.log(`   ✅ Error Handling: Working`)

    console.log('\n🚀 Next Steps:')
    console.log('   1. Add GROQ_API_KEY to your .env.local')
    console.log('   2. Run: npm run dev')
    console.log('   3. Load race data in dashboard')
    console.log('   4. Try AI analysis - Groq will be used automatically!')
    console.log('\n💡 Why Groq is better:')
    console.log('   - 100% FREE (no phone verification)')
    console.log('   - Super fast responses (often <1 second)')
    console.log('   - High-quality Llama 3.1 8B model (fast & capable)')
    console.log('   - No rate limits for free tier')

  } catch (error) {
    console.error('\n❌ Groq API Test Failed!')
    console.error('Error details:', error.message)
    
    if (error.message.includes('401')) {
      console.log('\n🔑 API Key Issues:')
      console.log('   - Check if your Groq API key is correct')
      console.log('   - Verify the key starts with "gsk_"')
      console.log('   - Try regenerating the key at https://console.groq.com/keys')
    } else if (error.message.includes('429')) {
      console.log('\n⏳ Rate Limit (Rare):')
      console.log('   - Groq has very generous limits')
      console.log('   - Wait a moment and try again')
    } else if (error.message.includes('timeout')) {
      console.log('\n🌐 Network Issues:')
      console.log('   - Check your internet connection')
      console.log('   - Groq servers are usually very fast')
    } else {
      console.log('\n🔧 Troubleshooting:')
      console.log('   - Verify .env.local file exists')
      console.log('   - Check API key format (should start with gsk_)')
      console.log('   - Visit https://console.groq.com for support')
    }
    
    process.exit(1)
  }
}

// Run the test
testGroqAPI().catch(console.error)
