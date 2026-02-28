// Ergast F1 API Integration
// Free historical F1 data API
// Documentation: http://ergast.com/mrd/

const ERGAST_BASE_URL = 'https://api.jolpi.ca/ergast/f1'

// Ergast API Response types
export interface ErgastDriver {
  driverId: string
  permanentNumber?: string
  code?: string
  url: string
  givenName: string
  familyName: string
  dateOfBirth: string
  nationality: string
}

export interface ErgastConstructor {
  constructorId: string
  url: string
  name: string
  nationality: string
}

export interface ErgastDriverStanding {
  position: string
  positionText: string
  points: string
  wins: string
  Driver: ErgastDriver
  Constructors: ErgastConstructor[]
}

export interface ErgastConstructorStanding {
  position: string
  positionText: string
  points: string
  wins: string
  Constructor: ErgastConstructor
}

export interface ErgastRace {
  season: string
  round: string
  url: string
  raceName: string
  Circuit: {
    circuitId: string
    url: string
    circuitName: string
    Location: {
      lat: string
      long: string
      locality: string
      country: string
    }
  }
  date: string
  time?: string
}

export interface ErgastDriverStandingsResponse {
  MRData: {
    xmlns: string
    series: string
    url: string
    limit: string
    offset: string
    total: string
    StandingsTable: {
      season?: string
      round?: string
      StandingsLists: Array<{
        season: string
        round: string
        DriverStandings: ErgastDriverStanding[]
      }>
    }
  }
}

export interface ErgastConstructorStandingsResponse {
  MRData: {
    xmlns: string
    series: string
    url: string
    limit: string
    offset: string
    total: string
    StandingsTable: {
      season?: string
      round?: string
      StandingsLists: Array<{
        season: string
        round: string
        ConstructorStandings: ErgastConstructorStanding[]
      }>
    }
  }
}

export interface ErgastRacesResponse {
  MRData: {
    xmlns: string
    series: string
    url: string
    limit: string
    offset: string
    total: string
    RaceTable: {
      season: string
      Races: ErgastRace[]
    }
  }
}

export interface ErgastDriversResponse {
  MRData: {
    xmlns: string
    series: string
    url: string
    limit: string
    offset: string
    total: string
    DriverTable: {
      season?: string
      Drivers: ErgastDriver[]
    }
  }
}

// Generic fetch function for Ergast API
async function ergastFetch<T>(endpoint: string): Promise<T> {
  const url = `${ERGAST_BASE_URL}${endpoint}.json`

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Ergast API request failed: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  return data
}

// Ergast API Functions
export const ergastApi = {
  // Get current driver standings
  async getCurrentDriverStandings(): Promise<ErgastDriverStandingsResponse> {
    return await ergastFetch<ErgastDriverStandingsResponse>('/current/driverStandings')
  },

  // Get driver standings for a specific season
  async getDriverStandings(season: string): Promise<ErgastDriverStandingsResponse> {
    return await ergastFetch<ErgastDriverStandingsResponse>(`/${season}/driverStandings`)
  },

  // Get constructor standings for a specific season
  async getConstructorStandings(season: string): Promise<ErgastConstructorStandingsResponse> {
    return await ergastFetch<ErgastConstructorStandingsResponse>(`/${season}/constructorStandings`)
  },

  // Get races for a specific season
  async getRaces(season: string): Promise<ErgastRacesResponse> {
    return await ergastFetch<ErgastRacesResponse>(`/${season}`)
  },

  // Get drivers for a specific season
  async getDrivers(season: string): Promise<ErgastDriversResponse> {
    return await ergastFetch<ErgastDriversResponse>(`/${season}/drivers`)
  },

  // Get race results for a specific season and round
  async getRaceResults(season: string, round: string): Promise<any> {
    return await ergastFetch(`/${season}/${round}/results`)
  }
}

// Transform functions to convert Ergast data to app format
export const transformErgastData = {
  driver(ergastDriver: ErgastDriver): any {
    return {
      id: ergastDriver.driverId,
      name: `${ergastDriver.givenName} ${ergastDriver.familyName}`,
      code: ergastDriver.code,
      number: ergastDriver.permanentNumber,
      nationality: ergastDriver.nationality,
      dateOfBirth: ergastDriver.dateOfBirth
    }
  },

  constructor(ergastConstructor: ErgastConstructor): any {
    return {
      id: ergastConstructor.constructorId,
      name: ergastConstructor.name,
      nationality: ergastConstructor.nationality
    }
  },

  race(ergastRace: ErgastRace): any {
    return {
      id: `${ergastRace.season}_${ergastRace.round}`,
      name: ergastRace.raceName,
      circuit: ergastRace.Circuit.circuitName,
      location: ergastRace.Circuit.Location.locality,
      country: ergastRace.Circuit.Location.country,
      date: ergastRace.date,
      round: ergastRace.round,
      season: ergastRace.season
    }
  },

  driverStanding(ergastStanding: ErgastDriverStanding): any {
    return {
      position: parseInt(ergastStanding.position),
      driver: transformErgastData.driver(ergastStanding.Driver),
      team: transformErgastData.constructor(ergastStanding.Constructors[0]),
      points: parseFloat(ergastStanding.points),
      wins: parseInt(ergastStanding.wins)
    }
  }
}

// Error handling wrapper for Ergast
export async function safeErgastCall<T>(
  apiCall: () => Promise<T>,
  fallbackData?: T
): Promise<{ data: T | null; error: string | null }> {
  try {
    const data = await apiCall()
    return { data, error: null }
  } catch (error) {
    console.error('Ergast F1 API Error:', error)
    return {
      data: fallbackData || null,
      error: error instanceof Error ? error.message : 'Unknown API error'
    }
  }
}
