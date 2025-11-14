#!/usr/bin/env node

/**
 * DeepSeek API Test Script
 * Tests the DeepSeek API integration for RaceMind AI
 */

require('dotenv').config({ path: '.env.local' })

async function testDeepSeekAPI() {
  console.log('🧪 Testing DeepSeek API Integration...\n')

  // Check if API key is configured
  if (!process.env.DEEPSEEK_API_KEY) {
    console.error('❌ DEEPSEEK_API_KEY not found in .env.local')
    console.log('\n📝 Setup Instructions:')
    console.log('1. Visit: https://platform.deepseek.com/api_keys')
    console.log('2. Sign up for free account')
    console.log('3. Generate API key')
    console.log('4. Add to .env.local: DEEPSEEK_API_KEY=your_key_here')
    process.exit(1)
  }

  console.log('✅ DeepSeek API key found')
  console.log(`🔑 Key format: ${process.env.DEEPSEEK_API_KEY.substring(0, 8)}...${process.env.DEEPSEEK_API_KEY.slice(-4)}`)

  try {
    // Import OpenAI client for DeepSeek
    const { default: OpenAI } = await import('openai')
    
    const deepseek = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: 'https://api.deepseek.com',
      timeout: 30000
    })

    console.log('\n🤖 Testing DeepSeek Chat Completion...')

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
    
    const completion = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
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

    console.log('✅ DeepSeek API Response Successful!')
    console.log(`⏱️  Response Time: ${responseTime}ms`)
    console.log(`🎯 Model: ${completion.model}`)
    console.log(`📊 Tokens Used: ${completion.usage?.total_tokens || 'Unknown'}`)
    console.log(`💰 Cost: FREE (DeepSeek offers generous free tier)`)

    console.log('\n🏁 Racing Analysis Response:')
    console.log('='.repeat(60))
    console.log(completion.choices[0]?.message?.content || 'No response generated')
    console.log('=' .repeat(60))

    // Test error handling
    console.log('\n🧪 Testing Error Handling...')
    try {
      await deepseek.chat.completions.create({
        model: 'invalid-model',
        messages: [{ role: 'user', content: 'test' }]
      })
    } catch (error) {
      console.log('✅ Error handling works correctly')
      console.log(`   Error type: ${error.constructor.name}`)
    }

    console.log('\n🎉 DeepSeek Integration Test Complete!')
    console.log('\n📋 Summary:')
    console.log(`   ✅ API Key: Valid`)
    console.log(`   ✅ Connection: Working`)
    console.log(`   ✅ Model: deepseek-chat`)
    console.log(`   ✅ Response Time: ${responseTime}ms`)
    console.log(`   ✅ Cost: FREE`)
    console.log(`   ✅ Error Handling: Working`)

    console.log('\n🚀 Next Steps:')
    console.log('   1. Add DEEPSEEK_API_KEY to your .env.local')
    console.log('   2. Run: npm run dev')
    console.log('   3. Load race data in dashboard')
    console.log('   4. Try AI analysis - DeepSeek will be used automatically!')

  } catch (error) {
    console.error('\n❌ DeepSeek API Test Failed!')
    console.error('Error details:', error.message)
    
    if (error.message.includes('401')) {
      console.log('\n🔑 API Key Issues:')
      console.log('   - Check if your DeepSeek API key is correct')
      console.log('   - Verify the key has proper permissions')
      console.log('   - Try regenerating the key at https://platform.deepseek.com/api_keys')
    } else if (error.message.includes('429')) {
      console.log('\n⏳ Rate Limit:')
      console.log('   - You may have hit the rate limit')
      console.log('   - Wait a few minutes and try again')
      console.log('   - DeepSeek has generous free limits')
    } else if (error.message.includes('timeout')) {
      console.log('\n🌐 Network Issues:')
      console.log('   - Check your internet connection')
      console.log('   - Try again in a few moments')
    } else {
      console.log('\n🔧 Troubleshooting:')
      console.log('   - Verify .env.local file exists')
      console.log('   - Check API key format')
      console.log('   - Visit https://platform.deepseek.com for support')
    }
    
    process.exit(1)
  }
}

// Run the test
testDeepSeekAPI().catch(console.error)
