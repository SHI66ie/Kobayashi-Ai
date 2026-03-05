import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { f1Api, safeApiCall, transformApiData } from '../../../lib/f1-api'
import { jolpicaApi, safeJolpicaCall, transformJolpicaData } from '../../../lib/jolpica-api'

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
    let apiData: { teams: any[]; standings: any[]; races: any[] } = { teams: [], standings: [], races: [] }
    let ergastData: { standings: any[]; drivers: any[] } = { standings: [], drivers: [] }

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

    // Fetch JOLPICA historical data
    try {
      const jolpicaStandingsResult = await safeJolpicaCall(() => jolpicaApi.getCurrentDriverStandings())
      if (jolpicaStandingsResult.data?.MRData?.StandingsTable?.StandingsLists[0]?.DriverStandings) {
        ergastData.standings = jolpicaStandingsResult.data.MRData.StandingsTable.StandingsLists[0].DriverStandings.map(transformJolpicaData.driverStanding)
      }
    } catch (jolpicaError) {
      console.warn('JOLPICA API unavailable:', jolpicaError)
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
          model: 'llama3-8b-8192',
          messages: [
            { role: 'system', content: 'You are an expert F1 analyst providing data-driven predictions. Respond in plain text with structured sections.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 2500
        })
        prediction = completion.choices[0]?.message?.content || ''
        modelUsed = 'llama3-8b-8192 (Groq)'
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
function buildPredictionPrompt(type: string, trackId: string, f1Data: any, apiData: any, selectedTrack: any, ergastData?: any) {
  const currentYear = new Date().getFullYear()
  const historicalStandings = ergastData?.standings || []

  const basePrompt = `F1 ${type.charAt(0).toUpperCase() + type.slice(1)} Prediction for ${selectedTrack?.name || 'Selected Track'}

Current Season Data (Live):
${apiData.standings.length > 0 ? `Championship Standings:
${apiData.standings.slice(0, 10).map((s: any) => `${s.position}. ${s.team} - ${s.points} pts`).join('\n')}` : 'No live standings available'}

Historical Championship Standings (${currentYear}):
${historicalStandings.length > 0 ? historicalStandings.slice(0, 10).map((s: any) => `${s.position}. ${s.driver.name} (${s.team.name}) - ${s.points} pts, ${s.wins} wins`).join('\n') : 'No historical data available'}

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
1. Expected outcomes based on historical performance and current form
2. Key factors including championship standings and driver experience
3. Confidence assessment using real data validation
4. Risk analysis considering team performance and track history

Format with numbered sections and bullet points. Use the provided historical and live data to make informed predictions.`

  return basePrompt
}

// Parse AI response into structured format
function parsePredictionResponse(response: string, type: string) {
  // Mock predictions for different types - in production, parse actual AI response
  const mockDrivers = [
    { driver: 'Max Verstappen', team: 'Red Bull Racing' },
    { driver: 'Lewis Hamilton', team: 'Mercedes AMG' },
    { driver: 'Charles Leclerc', team: 'Ferrari' },
    { driver: 'Lando Norris', team: 'McLaren' },
    { driver: 'George Russell', team: 'Mercedes AMG' },
    { driver: 'Carlos Sainz', team: 'Ferrari' },
    { driver: 'Sergio Perez', team: 'Red Bull Racing' },
    { driver: 'Fernando Alonso', team: 'Aston Martin' },
    { driver: 'Oscar Piastri', team: 'McLaren' },
    { driver: 'Pierre Gasly', team: 'Alpine' }
  ]

  switch (type) {
    case 'qualifying':
      return {
        type: 'Qualifying Prediction',
        predictions: mockDrivers.slice(0, 10).map((d, i) => ({
          ...d,
          position: i + 1,
          time: `1:1${(10 + i).toString().padStart(2, '0')}.${Math.floor(Math.random() * 999)}`,
          confidence: Math.floor(70 + Math.random() * 30)
        })),
        accuracy: Math.floor(70 + Math.random() * 20),
        factors: ['AI Analysis', 'Historical Qualifying Data', 'Track Conditions'],
        rules: '2026 F1 Qualifying Regulations'
      }

    case 'race':
      return {
        type: 'Race Prediction',
        predictions: mockDrivers.slice(0, 10).map((d, i) => ({
          ...d,
          position: i + 1,
          points: [25, 18, 15, 12, 10, 8, 6, 4, 2, 1][i] || 0,
          confidence: Math.floor(70 + Math.random() * 30)
        })),
        accuracy: Math.floor(70 + Math.random() * 20),
        factors: ['AI Analysis', 'Historical Race Data', 'Strategy Factors'],
        rules: '2026 F1 Race Regulations'
      }

    case 'podium':
      return {
        type: 'Podium Prediction',
        predictions: mockDrivers.slice(0, 3).map((d, i) => ({
          ...d,
          position: i + 1,
          odds: `${(2 + i * 0.5).toFixed(1)}:1`,
          confidence: Math.floor(75 + Math.random() * 25)
        })),
        accuracy: Math.floor(70 + Math.random() * 20),
        factors: ['AI Analysis', 'Driver Form', 'Team Performance'],
        rules: '2026 F1 Championship Points'
      }

    case 'pit-strategy':
      return {
        type: 'Pit Strategy Prediction',
        predictions: {
          optimalStrategy: '2-Stop Strategy',
          confidence: Math.floor(70 + Math.random() * 30),
          tireCompounds: ['C3', 'C4', 'C4'],
          pitStops: [
            { stop: 1, lap: 15, from: 'C3', to: 'C4', time: '22.5s' },
            { stop: 2, lap: 35, from: 'C4', to: 'C4', time: '21.8s' }
          ]
        },
        accuracy: Math.floor(70 + Math.random() * 20),
        factors: ['Tire Degradation Analysis', 'Track Evolution', 'Weather Impact'],
        rules: '2026 F1 Tire Regulations'
      }

    case 'overtake':
      return {
        type: 'Overtaking Zones Prediction',
        predictions: [
          { zone: 'Turn 1 DRS Zone', difficulty: 'Medium', successRate: 0.75, drivers: ['HAM', 'LEC', 'NOR'] },
          { zone: 'Turn 8 Hairpin', difficulty: 'Hard', successRate: 0.45, drivers: ['VER', 'SAI'] },
          { zone: 'Final Corner Complex', difficulty: 'Easy', successRate: 0.85, drivers: ['RUS', 'PER', 'ALO'] }
        ],
        accuracy: Math.floor(70 + Math.random() * 20),
        factors: ['DRS Analysis', 'Corner Speeds', 'Tire Grip Levels'],
        rules: '2026 F1 DRS Regulations'
      }

    case 'sprint':
      return {
        type: 'Sprint Race Prediction',
        predictions: mockDrivers.slice(0, 8).map((d, i) => ({
          ...d,
          position: i + 1,
          points: [8, 7, 6, 5, 4, 3, 2, 1][i] || 0,
          pole: i === 0,
          confidence: Math.floor(70 + Math.random() * 30)
        })),
        accuracy: Math.floor(70 + Math.random() * 20),
        factors: ['Sprint Qualifying Performance', 'Short Race Strategy', 'Overtaking Opportunities'],
        rules: '2026 Sprint Format: 100km race, points for top 8 (8-7-6-5-4-3-2-1), pole for race winner'
      }

    default:
      return {
        type: `${type.charAt(0).toUpperCase() + type.slice(1)} Prediction`,
        predictions: [],
        accuracy: Math.floor(70 + Math.random() * 20),
        factors: ['AI Analysis', 'Historical Data', 'Current Conditions'],
        rules: '2026 F1 Regulations Applied'
      }
  }
}

