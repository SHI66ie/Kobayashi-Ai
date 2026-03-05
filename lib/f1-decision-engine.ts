// F1 Decision Making Engine
// Advanced decision logic based on historical telemetry data and live API data

import { dataFusionService, EnhancedDriverData, EnhancedRaceData } from './data-fusion'
import { telemetryService } from './telemetry-data'
import { getRecentContext, addMemoryEntry } from './memory'
import { getAICompletion } from './ai-service'
import { openf1Api, transformOpenF1Data } from './openf1-api'

export interface DecisionContext {
  driver: string
  race: string
  year: number
  currentConditions?: {
    weather: string
    trackTemperature: number
    tireCompound: string
    fuelLevel: number
    lapNumber: number
  }
}

export interface RaceStrategy {
  tireStrategy: {
    startCompound: string
    stint1: { compound: string; laps: number }
    stint2: { compound: string; laps: number }
    stint3?: { compound: string; laps: number }
  }
  pitStrategy: {
    lapNumbers: number[]
    expectedPitTime: number
    safetyWindow: number[]
  }
  racePace: {
    targetLapTime: string
    fuelAdjustedPace: string
    tireDegradationFactor: number
  }
}

export interface DecisionRecommendation {
  type: 'strategy' | 'setup' | 'in_race' | 'qualifying'
  priority: 'critical' | 'high' | 'medium' | 'low'
  confidence: number
  recommendation: string
  reasoning: string
  dataPoints: string[]
  expectedOutcome: string
  riskLevel: 'low' | 'medium' | 'high'
}

export interface DecisionAnalysis {
  context: DecisionContext
  recommendations: DecisionRecommendation[]
  overallStrategy: RaceStrategy
  riskAssessment: {
    factors: string[]
    overallRisk: 'low' | 'medium' | 'high'
    mitigation: string[]
  }
  performancePrediction: {
    qualifyingPosition: number
    racePosition: number
    pointsScored: number
    probabilityOfPodium: number
    probabilityOfWin: number
  }
}

export class F1DecisionEngine {
  private static instance: F1DecisionEngine

  static getInstance(): F1DecisionEngine {
    if (!F1DecisionEngine.instance) {
      F1DecisionEngine.instance = new F1DecisionEngine()
    }
    return F1DecisionEngine.instance
  }

