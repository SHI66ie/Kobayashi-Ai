import { NextRequest, NextResponse } from 'next/server'
import { getAICompletion } from '../../../lib/ai-service'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const { message, contextData } = await request.json()

    // Enhanced context with live tire and track data
    const enhancedContext = {
      tireCompounds: ['C1', 'C2', 'C3', 'C4', 'C5', 'Intermediate', 'Wet'],
      selectedTire: contextData?.tireCompound || 'C3',
      trackTemp: contextData?.trackTemp || 35,
      airTemp: contextData?.airTemp || 25,
      humidity: contextData?.humidity || 50,
      trackCondition: contextData?.trackCondition || 'dry',
      track: contextData?.track || 'Monaco',
      currentDriver: contextData?.currentDriver || 'Max Verstappen',
      position: contextData?.position || 1,
      telemetry: contextData?.telemetry || {}
    }

    const prompt = `You are KobayashiAI, an expert F1 analyst with access to live tire and track data. You have deep knowledge of F1 strategy, tire compounds, driver performance, and race conditions.

CURRENT RACE CONTEXT:
- Track: ${enhancedContext.track}
- Track Temperature: ${enhancedContext.trackTemp}°C
- Air Temperature: ${enhancedContext.airTemp}°C
- Humidity: ${enhancedContext.humidity}%
- Track Condition: ${enhancedContext.trackCondition}
- Current Tire Compound: ${enhancedContext.selectedTire}
- Available Compounds: ${enhancedContext.tireCompounds.join(', ')}
- Driver: ${enhancedContext.currentDriver}
- Position: ${enhancedContext.position}

LIVE TELEMETRY DATA:
- Speed: ${enhancedContext.telemetry.speed || 280} km/h
- RPM: ${enhancedContext.telemetry.rpm || 15000}
- Throttle: ${enhancedContext.telemetry.throttle || 85}%
- Brake: ${enhancedContext.telemetry.brake || 15}%
- DRS: ${enhancedContext.telemetry.drs ? 'Active' : 'Inactive'}

USER QUESTION: ${message}

Provide a detailed, expert analysis using the live data above. Consider:
1. Current tire compound performance in these conditions
2. Track condition effects on grip and degradation
3. Weather impact on strategy and tire wear
4. Driver performance based on telemetry data
5. Strategic recommendations for compound selection
6. Pit stop timing considerations

Use proper F1 terminology and be specific with your recommendations. Focus on actionable insights based on the real-time data available.`

    const aiResponse = await getAICompletion(
      prompt,
      "You are KobayashiAI, a professional F1 Race Strategist and Analyst. Be precise, data-driven, and provide actionable insights based on live telemetry and track conditions."
    )

    return NextResponse.json({
      success: true,
      response: aiResponse.content,
      context: enhancedContext,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('AI Chat Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process AI request',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
