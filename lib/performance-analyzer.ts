import { OpenF1LapData, OpenF1CarData, OpenF1WeatherData } from './openf1-api'

export interface TireDegradationAnalysis {
  driverNumber: number
  currentCompound: 'soft' | 'medium' | 'hard' | 'wet' | 'unknown'
  wearRate: number // seconds lost per lap
  estimatedLapsRemaining: number
  degradationPattern: 'linear' | 'exponential' | 'variable'
  confidence: number
  recommendations: TireRecommendation[]
}

export interface TireRecommendation {
  type: 'pit_now' | 'extend_stint' | 'push_hard' | 'conserve'
  urgency: 'low' | 'medium' | 'high' | 'critical'
  reasoning: string
  expectedOutcome: string
  riskLevel: 'low' | 'medium' | 'high'
}

export interface TrackCharacteristics {
  circuitName: string
  highSpeedSections: number
  heavyBrakingZones: number
  technicalSectors: number
  overallDifficulty: 'low' | 'medium' | 'high'
  tireDemand: 'low' | 'medium' | 'high'
  fuelDemand: 'low' | 'medium' | 'high'
  keyMetrics: {
    averageSpeed: number
    maxSpeed: number
    averageGearChange: number
    throttleUsage: number
    brakeUsage: number
  }
}

export interface CarPerformanceProfile {
  driverNumber: number
  topSpeed: number
  averageSpeed: number
  throttleConsistency: number
  brakingAggression: number
  gearChangeEfficiency: number
  sectorStrengths: {
    sector1: number // 0-1 rating
    sector2: number
    sector3: number
  }
  drivingStyle: 'aggressive' | 'smooth' | 'balanced' | 'adaptive'
}

export class TirePerformanceAnalyzer {
  
  // Analyze tire degradation from lap data
  async analyzeTireDegradation(
    lapData: OpenF1LapData[],
    weatherData: OpenF1WeatherData[],
    sessionType: string = 'race'
  ): Promise<TireDegradationAnalysis[]> {
    const driverAnalyses: TireDegradationAnalysis[] = []
    
    // Group lap data by driver
    const driverLapData = this.groupLapDataByDriver(lapData)
    
    for (const [driverNumber, laps] of Array.from(driverLapData.entries())) {
      if (laps.length < 5) continue // Need minimum laps for analysis
      
      const analysis = await this.analyzeDriverTireDegradation(
        parseInt(driverNumber),
        laps,
        weatherData,
        sessionType
      )
      
      driverAnalyses.push(analysis)
    }
    
    return driverAnalyses
  }
  
  private async analyzeDriverTireDegradation(
    driverNumber: number,
    laps: OpenF1LapData[],
    weatherData: OpenF1WeatherData[],
    sessionType: string
  ): Promise<TireDegradationAnalysis> {
    
    // Sort laps by lap number
    const sortedLaps = laps.sort((a, b) => a.lap_number - b.lap_number)
    
    // Calculate lap time progression
    const lapTimeProgression = this.calculateLapTimeProgression(sortedLaps)
    
    // Infer tire compound from wear patterns
    const currentCompound = this.inferTireCompound(lapTimeProgression, weatherData, sessionType)
    
    // Calculate degradation rate
    const wearRate = this.calculateWearRate(lapTimeProgression, currentCompound)
    
    // Estimate remaining tire life
    const estimatedLapsRemaining = this.estimateTireLife(wearRate, currentCompound, sessionType)
    
    // Determine degradation pattern
    const degradationPattern = this.analyzeDegradationPattern(lapTimeProgression)
    
    // Generate recommendations
    const recommendations = this.generateTireRecommendations(
      wearRate,
      estimatedLapsRemaining,
      currentCompound,
      degradationPattern
    )
    
    return {
      driverNumber,
      currentCompound,
      wearRate,
      estimatedLapsRemaining,
      degradationPattern,
      confidence: this.calculateAnalysisConfidence(sortedLaps.length, lapTimeProgression),
      recommendations
    }
  }
  
  private groupLapDataByDriver(lapData: OpenF1LapData[]): Map<string, OpenF1LapData[]> {
    const grouped = new Map<string, OpenF1LapData[]>()
    
    lapData.forEach(lap => {
      const driverKey = lap.driver_number.toString()
      if (!grouped.has(driverKey)) {
        grouped.set(driverKey, [])
      }
      grouped.get(driverKey)!.push(lap)
    })
    
    return grouped
  }
  