  // Get real OpenF1 data for fallback when local data fails
  private async getOpenF1FallbackData(context: DecisionContext): Promise<{ driverData?: any, raceData?: any }> {
    try {
      console.log('Fetching OpenF1 data for fallback...')
      
      // Get latest session data
      const sessions = await openf1Api.getSessions(context.year)
      const latestSession = sessions.find(s => 
        s.session_type === 'Race' && 
        s.location.toLowerCase().includes(context.race.toLowerCase())
      ) || sessions[0] // fallback to first session

      if (!latestSession) {
        console.log('No OpenF1 sessions found, using mock data')
        return {}
      }

      console.log(`Using OpenF1 session: ${latestSession.session_name} at ${latestSession.location}`)

      // Get drivers for this session
      const drivers = await openf1Api.getDrivers(latestSession.session_key)
      const targetDriver = drivers.find(d => 
        d.full_name.toLowerCase().includes(context.driver.toLowerCase())
      )

      // Get telemetry data
      const [carData, lapData, weatherData] = await Promise.all([
        targetDriver ? openf1Api.getCarData(latestSession.session_key, targetDriver.driver_number) : [],
        targetDriver ? openf1Api.getLaps(latestSession.session_key, targetDriver.driver_number) : [],
        openf1Api.getWeatherData(latestSession.session_key)
      ])

      // Transform to our data format
      const driverData = targetDriver ? {
        driver: {
          id: targetDriver.driver_number.toString(),
          name: targetDriver.full_name,
          code: targetDriver.name_acronym,
          nationality: 'International', // OpenF1 doesn't provide this
          team: targetDriver.team_name
        },
        historicalPerformance: {
          seasons: [],
          averageQualifyingPosition: this.calculateAveragePosition(lapData, 'qualifying'),
          averageRacePosition: this.calculateAveragePosition(lapData, 'race'),
          totalPoints: 0, // Would need championship data
          consistency: this.calculateConsistency(lapData)
        },
        liveData: {
          currentPosition: 5, // Would need position data
          currentPoints: 0,
          status: 'active',
          recentForm: this.getRecentForm(lapData)
        },
        predictions: {
          nextRaceQualifying: this.predictNextQualifying(lapData),
          nextRaceRace: this.predictNextRace(lapData),
          championshipFinish: 5,
          confidence: 0.8
        }
      } : null

      const raceData = {
        race: {
          name: latestSession.session_name,
          year: context.year,
          round: 1, // OpenF1 doesn't provide round
          circuit: latestSession.circuit_short_name,
          date: latestSession.date_start.split('T')[0]
        },
        historicalContext: {
          pastWinners: [],
          averagePitStops: this.calculateAveragePitStops(lapData),
          safetyCarProbability: this.calculateSafetyCarProbability(weatherData),
          weatherPatterns: this.getWeatherPatterns(weatherData)
        },
        liveData: {
          currentStatus: 'completed',
          weather: this.getLatestWeather(weatherData),
          trackTemperature: weatherData[0]?.track_temperature || 35
        },
        analysis: {
          keyFactors: ['Real telemetry data', 'Weather conditions', 'Driver performance'],
          driverRecommendations: [],
          difficulty: this.calculateRaceDifficulty(lapData),
          overtakingOpportunities: this.calculateOvertakingOpportunities(lapData)
        }
      }

      console.log('✅ OpenF1 data loaded successfully')
      return { driverData, raceData }

    } catch (error) {
      console.error('❌ OpenF1 fallback failed:', error)
      return {}
    }
  }

  // Helper methods for OpenF1 data analysis
  private calculateAveragePosition(lapData: any[], type: string): number {
    if (!lapData.length) return 5
    return Math.round(lapData.reduce((sum, lap) => sum + (lap.lap_number || 1), 0) / lapData.length)
  }

  private calculateConsistency(lapData: any[]): number {
    if (!lapData.length) return 0.8
    const lapTimes = lapData.map(lap => lap.lap_duration || 90).filter(time => time > 0)
    if (lapTimes.length < 2) return 0.8
    
    const variance = lapTimes.reduce((sum, time) => {
      const mean = lapTimes.reduce((s, t) => s + t, 0) / lapTimes.length
      return sum + Math.pow(time - mean, 2)
    }, 0) / lapTimes.length
    
    return Math.max(0.1, 1 - (Math.sqrt(variance) / 10)) // Normalize to 0-1
  }

  private getRecentForm(lapData: any[]): number[] {
    if (!lapData.length) return [5, 4, 6, 5, 4]
    return lapData.slice(-5).map(lap => Math.floor(Math.random() * 10) + 1) // Mock positions
  }

  private predictNextQualifying(lapData: any[]): number {
    if (!lapData.length) return 5
    const avgLapTime = lapData.reduce((sum, lap) => sum + (lap.lap_duration || 90), 0) / lapData.length
    return Math.max(1, Math.min(20, Math.round(15 - avgLapTime / 6))) // Faster lap = better position
  }

  private predictNextRace(lapData: any[]): number {
    return this.predictNextQualifying(lapData) + Math.floor(Math.random() * 3) - 1 // Race position varies
  }

  private calculateAveragePitStops(lapData: any[]): number {
    return 2.5 // Default, would need actual pit data
  }

  private calculateSafetyCarProbability(weatherData: any[]): number {
    if (!weatherData.length) return 0.2
    const hasRain = weatherData.some(w => w.rainfall > 0)
    return hasRain ? 0.4 : 0.2
  }

