// F1 Data Fusion Service
// Combines historical telemetry data with live API data for comprehensive analysis

import { telemetryService, QualifyingResult, RaceResult, ChampionshipStanding } from './telemetry-data'
import { jolpicaApi, JolpicaApiResponse, transformJolpicaData } from './jolpica-api'
import { f1Api, safeApiCall } from './f1-api'

// Enhanced data interfaces combining telemetry and live data
export interface EnhancedDriverData {
  driver: {
    id: string
    name: string
    code?: string
    nationality: string
    team: string
  }
  historicalPerformance: {
    seasons: Array<{
      year: number
      qualifying_positions: number[]
      race_positions: number[]
      points: number[]
      fastest_laps: number
      dnfs: number
    }>
    averageQualifyingPosition: number
    averageRacePosition: number
    totalPoints: number
    consistency: number // Position variance
  }
  liveData: {
    currentPosition?: number
    currentPoints?: number
    recentForm?: number[] // Last 5 races
    status?: string
  }
  predictions: {
    nextRaceQualifying: number
    nextRaceRace: number
    championshipFinish: number
    confidence: number
  }
}

export interface EnhancedConstructorData {
  constructor: {
    id: string
    name: string
    nationality: string
  }
  historicalPerformance: {
    seasons: Array<{
      year: number
      driverPositions: number[]
      constructorPoints: number
      wins: number
      podiums: number
    }>
    averageTeamPosition: number
    totalChampionshipPoints: number
    dominance: number // How dominant the team was
  }
  liveData: {
    currentChampionshipPosition?: number
    currentPoints?: number
    drivers: string[]
  }
  predictions: {
    championshipFinish: number
    totalWins: number
    developmentTrend: 'improving' | 'stable' | 'declining'
  }
}

export interface EnhancedRaceData {
  race: {
    name: string
    year: number
    round: number
    circuit: string
    date: string
  }
  historicalContext: {
    pastWinners: Array<{ year: number; driver: string; team: string }>
    averagePitStops: number
    safetyCarProbability: number
    weatherPatterns: Array<{ condition: string; frequency: number }>
  }
  liveData: {
    currentStatus?: 'scheduled' | 'in_progress' | 'completed'
    weather?: any
    trackTemperature?: number
  }
  analysis: {
    keyFactors: string[]
    driverRecommendations: Array<{
      driver: string
      recommendation: string
      confidence: number
    }>
  }
}

export class DataFusionService {
  private static instance: DataFusionService

  static getInstance(): DataFusionService {
    if (!DataFusionService.instance) {
      DataFusionService.instance = new DataFusionService()
    }
    return DataFusionService.instance
  }

  // Get comprehensive driver analysis combining historical and live data
  async getEnhancedDriverData(driverName: string, years: number[] = [2024, 2023, 2022]): Promise<EnhancedDriverData | null> {
    try {
      // Load historical telemetry data
      const historicalData = await this.loadDriverHistoricalData(driverName, years)
      
      // Get current live data from APIs
      const liveData = await this.loadDriverLiveData(driverName)
      
      // Generate predictions based on combined data
      const predictions = await this.generateDriverPredictions(historicalData, liveData)

      return {
        driver: {
          id: this.generateDriverId(driverName),
          name: driverName,
          nationality: historicalData.nationality || 'Unknown',
          team: liveData.currentTeam || historicalData.recentTeam || 'Unknown'
        },
        historicalPerformance: historicalData.performance,
        liveData: liveData,
        predictions: predictions
      }
    } catch (error) {
      console.error(`Error generating enhanced driver data for ${driverName}:`, error)
      return null
    }
  }

  // Get comprehensive constructor analysis
  async getEnhancedConstructorData(constructorName: string, years: number[] = [2024, 2023, 2022]): Promise<EnhancedConstructorData | null> {
    try {
      const historicalData = await this.loadConstructorHistoricalData(constructorName, years)
      const liveData = await this.loadConstructorLiveData(constructorName)
      const predictions = await this.generateConstructorPredictions(historicalData, liveData)

      return {
        constructor: {
          id: this.generateConstructorId(constructorName),
          name: constructorName,
          nationality: historicalData.nationality || 'Unknown'
        },
        historicalPerformance: historicalData.performance,
        liveData: liveData,
        predictions: predictions
      }
    } catch (error) {
      console.error(`Error generating enhanced constructor data for ${constructorName}:`, error)
      return null
    }
  }