  private calculateLapTimeProgression(laps: OpenF1LapData[]): number[] {
    return laps
      .filter(lap => lap.lap_duration && !lap.is_pit_out_lap)
      .map(lap => lap.lap_duration)
      .filter((time, index, array) => {
        // Remove outliers (more than 3 seconds from average)
        const avg = array.reduce((sum, t) => sum + t, 0) / array.length
        return Math.abs(time - avg) < 3.0
      })
  }
  
  private inferTireCompound(
    lapProgression: number[],
    weatherData: OpenF1WeatherData[],
    sessionType: string
  ): 'soft' | 'medium' | 'hard' | 'wet' | 'unknown' {
    if (!lapProgression.length) return 'unknown'
    
    // Check for wet conditions
    const latestWeather = weatherData[weatherData.length - 1]
    if (latestWeather && latestWeather.rainfall > 0) {
      return 'wet'
    }
    
    // Analyze degradation rate to infer compound
    const wearRate = this.calculateBasicWearRate(lapProgression)
    
    // Compound inference based on wear patterns
    if (wearRate < 0.05) return 'hard'
    if (wearRate < 0.15) return 'medium'
    if (wearRate < 0.3) return 'soft'
    
    return 'unknown'
  }
  
  private calculateBasicWearRate(lapProgression: number[]): number {
    if (lapProgression.length < 3) return 0
    
    // Calculate linear regression slope
    const n = lapProgression.length
    const xSum = lapProgression.length * (lapProgression.length - 1) / 2
    const ySum = lapProgression.reduce((sum, time) => sum + time, 0)
    const xySum = lapProgression.reduce((sum, time, index) => sum + (index * time), 0)
    const x2Sum = lapProgression.reduce((sum, _, index) => sum + (index * index), 0)
    
    const slope = (n * xySum - xSum * ySum) / (n * x2Sum - xSum * xSum)
    return Math.abs(slope)
  }
  
  private calculateWearRate(
    lapProgression: number[],
    compound: 'soft' | 'medium' | 'hard' | 'wet' | 'unknown'
  ): number {
    const basicRate = this.calculateBasicWearRate(lapProgression)
    
    // Adjust for compound characteristics
    const compoundModifiers = {
      soft: 1.5,
      medium: 1.0,
      hard: 0.7,
      wet: 0.8,
      unknown: 1.0
    }
    
    return basicRate * compoundModifiers[compound]
  }
  
  private estimateTireLife(
    wearRate: number,
    compound: 'soft' | 'medium' | 'hard' | 'wet' | 'unknown',
    sessionType: string
  ): number {
    const baseLife = {
      soft: 20,
      medium: 35,
      hard: 50,
      wet: 40,
      unknown: 30
    }
    
    const sessionModifiers = {
      race: 1.0,
      qualifying: 0.6,
      practice: 1.2
    }
    
    const estimatedLife = baseLife[compound] * sessionModifiers[sessionType as keyof typeof sessionModifiers]
    
    // Adjust based on observed wear rate
    const observedLife = Math.max(5, estimatedLife - (wearRate * 50))
    
    return Math.round(observedLife)
  }
  