  private getWeatherPatterns(weatherData: any[]): Array<{ condition: string, frequency: number }> {
    if (!weatherData.length) return [{ condition: 'sunny', frequency: 70 }]
    
    const sunny = weatherData.filter(w => w.rainfall === 0).length
    const rainy = weatherData.filter(w => w.rainfall > 0).length
    const total = weatherData.length
    
    return [
      { condition: 'sunny', frequency: Math.round((sunny / total) * 100) },
      { condition: 'rainy', frequency: Math.round((rainy / total) * 100) }
    ]
  }

  private getLatestWeather(weatherData: any[]): any {
    if (!weatherData.length) return { temperature: 25, humidity: 50, windSpeed: 10 }
    const latest = weatherData[weatherData.length - 1]
    return {
      temperature: latest.air_temperature,
      humidity: latest.humidity,
      windSpeed: latest.wind_speed
    }
  }

  private calculateRaceDifficulty(lapData: any[]): string {
    if (!lapData.length) return 'medium'
    const avgLapTime = lapData.reduce((sum, lap) => sum + (lap.lap_duration || 90), 0) / lapData.length
    return avgLapTime < 85 ? 'hard' : avgLapTime > 95 ? 'easy' : 'medium'
  }

  private calculateOvertakingOpportunities(lapData: any[]): number {
    return Math.floor(Math.random() * 5) + 2 // Mock calculation
  }

  // Generate comprehensive race strategy and decisions
  async generateRaceDecision(context: DecisionContext): Promise<DecisionAnalysis> {
    try {
      // Load enhanced data
      const [driverData, raceData] = await Promise.all([
        dataFusionService.getEnhancedDriverData(context.driver).catch(() => null),
        dataFusionService.getEnhancedRaceData(context.race, context.year).catch(() => null)
      ])

      // Get real OpenF1 data for fallback
      const openF1Data = await this.getOpenF1FallbackData(context)

      // Use fallback data if real data is not available
      const fallbackDriverData: any = driverData || openF1Data.driverData || {
        driver: { 
          id: context.driver.toLowerCase().replace(/\s+/g, '_'),
          name: context.driver, 
          code: context.driver.substring(0, 3).toUpperCase(),
          nationality: 'International',
          team: 'Default Team'
        },
        historicalPerformance: {
          seasons: [],
          averageQualifyingPosition: 5,
          averageRacePosition: 5,
          totalPoints: 100,
          consistency: 0.8
        },
        liveData: {
          currentPosition: 5,
          currentPoints: 25,
          status: 'active',
          recentForm: [5, 4, 6, 5, 4]
        },
        predictions: {
          nextRaceQualifying: 5,
          nextRaceRace: 5,
          championshipFinish: 5,
          confidence: 0.7
        }
      }

      const fallbackRaceData: any = raceData || openF1Data.raceData || {
        race: { 
          name: context.race, 
          year: context.year, 
          round: 1,
          circuit: context.race,
          date: new Date().toISOString().split('T')[0]
        },
        historicalContext: {
          pastWinners: [],
          averagePitStops: 2.5,
          safetyCarProbability: 0.2,
          weatherPatterns: [{ condition: 'sunny', frequency: 70 }, { condition: 'cloudy', frequency: 30 }]
        },
        liveData: {
          currentStatus: 'scheduled',
          weather: { temperature: 25, humidity: 50, windSpeed: 10 },
          trackTemperature: 35
        },
        analysis: {
          keyFactors: ['Driver performance', 'Tire strategy', 'Weather conditions'],
          driverRecommendations: [],
          difficulty: 'medium',
          overtakingOpportunities: 3
        }
      }

      const finalDriverData = driverData || fallbackDriverData
      const finalRaceData = raceData || fallbackRaceData

      // Ensure we always have data
      if (!finalDriverData || !finalRaceData) {
        throw new Error('Unable to load required data for decision analysis')
      }

      // Memory retrieval
      const pastContext = getRecentContext(3);

      // Analyze historical patterns
      const historicalPatterns = await this.analyzeHistoricalPatterns(finalDriverData, finalRaceData)

      // Generate strategy recommendations
      const strategyRecommendations = await this.generateStrategyRecommendations(
        finalDriverData,
        finalRaceData,
        context,
        historicalPatterns
      )

      // Create overall race strategy
      const overallStrategy = await this.createRaceStrategy(
        finalDriverData,
        finalRaceData,
        context,
        historicalPatterns
      )

      // AI Reasoning Step
      const aiPrompt = `
Analyze the F1 Race Context.
Driver: ${context.driver}
Race: ${context.race} (${context.year})
Current Conditions: ${JSON.stringify(context.currentConditions)}
Strategy: ${JSON.stringify(overallStrategy)}

PAST PREDICTIONS:
${pastContext}

TASK: Provide a logical critique and refinement. Respond in one paragraph.
`;

      let aiInsights = "";
      try {
        const response = await getAICompletion(aiPrompt, "You are a senior F1 Race Strategist.");
        aiInsights = response.content;
      } catch (e) {
        console.error("AI reasoning step failed", e);
      }

      if (aiInsights) {
        strategyRecommendations.unshift({
          type: 'strategy',
          priority: 'critical',
          confidence: 0.9,
          recommendation: 'AI LOGICAL REFINEMENT',
          reasoning: aiInsights,
          dataPoints: ['Memory Analysis'],
          expectedOutcome: 'Refined strategy based on historical outcomes',
          riskLevel: 'low'
        });
      }

      // Assess risks
      const riskAssessment = await this.assessRisks(finalDriverData, finalRaceData, context)

      // Predict performance
      const performancePrediction = await this.predictPerformance(
        finalDriverData,
        finalRaceData,
        context,
        overallStrategy
      )

      const finalAnalysis = {
        context,
        recommendations: strategyRecommendations,
        overallStrategy,
        riskAssessment,
        performancePrediction
      }

      // Save to memory
      addMemoryEntry({
        context,
        analysis: aiInsights || "Analysis generated."
      });

      return finalAnalysis;

    } catch (error) {
      console.error('Error generating race decision:', error)
      throw error
    }
  }

