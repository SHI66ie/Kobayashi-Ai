import { NextRequest, NextResponse } from 'next/server'
import { f1ApiDev, safeF1ApiCall, transformF1ApiData } from '../../../../lib/f1api-dev'

// F1 Past Standings — powered by f1api.dev
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const season = searchParams.get('season') || '2026'
    const type = searchParams.get('type') || 'drivers' // 'drivers' or 'constructors'

    if (type === 'drivers') {
      const result = await safeF1ApiCall(() => f1ApiDev.getDriverChampionship(season))

      if (result.error || !result.data) {
        throw new Error(result.error?.message || `No driver standings available for ${season}`)
      }

      const standings = result.data.drivers_championship.map(transformF1ApiData.driverStanding)

      return NextResponse.json({
        success: true,
        season,
        type: 'drivers',
        source: 'f1api.dev',
        standings,
      })
    } else {
      const result = await safeF1ApiCall(() => f1ApiDev.getConstructorChampionship(season))

      if (result.error || !result.data) {
        throw new Error(result.error?.message || `No constructor standings available for ${season}`)
      }

      const standings = result.data.constructors_championship.map(transformF1ApiData.constructorStanding)

      return NextResponse.json({
        success: true,
        season,
        type: 'constructors',
        source: 'f1api.dev',
        standings,
      })
    }
  } catch (error) {
    console.error('Error fetching past standings from f1api.dev:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch past standings',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
