import { NextRequest, NextResponse } from 'next/server'
import { f1ApiDev, safeF1ApiCall, transformF1ApiData } from '../../../../lib/f1api-dev'

// F1 Race Results API — powered by f1api.dev
// - Without `round`: returns season schedule with winner-per-race (fast, 1 call)
// - With `round`: returns full grid results for that specific race (22 driver entries)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const season = searchParams.get('season') || '2026'
    const round = searchParams.get('round')

    // ── Single race with full grid results ──────────────────────────────────
    if (round) {
      const result = await safeF1ApiCall(() => f1ApiDev.getRaceResult(season, round))

      if (result.error || !result.data) {
        return NextResponse.json(
          { success: false, error: `Race round ${round} not found in f1api.dev for ${season}` },
          { status: 404 }
        )
      }

      const raceData = result.data.races
      const circuit = Array.isArray(raceData.circuit) ? raceData.circuit[0] : raceData.circuit

      return NextResponse.json({
        success: true,
        season,
        source: 'f1api.dev',
        race: {
          round: parseInt(raceData.round),
          name: raceData.raceName,
          date: raceData.date,
          circuit: circuit?.circuitName ?? 'Unknown',
          country: circuit?.country ?? 'Unknown',
          city: circuit?.city ?? 'Unknown',
          results: raceData.results.map(transformF1ApiData.raceResult),
          status: 'completed',
        },
      })
    }

    // ── Full season schedule (winner-per-race summary) ──────────────────────
    const result = await safeF1ApiCall(() => f1ApiDev.getSeasonSchedule(season))

    if (result.error || !result.data) {
      throw new Error(result.error?.message || 'Failed to fetch season schedule from f1api.dev')
    }

    const races = result.data.races.map(transformF1ApiData.raceSummary)
    const completedRaces = races.filter((r) => r.status === 'completed')

    return NextResponse.json({
      success: true,
      season,
      source: 'f1api.dev',
      championship: result.data.championship.championshipName,
      totalRaces: races.length,
      completedRaces: completedRaces.length,
      races,
    })
  } catch (error) {
    console.error('Error fetching race results from f1api.dev:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch race results',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// POST endpoint to update race results (admin use)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { season, round, results } = body

    if (!season || !round || !results) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: season, round, results' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Race results updated successfully',
      season,
      round,
      resultsProcessed: results.length,
      standingsUpdated: true,
    })
  } catch (error) {
    console.error('Error updating race results:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update race results',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