  // Generate real-time in-race decisions
  async generateInRaceDecision(
    context: DecisionContext,
    liveRaceData: any
  ): Promise<DecisionRecommendation[]> {
    const recommendations: DecisionRecommendation[] = []

    try {
      const driverData = await dataFusionService.getEnhancedDriverData(context.driver)
      if (!driverData) return recommendations

      // Analyze current race situation
      const currentPosition = liveRaceData.position || driverData.liveData.currentPosition
      const tireCondition = liveRaceData.tireCondition || 'medium'
      const lapsRemaining = liveRaceData.lapsRemaining || 20
      const gapToAhead = liveRaceData.gapToAhead || 0
      const gapBehind = liveRaceData.gapBehind || 0

      // Pit stop decision
      if (await this.shouldPit(context, tireCondition, lapsRemaining, gapToAhead, gapBehind)) {
        recommendations.push({
          type: 'in_race',
          priority: 'critical',
          confidence: 0.85,
          recommendation: 'PIT IMMEDIATELY',
          reasoning: `Tire condition critical (${tireCondition}) with optimal window available. Gap management favorable.`,
          dataPoints: [
            `Tire wear: ${tireCondition}`,
            `Laps remaining: ${lapsRemaining}`,
            `Gap ahead: ${gapToAhead}s`,
            `Historical pit performance: ${this.extractHistoricalPitPerformance(driverData)}`
          ],
          expectedOutcome: 'Gain 2-3 positions through fresh tires and optimal strategy',
          riskLevel: 'medium'
        })
      }

      // Overtaking opportunity
      if (await this.shouldAttemptOvertake(context, liveRaceData)) {
        recommendations.push({
          type: 'in_race',
          priority: 'high',
          confidence: 0.75,
          recommendation: 'ATTACK OVERTAKE IN SECTOR 2',
          reasoning: 'Driver ahead appears to have tire degradation and sector 2 suits our car\'s strengths',
          dataPoints: [
            `Target driver tire age: ${liveRaceData.targetTireAge} laps`,
            `Our sector 2 performance: +0.2s vs average`,
            `DRS available: ${liveRaceData.drsAvailable ? 'Yes' : 'No'}`
          ],
          expectedOutcome: 'Successful overtake with minimal risk',
          riskLevel: 'medium'
        })
      }

      // Tire management
      if (await this.shouldManageTires(context, liveRaceData)) {
        recommendations.push({
          type: 'in_race',
          priority: 'medium',
          confidence: 0.90,
          recommendation: 'FOCUS ON TIRE MANAGEMENT',
          reasoning: 'Current pace sufficient, tire preservation critical for final stint',
          dataPoints: [
            `Current pace vs target: ${liveRaceData.paceDelta}s`,
            `Tire degradation rate: ${liveRaceData.tireDegRate}/lap`,
            `Stint length remaining: ${liveRaceData.stintRemaining} laps`
          ],
          expectedOutcome: 'Maintain position while preserving tires for final push',
          riskLevel: 'low'
        })
      }

      return recommendations

    } catch (error) {
      console.error('Error generating in-race decision:', error)
      return recommendations
    }
  }

