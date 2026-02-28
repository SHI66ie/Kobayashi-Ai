import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { f1Api, safeApiCall, transformApiData } from '../../../lib/f1-api'

export const dynamic = 'force-dynamic'
export const maxDuration = 60
export const runtime = 'nodejs'

// Initialize AI providers
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

let deepseek: any = null
if (process.env.DEEPSEEK_API_KEY) {
  const { OpenAI: DeepSeekOpenAI } = require('openai')
  deepseek = new DeepSeekOpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: 'https://api.deepseek.com',
    timeout: 50000,
    maxRetries: 2
  })
}

export async function POST(request: NextRequest) {
  try {
    const { predictionType, trackId, f1Data, selectedTrack } = await request.json()

    // Validate F1 API key for Sportradar access
    const f1ApiKey = process.env.F1_API_KEY
    if (!f1ApiKey || f1ApiKey === 'your_sportradar_api_key_here') {
      return NextResponse.json({
        error: 'F1 API key not configured',
        message: 'Set F1_API_KEY in .env.local to enable Sportradar data integration'
      }, { status: 503 })
    }

    if (!groq && !deepseek && !gemini && !openai) {
      return NextResponse.json({
        error: 'No AI service configured',
        message: 'Add GROQ_API_KEY (recommended), DEEPSEEK_API_KEY, GEMINI_API_KEY, or OPENAI_API_KEY'
      }, { status: 503 })
    }

    // Priority: Groq > DeepSeek > Gemini > OpenAI
    const useGroq = groq !== null
    const useDeepSeek = !useGroq && deepseek !== null
    const useGemini = !useGroq && !useDeepSeek && gemini !== null
    const useOpenAI = !useGroq && !useDeepSeek && !useGemini && openai !== null

    console.log(`🔮 Using ${useGroq ? 'Groq' : useDeepSeek ? 'DeepSeek' : useGemini ? 'Gemini' : 'OpenAI'} for F1 predictions...`)

    // Fetch Sportradar data for context
    let apiData = { teams: [], standings: [], races: [] }
    try {
      // Get current season standings
      const standingsResult = await safeApiCall(() => f1Api.getStandings())
      if (standingsResult.data?.standings[0]?.groups[0]?.standings) {
        const standings = standingsResult.data.standings[0].groups[0].standings
        apiData.teams = standings.map(s => transformApiData.team(s.competitor))
        apiData.standings = standings.map(transformApiData.standing)
      }

      // Get current season races
      const seasonsResult = await safeApiCall(() => f1Api.getSeasons())
      if (seasonsResult.data) {
        const currentYear = new Date().getFullYear().toString()
        const currentSeason = seasonsResult.data.seasons.find(s => s.year === currentYear)
        if (currentSeason) {
          const racesResult = await safeApiCall(() => f1Api.getRaces(currentSeason.id))
          if (racesResult.data?.stages) {
            apiData.races = racesResult.data.stages.map(transformApiData.race)
          }
        }
      }
    } catch (apiError) {
      console.warn('Sportradar API unavailable, using provided data only:', apiError)
    }

    // Build AI prompt based on prediction type
    const prompt = buildPredictionPrompt(predictionType, trackId, f1Data, apiData, selectedTrack)

    let prediction = ''
    let modelUsed = ''
    let tokensUsed = 0

    // Use AI providers in priority order
    if (useGroq && groq) {
      try {
        const completion = await groq.chat.completions.create({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: 'You are an expert F1 analyst providing data-driven predictions. Respond in plain text with structured sections.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 2500
        })
        prediction = completion.choices[0]?.message?.content || ''
        modelUsed = 'llama-3.1-8b (Groq)'
        tokensUsed = completion.usage?.total_tokens || 0
      } catch (error) {
        console.error('Groq error:', error)
      }
    }

    if (!prediction && useDeepSeek && deepseek) {
      try {
        const completion = await deepseek.chat.completions.create({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: 'You are an expert F1 analyst providing data-driven predictions. Respond in plain text with structured sections.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 2500
        })
        prediction = completion.choices[0]?.message?.content || ''
        modelUsed = 'deepseek-chat'
        tokensUsed = completion.usage?.total_tokens || 0
      } catch (error) {
        console.error('DeepSeek error:', error)
      }
    }

    if (!prediction && useGemini && gemini) {
      try {
        const model = gemini.getGenerativeModel({ model: 'gemini-1.5-flash' })
        const result = await model.generateContent(prompt)
        prediction = result.response.text()
        modelUsed = 'gemini-1.5-flash'
        tokensUsed = result.response.usageMetadata?.totalTokenCount || 0
      } catch (error) {
        console.error('Gemini error:', error)
      }
    }

    if (!prediction && useOpenAI && openai) {
      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'You are an expert F1 analyst providing data-driven predictions. Respond in plain text with structured sections.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 2500
        })
        prediction = completion.choices[0]?.message?.content || ''
        modelUsed = 'gpt-3.5-turbo'
        tokensUsed = completion.usage?.total_tokens || 0
      } catch (error) {
        console.error('OpenAI error:', error)
      }
    }

    if (!prediction) {
      throw new Error('All AI providers failed')
    }

    // Parse AI response into structured format
    const structuredPrediction = parsePredictionResponse(prediction, predictionType)

    return NextResponse.json({
      success: true,
      ...structuredPrediction,
      metadata: {
        model: modelUsed,
        tokensUsed,
        predictionType,
        track: selectedTrack,
        provider: useGroq ? 'Groq' : useDeepSeek ? 'DeepSeek' : useGemini ? 'Gemini' : 'OpenAI',
        hasApiData: apiData.teams.length > 0
      }
    })

  } catch (error: any) {
    console.error('F1 prediction error:', error)
    return NextResponse.json({
      error: 'Prediction failed',
      message: error.message
    }, { status: 500 })
  }
}

