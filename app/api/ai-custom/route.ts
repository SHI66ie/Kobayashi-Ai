import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const { raceResults, lapTimes, weather, track, race }: any = await request.json()

    // Check if custom LLM is configured
    const customLLMUrl = process.env.CUSTOM_LLM_URL
    const customLLMKey = process.env.CUSTOM_LLM_API_KEY

    if (!customLLMUrl) {
      return NextResponse.json({
        error: 'Custom LLM not configured',
        message: 'Add CUSTOM_LLM_URL to .env.local',
        setup: {
          ollama: 'http://localhost:11434/api/generate',
          localai: 'http://localhost:8080/v1/chat/completions',
          textgen: 'http://localhost:5000/v1/chat/completions',
          lmstudio: 'http://localhost:1234/v1/chat/completions'
        }
      }, { status: 503 })
    }

    console.log('🤖 Using Custom LLM for analysis...')
    console.log(`Endpoint: ${customLLMUrl}`)

    // Prepare race data summary
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

    // Limit data size
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

    let analysis = ''
    let modelUsed = ''
    let tokensUsed = 0

    // Detect LLM type and format request accordingly
    const isOllama = customLLMUrl.includes('ollama') || customLLMUrl.includes('11434')
    const isOpenAICompatible = customLLMUrl.includes('/v1/chat/completions')

    if (isOllama) {
      // Ollama format
      const ollamaModel = process.env.CUSTOM_LLM_MODEL || 'llama3.1'
      
      const response = await fetch(customLLMUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(customLLMKey && { 'Authorization': `Bearer ${customLLMKey}` })
        },
        body: JSON.stringify({
          model: ollamaModel,
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.7,
            top_p: 0.9,
            max_tokens: 2000
          }
        })
      })

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`)
      }

      const result: any = await response.json()
      analysis = result.response || 'No analysis generated'
      modelUsed = `${ollamaModel} (Ollama)`
      tokensUsed = result.eval_count || 0

    } else if (isOpenAICompatible) {
      // OpenAI-compatible format (LocalAI, text-generation-webui, LM Studio, etc.)
      const customModel = process.env.CUSTOM_LLM_MODEL || 'gpt-3.5-turbo'
      
      const response = await fetch(customLLMUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(customLLMKey && { 'Authorization': `Bearer ${customLLMKey}` })
        },
        body: JSON.stringify({
          model: customModel,
          messages: [
            {
              role: "system",
              content: "You are RaceMind AI, expert racing analyst for Toyota GR Cup."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000
        })
      })

      if (!response.ok) {
        throw new Error(`Custom LLM API error: ${response.status} ${response.statusText}`)
      }

      const result: any = await response.json()
      analysis = result.choices?.[0]?.message?.content || 'No analysis generated'
      modelUsed = `${customModel} (Custom)`
      tokensUsed = result.usage?.total_tokens || 0

    } else {
      // Generic POST request
      const response = await fetch(customLLMUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(customLLMKey && { 'Authorization': `Bearer ${customLLMKey}` })
        },
        body: JSON.stringify({
          prompt: prompt,
          max_tokens: 2000,
          temperature: 0.7
        })
      })

      if (!response.ok) {
        throw new Error(`Custom LLM API error: ${response.status} ${response.statusText}`)
      }

      const result: any = await response.json()
      analysis = result.text || result.response || result.output || 'No analysis generated'
      modelUsed = 'Custom LLM'
      tokensUsed = result.tokens || 0
    }

    console.log(`✅ Custom LLM analysis complete`)
    console.log(`Model: ${modelUsed} | Tokens: ${tokensUsed}`)

    return NextResponse.json({
      success: true,
      analysis,
      metadata: {
        model: modelUsed,
        tokensUsed,
        track,
        race,
        provider: 'Custom LLM',
        endpoint: customLLMUrl
      }
    })

  } catch (error: any) {
    console.error('❌ Custom LLM analysis error:', error)
    return NextResponse.json({
      error: 'Custom LLM analysis failed',
      message: error.message,
      details: error.toString()
    }, { status: 500 })
  }
}
