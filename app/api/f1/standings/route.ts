import { NextRequest, NextResponse } from 'next/server'

// F1 Standings API endpoint
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const season = searchParams.get('season') || '2026'
    const type = searchParams.get('type') || 'drivers' // 'drivers' or 'constructors'

    // Fetch race results to calculate standings
    const raceResultsResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/f1/race-results?season=${season}`)
    const raceData = await raceResultsResponse.json()
    
    if (!raceData.success) {
      throw new Error('Failed to fetch race results')
    }

    const completedRaces = raceData.races.filter((race: any) => race.status === 'completed')
    
    // Calculate driver standings based on race results
    const driverPointsMap = new Map<string, { 
      driver: string, 
      team: string, 
      nationality: string, 
      countryFlag: string, 
      points: number, 
      wins: number, 
      podiums: number 
    }>()

    // Initialize all drivers
    const allDrivers = [
      { driver: 'G. Russell', team: 'Mercedes', nationality: 'United Kingdom', countryFlag: '🇬🇧' },
      { driver: 'A.K. Antonelli', team: 'Mercedes', nationality: 'Italy', countryFlag: '🇮🇹' },
      { driver: 'C. Leclerc', team: 'Ferrari', nationality: 'Monaco', countryFlag: '🇲🇨' },
      { driver: 'L. Hamilton', team: 'Ferrari', nationality: 'United Kingdom', countryFlag: '🇬🇧' },
      { driver: 'L. Norris', team: 'McLaren', nationality: 'United Kingdom', countryFlag: '🇬🇧' },
      { driver: 'M. Verstappen', team: 'Red Bull', nationality: 'Netherlands', countryFlag: '🇳🇱' },
      { driver: 'O. Bearman', team: 'Haas', nationality: 'United Kingdom', countryFlag: '🇬🇧' },
      { driver: 'A. Lindblad', team: 'RB', nationality: 'United Kingdom', countryFlag: '🇬🇧' },
      { driver: 'G. Bortoleto', team: 'Audi', nationality: 'Brazil', countryFlag: '🇧🇷' },
      { driver: 'P. Gasly', team: 'Alpine', nationality: 'France', countryFlag: '🇫🇷' },
      { driver: 'E. Ocon', team: 'Haas', nationality: 'France', countryFlag: '🇫🇷' },
      { driver: 'A. Albon', team: 'Williams', nationality: 'Thailand', countryFlag: '🇹🇭' },
      { driver: 'L. Lawson', team: 'RB', nationality: 'New Zealand', countryFlag: '🇳🇿' },
      { driver: 'F. Colapinto', team: 'Alpine', nationality: 'Argentina', countryFlag: '🇦🇷' },
      { driver: 'C. Sainz Jr.', team: 'Williams', nationality: 'Spain', countryFlag: '🇪🇸' },
      { driver: 'S. Pérez', team: 'Cadillac', nationality: 'Mexico', countryFlag: '🇲🇽' },
      { driver: 'I. Hadjar', team: 'Red Bull', nationality: 'France', countryFlag: '🇫🇷' },
      { driver: 'O. Piastri', team: 'McLaren', nationality: 'Australia', countryFlag: '🇦🇺' },
      { driver: 'N. Hülkenberg', team: 'Audi', nationality: 'Germany', countryFlag: '🇩🇪' },
      { driver: 'F. Alonso', team: 'Aston Martin', nationality: 'Spain', countryFlag: '🇪🇸' },
      { driver: 'V. Bottas', team: 'Cadillac', nationality: 'Finland', countryFlag: '🇫🇮' }
    ]

    // Initialize driver stats
    allDrivers.forEach(driver => {
      driverPointsMap.set(driver.driver, {
        ...driver,
        points: 0,
        wins: 0,
        podiums: 0
      })
    })

    // Calculate points from completed races
    completedRaces.forEach((race: any) => {
      race.results.forEach((result: any) => {
        const driverStats = driverPointsMap.get(result.driver)
        if (driverStats) {
          driverStats.points += result.points
          if (result.position === 1) driverStats.wins++
          if (result.position <= 3) driverStats.podiums++
        }
      })
    })

    // Convert to array and sort by points
    const driverStandings = Array.from(driverPointsMap.values())
      .sort((a, b) => b.points - a.points)
      .map((driver, index) => ({
        ...driver,
        position: index + 1,
        driverCode: driver.driver.split(' ').map((n: string) => n[0]).join(''),
        image: `/api/f1/driver-image/${driver.driver.toLowerCase().replace(' ', '-').replace('.', '')}`
      }))

    if (type === 'drivers') {
      return NextResponse.json({
        success: true,
        season,
        type: 'drivers',
        lastUpdated: new Date().toISOString(),
        completedRaces: completedRaces.length,
        nextRace: raceData.nextRace,
        standings: driverStandings,
        totalDrivers: driverStandings.length
      })
    }

    // Calculate constructor standings
    const constructorPointsMap = new Map<string, {
      team: string,
      nationality: string,
      countryFlag: string,
      points: number,
      wins: number,
      podiums: number,
      drivers: string[]
    }>()

    // Initialize constructors
    const constructors = [
      { team: 'Mercedes', nationality: 'Germany', countryFlag: '🇩🇪' },
      { team: 'Ferrari', nationality: 'Italy', countryFlag: '🇮🇹' },
      { team: 'McLaren', nationality: 'United Kingdom', countryFlag: '🇬🇧' },
      { team: 'Red Bull', nationality: 'Austria', countryFlag: '🇦🇹' },
      { team: 'Haas', nationality: 'United States', countryFlag: '🇺🇸' },
      { team: 'RB', nationality: 'Italy', countryFlag: '🇮🇹' },
      { team: 'Audi', nationality: 'Germany', countryFlag: '🇩🇪' },
      { team: 'Alpine', nationality: 'France', countryFlag: '🇫🇷' },
      { team: 'Williams', nationality: 'United Kingdom', countryFlag: '🇬🇧' },
      { team: 'Cadillac', nationality: 'United States', countryFlag: '🇺🇸' },
      { team: 'Aston Martin', nationality: 'United Kingdom', countryFlag: '🇬🇧' }
    ]

    constructors.forEach(constructor => {
      constructorPointsMap.set(constructor.team, {
        ...constructor,
        points: 0,
        wins: 0,
        podiums: 0,
        drivers: []
      })
    })

    // Calculate constructor points from driver standings
    driverStandings.forEach(driver => {
      const constructorStats = constructorPointsMap.get(driver.team)
      if (constructorStats) {
        constructorStats.points += driver.points
        constructorStats.wins += driver.wins
        constructorStats.podiums += driver.podiums
        constructorStats.drivers.push(driver.driver)
      }
    })

    // Convert to array and sort by points
    const constructorStandings = Array.from(constructorPointsMap.values())
      .sort((a, b) => b.points - a.points)
      .map((constructor, index) => ({
        ...constructor,
        position: index + 1
      }))

    if (type === 'constructors') {
      return NextResponse.json({
        success: true,
        season,
        type: 'constructors',
        lastUpdated: new Date().toISOString(),
        completedRaces: completedRaces.length,
        nextRace: raceData.nextRace,
        standings: constructorStandings,
        totalTeams: constructorStandings.length
      })
    }

  } catch (error) {
    console.error('Error fetching F1 standings:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch standings data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST endpoint for updating standings (admin use)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { season, type, standings } = body

    // Validate the request
    if (!season || !type || !standings) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: season, type, standings' },
        { status: 400 }
      )
    }

    // In a real implementation, this would update a database
    // For now, just return success
    return NextResponse.json({
      success: true,
      message: 'Standings updated successfully',
      season,
      type,
      updatedCount: standings.length
    })

  } catch (error) {
    console.error('Error updating F1 standings:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update standings',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