  private analyzeDegradationPattern(lapProgression: number[]): 'linear' | 'exponential' | 'variable' {
    if (lapProgression.length < 5) return 'linear'
    
    // Calculate variance in degradation
    const degradationRates = []
    for (let i = 1; i < lapProgression.length; i++) {
      degradationRates.push(lapProgression[i] - lapProgression[i - 1])
    }
    
    const variance = this.calculateVariance(degradationRates)
    const avgRate = Math.abs(degradationRates.reduce((sum, rate) => sum + rate, 0) / degradationRates.length)
    
    if (variance < avgRate * 0.2) return 'linear'
    if (variance > avgRate * 0.8) return 'variable'
    return 'exponential'
  }
  
  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2))
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length
  }
  
  private generateTireRecommendations(
    wearRate: number,
    lapsRemaining: number,
    compound: 'soft' | 'medium' | 'hard' | 'wet' | 'unknown',
    pattern: 'linear' | 'exponential' | 'variable'
  ): TireRecommendation[] {
    const recommendations: TireRecommendation[] = []
    
    // Critical wear recommendation
    if (lapsRemaining < 5) {
      recommendations.push({
        type: 'pit_now',
        urgency: 'critical',
        reasoning: `Critical tire wear detected. Only ${lapsRemaining} laps remaining on current ${compound} compound.`,
        expectedOutcome: 'Avoid catastrophic tire failure and position loss',
        riskLevel: 'high'
      })
    }
    
    // High wear recommendation
    if (wearRate > 0.3 && lapsRemaining < 10) {
      recommendations.push({
        type: 'pit_now',
        urgency: 'high',
        reasoning: `High wear rate (${wearRate.toFixed(2)}s/lap) with limited tire life remaining.`,
        expectedOutcome: 'Maintain current position with fresh tires',
        riskLevel: 'medium'
      })
    }
    
    // Conservative recommendation
    if (wearRate < 0.1 && lapsRemaining > 20) {
      recommendations.push({
        type: 'extend_stint',
        urgency: 'low',
        reasoning: `Low wear rate allows for extended stint on current ${compound} tires.`,
        expectedOutcome: 'Gain positions through strategic undercut/overcut',
        riskLevel: 'low'
      })
    }
    
    // Variable pattern recommendation
    if (pattern === 'variable') {
      recommendations.push({
        type: 'conserve',
        urgency: 'medium',
        reasoning: 'Variable degradation pattern detected - conservative driving recommended.',
        expectedOutcome: 'Stabilize tire wear for predictable performance',
        riskLevel: 'medium'
      })
    }
    
    return recommendations
  }
  
  private calculateAnalysisConfidence(lapCount: number, lapProgression: number[]): number {
    let confidence = 0.5 // Base confidence
    
    // More laps = higher confidence
    confidence += Math.min(0.3, lapCount / 50)
    
    // Consistent data = higher confidence
    const variance = this.calculateVariance(lapProgression)
    if (variance < 1.0) confidence += 0.2
    
    return Math.min(0.95, confidence)
  }
}

export class TrackAnalyzer {
  
  // Analyze track characteristics from car data
  async analyzeTrack(
    carData: OpenF1CarData[],
    lapData: OpenF1LapData[],
    circuitName: string
  ): Promise<TrackCharacteristics> {
    
    // Process car telemetry data
    const telemetrySummary = this.processTelemetryData(carData)
    
    // Analyze sector characteristics
    const sectorAnalysis = this.analyzeSectors(lapData)
    
    // Calculate track demands
    const tireDemand = this.calculateTireDemand(telemetrySummary, sectorAnalysis)
    const fuelDemand = this.calculateFuelDemand(telemetrySummary)
    
    // Determine overall difficulty
    const difficulty = this.assessTrackDifficulty(telemetrySummary, sectorAnalysis)
    
    return {
      circuitName,
      highSpeedSections: sectorAnalysis.highSpeedSections,
      heavyBrakingZones: sectorAnalysis.heavyBrakingZones,
      technicalSectors: sectorAnalysis.technicalSectors,
      overallDifficulty: difficulty,
      tireDemand,
      fuelDemand,
      keyMetrics: telemetrySummary
    }
  }
  
  private processTelemetryData(carData: OpenF1CarData[]): TrackCharacteristics['keyMetrics'] {
    if (!carData.length) {
      return {
        averageSpeed: 0,
        maxSpeed: 0,
        averageGearChange: 0,
        throttleUsage: 0,
        brakeUsage: 0
      }
    }
    
    const speeds = carData.map(point => point.speed)
    const throttles = carData.map(point => point.throttle)
    const brakes = carData.map(point => point.brake)
    const gears = carData.map(point => point.n_gear)
    
    // Calculate gear changes
    let gearChanges = 0
    for (let i = 1; i < gears.length; i++) {
      if (gears[i] !== gears[i - 1]) gearChanges++
    }
    
    return {
      averageSpeed: speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length,
      maxSpeed: Math.max(...speeds),
      averageGearChange: gearChanges / carData.length,
      throttleUsage: throttles.reduce((sum, throttle) => sum + throttle, 0) / throttles.length,
      brakeUsage: brakes.reduce((sum, brake) => sum + brake, 0) / brakes.length
    }
  }
  
