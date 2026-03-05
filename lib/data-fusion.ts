// F1 Data Fusion Service
// Combines historical telemetry data with live API data for comprehensive analysis

import { telemetryService, QualifyingResult, RaceResult, ChampionshipStanding } from './telemetry-data'
import { jolpicaApi, JolpicaApiResponse, transformJolpicaData } from './jolpica-api'
import { f1Api, safeApiCall } from './f1-api'
import { openf1Api, transformOpenF1Data } from './openf1-api'

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
      console.log(`🔍 Getting enhanced data for ${driverName}...`)
      
      // Load historical telemetry data from local Data folder
      const historicalData = await this.loadDriverHistoricalData(driverName, years)
      console.log(`📊 Local historical data: ${historicalData.performance.seasons.length} seasons`)
      
      // Get current live data from APIs including OpenF1
      const liveData = await this.loadDriverLiveData(driverName)
      console.log(`📡 Live data loaded: ${liveData.currentTeam || 'No team data'}`)
      
      // Get OpenF1 data for real telemetry
      const openF1Data = await this.getOpenF1DriverData(driverName)
      console.log(`🏎️ OpenF1 data: ${openF1Data.laps.length} laps, ${openF1Data.telemetry.length} telemetry points`)
      
      // Combine all data sources
      const combinedData = this.combineDriverDataSources(historicalData, liveData, openF1Data)
      
      // Generate predictions based on combined data
      const predictions = await this.generateDriverPredictions(combinedData.historical, combinedData.live)

      console.log(`✅ Enhanced data ready for ${driverName}`)
      return {
        driver: {
          id: this.generateDriverId(driverName),
          name: driverName,
          code: openF1Data.driver?.code || driverName.substring(0, 3).toUpperCase(),
          nationality: combinedData.historical.nationality || openF1Data.driver?.nationality || 'Unknown',
          team: combinedData.live.currentTeam || combinedData.historical.recentTeam || openF1Data.driver?.team || 'Unknown'
        },
        historicalPerformance: combinedData.historical.performance,
        liveData: combinedData.live,
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
      console.log(`🏁 Getting enhanced race data for ${raceName} ${year}...`)
      
      // Load local race data from Data folder
      const raceData = await telemetryService.getRaceData(year, raceName)
      if (!raceData) {
        console.log(`⚠️ No local race data found for ${raceName}, will use OpenF1 data`)
      }

      // Get OpenF1 race data
      const openF1RaceData = await this.getOpenF1RaceData(raceName, year)
      console.log(`🏎️ OpenF1 race data: ${openF1RaceData.sessions.length} sessions`)

      // Combine local and OpenF1 data
      const combinedRaceData = this.combineRaceDataSources(raceData, openF1RaceData)
      
      const historicalContext = await this.analyzeRaceHistoricalContext(raceName, year)
      const liveData = await this.loadRaceLiveData(raceName, year)
      const analysis = await this.generateRaceAnalysis(combinedRaceData, historicalContext)

      console.log(`✅ Enhanced race data ready for ${raceName}`)
      return {
        race: {
          name: combinedRaceData.race_name || openF1RaceData.session?.session_name || raceName,
          year,
          round: this.extractRoundFromName(combinedRaceData.race_name || raceName),
          circuit: this.extractCircuitFromName(combinedRaceData.race_name || raceName),
          date: liveData.date || openF1RaceData.session?.date_start || 'TBD'
        },
        historicalContext: this.enhanceHistoricalContextWithOpenF1(historicalContext, openF1RaceData),
        liveData: this.enhanceLiveDataWithOpenF1(liveData, openF1RaceData),
        analysis: this.enhanceAnalysisWithOpenF1(analysis, openF1RaceData)
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
    const performance: {
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
      consistency: number
    } = {
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
    const performance: {
      seasons: Array<{
        year: number
        driverPositions: number[]
        constructorPoints: number
        wins: number
        podiums: number
      }>
      averageTeamPosition: number
      totalChampionshipPoints: number
      dominance: number
      safetyCarProbability: number
      weatherPatterns: string[]
    } = {
      seasons: [],
      averageTeamPosition: 0,
      totalChampionshipPoints: 0,
      dominance: 0,
      safetyCarProbability: 0.3,
      weatherPatterns: []
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
      ? liveData.recentForm.reduce((a: number, b: number) => a + b, 0) / liveData.recentForm.length - avgRace
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
      trackTemperature: undefined,
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

  // Get OpenF1 data for a specific driver
  private async getOpenF1DriverData(driverName: string): Promise<{
    driver?: any,
    laps: any[],
    telemetry: any[],
    weather: any[]
  }> {
    try {
      console.log(`🏎️ Fetching OpenF1 data for ${driverName}...`)
      
      // Get latest session data
      const sessions = await openf1Api.getSessions(new Date().getFullYear())
      const latestSession = sessions[0]
      
      if (!latestSession) {
        console.log('No OpenF1 sessions available')
        return { laps: [], telemetry: [], weather: [] }
      }

      // Get drivers for this session
      const drivers = await openf1Api.getDrivers(latestSession.session_key)
      const targetDriver = drivers.find(d => 
        d.full_name.toLowerCase().includes(driverName.toLowerCase())
      )

      if (!targetDriver) {
        console.log(`Driver ${driverName} not found in OpenF1 data`)
        return { laps: [], telemetry: [], weather: [] }
      }

      // Get telemetry data for this driver
      const [carData, lapData, weatherData] = await Promise.all([
        openf1Api.getCarData(latestSession.session_key, targetDriver.driver_number),
        openf1Api.getLaps(latestSession.session_key, targetDriver.driver_number),
        openf1Api.getWeatherData(latestSession.session_key)
      ])

      console.log(`✅ OpenF1 data loaded: ${carData.length} telemetry points, ${lapData.length} laps`)
      
      return {
        driver: {
          name: targetDriver.full_name,
          code: targetDriver.name_acronym,
          team: targetDriver.team_name,
          nationality: 'International' // OpenF1 doesn't provide nationality
        },
        laps: lapData,
        telemetry: carData,
        weather: weatherData
      }
    } catch (error) {
      console.error(`❌ Error fetching OpenF1 data for ${driverName}:`, error)
      return { laps: [], telemetry: [], weather: [] }
    }
  }

  // Combine data from local sources and OpenF1 API
  private combineDriverDataSources(
    historicalData: any, 
    liveData: any, 
    openF1Data: { driver?: any, laps: any[], telemetry: any[], weather: any[] }
  ): {
    historical: any,
    live: any
  } {
    try {
      // Combine historical data (local) with OpenF1 performance data
      const enhancedHistorical = { ...historicalData }
      
      // Add OpenF1 lap data to historical performance if available
      if (openF1Data.laps.length > 0) {
        const openF1Performance = this.analyzeOpenF1LapData(openF1Data.laps)
        enhancedHistorical.performance = {
          ...enhancedHistorical.performance,
          // Blend local data with OpenF1 data
          averageQualifyingPosition: this.blendPerformanceMetrics(
            enhancedHistorical.performance.averageQualifyingPosition,
            openF1Performance.avgPosition
          ),
          averageRacePosition: this.blendPerformanceMetrics(
            enhancedHistorical.performance.averageRacePosition,
            openF1Performance.avgPosition
          ),
          consistency: this.blendPerformanceMetrics(
            enhancedHistorical.performance.consistency,
            openF1Performance.consistency
          ),
          // Add OpenF1 specific metrics
          recentLapTimes: openF1Data.laps.slice(-10).map(lap => lap.lap_duration),
          topSpeed: Math.max(...openF1Data.telemetry.map(t => t.speed))
        }
      }

      // Enhance live data with OpenF1 telemetry
      const enhancedLive = { ...liveData }
      if (openF1Data.telemetry.length > 0) {
        const latestTelemetry = openF1Data.telemetry[openF1Data.telemetry.length - 1]
        enhancedLive.currentSpeed = latestTelemetry.speed
        enhancedLive.currentThrottle = latestTelemetry.throttle
        enhancedLive.currentGear = latestTelemetry.n_gear
        enhancedLive.currentRPM = latestTelemetry.rpm
        enhancedLive.currentDRS = latestTelemetry.drs
      }

      // Add weather data from OpenF1
      if (openF1Data.weather.length > 0) {
        const latestWeather = openF1Data.weather[openF1Data.weather.length - 1]
        enhancedLive.weather = {
          airTemp: latestWeather.air_temperature,
          trackTemp: latestWeather.track_temperature,
          humidity: latestWeather.humidity,
          windSpeed: latestWeather.wind_speed,
          rainfall: latestWeather.rainfall
        }
      }

      console.log('🔄 Data sources combined successfully')
      return {
        historical: enhancedHistorical,
        live: enhancedLive
      }
    } catch (error) {
      console.error('❌ Error combining data sources:', error)
      return {
        historical: historicalData,
        live: liveData
      }
    }
  }

  // Analyze OpenF1 lap data to extract performance metrics
  private analyzeOpenF1LapData(lapData: any[]): {
    avgPosition: number,
    consistency: number,
    avgLapTime: number
  } {
    if (!lapData.length) {
      return { avgPosition: 10, consistency: 0.8, avgLapTime: 90 }
    }

    const lapTimes = lapData.map(lap => lap.lap_duration).filter(time => time > 0)
    const avgLapTime = lapTimes.reduce((sum, time) => sum + time, 0) / lapTimes.length
    
    // Calculate consistency (lower variance = higher consistency)
    const variance = lapTimes.reduce((sum, time) => {
      const mean = avgLapTime
      return sum + Math.pow(time - mean, 2)
    }, 0) / lapTimes.length
    
    const consistency = Math.max(0.1, 1 - (Math.sqrt(variance) / avgLapTime))
    
    // Estimate position based on lap time (faster = better position)
    const avgPosition = Math.max(1, Math.min(20, Math.round(20 - (avgLapTime - 80) / 2)))

    return { avgPosition, consistency, avgLapTime }
  }

  // Blend performance metrics from different data sources
  private blendPerformanceMetrics(localValue: number, openF1Value: number, weight: number = 0.6): number {
    // Give more weight to local historical data, but incorporate OpenF1 data
    return Math.round((localValue * weight) + (openF1Value * (1 - weight)))
  }

  // Get OpenF1 race data for a specific race
  private async getOpenF1RaceData(raceName: string, year: number): Promise<{
    session?: any,
    sessions: any[],
    weather: any[],
    laps: any[]
  }> {
    try {
      console.log(`🏎️ Fetching OpenF1 race data for ${raceName} ${year}...`)
      
      // Get sessions for the year
      const sessions = await openf1Api.getSessions(year)
      
      // Find matching session
      const matchingSession = sessions.find(s => 
        s.location.toLowerCase().includes(raceName.toLowerCase()) ||
        s.circuit_short_name.toLowerCase().includes(raceName.toLowerCase()) ||
        s.session_name.toLowerCase().includes(raceName.toLowerCase())
      ) || sessions[0] // fallback to first session

      if (!matchingSession) {
        console.log(`No OpenF1 sessions found for ${raceName}`)
        return { sessions: [], weather: [], laps: [] }
      }

      // Get weather and lap data for this session
      const [weatherData, lapData] = await Promise.all([
        openf1Api.getWeatherData(matchingSession.session_key),
        openf1Api.getLaps(matchingSession.session_key)
      ])

      console.log(`✅ OpenF1 race data loaded: ${weatherData.length} weather points, ${lapData.length} laps`)
      
      return {
        session: matchingSession,
        sessions: sessions,
        weather: weatherData,
        laps: lapData
      }
    } catch (error) {
      console.error(`❌ Error fetching OpenF1 race data for ${raceName}:`, error)
      return { sessions: [], weather: [], laps: [] }
    }
  }

  // Combine race data from local sources and OpenF1 API
  private combineRaceDataSources(localData: any, openF1Data: any): any {
    try {
      // If local data exists, use it as primary and enhance with OpenF1
      if (localData) {
        return {
          ...localData,
          // Add OpenF1 enhancements
          openF1Sessions: openF1Data.sessions,
          openF1Weather: openF1Data.weather,
          openF1Laps: openF1Data.laps
        }
      }
      
      // If no local data, create structure from OpenF1 data
      return {
        race_name: openF1Data.session?.session_name || 'Unknown Race',
        data: openF1Data.laps.map((lap: any) => ({
          section: 'race_results',
          driver: `Driver ${lap.driver_number}`,
          position: lap.lap_number,
          time: lap.lap_duration
        }))
      }
    } catch (error) {
      console.error('❌ Error combining race data sources:', error)
      return localData || { race_name: 'Unknown Race', data: [] }
    }
  }

  // Enhance historical context with OpenF1 data
  private enhanceHistoricalContextWithOpenF1(localContext: any, openF1Data: any): any {
    try {
      const enhanced = { ...localContext }
      
      // Add OpenF1 weather patterns
      if (openF1Data.weather.length > 0) {
        const weatherPatterns = this.analyzeOpenF1WeatherPatterns(openF1Data.weather)
        enhanced.weatherPatterns = [
          ...(localContext.weatherPatterns || []),
          ...weatherPatterns
        ]
      }

      // Add OpenF1 session data
      if (openF1Data.sessions.length > 0) {
        enhanced.recentSessions = openF1Data.sessions.slice(-5)
      }

      return enhanced
    } catch (error) {
      console.error('❌ Error enhancing historical context:', error)
      return localContext
    }
  }

  // Enhance live data with OpenF1 data
  private enhanceLiveDataWithOpenF1(localLiveData: any, openF1Data: any): any {
    try {
      const enhanced = { ...localLiveData }
      
      // Add current weather from OpenF1
      if (openF1Data.weather.length > 0) {
        const latestWeather = openF1Data.weather[openF1Data.weather.length - 1]
        enhanced.weather = {
          temperature: latestWeather.air_temperature,
          trackTemperature: latestWeather.track_temperature,
          humidity: latestWeather.humidity,
          windSpeed: latestWeather.wind_speed,
          rainfall: latestWeather.rainfall
        }
      }

      // Add session status
      if (openF1Data.session) {
        enhanced.currentStatus = 'completed' // OpenF1 data is from completed sessions
        enhanced.sessionInfo = {
          name: openF1Data.session.session_name,
          date: openF1Data.session.date_start,
          location: openF1Data.session.location
        }
      }

      return enhanced
    } catch (error) {
      console.error('❌ Error enhancing live data:', error)
      return localLiveData
    }
  }

  // Enhance analysis with OpenF1 data
  private enhanceAnalysisWithOpenF1(localAnalysis: any, openF1Data: any): any {
    try {
      const enhanced = { ...localAnalysis }
      
      // Add OpenF1 specific insights
      if (openF1Data.laps.length > 0) {
        const lapAnalysis = this.analyzeOpenF1LapData(openF1Data.laps)
        enhanced.openF1Insights = {
          averageLapTime: lapAnalysis.avgLapTime,
          consistency: lapAnalysis.consistency,
          estimatedDifficulty: lapAnalysis.avgLapTime < 85 ? 'hard' : lapAnalysis.avgLapTime > 95 ? 'easy' : 'medium'
        }
      }

      // Add weather impact analysis
      if (openF1Data.weather.length > 0) {
        enhanced.weatherImpact = this.analyzeOpenF1WeatherImpact(openF1Data.weather)
      }

      // Add key factors from OpenF1 data
      const openF1Factors = ['Real telemetry data', 'Actual lap times', 'Live weather conditions']
      enhanced.keyFactors = [
        ...(localAnalysis.keyFactors || []),
        ...openF1Factors.filter(factor => !localAnalysis.keyFactors?.includes(factor))
      ]

      return enhanced
    } catch (error) {
      console.error('❌ Error enhancing analysis:', error)
      return localAnalysis
    }
  }

  // Analyze OpenF1 weather patterns
  private analyzeOpenF1WeatherPatterns(weatherData: any[]): Array<{ condition: string, frequency: number }> {
    if (!weatherData.length) return [{ condition: 'sunny', frequency: 70 }]
    
    const sunny = weatherData.filter(w => w.rainfall === 0).length
    const rainy = weatherData.filter(w => w.rainfall > 0).length
    const cloudy = weatherData.filter(w => w.rainfall === 0 && w.humidity > 60).length
    const total = weatherData.length
    
    return [
      { condition: 'sunny', frequency: Math.round((sunny / total) * 100) },
      { condition: 'rainy', frequency: Math.round((rainy / total) * 100) },
      { condition: 'cloudy', frequency: Math.round((cloudy / total) * 100) }
    ]
  }

  // Analyze OpenF1 weather impact on racing
  private analyzeOpenF1WeatherImpact(weatherData: any[]): {
    impact: 'low' | 'medium' | 'high',
    factors: string[]
  } {
    if (!weatherData.length) return { impact: 'medium', factors: ['Unknown weather'] }
    
    const factors: string[] = []
    let impactScore = 0

    const avgRainfall = weatherData.reduce((sum, w) => sum + w.rainfall, 0) / weatherData.length
    if (avgRainfall > 0) {
      factors.push('Rain detected')
      impactScore += 30
    }

    const avgWindSpeed = weatherData.reduce((sum, w) => sum + w.wind_speed, 0) / weatherData.length
    if (avgWindSpeed > 10) {
      factors.push('High wind speeds')
      impactScore += 20
    }

    const avgHumidity = weatherData.reduce((sum, w) => sum + w.humidity, 0) / weatherData.length
    if (avgHumidity > 70) {
      factors.push('High humidity')
      impactScore += 10
    }

    const impact = impactScore > 25 ? 'high' : impactScore > 10 ? 'medium' : 'low'
    return { impact, factors }
  }
}

export const dataFusionService = DataFusionService.getInstance()
