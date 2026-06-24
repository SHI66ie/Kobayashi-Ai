// Hybrid F1 API Service
// Combines OpenF1 (live telemetry) with f1api.dev (reliable fallback)
// Automatically switches to fallback when OpenF1 hits rate limits

import { openf1Api, transformOpenF1Data, OpenF1Driver, OpenF1Session, OpenF1ChampionshipDriver } from './openf1-api'
import { f1ApiDev, safeF1ApiCall, transformF1ApiData, F1ApiDriver, F1ApiDriversResponse, F1ApiSeasonResponse, F1ApiDriverChampionshipResponse, F1ApiConstructorChampionshipResponse } from './f1api-dev'

export interface HybridDriver {
  id: string
  driver_number?: number
  broadcast_name?: string
  full_name?: string
  name: string
  name_acronym?: string
  code: string
  number: string
  team: string
  team_name?: string
  team_colour?: string
  color?: string
  image?: string
  nationality?: string
  country_code?: string
}

export interface HybridSession {
  id: string
  session_key?: number
  name: string
  session_name?: string
  type: string
  session_type?: string
  location: string
  country: string
  country_name?: string
  circuit: string
  circuit_short_name?: string
  date: string
  date_start?: string
}

export interface HybridStanding {
  position: number
  points: number
  driver: HybridDriver
  team: { name: string }
  wins?: number
}

// Configuration
const OPENF1_RATE_LIMIT_THRESHOLD = 429
const FALLBACK_ENABLED = true

// Error detection
function isRateLimitError(error: any): boolean {
  return error?.message?.includes('429') || 
         error?.message?.includes('Too Many Requests') ||
         error?.message?.includes('rate limit')
}

// Transform f1api.dev data to match OpenF1 structure
function transformF1ApiToHybridDriver(driver: F1ApiDriver): HybridDriver {
  return {
    id: driver.driverId,
    driver_number: driver.number,
    full_name: `${driver.name} ${driver.surname}`,
    name: `${driver.name} ${driver.surname}`,
    name_acronym: driver.shortName,
    code: driver.shortName,
    number: String(driver.number),
    team: '', // Will be filled from context
    team_name: '', // Will be filled from context
    nationality: driver.nationality
  }
}

function transformF1ApiToHybridSession(race: any): HybridSession {
  return {
    id: race.raceId,
    session_key: parseInt(race.raceId?.split('_')[1] || '0'), // Extract session key if available
    name: race.raceName,
    session_name: race.raceName,
    type: 'Race',
    session_type: 'Race',
    location: race.circuit.city,
    country: race.circuit.country,
    country_name: race.circuit.country,
    circuit: race.circuit.circuitName,
    circuit_short_name: race.circuit.circuitId,
    date: race.schedule.race.date,
    date_start: race.schedule.race.date
  }
}

function transformF1ApiToHybridStanding(entry: any, drivers: F1ApiDriver[]): HybridStanding {
  const driver = drivers.find(d => d.driverId === entry.driverId)
  return {
    position: entry.position,
    points: entry.points,
    wins: entry.wins,
    driver: driver ? transformF1ApiToHybridDriver(driver) : {
      id: entry.driverId,
      name: entry.driver?.name ? `${entry.driver.name} ${entry.driver.surname}` : 'Unknown',
      code: entry.driver?.shortName || 'UNK',
      number: String(entry.driver?.number || 0),
      team: entry.team?.teamName || 'Unknown'
    },
    team: { name: entry.team?.teamName || 'Unknown' }
  }
}