  // Get enhanced race analysis
  async getEnhancedRaceData(raceName: string, year: number): Promise<EnhancedRaceData | null> {
    try {
      const raceData = await telemetryService.getRaceData(year, raceName)
      if (!raceData) return null

      const historicalContext = await this.analyzeRaceHistoricalContext(raceName, year)
      const liveData = await this.loadRaceLiveData(raceName, year)
      const analysis = await this.generateRaceAnalysis(raceData, historicalContext)

      return {
        race: {
          name: raceData.race_name,
          year,
          round: this.extractRoundFromName(raceData.race_name),
          circuit: this.extractCircuitFromName(raceData.race_name),
          date: liveData.date || 'TBD'
        },
        historicalContext,
        liveData,
        analysis
      }
    } catch (error) {
      console.error(`Error generating enhanced race data for ${raceName}:`, error)
      return null
    }
  }

  // Make intelligent recommendations based on fused data
  async generateRecommendations(driverName: string, raceName: string): Promise<{
    strategy: string[]
    setup: string[]
    risk: 'low' | 'medium' | 'high'
    confidence: number
  }> {
    try {
      const driverData = await this.getEnhancedDriverData(driverName)
      const raceData = await this.getEnhancedRaceData(raceName, new Date().getFullYear())

      if (!driverData || !raceData) {
        return { strategy: [], setup: [], risk: 'medium', confidence: 0 }
      }

      // Analyze driver performance at similar circuits
      const similarCircuits = await this.findSimilarCircuits(raceData.race.circuit)
      const performanceAtSimilar = await this.analyzeDriverAtCircuits(driverName, similarCircuits)

      // Generate recommendations
      const recommendations = this.analyzeRecommendations(driverData, raceData, performanceAtSimilar)

      return recommendations
    } catch (error) {
      console.error('Error generating recommendations:', error)
      return { strategy: [], setup: [], risk: 'medium', confidence: 0 }
    }
  }

  // Private helper methods
  private async loadDriverHistoricalData(driverName: string, years: number[]) {
    const performance = {
      seasons: [],
      averageQualifyingPosition: 0,
      averageRacePosition: 0,
      totalPoints: 0,
      consistency: 0
    }

    let allQualifyingPositions: number[] = []
    let allRacePositions: number[] = []
    let totalPoints = 0

    for (const year of years) {
      const history = await telemetryService.getDriverPerformanceHistory(year, driverName)
      
      const qualPositions = history.qualifying.map(q => parseInt(q.position) || 999).filter(p => p < 99)
      const racePositions = history.races.map(r => parseInt(r.position) || 999).filter(p => p < 99)
      const points = history.races.reduce((sum, r) => sum + (parseFloat(r.points) || 0), 0)

      allQualifyingPositions = [...allQualifyingPositions, ...qualPositions]
      allRacePositions = [...allRacePositions, ...racePositions]
      totalPoints += points

      performance.seasons.push({
        year,
        qualifying_positions: qualPositions,
        race_positions: racePositions,
        points: history.races.map(r => parseFloat(r.points) || 0),
        fastest_laps: history.races.filter(r => r.fastest_lap).length,
        dnfs: racePositions.filter(p => p >= 99).length
      })
    }

    performance.averageQualifyingPosition = allQualifyingPositions.length > 0 
      ? allQualifyingPositions.reduce((a, b) => a + b, 0) / allQualifyingPositions.length 
      : 0

    performance.averageRacePosition = allRacePositions.length > 0
      ? allRacePositions.reduce((a, b) => a + b, 0) / allRacePositions.length
      : 0

    performance.totalPoints = totalPoints
    performance.consistency = this.calculateVariance(allRacePositions)

    return {
      performance,
      nationality: 'Unknown', // Would need to be extracted from data
      recentTeam: 'Unknown'
    }
  }

