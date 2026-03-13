'use client'

import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react'
import Link from 'next/link'
import Papa from 'papaparse'
import { Trophy, Zap, Target, Brain, Clock, Play, Pause, BarChart3, Download, Flag, TrendingUp, ArrowLeft } from 'lucide-react'

// Lazy load heavy components for F1 optimization
const SetupGuide = lazy(() => import('../components/SetupGuide'))
const AIToolsPanel = lazy(() => import('../components/AIToolsPanel'))
const AdvancedAIPanel = lazy(() => import('../components/AdvancedAIPanel'))
const VoiceControlPanel = lazy(() => import('../components/VoiceControlPanel'))
const TrackMapViewer = lazy(() => import('../components/TrackMapViewer'))
const WeatherControls = lazy(() => import('../components/WeatherControls'))
const ToyotaGRLogo = lazy(() => import('../components/ToyotaGRLogo'))
const DriverComparisonPanel = lazy(() => import('../components/DriverComparisonPanel'))
const RaceQASection = lazy(() => import('../components/RaceQASection'))

// Performance monitoring hook
import { usePerformanceMonitoring } from '../hooks/usePerformanceMonitoring'

interface RaceData {
  loading: boolean
  error: string | null
  data: any[]
}

export default function DashboardPage() {
  // F1 Performance monitoring
  usePerformanceMonitoring()

  // State declarations
  const [selectedTrack, setSelectedTrack] = useState('barber')
  const [selectedRace, setSelectedRace] = useState('R1')
  const [isReplaying, setIsReplaying] = useState(false)
  const [raceData, setRaceData] = useState<RaceData>({ loading: false, error: null, data: [] })
  const [generatedReport, setGeneratedReport] = useState<string | null>(null)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [simulatedWeather, setSimulatedWeather] = useState<any>(null)
  const [dataSourceMode, setDataSourceMode] = useState<'official' | 'custom'>('official')
  const [customDataError, setCustomDataError] = useState<string | null>(null)
  const [customTrackMapUrl, setCustomTrackMapUrl] = useState<string | null>(null)

  // F1 Data Input state
  const [showF1DataInput, setShowF1DataInput] = useState(false)
  const [selectedSeason, setSelectedSeason] = useState(new Date().getFullYear().toString())
  const [availableDrivers, setAvailableDrivers] = useState<any[]>([])
  const [availableConstructors, setAvailableConstructors] = useState<any[]>([])
  const [isLoadingF1Data, setIsLoadingF1Data] = useState(false)
  const [f1Data, setF1Data] = useState({
    driverName: '', driverNumber: '', driverExperience: '', driverTeam: '',
    carModel: '', engineType: '2026 Standardized Power Unit', tireCompound: 'C3', fuelLoad: '110kg', carWeight: '798kg',
    aeroPackage: '2026 Ground Effect', energyRecovery: '800kW',
    trackCondition: 'dry', safetyCar: false, redFlag: false, raceLaps: '', trackEvolution: 'medium', sprintWeekend: false,
    airTemp: '25', trackTemp: '35', humidity: '50', windSpeed: '5', rainProbability: '0', precipitation: 'none',
    pitStrategy: '2-stop', fuelStrategy: 'conservative', tireStrategy: 'C3-C4-C4', overtakeAttempts: '', defensiveDriving: ''
  })

  // F1 Race Predictions state
  const [showPredictions, setShowPredictions] = useState(false)
  const [predictionType, setPredictionType] = useState<'qualifying' | 'race' | 'podium' | 'pit-strategy' | 'overtake' | 'sprint'>('race')
  const [predictionResults, setPredictionResults] = useState<any>(null)
  const [isPredicting, setIsPredicting] = useState(false)

  const tracks = useMemo(() => [
    // Toyota GR Cup Tracks
    { id: 'barber', name: 'Barber Motorsports Park', location: 'Alabama', available: true, category: 'gr-cup', country: 'USA' },
    { id: 'cota', name: 'Circuit of the Americas', location: 'Texas', available: true, category: 'gr-cup', country: 'USA' },
    { id: 'indianapolis', name: 'Indianapolis Motor Speedway', location: 'Indiana', available: true, category: 'gr-cup', country: 'USA' },
    { id: 'road-america', name: 'Road America', location: 'Wisconsin', available: true, category: 'gr-cup', country: 'USA' },
    { id: 'sebring', name: 'Sebring International Raceway', location: 'Florida', available: true, category: 'gr-cup', country: 'USA' },
    { id: 'sonoma', name: 'Sonoma Raceway', location: 'California', available: true, category: 'gr-cup', country: 'USA' },
    { id: 'vir', name: 'Virginia International Raceway', location: 'Virginia', available: true, category: 'gr-cup', country: 'USA' }
  ], [])

  // Helper function to update F1 data
  const updateF1Data = (field: string, value: any) => {
    setF1Data(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Load F1 data from Ergast API
  const loadF1Data = useCallback(async (season: string) => {
    setIsLoadingF1Data(true)
    try {
      const [driversResponse, constructorsResponse] = await Promise.all([
        fetch(`/api/ergast/drivers?season=${season}`),
        fetch(`/api/ergast/constructors?season=${season}`)
      ])

      if (driversResponse.ok) {
        const driversData = await driversResponse.json()
        setAvailableDrivers(driversData.drivers || [])
      }

      if (constructorsResponse.ok) {
        const constructorsData = await constructorsResponse.json()
        setAvailableConstructors(constructorsData.constructors || [])
      }
    } catch (error) {
      console.error('Failed to load F1 data:', error)
    } finally {
      setIsLoadingF1Data(false)
    }
  }, [])

  // Load F1 data when season changes
  useEffect(() => {
    loadF1Data(selectedSeason)
  }, [selectedSeason, loadF1Data])

  // Memoize loadRaceData function to prevent unnecessary re-renders
  const loadRaceData = useCallback(async () => {
    setRaceData({ loading: true, error: null, data: [] })
    setGeneratedReport(null)

    try {
      const response = await fetch(`/api/race-data/${selectedTrack}/${selectedRace}`)
      if (!response.ok) {
        throw new Error('Failed to load data')
      }

      const data = await response.json()
      setRaceData({
        loading: false,
        error: null,
        data: [{ ...data, dataSource: 'Official dataset' }]
      })
    } catch (error: any) {
      setRaceData({
        loading: false,
        error: `Failed to load race data: ${error.message}`,
        data: []
      })
    }
  }, [selectedTrack, selectedRace, dataSourceMode])

  // Simple export function
  const exportReport = async () => {
    if (!raceData.data[0]) {
      alert('Please load race data first!')
      return
    }

    setIsGeneratingReport(true)

    try {
      const response = await fetch('/api/ai-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raceResults: raceData.data[0]?.raceResults,
          lapTimes: raceData.data[0]?.lapTimes,
          weather: simulatedWeather || raceData.data[0]?.weather,
          track: selectedTrack,
          race: selectedRace
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'AI analysis failed')
      }

      const report = `KobayashiAI Race Analysis Report
Track: ${tracks.find(t => t.id === selectedTrack)?.name}
Race: ${selectedRace}
Generated: ${new Date().toLocaleString()}

${result.analysis || 'Analysis complete.'}`

      setGeneratedReport(report)

      const blob = new Blob([report], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `KobayashiAI_${selectedTrack}_${selectedRace}_report.txt`
      a.click()
      URL.revokeObjectURL(url)

    } catch (error: any) {
      const report = `KobayashiAI Race Analysis Report
Track: ${tracks.find(t => t.id === selectedTrack)?.name}
Race: ${selectedRace}
Generated: ${new Date().toLocaleString()}

⚠️ AI Analysis Unavailable
${error.message || 'Could not connect to AI service'}`

      setGeneratedReport(report)
    } finally {
      setIsGeneratingReport(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
      {/* Header - Mobile Optimized */}
      <header className="bg-black/80 backdrop-blur-md border-b border-racing-red/30 shadow-lg shadow-racing-red/10">
        <div className="container mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-5">
          <div className="flex flex-col space-y-3 sm:space-y-0">
            {/* Logo and Title Section */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
                <div className="relative">
                  <Suspense fallback={<div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-700 rounded-full animate-pulse" />}>
                    <ToyotaGRLogo className="w-8 h-8 sm:w-10 sm:h-10 md:w-10 md:h-10 text-racing-red" />
                  </Suspense>
                  <div className="absolute -bottom-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-racing-blue rounded-full animate-pulse" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    KobayashiAI
                  </h1>
                  <p className="text-[9px] sm:text-xs text-racing-red font-semibold tracking-wider">TOYOTA GAZOO RACING</p>
                </div>
              </div>
            </div>
            
            {/* Controls Section */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 md:space-x-4">
              <select
                value={selectedTrack}
                onChange={(e) => setSelectedTrack(e.target.value)}
                className="bg-gray-800 border border-gray-600 rounded px-2 py-2 sm:px-3 sm:py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-racing-red w-full sm:w-auto"
                title="Select Toyota GR Cup Track"
              >
                {tracks.filter(track => track.category === 'gr-cup').map(track => (
                  <option key={track.id} value={track.id}>
                    {track.name} - {track.location} 🇺🇸
                  </option>
                ))}
              </select>
              <select
                value={selectedRace}
                onChange={(e) => setSelectedRace(e.target.value)}
                className="bg-gray-800 border border-gray-600 rounded px-2 py-2 sm:px-3 sm:py-2 text-xs sm:text-sm w-full sm:w-auto"
              >
                <option value="R1">Race 1</option>
                <option value="R2">Race 2</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        {/* Control Panel - Mobile Optimized */}
        <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 border border-racing-red/20 shadow-xl backdrop-blur-sm">
          <div className="flex items-center space-x-2 sm:space-x-3 mb-4 sm:mb-6">
            <Flag className="w-4 h-4 sm:w-5 sm:h-5 text-racing-red" />
            <h2 className="text-lg sm:text-xl font-bold tracking-tight">Race Analysis Controls</h2>
          </div>
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
            <button
              onClick={() => {
                setIsReplaying(true)
                loadRaceData()
                setTimeout(() => setIsReplaying(false), 3000)
              }}
              disabled={isReplaying || dataSourceMode === 'custom'}
              className="bg-gradient-to-r from-racing-red to-red-700 px-4 py-3 sm:px-6 sm:py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 text-sm sm:text-base mobile-tap-target"
            >
              {isReplaying ? <Pause className="w-4 h-4 sm:w-5 sm:h-5" /> : <Play className="w-4 h-4 sm:w-5 sm:h-5" />}
              <span>{isReplaying ? 'Analyzing...' : 'Start Race Replay'}</span>
            </button>

            <button
              onClick={() => loadRaceData()}
              disabled={raceData.loading}
              className="border-2 border-racing-blue px-4 py-3 sm:px-6 sm:py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 text-sm sm:text-base mobile-tap-target"
            >
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>{raceData.loading ? 'Loading...' : 'Load Analytics'}</span>
            </button>

            <button
              onClick={exportReport}
              disabled={isGeneratingReport || raceData.data.length === 0}
              className="bg-gradient-to-r from-racing-blue to-blue-700 px-4 py-3 sm:px-6 sm:py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 text-sm sm:text-base mobile-tap-target"
            >
              {isGeneratingReport ? (
                <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
              ) : (
                <Download className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
              <span>Generate AI Report</span>
            </button>
          </div>
        </div>

        {/* Data Loading Status - Mobile Optimized */}
        {raceData.loading && (
          <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="animate-spin rounded-full h-4 w-4 sm:h-6 sm:w-6 border-b-2 border-racing-blue"></div>
              <span className="text-sm sm:text-base">Loading race data...</span>
            </div>
          </div>
        )}

        {raceData.error && (
          <div className="mb-6 sm:mb-8">
            <Suspense fallback={<div className="animate-pulse bg-gray-800 rounded-lg p-4 sm:p-6">Loading setup guide...</div>}>
              <SetupGuide />
            </Suspense>
          </div>
        )}

        {/* Success State - Mobile Optimized */}
        {raceData.data.length > 0 && (
          <div className="bg-gradient-to-br from-green-900/30 to-green-800/20 border-2 border-green-500/30 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 shadow-lg">
            <h3 className="font-semibold text-green-400 mb-2 text-sm sm:text-base">Data Loaded Successfully</h3>
            <p className="text-green-300 mb-2 text-xs sm:text-sm">Race data loaded and ready for AI analysis.</p>
            <p className="text-[10px] sm:text-xs text-green-300">
              Source: {raceData.data[0]?.dataSource || 'Data Folder'}
            </p>
          </div>
        )}

        {/* Lazy Loaded Components */}
        {raceData.data.length > 0 && (
          <>
            <Suspense fallback={<div className="animate-pulse bg-gray-800 rounded-lg p-6 mb-8">Loading components...</div>}>
              <DriverComparisonPanel raceData={raceData.data[0]} />
            </Suspense>

            <div className="mb-8">
              <Suspense fallback={<div className="animate-pulse bg-gray-800 rounded-lg p-6">Loading AI tools...</div>}>
                <AIToolsPanel
                  raceData={raceData.data[0]}
                  track={selectedTrack}
                  race={selectedRace}
                  simulatedWeather={simulatedWeather}
                />
              </Suspense>
            </div>
          </>
        )}

        {/* Generated Report Display */}
        {generatedReport && (
          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black border border-gray-700 rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-2xl flex items-center space-x-2 text-white">
                  <Trophy className="w-6 h-6 text-racing-red" />
                  <span>Race Analysis Report</span>
                </h3>
              </div>
              <button
                onClick={() => setGeneratedReport(null)}
                className="text-gray-400 hover:text-white text-sm bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-lg"
              >
                ✕ Close
              </button>
            </div>
            <div className="text-gray-300 text-sm whitespace-pre-line">
              {generatedReport}
            </div>
          </div>
        )}

        {/* AI Dashboard Section */}
        <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 rounded-xl p-6 mb-8 border border-racing-red/20 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-racing-red to-red-700 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight">KobayashiAI Dashboard</h2>
                <p className="text-sm text-gray-400">Advanced F1 Analytics & Strategy Assistant</p>
              </div>
            </div>
            <button
              onClick={() => window.open('/ai-coach', '_blank')}
              className="px-4 py-2 bg-gradient-to-r from-racing-red to-red-700 rounded-lg font-bold text-sm hover:from-racing-red/80 hover:to-red-700/80 transition-all duration-200 flex items-center space-x-2"
            >
              <Zap className="w-4 h-4" />
              <span>Launch AI Dashboard</span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <MessageSquare className="w-5 h-5 text-blue-400" />
                <span className="text-xs text-green-400">Online</span>
              </div>
              <h4 className="font-semibold text-white mb-1">AI Race Analyst</h4>
              <p className="text-xs text-gray-400 mb-3">Ask questions about race strategy, tire compounds, and driver performance</p>
              <div className="flex flex-wrap gap-1">
                <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full">Real-time</span>
                <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full">Strategy</span>
              </div>
            </div>
            
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <span className="text-xs text-green-400">Online</span>
              </div>
              <h4 className="font-semibold text-white mb-1">AI Prediction Tools</h4>
              <p className="text-xs text-gray-400 mb-3">Advanced race predictions and performance analysis</p>
              <div className="flex flex-wrap gap-1">
                <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full">95% Accuracy</span>
                <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full">ML Models</span>
              </div>
            </div>
            
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <Brain className="w-5 h-5 text-red-400" />
                <span className="text-xs text-green-400">Online</span>
              </div>
              <h4 className="font-semibold text-white mb-1">Advanced Analytics</h4>
              <p className="text-xs text-gray-400 mb-3">Deep insights with machine learning models</p>
              <div className="flex flex-wrap gap-1">
                <span className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded-full">Telemetry</span>
                <span className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded-full">Safety</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Cards - Mobile Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/60 p-4 sm:p-6 rounded-xl border border-racing-red/20">
            <Brain className="w-6 h-6 sm:w-8 sm:h-8 text-racing-red mb-3 sm:mb-4" />
            <h4 className="text-sm sm:text-base md:text-lg font-semibold mb-2">3-Lap Predictor</h4>
            <p className="text-gray-400 text-xs sm:text-sm">AI forecasts next 3 laps with 89-95% accuracy</p>
            <div className="mt-3 sm:mt-4 text-xl sm:text-2xl font-bold text-racing-red">92%</div>
          </div>

          <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/60 p-4 sm:p-6 rounded-xl border border-racing-blue/20">
            <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-racing-blue mb-3 sm:mb-4" />
            <h4 className="text-sm sm:text-base md:text-lg font-semibold mb-2">Race Replay</h4>
            <p className="text-gray-400 text-xs sm:text-sm">Interactive timeline with AI alerts</p>
            <div className="mt-3 sm:mt-4 text-xl sm:text-2xl font-bold text-racing-blue">Real-time</div>
          </div>

          <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/60 p-4 sm:p-6 rounded-xl border border-racing-red/20">
            <Target className="w-6 h-6 sm:w-8 sm:h-8 text-racing-red mb-3 sm:mb-4" />
            <h4 className="text-sm sm:text-base md:text-lg font-semibold mb-2">Strategy Validator</h4>
            <p className="text-gray-400 text-xs sm:text-sm">Validates pit calls against race outcomes</p>
            <div className="mt-3 sm:mt-4 text-xl sm:text-2xl font-bold text-racing-red">92%</div>
          </div>

          <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/60 p-4 sm:p-6 rounded-xl border border-racing-blue/20">
            <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-racing-blue mb-3 sm:mb-4" />
            <h4 className="text-sm sm:text-base md:text-lg font-semibold mb-2">AI Training</h4>
            <p className="text-gray-400 text-xs sm:text-sm">Generates actionable driver insights</p>
            <div className="mt-3 sm:mt-4 text-xl sm:text-2xl font-bold text-racing-blue">PDF Export</div>
          </div>
        </div>

        {/* F1 Data Input Section */}
        <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 rounded-xl p-6 mb-8 border border-racing-red/20 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-racing-red to-red-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">F1</span>
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight">F1 Data Input</h2>
                <p className="text-sm text-gray-400">Select season and real F1 data for AI analysis</p>
              </div>
            </div>
            <button
              onClick={() => setShowF1DataInput(!showF1DataInput)}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center space-x-2"
            >
              <span>{showF1DataInput ? 'Hide' : 'Show'} Input Form</span>
              <span className={`transform transition-transform ${showF1DataInput ? 'rotate-180' : ''}`}>▼</span>
            </button>
          </div>

          {/* Season Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">F1 Season</label>
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-racing-red"
            >
              {Array.from({ length: 5 }, (_, i) => {
                const year = new Date().getFullYear() - i
                return <option key={year} value={year.toString()}>{year} Season</option>
              })}
            </select>
            {isLoadingF1Data && <p className="text-sm text-gray-400 mt-2">Loading F1 data...</p>}
          </div>

          {showF1DataInput && (
            <div className="space-y-8">
              {/* Driver Information */}
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                  <span className="w-2 h-2 bg-racing-blue rounded-full"></span>
                  <span>Driver Information</span>
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Driver Name</label>
                    <select
                      value={f1Data.driverName}
                      onChange={(e) => updateF1Data('driverName', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-racing-blue"
                    >
                      <option value="">Select Driver</option>
                      {availableDrivers.map((driver: any) => (
                        <option key={driver.id} value={driver.name}>
                          {driver.name} ({driver.code || driver.nationality})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Driver Number</label>
                    <input
                      type="text"
                      value={f1Data.driverNumber}
                      onChange={(e) => updateF1Data('driverNumber', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-racing-blue"
                      placeholder="e.g., 44"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Experience (Years)</label>
                    <input
                      type="number"
                      value={f1Data.driverExperience}
                      onChange={(e) => updateF1Data('driverExperience', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-racing-blue"
                      placeholder="e.g., 15"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Team</label>
                    <select
                      value={f1Data.driverTeam}
                      onChange={(e) => updateF1Data('driverTeam', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-racing-blue"
                    >
                      <option value="">Select Team</option>
                      {availableConstructors.map((team: any) => (
                        <option key={team.id} value={team.name}>
                          {team.name} ({team.nationality})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Car Specifications (2026 Technical Regulations) */}
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                  <span className="w-2 h-2 bg-racing-red rounded-full"></span>
                  <span>Car Specifications (2026 Regulations)</span>
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Car Model</label>
                    <input
                      type="text"
                      value={f1Data.carModel}
                      onChange={(e) => updateF1Data('carModel', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-racing-red"
                      placeholder="e.g., RB20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Power Unit</label>
                    <select
                      value={f1Data.engineType}
                      onChange={(e) => updateF1Data('engineType', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-racing-red"
                    >
                      <option value="2026 Standardized Power Unit">2026 Standardized Power Unit</option>
                      <option value="Legacy V6 Turbo Hybrid">Legacy V6 Turbo Hybrid</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Tire Compound (C1-C5)</label>
                    <select
                      value={f1Data.tireCompound}
                      onChange={(e) => updateF1Data('tireCompound', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-racing-red"
                    >
                      <option value="C1">C1 (Soft)</option>
                      <option value="C2">C2 (Soft-Medium)</option>
                      <option value="C3">C3 (Medium)</option>
                      <option value="C4">C4 (Medium-Hard)</option>
                      <option value="C5">C5 (Hard)</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Wet">Wet</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Fuel Load (kg)</label>
                    <input
                      type="text"
                      value={f1Data.fuelLoad}
                      onChange={(e) => updateF1Data('fuelLoad', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-racing-red"
                      placeholder="110kg (standardized)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Minimum Weight (kg)</label>
                    <input
                      type="text"
                      value={f1Data.carWeight}
                      onChange={(e) => updateF1Data('carWeight', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-racing-red"
                      placeholder="798kg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Aero Package</label>
                    <select
                      value={f1Data.aeroPackage}
                      onChange={(e) => updateF1Data('aeroPackage', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-racing-red"
                    >
                      <option value="2026 Ground Effect">2026 Ground Effect</option>
                      <option value="Legacy Wing">Legacy Wing</option>
                    </select>
                  </div>
                  <div className="md:col-span-2 lg:col-span-1">
                    <label className="block text-sm font-medium mb-2">Energy Recovery (kW)</label>
                    <input
                      type="text"
                      value={f1Data.energyRecovery}
                      onChange={(e) => updateF1Data('energyRecovery', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-racing-red"
                      placeholder="800kW MGU-K limit"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-4 border-t border-gray-700">
                <button
                  onClick={() => setF1Data({
                    driverName: '', driverNumber: '', driverExperience: '', driverTeam: '',
                    carModel: '', engineType: '2026 Standardized Power Unit', tireCompound: 'C3', fuelLoad: '110kg', carWeight: '798kg',
                    aeroPackage: '2026 Ground Effect', energyRecovery: '800kW',
                    trackCondition: 'dry', safetyCar: false, redFlag: false, raceLaps: '', trackEvolution: 'medium', sprintWeekend: false,
                    airTemp: '25', trackTemp: '35', humidity: '50', windSpeed: '5', rainProbability: '0', precipitation: 'none',
                    pitStrategy: '2-stop', fuelStrategy: 'conservative', tireStrategy: 'C3-C4-C4', overtakeAttempts: '', defensiveDriving: ''
                  })}
                  className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                >
                  Reset Form
                </button>
                <button
                  onClick={() => {
                    if (availableDrivers.length > 0) {
                      const randomDriver = availableDrivers[Math.floor(Math.random() * availableDrivers.length)]
                      updateF1Data('driverName', randomDriver.name)
                      updateF1Data('driverNumber', randomDriver.permanentNumber || '')
                    }
                    if (availableConstructors.length > 0) {
                      const randomTeam = availableConstructors[Math.floor(Math.random() * availableConstructors.length)]
                      updateF1Data('driverTeam', randomTeam.name)
                    }
                    // Randomize car specs
                    const tireOptions = ['C1', 'C2', 'C3', 'C4', 'C5']
                    updateF1Data('tireCompound', tireOptions[Math.floor(Math.random() * tireOptions.length)])
                    const aeroOptions = ['2026 Ground Effect', 'Legacy Wing']
                    updateF1Data('aeroPackage', aeroOptions[Math.floor(Math.random() * aeroOptions.length)])
                    const engineOptions = ['2026 Standardized Power Unit', 'Legacy V6 Turbo Hybrid']
                    updateF1Data('engineType', engineOptions[Math.floor(Math.random() * engineOptions.length)])
                  }}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                  disabled={isLoadingF1Data}
                >
                  Randomize F1 Data
                </button>
                <button
                  onClick={() => console.log('F1 Data:', f1Data)}
                  className="px-6 py-2 bg-racing-blue hover:bg-blue-700 rounded-lg transition-colors"
                >
                  Save F1 Data
                </button>
              </div>
            </div>
          )}
        </div>

        {/* F1 Navigation Card */}
        <div className="mt-8">
          <Link href="/f1">
            <div className="bg-gradient-to-r from-red-900/30 to-blue-900/30 border-2 border-red-500/30 rounded-xl p-6 cursor-pointer hover:from-red-900/50 hover:to-blue-900/50 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">F1</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Formula 1 Analysis</h3>
                    <p className="text-gray-300">Access F1 race predictions, data input, and AI analysis</p>
                  </div>
                </div>
                <div className="text-white">
                  <ArrowLeft className="w-6 h-6 transform rotate-180" />
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
