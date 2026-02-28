// Ergast F1 Drivers API Route
import { NextRequest, NextResponse } from 'next/server'
import { ergastApi, safeErgastCall, transformErgastData } from '../../../../lib/ergast-api'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const season = searchParams.get('season') || new Date().getFullYear().toString()

  try {
    const result = await safeErgastCall(() => ergastApi.getDrivers(season))

    if (result.error) {
      return NextResponse.json({
        error: 'Failed to fetch drivers',
        message: result.error
      }, { status: 500 })
    }

    const drivers = result.data?.MRData?.DriverTable?.Drivers?.map(transformErgastData.driver) || []

    return NextResponse.json({
      season,
      drivers,
      count: drivers.length
    })
  } catch (error) {
    console.error('Ergast drivers API error:', error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}
