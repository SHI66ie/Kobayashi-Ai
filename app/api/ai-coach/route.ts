import { NextRequest, NextResponse } from 'next/server'
import { getAICompletion } from '../../../lib/ai-service'
import { addMemoryEntry, getRecentContext } from '../../../lib/memory'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const { driverName, lapTimes, raceResults, telemetry, track, weather }: any = await request.json()

    // 1. Get memory context
    const pastContext = getRecentContext(3);

    // Analyze driver performance
    const safeLapTimes = Array.isArray(lapTimes) ? lapTimes : []
    const parsedTimes = safeLapTimes
      .map((l: any) => parseFloat(l.lapTime || l.time || '0'))
      .filter((t) => Number.isFinite(t) && t > 0)

    const bestLap = parsedTimes.length ? Math.min(...parsedTimes) : null
    const worstLap = parsedTimes.length ? Math.max(...parsedTimes) : null
    const consistency = bestLap !== null && worstLap !== null ? worstLap - bestLap : null

    const bestLapStr = bestLap !== null ? `${bestLap.toFixed(3)}s` : 'N/A'
    const worstLapStr = worstLap !== null ? `${worstLap.toFixed(3)}s` : 'N/A'
    const consistencyStr = consistency !== null ? `${consistency.toFixed(3)}s` : 'N/A'

    const prompt = `You are a professional F1 racing coach.
DRIVER: ${driverName || 'Primary Driver'}
TRACK: ${track}
BEST LAP: ${bestLapStr}
CONSISTENCY: ${consistencyStr}
WEATHER: ${JSON.stringify(weather)}

PAST COACHING SESSIONS (Memory):
${pastContext}

TASK: Provide a technical coaching report.
1. **Strengths**
2. **Improvement Areas**
3. **Consistency Tips**
4. **Logical Deduction from Past Sessions**
`;

    const aiResponse = await getAICompletion(prompt, "You are a professional F1 Coach. Be specific, technical, and use racing terminology.");

    // 2. Save prediction to memory
    addMemoryEntry({
      input: { driver: driverName, track, bestLap: bestLapStr },
      prediction: aiResponse.content
    });

    return NextResponse.json({
      success: true,
      coaching: aiResponse.content,
      driverStats: {
        bestLap: bestLapStr,
        worstLap: worstLapStr,
        consistency: consistencyStr,
        totalLaps: safeLapTimes.length
      },
      metadata: {
        model: aiResponse.model,
        provider: aiResponse.provider,
        confidence: 'high'
      }
    })

  } catch (error: any) {
    console.error('❌ Coaching generation error:', error)
    return NextResponse.json({
      error: 'Coaching failed',
      message: error.message
    }, { status: 500 })
  }
}
