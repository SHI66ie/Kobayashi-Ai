'use client'

import React, { useState, useEffect } from 'react'
import { Play, Pause, RotateCcw, Settings, Zap, Gauge, Wind, Droplets, AlertTriangle, TrendingUp } from 'lucide-react'

interface WhatIfSimulatorProps {
  trackId: string
  drivers: string[]
  className?: string
}

interface SimulationParams {
  fuelLoad: number // kg
  tireCompound: 'soft' | 'medium' | 'hard'
  drsEnabled: boolean
  drsZones: number
  weatherCondition: 'dry' | 'wet' | 'mixed'
  trackTemperature: number // °C
  airTemperature: number // °C
  safetyCar: boolean
  virtualSafetyCar: boolean
  redFlag: boolean
}

interface SimulationResult {
  lapTime: string
  positionGain: number
  tireWear: number
  fuelConsumption: number
  riskLevel: 'low' | 'medium' | 'high'
  recommendation: string
  confidence: number
}

const WhatIfSimulator: React.FC<WhatIfSimulatorProps> = ({
  trackId,
  drivers = ['Max Verstappen', 'Lewis Hamilton', 'Charles Leclerc'],
  className = ''
}) => {
  const [isSimulating, setIsSimulating] = useState(false)
  const [selectedDriver, setSelectedDriver] = useState(drivers[0])
  const [simulationProgress, setSimulationProgress] = useState(0)
  const [results, setResults] = useState<SimulationResult | null>(null)
  const [comparisonResults, setComparisonResults] = useState<SimulationResult[]>([])

  const [params, setParams] = useState<SimulationParams>({
    fuelLoad: 50,
    tireCompound: 'medium',
    drsEnabled: true,
    drsZones: 3,
    weatherCondition: 'dry',
    trackTemperature: 28,
    airTemperature: 22,
    safetyCar: false,
    virtualSafetyCar: false,
    redFlag: false
  })

  const [baselineParams] = useState<SimulationParams>({
    fuelLoad: 50,
    tireCompound: 'medium',
    drsEnabled: true,
    drsZones: 3,
    weatherCondition: 'dry',
    trackTemperature: 28,
    airTemperature: 22,
    safetyCar: false,
    virtualSafetyCar: false,
    redFlag: false
  })

  const runSimulation = async (scenarioParams: SimulationParams, isComparison = false) => {
    setIsSimulating(true)
    setSimulationProgress(0)

    // Simulate progressive calculation
    for (let i = 0; i <= 100; i += 10) {
      setSimulationProgress(i)
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    // Calculate simulation results based on parameters
    const baseLapTime = trackId === 'monaco' ? 78 : trackId === 'spa' ? 108 : trackId === 'monza' ? 83 : 95
    let lapTimeAdjustment = 0

    // Fuel load impact
    lapTimeAdjustment += (scenarioParams.fuelLoad - baselineParams.fuelLoad) * 0.02

    // Tire compound impact
    const tireImpact = {
      soft: -0.8,
      medium: 0,
      hard: 0.6
    }
    lapTimeAdjustment += tireImpact[scenarioParams.tireCompound]

    // DRS impact
    if (scenarioParams.drsEnabled) {
      lapTimeAdjustment -= scenarioParams.drsZones * 0.3
    }

    // Weather impact
    const weatherImpact = {
      dry: 0,
      wet: 3.2,
      mixed: 1.8
    }
    lapTimeAdjustment += weatherImpact[scenarioParams.weatherCondition]

    // Temperature impact
    const tempDiff = scenarioParams.trackTemperature - baselineParams.trackTemperature
    lapTimeAdjustment += tempDiff * 0.03

    // Safety car scenarios
    let positionGain = 0
    if (scenarioParams.safetyCar) positionGain += Math.random() * 2
    if (scenarioParams.virtualSafetyCar) positionGain += Math.random() * 1
    if (scenarioParams.redFlag) positionGain += Math.random() * 3

    // Calculate metrics
    const finalLapTime = baseLapTime + lapTimeAdjustment + (Math.random() - 0.5) * 2
    const tireWear = scenarioParams.tireCompound === 'soft' ? 0.8 : scenarioParams.tireCompound === 'medium' ? 0.5 : 0.3
    const fuelConsumption = 1.8 + (scenarioParams.fuelLoad > baselineParams.fuelLoad ? 0.2 : -0.1)

    // Determine risk level
    const riskFactors = [
      scenarioParams.weatherCondition === 'wet',
      scenarioParams.tireCompound === 'soft' && scenarioParams.fuelLoad > 60,
      scenarioParams.redFlag,
      Math.abs(lapTimeAdjustment) > 2
    ]
    const riskCount = riskFactors.filter(Boolean).length
    const riskLevel = riskCount <= 1 ? 'low' : riskCount <= 2 ? 'medium' : 'high'

    // Generate recommendation
    let recommendation = ''
    if (riskLevel === 'high') {
      recommendation = 'High risk scenario. Consider conservative strategy.'
    } else if (lapTimeAdjustment < -1) {
      recommendation = 'Aggressive setup shows potential for significant gains.'
    } else if (lapTimeAdjustment > 1) {
      recommendation = 'Conservative approach recommended due to conditions.'
    } else {
      recommendation = 'Balanced strategy with moderate risk/reward profile.'
    }

    const result: SimulationResult = {
      lapTime: `${Math.floor(finalLapTime)}:${((finalLapTime % 1) * 60).toFixed(3)}`,
      positionGain: Math.round(positionGain * 10) / 10,
      tireWear: Math.round(tireWear * 100) / 100,
      fuelConsumption: Math.round(fuelConsumption * 100) / 100,
      riskLevel,
      recommendation,
      confidence: Math.max(60, 95 - riskCount * 10 - Math.abs(lapTimeAdjustment) * 5)
    }

    if (isComparison) {
      setComparisonResults(prev => [...prev, result])
    } else {
      setResults(result)
      setComparisonResults([])
    }

    setIsSimulating(false)
    setSimulationProgress(0)
  }

  const runComparison = async () => {
    setComparisonResults([])
    
    // Compare different scenarios
    const scenarios: Partial<SimulationParams>[] = [
      { tireCompound: 'soft' },
      { tireCompound: 'medium' },
      { tireCompound: 'hard' },
      { drsEnabled: false },
      { fuelLoad: 30 },
      { fuelLoad: 70 },
      { weatherCondition: 'wet' }
    ]

    for (const scenario of scenarios) {
      const scenarioParams = { ...params, ...scenario }
      await runSimulation(scenarioParams as SimulationParams, true)
      await new Promise(resolve => setTimeout(resolve, 200))
    }
  }

  const resetToBaseline = () => {
    setParams(baselineParams)
    setResults(null)
    setComparisonResults([])
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-500'
      case 'medium': return 'text-yellow-500'
      case 'high': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  const getRiskBgColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-500/20 border-green-500/30'
      case 'medium': return 'bg-yellow-500/20 border-yellow-500/30'
      case 'high': return 'bg-red-500/20 border-red-500/30'
      default: return 'bg-gray-500/20 border-gray-500/30'
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="bg-gray-900 rounded-xl p-6 border border-white/5">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center">
            <Settings className="w-6 h-6 mr-2 text-racing-red" />
            What-If Scenario Simulator
          </h2>
          <div className="flex items-center gap-2">
            <select
              value={selectedDriver}
              onChange={(e) => setSelectedDriver(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
            >
              {drivers.map(driver => (
                <option key={driver} value={driver}>{driver}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Parameter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {/* Fuel Load */}
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-white flex items-center">
                <Gauge className="w-4 h-4 mr-2 text-blue-400" />
                Fuel Load
              </label>
              <span className="text-sm text-gray-400">{params.fuelLoad} kg</span>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              value={params.fuelLoad}
              onChange={(e) => setParams({ ...params, fuelLoad: Number(e.target.value) })}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>20kg</span>
              <span>100kg</span>
            </div>
          </div>

          {/* Tire Compound */}
          <div className="bg-gray-800 rounded-lg p-4">
            <label className="text-sm font-medium text-white flex items-center mb-2">
              <TrendingUp className="w-4 h-4 mr-2 text-orange-400" />
              Tire Compound
            </label>
            <div className="flex gap-2">
              {(['soft', 'medium', 'hard'] as const).map(compound => (
                <button
                  key={compound}
                  onClick={() => setParams({ ...params, tireCompound: compound })}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    params.tireCompound === compound
                      ? compound === 'soft' ? 'bg-red-500 text-white' :
                        compound === 'medium' ? 'bg-yellow-500 text-white' :
                        'bg-green-500 text-white'
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                >
                  {compound.charAt(0).toUpperCase() + compound.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Weather */}
          <div className="bg-gray-800 rounded-lg p-4">
            <label className="text-sm font-medium text-white flex items-center mb-2">
              <Wind className="w-4 h-4 mr-2 text-cyan-400" />
              Weather Conditions
            </label>
            <div className="flex gap-2">
              {(['dry', 'mixed', 'wet'] as const).map(weather => (
                <button
                  key={weather}
                  onClick={() => setParams({ ...params, weatherCondition: weather })}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    params.weatherCondition === weather
                      ? weather === 'dry' ? 'bg-blue-500 text-white' :
                        weather === 'mixed' ? 'bg-purple-500 text-white' :
                        'bg-cyan-500 text-white'
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                >
                  {weather.charAt(0).toUpperCase() + weather.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Track Temperature */}
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-white flex items-center">
                <Zap className="w-4 h-4 mr-2 text-red-400" />
                Track Temperature
              </label>
              <span className="text-sm text-gray-400">{params.trackTemperature}°C</span>
            </div>
            <input
              type="range"
              min="15"
              max="45"
              value={params.trackTemperature}
              onChange={(e) => setParams({ ...params, trackTemperature: Number(e.target.value) })}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>15°C</span>
              <span>45°C</span>
            </div>
          </div>

          {/* DRS Settings */}
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-white">DRS Settings</label>
              <input
                type="checkbox"
                checked={params.drsEnabled}
                onChange={(e) => setParams({ ...params, drsEnabled: e.target.checked })}
                className="w-4 h-4 text-racing-red bg-gray-700 border-gray-600 rounded focus:ring-racing-red"
              />
            </div>
            {params.drsEnabled && (
              <div>
                <label className="text-xs text-gray-400">DRS Zones: {params.drsZones}</label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={params.drsZones}
                  onChange={(e) => setParams({ ...params, drsZones: Number(e.target.value) })}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer mt-1"
                />
              </div>
            )}
          </div>

          {/* Race Scenarios */}
          <div className="bg-gray-800 rounded-lg p-4">
            <label className="text-sm font-medium text-white flex items-center mb-2">
              <AlertTriangle className="w-4 h-4 mr-2 text-yellow-400" />
              Race Scenarios
            </label>
            <div className="space-y-2">
              {[
                { key: 'safetyCar', label: 'Safety Car' },
                { key: 'virtualSafetyCar', label: 'VSC' },
                { key: 'redFlag', label: 'Red Flag' }
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={params[key as keyof SimulationParams] as boolean}
                    onChange={(e) => setParams({ ...params, [key]: e.target.checked })}
                    className="w-3 h-3 text-racing-red bg-gray-700 border-gray-600 rounded"
                  />
                  <span className="text-gray-400">{label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={() => runSimulation(params)}
            disabled={isSimulating}
            className="flex items-center gap-2 px-6 py-3 bg-racing-red text-white rounded-lg font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isSimulating ? (
              <>
                <Pause className="w-4 h-4" />
                Simulating...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Run Simulation
              </>
            )}
          </button>
          
          <button
            onClick={runComparison}
            disabled={isSimulating}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <TrendingUp className="w-4 h-4" />
            Compare Scenarios
          </button>
          
          <button
            onClick={resetToBaseline}
            className="flex items-center gap-2 px-6 py-3 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Baseline
          </button>
        </div>

        {/* Progress Bar */}
        {isSimulating && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Simulation Progress</span>
              <span className="text-sm text-gray-400">{simulationProgress}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-racing-red h-2 rounded-full transition-all duration-300"
                style={{ width: `${simulationProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Results */}
        {(results || comparisonResults.length > 0) && (
          <div className="space-y-4">
            {results && (
              <div className="bg-gray-800 rounded-xl p-6 border border-white/5">
                <h3 className="text-lg font-bold text-white mb-4">Simulation Results</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-gray-900 rounded-lg p-4">
                    <p className="text-xs text-gray-400 mb-1">Predicted Lap Time</p>
                    <p className="text-2xl font-bold text-racing-red">{results.lapTime}</p>
                  </div>
                  <div className="bg-gray-900 rounded-lg p-4">
                    <p className="text-xs text-gray-400 mb-1">Position Gain</p>
                    <p className="text-2xl font-bold text-green-500">+{results.positionGain}</p>
                  </div>
                  <div className="bg-gray-900 rounded-lg p-4">
                    <p className="text-xs text-gray-400 mb-1">Confidence</p>
                    <p className="text-2xl font-bold text-blue-500">{results.confidence}%</p>
                  </div>
                  <div className="bg-gray-900 rounded-lg p-4">
                    <p className="text-xs text-gray-400 mb-1">Tire Wear/Lap</p>
                    <p className="text-2xl font-bold text-orange-500">{results.tireWear}%</p>
                  </div>
                  <div className="bg-gray-900 rounded-lg p-4">
                    <p className="text-xs text-gray-400 mb-1">Fuel Consumption</p>
                    <p className="text-2xl font-bold text-purple-500">{results.fuelConsumption}kg/lap</p>
                  </div>
                  <div className={`bg-gray-900 rounded-lg p-4 border ${getRiskBgColor(results.riskLevel)}`}>
                    <p className="text-xs text-gray-400 mb-1">Risk Level</p>
                    <p className={`text-2xl font-bold ${getRiskColor(results.riskLevel)}`}>
                      {results.riskLevel.toUpperCase()}
                    </p>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-gray-900 rounded-lg border border-white/5">
                  <p className="text-sm text-gray-400 mb-2">AI Recommendation</p>
                  <p className="text-white">{results.recommendation}</p>
                </div>
              </div>
            )}

            {comparisonResults.length > 0 && (
              <div className="bg-gray-800 rounded-xl p-6 border border-white/5">
                <h3 className="text-lg font-bold text-white mb-4">Scenario Comparison</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-400 border-b border-white/5">
                        <th className="text-left pb-2">Scenario</th>
                        <th className="text-center pb-2">Lap Time</th>
                        <th className="text-center pb-2">Position Gain</th>
                        <th className="text-center pb-2">Risk Level</th>
                        <th className="text-center pb-2">Confidence</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonResults.map((result, index) => (
                        <tr key={index} className="border-b border-white/5">
                          <td className="py-2 text-white">Scenario {index + 1}</td>
                          <td className="text-center py-2 font-mono">{result.lapTime}</td>
                          <td className="text-center py-2 text-green-500">+{result.positionGain}</td>
                          <td className="text-center py-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskBgColor(result.riskLevel)} ${getRiskColor(result.riskLevel)}`}>
                              {result.riskLevel}
                            </span>
                          </td>
                          <td className="text-center py-2">{result.confidence}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default WhatIfSimulator
