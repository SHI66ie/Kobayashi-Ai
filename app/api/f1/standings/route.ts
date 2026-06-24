import { NextRequest, NextResponse } from 'next/server'
import { f1ApiDev, safeF1ApiCall, transformF1ApiData } from '../../../../lib/f1api-dev'
import { ergastApi } from '../../../../lib/ergast-api'

// Nationality → flag emoji map for Ergast/Jolpica data
const NATIONALITY_FLAG: Record<string, string> = {
  British: '🇬🇧', German: '🇩🇪', Spanish: '🇪🇸', Finnish: '🇫🇮',
  Brazilian: '🇧🇷', Australian: '🇦🇺', French: '🇫🇷', Italian: '🇮🇹',
  Austrian: '🇦🇹', Dutch: '🇳🇱', Canadian: '🇨🇦', American: '🇺🇸',
  Japanese: '🇯🇵', Mexican: '🇲🇽', Thai: '🇹🇭', Monegasque: '🇲🇨',
  New_Zealander: '🇳🇿', Polish: '🇵🇱', Russian: '🇷🇺', Danish: '🇩🇰',
  Chinese: '🇨🇳', Colombian: '🇨🇴', Swiss: '🇨🇭', Belgian: '🇧🇪',
  'New Zealander': '🇳🇿', Argentine: '🇦🇷', Indonesian: '🇮🇩',
  Hungarian: '🇭🇺', Portuguese: '🇵🇹', South_African: '🇿🇦',
  'South African': '🇿🇦', Venezuelan: '🇻🇪', Irish: '🇮🇪',
  Malaysian: '🇲🇾', Indian: '🇮🇳', Emirati: '🇦🇪',
  Saudi: '🇸🇦', Czech: '🇨🇿', Swedish: '🇸🇪', Estonian: '🇪🇪',
}

function getFlag(nationality: string): string {
  return NATIONALITY_FLAG[nationality] ?? '🏁'
}

// Team colour accent for visual flair
const TEAM_COLORS: Record<string, string> = {
  Mercedes: '#00D2BE', Ferrari: '#DC143C', 'Red Bull': '#1E41FF',
  McLaren: '#FF8700', Alpine: '#0090FF', 'Aston Martin': '#006F62',
  Haas: '#B6BABD', Williams: '#005AFF', 'Alfa Romeo': '#900000',
  AlphaTauri: '#2B4562', 'Racing Bulls': '#2B4562', Sauber: '#900000',
  Renault: '#FFF500', Jordan: '#FFB800', BAR: '#4B0082',
  Minardi: '#191919', Jaguar: '#006400', Toyota: '#CC0001',
  'Super Aguri': '#CC0001','Spyker MF1': '#F94900',
  'Force India': '#FF80C7', Brawn: '#B5F135', HRT: '#B2945A',
  Marussia: '#6E0000', Caterham: '#005030', Manor: '#6E0000',
  'Racing Point': '#F596C8', 'Toro Rosso': '#469BFF',
}

