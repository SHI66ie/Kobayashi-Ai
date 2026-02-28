// F1 Telemetry Data Schema and Examples
// This file documents the telemetry data structure for Formula 1 racing

export interface F1TelemetryData {
  // Session information
  sessionId: string
  track: string
  race: string
  driver: string
  car: string
  timestamp: string

  // Lap-by-lap data
  laps: F1LapData[]

  // Real-time telemetry (sampled at high frequency)
  telemetry: F1TelemetryPoint[]
}

export interface F1LapData {
  lapNumber: number
  lapTime: number // milliseconds
  sector1Time: number
  sector2Time: number
  sector3Time: number
  position: number
  gapToLeader: number // seconds
  gapToFront: number // seconds
  bestLap: boolean
  pitStop: boolean
  tireCompound: 'C1' | 'C2' | 'C3' | 'C4' | 'C5' | 'Intermediate' | 'Wet'
  fuelLevel: number // percentage
  engineTemp: number // celsius
  brakeTemp: number // celsius
  tirePressures: {
    frontLeft: number
    frontRight: number
    rearLeft: number
    rearRight: number
  }
  tireTemps: {
    frontLeft: number[]
    frontRight: number[]
    rearLeft: number[]
    rearRight: number[]
  }
}

export interface F1TelemetryPoint {
  timestamp: number // milliseconds since session start
  lapNumber: number
  lapDistance: number // meters along lap (0-1 normalized)

  // Car position and motion
  position: {
    x: number // world coordinates
    y: number
    z: number
  }
  velocity: {
    x: number // m/s
    y: number
    z: number
  }
  acceleration: {
    x: number // m/s²
    y: number
    z: number
  }

  // Car systems
  engine: {
    rpm: number
    throttle: number // 0-100%
    brake: number // 0-100%
    gear: number
    fuelFlow: number // kg/h
  }

  // Aerodynamics
  aero: {
    frontWing: number // angle in degrees
    rearWing: number
    drag: number // force in Newtons
    downforce: number
  }

  // Tires
  tires: {
    frontLeft: {
      pressure: number // PSI
      temperature: {
        inner: number
        middle: number
        outer: number
      }
      wear: number // 0-1 (0 = new, 1 = worn out)
    }
    frontRight: {
      pressure: number
      temperature: {
        inner: number
        middle: number
        outer: number
      }
      wear: number
    }
    rearLeft: {
      pressure: number
      temperature: {
        inner: number
        middle: number
        outer: number
      }
      wear: number
    }
    rearRight: {
      pressure: number
      temperature: {
        inner: number
        middle: number
        outer: number
      }
      wear: number
    }
  }

  // Temperatures
  temperatures: {
    engine: number // celsius
    brakes: {
      frontLeft: number
      frontRight: number
      rearLeft: number
      rearRight: number
    }
    gearbox: number
    battery: number // for hybrid systems
  }

  // Race data
  raceData: {
    position: number
    gapToLeader: number // seconds
    gapToFront: number // seconds
    bestLapTime: number // milliseconds
    lastLapTime: number
    sector1Time: number
    sector2Time: number
    sector3Time: number
  }

  // Weather (if available from car sensors)
  weather?: {
    airTemp: number
    trackTemp: number
    humidity: number
    windSpeed: number
    windDirection: number
    precipitation: number
  }
}

// Example of how to structure telemetry data files:
//
// 1. Single file telemetry: R1_monaco_telemetry_data.json
// 2. Chunked telemetry: R1_monaco_telemetry_data_index.json + chunk files
//
// Chunked format allows for large telemetry datasets to be split into manageable pieces

export const F1_TELEMETRY_SCHEMA_VERSION = '1.0.0'
