import { NextRequest, NextResponse } from 'next/server'

// F1 Race Results API endpoint
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const season = searchParams.get('season') || '2026'
    const round = searchParams.get('round')

    const response = await fetch(`http://api.jolpi.ca/ergast/f1/${season}/results.json`)
    const data = await response.json()
    
    let races = []
    if (data.MRData?.RaceTable?.Races) {
      races = data.MRData.RaceTable.Races.map((race: any) => ({
        round: parseInt(race.round),
        name: race.raceName,
        date: race.date,
        circuit: race.Circuit?.circuitName,
        results: race.Results?.map((res: any) => ({
          position: parseInt(res.position),
          driver: `${res.Driver.givenName?.charAt(0) || ''}. ${res.Driver.familyName}`,
          team: res.Constructor?.name,
          points: parseFloat(res.points),
          status: res.status
        })) || [],
        status: 'completed'
      }))
    }

    if (round) {
      const specificRace = races.find((race: any) => race.round === parseInt(round))
      if (!specificRace) {
        return NextResponse.json(
          { success: false, error: 'Race not found in Jolpica dataset' },
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
      totalRaces: races.length,
      completedRaces: races.length, 
      races: races
    })

  } catch (error) {
    console.error('Error fetching race results from Jolpica:', error)
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
