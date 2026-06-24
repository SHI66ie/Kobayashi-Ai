// f1api.dev Client Library
// Free & open-source F1 API: https://f1api.dev
// No API key required. Data updated after each race.
// Endpoints: /api/{year}, /api/{year}/drivers, /api/{year}/drivers-championship,
//            /api/{year}/constructors-championship, /api/{year}/{round}/race

const F1API_BASE = 'https://f1api.dev/api'

// ─────────────────────────────────────────────
// TypeScript Interfaces
// ─────────────────────────────────────────────

export interface F1ApiDriver {
  driverId: string
  name: string
  surname: string
  nationality: string
  birthday: string
  number: number
  shortName: string
  url: string
  teamId: string
}

export interface F1ApiTeam {
  teamId: string
  teamName: string
  country: string
  firstAppareance: number
  constructorsChampionships: number | null
  driversChampionships: number | null
  url: string
}

export interface F1ApiCircuit {
  circuitId: string
  circuitName: string
  country: string
  city: string
  circuitLength: string
  lapRecord: string | null
  firstParticipationYear: number
  corners: number
  fastestLapDriverId: string | null
  fastestLapTeamId: string | null
  fastestLapYear: number | null
  url: string
}

export interface F1ApiRaceSchedule {
  raceId: string
  championshipId: string
  raceName: string
  round: number
  laps: number | null
  url: string
  schedule: {
    race: { date: string; time: string }
    qualy: { date: string; time: string }
    fp1: { date: string | null; time: string | null }
    fp2: { date: string | null; time: string | null }
    fp3: { date: string | null; time: string | null }
    sprintQualy: { date: string | null; time: string | null }
    sprintRace: { date: string | null; time: string | null }
  }
  fast_lap: {
    fast_lap: string | null
    fast_lap_driver_id: string | null
    fast_lap_team_id: string | null
  }
  circuit: F1ApiCircuit
  winner: {
    driverId: string
    name: string
    surname: string
    country: string
    birthday: string
    number: number
    shortName: string
    url: string
  } | null
  teamWinner: {
    teamId: string
    teamName: string
    country: string
    firstAppearance: number
    constructorsChampionships: number
    driversChampionships: number
    url: string
  } | null
}

export interface F1ApiSeasonResponse {
  api: string
  url: string
  total: number
  season: number
  championship: {
    championshipId: string
    championshipName: string
    url: string
    year: number
  }
  races: F1ApiRaceSchedule[]
}

export interface F1ApiDriversResponse {
  api: string
  url: string
  total: number
  season: number
  championshipId: string
  drivers: F1ApiDriver[]
}

export interface F1ApiDriverChampionshipEntry {
  classificationId: number
  driverId: string
  teamId: string
  points: number
  position: number
  wins: number
  driver: {
    name: string
    surname: string
    nationality: string
    birthday: string
    number: number
    shortName: string
    url: string
  }
  team: F1ApiTeam
}

export interface F1ApiDriverChampionshipResponse {
  api: string
  url: string
  total: number
  season: number
  championshipId: string
  drivers_championship: F1ApiDriverChampionshipEntry[]
}

export interface F1ApiConstructorChampionshipEntry {
  classificationId: number
  teamId: string
  points: number
  position: number
  wins: number
  team: F1ApiTeam
}

export interface F1ApiConstructorChampionshipResponse {
  api: string
  url: string
  total: number
  season: number
  championshipId: string
  constructors_championship: F1ApiConstructorChampionshipEntry[]
}

export interface F1ApiRaceResult {
  position: string
  points: number
  grid: string
  time: string
  fastLap: string | null
  retired: null
  driver: {
    driverId: string
    number: number
    shortName: string
    url: string
    name: string
    surname: string
    nationality: string
    birthday: string
  }
  team: {
    teamId: string
    teamName: string
    nationality: string
    firstAppareance: number
    constructorsChampionships: number | null
    driversChampionships: number | null
    url: string
  }
}

export interface F1ApiRaceResultResponse {
  api: string
  url: string
  total: number
  season: number
  races: {
    round: string
    date: string
    time: string
    url: string
    raceId: string
    raceName: string
    circuit: F1ApiCircuit[]
    results: F1ApiRaceResult[]
  }
}

// ─────────────────────────────────────────────
// Safe call wrapper
// ─────────────────────────────────────────────

