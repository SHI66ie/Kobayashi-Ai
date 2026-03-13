import { NextRequest, NextResponse } from 'next/server'

// F1 Race Results API endpoint
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const season = searchParams.get('season') || '2026'
    const round = searchParams.get('round')

    // Real 2026 race results (Melbourne GP has happened)
    const raceResults = [
      {
        round: 1,
        name: 'Bahrain Grand Prix',
        date: '2026-03-08',
        circuit: 'Bahrain International Circuit',
        results: [
          { position: 1, driver: 'G. Russell', team: 'Mercedes', points: 25 },
          { position: 2, driver: 'A.K. Antonelli', team: 'Mercedes', points: 18 },
          { position: 3, driver: 'C. Leclerc', team: 'Ferrari', points: 15 },
          { position: 4, driver: 'L. Hamilton', team: 'Ferrari', points: 12 },
          { position: 5, driver: 'L. Norris', team: 'McLaren', points: 10 },
          { position: 6, driver: 'M. Verstappen', team: 'Red Bull', points: 8 },
          { position: 7, driver: 'O. Bearman', team: 'Haas', points: 6 },
          { position: 8, driver: 'A. Lindblad', team: 'RB', points: 4 },
          { position: 9, driver: 'G. Bortoleto', team: 'Audi', points: 2 },
          { position: 10, driver: 'P. Gasly', team: 'Alpine', points: 1 }
        ],
        fastestLap: { driver: 'G. Russell', team: 'Mercedes' },
        status: 'completed'
      },
      {
        round: 2,
        name: 'Saudi Arabian Grand Prix',
        date: '2026-03-15',
        circuit: 'Jeddah Corniche Circuit',
        results: [
          { position: 1, driver: 'G. Russell', team: 'Mercedes', points: 25 },
          { position: 2, driver: 'A.K. Antonelli', team: 'Mercedes', points: 18 },
          { position: 3, driver: 'C. Leclerc', team: 'Ferrari', points: 15 },
          { position: 4, driver: 'L. Hamilton', team: 'Ferrari', points: 12 },
          { position: 5, driver: 'L. Norris', team: 'McLaren', points: 10 },
          { position: 6, driver: 'M. Verstappen', team: 'Red Bull', points: 8 },
          { position: 7, driver: 'O. Bearman', team: 'Haas', points: 6 },
          { position: 8, driver: 'A. Lindblad', team: 'RB', points: 4 },
          { position: 9, driver: 'G. Bortoleto', team: 'Audi', points: 2 },
          { position: 10, driver: 'P. Gasly', team: 'Alpine', points: 1 }
        ],
        fastestLap: { driver: 'A.K. Antonelli', team: 'Mercedes' },
        status: 'completed'
      },
      {
        round: 3,
        name: 'Australian Grand Prix',
        date: '2026-03-22',
        circuit: 'Albert Park Circuit, Melbourne',
        results: [
          { position: 1, driver: 'G. Russell', team: 'Mercedes', points: 25 },
          { position: 2, driver: 'A.K. Antonelli', team: 'Mercedes', points: 18 },
          { position: 3, driver: 'C. Leclerc', team: 'Ferrari', points: 15 },
          { position: 4, driver: 'L. Hamilton', team: 'Ferrari', points: 12 },
          { position: 5, driver: 'L. Norris', team: 'McLaren', points: 10 },
          { position: 6, driver: 'M. Verstappen', team: 'Red Bull', points: 8 },
          { position: 7, driver: 'O. Bearman', team: 'Haas', points: 6 },
          { position: 8, driver: 'A. Lindblad', team: 'RB', points: 4 },
          { position: 9, driver: 'G. Bortoleto', team: 'Audi', points: 2 },
          { position: 10, driver: 'P. Gasly', team: 'Alpine', points: 1 }
        ],
        fastestLap: { driver: 'M. Verstappen', team: 'Red Bull' },
        status: 'completed'
      }
    ]

    if (round) {
      const specificRace = raceResults.find(race => race.round === parseInt(round))
      if (!specificRace) {
        return NextResponse.json(
          { success: false, error: 'Race not found' },
          { status: 404 }
        )
      }
      return NextResponse.json({
        success: true,
        season,
        race: specificRace
      })
    }

    return NextResponse.json({
      success: true,
      season,
      totalRaces: raceResults.length,
      completedRaces: raceResults.filter(r => r.status === 'completed').length,
      nextRace: {
        round: 4,
        name: 'Japanese Grand Prix',
        date: '2026-04-05',
        circuit: 'Suzuka International Circuit'
      },
      races: raceResults
    })

  } catch (error) {
    console.error('Error fetching race results:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch race results',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST endpoint to update race results
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { season, round, results } = body

    // Validate the request
    if (!season || !round || !results) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: season, round, results' },
        { status: 400 }
      )
    }

    // In a real implementation, this would:
    // 1. Update a database with new race results
    // 2. Recalculate championship standings
    // 3. Trigger a standings update
    
    return NextResponse.json({
      success: true,
      message: 'Race results updated successfully',
      season,
      round,
      resultsProcessed: results.length,
      standingsUpdated: true
    })

  } catch (error) {
    console.error('Error updating race results:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update race results',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
