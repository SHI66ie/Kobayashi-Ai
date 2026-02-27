// Racing Prediction Memory System
// Allows the app to remember outcomes and learn from prediction mistakes

export interface PredictionOutcome {
  position: number;
  driver: string;
  team: string;
  points?: number;
  pole?: boolean;
}

export interface PredictionMemory {
  id: string;
  timestamp: Date;
  predictionType: 'Qualifying' | 'Race' | 'Sprint Race';
  track: string;
  category: 'f1' | 'gr-cup' | 'other';
  conditions: {
    trackCondition: string;
    weather: string;
    trackEvolution?: string;
  };
  predicted: PredictionOutcome[];
  actual: PredictionOutcome[];
  accuracy: number; // 0-100
  mistakes: string[]; // Identified errors
  learningInsights: {
    overPredicted: string[]; // Drivers whose performance was overestimated
    underPredicted: string[]; // Drivers whose performance was underestimated
    trackFactors: string[]; // Track-specific learnings
    weatherImpact: boolean; // Whether weather was misjudged
  };
  adjustedFactors?: {
    driverForm: Record<string, number>; // +1 or -1 adjustments
    teamPerformance: Record<string, number>;
    trackDifficulty: number;
  };
}

export interface MemoryStats {
  totalPredictions: number;
  averageAccuracy: number;
  commonMistakes: string[];
  trackPerformance: Record<string, number>;
  learningProgress: number; // How much the system has improved
}

// Learning weights for future predictions
export interface LearningWeights {
  driverForm: Record<string, number>;
  teamReliability: Record<string, number>;
  trackFactors: Record<string, number>;
  weatherSensitivity: number;
  recentPerformance: Record<string, number>;
}