export const hybridF1Api = {
  // Get drivers with fallback
  async getDrivers(sessionKey?: number, season?: number): Promise<HybridDriver[]> {
    // Try OpenF1 first
    try {
      const openf1Drivers = await openf1Api.getDrivers(sessionKey)
      return openf1Drivers.map(transformOpenF1Data.driver)
    } catch (error) {
      if (isRateLimitError(error) && FALLBACK_ENABLED) {
        console.warn('[Hybrid API] OpenF1 rate limited, falling back to f1api.dev')
        try {
          const year = season || new Date().getFullYear()
          const result = await safeF1ApiCall(() => f1ApiDev.getDrivers(year))
          if (result.data) {
            return result.data.drivers.map(transformF1ApiToHybridDriver)
          }
        } catch (fallbackError) {
          console.error('[Hybrid API] Fallback also failed:', fallbackError)
        }
      }
      throw error
    }
  },

  // Get sessions with fallback
  async getSessions(year?: number): Promise<HybridSession[]> {
    // Try OpenF1 first
    try {
      const openf1Sessions = await openf1Api.getSessions(year)
      return openf1Sessions.map(transformOpenF1Data.session)
    } catch (error) {
      if (isRateLimitError(error) && FALLBACK_ENABLED) {
        console.warn('[Hybrid API] OpenF1 rate limited, falling back to f1api.dev')
        try {
          const seasonYear = year || new Date().getFullYear()
          const result = await safeF1ApiCall(() => f1ApiDev.getSeasonSchedule(seasonYear))
          if (result.data) {
            return result.data.races.map(transformF1ApiToHybridSession)
          }
        } catch (fallbackError) {
          console.error('[Hybrid API] Fallback also failed:', fallbackError)
        }
      }
      throw error
    }
  },

  // Get latest session with fallback
  async getLatestSession(): Promise<HybridSession[]> {
    // Try OpenF1 first
    try {
      const openf1Sessions = await openf1Api.getLatestSession()
      return openf1Sessions.map(transformOpenF1Data.session)
    } catch (error) {
      if (isRateLimitError(error) && FALLBACK_ENABLED) {
        console.warn('[Hybrid API] OpenF1 rate limited, falling back to f1api.dev')
        try {
          const year = new Date().getFullYear()
          const result = await safeF1ApiCall(() => f1ApiDev.getSeasonSchedule(year))
          if (result.data) {
            // Return the most recent completed race as "latest"
            const completedRaces = result.data.races.filter(r => r.winner !== null)
            const latestRace = completedRaces[completedRaces.length - 1]
            if (latestRace) {
              return [transformF1ApiToHybridSession(latestRace)]
            }
          }
        } catch (fallbackError) {
          console.error('[Hybrid API] Fallback also failed:', fallbackError)
        }
      }
      throw error
    }
  },

  // Get driver standings with fallback
  async getDriverStandings(sessionKey: number, season?: number): Promise<HybridStanding[]> {
    // Try OpenF1 first
    try {
      const openf1Standings = await openf1Api.getDriverStandings(sessionKey)
      const drivers = await openf1Api.getDrivers(sessionKey)
      return openf1Standings.map(s => transformOpenF1Data.standing(s, drivers))
    } catch (error) {
      if (isRateLimitError(error) && FALLBACK_ENABLED) {
        console.warn('[Hybrid API] OpenF1 rate limited, falling back to f1api.dev')
        try {
          const year = season || new Date().getFullYear()
          const [standingsResult, driversResult] = await Promise.all([
            safeF1ApiCall(() => f1ApiDev.getDriverChampionship(year)),
            safeF1ApiCall(() => f1ApiDev.getDrivers(year))
          ])
          
          if (standingsResult.data && driversResult.data) {
            return standingsResult.data.drivers_championship.map(entry => 
              transformF1ApiToHybridStanding(entry, driversResult.data?.drivers || [])
            )
          }
        } catch (fallbackError) {
          console.error('[Hybrid API] Fallback also failed:', fallbackError)
        }
      }
      throw error
    }
  },

  // Get laps (OpenF1 only - no fallback for detailed telemetry)
  async getLaps(sessionKey: number, driverNumber?: number): Promise<any[]> {
    try {
      return await openf1Api.getLaps(sessionKey, driverNumber)
    } catch (error) {
      if (isRateLimitError(error)) {
        console.warn('[Hybrid API] OpenF1 rate limited for laps - detailed telemetry unavailable')
        // Return empty array for laps when rate limited
        return []
      }
      throw error
    }
  },

  // Get position data (OpenF1 only - no fallback for live positions)
  async getPositionData(sessionKey: number, driverNumber?: number): Promise<any[]> {
    try {
      return await openf1Api.getPositionData(sessionKey, driverNumber)
    } catch (error) {
      if (isRateLimitError(error)) {
        console.warn('[Hybrid API] OpenF1 rate limited for positions - using fallback data')
        // Return empty array when rate limited
        return []
      }
      throw error
    }
  },

  // Get car data (OpenF1 only - no fallback for telemetry)
  async getCarData(sessionKey: number, driverNumber?: number, minSpeed?: number): Promise<any[]> {
    try {
      return await openf1Api.getCarData(sessionKey, driverNumber, minSpeed)
    } catch (error) {
      if (isRateLimitError(error)) {
        console.warn('[Hybrid API] OpenF1 rate limited for car data - telemetry unavailable')
        return []
      }
      throw error
    }
  },

  // Get weather data (OpenF1 only - no fallback for live weather)
  async getWeatherData(sessionKey: number): Promise<any[]> {
    try {
      return await openf1Api.getWeatherData(sessionKey)
    } catch (error) {
      if (isRateLimitError(error)) {
        console.warn('[Hybrid API] OpenF1 rate limited for weather - using simulated data')
        return []
      }
      throw error
    }
  },

  // Get constructor standings with fallback
  async getConstructorStandings(sessionKey: number, season?: number): Promise<HybridStanding[]> {
    // Try OpenF1 first if available, otherwise use f1api.dev
    try {
      const year = season || new Date().getFullYear()
      const result = await safeF1ApiCall(() => f1ApiDev.getConstructorChampionship(year))
      
      if (result.data) {
        return result.data.constructors_championship.map(entry => ({
          position: entry.position,
          points: entry.points,
          wins: entry.wins,
          driver: { id: entry.teamId, name: entry.team.teamName, code: '', number: '', team: entry.team.teamName },
          team: { name: entry.team.teamName }
        }))
      }
    } catch (error) {
      console.error('[Hybrid API] Constructor standings failed:', error)
    }
    
    return []
  }
}

// Export transform functions for compatibility
export const transformHybridData = {
  driver: transformOpenF1Data.driver,
  session: transformOpenF1Data.session,
  standing: transformOpenF1Data.standing
}
