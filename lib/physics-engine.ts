// F1 Physics-Based Simulation Engine
// Deterministic mathematical models for race strategy validation

export interface SimulationParams {
  laps: number;
  initialFuelKg: number;
  fuelBurnPerLap: number; // kg
  fuelPenaltyPerKg: number; // s/kg
  trackLengthKm: number;
  baseLapTime: number; // seconds (empty car, new tires)
}

export interface StintParams {
  compound: 'soft' | 'medium' | 'hard';
  laps: number;
  degradationRate: number; // s/lap
  degradationExponent: number; // for non-linear wear
}

export interface SimulationResult {
  totalTime: number;
  laps: Array<{
    lapNumber: number;
    lapTime: number;
    fuelWeight: number;
    tireWear: number;
    compound: string;
  }>;
  averageLapTime: number;
  pitStops: number;
}

export class F1PhysicsEngine {
  
  // Calculate lap time based on physics parameters
  calculateLapTime(params: SimulationParams, stint: StintParams, lapInStint: number, currentFuelKg: number): number {
    // 1. Base time
    let lapTime = params.baseLapTime;
    
    // 2. Fuel Weight Penalty
    // Typical F1: 0.3s-0.4s per 10kg
    const fuelPenalty = currentFuelKg * params.fuelPenaltyPerKg;
    lapTime += fuelPenalty;
    
    // 3. Tire Degradation
    // Formula: wear = rate * (lap^exponent)
    const tireDegradation = stint.degradationRate * Math.pow(lapInStint, stint.degradationExponent);
    lapTime += tireDegradation;
    
    return lapTime;
  }

  // Run a full race simulation for a given strategy
  simulateRace(params: SimulationParams, stints: StintParams[], pitStopLoss: number = 20): SimulationResult {
    let totalTime = 0;
    let currentFuel = params.initialFuelKg;
    const lapData = [];
    let currentLap = 1;

    for (const stint of stints) {
      // Add pit stop time (except for the first stint start)
      if (currentLap > 1) {
        totalTime += pitStopLoss;
      }

      for (let i = 1; i <= stint.laps; i++) {
        if (currentLap > params.laps) break;

        const lapTime = this.calculateLapTime(params, stint, i, currentFuel);
        
        lapData.push({
          lapNumber: currentLap,
          lapTime,
          fuelWeight: currentFuel,
          tireWear: stint.degradationRate * Math.pow(i, stint.degradationExponent),
          compound: stint.compound
        });

        totalTime += lapTime;
        currentFuel -= params.fuelBurnPerLap;
        currentLap++;
      }
    }

    return {
      totalTime,
      laps: lapData,
      averageLapTime: totalTime / Math.min(params.laps, lapData.length),
      pitStops: stints.length - 1
    };
  }

  // Get degradation profile for compounds
  getDegradationProfile(compound: 'soft' | 'medium' | 'hard', isHotTrack: boolean = false): { rate: number, exponent: number } {
    const profiles = {
      soft: { rate: 0.15, exponent: 1.2 },
      medium: { rate: 0.08, exponent: 1.1 },
      hard: { rate: 0.04, exponent: 1.05 }
    };

    const profile = profiles[compound];
    
    // Increase degradation if track is hot
    if (isHotTrack) {
      return {
        rate: profile.rate * 1.4,
        exponent: profile.exponent * 1.1
      };
    }

    return profile;
  }
}

export const physicsEngine = new F1PhysicsEngine();
