// F1 Telemetry Data Service
// Handles loading and parsing of local JSON telemetry data files

import fs from 'fs'
import path from 'path'

// Telemetry data interfaces based on the JSON structure
export interface QualifyingResult {
  position: string
  driver: string
  constructor: string
  q1: string
  q2: string
  q3: string
}

export interface RaceResult {
  driver: string
  team: string
  "starting position": number
  "finish position": number
  "ergast laps": number
  points: number
  "fastest lap time": string
  dnf: string
  "tire compounds": string
  "rain during race": string
}

export interface ChampionshipStanding {
  pos: number
  driver: string
  nationality: string
  car: string
  pts: number
}

export interface RaceData {
  race_name: string
  data: Array<{
    section?: 'qualifying_results' | 'race_results' | 'championship_standings'
  } | QualifyingResult | RaceResult | ChampionshipStanding>
}

export interface TelemetrySeason {
  year: number
  races: RaceData[]
}

export class TelemetryDataService {
  private static instance: TelemetryDataService
  private cache: Map<string, TelemetrySeason> = new Map()

  static getInstance(): TelemetryDataService {
    if (!TelemetryDataService.instance) {
      TelemetryDataService.instance = new TelemetryDataService()
    }
    return TelemetryDataService.instance
  }

  // Load telemetry data for a specific season
  async loadSeasonData(year: number): Promise<TelemetrySeason | null> {
    const cacheKey = `season_${year}`
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!
    }

    try {
      const filePath = path.join(process.cwd(), 'Data', 'f1-telemetry', `F1_Seasons_Cleaned_${year}.json`)
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        console.warn(`Telemetry data file not found for season ${year}: ${filePath}`)
        return null
      }

      const fileContent = fs.readFileSync(filePath, 'utf-8')
      const rawData: RaceData[] = JSON.parse(fileContent)

      const seasonData: TelemetrySeason = {
        year,
        races: rawData
      }

      this.cache.set(cacheKey, seasonData)
      return seasonData

    } catch (error) {
      console.error(`Error loading telemetry data for season ${year}:`, error)
      return null
    }
  }

  // Get specific race data
  async getRaceData(year: number, raceName: string): Promise<RaceData | null> {
    const seasonData = await this.loadSeasonData(year)
    if (!seasonData) return null

    return seasonData.races.find(race => 
      race.race_name.toLowerCase().includes(raceName.toLowerCase())
    ) || null
  }

  // Extract qualifying results from race data
  extractQualifyingResults(raceData: RaceData): QualifyingResult[] {
    const qualifyingIndex = raceData.data.findIndex(item => 
      'section' in item && (item as any).section === 'qualifying_results'
    )
    
    if (qualifyingIndex === -1) return []

    const results: QualifyingResult[] = []
    for (let i = qualifyingIndex + 1; i < raceData.data.length; i++) {
      const item = raceData.data[i]
      if ('section' in item) break // Reached next section
      results.push(item as QualifyingResult)
    }

    return results
  }

  // Extract race results from race data
  extractRaceResults(raceData: RaceData): RaceResult[] {
    const raceIndex = raceData.data.findIndex(item => 
      'section' in item && (item as any).section === 'race_results'
    )
    
    if (raceIndex === -1) return []

    const results: RaceResult[] = []
    for (let i = raceIndex + 1; i < raceData.data.length; i++) {
      const item = raceData.data[i]
      if ('section' in item) break // Reached next section
      results.push(item as RaceResult)
    }

    return results
  }

  // Extract championship standings from race data
  extractChampionshipStandings(raceData: RaceData): ChampionshipStanding[] {
    const standingsIndex = raceData.data.findIndex(item => 
      'section' in item && (item as any).section === 'championship_standings'
    )
    
    if (standingsIndex === -1) return []

    const standings: ChampionshipStanding[] = []
    for (let i = standingsIndex + 1; i < raceData.data.length; i++) {
      const item = raceData.data[i]
      if ('section' in item) break // Reached next section
      standings.push(item as ChampionshipStanding)
    }

    return standings
  }

  // Get driver performance history across multiple races
  async getDriverPerformanceHistory(year: number, driverName: string): Promise<{
    qualifying: Array<{ race: string; position: string; times: { q1?: string; q2?: string; q3?: string } }>
    races: Array<{ race: string; position: string; points: string; fastest_lap?: string }>
  }> {
    const seasonData = await this.loadSeasonData(year)
    if (!seasonData) return { qualifying: [], races: [] }

    const qualifying: any[] = []
    const races: any[] = []

    seasonData.races.forEach(race => {
      // Check qualifying results
      const qualResults = this.extractQualifyingResults(race)
      const qualResult = qualResults.find(r => r.driver.toLowerCase().includes(driverName.toLowerCase()))
      if (qualResult) {
        qualifying.push({
          race: race.race_name,
          position: qualResult.position,
          times: {
            q1: qualResult.q1 || undefined,
            q2: qualResult.q2 || undefined,
            q3: qualResult.q3 || undefined
          }
        })
      }

      // Check race results
      const raceResults = this.extractRaceResults(race)
      const raceResult = raceResults.find(r => r.driver.toLowerCase().includes(driverName.toLowerCase()))
      if (raceResult) {
        races.push({
          race: race.race_name,
          position: raceResult["finish position"].toString(),
          points: raceResult.points.toString(),
          fastest_lap: raceResult["fastest lap time"] || undefined
        })
      }
    })

    return { qualifying, races }
  }

  // Get constructor performance history
  async getConstructorPerformanceHistory(year: number, constructorName: string): Promise<{
    qualifying: Array<{ race: string; positions: string[] }>
    races: Array<{ race: string; positions: string[]; points: number[] }>
  }> {
    const seasonData = await this.loadSeasonData(year)
    if (!seasonData) return { qualifying: [], races: [] }

    const qualifying: any[] = []
    const races: any[] = []

    seasonData.races.forEach(race => {
      // Check qualifying results
      const qualResults = this.extractQualifyingResults(race)
      const qualPositions = qualResults
        .filter(r => r.constructor.toLowerCase().includes(constructorName.toLowerCase()))
        .map(r => r.position)

      if (qualPositions.length > 0) {
        qualifying.push({
          race: race.race_name,
          positions: qualPositions
        })
      }

      // Check race results
      const raceResults = this.extractRaceResults(race)
      const racePositions = raceResults
        .filter(r => r.team.toLowerCase().includes(constructorName.toLowerCase()))
        .map(r => ({ position: r["finish position"].toString(), points: r.points }))

      if (racePositions.length > 0) {
        races.push({
          race: race.race_name,
          positions: racePositions.map(rp => rp.position),
          points: racePositions.map(rp => rp.points)
        })
      }
    })

    return { qualifying, races }
  }

  // Clear cache (useful for development)
  clearCache(): void {
    this.cache.clear()
  }
}

export const telemetryService = TelemetryDataService.getInstance()
