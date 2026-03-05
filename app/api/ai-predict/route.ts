import { NextRequest, NextResponse } from 'next/server'
import { getAICompletion } from '../../../lib/ai-service'
import { addMemoryEntry, getRecentContext } from '../../../lib/memory'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const { lapTimes, currentLap, driverData, weather, track } = await request.json()

    // 1. Get memory context
    const pastContext = getRecentContext(3);

    // Prepare recent lap data
    const recentLaps = lapTimes?.slice(-10) || []
    const avgLapTime = recentLaps.reduce((sum: number, lap: any) =>
      sum + parseFloat(lap.lapTime || lap.time || 0), 0) / (recentLaps.length || 1)

    const prompt = `You are an expert F1 race strategist.
TRACK: ${track}
LAP: ${currentLap}
DRIVER: ${driverData?.name || 'Unknown'} (P${driverData?.position || 'N/A'})
WEATHER: ${JSON.stringify(weather)}
AVG LAP: ${avgLapTime.toFixed(3)}s
RECENT LAPS: ${recentLaps.map((l: any) => l.lapTime || l.time).join(', ')}

PAST PREDICTIONS (Memory):
${pastContext}

TASK: Predict the next 3 laps. provide a detailed tactical report.
1. **Summary**
2. **Next 3 Laps**
3. **Strategic Recommendation**
4. **Logical Reasoning & Past Learnings**
`;

    const aiResponse = await getAICompletion(prompt, "You are a professional F1 Race Engineer. Be logical, precise, and learn from past records.");

    // 2. Save prediction to memory
    addMemoryEntry({
      input: { track, currentLap, driver: driverData?.name },
      prediction: aiResponse.content
    });

    return NextResponse.json({
      success: true,
      prediction: aiResponse.content,
      metadata: {
        model: aiResponse.model,
        provider: aiResponse.provider,
        currentLap,
        avgLapTime: avgLapTime.toFixed(3),
        confidence: 'high'
      }
    })

  } catch (error: any) {
    console.error('❌ AI prediction error:', error)
    return NextResponse.json({
      error: 'Prediction failed',
      message: error.message
    }, { status: 500 })
  }
}
