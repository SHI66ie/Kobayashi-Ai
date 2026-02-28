// JOLPICA F1 Constructors API Route (replacement for Ergast)
import { NextRequest, NextResponse } from 'next/server'
import { jolpicaApi, safeJolpicaCall, transformJolpicaData } from '../../../../lib/jolpica-api'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const season = searchParams.get('season') || new Date().getFullYear().toString()

  try {
    const result = await safeJolpicaCall(() => jolpicaApi.getConstructors(season))

    let constructors = []
    if (!result.error && result.data?.MRData?.ConstructorTable?.Constructors) {
      constructors = result.data.MRData.ConstructorTable.Constructors.map(transformJolpicaData.constructor)
    }

    // Fallback to mock data if API fails or no data
    if (constructors.length === 0) {
      constructors = [
        { id: 'red_bull', name: 'Red Bull Racing', nationality: 'Austrian' },
        { id: 'mercedes', name: 'Mercedes AMG Petronas F1 Team', nationality: 'German' },
        { id: 'ferrari', name: 'Scuderia Ferrari', nationality: 'Italian' },
        { id: 'mclaren', name: 'McLaren Racing', nationality: 'British' },
        { id: 'aston_martin', name: 'Aston Martin Aramco Cognizant F1 Team', nationality: 'British' },
        { id: 'alpine', name: 'Alpine F1 Team', nationality: 'French' },
        { id: 'williams', name: 'Williams Racing', nationality: 'British' },
        { id: 'rb', name: 'Visa Cash App RB F1 Team', nationality: 'Italian' },
        { id: 'sauber', name: 'Stake F1 Team Kick Sauber', nationality: 'Swiss' },
        { id: 'haas', name: 'MoneyGram Haas F1 Team', nationality: 'American' }
      ]
    }

    return NextResponse.json({
      season,
      constructors,
      count: constructors.length,
      source: constructors.length > 0 && !result.error ? 'api' : 'mock'
    })
  } catch (error) {
    console.error('JOLPICA constructors API error:', error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}