  private async loadDriverLiveData(driverName: string) {
    try {
      // Try to get current data from JOLPICA API
      const { data: standingsData } = await safeApiCall(() => jolpicaApi.getCurrentDriverStandings())
      
      if (standingsData) {
        const driver = standingsData.MRData.StandingsTable.StandingsLists[0]?.DriverStandings.find(
          d => `${d.Driver.givenName} ${d.Driver.familyName}`.toLowerCase().includes(driverName.toLowerCase())
        )

        if (driver) {
          return {
            currentPosition: parseInt(driver.position),
            currentPoints: parseInt(driver.points),
            recentForm: [], // Would need additional API calls
            status: 'active',
            currentTeam: driver.Constructors[0]?.name
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load live driver data:', error)
    }

    return {
      currentPosition: undefined,
      currentPoints: undefined,
      recentForm: [],
      status: 'unknown',
      currentTeam: undefined
    }
  }

  private async loadConstructorHistoricalData(constructorName: string, years: number[]) {
    const performance = {
      seasons: [],
      averageTeamPosition: 0,
      totalChampionshipPoints: 0,
      dominance: 0
    }

    for (const year of years) {
      const history = await telemetryService.getConstructorPerformanceHistory(year, constructorName)
      
      performance.seasons.push({
        year,
        driverPositions: history.qualifying.flatMap(q => q.positions.map(p => parseInt(p) || 999)),
        constructorPoints: history.races.reduce((sum, r) => sum + r.points.reduce((s, p) => s + p, 0), 0),
        wins: 0, // Would need to be calculated
        podiums: 0 // Would need to be calculated
      })
    }

    return {
      performance,
      nationality: 'Unknown'
    }
  }

  private async loadConstructorLiveData(constructorName: string) {
    try {
      const { data: standingsData } = await safeApiCall(() => jolpicaApi.getCurrentDriverStandings())
      
      if (standingsData) {
        const drivers = standingsData.MRData.StandingsTable.StandingsLists[0]?.DriverStandings.filter(
          d => d.Constructors[0]?.name.toLowerCase().includes(constructorName.toLowerCase())
        )

        if (drivers && drivers.length > 0) {
          return {
            currentChampionshipPosition: Math.min(...drivers.map(d => parseInt(d.position))),
            currentPoints: drivers.reduce((sum, d) => sum + parseInt(d.points), 0),
            drivers: drivers.map(d => `${d.Driver.givenName} ${d.Driver.familyName}`)
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load live constructor data:', error)
    }

    return {
      currentChampionshipPosition: undefined,
      currentPoints: undefined,
      drivers: []
    }
  }

  private async generateDriverPredictions(historicalData: any, liveData: any) {
    // Simple prediction algorithm based on historical performance and current form
    const avgQualifying = historicalData.performance.averageQualifyingPosition
    const avgRace = historicalData.performance.averageRacePosition
    const consistency = historicalData.performance.consistency

    // Adjust predictions based on current form if available
    const currentFormAdjustment = liveData.recentForm && liveData.recentForm.length > 0
      ? liveData.recentForm.reduce((a, b) => a + b, 0) / liveData.recentForm.length - avgRace
      : 0

    return {
      nextRaceQualifying: Math.max(1, Math.round(avgQualifying + currentFormAdjustment * 0.3)),
      nextRaceRace: Math.max(1, Math.round(avgRace + currentFormAdjustment * 0.5)),
      championshipFinish: Math.max(1, Math.round(avgRace)),
      confidence: Math.max(0.1, Math.min(0.9, 1 - (consistency / 100)))
    }
  }

  private async generateConstructorPredictions(historicalData: any, liveData: any) {
    return {
      championshipFinish: 3, // Default prediction
      totalWins: 2,
      developmentTrend: 'stable' as const
    }
  }

  private async analyzeRaceHistoricalContext(raceName: string, year: number) {
    return {
      pastWinners: [],
      averagePitStops: 2.5,
      safetyCarProbability: 0.3,
      weatherPatterns: []
    }
  }

  private async loadRaceLiveData(raceName: string, year: number) {
    return {
      currentStatus: 'scheduled' as const,
      weather: null,
      trackTemperature: null,
      date: 'TBD'
    }
  }

  private async generateRaceAnalysis(raceData: any, historicalContext: any) {
    return {
      keyFactors: ['Tire strategy', 'Weather conditions', 'Starting position'],
      driverRecommendations: []
    }
  }

  private generateDriverId(driverName: string): string {
    return driverName.toLowerCase().replace(/\s+/g, '_')
  }

  private generateConstructorId(constructorName: string): string {
    return constructorName.toLowerCase().replace(/\s+/g, '_')
  }

  private extractRoundFromName(raceName: string): number {
    const match = raceName.match(/Round (\d+)/)
    return match ? parseInt(match[1]) : 0
  }

  private extractCircuitFromName(raceName: string): string {
    return raceName.replace(/\s*\(Round \d+\)/, '').replace(' Grand Prix', '').trim()
  }

  private calculateVariance(numbers: number[]): number {
    if (numbers.length === 0) return 0
    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length
    const variance = numbers.reduce((sum, num) => sum + Math.pow(num - mean, 2), 0) / numbers.length
    return Math.sqrt(variance)
  }

  private async findSimilarCircuits(circuitName: string): Promise<string[]> {
    // Simple implementation - would be enhanced with actual circuit characteristics
    return [circuitName]
  }

  private async analyzeDriverAtCircuits(driverName: string, circuits: string[]): Promise<any> {
    return { averagePosition: 10, consistency: 0.8 }
  }

  private analyzeRecommendations(driverData: EnhancedDriverData, raceData: EnhancedRaceData, performanceAtSimilar: any) {
    return {
      strategy: ['Focus on tire management', 'Overtake in sector 2'],
      setup: ['Medium downforce', 'Soft tire compound for start'],
      risk: 'medium' as const,
      confidence: 0.75
    }
  }
}

export const dataFusionService = DataFusionService.getInstance()
