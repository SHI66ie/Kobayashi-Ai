import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Initialize DeepSeek (FREE - requires DEEPSEEK_API_KEY)
let deepseek: OpenAI | null = null
try {
  if (process.env.DEEPSEEK_API_KEY) {
    deepseek = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: 'https://api.deepseek.com',
      timeout: 50000,
      maxRetries: 2
    })
  }
} catch (error) {
  console.error('Failed to initialize DeepSeek:', error)
}

export async function POST(request: NextRequest) {
  try {
    const { raceResults, lapTimes, weather, track, race }: any = await request.json()

    if (!deepseek) {
      return NextResponse.json({
        error: 'DeepSeek not configured',
        message: 'Add DEEPSEEK_API_KEY to enable DeepSeek AI analysis',
        setup: 'Get FREE key at: https://platform.deepseek.com/api_keys'
      }, { status: 503 })
    }

    console.log('🚀 Using DeepSeek (FREE & RELIABLE) for analysis...')

    // Prepare race data summary for AI
    const raceDataSummary = {
      track,
      race,
      totalDrivers: raceResults?.length || 0,
      totalLaps: lapTimes?.length || 0,
      weatherConditions: weather ? {
        temperature: weather.airTemp,
        humidity: weather.humidity,
        windSpeed: weather.windSpeed
      } : 'Unknown',
      topDrivers: raceResults?.slice(0, 5).map((r: any) => ({
        position: r.position || r.finishPosition,
        driver: r.driverName || r.driver,
        totalTime: r.totalTime || r.time
      })) || []
    }

    // Limit data size to reduce tokens
    const limitedLapTimes = lapTimes ? lapTimes.slice(0, 20) : null
    const limitedResults = raceResults ? raceResults.slice(0, 10) : null

    // Build analysis prompt
    const prompt = `Analyze this Toyota GR Cup race data:

Track: ${track} | Race: ${race}
Drivers: ${raceDataSummary.totalDrivers} | Laps: ${raceDataSummary.totalLaps}
Weather: ${JSON.stringify(raceDataSummary.weatherConditions)}

Top 5 Finishers:
${limitedResults?.map((r: any, i: number) => `${i+1}. ${r.driverName || r.driver} - ${r.totalTime || r.time || 'N/A'}`).join('\n') || 'No data'}

Sample Lap Times: ${limitedLapTimes?.slice(0, 5).map((l: any) => l.lapTime || l.time).join(', ') || 'N/A'}

Provide:
1. Top 3 performance insights
2. Strategy recommendations
3. Driver coaching tips (1-2 specific)
4. Weather impact analysis
5. Predictions for improvement

Format: Use numbered lists and bullet points. Be specific with data.`

    const startTime = Date.now()

    const completion = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: "system",
          content: `You are RaceMind AI, an expert racing analyst for Toyota GR Cup. Provide detailed, data-driven insights with specific recommendations.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
      stream: false
    })

    const responseTime = Date.now() - startTime
    const analysis = completion.choices[0]?.message?.content || 'No analysis generated'
    const tokensUsed = completion.usage?.total_tokens || 0

    console.log(`✅ DeepSeek analysis complete - ${responseTime}ms, ${tokensUsed} tokens`)

    return NextResponse.json({
      success: true,
      analysis,
      metadata: {
        model: 'deepseek-chat',
        provider: 'DeepSeek (FREE)',
        tokensUsed,
        responseTime,
        track,
        race,
        cost: 'FREE'
      }
    })

  } catch (error: any) {
    console.error('❌ DeepSeek analysis error:', error)
    
    let errorMessage = 'DeepSeek analysis failed'
    let troubleshooting = {}

    if (error.message.includes('401')) {
      errorMessage = 'Invalid DeepSeek API key'
      troubleshooting = {
        solution: 'Check your DEEPSEEK_API_KEY in .env.local',
        getKey: 'https://platform.deepseek.com/api_keys'
      }
    } else if (error.message.includes('429')) {
      errorMessage = 'Rate limit exceeded'
      troubleshooting = {
        solution: 'Wait a few minutes and try again',
        note: 'DeepSeek has generous free limits'
      }
    }

    return NextResponse.json({
      error: errorMessage,
      message: error.message,
      troubleshooting,
      details: error.toString()
    }, { status: 500 })
  }
}