  private analyzeSectors(lapData: OpenF1LapData[]): {
    highSpeedSections: number
    heavyBrakingZones: number
    technicalSectors: number
  } {
    // Analyze speed traps and sector characteristics
    const speedTraps = lapData.flatMap(lap => [
      lap.i1_speed || 0,
      lap.i2_speed || 0,
      lap.st_speed || 0
    ]).filter(speed => speed > 0)
    
    const avgSpeedTrap = speedTraps.reduce((sum, speed) => sum + speed, 0) / speedTraps.length
    
    // Estimate track characteristics based on speed data
    const highSpeedSections = avgSpeedTrap > 280 ? 3 : avgSpeedTrap > 220 ? 2 : 1
    const heavyBrakingZones = avgSpeedTrap < 200 ? 3 : avgSpeedTrap < 250 ? 2 : 1
    const technicalSectors = 3 - (highSpeedSections + heavyBrakingZones)
    
    return {
      highSpeedSections,
      heavyBrakingZones,
      technicalSectors: Math.max(0, technicalSectors)
    }
  }
  
  private calculateTireDemand(
    telemetry: TrackCharacteristics['keyMetrics'],
    sectorAnalysis: ReturnType<typeof this.analyzeSectors>
  ): 'low' | 'medium' | 'high' {
    let demandScore = 0
    
    // High speed increases tire demand
    if (telemetry.maxSpeed > 320) demandScore += 2
    else if (telemetry.maxSpeed > 280) demandScore += 1
    
    // Heavy braking increases tire demand
    demandScore += sectorAnalysis.heavyBrakingZones
    
    // High throttle usage increases tire demand
    if (telemetry.throttleUsage > 80) demandScore += 2
    else if (telemetry.throttleUsage > 70) demandScore += 1
    
    if (demandScore >= 4) return 'high'
    if (demandScore >= 2) return 'medium'
    return 'low'
  }
  
  private calculateFuelDemand(
    telemetry: TrackCharacteristics['keyMetrics']
  ): 'low' | 'medium' | 'high' {
    let demandScore = 0
    
    // High speeds increase fuel demand
    if (telemetry.averageSpeed > 200) demandScore += 2
    else if (telemetry.averageSpeed > 160) demandScore += 1
    
    // High throttle usage increases fuel demand
    if (telemetry.throttleUsage > 75) demandScore += 2
    else if (telemetry.throttleUsage > 65) demandScore += 1
    
    // Frequent gear changes increase fuel demand
    if (telemetry.averageGearChange > 0.5) demandScore += 1
    
    if (demandScore >= 3) return 'high'
    if (demandScore >= 1) return 'medium'
    return 'low'
  }
  
  private assessTrackDifficulty(
    telemetry: TrackCharacteristics['keyMetrics'],
    sectorAnalysis: ReturnType<typeof this.analyzeSectors>
  ): 'low' | 'medium' | 'high' {
    let difficultyScore = 0
    
    // Technical sectors increase difficulty
    difficultyScore += sectorAnalysis.technicalSectors * 2
    
    // High speed combined with heavy braking increases difficulty
    if (telemetry.maxSpeed > 300 && sectorAnalysis.heavyBrakingZones >= 2) {
      difficultyScore += 2
    }
    
    // High brake usage indicates challenging track
    if (telemetry.brakeUsage > 30) difficultyScore += 1
    
    if (difficultyScore >= 5) return 'high'
    if (difficultyScore >= 2) return 'medium'
    return 'low'
  }
}

export class CarPerformanceAnalyzer {
  
  // Analyze individual driver performance
  async analyzeDriverPerformance(
    driverNumber: number,
    carData: OpenF1CarData[],
    lapData: OpenF1LapData[]
  ): Promise<CarPerformanceProfile> {
    
    // Filter data for specific driver
    const driverCarData = carData.filter(point => point.driver_number === driverNumber)
    const driverLapData = lapData.filter(lap => lap.driver_number === driverNumber)
    
    // Calculate performance metrics
    const topSpeed = Math.max(...driverCarData.map(point => point.speed), 0)
    const averageSpeed = driverCarData.reduce((sum, point) => sum + point.speed, 0) / driverCarData.length || 0
    
    // Analyze driving style
    const throttleConsistency = this.calculateThrottleConsistency(driverCarData)
    const brakingAggression = this.calculateBrakingAggression(driverCarData)
    const gearChangeEfficiency = this.calculateGearChangeEfficiency(driverCarData)
    
    // Analyze sector strengths
    const sectorStrengths = this.analyzeSectorStrengths(driverLapData)
    
    // Determine driving style
    const drivingStyle = this.determineDrivingStyle(
      throttleConsistency,
      brakingAggression,
      gearChangeEfficiency
    )
    
    return {
      driverNumber,
      topSpeed,
      averageSpeed,
      throttleConsistency,
      brakingAggression,
      gearChangeEfficiency,
      sectorStrengths,
      drivingStyle
    }
  }
  
