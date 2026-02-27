import React from 'react';
import { useMemory } from './useMemory';

// Memory Panel Component for viewing and managing prediction memories
export const MemoryPanel: React.FC = () => {
  const {
    stats,
    isLoading,
    clearMemories,
    getLearningWeights,
    getTrackMemories
  } = useMemory();

  const weights = getLearningWeights();

  if (!stats) {
    return (
      <div className="bg-gray-800/50 rounded-lg p-4">
        <p className="text-gray-400">Loading memory stats...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 rounded-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold flex items-center space-x-2">
          <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
          <span>Prediction Memory & Learning</span>
        </h3>
        <button
          onClick={clearMemories}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm transition-colors"
          disabled={isLoading}
        >
          Reset Learning
        </button>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-700/50 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-400">{stats.totalPredictions}</div>
          <div className="text-sm text-gray-300">Total Predictions</div>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-400">{stats.averageAccuracy}%</div>
          <div className="text-sm text-gray-300">Average Accuracy</div>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-4">
          <div className="text-2xl font-bold text-yellow-400">
            {stats.learningProgress > 0 ? '+' : ''}{stats.learningProgress}%
          </div>
          <div className="text-sm text-gray-300">Learning Progress</div>
        </div>
      </div>

      {/* Common Mistakes */}
      {stats.commonMistakes.length > 0 && (
        <div className="bg-gray-700/50 rounded-lg p-4">
          <h4 className="text-lg font-medium mb-3">Common Mistakes</h4>
          <div className="space-y-2">
            {stats.commonMistakes.map((mistake, index) => (
              <div key={index} className="flex items-center space-x-2 text-sm">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                <span>{mistake}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Track Performance */}
      {Object.keys(stats.trackPerformance).length > 0 && (
        <div className="bg-gray-700/50 rounded-lg p-4">
          <h4 className="text-lg font-medium mb-3">Track Performance</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(stats.trackPerformance).map(([track, accuracy]) => (
              <div key={track} className="flex justify-between items-center">
                <span className="text-sm">{track}</span>
                <span className="text-sm font-medium text-blue-400">{Math.round(accuracy)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Learning Weights Preview */}
      <div className="bg-gray-700/50 rounded-lg p-4">
        <h4 className="text-lg font-medium mb-3">Current Learning Adjustments</h4>
        <div className="space-y-4">
          {Object.keys(weights.driverForm).length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-gray-300 mb-2">Driver Form Adjustments</h5>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {Object.entries(weights.driverForm).slice(0, 6).map(([driver, adjustment]) => (
                  <div key={driver} className="text-xs bg-gray-600/50 rounded px-2 py-1">
                    <span className={adjustment > 0 ? 'text-green-400' : 'text-red-400'}>
                      {driver}: {adjustment > 0 ? '+' : ''}{adjustment.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-gray-300">Weather Sensitivity: </span>
              <span className="text-sm font-medium">{weights.weatherSensitivity.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-sm text-gray-300">Active Adjustments: </span>
              <span className="text-sm font-medium">
                {Object.keys(weights.driverForm).length +
                 Object.keys(weights.teamReliability).length +
                 Object.keys(weights.trackFactors).length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Usage Instructions */}
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
        <h4 className="text-lg font-medium mb-2 text-blue-400">How Learning Works</h4>
        <ul className="text-sm text-gray-300 space-y-1">
          <li>• Predictions are automatically saved after each race</li>
          <li>• The system analyzes mistakes and adjusts future predictions</li>
          <li>• Driver performance, track conditions, and weather are learned</li>
          <li>• Reset learning to start fresh or test different scenarios</li>
        </ul>
      </div>
    </div>
  );
};

export default MemoryPanel;