  // Private helper methods
  private async analyzeHistoricalPatterns(driverData: EnhancedDriverData, raceData: EnhancedRaceData) {
    const patterns = {
      qualifyingPerformance: {
        averagePosition: driverData.historicalPerformance.averageQualifyingPosition,
        consistency: driverData.historicalPerformance.consistency,
        improvementTrend: this.calculateImprovementTrend(driverData.historicalPerformance.seasons)
      },
      racePerformance: {
        averagePosition: driverData.historicalPerformance.averageRacePosition,
        pointsScoringRate: this.calculatePointsScoringRate(driverData.historicalPerformance.seasons),
        tireManagement: this.assessTireManagement(driverData.historicalPerformance.seasons)
      },
      circuitSpecific: {
        previousResults: await this.getCircuitSpecificResults(driverData.driver.name, raceData.race.circuit),
        adaptability: this.assessCircuitAdaptability(driverData.historicalPerformance.seasons)
      }
    }

    return patterns
  }

  private async generateStrategyRecommendations(
    driverData: EnhancedDriverData,
    raceData: EnhancedRaceData,
    context: DecisionContext,
    patterns: any
  ): Promise<DecisionRecommendation[]> {
    const recommendations: DecisionRecommendation[] = []

    // Tire compound recommendation
    const tireRec = await this.recommendTireCompound(driverData, raceData, context, patterns)
    recommendations.push(tireRec)

    // Setup recommendation
    const setupRec = await this.recommendCarSetup(driverData, raceData, context, patterns)
    recommendations.push(setupRec)

    // Qualifying strategy
    const qualRec = await this.recommendQualifyingStrategy(driverData, raceData, context, patterns)
    recommendations.push(qualRec)

    // Race start strategy
    const startRec = await this.recommendStartStrategy(driverData, raceData, context, patterns)
    recommendations.push(startRec)

    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
  }

  private async recommendTireCompound(
    driverData: EnhancedDriverData,
    raceData: EnhancedRaceData,
    context: DecisionContext,
    patterns: any
  ): Promise<DecisionRecommendation> {
    const driverStyle = this.extractDriverStyle(driverData.historicalPerformance)
    const circuitCharacteristics = this.assessCircuitCharacteristics(raceData.race.circuit)
    const weather = context.currentConditions?.weather || 'dry'

    let recommendation = 'MEDIUM'
    let reasoning = ''
    let confidence = 0.7

    if (weather === 'wet') {
      recommendation = 'WET'
      reasoning = 'Full wet conditions require wet tires'
      confidence = 0.95
    } else if (circuitCharacteristics.highDegradation && driverStyle.aggressive) {
      recommendation = 'HARD'
      reasoning = 'High degradation circuit + aggressive driving style favors harder compound'
      confidence = 0.8
    } else if (circuitCharacteristics.lowGrip && driverStyle.smooth) {
      recommendation = 'SOFT'
      reasoning = 'Low grip circuit + smooth driving style can maximize soft tire potential'
      confidence = 0.75
    }

    return {
      type: 'strategy',
      priority: 'high',
      confidence,
      recommendation: `Start on ${recommendation} compound`,
      reasoning,
      dataPoints: [
        `Driver style: ${driverStyle.category}`,
        `Circuit degradation: ${circuitCharacteristics.degradationLevel}`,
        `Weather: ${weather}`,
        `Historical tire performance: ${patterns.racePerformance.tireManagement}`
      ],
      expectedOutcome: `Optimal balance between pace and tire life for ${raceData.race.circuit}`,
      riskLevel: 'medium'
    }
  }

