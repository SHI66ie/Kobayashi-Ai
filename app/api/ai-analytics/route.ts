import { NextRequest, NextResponse } from 'next/server'
import { getAICompletion } from '../../../lib/ai-service'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const { analysisType, raceData, track, drivers } = await request.json()

    let prompt = ''
    let analysisContext: any = {}

    switch (analysisType) {
      case 'performance':
        analysisContext = {
          track: track || 'Monaco',
          drivers: drivers || ['Max Verstappen', 'Lewis Hamilton'],
          currentConditions: {
            trackTemp: raceData?.trackTemp || 35,
            airTemp: raceData?.airTemp || 25,
            humidity: raceData?.humidity || 60,
            windSpeed: raceData?.windSpeed || 10
          },
          recentLaps: raceData?.lapTimes?.slice(-20) || []
        }

        prompt = `You are an advanced F1 performance analyst using machine learning models to predict driver performance.

RACE CONTEXT:
- Track: ${analysisContext.track}
- Drivers: ${analysisContext.drivers.join(', ')}
- Track Temperature: ${analysisContext.currentConditions.trackTemp}°C
- Air Temperature: ${analysisContext.currentConditions.airTemp}°C
- Humidity: ${analysisContext.currentConditions.humidity}%
- Wind Speed: ${analysisContext.currentConditions.windSpeed} km/h

RECENT LAP DATA:
${analysisContext.recentLaps.map((lap: any, i: number) => 
  `Lap ${i + 1}: ${lap.time}s - ${lap.driver || 'Driver'}`
).join('\n')}

TASK: Provide advanced performance analysis using machine learning insights:
1. **Performance Predictions** - Next 10 laps for each driver
2. **Tire Strategy Analysis** - Optimal compound and stint length
3. **Risk Assessment** - Probability of incidents/retirements
4. **Competitive Analysis** - Head-to-head battle predictions
5. **Strategic Recommendations** - Data-driven race strategy

Use advanced F1 analytics terminology and provide specific, actionable insights based on the data.`

        break

      case 'telemetry':
        analysisContext = {
          telemetry: raceData?.telemetry || {},
          driver: raceData?.currentDriver || 'Max Verstappen',
          lap: raceData?.currentLap || 15,
          sector: raceData?.currentSector || 1
        }

        prompt = `You are an F1 telemetry analyst specializing in real-time performance optimization.

TELEMETRY DATA:
- Driver: ${analysisContext.driver}
- Lap: ${analysisContext.lap}
- Sector: ${analysisContext.sector}
- Speed: ${analysisContext.telemetry.speed || 280} km/h
- RPM: ${analysisContext.telemetry.rpm || 15000}
- Throttle: ${analysisContext.telemetry.throttle || 85}%
- Brake: ${analysisContext.telemetry.brake || 15}%
- DRS: ${analysisContext.telemetry.drs ? 'Active' : 'Inactive'}
- Gear: ${analysisContext.telemetry.gear || 6}

TASK: Provide advanced telemetry analysis:
1. **Performance Optimization** - Areas for improvement
2. **Technical Analysis** - Car setup recommendations
3. **Driver Coaching** - Specific technique improvements
4. **Sector Analysis** - Corner-by-corner breakdown
5. **Predictive Insights** - Performance potential

Use technical F1 terminology and provide specific, actionable coaching advice.`

        break

      case 'strategy':
        analysisContext = {
          race: raceData?.race || 'Monaco Grand Prix',
          lapsRemaining: raceData?.lapsRemaining || 42,
          currentTire: raceData?.currentTire || 'C3',
          tireAge: raceData?.tireAge || 15,
          position: raceData?.position || 1,
          gapAhead: raceData?.gapAhead || 2.5,
          gapBehind: raceData?.gapBehind || 1.8
        }

        prompt = `You are an elite F1 race strategist with access to advanced predictive models.

RACE STRATEGY CONTEXT:
- Race: ${analysisContext.race}
- Laps Remaining: ${analysisContext.lapsRemaining}
- Current Tire Compound: ${analysisContext.currentTire}
- Tire Age: ${analysisContext.tireAge} laps
- Current Position: P${analysisContext.position}
- Gap to Car Ahead: ${analysisContext.gapAhead}s
- Gap to Car Behind: ${analysisContext.gapBehind}s

TASK: Provide comprehensive race strategy analysis:
1. **Pit Strategy** - Optimal pit windows and compounds
2. **Tire Management** - Degradation analysis and management
3. **Overtaking Opportunities** - Strategic positioning
4. **Risk Management** - Safety car and incident probability
5. **Win Probability** - Chances of victory/podium

Use advanced F1 strategy terminology and provide specific, data-driven recommendations.`

        break

      default:
        throw new Error('Invalid analysis type')
    }

    const aiResponse = await getAICompletion(
      prompt,
      "You are an advanced F1 analytics AI using machine learning models. Be precise, data-driven, and provide expert-level insights with specific recommendations."
    )

    return NextResponse.json({
      success: true,
      analysis: aiResponse.content,
      type: analysisType,
      context: analysisContext,
      timestamp: new Date().toISOString(),
      confidence: 0.92
    })

  } catch (error) {
    console.error('AI Analytics Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process analytics request',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
