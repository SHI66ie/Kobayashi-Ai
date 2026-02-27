import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // Allow up to 60 seconds for AI processing
export const runtime = 'nodejs' // Use Node.js runtime for better compatibility

// Initialize AI providers using direct SDKs
const groq = process.env.GROQ_API_KEY ? new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
  timeout: 50000,
  maxRetries: 2
}) : null

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 50000,
  maxRetries: 2
}) : null

const gemini = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null

// For DeepSeek, use OpenAI-compatible client
let deepseek: any = null
if (process.env.DEEPSEEK_API_KEY) {
  deepseek = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: 'https://api.deepseek.com',
    timeout: 50000,
    maxRetries: 2
  })
}

// Check for Custom LLM configuration
const customLLMUrl = process.env.CUSTOM_LLM_URL
const customLLMKey = process.env.CUSTOM_LLM_API_KEY

export async function POST(request: NextRequest) {
  try {
    const { raceResults, lapTimes, weather, track, race }: any = await request.json()

    // Check if any AI service is available
    if (!groq && !deepseek && !gemini && !openai && !customLLMUrl) {
      return NextResponse.json({
        error: 'No AI service configured',
        message: 'Add GROQ_API_KEY (FREE & FAST), DEEPSEEK_API_KEY (FREE), GEMINI_API_KEY (FREE), CUSTOM_LLM_URL, or OPENAI_API_KEY to enable AI analysis',
        hints: {
          groq: 'Get FREE Groq key: https://console.groq.com/keys (RECOMMENDED - No phone needed)',
          deepseek: 'Get FREE DeepSeek key: https://platform.deepseek.com/api_keys (May need phone verification)',
          gemini: 'Get FREE Gemini key: https://makersuite.google.com/app/apikey',
          custom: 'Use your own LLM: Set CUSTOM_LLM_URL in .env.local',
          openai: 'Get OpenAI key (paid): https://platform.openai.com/api-keys'
        }
      }, { status: 503 })
    }

    // Priority: Groq (free & fast) > DeepSeek (free) > Custom LLM > Gemini (free) > OpenAI (paid)
    const useGroq = groq !== null
    const useDeepSeek = !useGroq && deepseek !== null
    const useCustomLLM = !useGroq && !useDeepSeek && customLLMUrl !== undefined
    const useGemini = !useGroq && !useDeepSeek && !useCustomLLM && gemini !== null
    const useOpenAI = !useGroq && !useDeepSeek && !useCustomLLM && !useGemini && openai !== null
    
    const aiProvider = useGroq ? 'Groq (FREE & FAST)' :
                      useDeepSeek ? 'DeepSeek (FREE)' : 
                      useCustomLLM ? 'Custom LLM' :
                      useGemini ? 'Google Gemini (FREE)' : 'OpenAI GPT'
    console.log(`🤖 Using ${aiProvider} for analysis...`)

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

    // Use Groq (FREE & FAST) first
    if (useGroq && groq) {
      try {
        console.log('⚡ Using Groq (FREE & FAST)...')
        const completion = await groq.chat.completions.create({
          model: 'llama-3.1-8b-instant',
          messages: [
            {
              role: "system",
              content: 'You are RaceMind AI, an expert racing analyst for Toyota GR Cup. Provide detailed, data-driven insights with specific recommendations.'
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

        analysis = completion.choices[0]?.message?.content || 'No analysis generated'
        modelUsed = 'llama-3.1-8b (FREE via Groq)'
        tokensUsed = completion.usage?.total_tokens || 0

      } catch (groqError: any) {
        console.error('⚠️ Groq error, falling back to next provider:', groqError.message)
        // Continue to next provider
      }
    }

    // Use DeepSeek if Groq failed
    if (!analysis && useDeepSeek && deepseek) {
      try {
        console.log('🚀 Using DeepSeek (FREE & RELIABLE)...')
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

        analysis = completion.choices[0]?.message?.content || 'No analysis generated'
        modelUsed = 'deepseek-chat (FREE)'
        tokensUsed = completion.usage?.total_tokens || 0

      } catch (deepseekError: any) {
        console.error('⚠️ DeepSeek error, falling back to next provider:', deepseekError.message)
        // Continue to next provider
      }
    }

    // Use Custom LLM if Groq and DeepSeek failed
    if (!analysis && useCustomLLM && customLLMUrl) {
      try {
        console.log('🔧 Using Custom LLM...')
        
        // Call the custom LLM endpoint
        const customResponse = await fetch('/api/ai-custom', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            raceResults,
            lapTimes,
            weather,
            track,
            race
          })
        })
        
        if (customResponse.ok) {
          const customResult: any = await customResponse.json()
          analysis = customResult.analysis || 'No analysis generated'
          modelUsed = customResult.metadata?.model || 'Custom LLM'
          tokensUsed = customResult.metadata?.tokensUsed || 0
        } else {
          throw new Error('Custom LLM request failed')
        }
        
      } catch (customError: any) {
        console.error('⚠️ Custom LLM error, falling back to Gemini/OpenAI:', customError.message)
        // Continue to Gemini/OpenAI fallback
      }
    }
    
    // Use Gemini (FREE) if custom LLM failed or not available
    if (!analysis && useGemini && gemini) {
      try {
        console.log('🆓 Using Gemini 1.5 Flash (FREE)...')
        const model = gemini.getGenerativeModel({ model: 'gemini-1.5-flash' })
        const result = await model.generateContent(prompt)

        analysis = result.response.text() || 'No analysis generated'
        modelUsed = 'gemini-1.5-flash (FREE)'
        tokensUsed = result.response.usageMetadata?.totalTokenCount || 0

      } catch (geminiError: any) {
        console.error('⚠️ Gemini error, falling back to OpenAI if available:', geminiError.message)
        if (!openai) throw geminiError
      }
    }

    // Use OpenAI as final fallback
    if (!analysis && useOpenAI && openai) {
      const model = process.env.GPT_MODEL || 'gpt-3.5-turbo'
      try {
        console.log(`💰 Using OpenAI ${model}...`)
        const completion = await openai.chat.completions.create({
          model: model,
          messages: [
            {
              role: "system",
              content: 'You are RaceMind AI, expert racing analyst for Toyota GR Cup.'
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1500,
          stream: false
        })

        analysis = completion.choices[0]?.message?.content || 'No analysis generated'
        modelUsed = `${model} (OpenAI)`
        tokensUsed = completion.usage?.total_tokens || 0

      } catch (openaiError: any) {
        // Try GPT-3.5 fallback if GPT-4 failed
        if (model.includes('gpt-4')) {
          console.log('⚠️ GPT-4 not available, falling back to GPT-3.5...')
          try {
            const fallbackCompletion = await openai.chat.completions.create({
              model: 'gpt-3.5-turbo',
              messages: [
                {
                  role: "system",
                  content: 'You are RaceMind AI, expert racing analyst for Toyota GR Cup. Numbered insights.'
                },
                {
                  role: "user",
                  content: prompt
                }
              ],
              temperature: 0.7,
              max_tokens: 1000,
              stream: false
            })
            analysis = fallbackCompletion.choices[0]?.message?.content || 'No analysis generated'
            modelUsed = 'gpt-3.5-turbo (fallback - OpenAI)'
            tokensUsed = fallbackCompletion.usage?.total_tokens || 0
          } catch (fallbackError: any) {
            throw fallbackError
          }
        } else {
          throw openaiError
        }
      }
    }

    console.log(`✅ AI analysis complete`)
    console.log(`Model: ${modelUsed} | Tokens: ${tokensUsed}`)

    return NextResponse.json({
      success: true,
      analysis,
      metadata: {
        model: modelUsed,
        tokensUsed,
        track,
        race,
        provider: useGroq ? 'Groq (FREE)' :
                 useDeepSeek ? 'DeepSeek (FREE)' : 
                 useCustomLLM ? 'Custom LLM' :
                 useGemini ? 'Google Gemini (FREE)' : 'OpenAI'
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
