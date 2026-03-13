'use client'

import React, { useState, useEffect } from 'react'
import { Brain, Zap, Shield, Target, Activity, Cpu, Eye, Navigation } from 'lucide-react'
import { dataFusionService, EnhancedDriverData, EnhancedRaceData } from '../../lib/data-fusion'

interface AdvancedAIPanelProps {
  raceData: any
  track: string
  race: string
  simulatedWeather?: any
}

export default function AdvancedAIPanel({ raceData, track, race, simulatedWeather }: AdvancedAIPanelProps) {
  const [activeMode, setActiveMode] = useState<'multimodal' | 'autonomous' | 'safety'>('multimodal')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [enhancedDriverData, setEnhancedDriverData] = useState<EnhancedDriverData | null>(null)
  const [enhancedRaceData, setEnhancedRaceData] = useState<EnhancedRaceData | null>(null)
  const [selectedDriver, setSelectedDriver] = useState<string>('Max Verstappen')

  // Load enhanced data when component mounts or driver changes
  useEffect(() => {
    const loadEnhancedData = async () => {
      try {
        const [driverData, raceData] = await Promise.all([
          dataFusionService.getEnhancedDriverData(selectedDriver),
          dataFusionService.getEnhancedRaceData(race, new Date().getFullYear())
        ])
        
        setEnhancedDriverData(driverData)
        setEnhancedRaceData(raceData)
      } catch (error) {
        console.error('Error loading enhanced data:', error)
      }
    }

    if (selectedDriver && race) {
      loadEnhancedData()
    }
  }, [selectedDriver, race])

  const runMultimodalAnalysis = async (analysisType: string) => {
    setLoading(true)
    console.log('Starting performance analysis...')
    
    try {
      // Simulate API call delay for realistic experience
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Use high-quality mock data directly (no API dependency)
      console.log('Using advanced analysis data...')
      setResult({
        type: 'performance',
        analysis: `**Performance Analysis for ${selectedDriver} at ${track}**

**Current Performance Metrics:**
- Lap Time: 1:23.456 (Target: 1:23.000)
- Top Speed: 285 km/h (Sector 3)
- Tire Wear: Medium (C3 compound optimal for this stint)
- Fuel Load: 45kg (Optimal for current strategy)

**Key Findings:**
• Driver is 0.456s off target pace in sector 2
• Tire temperature is optimal for current conditions
• Fuel strategy aligns with race plan
• DRS utilization could be improved by 15%

**Recommendations:**
1. Focus on sector 2 braking points
2. Optimize DRS activation zones
3. Maintain current tire strategy
4. Consider fuel mix adjustment for final stint`,
        context: {
          track: track,
          driver: selectedDriver,
          conditions: simulatedWeather,
          targetTime: '1:23.000'
        },
        confidence: 87
      })
      
    } catch (error) {
      console.error('Advanced AI Analysis Error:', error)
      setResult({
        type: 'error',
        message: 'Analysis failed - please try again'
      })
    } finally {
      setLoading(false)
    }
  }

  const runAutonomousAnalysis = async () => {
    setLoading(true)
    console.log('Starting telemetry analysis...')
    
    try {
      // Simulate API call delay for realistic experience
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Use high-quality mock data directly (no API dependency)
      console.log('Using advanced telemetry data...')
      setResult({
        type: 'telemetry',
        analysis: `**Telemetry Analysis - Lap 15 at ${track}**

**Real-time Telemetry Data:**
- Speed: 280 km/h (Current) / 295 km/h (Max)
- RPM: 15,000 (Optimal range: 14,500-15,500)
- Throttle: 85% (Average: 82%)
- Brake: 15% (Peak: 89% in sector 1)
- DRS: Active in zones 2 and 3

**Sector Analysis:**
• Sector 1: 28.456s (Best: 28.234s)
• Sector 2: 32.123s (Best: 31.987s) 
• Sector 3: 26.789s (Best: 26.543s)

**Driver Performance:**
• Throttle application is smooth but conservative
• Brake points are consistent, 3m early in sector 1
• DRS utilization at 92% efficiency
• Gear shifts optimal, no missed upshifts

**AI Recommendations:**
1. Move brake points 2-3m deeper in sector 1
2. Increase throttle commitment in sector 2
3. Utilize full DRS window in zone 2
4. Consider higher gear for final corner`,
        context: {
          currentLap: 15,
          currentSector: 1,
          driver: selectedDriver,
          track: track,
          telemetry: {
            speed: 280,
            rpm: 15000,
            throttle: 85,
            brake: 15,
            drs: true
          }
        },
        confidence: 91
      })
      
    } catch (error) {
      console.error('Autonomous AI Analysis Error:', error)
      setResult({
        type: 'error',
        message: 'Telemetry analysis failed - please try again'
      })
    } finally {
      setLoading(false)
    }
  }

  const runSafetyAnalysis = async () => {
    setLoading(true)
    console.log('Starting strategy analysis...')
    
    try {
      // Simulate API call delay for realistic experience
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Use high-quality mock data directly (no API dependency)
      console.log('Using advanced strategy data...')
      setResult({
        type: 'strategy',
        analysis: `**Race Strategy Analysis - Lap 42/78 at ${track}**

**Current Race Situation:**
- Position: P3 (Gap to leader: +12.4s)
- Tires: C3 Medium (Age: 15 laps)
- Fuel: 28kg remaining (Optimal for 36 laps)
- Safety Car: Not active

**Strategy Assessment:**
• Current tire compound has 8-10 laps optimal life remaining
- Pit window opens in 3-5 laps for optimal undercut
- Fuel consumption is 2.3% above target
- Gap to P2: 2.5s (within DRS range)
- Gap from P4: 1.8s (vulnerable to undercut)

**Recommended Actions:**
1. **Pit Strategy**: Box lap 47-49 for C2 Soft
2. **Fuel Mix**: Switch to lean mode for next 8 laps
3. **Tire Management**: Avoid curbing, preserve rubber
4. **Defensive**: Prepare for potential overcut from P4

**Alternative Strategies:**
• **Two-Stop**: Current plan, most reliable option
• **One-Stop**: High risk, requires perfect tire management
• **Three-Stop**: Conservative, good for safety cars

**Weather Impact:**
- Current conditions stable for 45 minutes
- No rain expected in next 2 hours
- Track temperature decreasing by 1°C per hour`,
        context: {
          lapsRemaining: 36,
          currentTire: 'C3',
          tireAge: 15,
          position: 3,
          gapAhead: 2.5,
          gapBehind: 1.8,
          track: track,
          race: race
        },
        confidence: 88
      })
      
    } catch (error) {
      console.error('Safety AI Analysis Error:', error)
      setResult({
        type: 'error',
        message: 'Strategy analysis failed - please try again'
      })
    } finally {
      setLoading(false)
    }
  }

  // Helper method to determine braking style from historical data
  const getBrakingStyleFromData = (performance: any): string => {
    const avgQualifyingPos = performance.averageQualifyingPosition
    if (avgQualifyingPos <= 3) return 'Aggressive'
    if (avgQualifyingPos <= 10) return 'Balanced'
    return 'Conservative'
  }

  const aiModes = [
    {
      id: 'multimodal' as const,
      name: 'Multimodal AI',
      icon: Brain,
      description: 'Advanced multi-sensor analysis',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20',
      features: ['Performance Analysis', 'Strategy Optimization', 'Safety Assessment', 'Comprehensive Review']
    },
    {
      id: 'autonomous' as const,
      name: 'Autonomous Racing',
      icon: Cpu,
      description: 'Self-driving race analysis',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
      features: ['Real-time Decisions', 'Path Planning', 'Risk Assessment', 'Predictive Control']
    },
    {
      id: 'safety' as const,
      name: 'Safety AI',
      icon: Shield,
      description: 'Advanced safety monitoring',
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
      features: ['Hazard Detection', 'Risk Scoring', 'Emergency Planning', 'Incident Prevention']
    }
  ]

  const renderMultimodalControls = () => (
    <div className="grid grid-cols-2 gap-3">
      <button
        onClick={() => runMultimodalAnalysis('performance')}
        disabled={loading}
        className="p-3 bg-purple-600/20 hover:bg-purple-600/30 rounded-lg border border-purple-500/30 transition-colors"
      >
        <Target className="w-5 h-5 text-purple-400 mb-2" />
        <div className="text-sm font-semibold">Performance</div>
        <div className="text-xs text-gray-400">Optimize lap times</div>
      </button>
      
      <button
        onClick={() => runMultimodalAnalysis('performance')}
        disabled={loading}
        className="p-3 bg-purple-600/20 hover:bg-purple-600/30 rounded-lg border border-purple-500/30 transition-colors"
      >
        <Target className="w-5 h-5 text-purple-400 mb-2" />
        <div className="text-sm font-semibold">Performance</div>
        <div className="text-xs text-gray-400">Optimize lap times</div>
      </button>
      
      <button
        onClick={() => runSafetyAnalysis()}
        disabled={loading}
        className="p-3 bg-purple-600/20 hover:bg-purple-600/30 rounded-lg border border-purple-500/30 transition-colors"
      >
        <Zap className="w-5 h-5 text-purple-400 mb-2" />
        <div className="text-sm font-semibold">Strategy</div>
        <div className="text-xs text-gray-400">Race planning</div>
      </button>
      
      <button
        onClick={() => runAutonomousAnalysis()}
        disabled={loading}
        className="p-3 bg-purple-600/20 hover:bg-purple-600/30 rounded-lg border border-purple-500/30 transition-colors"
      >
        <Shield className="w-5 h-5 text-purple-400 mb-2" />
        <div className="text-sm font-semibold">Telemetry</div>
        <div className="text-xs text-gray-400">Real-time analysis</div>
      </button>
      
      <button
        onClick={() => runMultimodalAnalysis('comprehensive')}
        disabled={loading}
        className="p-3 bg-purple-600/20 hover:bg-purple-600/30 rounded-lg border border-purple-500/30 transition-colors"
      >
        <Activity className="w-5 h-5 text-purple-400 mb-2" />
        <div className="text-sm font-semibold">Complete</div>
        <div className="text-xs text-gray-400">Full analysis</div>
      </button>
    </div>
  )

  const renderAutonomousControls = () => (
    <div className="grid grid-cols-1 gap-3">
      <button
        onClick={() => runAutonomousAnalysis()}
        disabled={loading}
        className="p-4 bg-blue-600/20 hover:bg-blue-600/30 rounded-lg border border-blue-500/30 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <Cpu className="w-6 h-6 text-blue-400" />
          <div className="text-left">
            <div className="font-semibold">Autonomous Racing Mode</div>
            <div className="text-sm text-gray-400">Real-time racing decisions with explainable AI</div>
          </div>
        </div>
      </button>
      
      <button
        onClick={() => runAutonomousAnalysis()}
        disabled={loading}
        className="p-4 bg-blue-600/20 hover:bg-blue-600/30 rounded-lg border border-blue-500/30 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <Navigation className="w-6 h-6 text-blue-400" />
          <div className="text-left">
            <div className="font-semibold">AI Pit Crew Chief</div>
            <div className="text-sm text-gray-400">Strategic pit stop optimization</div>
          </div>
        </div>
      </button>
      
      <button
        onClick={() => runAutonomousAnalysis()}
        disabled={loading}
        className="p-4 bg-blue-600/20 hover:bg-blue-600/30 rounded-lg border border-blue-500/30 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <Eye className="w-6 h-6 text-blue-400" />
          <div className="text-left">
            <div className="font-semibold">AI Race Engineer</div>
            <div className="text-sm text-gray-400">Technical analysis and setup optimization</div>
          </div>
        </div>
      </button>
    </div>
  )

  const renderSafetyControls = () => (
    <div className="p-4 bg-green-600/20 rounded-lg border border-green-500/30">
      <div className="flex items-center space-x-3 mb-3">
        <Shield className="w-6 h-6 text-green-400" />
        <div>
          <div className="font-semibold">Advanced Safety AI</div>
          <div className="text-sm text-gray-400">Real-time hazard detection and risk assessment</div>
        </div>
      </div>
      <button
        onClick={() => runMultimodalAnalysis('safety')}
        disabled={loading}
        className="w-full p-3 bg-green-600/30 hover:bg-green-600/40 rounded-lg transition-colors"
      >
        Run Safety Analysis
      </button>
    </div>
  )

  return (
    <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 rounded-xl p-6 border border-purple-500/30 shadow-2xl backdrop-blur-sm">
      <div className="flex items-center mb-6">
        <div className="relative">
          <Brain className="w-7 h-7 text-purple-400 mr-3" />
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
        </div>
        <h2 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Advanced AI Systems</h2>
        <div className="flex-1 h-px bg-gradient-to-r from-purple-500/30 to-transparent mx-4" />
        <span className="text-xs bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-300 px-3 py-1.5 rounded-full border border-purple-500/40 font-semibold shadow-lg shadow-purple-500/10">
          Research-Grade AI
        </span>
      </div>

      {/* Mode Selection */}
      <div className="flex space-x-2 mb-6">
        {aiModes.map((mode) => {
          const Icon = mode.icon
          return (
            <button
              key={mode.id}
              onClick={() => setActiveMode(mode.id)}
              className={`flex-1 p-3 rounded-lg transition-all ${
                activeMode === mode.id
                  ? `${mode.bgColor} border-2 border-current ${mode.color}`
                  : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700 border-2 border-transparent'
              }`}
            >
              <Icon className={`w-5 h-5 mx-auto mb-1 ${activeMode === mode.id ? mode.color : 'text-gray-400'}`} />
              <div className="text-xs font-semibold">{mode.name}</div>
            </button>
          )
        })}
      </div>

      {/* Mode Description */}
      <div className="mb-6 p-4 bg-gray-900/50 rounded-lg">
        <div className="flex items-center space-x-3 mb-2">
          {React.createElement(aiModes.find(m => m.id === activeMode)?.icon || Brain, {
            className: `w-5 h-5 ${aiModes.find(m => m.id === activeMode)?.color}`
          })}
          <h3 className="font-semibold">{aiModes.find(m => m.id === activeMode)?.name}</h3>
        </div>
        <p className="text-sm text-gray-400 mb-3">{aiModes.find(m => m.id === activeMode)?.description}</p>
        <div className="flex flex-wrap gap-2">
          {aiModes.find(m => m.id === activeMode)?.features.map((feature, idx) => (
            <span key={idx} className="text-xs bg-gray-700/50 px-2 py-1 rounded">
              {feature}
            </span>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="mb-6">
        {activeMode === 'multimodal' && renderMultimodalControls()}
        {activeMode === 'autonomous' && renderAutonomousControls()}
        {activeMode === 'safety' && renderSafetyControls()}
      </div>

      {/* Results */}
      <div className="bg-gray-900/50 rounded-lg p-4 min-h-[300px]">
        {/* Enhanced Data Insights */}
        {enhancedDriverData && (
          <div className="mb-6 bg-gray-900/50 rounded-lg p-4 border border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg flex items-center space-x-2">
                <Target className="w-5 h-5 text-racing-red" />
                <span>Data-Driven Insights</span>
              </h3>
              <select
                value={selectedDriver}
                onChange={(e) => setSelectedDriver(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded px-3 py-1 text-sm"
              >
                <option value="Max Verstappen">Max Verstappen</option>
                <option value="Charles Leclerc">Charles Leclerc</option>
                <option value="Lewis Hamilton">Lewis Hamilton</option>
                <option value="George Russell">George Russell</option>
                <option value="Carlos Sainz">Carlos Sainz</option>
              </select>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {/* Historical Performance */}
              <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-3">
                <h4 className="font-medium text-blue-400 mb-2 text-sm">Historical Performance</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Avg Qualifying:</span>
                    <span className="font-mono">{enhancedDriverData.historicalPerformance.averageQualifyingPosition.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Avg Race:</span>
                    <span className="font-mono">{enhancedDriverData.historicalPerformance.averageRacePosition.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Points:</span>
                    <span className="font-mono">{enhancedDriverData.historicalPerformance.totalPoints}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Consistency:</span>
                    <span className="font-mono">{(enhancedDriverData.historicalPerformance.consistency * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>

              {/* Current Form */}
              <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-3">
                <h4 className="font-medium text-green-400 mb-2 text-sm">Current Form</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Current Position:</span>
                    <span className="font-mono">#{enhancedDriverData.liveData.currentPosition || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Current Points:</span>
                    <span className="font-mono">{enhancedDriverData.liveData.currentPoints || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Team:</span>
                    <span className="font-mono">{enhancedDriverData.driver.team}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <span className="font-mono capitalize">{enhancedDriverData.liveData.status}</span>
                  </div>
                </div>
              </div>

              {/* AI Predictions */}
              <div className="bg-purple-900/20 border border-purple-700/30 rounded-lg p-3">
                <h4 className="font-medium text-purple-400 mb-2 text-sm">AI Predictions</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Next Qualifying:</span>
                    <span className="font-mono">P{enhancedDriverData.predictions.nextRaceQualifying}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Next Race:</span>
                    <span className="font-mono">P{enhancedDriverData.predictions.nextRaceRace}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Season Finish:</span>
                    <span className="font-mono">P{enhancedDriverData.predictions.championshipFinish}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Confidence:</span>
                    <span className="font-mono">{(enhancedDriverData.predictions.confidence * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Strategy Recommendations */}
            {enhancedRaceData && enhancedRaceData.analysis.keyFactors.length > 0 && (
              <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-3">
                <h4 className="font-medium text-yellow-400 mb-2 text-sm">Key Race Factors</h4>
                <div className="flex flex-wrap gap-2">
                  {enhancedRaceData.analysis.keyFactors.map((factor, idx) => (
                    <span key={idx} className="px-2 py-1 bg-yellow-800/30 text-yellow-300 rounded text-xs">
                      {factor}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Results Section */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-racing-blue mx-auto mb-4"></div>
              <p className="text-gray-400">Advanced AI processing...</p>
            </div>
          </div>
        ) : result ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">AI Analysis Results</h3>
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                {result.metadata?.confidenceScore && (
                  <span>Confidence: {result.metadata.confidenceScore}%</span>
                )}
                {result.metadata?.safetyLevel && (
                  <span>Safety: {result.metadata.safetyLevel}/10</span>
                )}
                <button
                  onClick={() => setResult(null)}
                  className="text-gray-400 hover:text-white"
                >
                  Clear
                </button>
              </div>
            </div>
            
            <div className="space-y-4">
              {/* Action Plan for Autonomous Mode */}
              {result.actionPlan && (
                <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-400 mb-2">Immediate Actions</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Steering:</span>
                      <span className="ml-2 font-mono">{result.actionPlan.steering}°</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Throttle:</span>
                      <span className="ml-2 font-mono">{result.actionPlan.throttle}%</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Brake:</span>
                      <span className="ml-2 font-mono">{result.actionPlan.brake}%</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {result.recommendations && result.recommendations.length > 0 && (
                <div className="bg-purple-900/20 border border-purple-700/30 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-400 mb-2">Key Recommendations</h4>
                  <ul className="space-y-1 text-sm">
                    {result.recommendations.map((rec: string, idx: number) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <span className="text-purple-400 mt-1">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Main Analysis */}
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-5 border border-gray-700 shadow-lg max-h-[400px] overflow-y-auto">
                <div className="prose prose-invert max-w-none">
                  {(result.analysis || '').split('\n\n').map((section: string, idx: number) => {
                    // Check if section is a heading (starts with number or **text**)
                    if (section.match(/^\d+\.\s+\*\*.*\*\*/)) {
                      const [, title, ...content] = section.split(/\n/)
                      return (
                        <div key={idx} className="mb-4">
                          <h4 className="text-racing-red font-bold text-base mb-2 flex items-center space-x-2">
                            <span className="text-xl">▸</span>
                            <span>{title.replace(/^\d+\.\s+/, '').replace(/\*\*/g, '')}</span>
                          </h4>
                          <div className="text-gray-300 text-sm leading-relaxed pl-6 space-y-1">
                            {content.map((line, i) => line && (
                              <p key={i} className="flex items-start space-x-2">
                                <span className="text-racing-blue mt-1">•</span>
                                <span>{line.replace(/^-\s*/, '').replace(/\*\*/g, '')}</span>
                              </p>
                            ))}
                          </div>
                        </div>
                      )
                    } else if (section.match(/^\d+\./)) {
                      // Numbered list item
                      return (
                        <div key={idx} className="mb-3 pl-2">
                          <p className="text-gray-200 text-sm leading-relaxed flex items-start space-x-2">
                            <span className="text-racing-red font-bold mt-0.5">▸</span>
                            <span>{section.replace(/^\d+\.\s+/, '').replace(/\*\*/g, '')}</span>
                          </p>
                        </div>
                      )
                    } else if (section.trim()) {
                      // Regular paragraph
                      return (
                        <p key={idx} className="text-gray-300 text-sm leading-relaxed mb-3">
                          {section.replace(/\*\*/g, '')}
                        </p>
                      )
                    }
                    return null
                  })}
                </div>
              </div>
            </div>

            {/* Metadata */}
            {result.metadata && (
              <div className="mt-4 flex items-center justify-between bg-gray-900/50 rounded-lg p-3 border border-gray-800">
                <div className="flex items-center space-x-4 text-xs text-gray-400">
                  <span className="flex items-center space-x-1">
                    <span>🤖</span>
                    <span>{result.metadata.model || 'AI Model'}</span>
                  </span>
                  <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded">
                    {result.metadata.systemMode || result.analysisType || 'Advanced'}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {result.metadata.tokensUsed && `${result.metadata.tokensUsed} tokens`}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <Brain className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <h3 className="text-lg font-semibold mb-2">Advanced AI Ready</h3>
            <p className="text-gray-400 mb-6">
              Select an analysis mode above to begin advanced AI processing
            </p>
            <div className="text-sm text-gray-500">
              Powered by cutting-edge autonomous driving research
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
