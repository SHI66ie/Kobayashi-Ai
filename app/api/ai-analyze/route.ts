import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // Allow up to 60 seconds for AI processing
export const runtime = 'nodejs' // Use Node.js runtime for better compatibility

// Initialize OpenAI (requires OPENAI_API_KEY in .env.local)
let openai: OpenAI | null = null
try {
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 50000, // 50 second timeout
      maxRetries: 2 // Retry failed requests twice
    })
  }
} catch (error) {
  console.error('Failed to initialize OpenAI:', error)
}

export async function POST(request: NextRequest) {
  try {
    const { raceResults, lapTimes, weather, track, race }: any = await request.json()

    if (!process.env.OPENAI_API_KEY || !openai) {
      return NextResponse.json({
        error: 'OpenAI API key not configured',
        message: 'Add OPENAI_API_KEY to environment variables (Netlify or .env.local) to enable AI analysis',
        hint: 'Get your key from https://platform.openai.com/api-keys'
      }, { status: 503 })
    }

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

    console.log('🤖 Sending race data to OpenAI for analysis...')
    console.log('Data summary:', JSON.stringify(raceDataSummary, null, 2))

    // Limit data size to reduce tokens
    const limitedLapTimes = lapTimes ? lapTimes.slice(0, 20) : null
    const limitedResults = raceResults ? raceResults.slice(0, 10) : null

    // Use GPT-3.5-turbo by default (10x cheaper, 5x faster)
    // Set GPT_MODEL=gpt-4-turbo-preview in env for better quality
    const model = process.env.GPT_MODEL || 'gpt-3.5-turbo'
    
    let completion
    try {
      completion = await openai.chat.completions.create({
        model,
        messages: [
          {
            role: "system",
            content: `You are RaceMind AI, expert racing analyst for Toyota GR Cup. Provide concise insights with specific numbers. Format: numbered lists, bullet points.`
          },
          {
            role: "user",
            content: `Analyze race data:

Track: ${track} | Race: ${race}
Drivers: ${raceDataSummary.totalDrivers} | Laps: ${raceDataSummary.totalLaps}
Weather: ${JSON.stringify(raceDataSummary.weatherConditions)}

Top 5 Finishers:
${limitedResults?.map((r: any, i: number) => `${i+1}. ${r.driverName || r.driver} - ${r.totalTime || r.time || 'N/A'}`).join('\n') || 'No data'}

Sample Lap Times: ${limitedLapTimes?.slice(0, 5).map((l: any) => l.lapTime || l.time).join(', ') || 'N/A'}

Provide:
1. Top 3 performance insights
2. Strategy tips
3. Driver coaching (1-2 specific tips)
4. Weather impact
5. Predictions`
          }
        ],
        temperature: 0.7,
        max_tokens: 1500 // Reduced for faster response
      })
    } catch (aiError: any) {
      // Fallback to GPT-3.5 if GPT-4 fails
      if (model.includes('gpt-4') && aiError.code === 'model_not_found') {
        console.log('⚠️ GPT-4 not available, falling back to GPT-3.5...')
        completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: "system",
              content: `Racing analyst. Provide numbered insights with data.`
            },
            {
              role: "user",
              content: `Analyze: ${track} ${race}, ${raceDataSummary.totalDrivers} drivers, ${raceDataSummary.totalLaps} laps. Top 3 insights + tips.`
            }
          ],
          temperature: 0.7,
          max_tokens: 1000
        })
      } else {
        throw aiError
      }
    }

    const analysis = completion.choices[0]?.message?.content || 'No analysis generated'

    console.log('✅ AI analysis complete')
    console.log(`Model: ${completion.model} | Tokens: ${completion.usage?.total_tokens}`)

    return NextResponse.json({
      success: true,
      analysis,
      metadata: {
        model: completion.model,
        tokensUsed: completion.usage?.total_tokens,
        track,
        race
      }
    })

  } catch (error: any) {
    console.error('❌ AI analysis error:', error)
    return NextResponse.json({
      error: 'AI analysis failed',
      message: error.message,
      details: error.response?.data || error.toString()
    }, { status: 500 })
  }
}
