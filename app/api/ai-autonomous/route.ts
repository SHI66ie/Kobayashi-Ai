import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const dynamic = 'force-dynamic'
export const maxDuration = 180

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

// Autonomous Racing AI inspired by cutting-edge research (fallback)
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
      sensorData,
      vehicleState,
      trackMap,
      trafficData,
      missionGoal,
      safetyConstraints,
      mode = 'autonomous_racing'
    }: any = await request.json()

    if (!groq && !gemini) {
      return NextResponse.json({
        error: 'Autonomous AI not configured',
        message: 'Add GROQ_API_KEY (recommended) or GEMINI_API_KEY to enable autonomous racing AI'
      }, { status: 503 })
    }

    const useGroq = groq !== null
    console.log(`🤖 Using ${useGroq ? 'Groq' : 'Gemini'} for Autonomous Racing AI...`)

    // Create autonomous driving context inspired by research papers
    const autonomousContext = `
AUTONOMOUS RACING AI SYSTEM v2.0
=================================
Inspired by: Wayve's "Driving with LLMs", Talk2Drive, and DriveLikeAHuman research

SENSOR FUSION DATA:
- LiDAR: ${sensorData?.lidar ? 'Active' : 'Inactive'}
- Camera: ${sensorData?.camera ? 'Active' : 'Inactive'}  
- Radar: ${sensorData?.radar ? 'Active' : 'Inactive'}
- GPS: ${sensorData?.gps || 'Unknown'}
- IMU: ${sensorData?.imu || 'Unknown'}

VEHICLE STATE:
- Speed: ${vehicleState?.speed || 0} km/h
- Position: ${vehicleState?.position || 'Unknown'}
- Heading: ${vehicleState?.heading || 0}°
- Acceleration: ${vehicleState?.acceleration || 'Unknown'}
- Steering Angle: ${vehicleState?.steeringAngle || 0}°
- Brake Pressure: ${vehicleState?.brakesPressure || 0}%
- Throttle Position: ${vehicleState?.throttlePosition || 0}%

TRACK MAPPING:
- Track Width: ${trackMap?.width || 'Unknown'}m
- Racing Line: ${trackMap?.racingLine || 'Calculating...'}
- Upcoming Corners: ${JSON.stringify(trackMap?.upcomingCorners || [])}
- Track Limits: ${trackMap?.trackLimits || 'Unknown'}
- DRS Zones: ${JSON.stringify(trackMap?.drsZones || [])}

TRAFFIC ANALYSIS:
- Nearby Vehicles: ${trafficData?.nearbyVehicles?.length || 0}
- Overtaking Opportunities: ${trafficData?.overtakingOpportunities || 'Analyzing...'}
- Safety Gaps: ${JSON.stringify(trafficData?.safetyGaps || {})}

MISSION PARAMETERS:
- Primary Goal: ${missionGoal?.primary || 'Optimize lap time'}
- Secondary Goal: ${missionGoal?.secondary || 'Maintain safety'}
- Target Position: ${missionGoal?.targetPosition || 'Best possible'}
- Risk Tolerance: ${missionGoal?.riskTolerance || 'Medium'}

SAFETY CONSTRAINTS:
- Max G-Force: ${safetyConstraints?.maxGForce || 2.5}g
- Min Following Distance: ${safetyConstraints?.minFollowingDistance || 2.0}s
- Track Limits Enforcement: ${safetyConstraints?.trackLimitsEnforcement || 'Strict'}
`

    let systemPrompt = ''
    
    switch (mode) {
      case 'autonomous_racing':
        systemPrompt = `You are an advanced Autonomous Racing AI system, combining the best of:
- Wayve's explainable autonomous driving with LLMs
- Talk2Drive's natural language vehicle control
- DriveLikeAHuman's human-like decision making
- World model-based prediction and planning

Your capabilities:
1. **Perception & Understanding**: Process multi-modal sensor data and understand racing scenarios
2. **Explainable Decision Making**: Provide clear reasoning for every action
3. **Predictive Planning**: Forecast multiple future scenarios and optimal paths
4. **Human-like Racing**: Apply racing intuition and experience-based decisions
5. **Real-time Adaptation**: Continuously adjust strategy based on changing conditions

Generate:
1. **Immediate Actions**: Steering, throttle, brake commands with confidence scores
2. **Reasoning**: Detailed explanation of decision-making process
3. **Predictions**: 3-second lookahead with probability assessments
4. **Risk Assessment**: Safety evaluation of planned actions
5. **Alternative Strategies**: Backup plans if primary strategy fails

Format as structured JSON with numerical values and confidence percentages.`
        break

      case 'pit_crew_ai':
        systemPrompt = `You are an AI Pit Crew Chief with autonomous decision-making capabilities.

Responsibilities:
1. **Strategy Optimization**: Real-time strategy adjustments
2. **Pit Stop Coordination**: Optimal timing and execution
3. **Risk Management**: Safety-first decision making
4. **Communication**: Clear, concise instructions to driver
5. **Data Analysis**: Continuous performance monitoring

Provide pit strategy recommendations with timing, reasoning, and risk assessment.`
        break

      case 'race_engineer':
        systemPrompt = `You are an AI Race Engineer with deep technical knowledge.

Focus areas:
1. **Vehicle Dynamics**: Setup optimization and handling analysis
2. **Performance Analysis**: Lap time improvement opportunities
3. **Technical Strategy**: Tire management and fuel optimization
4. **Problem Solving**: Diagnose and resolve technical issues
5. **Driver Coaching**: Specific technique improvements

Deliver technical insights with precise recommendations and data-driven analysis.`
        break

      default:
        systemPrompt = `You are a comprehensive Autonomous Racing AI system.`
    }

    const fullPrompt = `${autonomousContext}

${systemPrompt}

CURRENT SITUATION ANALYSIS:
Based on the provided sensor data, vehicle state, and track conditions, analyze the current racing scenario and provide:

1. **Immediate Action Plan** (next 1-3 seconds):
   - Steering input: [value] degrees (confidence: [%])
   - Throttle input: [value]% (confidence: [%])
   - Brake input: [value]% (confidence: [%])
   - Gear selection: [value] (if applicable)

2. **Tactical Reasoning**:
   - Why these actions are optimal
   - Risk assessment (1-10 scale)
   - Alternative options considered

3. **Strategic Lookahead** (next 5-15 seconds):
   - Predicted vehicle trajectory
   - Anticipated challenges
   - Contingency plans

4. **Performance Optimization**:
   - Current lap time prediction
   - Improvement opportunities
   - Setup recommendations

5. **Safety Assessment**:
   - Current safety level (1-10)
   - Potential hazards identified
   - Mitigation strategies

Respond with precise, actionable guidance as if you're an expert autonomous racing system making real-time decisions.`

    let analysis = ''
    let tokensUsed = 0
    let modelUsed = ''

    // Try Groq first (FREE & FAST)
    if (useGroq && groq) {
      try {
        const completion = await groq.chat.completions.create({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: 'You are an expert autonomous racing AI system. Provide precise, actionable real-time racing decisions.' },
            { role: 'user', content: fullPrompt }
          ],
          temperature: 0.3,
          max_tokens: 5000
        })
        analysis = completion.choices[0]?.message?.content || ''
        modelUsed = 'llama-3.1-8b-instant (Groq)'
        tokensUsed = completion.usage?.total_tokens || 0
      } catch (error: any) {
        console.error('Groq autonomous error:', error.message)
      }
    }

    // Fall back to Gemini if Groq failed
    if (!analysis && gemini) {
      try {
        const model = gemini.getGenerativeModel({ model: 'gemini-1.5-flash-latest' })
        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 5000,
            topP: 0.7,
            topK: 30
          }
        })
        analysis = result.response.text()
        modelUsed = 'gemini-1.5-flash-latest'
        tokensUsed = result.response.usageMetadata?.totalTokenCount || 0
      } catch (error: any) {
        console.error('Gemini autonomous error:', error.message)
        throw error
      }
    }

    if (!analysis) {
      throw new Error('All AI providers failed to generate autonomous analysis')
    }

    // Extract structured data from response
    const actionPlan = extractActionPlan(analysis)
    const riskAssessment = extractRiskAssessment(analysis)
    const predictions = extractPredictions(analysis)

    console.log(`🏁 Autonomous racing analysis complete`)

    return NextResponse.json({
      success: true,
      mode,
      analysis,
      actionPlan,
      riskAssessment,
      predictions,
      metadata: {
        model: modelUsed,
        tokensUsed,
        processingTime: Date.now(),
        systemMode: mode,
        safetyLevel: riskAssessment.safetyLevel || 8,
        provider: useGroq ? 'Groq (FREE)' : 'Gemini (FREE)'
      }
    })

  } catch (error: any) {
    console.error('❌ Autonomous AI error:', error)
    return NextResponse.json({
      error: 'Autonomous AI analysis failed',
      message: error.message,
      details: error.toString()
    }, { status: 500 })
  }
}