  private async recommendCarSetup(
    driverData: EnhancedDriverData,
    raceData: EnhancedRaceData,
    context: DecisionContext,
    patterns: any
  ): Promise<DecisionRecommendation> {
    const driverPreference = this.extractDriverPreference(driverData.historicalPerformance)
    const circuitNeeds = this.assessCircuitSetupNeeds(raceData.race.circuit)

    const setup = this.optimizeSetup(driverPreference, circuitNeeds)

    return {
      type: 'setup',
      priority: 'medium',
      confidence: 0.75,
      recommendation: `${setup.aero} downforce, ${setup.suspension} suspension`,
      reasoning: `Balance driver preference (${driverPreference}) with circuit requirements (${circuitNeeds.primary})`,
      dataPoints: [
        `Driver comfort zone: ${driverPreference.strength}`,
        `Circuit priority: ${circuitNeeds.primary}`,
        `Historical setup success: ${patterns.circuitSpecific.adaptability}%`
      ],
      expectedOutcome: 'Driver confidence and optimal lap time potential',
      riskLevel: 'low'
    }
  }

  private async recommendQualifyingStrategy(
    driverData: EnhancedDriverData,
    raceData: EnhancedRaceData,
    context: DecisionContext,
    patterns: any
  ): Promise<DecisionRecommendation> {
    const predictedPosition = driverData.predictions.nextRaceQualifying
    const historicalQualifying = patterns.qualifyingPerformance

    let strategy = 'Standard Q1-Q2-Q3 progression'
    let priority: 'critical' | 'high' | 'medium' | 'low' = 'medium'
    let confidence = 0.7

    if (predictedPosition <= 5) {
      strategy = 'Single Q2 run, focus on Q3'
      priority = 'high'
      confidence = 0.8
    } else if (predictedPosition >= 15) {
      strategy = 'Aggressive Q1, minimize Q2 focus'
      priority = 'high'
      confidence = 0.75
    }

    return {
      type: 'qualifying',
      priority,
      confidence,
      recommendation: strategy,
      reasoning: `Based on predicted Q${predictedPosition} position and historical consistency`,
      dataPoints: [
        `Predicted position: P${predictedPosition}`,
        `Historical average: P${historicalQualifying.averagePosition.toFixed(1)}`,
        `Consistency rating: ${(historicalQualifying.consistency * 100).toFixed(0)}%`
      ],
      expectedOutcome: 'Optimal tire usage and mental energy for key sessions',
      riskLevel: 'low'
    }
  }

  private async recommendStartStrategy(
    driverData: EnhancedDriverData,
    raceData: EnhancedRaceData,
    context: DecisionContext,
    patterns: any
  ): Promise<DecisionRecommendation> {
    const startPosition = driverData.predictions.nextRaceRace
    const startAbility = this.assessStartAbility(driverData.historicalPerformance)

    let strategy = 'Conservative start, position defense'
    if (startPosition <= 10 && startAbility >= 0.7) {
      strategy = 'Aggressive start, target multiple positions'
    }

    return {
      type: 'strategy',
      priority: 'high',
      confidence: 0.8,
      recommendation: strategy,
      reasoning: `Start from P${startPosition} with ${startAbility >= 0.7 ? 'strong' : 'conservative'} start capability`,
      dataPoints: [
        `Starting position: P${startPosition}`,
        `Start ability rating: ${(startAbility * 100).toFixed(0)}%`,
        `Historical first lap performance: +${this.calculateFirstLapGain(driverData.historicalPerformance)} positions`
      ],
      expectedOutcome: 'Maximize first lap opportunities while avoiding risks',
      riskLevel: startPosition <= 5 ? 'medium' : 'low'
    }
  }

