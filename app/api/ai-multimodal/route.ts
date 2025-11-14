import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

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

// Initialize Gemini for multimodal analysis (fallback)
let gemini: GoogleGenerativeAI | null = null
try {
  if (process.env.GEMINI_API_KEY) {
    gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  }
} catch (error) {
  console.error('Failed to initialize Gemini:', error)
}

export async function POST(request: NextRequest) {
  try {
    const { 
      telemetryData, 
      trackLayout, 
      weatherData, 
      driverBehavior, 
      raceContext,
      analysisType = 'comprehensive'
    }: any = await request.json()

    if (!groq && !gemini) {
      return NextResponse.json({
        error: 'Multimodal AI not configured',
        message: 'Add GROQ_API_KEY (recommended) or GEMINI_API_KEY to enable advanced multimodal analysis'
      }, { status: 503 })
    }

    const useGroq = groq !== null
    console.log(`🧠 Using ${useGroq ? 'Groq' : 'Gemini'} for multimodal racing analysis...`)

    // Create comprehensive racing context
    const racingContext = `
ADVANCED RACING TELEMETRY ANALYSIS
=====================================

TELEMETRY DATA:
${JSON.stringify(telemetryData, null, 2)}

TRACK LAYOUT:
- Corners: ${trackLayout?.corners || 'Unknown'}
- Elevation: ${trackLayout?.elevation || 'Flat'}
- Surface: ${trackLayout?.surface || 'Asphalt'}
- Length: ${trackLayout?.length || 'Unknown'}

WEATHER CONDITIONS:
- Temperature: ${weatherData?.temperature || 'Unknown'}°C
- Humidity: ${weatherData?.humidity || 'Unknown'}%
- Wind: ${weatherData?.windSpeed || 'Unknown'} km/h
- Track Temp: ${weatherData?.trackTemp || 'Unknown'}°C

DRIVER BEHAVIOR PATTERNS:
- Braking Style: ${driverBehavior?.brakingStyle || 'Unknown'}
- Cornering Approach: ${driverBehavior?.corneringStyle || 'Unknown'}
- Throttle Application: ${driverBehavior?.throttleStyle || 'Unknown'}
- Consistency: ${driverBehavior?.consistency || 'Unknown'}

RACE CONTEXT:
- Position: ${raceContext?.position || 'Unknown'}
- Lap: ${raceContext?.currentLap || 'Unknown'}/${raceContext?.totalLaps || 'Unknown'}
- Gap to Leader: ${raceContext?.gapToLeader || 'Unknown'}
- Tire Condition: ${raceContext?.tireCondition || 'Unknown'}
- Fuel Level: ${raceContext?.fuelLevel || 'Unknown'}%
`

    let analysisPrompt = ''
    
    switch (analysisType) {
      case 'performance':
        analysisPrompt = `As an expert racing engineer with deep knowledge of vehicle dynamics and driver performance, analyze this comprehensive telemetry data.

Focus on:
1. **Performance Optimization**: Identify specific areas where lap time can be improved
2. **Vehicle Setup**: Recommend suspension, aerodynamic, and differential adjustments
3. **Driving Technique**: Pinpoint exact braking points, turn-in points, and throttle application
4. **Tire Management**: Analyze degradation patterns and optimal usage strategies
5. **Sector Analysis**: Break down performance by track sectors with specific recommendations

Provide data-driven insights with specific numerical targets and actionable recommendations.`
        break

      case 'strategy':
        analysisPrompt = `As a world-class race strategist with expertise in Toyota GR Cup racing, develop an optimal race strategy.

Analyze:
1. **Pit Window Optimization**: Calculate optimal pit stops based on tire degradation and fuel consumption
2. **Position Management**: Strategic overtaking opportunities and defensive positioning
3. **Weather Strategy**: Adaptations for changing conditions and tire compound selection
4. **Risk Assessment**: Probability analysis of different strategic scenarios
5. **Contingency Planning**: Alternative strategies for safety cars, incidents, or weather changes
6. **Fuel Strategy**: Optimal fuel loads vs. lap time trade-offs

Provide specific lap numbers, probability percentages, and decision trees.`
        break

      case 'safety':
        analysisPrompt = `As a racing safety expert and risk assessment specialist, evaluate this racing scenario.

Assess:
1. **Risk Factors**: Identify potential safety hazards based on telemetry patterns
2. **Driver Fatigue**: Analyze consistency degradation and reaction time patterns
3. **Vehicle Condition**: Assess mechanical stress indicators and failure predictions
4. **Track Conditions**: Evaluate grip levels and hazardous areas
5. **Incident Prevention**: Recommend specific actions to avoid accidents
6. **Emergency Protocols**: Suggest contingency plans for various scenarios

Provide risk scores (1-10), specific warnings, and preventive measures.`
        break

      default:
        analysisPrompt = `As an AI racing co-driver with expertise in autonomous driving systems and racing strategy, provide comprehensive analysis.

Deliver:
1. **Real-time Coaching**: Immediate feedback on current driving performance
2. **Predictive Analysis**: Forecast next 3-5 laps based on current patterns
3. **Adaptive Strategy**: Dynamic strategy adjustments based on changing conditions
4. **Performance Metrics**: Key performance indicators with benchmarking
5. **Decision Support**: Recommend specific actions with confidence levels
6. **Learning Insights**: Identify patterns for long-term improvement

Format as structured JSON with confidence scores and priority levels.`
    }

    const fullPrompt = `${racingContext}

${analysisPrompt}

ANALYSIS TYPE: ${analysisType.toUpperCase()}

Provide detailed, technical analysis with specific recommendations, numerical data, and actionable insights. Use racing terminology and be precise with measurements and timings.`

    let analysis = ''
    let tokensUsed = 0
    let modelUsed = ''

    // Try Groq first (FREE & FAST)
    if (useGroq && groq) {
      try {
        const completion = await groq.chat.completions.create({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: 'You are an expert multimodal racing AI analyst. Provide detailed technical analysis with specific recommendations.' },
            { role: 'user', content: fullPrompt }
          ],
          temperature: 0.4,
          max_tokens: 4000
        })
        analysis = completion.choices[0]?.message?.content || ''
        modelUsed = 'llama-3.1-8b-instant (Groq)'
        tokensUsed = completion.usage?.total_tokens || 0
      } catch (error: any) {
        console.error('Groq multimodal error:', error.message)
      }
    }

    // Fall back to Gemini if Groq failed
    if (!analysis && gemini) {
      try {
        const model = gemini.getGenerativeModel({ model: 'gemini-1.5-flash-latest' })
        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 4000,
            topP: 0.8,
            topK: 40
          }
        })
        analysis = result.response.text()
        modelUsed = 'gemini-1.5-flash-latest'
        tokensUsed = result.response.usageMetadata?.totalTokenCount || 0
      } catch (error: any) {
        console.error('Gemini multimodal error:', error.message)
        throw error
      }
    }

    if (!analysis) {
      throw new Error('All AI providers failed to generate multimodal analysis')
    }

    // Generate confidence score based on data completeness
    const dataCompleteness = calculateDataCompleteness({
      telemetryData,
      trackLayout,
      weatherData,
      driverBehavior,
      raceContext
    })

    const confidenceScore = Math.min(95, 60 + (dataCompleteness * 35))

    console.log(`✅ Multimodal analysis complete - Confidence: ${confidenceScore}%`)

    return NextResponse.json({
      success: true,
      analysis,
      analysisType,
      metadata: {
        model: modelUsed,
        tokensUsed,
        confidenceScore: Math.round(confidenceScore),
        dataCompleteness: Math.round(dataCompleteness * 100),
        analysisDepth: analysisType,
        processingTime: Date.now(),
        provider: useGroq ? 'Groq (FREE)' : 'Gemini (FREE)'
      },
      recommendations: extractRecommendations(analysis),
      riskAssessment: analysisType === 'safety' ? extractRiskScores(analysis) : null
    })

  } catch (error: any) {
    console.error('❌ Multimodal analysis error:', error)
    return NextResponse.json({
      error: 'Multimodal analysis failed',
      message: error.message,
      details: error.toString()
    }, { status: 500 })
  }
}