function extractActionPlan(analysis: string): any {
  // Extract steering, throttle, brake values from analysis
  const steeringMatch = analysis.match(/steering.*?(-?\d+(?:\.\d+)?)/i)
  const throttleMatch = analysis.match(/throttle.*?(\d+(?:\.\d+)?)/i)
  const brakeMatch = analysis.match(/brake.*?(\d+(?:\.\d+)?)/i)
  
  return {
    steering: steeringMatch ? parseFloat(steeringMatch[1]) : 0,
    throttle: throttleMatch ? parseFloat(throttleMatch[1]) : 0,
    brake: brakeMatch ? parseFloat(brakeMatch[1]) : 0,
    timestamp: Date.now()
  }
}

function extractRiskAssessment(analysis: string): any {
  const riskMatch = analysis.match(/risk.*?(\d+(?:\.\d+)?)/i)
  const safetyMatch = analysis.match(/safety.*?(\d+(?:\.\d+)?)/i)
  
  return {
    riskLevel: riskMatch ? parseFloat(riskMatch[1]) : 5,
    safetyLevel: safetyMatch ? parseFloat(safetyMatch[1]) : 8,
    hazards: extractHazards(analysis)
  }
}

function extractPredictions(analysis: string): any {
  return {
    lapTimePrediction: extractLapTime(analysis),
    trajectoryConfidence: 85,
    nextActions: extractNextActions(analysis)
  }
}

function extractHazards(analysis: string): string[] {
  const hazardKeywords = ['hazard', 'danger', 'risk', 'collision', 'obstacle']
  const lines = analysis.split('\n')
  const hazards: string[] = []
  
  for (const line of lines) {
    for (const keyword of hazardKeywords) {
      if (line.toLowerCase().includes(keyword)) {
        hazards.push(line.trim())
        break
      }
    }
  }
  
  return hazards.slice(0, 3)
}

function extractLapTime(analysis: string): string {
  const timeMatch = analysis.match(/(\d+:\d+\.\d+)/i)
  return timeMatch ? timeMatch[1] : 'Calculating...'
}

function extractNextActions(analysis: string): string[] {
  const actionKeywords = ['next', 'then', 'after', 'following']
  const lines = analysis.split('\n')
  const actions: string[] = []
  
  for (const line of lines) {
    for (const keyword of actionKeywords) {
      if (line.toLowerCase().includes(keyword)) {
        actions.push(line.trim())
        break
      }
    }
  }
  
  return actions.slice(0, 3)
}
