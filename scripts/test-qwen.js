#!/usr/bin/env node

const OpenAI = require('openai')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

console.log('🧪 Testing Qwen 3.5 API Integration...\n')

// Check if API key is configured
if (!process.env.QWEN_API_KEY) {
  console.error('❌ QWEN_API_KEY not found in .env.local')
  console.log('Get your API key from: https://dashscope.console.aliyun.com/')
  process.exit(1)
}

// Initialize Qwen client
const qwen = new OpenAI({
  apiKey: process.env.QWEN_API_KEY,
  baseURL: process.env.QWEN_BASE_URL || 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
  timeout: 30000,
  maxRetries: 2
})

async function testQwen() {
  try {
    console.log('🚀 Testing Qwen 3.5 with racing analysis prompt...')
    
    const testPrompt = `Analyze this Toyota GR Cup race data:

Track: Suzuka International | Race: Round 5
Drivers: 25 | Laps: 15
Weather: {"temperature": 22, "humidity": 65, "windSpeed": 3.2}

Top 3 Finishers:
1. Takahashi Ryuto - 25:42.187
2. Kobayashi Yuki - 25:43.921
3. Sato Kenji - 25:45.332

Sample Lap Times: 1:42.187, 1:42.234, 1:41.987, 1:42.456, 1:42.012

Provide:
1. Top 3 performance insights
2. Strategy recommendations
3. Driver coaching tips (1-2 specific)
4. Weather impact analysis
5. Predictions for improvement

Format: Use numbered lists and bullet points. Be specific with data.`

    const startTime = Date.now()
    
    const completion = await qwen.chat.completions.create({
      model: 'qwen3.5-plus',
      messages: [
        {
          role: 'system',
          content: 'You are RaceMind AI, an expert racing analyst for Toyota GR Cup. Provide detailed, data-driven insights with specific recommendations.'
        },
        {
          role: 'user',
          content: testPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
      stream: false
    })

    const endTime = Date.now()
    const responseTime = endTime - startTime

    console.log('✅ Qwen 3.5 API test successful!')
    console.log(`📊 Model: qwen3.5-plus`)
    console.log(`⏱️  Response time: ${responseTime}ms`)
    console.log(`🪙 Tokens used: ${completion.usage?.total_tokens || 'N/A'}`)
    console.log(`📝 Response length: ${completion.choices[0]?.message?.content?.length || 0} characters`)
    
    console.log('\n📋 Sample Response:')
    console.log('=' .repeat(50))
    console.log(completion.choices[0]?.message?.content || 'No content')
    console.log('=' .repeat(50))

    // Test driver coaching
    console.log('\n🏁 Testing driver coaching functionality...')
    
    const coachingPrompt = `You are a professional racing coach for Toyota GR Cup. Analyze this driver's performance:

DRIVER: Yamamoto Satoshi
TRACK: Fuji Speedway
TOTAL LAPS: 20
BEST LAP: 1:22.456s
WORST LAP: 1:25.123s
CONSISTENCY GAP: 2.667s
FINAL POSITION: 8
WEATHER: Air: 18°C, Track: 21°C, Humidity: 70%, Wind: 2.1 m/s, Rain: No

Provide:
1. **Strengths**: 2-3 specific areas where driver excels
2. **Improvement Areas**: 3-4 actionable coaching points
3. **Braking Zones**: Specific corner/sector recommendations
4. **Consistency Tips**: How to reduce lap time variance

FORMAT REQUIREMENTS:
- Respond as a structured driving coaching report in plain text, not JSON.
- Use numbered sections with **bold** titles and short bullet points.
- Do NOT mention that you are an AI or language model.
- Do NOT use markdown code fences or formatted code blocks.`

    const coachingStart = Date.now()
    
    const coachingCompletion = await qwen.chat.completions.create({
      model: 'qwen3.5-plus',
      messages: [
        {
          role: 'system',
          content: 'You are a professional Toyota GR Cup driver coach. Provide a concise, structured coaching report in plain text. Do NOT mention that you are an AI and do NOT output JSON or code fences.'
        },
        {
          role: 'user',
          content: coachingPrompt
        }
      ],
      temperature: 0.6,
      max_tokens: 1500
    })

    const coachingEnd = Date.now()
    const coachingResponseTime = coachingEnd - coachingStart

    console.log('✅ Driver coaching test successful!')
    console.log(`⏱️  Coaching response time: ${coachingResponseTime}ms`)
    console.log(`🪙 Coaching tokens used: ${coachingCompletion.usage?.total_tokens || 'N/A'}`)
    
    console.log('\n📋 Sample Coaching Response:')
    console.log('=' .repeat(50))
    console.log(coachingCompletion.choices[0]?.message?.content || 'No content')
    console.log('=' .repeat(50))

    console.log('\n🎉 All Qwen 3.5 tests passed!')
    console.log('🚀 Your app is ready to use Qwen 3.5 for AI-powered racing analysis!')
    
  } catch (error) {
    console.error('❌ Qwen 3.5 API test failed:')
    console.error('Error:', error.message)
    
    if (error.response) {
      console.error('Status:', error.response.status)
      console.error('Data:', error.response.data)
    }
    
    console.log('\n🔧 Troubleshooting tips:')
    console.log('1. Verify your QWEN_API_KEY is correct')
    console.log('2. Check your internet connection')
    console.log('3. Ensure you have sufficient API credits')
    console.log('4. Try again in a few moments')
    
    process.exit(1)
  }
}

// Run the test
testQwen()