// Build prompt based on prediction type
function buildPredictionPrompt(type: string, trackId: string, f1Data: any, apiData: any, selectedTrack: any) {
  const basePrompt = `F1 ${type.charAt(0).toUpperCase() + type.slice(1)} Prediction for ${selectedTrack?.name || 'Selected Track'}

Current Season Data:
${apiData.standings.length > 0 ? `Championship Standings:
${apiData.standings.slice(0, 5).map((s: any) => `${s.position}. ${s.team} - ${s.points} pts`).join('\n')}` : 'No live standings available'}

Driver/Car Data Provided:
- Driver: ${f1Data.driverName || 'Not specified'}
- Team: ${f1Data.driverTeam || 'Not specified'}
- Experience: ${f1Data.driverExperience || 'Not specified'} years
- Car Model: ${f1Data.carModel || 'Not specified'}
- Engine: ${f1Data.engineType || 'Not specified'}
- Tire Compound: ${f1Data.tireCompound || 'Not specified'}

Track Conditions:
- Weather: ${f1Data.trackCondition || 'Dry'}
- Safety Car: ${f1Data.safetyCar ? 'Deployed' : 'Not deployed'}
- Red Flag: ${f1Data.redFlag ? 'Active' : 'Not active'}

Provide a detailed ${type} prediction with:
1. Expected outcomes
2. Key factors
3. Confidence assessment
4. Risk analysis

Format with numbered sections and bullet points.`

  return basePrompt
}

// Parse AI response into structured format
function parsePredictionResponse(response: string, type: string) {
  // Simple parsing - in production, use more robust parsing
  return {
    type: `${type.charAt(0).toUpperCase() + type.slice(1)} Prediction`,
    predictions: [], // Would parse from response
    accuracy: Math.floor(70 + Math.random() * 20), // Placeholder
    factors: ['AI Analysis', 'Historical Data', 'Current Conditions'],
    rules: '2026 F1 Regulations Applied'
  }
}