export async function safeF1ApiCall<T>(
  apiCall: () => Promise<T>
): Promise<{ data: T | null; error: any }> {
  try {
    const data = await apiCall()
    return { data, error: null }
  } catch (error) {
    console.warn('[f1api.dev] API call failed:', error)
    return { data: null, error }
  }
}

// ─────────────────────────────────────────────
// API Client
// ─────────────────────────────────────────────

async function f1apiFetch<T>(path: string): Promise<T> {
  const url = `${F1API_BASE}${path}`
  const response = await fetch(url, { cache: 'no-store' })
  if (!response.ok) {
    throw new Error(`[f1api.dev] ${response.status} ${response.statusText} — ${url}`)
  }
  return response.json() as Promise<T>
}

export const f1ApiDev = {
  /** Full season schedule with winner info per race */
  getSeasonSchedule(season: string | number): Promise<F1ApiSeasonResponse> {
    return f1apiFetch<F1ApiSeasonResponse>(`/${season}`)
  },

  /** All drivers on the grid for a season */
  getDrivers(season: string | number): Promise<F1ApiDriversResponse> {
    return f1apiFetch<F1ApiDriversResponse>(`/${season}/drivers`)
  },

  /** Live driver championship standings */
  getDriverChampionship(season: string | number): Promise<F1ApiDriverChampionshipResponse> {
    return f1apiFetch<F1ApiDriverChampionshipResponse>(`/${season}/drivers-championship`)
  },

  /** Live constructor championship standings */
  getConstructorChampionship(season: string | number): Promise<F1ApiConstructorChampionshipResponse> {
    return f1apiFetch<F1ApiConstructorChampionshipResponse>(`/${season}/constructors-championship`)
  },

  /** Full race grid results for a specific round */
  getRaceResult(season: string | number, round: string | number): Promise<F1ApiRaceResultResponse> {
    return f1apiFetch<F1ApiRaceResultResponse>(`/${season}/${round}/race`)
  },
}

// ─────────────────────────────────────────────
// Transform helpers
// ─────────────────────────────────────────────

export const transformF1ApiData = {
  /** Driver championship entry → app-friendly standing row */
  driverStanding(entry: F1ApiDriverChampionshipEntry) {
    return {
      position: entry.position,
      points: entry.points,
      wins: entry.wins,
      driver: `${entry.driver.name} ${entry.driver.surname}`,
      driverCode: entry.driver.shortName,
      driverId: entry.driverId,
      team: entry.team.teamName,
      nationality: entry.driver.nationality,
      number: entry.driver.number,
    }
  },

  /** Constructor championship entry → app-friendly standing row */
  constructorStanding(entry: F1ApiConstructorChampionshipEntry) {
    return {
      position: entry.position,
      points: entry.points,
      wins: entry.wins,
      team: entry.team.teamName,
      teamId: entry.teamId,
      nationality: entry.team.country,
    }
  },

  /** Driver list entry → app-friendly driver object */
  driver(d: F1ApiDriver) {
    return {
      id: d.driverId,
      name: `${d.name} ${d.surname}`,
      code: d.shortName,
      nationality: d.nationality,
      permanentNumber: String(d.number),
      teamId: d.teamId,
    }
  },

  /** Race schedule entry → app-friendly race summary */
  raceSummary(race: F1ApiRaceSchedule) {
    return {
      round: race.round,
      name: race.raceName,
      date: race.schedule.race.date,
      circuit: race.circuit.circuitName,
      country: race.circuit.country,
      city: race.circuit.city,
      winner: race.winner
        ? `${race.winner.name} ${race.winner.surname}`
        : null,
      winnerCode: race.winner?.shortName ?? null,
      winnerTeam: race.teamWinner?.teamName ?? null,
      status: race.winner ? 'completed' : 'upcoming',
    }
  },

  /** Full race result entry → app-friendly result row */
  raceResult(res: F1ApiRaceResult) {
    return {
      position: res.position === '-' ? 'DNF' : parseInt(res.position),
      driver: `${res.driver.name[0]}. ${res.driver.surname}`,
      driverCode: res.driver.shortName,
      team: res.team.teamName,
      points: res.points,
      time: res.time,
      fastLap: res.fastLap,
      grid: res.grid,
      status: res.position === '-' ? 'DNF' : 'Finished',
    }
  },
}