  private async createRaceStrategy(
    driverData: EnhancedDriverData,
    raceData: EnhancedRaceData,
    context: DecisionContext,
    patterns: any
  ): Promise<RaceStrategy> {
    const raceLength = this.getRaceLength(raceData.race.circuit)
    const tireStrategy = await this.optimizeTireStrategy(driverData, raceData, raceLength)
    const pitStrategy = await this.optimizePitStrategy(tireStrategy, raceLength)
    const racePace = await this.calculateTargetRacePace(driverData, raceData, tireStrategy)

    return {
      tireStrategy,
      pitStrategy,
      racePace
    }
  }

  private async assessRisks(
    driverData: EnhancedDriverData,
    raceData: EnhancedRaceData,
    context: DecisionContext
  ) {
    const factors = []
    const mitigation = []

    // Assess driver consistency risk
    if (driverData.historicalPerformance.consistency > 0.5) {
      factors.push('Driver inconsistency in race conditions')
      mitigation.push('Focus on smooth driving, avoid unnecessary risks')
    }

    // Assess tire wear risk
    const tireRisk = await this.assessTireWearRisk(driverData, raceData)
    if (tireRisk > 0.7) {
      factors.push('High tire degradation risk')
      mitigation.push('Conservative tire management, early pit window')
    }

    // Assess weather risk
    if (context.currentConditions?.weather === 'changeable') {
      factors.push('Unpredictable weather conditions')
      mitigation.push('Flexible strategy, ready to adapt compound choice')
    }

    const overallRisk = factors.length >= 2 ? 'high' : factors.length === 1 ? 'medium' : 'low'

    return {
      factors,
      overallRisk: overallRisk as 'low' | 'medium' | 'high',
      mitigation
    }
  }

  private async predictPerformance(
    driverData: EnhancedDriverData,
    raceData: EnhancedRaceData,
    context: DecisionContext,
    strategy: RaceStrategy
  ) {
    const baseQualifying = driverData.predictions.nextRaceQualifying
    const baseRace = driverData.predictions.nextRaceRace
    const basePoints = this.estimatePointsFromPosition(baseRace)

    // Adjust based on strategy quality
    const strategyBonus = await this.calculateStrategyBonus(strategy, driverData, raceData)
    const adjustedRacePosition = Math.max(1, baseRace - Math.floor(strategyBonus))
    const adjustedPoints = this.estimatePointsFromPosition(adjustedRacePosition)

    return {
      qualifyingPosition: baseQualifying,
      racePosition: adjustedRacePosition,
      pointsScored: adjustedPoints,
      probabilityOfPodium: adjustedRacePosition <= 3 ? 0.8 - (adjustedRacePosition - 1) * 0.2 : 0.1,
      probabilityOfWin: adjustedRacePosition === 1 ? 0.6 : adjustedRacePosition <= 3 ? 0.1 : 0.05
    }
  }

  // Additional helper methods would be implemented here
  private extractDriverStyle(performance: any) {
    const avgQualifying = performance.averageQualifyingPosition
    return {
      aggressive: avgQualifying <= 5,
      smooth: performance.consistency < 0.3,
      category: avgQualifying <= 5 ? 'aggressive' : performance.consistency < 0.3 ? 'smooth' : 'balanced'
    }
  }

  private assessCircuitCharacteristics(circuit: string) {
    // Simplified circuit assessment - would be enhanced with real circuit data
    const characteristics = {
      monaco: { highDegradation: true, lowGrip: true, degradationLevel: 'high' },
      monza: { highDegradation: false, lowGrip: false, degradationLevel: 'low' },
      silverstone: { highDegradation: true, lowGrip: false, degradationLevel: 'medium' }
    }

    return characteristics[circuit.toLowerCase() as keyof typeof characteristics] || {
      highDegradation: false,
      lowGrip: false,
      degradationLevel: 'medium'
    }
  }

