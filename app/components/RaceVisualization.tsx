'use client'

import React, { useState, useEffect } from 'react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ScatterChart,
  Scatter,
  Cell
} from 'recharts'
import { Clock, TrendingUp, Activity, Zap, Target, Gauge } from 'lucide-react'

interface RaceVisualizationProps {
  trackId: string
  trackName?: string
  sessionKey?: number
  driverData?: any[]
  telemetryData?: any[]
  weatherData?: any
  className?: string
}

interface LapTimeData {
  lap: number
  driver1: string
  driver2: string
  driver3: string
  sector1: number
  sector2: number
  sector3: number
  compound: string
}

interface TireDegradationData {
  lap: number
  soft: number
  medium: number
  hard: number
  temperature: number
  wear: number
}

interface RacingLineData {
  x: number
  y: number
  speed: number
  gear: number
  throttle: number
  brake: number
  sector: number
}

const RaceVisualization: React.FC<RaceVisualizationProps> = ({
  trackId,
  trackName,
  sessionKey,
  driverData = [],
  telemetryData = [],
  weatherData,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'lapTimes' | 'tireDegradation' | 'racingLine' | 'performance'>('lapTimes')
  const [selectedDrivers, setSelectedDrivers] = useState<string[]>(['Max Verstappen', 'Lewis Hamilton', 'Charles Leclerc'])
  const [simulationMode, setSimulationMode] = useState<'historical' | 'predicted' | 'whatif'>('historical')
  const [performanceData, setPerformanceData] = useState<any>(null)
  const [loadingAnalysis, setLoadingAnalysis] = useState(false)
  const [realTimeData, setRealTimeData] = useState(false)

  // Generate mock data based on track characteristics
  const generateLapTimeData = (): LapTimeData[] => {
    const baseLapTime = trackId === 'monaco' ? 78 : trackId === 'spa' ? 108 : trackId === 'monza' ? 83 : 95
    const data: LapTimeData[] = []
    
    for (let lap = 1; lap <= 66; lap++) {
      const degradation = lap * 0.15
      const fuelEffect = (66 - lap) * 0.08
      const randomVariation = (Math.random() - 0.5) * 2
      
      data.push({
        lap,
        driver1: (baseLapTime + degradation - fuelEffect + randomVariation + (Math.random() - 0.5) * 3).toFixed(3),
        driver2: (baseLapTime + degradation - fuelEffect + randomVariation + (Math.random() - 0.5) * 3).toFixed(3),
        driver3: (baseLapTime + degradation - fuelEffect + randomVariation + (Math.random() - 0.5) * 3).toFixed(3),
        sector1: Math.floor(Math.random() * 30) + 20,
        sector2: Math.floor(Math.random() * 35) + 25,
        sector3: Math.floor(Math.random() * 25) + 15,
        compound: lap <= 25 ? 'Soft' : lap <= 45 ? 'Medium' : 'Hard'
      })
    }
    
    return data
  }

  const generateTireDegradationData = (): TireDegradationData[] => {
    const data: TireDegradationData[] = []
    
    for (let lap = 1; lap <= 66; lap++) {
      data.push({
        lap,
        soft: Math.max(0.3, 1.0 - (lap * 0.025) + (Math.random() - 0.5) * 0.05),
        medium: Math.max(0.4, 1.0 - (lap * 0.018) + (Math.random() - 0.5) * 0.04),
        hard: Math.max(0.5, 1.0 - (lap * 0.012) + (Math.random() - 0.5) * 0.03),
        temperature: 85 + Math.sin(lap * 0.1) * 15 + (Math.random() - 0.5) * 5,
        wear: lap * 1.5 + (Math.random() - 0.5) * 2
      })
    }
    
    return data
  }

  const generateRacingLineData = (): RacingLineData[] => {
    const data: RacingLineData[] = []
    
    // Simulate racing line around the track
    for (let i = 0; i <= 360; i += 5) {
      const angle = (i * Math.PI) / 180
      const radiusVariation = Math.sin(angle * 3) * 20 + Math.cos(angle * 5) * 10
      const baseRadius = 100
      const speed = Math.max(80, 280 - Math.abs(Math.sin(angle * 2)) * 120 - Math.random() * 20)
      
      data.push({
        x: Math.cos(angle) * (baseRadius + radiusVariation),
        y: Math.sin(angle) * (baseRadius + radiusVariation),
        speed,
        gear: Math.min(8, Math.max(1, Math.floor(speed / 40))),
        throttle: speed > 150 ? Math.random() * 40 + 60 : Math.random() * 30,
        brake: speed < 150 ? Math.random() * 60 + 20 : Math.random() * 10,
        sector: Math.floor(i / 120) + 1
      })
    }
    
    return data
  }

  const [lapTimeData, setLapTimeData] = useState<LapTimeData[]>([])
  const [tireData, setTireData] = useState<TireDegradationData[]>([])
  const [racingLineData, setRacingLineData] = useState<RacingLineData[]>([])

  // Fetch performance analysis data
  const fetchPerformanceAnalysis = async () => {
    if (!sessionKey) return
    
    setLoadingAnalysis(true)
    try {
      const response = await fetch(`/api/f1/performance-analysis?session_key=${sessionKey}&circuit=${trackName || trackId}&session_type=race`)
      const result = await response.json()
      
      if (result.success) {
        setPerformanceData(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch performance analysis:', error)
    } finally {
      setLoadingAnalysis(false)
    }
  }

  useEffect(() => {
    if (sessionKey && realTimeData) {
      fetchPerformanceAnalysis()
      // Refresh every 30 seconds for real-time data
      const interval = setInterval(fetchPerformanceAnalysis, 30000)
      return () => clearInterval(interval)
    }
  }, [sessionKey, realTimeData, trackName])

  useEffect(() => {
    setLapTimeData(generateLapTimeData())
    setTireData(generateTireDegradationData())
    setRacingLineData(generateRacingLineData())
  }, [trackId])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl">
          <p className="text-white font-semibold mb-2">Lap {label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  const lapTimeChart = (
    <div className="bg-gray-900 rounded-xl p-6 border border-white/5">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-white flex items-center">
          <Clock className="w-5 h-5 mr-2 text-racing-red" />
          Lap Time Evolution
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Mode:</span>
          <select
            value={simulationMode}
            onChange={(e) => setSimulationMode(e.target.value as any)}
            className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white"
          >
            <option value="historical">Historical</option>
            <option value="predicted">Predicted</option>
            <option value="whatif">What-If</option>
          </select>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={lapTimeData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="lap" stroke="#9CA3AF" />
          <YAxis stroke="#9CA3AF" domain={['dataMin - 1', 'dataMax + 1']} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line type="monotone" dataKey="driver1" stroke="#EF4444" strokeWidth={2} dot={false} name="Max Verstappen" />
          <Line type="monotone" dataKey="driver2" stroke="#3B82F6" strokeWidth={2} dot={false} name="Lewis Hamilton" />
          <Line type="monotone" dataKey="driver3" stroke="#10B981" strokeWidth={2} dot={false} name="Charles Leclerc" />
          <ReferenceLine y={95} stroke="#F59E0B" strokeDasharray="5 5" label="Target Lap" />
        </LineChart>
      </ResponsiveContainer>
      
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="bg-gray-800 rounded-lg p-3">
          <p className="text-xs text-gray-400">Fastest Lap</p>
          <p className="text-lg font-bold text-racing-red">1:23.456</p>
          <p className="text-xs text-gray-500">Max Verstappen</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-3">
          <p className="text-xs text-gray-400">Average Lap</p>
          <p className="text-lg font-bold text-white">1:25.234</p>
          <p className="text-xs text-gray-500">All Drivers</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-3">
          <p className="text-xs text-gray-400">Consistency</p>
          <p className="text-lg font-bold text-green-500">±0.8s</p>
          <p className="text-xs text-gray-500">Std Deviation</p>
        </div>
      </div>
    </div>
  )

  const tireDegradationChart = (
    <div className="bg-gray-900 rounded-xl p-6 border border-white/5">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-white flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-racing-red" />
          Tire Degradation Analysis
        </h3>
        <div className="flex items-center gap-2">
          {sessionKey && (
            <button
              onClick={() => setRealTimeData(!realTimeData)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                realTimeData 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
            >
              {realTimeData ? 'Live Data' : 'Mock Data'}
            </button>
          )}
          <Activity className="w-4 h-4 text-gray-400" />
          <span className="text-xs text-gray-400">
            {realTimeData ? 'Live Analysis' : 'Simulated Data'}
          </span>
        </div>
      </div>
      
      {loadingAnalysis ? (
        <div className="flex items-center justify-center h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-racing-red"></div>
          <span className="ml-3 text-gray-400">Analyzing tire data...</span>
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={realTimeData && performanceData ? 
              // Use real tire analysis data
              performanceData.tireAnalysis.map((tire: any, index: number) => ({
                lap: index + 1,
                soft: tire.currentCompound === 'soft' ? tire.wearRate * 100 : 0,
                medium: tire.currentCompound === 'medium' ? tire.wearRate * 100 : 0,
                hard: tire.currentCompound === 'hard' ? tire.wearRate * 100 : 0,
                temperature: performanceData.weather?.track_temperature || 28,
                wear: tire.wearRate * 100
              })) : tireData
            }>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="lap" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area type="monotone" dataKey="soft" stackId="1" stroke="#EF4444" fill="#EF4444" fillOpacity={0.6} name="Soft" />
              <Area type="monotone" dataKey="medium" stackId="1" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.6} name="Medium" />
              <Area type="monotone" dataKey="hard" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} name="Hard" />
            </AreaChart>
          </ResponsiveContainer>
          
          <div className="mt-4 grid grid-cols-4 gap-3">
            {realTimeData && performanceData ? (
              // Show real tire analysis data
              performanceData.tireAnalysis.slice(0, 4).map((tire: any, index: number) => (
                <div key={index} className="bg-gray-800 rounded-lg p-3">
                  <p className="text-xs text-gray-400">Driver #{tire.driverNumber}</p>
                  <p className="text-lg font-bold capitalize" style={{
                    color: tire.currentCompound === 'soft' ? '#EF4444' :
                           tire.currentCompound === 'medium' ? '#F59E0B' :
                           tire.currentCompound === 'hard' ? '#10B981' : '#6B7280'
                  }}>
                    {tire.currentCompound}
                  </p>
                  <p className="text-xs text-gray-500">
                    {tire.estimatedLapsRemaining} laps left
                  </p>
                </div>
              ))
            ) : (
              // Show mock data
              <>
                <div className="bg-gray-800 rounded-lg p-3">
                  <p className="text-xs text-gray-400">Soft Life</p>
                  <p className="text-lg font-bold text-red-500">18 laps</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-3">
                  <p className="text-xs text-gray-400">Medium Life</p>
                  <p className="text-lg font-bold text-yellow-500">32 laps</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-3">
                  <p className="text-xs text-gray-400">Hard Life</p>
                  <p className="text-lg font-bold text-green-500">50+ laps</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-3">
                  <p className="text-xs text-gray-400">Optimal Stint</p>
                  <p className="text-lg font-bold text-blue-500">2 stops</p>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )

  const racingLineChart = (
    <div className="bg-gray-900 rounded-xl p-6 border border-white/5">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-white flex items-center">
          <Target className="w-5 h-5 mr-2 text-racing-red" />
          Racing Line Analysis
        </h3>
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-gray-400" />
          <span className="text-xs text-gray-400">Speed & Throttle</span>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="x" stroke="#9CA3AF" />
          <YAxis dataKey="y" stroke="#9CA3AF" />
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
          <Scatter data={racingLineData} fill="#8884d8">
            {racingLineData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={
                entry.speed > 250 ? '#EF4444' : 
                entry.speed > 180 ? '#F59E0B' : 
                entry.speed > 120 ? '#10B981' : '#3B82F6'
              } />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
      
      <div className="mt-4 grid grid-cols-4 gap-3">
        <div className="bg-gray-800 rounded-lg p-3">
          <p className="text-xs text-gray-400">Max Speed</p>
          <p className="text-lg font-bold text-red-500">285 km/h</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-3">
          <p className="text-xs text-gray-400">Min Speed</p>
          <p className="text-lg font-bold text-blue-500">82 km/h</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-3">
          <p className="text-xs text-gray-400">Avg Throttle</p>
          <p className="text-lg font-bold text-green-500">78%</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-3">
          <p className="text-xs text-gray-400">Brake Points</p>
          <p className="text-lg font-bold text-yellow-500">12</p>
        </div>
      </div>
    </div>
  )

  const performanceChart = (
    <div className="bg-gray-900 rounded-xl p-6 border border-white/5">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-white flex items-center">
          <Zap className="w-5 h-5 mr-2 text-racing-red" />
          Performance Metrics
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Live</span>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={lapTimeData.slice(0, 20)}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="lap" stroke="#9CA3AF" />
          <YAxis stroke="#9CA3AF" />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar dataKey="sector1" fill="#EF4444" name="Sector 1" />
          <Bar dataKey="sector2" fill="#F59E0B" name="Sector 2" />
          <Bar dataKey="sector3" fill="#10B981" name="Sector 3" />
        </BarChart>
      </ResponsiveContainer>
      
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="bg-gray-800 rounded-lg p-3">
          <p className="text-xs text-gray-400">Best Sector 1</p>
          <p className="text-lg font-bold text-red-500">24.8s</p>
          <p className="text-xs text-gray-500">Lap 12</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-3">
          <p className="text-xs text-gray-400">Best Sector 2</p>
          <p className="text-lg font-bold text-yellow-500">31.2s</p>
          <p className="text-xs text-gray-500">Lap 8</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-3">
          <p className="text-xs text-gray-400">Best Sector 3</p>
          <p className="text-lg font-bold text-green-500">18.9s</p>
          <p className="text-xs text-gray-500">Lap 15</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 bg-gray-900 rounded-xl p-2 border border-white/5">
        {[
          { id: 'lapTimes', label: 'Lap Times', icon: Clock },
          { id: 'tireDegradation', label: 'Tire Strategy', icon: TrendingUp },
          { id: 'racingLine', label: 'Racing Line', icon: Target },
          { id: 'performance', label: 'Performance', icon: Zap }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === id
                ? 'bg-racing-red text-white shadow-lg shadow-red-500/25'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="text-sm">{label}</span>
          </button>
        ))}
      </div>

      {/* Chart Content */}
      <div className="min-h-[400px]">
        {activeTab === 'lapTimes' && lapTimeChart}
        {activeTab === 'tireDegradation' && tireDegradationChart}
        {activeTab === 'racingLine' && racingLineChart}
        {activeTab === 'performance' && performanceChart}
      </div>
    </div>
  )
}

export default RaceVisualization
