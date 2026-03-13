import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const dynamic = 'force-dynamic'
export const maxDuration = 60
export const runtime = 'nodejs'

// Initialize Groq (FREE & FAST - PRIMARY)
let groq: OpenAI | null = null
try {
  if (process.env.GROQ_API_KEY) {
    groq = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1',
      timeout: 50000,
      maxRetries: 2
    })
  }
} catch (error) {
  console.error('Failed to initialize Groq:', error)
}

// Initialize DeepSeek (FREE backup)
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

// Initialize Gemini (FREE)
let gemini: GoogleGenerativeAI | null = null
try {
  if (process.env.GEMINI_API_KEY) {
    gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  }
} catch (error) {
  console.error('Failed to initialize Gemini:', error)
}

// Initialize OpenAI (paid fallback)
let openai: OpenAI | null = null
try {
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 50000,
      maxRetries: 2
    })
  }
} catch (error) {
  console.error('Failed to initialize OpenAI:', error)
}

export async function POST(request: NextRequest) {
  try {
    const { 
      raceResults, 
      lapTimes, 
      weather, 
      track, 
      race, 
      question, 
      series = 'Toyota GR Cup',
      // F1-specific context data
      contextData,
      // Chat mode: 'general' or 'f1' or 'auto'
      mode = 'auto'
    }: any = await request.json()

    if (!question || typeof question !== 'string') {
      return NextResponse.json({
        error: 'Invalid question',
        message: 'Provide a non-empty question string.'
      }, { status: 400 })
    }

    if (!groq && !deepseek && !gemini && !openai) {
      return NextResponse.json({
        error: 'No AI service configured',
        message: 'Add GROQ_API_KEY, DEEPSEEK_API_KEY, GEMINI_API_KEY, or OPENAI_API_KEY to use AI Q&A.'
      }, { status: 503 })
    }

    const useGroq = groq !== null
    const useDeepSeek = !useGroq && deepseek !== null
    const useGemini = !useGroq && !useDeepSeek && gemini !== null
    const useOpenAI = !useGroq && !useDeepSeek && !useGemini && openai !== null

    // Determine if this is an F1-related question
    const isF1Question = mode === 'f1' || (
      mode === 'auto' && (
        question.toLowerCase().includes('f1') ||
        question.toLowerCase().includes('formula') ||
        question.toLowerCase().includes('race') ||
        question.toLowerCase().includes('qualifying') ||
        question.toLowerCase().includes('standings') ||
        question.toLowerCase().includes('tire') ||
        question.toLowerCase().includes('pit') ||
        question.toLowerCase().includes('strategy') ||
        question.toLowerCase().includes('driver') ||
        question.toLowerCase().includes('team') ||
        series.toLowerCase().includes('f1')
      )
    )

    // Enhanced context for F1 questions
    let f1Context: {
      tireCompounds: string[];
      selectedTire: string;
      trackTemp: number;
      airTemp: number;
      humidity: number;
      trackCondition: string;
      currentTrack: string;
      currentDriver: string;
      position: number;
      telemetry: any;
      sessionType: string;
      currentLap: number;
      totalLaps: number;
    } = {
      tireCompounds: ['C1', 'C2', 'C3', 'C4', 'C5', 'Intermediate', 'Wet'],
      selectedTire: 'C3',
      trackTemp: 35,
      airTemp: 25,
      humidity: 50,
      trackCondition: 'dry',
      currentTrack: track || 'Unknown',
      currentDriver: 'Unknown',
      position: 1,
      telemetry: {},
      sessionType: 'Race',
      currentLap: 1,
      totalLaps: 57
    }
    
    if (isF1Question && contextData) {
      f1Context = {
        tireCompounds: ['C1', 'C2', 'C3', 'C4', 'C5', 'Intermediate', 'Wet'],
        selectedTire: contextData?.tireCompound || 'C3',
        trackTemp: contextData?.trackTemp || 35,
        airTemp: contextData?.airTemp || 25,
        humidity: contextData?.humidity || 50,
        trackCondition: contextData?.trackCondition || 'dry',
        currentTrack: contextData?.track || track || 'Unknown',
        currentDriver: contextData?.currentDriver || 'Unknown',
        position: contextData?.position || 1,
        telemetry: contextData?.telemetry || {},
        sessionType: contextData?.sessionType || 'Race',
        currentLap: contextData?.currentLap || 1,
        totalLaps: contextData?.totalLaps || 57
      }
    }

    const summary = {
      track,
      race,
      totalDrivers: Array.isArray(raceResults) ? raceResults.length : 0,
      totalLaps: Array.isArray(lapTimes) ? lapTimes.length : 0,
      hasWeather: !!weather,
      hasTelemetry: !!(raceResults && (raceResults as any).telemetry),
      isF1Context: isF1Question,
      f1Context
    }

    const limitedLapTimes = Array.isArray(lapTimes) ? lapTimes.slice(0, 40) : []
    const limitedResults = Array.isArray(raceResults) ? raceResults.slice(0, 20) : []

    // Dynamic system prompt based on context
    let systemPrompt = ""
    if (isF1Question) {
      systemPrompt = `You are KobayashiAI, an expert F1 analyst with deep knowledge of Formula 1 racing, strategy, tire compounds, driver performance, and race conditions.

${Object.keys(f1Context).length > 0 ? `
CURRENT F1 CONTEXT:
- Track: ${f1Context.currentTrack}
- Track Temperature: ${f1Context.trackTemp}°C
- Air Temperature: ${f1Context.airTemp}°C
- Humidity: ${f1Context.humidity}%
- Track Condition: ${f1Context.trackCondition}
- Tire Compound: ${f1Context.selectedTire}
- Session: ${f1Context.sessionType}
- Current Driver: ${f1Context.currentDriver}
- Position: ${f1Context.position}
- Current Lap: ${f1Context.currentLap}/${f1Context.totalLaps}
` : ''}

ANALYZE the race data and provide expert F1 insights. Use proper F1 terminology (undercut, overcut, degradation, stint, etc.). Consider tire strategy, pit stop windows, track conditions, and driver performance. Be specific and data-driven when possible, but also engage in natural conversation about F1 topics.`
    } else {
      systemPrompt = `You are RaceMind AI, an expert ${series} racing analyst. Answer questions about this race using the provided data. Be concise but specific. If data is missing, say what is uncertain. Engage in natural conversation while maintaining expertise.`
    }

    const userPrompt = `RACE CONTEXT:\n${JSON.stringify(summary, null, 2)}\n\n` +
      `SAMPLE RACE RESULTS (truncated):\n${JSON.stringify(limitedResults, null, 2)}\n\n` +
      `SAMPLE LAP TIMES (truncated):\n${JSON.stringify(limitedLapTimes, null, 2)}\n\n` +
      `WEATHER (if any):\n${JSON.stringify(weather ?? null, null, 2)}\n\n` +
      `USER QUESTION: ${question}\n\n` +
      'Now provide a direct answer for the driver/engineer, in plain text, with short sections or bullets as needed.'

    let answer = ''
    let modelUsed = ''
    let tokensUsed = 0

    if (useGroq && groq) {
      try {
        const completion = await groq.chat.completions.create({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.4,
          max_tokens: 1500
        })
        answer = completion.choices[0]?.message?.content || ''
        modelUsed = 'llama-3.1-8b-instant (Groq)'
        tokensUsed = completion.usage?.total_tokens || 0
      } catch (error: any) {
        console.error('Groq QA error:', error.message)
      }
    }

    if (!answer && useDeepSeek && deepseek) {
      try {
        const completion = await deepseek.chat.completions.create({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.4,
          max_tokens: 1500
        })
        answer = completion.choices[0]?.message?.content || ''
        modelUsed = 'deepseek-chat'
        tokensUsed = completion.usage?.total_tokens || 0
      } catch (error: any) {
        console.error('DeepSeek QA error:', error.message)
      }
    }

    if (!answer && useGemini && gemini) {
      try {
        const model = gemini.getGenerativeModel({ model: 'gemini-1.5-flash-latest' })
        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: systemPrompt + '\n\n' + userPrompt }] }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 1500,
            topP: 0.8,
            topK: 40
          }
        })
        answer = result.response.text()
        modelUsed = 'gemini-1.5-flash-latest'
        tokensUsed = result.response.usageMetadata?.totalTokenCount || 0
      } catch (error: any) {
        console.error('Gemini QA error:', error.message)
      }
    }

    if (!answer && useOpenAI && openai) {
      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.4,
          max_tokens: 1500
        })
        answer = completion.choices[0]?.message?.content || ''
        modelUsed = 'gpt-3.5-turbo'
        tokensUsed = completion.usage?.total_tokens || 0
      } catch (error: any) {
        console.error('OpenAI QA error:', error.message)
      }
    }

    if (!answer) {
      throw new Error('All AI providers failed to generate an answer')
    }

    return NextResponse.json({
      success: true,
      answer,
      metadata: {
        model: modelUsed,
        tokensUsed,
        track,
        race
      }
    })
  } catch (error: any) {
    console.error('❌ AI QA error:', error)
    return NextResponse.json({
      error: 'AI Q&A failed',
      message: error.message
    }, { status: 500 })
  }
}