  private calculateImprovementTrend(seasons: any[]): number {
    // Simple trend calculation - would be more sophisticated
    return 0.1 // Positive trend
  }

  private calculatePointsScoringRate(seasons: any[]): number {
    return 0.85 // 85% points scoring rate
  }

  private assessTireManagement(seasons: any[]): string {
    return 'good' // Simplified assessment
  }

  private async getCircuitSpecificResults(driver: string, circuit: string): Promise<any[]> {
    return [] // Would load historical results at this circuit
  }

  private assessCircuitAdaptability(seasons: any[]): number {
    return 0.8 // 80% adaptability score
  }

  private extractDriverPreference(performance: any) {
    return {
      strength: 'balanced',
      comfort: 'medium'
    }
  }

  private assessCircuitSetupNeeds(circuit: string) {
    return {
      primary: 'balanced',
      characteristics: 'medium'
    }
  }

  private optimizeSetup(driverPreference: any, circuitNeeds: any) {
    return {
      aero: 'Medium',
      suspension: 'Medium'
    }
  }

  private assessStartAbility(performance: any): number {
    return 0.7 // 70% start ability
  }

  private calculateFirstLapGain(performance: any): number {
    return 0.5 // Average half position gain on first lap
  }

  private getRaceLength(circuit: string): number {
    return 70 // Default 70 laps
  }

  private async optimizeTireStrategy(driverData: any, raceData: any, raceLength: number) {
    return {
      startCompound: 'MEDIUM',
      stint1: { compound: 'MEDIUM', laps: 25 },
      stint2: { compound: 'HARD', laps: 30 },
      stint3: { compound: 'MEDIUM', laps: 15 }
    }
  }

  private async optimizePitStrategy(tireStrategy: any, raceLength: number) {
    return {
      lapNumbers: [25, 55],
      expectedPitTime: 2.5,
      safetyWindow: [20, 30, 50, 60]
    }
  }

  private async calculateTargetRacePace(driverData: any, raceData: any, tireStrategy: any) {
    return {
      targetLapTime: '1:30.000',
      fuelAdjustedPace: '1:30.500',
      tireDegradationFactor: 0.05
    }
  }

  private async shouldPit(context: DecisionContext, tireCondition: string, lapsRemaining: number, gapToAhead: number, gapBehind: number): Promise<boolean> {
    return tireCondition === 'critical' && lapsRemaining > 15 && gapBehind > 2
  }

  private async shouldAttemptOvertake(context: DecisionContext, liveRaceData: any): Promise<boolean> {
    return liveRaceData.drsAvailable && liveRaceData.targetTireAge > 20
  }

  private async shouldManageTires(context: DecisionContext, liveRaceData: any): Promise<boolean> {
    return liveRaceData.paceDelta < 0.5 && liveRaceData.stintRemaining > 10
  }

  private extractHistoricalPitPerformance(driverData: EnhancedDriverData): string {
    return '2.3s average'
  }

  private estimatePointsFromPosition(position: number): number {
    const pointsMap: { [key: number]: number } = {
      1: 25, 2: 18, 3: 15, 4: 12, 5: 10, 6: 8, 7: 6, 8: 4, 9: 2, 10: 1
    }
    return pointsMap[position] || 0
  }

  private async calculateStrategyBonus(strategy: RaceStrategy, driverData: EnhancedDriverData, raceData: EnhancedRaceData): Promise<number> {
    return 1.5 // Strategy provides 1.5 position improvement on average
  }

  private async assessTireWearRisk(driverData: EnhancedDriverData, raceData: EnhancedRaceData): Promise<number> {
    return 0.6 // 60% tire wear risk
  }
}

export const f1DecisionEngine = F1DecisionEngine.getInstance()
