// f1api.dev — Drivers API Route
import { NextRequest, NextResponse } from 'next/server'
import { f1ApiDev, safeF1ApiCall, transformF1ApiData } from '../../../../lib/f1api-dev'

// 2026 fallback grid in case the API is unreachable
const FALLBACK_2026_DRIVERS = [
  { id: 'antonelli',     name: 'Andrea Kimi Antonelli', code: 'ANT', nationality: 'Italy',         permanentNumber: '12', teamId: 'mercedes'      },
  { id: 'russell',       name: 'George Russell',         code: 'RUS', nationality: 'Great Britain', permanentNumber: '63', teamId: 'mercedes'      },
  { id: 'hamilton',      name: 'Lewis Hamilton',         code: 'HAM', nationality: 'Great Britain', permanentNumber: '44', teamId: 'ferrari'       },
  { id: 'leclerc',       name: 'Charles Leclerc',        code: 'LEC', nationality: 'Monaco',        permanentNumber: '16', teamId: 'ferrari'       },
  { id: 'norris',        name: 'Lando Norris',           code: 'NOR', nationality: 'Great Britain', permanentNumber: '4',  teamId: 'mclaren'       },
  { id: 'piastri',       name: 'Oscar Piastri',          code: 'PIA', nationality: 'Australia',     permanentNumber: '81', teamId: 'mclaren'       },
  { id: 'max_verstappen',name: 'Max Verstappen',         code: 'VER', nationality: 'Netherlands',   permanentNumber: '33', teamId: 'red_bull'      },
  { id: 'hadjar',        name: 'Isack Hadjar',           code: 'HAD', nationality: 'France',        permanentNumber: '6',  teamId: 'red_bull'      },
  { id: 'gasly',         name: 'Pierre Gasly',           code: 'GAS', nationality: 'France',        permanentNumber: '10', teamId: 'alpine'        },
  { id: 'colapinto',     name: 'Franco Colapinto',       code: 'COL', nationality: 'Argentina',     permanentNumber: '43', teamId: 'alpine'        },
  { id: 'lawson',        name: 'Liam Lawson',            code: 'LAW', nationality: 'New Zealand',   permanentNumber: '30', teamId: 'rb'            },
  { id: 'lindblad',      name: 'Arvid Lindblad',         code: 'LIN', nationality: 'Great Britain', permanentNumber: '36', teamId: 'rb'            },
  { id: 'bearman',       name: 'Oliver Bearman',         code: 'BEA', nationality: 'Great Britain', permanentNumber: '87', teamId: 'haas'          },
  { id: 'ocon',          name: 'Esteban Ocon',           code: 'OCO', nationality: 'France',        permanentNumber: '31', teamId: 'haas'          },
  { id: 'sainz',         name: 'Carlos Sainz',           code: 'SAI', nationality: 'Spain',         permanentNumber: '55', teamId: 'williams'      },
  { id: 'albon',         name: 'Alex Albon',             code: 'ALB', nationality: 'Thailand',      permanentNumber: '23', teamId: 'williams'      },
  { id: 'bortoleto',     name: 'Gabriel Bortoleto',      code: 'BOR', nationality: 'Brazil',        permanentNumber: '5',  teamId: 'audi'          },
  { id: 'hulkenberg',    name: 'Nico Hulkenberg',        code: 'HUL', nationality: 'Germany',       permanentNumber: '27', teamId: 'audi'          },
  { id: 'alonso',        name: 'Fernando Alonso',        code: 'ALO', nationality: 'Spain',         permanentNumber: '14', teamId: 'aston_martin'  },
  { id: 'stroll',        name: 'Lance Stroll',           code: 'STR', nationality: 'Canada',        permanentNumber: '18', teamId: 'aston_martin'  },
  { id: 'bottas',        name: 'Valtteri Bottas',        code: 'BOT', nationality: 'Finland',       permanentNumber: '77', teamId: 'cadillac'      },
  { id: 'perez',         name: 'Sergio Pérez',           code: 'PER', nationality: 'Mexico',        permanentNumber: '11', teamId: 'cadillac'      },
]

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const season = searchParams.get('season') || '2026'

  try {
    const result = await safeF1ApiCall(() => f1ApiDev.getDrivers(season))

    let drivers: typeof FALLBACK_2026_DRIVERS = []
    let source = 'api'

    if (!result.error && result.data?.drivers?.length) {
      drivers = result.data.drivers.map(transformF1ApiData.driver)
    }

    if (drivers.length === 0) {
      console.warn('[f1api.dev] Drivers API unavailable, using fallback data')
      drivers = FALLBACK_2026_DRIVERS
      source = 'fallback'
    }

    return NextResponse.json({
      season,
      drivers,
      count: drivers.length,
      source,
    })
  } catch (error) {
    console.error('f1api.dev drivers API error:', error)
    return NextResponse.json({
      season,
      drivers: FALLBACK_2026_DRIVERS,
      count: FALLBACK_2026_DRIVERS.length,
      source: 'fallback',
    })
  }
}
