// f1api.dev — Constructors API Route
import { NextRequest, NextResponse } from 'next/server'
import { f1ApiDev, safeF1ApiCall, transformF1ApiData } from '../../../../lib/f1api-dev'

// 2026 fallback constructor list (all 11 teams including Audi and Cadillac)
const FALLBACK_2026_CONSTRUCTORS = [
  { id: 'mercedes',     name: 'Mercedes Formula 1 Team',  nationality: 'Germany'       },
  { id: 'ferrari',      name: 'Scuderia Ferrari',          nationality: 'Italy'         },
  { id: 'mclaren',      name: 'McLaren Formula 1 Team',    nationality: 'Great Britain' },
  { id: 'red_bull',     name: 'Red Bull Racing',           nationality: 'Austria'       },
  { id: 'alpine',       name: 'Alpine F1 Team',            nationality: 'France'        },
  { id: 'rb',           name: 'RB F1 Team',                nationality: 'Italy'         },
  { id: 'haas',         name: 'Haas F1 Team',              nationality: 'United States' },
  { id: 'williams',     name: 'Williams Racing',           nationality: 'Great Britain' },
  { id: 'audi',         name: 'Audi Revolut F1 Team',      nationality: 'Germany'       },
  { id: 'aston_martin', name: 'Aston Martin F1 Team',      nationality: 'Great Britain' },
  { id: 'cadillac',     name: 'Cadillac Formula 1 Team',   nationality: 'United States' },
]

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const season = searchParams.get('season') || '2026'

  try {
    // Use the constructor championship endpoint — it contains the full team list
    const result = await safeF1ApiCall(() => f1ApiDev.getConstructorChampionship(season))

    let constructors: typeof FALLBACK_2026_CONSTRUCTORS = []
    let source = 'api'

    if (!result.error && result.data?.constructors_championship?.length) {
      constructors = result.data.constructors_championship.map((entry) => ({
        id: entry.teamId,
        name: entry.team.teamName,
        nationality: entry.team.country,
      }))
    }

    if (constructors.length === 0) {
      console.warn('[f1api.dev] Constructors API unavailable, using fallback data')
      constructors = FALLBACK_2026_CONSTRUCTORS
      source = 'fallback'
    }

    return NextResponse.json({
      season,
      constructors,
      count: constructors.length,
      source,
    })
  } catch (error) {
    console.error('f1api.dev constructors API error:', error)
    return NextResponse.json({
      season,
      constructors: FALLBACK_2026_CONSTRUCTORS,
      count: FALLBACK_2026_CONSTRUCTORS.length,
      source: 'fallback',
    })
  }
}