  private calculateThrottleConsistency(carData: OpenF1CarData[]): number {
    if (carData.length < 2) return 0.5
    
    const throttleValues = carData.map(point => point.throttle)
    const variance = this.calculateVariance(throttleValues)
    const mean = throttleValues.reduce((sum, val) => sum + val, 0) / throttleValues.length
    
    // Lower variance = higher consistency
    return Math.max(0, 1 - (variance / (mean * mean)))
  }
  
  private calculateBrakingAggression(carData: OpenF1CarData[]): number {
    const brakePoints = carData.filter(point => point.brake > 50)
    if (!brakePoints.length) return 0.5
    
    const avgBrakePressure = brakePoints.reduce((sum, point) => sum + point.brake, 0) / brakePoints.length
    return avgBrakePressure / 100
  }
  
  private calculateGearChangeEfficiency(carData: OpenF1CarData[]): number {
    const gears = carData.map(point => point.n_gear)
    let gearChanges = 0
    
    for (let i = 1; i < gears.length; i++) {
      if (gears[i] !== gears[i - 1]) gearChanges++
    }
    
    // Optimal gear changes depend on track characteristics
    const optimalChanges = carData.length * 0.1 // Rough estimate
    return Math.max(0, 1 - Math.abs(gearChanges - optimalChanges) / optimalChanges)
  }
  
  private analyzeSectorStrengths(lapData: OpenF1LapData[]): CarPerformanceProfile['sectorStrengths'] {
    const sector1Times = lapData.map(lap => lap.duration_sector_1).filter(time => time && time > 0)
    const sector2Times = lapData.map(lap => lap.duration_sector_2).filter(time => time && time > 0)
    const sector3Times = lapData.map(lap => lap.duration_sector_3).filter(time => time && time > 0)
    
    // Calculate relative performance (lower time = higher strength)
    const avgS1 = sector1Times.reduce((sum, time) => sum + time, 0) / sector1Times.length || 1
    const avgS2 = sector2Times.reduce((sum, time) => sum + time, 0) / sector2Times.length || 1
    const avgS3 = sector3Times.reduce((sum, time) => sum + time, 0) / sector3Times.length || 1
    
    const totalTime = avgS1 + avgS2 + avgS3
    
    return {
      sector1: Math.max(0, 1 - (avgS1 / totalTime)),
      sector2: Math.max(0, 1 - (avgS2 / totalTime)),
      sector3: Math.max(0, 1 - (avgS3 / totalTime))
    }
  }
  
  private determineDrivingStyle(
    throttleConsistency: number,
    brakingAggression: number,
    gearChangeEfficiency: number
  ): 'aggressive' | 'smooth' | 'balanced' | 'adaptive' {
    
    if (brakingAggression > 0.8 && throttleConsistency < 0.5) return 'aggressive'
    if (brakingAggression < 0.4 && throttleConsistency > 0.8) return 'smooth'
    if (gearChangeEfficiency > 0.8) return 'adaptive'
    return 'balanced'
  }
  
  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2))
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length
  }
}

// Main analyzer class that combines all analyses
export class F1PerformanceAnalyzer {
  private tireAnalyzer = new TirePerformanceAnalyzer()
  private trackAnalyzer = new TrackAnalyzer()
  private carAnalyzer = new CarPerformanceAnalyzer()
  
  async analyzeSession(
    sessionKey: number,
    lapData: OpenF1LapData[],
    carData: OpenF1CarData[],
    weatherData: OpenF1WeatherData[],
    circuitName: string,
    sessionType: string = 'race'
  ) {
    // Analyze tire degradation for all drivers
    const tireAnalysis = await this.tireAnalyzer.analyzeTireDegradation(
      lapData,
      weatherData,
      sessionType
    )
    
    // Analyze track characteristics
    const trackAnalysis = await this.trackAnalyzer.analyzeTrack(
      carData,
      lapData,
      circuitName
    )
    
    // Analyze individual driver performance
    const driverNumbers = Array.from(new Set(lapData.map(lap => lap.driver_number)))
    const driverPerformance = await Promise.all(
      driverNumbers.map(async driverNumber => 
        this.carAnalyzer.analyzeDriverPerformance(driverNumber, carData, lapData)
      )
    )
    
    return {
      sessionKey,
      circuitName,
      sessionType,
      timestamp: new Date(),
      tireAnalysis,
      trackAnalysis,
      driverPerformance,
      weather: weatherData[weatherData.length - 1] || null
    }
  }
}
