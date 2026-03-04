'use client'

import React, { useState, useEffect } from 'react'
import { Brain, Target, AlertTriangle, TrendingUp, Shield, Zap, Flag, Settings } from 'lucide-react'

// Interfaces matching the server-side DecisionAnalysis shape
interface TireStint {
  compound: string
  laps: number
}

interface RaceStrategy {
  tireStrategy: {
    startCompound: string
    stint1: TireStint
    stint2: TireStint
    stint3?: TireStint
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

interface DecisionRecommendation {
  type: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  confidence: number
  recommendation: string
  reasoning: string
  dataPoints: string[]
  expectedOutcome: string
  riskLevel: 'low' | 'medium' | 'high'
}

interface DecisionAnalysis {
  context: { driver: string; race: string; year: number }
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

interface DecisionPanelProps {
  driver: string
  race: string
  year?: number
  currentConditions?: any
}

export default function DecisionPanel({ driver, race, year = new Date().getFullYear(), currentConditions }: DecisionPanelProps) {
  const [analysis, setAnalysis] = useState<DecisionAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'strategy' | 'risks' | 'predictions'>('strategy')

  useEffect(() => {
    const generateAnalysis = async () => {
      if (!driver || !race) return

      setLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/f1/decision', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            driver,
            race,
            year,
            currentConditions
          })
        })

        const data = await response.json()

        if (data.success && data.analysis) {
          setAnalysis(data.analysis)
        } else {
          setError(data.message || 'Failed to generate decision analysis')
        }
      } catch (err) {
        console.error('Error generating decision analysis:', err)
        setError('Failed to connect to the decision engine')
      } finally {
        setLoading(false)
      }
    }