// F1 Standings API endpoint — smart routing: Jolpica (historical) vs f1api.dev (current)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const season = searchParams.get('season') || '2026'
    const type = searchParams.get('type') || 'drivers'
    const seasonYear = parseInt(season)

    // Use Jolpica/Ergast for historical data (pre-2024), f1api.dev for 2024+
    const useHistorical = seasonYear < 2024

    if (type === 'drivers') {
      if (useHistorical) {
        // ── Jolpica / Ergast path ─────────────────────────────────────────
        const data = await ergastApi.getDriverStandings(season)
        const standingsList = data.MRData.StandingsTable.StandingsLists[0]

        if (!standingsList || !standingsList.DriverStandings.length) {
          throw new Error(`No driver standings available for ${season}`)
        }

        const standings = standingsList.DriverStandings.map((s) => {
          const nat = s.Driver.nationality
          const teamName = s.Constructors[0]?.name ?? 'Unknown'
          const firstName = s.Driver.givenName
          const lastName = s.Driver.familyName
          return {
            position: parseInt(s.position),
            driver: `${firstName} ${lastName}`,
            driverCode: s.Driver.code ?? lastName.slice(0, 3).toUpperCase(),
            driverId: s.Driver.driverId,
            team: teamName,
            teamColor: TEAM_COLORS[teamName] ?? '#888888',
            nationality: nat,
            countryFlag: getFlag(nat),
            points: parseFloat(s.points),
            wins: parseInt(s.wins),
            podiums: 0, // Ergast doesn't return podiums directly
          }
        })

        return NextResponse.json({
          success: true,
          season,
          type: 'drivers',
          lastUpdated: new Date().toISOString(),
          source: 'jolpica',
          standings,
          totalDrivers: standings.length,
        })
      } else {
        // ── f1api.dev path ────────────────────────────────────────────────
        const result = await safeF1ApiCall(() => f1ApiDev.getDriverChampionship(season))

        if (result.error || !result.data) {
          throw new Error(result.error?.message || 'Failed to fetch driver standings from f1api.dev')
        }

        const standings = result.data.drivers_championship.map((entry) => {
          const nat = entry.driver.nationality
          const teamName = entry.team.teamName
          return {
            ...transformF1ApiData.driverStanding(entry),
            teamColor: TEAM_COLORS[teamName] ?? '#888888',
            countryFlag: getFlag(nat),
            podiums: 0, // f1api.dev doesn't provide podiums directly
          }
        })

        return NextResponse.json({
          success: true,
          season,
          type: 'drivers',
          lastUpdated: new Date().toISOString(),
          source: 'f1api.dev',
          standings,
          totalDrivers: standings.length,
        })
      }
    } else {
      // ── CONSTRUCTORS ─────────────────────────────────────────────────────
      if (useHistorical) {
        const data = await ergastApi.getConstructorStandings(season)
        const standingsList = data.MRData.StandingsTable.StandingsLists[0]

        if (!standingsList || !standingsList.ConstructorStandings.length) {
          throw new Error(`No constructor standings available for ${season}`)
        }

        const standings = standingsList.ConstructorStandings.map((s) => {
          const nat = s.Constructor.nationality
          const teamName = s.Constructor.name
          return {
            position: parseInt(s.position),
            team: teamName,
            teamId: s.Constructor.constructorId,
            teamColor: TEAM_COLORS[teamName] ?? '#888888',
            nationality: nat,
            countryFlag: getFlag(nat),
            points: parseFloat(s.points),
            wins: parseInt(s.wins),
            podiums: 0,
            drivers: [],
          }
        })

        return NextResponse.json({
          success: true,
          season,
          type: 'constructors',
          lastUpdated: new Date().toISOString(),
          source: 'jolpica',
          standings,
          totalTeams: standings.length,
        })
      } else {
        const result = await safeF1ApiCall(() => f1ApiDev.getConstructorChampionship(season))

        if (result.error || !result.data) {
          throw new Error(result.error?.message || 'Failed to fetch constructor standings from f1api.dev')
        }

        const standings = result.data.constructors_championship.map((entry) => {
          const teamName = entry.team.teamName
          const nat = entry.team.country
          return {
            ...transformF1ApiData.constructorStanding(entry),
            teamColor: TEAM_COLORS[teamName] ?? '#888888',
            countryFlag: getFlag(nat),
            podiums: 0,
            drivers: [],
          }
        })

        return NextResponse.json({
          success: true,
          season,
          type: 'constructors',
          lastUpdated: new Date().toISOString(),
          source: 'f1api.dev',
          standings,
          totalTeams: standings.length,
        })
      }
    }
  } catch (error) {
    console.error('Error fetching F1 standings:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch standings data',
        message: error instanceof Error ? error.message : 'Unknown error',
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

    if (!season || !type || !standings) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: season, type, standings' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Standings updated successfully',
      season,
      type,
      updatedCount: standings.length,
    })
  } catch (error) {
    console.error('Error updating F1 standings:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update standings',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
