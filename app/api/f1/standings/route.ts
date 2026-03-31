import { NextRequest, NextResponse } from 'next/server'

// F1 Standings API endpoint
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const season = searchParams.get('season') || '2026'
    const type = searchParams.get('type') || 'drivers' // 'drivers' or 'constructors'

    if (type === 'drivers') {
      const response = await fetch(`http://api.jolpi.ca/ergast/f1/${season}/driverStandings.json`, { cache: 'no-store' })
      const data = await response.json()
      
      const standingsList = data.MRData?.StandingsTable?.StandingsLists?.[0] || { DriverStandings: [] }
      const driverStandings = standingsList.DriverStandings.map((s: any) => ({
        position: parseInt(s.position),
        points: parseFloat(s.points),
        wins: parseInt(s.wins),
        driver: `${s.Driver.givenName} ${s.Driver.familyName}`,
        driverCode: s.Driver.code || s.Driver.familyName.substring(0, 3).toUpperCase(),
        team: s.Constructors?.[0]?.name || 'Unknown',
        nationality: s.Driver.nationality,
        countryFlag: s.Driver.nationality === 'British' ? '🇬🇧' : s.Driver.nationality === 'Monégasque' ? '🇲🇨' : s.Driver.nationality === 'Italian' ? '🇮🇹' : '' // Fallback map could be added
      }))

      return NextResponse.json({
        success: true,
        season,
        type: 'drivers',
        lastUpdated: new Date().toISOString(),
        standings: driverStandings,
        totalDrivers: driverStandings.length
      })
    } else {
      const response = await fetch(`http://api.jolpi.ca/ergast/f1/${season}/constructorStandings.json`, { cache: 'no-store' })
      const data = await response.json()

      const standingsList = data.MRData?.StandingsTable?.StandingsLists?.[0] || { ConstructorStandings: [] }
      const constructorStandings = standingsList.ConstructorStandings.map((s: any) => ({
        position: parseInt(s.position),
        points: parseFloat(s.points),
        wins: parseInt(s.wins),
        team: s.Constructor.name,
        nationality: s.Constructor.nationality
      }))

      return NextResponse.json({
        success: true,
        season,
        type: 'constructors',
        lastUpdated: new Date().toISOString(),
        standings: constructorStandings,
        totalTeams: constructorStandings.length
      })
    }
  } catch (error) {
    console.error('Error fetching F1 standings from Jolpica:', error)
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