    generateAnalysis()
  }, [driver, race, year, currentConditions])

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-400 bg-red-900/20 border-red-700/30'
      case 'high': return 'text-orange-400 bg-orange-900/20 border-orange-700/30'
      case 'medium': return 'text-yellow-400 bg-yellow-900/20 border-yellow-700/30'
      case 'low': return 'text-green-400 bg-green-900/20 border-green-700/30'
      default: return 'text-gray-400 bg-gray-900/20 border-gray-700/30'
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-red-400'
      case 'medium': return 'text-yellow-400'
      case 'low': return 'text-green-400'
      default: return 'text-gray-400'
    }
  }

  if (loading) {
    return (
      <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-racing-blue mx-auto mb-4"></div>
            <p className="text-gray-400">Generating AI-powered decisions...</p>
            <p className="text-gray-500 text-sm mt-2">Analyzing historical data and live conditions</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
        <div className="text-center py-8">
          <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
          <h3 className="text-lg font-semibold mb-2">Decision Engine</h3>
          <p className="text-gray-400 text-sm">{error}</p>
          <p className="text-gray-500 text-xs mt-2">The decision engine requires telemetry data files to work. Results will improve as more data is available.</p>
        </div>
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
        <div className="text-center py-8">
          <Brain className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <h3 className="text-lg font-semibold mb-2">Decision Analysis Ready</h3>
          <p className="text-gray-400">Select driver and race to generate AI-powered decisions</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Brain className="w-6 h-6 text-racing-red" />
          <h2 className="text-xl font-bold">AI Decision Engine</h2>
        </div>
        <div className="flex items-center space-x-4 text-sm text-gray-400">
          <span>{analysis.context.driver}</span>
          <span>•</span>
          <span>{analysis.context.race}</span>
          <span>•</span>
          <span>{analysis.context.year}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-800 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('strategy')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'strategy'
              ? 'bg-racing-red text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
        >
          <Target className="w-4 h-4 inline mr-2" />
          Strategy
        </button>
        <button
          onClick={() => setActiveTab('risks')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'risks'
              ? 'bg-racing-red text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
        >
          <Shield className="w-4 h-4 inline mr-2" />
          Risks
        </button>
        <button
          onClick={() => setActiveTab('predictions')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'predictions'
              ? 'bg-racing-red text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
        >
          <TrendingUp className="w-4 h-4 inline mr-2" />
          Predictions
        </button>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {activeTab === 'strategy' && (
          <div className="space-y-4">
            {/* Overall Strategy */}
            <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4">
              <h3 className="font-semibold text-blue-400 mb-3 flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Race Strategy
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Tire Strategy</h4>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Start:</span>
                      <span className="font-mono">{analysis.overallStrategy.tireStrategy.startCompound}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Stint 1:</span>
                      <span className="font-mono">{analysis.overallStrategy.tireStrategy.stint1.compound} ({analysis.overallStrategy.tireStrategy.stint1.laps}L)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Stint 2:</span>
                      <span className="font-mono">{analysis.overallStrategy.tireStrategy.stint2.compound} ({analysis.overallStrategy.tireStrategy.stint2.laps}L)</span>
                    </div>
                    {analysis.overallStrategy.tireStrategy.stint3 && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Stint 3:</span>
                        <span className="font-mono">{analysis.overallStrategy.tireStrategy.stint3.compound} ({analysis.overallStrategy.tireStrategy.stint3.laps}L)</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Pit Strategy</h4>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Pit Laps:</span>
                      <span className="font-mono">{analysis.overallStrategy.pitStrategy.lapNumbers.join(', ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Pit Time:</span>
                      <span className="font-mono">{analysis.overallStrategy.pitStrategy.expectedPitTime}s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Safety Window:</span>
                      <span className="font-mono">{analysis.overallStrategy.pitStrategy.safetyWindow.join(', ')}L</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Target Pace</h4>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Target Lap:</span>
                      <span className="font-mono">{analysis.overallStrategy.racePace.targetLapTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Fuel Adj:</span>
                      <span className="font-mono">{analysis.overallStrategy.racePace.fuelAdjustedPace}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Tire Deg:</span>
                      <span className="font-mono">{(analysis.overallStrategy.racePace.tireDegradationFactor * 100).toFixed(1)}%/lap</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div>
              <h3 className="font-semibold text-gray-300 mb-3">Key Recommendations</h3>
              <div className="space-y-3">
                {analysis.recommendations.map((rec, idx) => (
                  <div key={idx} className={`border rounded-lg p-4 ${getPriorityColor(rec.priority)}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Flag className="w-4 h-4" />
                        <h4 className="font-medium">{rec.recommendation}</h4>
                      </div>
                      <div className="flex items-center space-x-2 text-xs">
                        <span className="capitalize">{rec.priority}</span>
                        <span>•</span>
                        <span>{(rec.confidence * 100).toFixed(0)}%</span>
                        <span>•</span>
                        <span className={getRiskColor(rec.riskLevel)}>{rec.riskLevel}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-300 mb-2">{rec.reasoning}</p>
                    <div className="text-xs text-gray-400">
                      <p className="mb-1"><strong>Data Points:</strong> {rec.dataPoints.join(', ')}</p>
                      <p><strong>Expected:</strong> {rec.expectedOutcome}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'risks' && (
          <div className="space-y-4">
            <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-4">
              <h3 className="font-semibold text-red-400 mb-3 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Risk Assessment
              </h3>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-300">Overall Risk Level:</span>
                <span className={`text-lg font-bold ${getRiskColor(analysis.riskAssessment.overallRisk)}`}>
                  {analysis.riskAssessment.overallRisk.toUpperCase()}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Risk Factors</h4>
                  <ul className="space-y-1">
                    {analysis.riskAssessment.factors.length > 0 ? analysis.riskAssessment.factors.map((factor, idx) => (
                      <li key={idx} className="text-sm text-gray-400 flex items-center space-x-2">
                        <span className="text-red-400">•</span>
                        <span>{factor}</span>
                      </li>
                    )) : (
                      <li className="text-sm text-gray-500">No significant risk factors identified</li>
                    )}
                  </ul>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Mitigation Strategies</h4>
                  <ul className="space-y-1">
                    {analysis.riskAssessment.mitigation.length > 0 ? analysis.riskAssessment.mitigation.map((strategy, idx) => (
                      <li key={idx} className="text-sm text-gray-400 flex items-center space-x-2">
                        <span className="text-green-400">✓</span>
                        <span>{strategy}</span>
                      </li>
                    )) : (
                      <li className="text-sm text-gray-500">Standard race procedures apply</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'predictions' && (
          <div className="space-y-4">
            <div className="bg-purple-900/20 border border-purple-700/30 rounded-lg p-4">
              <h3 className="font-semibold text-purple-400 mb-3 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Performance Predictions
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-racing-red">P{analysis.performancePrediction.qualifyingPosition}</div>
                  <div className="text-xs text-gray-400">Qualifying</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-racing-blue">P{analysis.performancePrediction.racePosition}</div>
                  <div className="text-xs text-gray-400">Race Finish</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{analysis.performancePrediction.pointsScored}</div>
                  <div className="text-xs text-gray-400">Points</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">{(analysis.performancePrediction.probabilityOfPodium * 100).toFixed(0)}%</div>
                  <div className="text-xs text-gray-400">Podium Chance</div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-300">Win Probability</span>
                    <span className="font-mono">{(analysis.performancePrediction.probabilityOfWin * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-racing-red h-2 rounded-full transition-all duration-300"
                      style={{ width: `${analysis.performancePrediction.probabilityOfWin * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-300">Podium Probability</span>
                    <span className="font-mono">{(analysis.performancePrediction.probabilityOfPodium * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-racing-blue h-2 rounded-full transition-all duration-300"
                      style={{ width: `${analysis.performancePrediction.probabilityOfPodium * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
