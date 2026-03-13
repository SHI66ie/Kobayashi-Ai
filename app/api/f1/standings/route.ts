import { NextRequest, NextResponse } from 'next/server'

// F1 Standings API endpoint
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const season = searchParams.get('season') || '2026'
    const type = searchParams.get('type') || 'drivers' // 'drivers' or 'constructors'

    // For now, return the real 2026 standings data you provided
    // In production, this would fetch from official F1 API or other sources
    
    if (type === 'drivers') {
      const driverStandings = [
        {
          position: 1,
          driver: 'G. Russell',
          driverCode: 'RUS',
          team: 'Mercedes',
          nationality: 'United Kingdom',
          countryFlag: '🇬🇧',
          points: 25,
          wins: 1,
          podiums: 1,
          image: '/api/f1/driver-image/russell'
        },
        {
          position: 2,
          driver: 'A.K. Antonelli',
          driverCode: 'ANT',
          team: 'Mercedes',
          nationality: 'Italy',
          countryFlag: '🇮🇹',
          points: 18,
          wins: 0,
          podiums: 1,
          image: '/api/f1/driver-image/antonelli'
        },
        {
          position: 3,
          driver: 'C. Leclerc',
          driverCode: 'LEC',
          team: 'Ferrari',
          nationality: 'Monaco',
          countryFlag: '🇲🇨',
          points: 15,
          wins: 0,
          podiums: 1,
          image: '/api/f1/driver-image/leclerc'
        },
        {
          position: 4,
          driver: 'L. Hamilton',
          driverCode: 'HAM',
          team: 'Ferrari',
          nationality: 'United Kingdom',
          countryFlag: '🇬🇧',
          points: 12,
          wins: 0,
          podiums: 0,
          image: '/api/f1/driver-image/hamilton'
        },
        {
          position: 5,
          driver: 'L. Norris',
          driverCode: 'NOR',
          team: 'McLaren',
          nationality: 'United Kingdom',
          countryFlag: '🇬🇧',
          points: 10,
          wins: 0,
          podiums: 0,
          image: '/api/f1/driver-image/norris'
        },
        {
          position: 6,
          driver: 'M. Verstappen',
          driverCode: 'VER',
          team: 'Red Bull',
          nationality: 'Netherlands',
          countryFlag: '🇳🇱',
          points: 8,
          wins: 0,
          podiums: 0,
          image: '/api/f1/driver-image/verstappen'
        },
        {
          position: 7,
          driver: 'O. Bearman',
          driverCode: 'BEA',
          team: 'Haas',
          nationality: 'United Kingdom',
          countryFlag: '🇬🇧',
          points: 6,
          wins: 0,
          podiums: 0,
          image: '/api/f1/driver-image/bearman'
        },
        {
          position: 8,
          driver: 'A. Lindblad',
          driverCode: 'LIN',
          team: 'RB',
          nationality: 'United Kingdom',
          countryFlag: '🇬🇧',
          points: 4,
          wins: 0,
          podiums: 0,
          image: '/api/f1/driver-image/lindblad'
        },
        {
          position: 9,
          driver: 'G. Bortoleto',
          driverCode: 'BOR',
          team: 'Audi',
          nationality: 'Brazil',
          countryFlag: '🇧🇷',
          points: 2,
          wins: 0,
          podiums: 0,
          image: '/api/f1/driver-image/bortoleto'
        },
        {
          position: 10,
          driver: 'P. Gasly',
          driverCode: 'GAS',
          team: 'Alpine',
          nationality: 'France',
          countryFlag: '🇫🇷',
          points: 1,
          wins: 0,
          podiums: 0,
          image: '/api/f1/driver-image/gasly'
        }
      ]

      return NextResponse.json({
        success: true,
        season,
        type: 'drivers',
        lastUpdated: new Date().toISOString(),
        standings: driverStandings,
        totalDrivers: 21
      })
    }

    if (type === 'constructors') {
      const constructorStandings = [
        {
          position: 1,
          team: 'Mercedes',
          nationality: 'Germany',
          countryFlag: '🇩🇪',
          points: 43,
          wins: 1,
          podiums: 2,
          drivers: ['G. Russell', 'A.K. Antonelli']
        },
        {
          position: 2,
          team: 'Ferrari',
          nationality: 'Italy',
          countryFlag: '🇮🇹',
          points: 27,
          wins: 0,
          podiums: 1,
          drivers: ['C. Leclerc', 'L. Hamilton']
        },
        {
          position: 3,
          team: 'McLaren',
          nationality: 'United Kingdom',
          countryFlag: '🇬🇧',
          points: 10,
          wins: 0,
          podiums: 0,
          drivers: ['L. Norris', 'O. Piastri']
        },
        {
          position: 4,
          team: 'Red Bull',
          nationality: 'Austria',
          countryFlag: '🇦🇹',
          points: 8,
          wins: 0,
          podiums: 0,
          drivers: ['M. Verstappen', 'I. Hadjar']
        },
        {
          position: 5,
          team: 'Haas',
          nationality: 'United States',
          countryFlag: '🇺🇸',
          points: 6,
          wins: 0,
          podiums: 0,
          drivers: ['O. Bearman', 'E. Ocon']
        },
        {
          position: 6,
          team: 'RB',
          nationality: 'Italy',
          countryFlag: '🇮🇹',
          points: 4,
          wins: 0,
          podiums: 0,
          drivers: ['A. Lindblad', 'L. Lawson']
        },
        {
          position: 7,
          team: 'Audi',
          nationality: 'Germany',
          countryFlag: '🇩🇪',
          points: 2,
          wins: 0,
          podiums: 0,
          drivers: ['G. Bortoleto', 'N. Hülkenberg']
        },
        {
          position: 8,
          team: 'Alpine',
          nationality: 'France',
          countryFlag: '🇫🇷',
          points: 1,
          wins: 0,
          podiums: 0,
          drivers: ['P. Gasly', 'F. Colapinto']
        },
        {
          position: 9,
          team: 'Williams',
          nationality: 'United Kingdom',
          countryFlag: '🇬🇧',
          points: 0,
          wins: 0,
          podiums: 0,
          drivers: ['A. Albon', 'C. Sainz Jr.']
        },
        {
          position: 10,
          team: 'Cadillac',
          nationality: 'United States',
          countryFlag: '🇺🇸',
          points: 0,
          wins: 0,
          podiums: 0,
          drivers: ['S. Pérez', 'V. Bottas']
        },
        {
          position: 11,
          team: 'Aston Martin',
          nationality: 'United Kingdom',
          countryFlag: '🇬🇧',
          points: 0,
          wins: 0,
          podiums: 0,
          drivers: ['F. Alonso']
        }
      ]

      return NextResponse.json({
        success: true,
        season,
        type: 'constructors',
        lastUpdated: new Date().toISOString(),
        standings: constructorStandings,
        totalTeams: 11
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
