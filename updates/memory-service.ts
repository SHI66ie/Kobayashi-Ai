import { PredictionMemory, MemoryStats, LearningWeights } from './memory-types';

// Memory Service for Racing Predictions
// Handles storage, retrieval, and learning from prediction outcomes

const STORAGE_KEY = 'racing_prediction_memories';

class MemoryService {
  private memories: PredictionMemory[] = [];
  private learningWeights: LearningWeights = {
    driverForm: {},
    teamReliability: {},
    trackFactors: {},
    weatherSensitivity: 1.0,
    recentPerformance: {}
  };

  constructor() {
    this.loadFromStorage();
    this.loadWeightsFromStorage();
  }

  // Save a prediction memory
  savePrediction(memory: PredictionMemory): void {
    this.memories.push({
      ...memory,
      id: memory.id || `pred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: memory.timestamp || new Date()
    });
    this.saveToStorage();
    this.updateLearningWeights(memory);
  }

  // Get all memories
  getMemories(): PredictionMemory[] {
    return [...this.memories];
  }

  // Get memories for a specific track
  getTrackMemories(track: string): PredictionMemory[] {
    return this.memories.filter(m => m.track.toLowerCase() === track.toLowerCase());
  }

  // Get memories for a prediction type
  getTypeMemories(type: string): PredictionMemory[] {
    return this.memories.filter(m => m.predictionType === type);
  }

  // Calculate overall memory statistics
  getStats(): MemoryStats {
    if (this.memories.length === 0) {
      return {
        totalPredictions: 0,
        averageAccuracy: 0,
        commonMistakes: [],
        trackPerformance: {},
        learningProgress: 0
      };
    }

    const accuracies = this.memories.map(m => m.accuracy);
    const avgAccuracy = accuracies.reduce((a, b) => a + b, 0) / accuracies.length;

    // Count common mistakes
    const mistakeCount: Record<string, number> = {};
    this.memories.forEach(m => {
      m.mistakes.forEach(mistake => {
        mistakeCount[mistake] = (mistakeCount[mistake] || 0) + 1;
      });
    });
    const commonMistakes = Object.entries(mistakeCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([mistake]) => mistake);

    // Track performance
    const trackAccuracy: Record<string, number[]> = {};
    this.memories.forEach(m => {
      if (!trackAccuracy[m.track]) trackAccuracy[m.track] = [];
      trackAccuracy[m.track].push(m.accuracy);
    });
    const trackPerformance: Record<string, number> = {};
    Object.entries(trackAccuracy).forEach(([track, accs]) => {
      trackPerformance[track] = accs.reduce((a, b) => a + b, 0) / accs.length;
    });

    // Learning progress (improvement over time)
    const recentMemories = this.memories.slice(-10); // Last 10 predictions
    const recentAvg = recentMemories.length > 0
      ? recentMemories.map(m => m.accuracy).reduce((a, b) => a + b, 0) / recentMemories.length
      : 0;
    const olderMemories = this.memories.slice(0, -10);
    const olderAvg = olderMemories.length > 0
      ? olderMemories.map(m => m.accuracy).reduce((a, b) => a + b, 0) / olderMemories.length
      : avgAccuracy;
    const learningProgress = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;

    return {
      totalPredictions: this.memories.length,
      averageAccuracy: Math.round(avgAccuracy * 100) / 100,
      commonMistakes,
      trackPerformance,
      learningProgress: Math.round(learningProgress * 100) / 100
    };
  }

  // Get current learning weights
  getLearningWeights(): LearningWeights {
    return { ...this.learningWeights };
  }

  // Apply learning weights to adjust a prediction
  adjustPrediction(predicted: PredictionOutcome[], track: string, conditions: any): PredictionOutcome[] {
    const adjusted = predicted.map(driver => {
      let adjustment = 0;

      // Driver form adjustment
      if (this.learningWeights.driverForm[driver.driver]) {
        adjustment += this.learningWeights.driverForm[driver.driver] * 0.1; // Small adjustments
      }

      // Team reliability
      if (this.learningWeights.teamReliability[driver.team]) {
        adjustment += this.learningWeights.teamReliability[driver.team] * 0.05;
      }

      // Track factors
      if (this.learningWeights.trackFactors[track]) {
        adjustment += this.learningWeights.trackFactors[track] * 0.05;
      }

      // Weather sensitivity
      if (conditions.weather && ['rain', 'wet', 'storm'].includes(conditions.weather.toLowerCase())) {
        adjustment *= this.learningWeights.weatherSensitivity;
      }

      // Recent performance
      if (this.learningWeights.recentPerformance[driver.driver]) {
        adjustment += this.learningWeights.recentPerformance[driver.driver] * 0.08;
      }

      return {
        ...driver,
        // Adjust position slightly (lower number is better)
        position: Math.max(1, Math.min(20, driver.position + Math.round(adjustment)))
      };
    });

    // Re-sort by adjusted position
    return adjusted.sort((a, b) => a.position - b.position);
  }

  // Clear all memories (for testing or reset)
  clearMemories(): void {
    this.memories = [];
    this.learningWeights = {
      driverForm: {},
      teamReliability: {},
      trackFactors: {},
      weatherSensitivity: 1.0,
      recentPerformance: {}
    };
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(`${STORAGE_KEY}_weights`);
  }

  private updateLearningWeights(memory: PredictionMemory): void {
    const { learningInsights, accuracy } = memory;

    // Update driver form based on over/under predictions
    learningInsights.overPredicted.forEach(driver => {
      this.learningWeights.driverForm[driver] = (this.learningWeights.driverForm[driver] || 0) - 0.1;
    });

    learningInsights.underPredicted.forEach(driver => {
      this.learningWeights.driverForm[driver] = (this.learningWeights.driverForm[driver] || 0) + 0.1;
    });

    // Update track factors
    learningInsights.trackFactors.forEach(factor => {
      const trackKey = `${memory.track}_${factor}`;
      this.learningWeights.trackFactors[trackKey] = (this.learningWeights.trackFactors[trackKey] || 0) + 0.05;
    });

    // Weather sensitivity
    if (learningInsights.weatherImpact) {
      this.learningWeights.weatherSensitivity *= accuracy < 70 ? 0.95 : 1.05; // Adjust sensitivity
    }

    // Recent performance (decay over time)
    memory.predicted.forEach(pred => {
      const accuracyFactor = accuracy / 100;
      this.learningWeights.recentPerformance[pred.driver] =
        (this.learningWeights.recentPerformance[pred.driver] || 0) * 0.9 + // Decay
        (accuracyFactor - 0.5) * 0.1; // New adjustment
    });

    this.saveWeightsToStorage();
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.memories));
    } catch (error) {
      console.warn('Failed to save memories to localStorage:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.memories = JSON.parse(stored).map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }));
      }
    } catch (error) {
      console.warn('Failed to load memories from localStorage:', error);
      this.memories = [];
    }
  }

  private saveWeightsToStorage(): void {
    try {
      localStorage.setItem(`${STORAGE_KEY}_weights`, JSON.stringify(this.learningWeights));
    } catch (error) {
      console.warn('Failed to save weights to localStorage:', error);
    }
  }

  private loadWeightsFromStorage(): void {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_weights`);
      if (stored) {
        this.learningWeights = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load weights from localStorage:', error);
      this.learningWeights = {
        driverForm: {},
        teamReliability: {},
        trackFactors: {},
        weatherSensitivity: 1.0,
        recentPerformance: {}
      };
    }
  }
}

// Export singleton instance
export const memoryService = new MemoryService();
