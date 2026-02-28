// JOLPICA F1 API client - Free alternative to Ergast API
// Base URL: http://api.jolpi.ca/ergast/f1/
// Compatible with Ergast API endpoints

const JOLPICA_BASE_URL = 'http://api.jolpi.ca/ergast/f1'

export interface JolpicaApiResponse {
  MRData: {
    StandingsTable: {
      StandingsLists: Array<{
        season: string
        round: string
        DriverStandings: Array<{
          position: string
          positionText: string
          points: string
          wins: string
          Driver: {
            driverId: string
            permanentNumber: string
            code: string
            url: string
            givenName: string
            familyName: string
            dateOfBirth: string
            nationality: string
          }
          Constructors: Array<{
            constructorId: string
            url: string
            name: string
            nationality: string
          }>
        }>
      }>
    }
  }
}

export interface JolpicaDriversResponse {
  MRData: {
    DriverTable: {
      Drivers: Array<{
        driverId: string
        permanentNumber: string
        code: string
        url: string
        givenName: string
        familyName: string
        dateOfBirth: string
        nationality: string
      }>
    }
  }
}

export interface JolpicaConstructorsResponse {
  MRData: {
    ConstructorTable: {
      Constructors: Array<{
        constructorId: string
        url: string
        name: string
        nationality: string
      }>
    }
  }
}

// Safe API call wrapper
export async function safeJolpicaCall<T>(apiCall: () => Promise<T>): Promise<{ data: T | null; error: any }> {
  try {
    const data = await apiCall()
    return { data, error: null }
  } catch (error) {
    console.warn('JOLPICA API call failed:', error)
    return { data: null, error }
  }
}

// API functions
export const jolpicaApi = {
  // Get current driver standings
  async getCurrentDriverStandings(): Promise<JolpicaApiResponse> {
    const response = await fetch(`${JOLPICA_BASE_URL}/current/driverStandings.json`)
    if (!response.ok) {
      throw new Error(`JOLPICA API error: ${response.status}`)
    }
    return response.json()
  },

  // Get driver standings for specific season
  async getDriverStandings(season: string): Promise<JolpicaApiResponse> {
    const response = await fetch(`${JOLPICA_BASE_URL}/${season}/driverStandings.json`)
    if (!response.ok) {
      throw new Error(`JOLPICA API error: ${response.status}`)
    }
    return response.json()
  },

  // Get all drivers for a season
  async getDrivers(season: string): Promise<JolpicaDriversResponse> {
    const response = await fetch(`${JOLPICA_BASE_URL}/${season}/drivers.json`)
    if (!response.ok) {
      throw new Error(`JOLPICA API error: ${response.status}`)
    }
    return response.json()
  },

  // Get all constructors for a season
  async getConstructors(season: string): Promise<JolpicaConstructorsResponse> {
    const response = await fetch(`${JOLPICA_BASE_URL}/${season}/constructors.json`)
    if (!response.ok) {
      throw new Error(`JOLPICA API error: ${response.status}`)
    }
    return response.json()
  }
}

// Transform functions
export const transformJolpicaData = {
  driverStanding: (standing: any) => ({
    position: parseInt(standing.position),
    points: parseInt(standing.points),
    wins: parseInt(standing.wins),
    driver: {
      id: standing.Driver.driverId,
      name: `${standing.Driver.givenName} ${standing.Driver.familyName}`,
      code: standing.Driver.code,
      nationality: standing.Driver.nationality,
      permanentNumber: standing.Driver.permanentNumber
    },
    team: {
      id: standing.Constructors[0]?.constructorId,
      name: standing.Constructors[0]?.name,
      nationality: standing.Constructors[0]?.nationality
    }
  }),

  driver: (driver: any) => ({
    id: driver.driverId,
    name: `${driver.givenName} ${driver.familyName}`,
    code: driver.code,
    nationality: driver.nationality,
    permanentNumber: driver.permanentNumber
  }),

  constructor: (constructor: any) => ({
    id: constructor.constructorId,
    name: constructor.name,
    nationality: constructor.nationality
  })
}
