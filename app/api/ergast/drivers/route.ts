// JOLPICA F1 Drivers API Route (replacement for Ergast)
import { NextRequest, NextResponse } from 'next/server'
import { jolpicaApi, safeJolpicaCall, transformJolpicaData } from '../../../../lib/jolpica-api'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const season = searchParams.get('season') || new Date().getFullYear().toString()

  try {
    const result = await safeJolpicaCall(() => jolpicaApi.getDrivers(season))

    let drivers = []
    if (!result.error && result.data?.MRData?.DriverTable?.Drivers) {
      drivers = result.data.MRData.DriverTable.Drivers.map(transformJolpicaData.driver)
    }

    // Fallback to mock data if API fails or no data
    if (drivers.length === 0) {
      drivers = [
        { id: 'verstappen', name: 'Max Verstappen', code: 'VER', nationality: 'Dutch', permanentNumber: '33' },
        { id: 'hamilton', name: 'Lewis Hamilton', code: 'HAM', nationality: 'British', permanentNumber: '44' },
        { id: 'leclerc', name: 'Charles Leclerc', code: 'LEC', nationality: 'Monegasque', permanentNumber: '16' },
        { id: 'norris', name: 'Lando Norris', code: 'NOR', nationality: 'British', permanentNumber: '4' },
        { id: 'russell', name: 'George Russell', code: 'RUS', nationality: 'British', permanentNumber: '63' },
        { id: 'sainz', name: 'Carlos Sainz', code: 'SAI', nationality: 'Spanish', permanentNumber: '55' },
        { id: 'perez', name: 'Sergio Perez', code: 'PER', nationality: 'Mexican', permanentNumber: '11' },
        { id: 'alonso', name: 'Fernando Alonso', code: 'ALO', nationality: 'Spanish', permanentNumber: '14' },
        { id: 'piastri', name: 'Oscar Piastri', code: 'PIA', nationality: 'Australian', permanentNumber: '81' },
        { id: 'gasly', name: 'Pierre Gasly', code: 'GAS', nationality: 'French', permanentNumber: '10' },
        { id: 'ocon', name: 'Esteban Ocon', code: 'OCO', nationality: 'French', permanentNumber: '31' },
        { id: 'hulkenberg', name: 'Nico Hulkenberg', code: 'HUL', nationality: 'German', permanentNumber: '27' },
        { id: 'tsunoda', name: 'Yuki Tsunoda', code: 'TSU', nationality: 'Japanese', permanentNumber: '22' },
        { id: 'ricciardo', name: 'Daniel Ricciardo', code: 'RIC', nationality: 'Australian', permanentNumber: '3' },
        { id: 'bottas', name: 'Valtteri Bottas', code: 'BOT', nationality: 'Finnish', permanentNumber: '77' },
        { id: 'zhou', name: 'Zhou Guanyu', code: 'ZHO', nationality: 'Chinese', permanentNumber: '24' },
        { id: 'albon', name: 'Alexander Albon', code: 'ALB', nationality: 'Thai', permanentNumber: '23' },
        { id: 'sargeant', name: 'Logan Sargeant', code: 'SAR', nationality: 'American', permanentNumber: '2' },
        { id: 'stroll', name: 'Lance Stroll', code: 'STR', nationality: 'Canadian', permanentNumber: '18' },
        { id: 'magnussen', name: 'Kevin Magnussen', code: 'MAG', nationality: 'Danish', permanentNumber: '20' }
      ]
    }

    return NextResponse.json({
      season,
      drivers,
      count: drivers.length,
      source: drivers.length > 0 && !result.error ? 'api' : 'mock'
    })
  } catch (error) {
    console.error('Ergast drivers API error:', error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}
