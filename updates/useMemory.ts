import { useState, useEffect, useCallback } from 'react';
import { memoryService } from './memory-service';
import { PredictionMemory, MemoryStats, LearningWeights, PredictionOutcome } from './memory-types';

// React hook for memory integration in racing predictions
export function useMemory() {
  const [stats, setStats] = useState<MemoryStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load initial stats
  useEffect(() => {
    updateStats();
  }, []);

  const updateStats = useCallback(() => {
    setStats(memoryService.getStats());
  }, []);

  // Save a prediction outcome and learn from it
  const savePrediction = useCallback(async (
    predictionType: string,
    track: string,
    category: string,
    conditions: any,
    predicted: PredictionOutcome[],
    actual: PredictionOutcome[],
    mistakes: string[] = [],
    learningInsights: {
      overPredicted: string[];
      underPredicted: string[];
      trackFactors: string[];
      weatherImpact: boolean;
    }
  ) => {
    setIsLoading(true);
    try {
      // Calculate accuracy based on position matches
      const accuracy = calculateAccuracy(predicted, actual);

      const memory: PredictionMemory = {
        id: crypto?.randomUUID?.() ?? `pred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        predictionType: predictionType as any,
        track,
        category: category as any,
        conditions: {
          trackCondition: conditions.trackCondition || 'dry',
          weather: conditions.weather || 'clear',
          trackEvolution: conditions.trackEvolution
        },
        predicted,
        actual,
        accuracy,
        mistakes,
        learningInsights
      };

      memoryService.savePrediction(memory);
      updateStats(); // Refresh stats after saving
    } finally {
      setIsLoading(false);
    }
  }, [updateStats]);

  // Get adjusted prediction using learning weights
  const getAdjustedPrediction = useCallback((
    predicted: PredictionOutcome[],
    track: string,
    conditions: any
  ): PredictionOutcome[] => {
    return memoryService.adjustPrediction(predicted, track, conditions);
  }, []);

  // Get learning weights for analysis
  const getLearningWeights = useCallback((): LearningWeights => {
    return memoryService.getLearningWeights();
  }, []);

  // Get memories for a track
  const getTrackMemories = useCallback((track: string) => {
    return memoryService.getTrackMemories(track);
  }, []);

  // Get memories for a prediction type
  const getTypeMemories = useCallback((type: string) => {
    return memoryService.getTypeMemories(type);
  }, []);

  // Clear all memories (reset learning)
  const clearMemories = useCallback(() => {
    memoryService.clearMemories();
    updateStats();
  }, [updateStats]);

  return {
    stats,
    isLoading,
    savePrediction,
    getAdjustedPrediction,
    getLearningWeights,
    getTrackMemories,
    getTypeMemories,
    clearMemories,
    updateStats
  };
}

// Helper function to calculate prediction accuracy
function calculateAccuracy(predicted: PredictionOutcome[], actual: PredictionOutcome[]): number {
  if (predicted.length === 0 || actual.length === 0) return 0;

  const predictedMap = new Map(predicted.map(p => [p.driver, p.position]));
  const actualMap = new Map(actual.map(a => [a.driver, a.position]));

  let correctPositions = 0;
  let totalComparisons = 0;

  // Compare positions for drivers that appear in both predictions
  predicted.forEach(pred => {
    const actualPos = actualMap.get(pred.driver);
    if (actualPos !== undefined) {
      totalComparisons++;
      // Exact position match gets full points, close matches get partial
      const diff = Math.abs(pred.position - actualPos);
      if (diff === 0) correctPositions += 1;
      else if (diff === 1) correctPositions += 0.5;
      else if (diff === 2) correctPositions += 0.25;
    }
  });

  // Also check if pole prediction was correct
  const predPole = predicted.find(p => p.pole)?.driver;
  const actualPole = actual.find(a => a.pole)?.driver;
  if (predPole && actualPole && predPole === actualPole) {
    correctPositions += 0.5; // Bonus for correct pole
  }

  return totalComparisons > 0 ? (correctPositions / totalComparisons) * 100 : 0;
}

// Utility function to identify common mistakes in predictions
export function identifyMistakes(
  predicted: PredictionOutcome[],
  actual: PredictionOutcome[],
  track: string,
  conditions: any
): {
  mistakes: string[];
  overPredicted: string[];
  underPredicted: string[];
  trackFactors: string[];
  weatherImpact: boolean;
} {
  const mistakes: string[] = [];
  const overPredicted: string[] = [];
  const underPredicted: string[] = [];
  const trackFactors: string[] = [];
  let weatherImpact = false;

  const predictedMap = new Map(predicted.map(p => [p.driver, p.position]));
  const actualMap = new Map(actual.map(a => [a.driver, a.position]));

  predicted.forEach(pred => {
    const actualPos = actualMap.get(pred.driver);
    if (actualPos !== undefined) {
      const diff = actualPos - pred.position;
      if (diff > 2) {
        overPredicted.push(pred.driver);
        mistakes.push(`${pred.driver} overpredicted by ${diff} positions`);
      } else if (diff < -2) {
        underPredicted.push(pred.driver);
        mistakes.push(`${pred.driver} underpredicted by ${Math.abs(diff)} positions`);
      }
    }
  });

  // Track-specific factors (simplified)
  if (track.toLowerCase().includes('monaco') && mistakes.length > 0) {
    trackFactors.push('street_circuit_difficulty');
  }
  if (track.toLowerCase().includes('spa') && conditions.weather === 'rain') {
    weatherImpact = true;
    trackFactors.push('wet_weather_performance');
  }

  // Weather impact detection
  if (['rain', 'wet', 'storm'].includes(conditions.weather?.toLowerCase())) {
    const weatherMistakes = mistakes.filter(m => m.includes('overpredicted') || m.includes('underpredicted'));
    if (weatherMistakes.length > mistakes.length * 0.5) {
      weatherImpact = true;
    }
  }

  return {
    mistakes,
    overPredicted,
    underPredicted,
    trackFactors,
    weatherImpact
  };
}
