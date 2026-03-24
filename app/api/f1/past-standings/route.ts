import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const season = searchParams.get('season') || '2025'
    const type = searchParams.get('type') || 'drivers' // 'drivers' or 'constructors'

    if (type === 'drivers') {
      const response = await fetch(`http://api.jolpi.ca/ergast/f1/${season}/driverStandings.json`, {
        next: { revalidate: 3600 } // cache 1h
      })
      if (!response.ok) throw new Error(`Jolpica error: ${response.status}`)
      const data = await response.json()

      const standingsList = data.MRData?.StandingsTable?.StandingsLists?.[0]
      if (!standingsList) {
        return NextResponse.json({ success: false, error: 'No standings data for this season' }, { status: 404 })
      }

      const standings = standingsList.DriverStandings.map((s: any) => ({
        position: parseInt(s.position),
        points: parseFloat(s.points),
        wins: parseInt(s.wins),
        driver: `${s.Driver.givenName} ${s.Driver.familyName}`,
        driverCode: s.Driver.code || s.Driver.familyName.substring(0, 3).toUpperCase(),
        driverId: s.Driver.driverId,
        team: s.Constructors?.[0]?.name || 'Unknown',
        nationality: s.Driver.nationality,
      }))

      return NextResponse.json({
        success: true,
        season,
        type: 'drivers',
        round: standingsList.round,
        standings,
      })
    } else {
      const response = await fetch(`http://api.jolpi.ca/ergast/f1/${season}/constructorStandings.json`, {
        next: { revalidate: 3600 }
      })
      if (!response.ok) throw new Error(`Jolpica error: ${response.status}`)
      const data = await response.json()

      const standingsList = data.MRData?.StandingsTable?.StandingsLists?.[0]
      if (!standingsList) {
        return NextResponse.json({ success: false, error: 'No constructor standings for this season' }, { status: 404 })
      }

      const standings = standingsList.ConstructorStandings.map((s: any) => ({
        position: parseInt(s.position),
        points: parseFloat(s.points),
        wins: parseInt(s.wins),
        team: s.Constructor.name,
        teamId: s.Constructor.constructorId,
        nationality: s.Constructor.nationality,
      }))

      return NextResponse.json({
        success: true,
        season,
        type: 'constructors',
        round: standingsList.round,
        standings,
      })
    }
  } catch (error) {
    console.error('Error fetching past standings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch past standings', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
