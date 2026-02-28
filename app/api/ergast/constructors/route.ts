// Ergast F1 Constructors API Route
import { NextRequest, NextResponse } from 'next/server'
import { ergastApi, safeErgastCall, transformErgastData } from '../../../../lib/ergast-api'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const season = searchParams.get('season') || new Date().getFullYear().toString()

  try {
    const result = await safeErgastCall(() => ergastApi.getConstructorStandings(season))

    if (result.error) {
      return NextResponse.json({
        error: 'Failed to fetch constructors',
        message: result.error
      }, { status: 500 })
    }

    const constructors = result.data?.MRData?.StandingsTable?.StandingsLists?.[0]?.ConstructorStandings?.map(s => transformErgastData.constructor(s.Constructor)) || []

    return NextResponse.json({
      season,
      constructors,
      count: constructors.length
    })
  } catch (error) {
    console.error('Ergast constructors API error:', error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}