function calculateDataCompleteness(data: any): number {
  const fields = [
    data.telemetryData,
    data.trackLayout,
    data.weatherData,
    data.driverBehavior,
    data.raceContext
  ]
  
  const completeness = fields.reduce((acc, field) => {
    if (!field) return acc
    const fieldKeys = Object.keys(field)
    const filledKeys = fieldKeys.filter(key => field[key] !== null && field[key] !== undefined && field[key] !== 'Unknown')
    return acc + (filledKeys.length / fieldKeys.length)
  }, 0)
  
  return completeness / fields.length
}

function extractRecommendations(analysis: string): string[] {
  const recommendations: string[] = []
  const lines = analysis.split('\n')
  
  for (const line of lines) {
    if (line.includes('recommend') || line.includes('suggest') || line.includes('should')) {
      const cleaned = line.replace(/^\d+\.\s*/, '').replace(/^[-*]\s*/, '').trim()
      if (cleaned.length > 10) {
        recommendations.push(cleaned)
      }
    }
  }
  
  return recommendations.slice(0, 5) // Top 5 recommendations
}

function extractRiskScores(analysis: string): any {
  const riskPattern = /risk.*?(\d+(?:\.\d+)?)/gi
  const matches = analysis.match(riskPattern)
  
  return {
    overallRisk: matches ? Math.max(...matches.map(m => parseFloat(m.match(/\d+(?:\.\d+)?/)?.[0] || '0'))) : 0,
    riskFactors: matches?.slice(0, 3) || []
  }
}
