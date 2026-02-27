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


  // Memoize tracks array to prevent re-creation
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

  // Memoize loadRaceData function to prevent unnecessary re-renders
  const loadRaceData = useCallback(async () => {
    setRaceData({ loading: true, error: null, data: [] })
    setGeneratedReport(null)

    try {
      if (dataSourceMode === 'custom') {
        setRaceData(prev => ({ ...prev, loading: false }))
        return
      }

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
      {/* Header */}
      <header className="bg-black/80 backdrop-blur-md border-b border-racing-red/30 shadow-lg shadow-racing-red/10">
        <div className="container mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Suspense fallback={<div className="w-10 h-10 bg-gray-700 rounded-full animate-pulse" />}>
                  <ToyotaGRLogo className="w-10 h-10 text-racing-red" />
                </Suspense>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-racing-blue rounded-full animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  KobayashiAI
                </h1>
                <p className="text-xs text-racing-red font-semibold tracking-wider">TOYOTA GAZOO RACING</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <select 
                value={selectedTrack}
                onChange={(e) => setSelectedTrack(e.target.value)}
                className="bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-racing-red"
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
                className="bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm"
              >
                <option value="R1">Race 1</option>
                <option value="R2">Race 2</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Control Panel */}
        <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 rounded-xl p-6 mb-8 border border-racing-red/20 shadow-xl backdrop-blur-sm">
          <div className="flex items-center space-x-3 mb-6">
            <Flag className="w-5 h-5 text-racing-red" />
            <h2 className="text-xl font-bold tracking-tight">Race Analysis Controls</h2>
          </div>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => {
                setIsReplaying(true)
                loadRaceData()
                setTimeout(() => setIsReplaying(false), 3000)
              }}
              disabled={isReplaying || dataSourceMode === 'custom'}
              className="bg-gradient-to-r from-racing-red to-red-700 px-6 py-3 rounded-lg font-semibold flex items-center space-x-2"
            >
              {isReplaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              <span>{isReplaying ? 'Analyzing...' : 'Start Race Replay'}</span>
            </button>

            <button
              onClick={() => loadRaceData()}
              disabled={raceData.loading}
              className="border-2 border-racing-blue px-6 py-3 rounded-lg font-semibold flex items-center space-x-2"
            >
              <BarChart3 className="w-5 h-5" />
              <span>{raceData.loading ? 'Loading...' : 'Load Analytics'}</span>
            </button>

            <button
              onClick={exportReport}
              disabled={isGeneratingReport || raceData.data.length === 0}
              className="bg-gradient-to-r from-racing-blue to-blue-700 px-6 py-3 rounded-lg font-semibold flex items-center space-x-2"
            >
              {isGeneratingReport ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <Download className="w-5 h-5" />
              )}
              <span>Generate AI Report</span>
            </button>
          </div>
        </div>

        {/* Data Loading Status */}
        {raceData.loading && (
          <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-6 mb-8">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-racing-blue"></div>
              <span>Loading race data...</span>
            </div>
          </div>
        )}

        {raceData.error && (
          <div className="mb-8">
            <Suspense fallback={<div className="animate-pulse bg-gray-800 rounded-lg p-6">Loading setup guide...</div>}>
              <SetupGuide />
            </Suspense>
          </div>
        )}

        {/* Success State */}
        {raceData.data.length > 0 && (
          <div className="bg-gradient-to-br from-green-900/30 to-green-800/20 border-2 border-green-500/30 rounded-xl p-6 mb-8 shadow-lg">
            <h3 className="font-semibold text-green-400 mb-2">Data Loaded Successfully</h3>
            <p className="text-green-300 mb-2">Race data loaded and ready for AI analysis.</p>
            <p className="text-xs text-green-300">
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

        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/60 p-6 rounded-xl border border-racing-red/20">
            <Brain className="w-8 h-8 text-racing-red mb-4" />
            <h4 className="text-lg font-semibold mb-2">3-Lap Predictor</h4>
            <p className="text-gray-400 text-sm">AI forecasts next 3 laps with 89-95% accuracy</p>
            <div className="mt-4 text-2xl font-bold text-racing-red">92%</div>
          </div>

          <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/60 p-6 rounded-xl border border-racing-blue/20">
            <Clock className="w-8 h-8 text-racing-blue mb-4" />
            <h4 className="text-lg font-semibold mb-2">Race Replay</h4>
            <p className="text-gray-400 text-sm">Interactive timeline with AI alerts</p>
            <div className="mt-4 text-2xl font-bold text-racing-blue">Real-time</div>
          </div>

          <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/60 p-6 rounded-xl border border-racing-red/20">
            <Target className="w-8 h-8 text-racing-red mb-4" />
            <h4 className="text-lg font-semibold mb-2">Strategy Validator</h4>
            <p className="text-gray-400 text-sm">Validates pit calls against race outcomes</p>
            <div className="mt-4 text-2xl font-bold text-racing-red">92%</div>
          </div>

          <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/60 p-6 rounded-xl border border-racing-blue/20">
            <Zap className="w-8 h-8 text-racing-blue mb-4" />
            <h4 className="text-lg font-semibold mb-2">AI Training</h4>
            <p className="text-gray-400 text-sm">Generates actionable driver insights</p>
            <div className="mt-4 text-2xl font-bold text-racing-blue">PDF Export</div>
          </div>
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
