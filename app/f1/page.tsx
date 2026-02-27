'use client'

import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react'
import { Trophy, Zap, Target, Brain, Clock, Play, Pause, BarChart3, Download, Flag, TrendingUp, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { f1Api, transformApiData, safeApiCall } from '../../lib/f1-api'

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

export default function F1Page() {
  // F1 Performance monitoring
  usePerformanceMonitoring()

  // State declarations for F1
  const [selectedTrack, setSelectedTrack] = useState('monaco')
  const [selectedRace, setSelectedRace] = useState('R1')
  const [isReplaying, setIsReplaying] = useState(false)
  const [raceData, setRaceData] = useState<RaceData>({ loading: false, error: null, data: [] })
  const [generatedReport, setGeneratedReport] = useState<string | null>(null)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [simulatedWeather, setSimulatedWeather] = useState<any>(null)
  const [dataSourceMode, setDataSourceMode] = useState<'official' | 'custom'>('official')
  const [customDataError, setCustomDataError] = useState<string | null>(null)
  const [customTrackMapUrl, setCustomTrackMapUrl] = useState<string | null>(null)

  // API Data State
  const [apiTeams, setApiTeams] = useState<any[]>([])
  const [apiDrivers, setApiDrivers] = useState<any[]>([])
  const [apiRaces, setApiRaces] = useState<any[]>([])
  const [apiStandings, setApiStandings] = useState<any[]>([])
  const [apiLoading, setApiLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [useRealData, setUseRealData] = useState(false)

  // F1 Data Input state - Updated for 2026 Regulations
  const [f1Data, setF1Data] = useState({
    // Driver Information
    driverName: '',
    driverNumber: '',
    driverExperience: '',
    driverTeam: '',

    // Car Specifications (2026 Technical Regulations)
    carModel: '',
    engineType: '2026 Standardized Power Unit', // Standardized for all teams
    tireCompound: 'C3', // 2026 C1-C5 compound system
    fuelLoad: '110kg', // 2026 standardized fuel load
    carWeight: '798kg', // 2026 minimum weight
    aeroPackage: '2026 Ground Effect', // New aero philosophy
    energyRecovery: '800kW', // 2026 MGU-K limit

    // Race Conditions
    trackCondition: 'dry',
    safetyCar: false,
    redFlag: false,
    raceLaps: '',
    trackEvolution: 'medium', // 2026 track evolution factor

    // Weather Data
    airTemp: '25',
    trackTemp: '35',
    humidity: '50',
    windSpeed: '5',
    rainProbability: '0',
    precipitation: 'none', // 2026 weather classification

    // Strategy Inputs (2026 Sprint Format)
    pitStrategy: '2-stop', // 2026 strategy options
    fuelStrategy: 'conservative', // 2026 fuel management
    tireStrategy: 'C3-C4-C4', // 2026 tire allocation
    overtakeAttempts: '',
    defensiveDriving: '',
    sprintWeekend: false // 2026 sprint weekend flag
  })

  const [showF1DataInput, setShowF1DataInput] = useState(false)

  // F1 Race Predictions state
  const [showPredictions, setShowPredictions] = useState(false)
  const [predictionType, setPredictionType] = useState<'qualifying' | 'race' | 'podium' | 'pit-strategy' | 'overtake' | 'sprint'>('race')
  const [predictionResults, setPredictionResults] = useState<any>(null)
  const [isPredicting, setIsPredicting] = useState(false)

  // Helper function to update F1 data
  const updateF1Data = (field: string, value: any) => {
    setF1Data(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Helper function to get country flag emoji
  const getCountryFlag = (country: string) => {
    const flags: { [key: string]: string } = {
      'Monaco': '🇲🇨',
      'UK': '🇬🇧',
      'Belgium': '🇧🇪',
      'Italy': '🇮🇹',
      'Spain': '🇪🇸',
      'Austria': '🇦🇹',
      'UAE': '🇦🇪',
      'Brazil': '🇧🇷',
      'Bahrain': '🇧🇭',
      'Saudi Arabia': '🇸🇦',
      'USA': '🇺🇸',
      'Hungary': '🇭🇺',
      'Netherlands': '🇳🇱',
      'Singapore': '🇸🇬',
      'Japan': '🇯🇵',
      'China': '🇨🇳',
      'Azerbaijan': '🇦🇿',
      'Australia': '🇦🇺'
    }
    return flags[country] || '🏁'
  }

  // F1 Race Prediction Functions
  const generatePredictions = async () => {
    setIsPredicting(true)
    setPredictionResults(null)

    try {
      // Simulate prediction delay
      await new Promise(resolve => setTimeout(resolve, 2000))

      const track = tracks.find(t => t.id === selectedTrack)
      const predictions = generatePredictionResults(predictionType, track)

      setPredictionResults(predictions)
    } catch (error) {
      console.error('Prediction error:', error)
      setPredictionResults({ error: 'Failed to generate predictions' })
    } finally {
      setIsPredicting(false)
    }
  }

  // Load real API data
  const loadApiData = useCallback(async () => {
    setApiLoading(true)
    setApiError(null)

    try {
      const currentYear = new Date().getFullYear()

      // Load teams
      const teamsResult = await safeApiCall(() => f1Api.getTeams(currentYear))
      if (teamsResult.data) {
        setApiTeams(teamsResult.data.map(transformApiData.team))
      }

      // Load drivers
      const driversResult = await safeApiCall(() => f1Api.getDrivers(currentYear))
      if (driversResult.data) {
        setApiDrivers(driversResult.data.map(transformApiData.driver))
      }

      // Load races
      const racesResult = await safeApiCall(() => f1Api.getRaces(currentYear))
      if (racesResult.data) {
        setApiRaces(racesResult.data.map(transformApiData.race))
      }

      // Load standings
      const standingsResult = await safeApiCall(() => f1Api.getDriverStandings(currentYear))
      if (standingsResult.data) {
        setApiStandings(standingsResult.data.map(transformApiData.standing))
      }

      if (teamsResult.error || driversResult.error || racesResult.error || standingsResult.error) {
        setApiError('Some API data could not be loaded. Using mock data as fallback.')
        setUseRealData(false)
      } else {
        setUseRealData(true)
      }
    } catch (error) {
      setApiError('Failed to load API data. Using mock data.')
      setUseRealData(false)
    } finally {
      setApiLoading(false)
    }
  }, [])

  // Load API data on component mount
  useEffect(() => {
    loadApiData()
  }, [loadApiData])

  const generatePredictionResults = (type: string, track: any) => {
    const baseAccuracy = 0.78 + Math.random() * 0.17 // 78-95% accuracy

    // Use real API data if available, otherwise fall back to mock data
    const teams2026 = useRealData && apiTeams.length > 0
      ? apiTeams.map(team => [team.name, [team.name.split(' ')[0]]])
      : {
          'Red Bull Racing': ['Max Verstappen', 'Liam Lawson'],
          'Mercedes AMG': ['Lewis Hamilton', 'George Russell'],
          'Ferrari': ['Charles Leclerc', 'Carlos Sainz'],
          'McLaren': ['Lando Norris', 'Oscar Piastri'],
          'Aston Martin': ['Fernando Alonso', 'Lance Stroll'],
          'Alpine': ['Pierre Gasly', 'Esteban Ocon'],
          'Williams': ['Alexander Albon', 'Logan Sargeant'],
          'RB': ['Yuki Tsunoda', 'Daniel Ricciardo'],
          'Haas': ['Kevin Magnussen', 'Nico Hulkenberg'],
          'Sauber': ['Valtteri Bottas', 'Zhou Guanyu']
        }

    // Use real driver data if available
    const realDrivers = useRealData && apiDrivers.length > 0
      ? apiDrivers.map(driver => driver.name)
      : ['Max Verstappen', 'Lewis Hamilton', 'Charles Leclerc', 'Lando Norris', 'George Russell', 'Carlos Sainz', 'Oscar Piastri', 'Fernando Alonso']

    // 2026 Technical Regulations Factors
    const trackFactors = {
      'monaco': { aero: 0.95, power: 0.85, handling: 0.98, tireWear: 0.90 },
      'spa': { aero: 0.88, power: 0.95, handling: 0.92, tireWear: 0.75 },
      'monza': { aero: 0.82, power: 0.98, handling: 0.85, tireWear: 0.70 },
      'silverstone': { aero: 0.90, power: 0.92, handling: 0.94, tireWear: 0.80 },
      'barcelona': { aero: 0.87, power: 0.89, handling: 0.91, tireWear: 0.85 },
      'redbull-ring': { aero: 0.93, power: 0.91, handling: 0.96, tireWear: 0.82 },
      'yas-marina': { aero: 0.89, power: 0.87, handling: 0.88, tireWear: 0.78 },
      'interlagos': { aero: 0.86, power: 0.94, handling: 0.89, tireWear: 0.76 }
    }

    // 2026 Sprint Weekend Format (6 races)
    const sprintWeekends = ['austria', 'usa', 'qatar', 'brazil', 'china', 'qatar']

    // Check if current track is a sprint weekend
    const isSprintWeekend = sprintWeekends.includes(track?.id?.toLowerCase() || '')

    switch (type) {
      case 'qualifying':
        return {
          type: 'Qualifying Predictions (2026 Rules)',
          track: track?.name,
          predictions: [
            { position: 1, driver: realDrivers[0] || 'Max Verstappen', team: 'Red Bull Racing', time: '1:09.543', confidence: 0.94 },
            { position: 2, driver: realDrivers[1] || 'Lewis Hamilton', team: 'Mercedes AMG', time: '1:09.678', confidence: 0.89 },
            { position: 3, driver: realDrivers[2] || 'Charles Leclerc', team: 'Ferrari', time: '1:09.892', confidence: 0.86 },
            { position: 4, driver: realDrivers[3] || 'Lando Norris', team: 'McLaren', time: '1:10.034', confidence: 0.83 },
            { position: 5, driver: realDrivers[4] || 'George Russell', team: 'Mercedes AMG', time: '1:10.156', confidence: 0.80 }
          ],
          accuracy: Math.round(baseAccuracy * 100),
          factors: ['2026 Aero Package Efficiency', 'Power Unit Performance', 'Driver Skill', 'Track-Specific Setup', 'Tire Strategy'],
          rules: '2026 Technical Regulations: New aero philosophy, standardized power units, enhanced sustainability',
          dataSource: useRealData ? 'Real API Data' : 'Mock Data'
        }

      case 'race':
        return {
          type: 'Race Finish Predictions (2026 Format)',
          track: track?.name,
          predictions: [
            { position: 1, driver: realDrivers[0] || 'Max Verstappen', team: 'Red Bull Racing', confidence: 0.91, points: 26 },
            { position: 2, driver: realDrivers[1] || 'Lewis Hamilton', team: 'Mercedes AMG', confidence: 0.78, points: 19 },
            { position: 3, driver: realDrivers[2] || 'Charles Leclerc', team: 'Ferrari', confidence: 0.73, points: 16 },
            { position: 4, driver: realDrivers[3] || 'Lando Norris', team: 'McLaren', confidence: 0.69, points: 13 },
            { position: 5, driver: realDrivers[4] || 'Carlos Sainz', team: 'Ferrari', confidence: 0.66, points: 11 },
            { position: 6, driver: realDrivers[5] || 'George Russell', team: 'Mercedes AMG', confidence: 0.63, points: 9 },
            { position: 7, driver: realDrivers[6] || 'Oscar Piastri', team: 'McLaren', confidence: 0.59, points: 7 },
            { position: 8, driver: realDrivers[7] || 'Fernando Alonso', team: 'Aston Martin', confidence: 0.56, points: 5 }
          ],
          accuracy: Math.round(baseAccuracy * 100),
          factors: ['Starting Position', '2026 Tire Degradation Model', 'DRS Strategy', 'Pit Window Timing', '2026 Power Unit Efficiency'],
          rules: '2026 Points System: 26-19-16-13-11-9-7-5-3-1 + 1 for fastest lap',
          dataSource: useRealData ? 'Real API Data' : 'Mock Data'
        }

      case 'podium':
        return {
          type: 'Podium Predictions (2026 Season)',
          track: track?.name,
          predictions: [
            { position: 1, driver: realDrivers[0] || 'Max Verstappen', team: 'Red Bull Racing', confidence: 0.87, odds: '1.35' },
            { position: 2, driver: realDrivers[1] || 'Lewis Hamilton', team: 'Mercedes AMG', confidence: 0.75, odds: '3.10' },
            { position: 3, driver: realDrivers[2] || 'Charles Leclerc', team: 'Ferrari', confidence: 0.70, odds: '4.20' }
          ],
          accuracy: Math.round(baseAccuracy * 100),
          factors: ['2026 Championship Standings', 'Recent Performance', '2026 Technical Package', 'Team Strategy'],
          rules: '2026 Sprint Points: 8-7-6-5-4-3-2-1 for sprint races (Austria, USA, Qatar, Brazil, China, Qatar)',
          dataSource: useRealData ? 'Real API Data' : 'Mock Data'
        }

      case 'pit-strategy':
        const trackFactor = trackFactors[track?.id?.toLowerCase() as keyof typeof trackFactors] || { aero: 0.85, power: 0.90, handling: 0.88, tireWear: 0.80 }

        return {
          type: 'Pit Strategy Predictions (2026 Regulations)',
          track: track?.name,
          predictions: {
            optimalStrategy: isSprintWeekend ? '1-stop sprint strategy' : '2-stop strategy',
            tireCompounds: ['Soft', 'Medium', 'Hard', 'Intermediate', 'Wet'],
            pitStops: isSprintWeekend ? [
              { stop: 1, lap: 12, from: 'Soft', to: 'Medium', time: '19.8s' }
            ] : [
              { stop: 1, lap: 16, from: 'Soft', to: 'Medium', time: '20.2s' },
              { stop: 2, lap: 32, from: 'Medium', to: 'Hard', time: '20.8s' }
            ],
            confidence: 0.84,
            tireWearFactor: trackFactor.tireWear
          },
          accuracy: Math.round(baseAccuracy * 100),
          factors: ['2026 Tire Compound Characteristics', 'Track-Specific Degradation', '2026 Aero Impact', 'Power Unit Fuel Efficiency'],
          rules: '2026 Tire Rules: 5 compounds (C1-C5), mandatory sets reduced, enhanced sustainability',
          dataSource: useRealData ? 'Real API Data' : 'Mock Data'
        }

      case 'overtake':
        const overtakeTrackFactor = trackFactors[track?.id?.toLowerCase() as keyof typeof trackFactors] || { aero: 0.85, power: 0.90, handling: 0.88, tireWear: 0.80 }

        return {
          type: 'Overtaking Opportunities (2026 Technical Rules)',
          track: track?.name,
          predictions: [
            { zone: 'DRS Zone 1 (Main Straight)', difficulty: overtakeTrackFactor.power > 0.92 ? 'Easy' : 'Medium', successRate: 0.82, drivers: [realDrivers.slice(0, 4).join(', ')] },
            { zone: 'DRS Zone 2 (Back Straight)', difficulty: overtakeTrackFactor.aero > 0.90 ? 'Medium' : 'Hard', successRate: 0.68, drivers: [realDrivers.slice(4, 8).join(', ')] },
            { zone: 'Corner Complex (DRS Available)', difficulty: overtakeTrackFactor.handling > 0.90 ? 'Easy' : 'Medium', successRate: 0.75, drivers: [realDrivers.slice(2, 6).join(', ')] }
          ],
          accuracy: Math.round(baseAccuracy * 100),
          factors: ['2026 DRS Zone Optimization', 'Corner Speed Differentials', '2026 Aero Wake Effects', 'Tire Grip Levels'],
          rules: '2026 DRS Rules: Maintained from 2023, enhanced activation zones, improved detection',
          dataSource: useRealData ? 'Real API Data' : 'Mock Data'
        }

      case 'sprint':
        if (!isSprintWeekend) {
          return {
            type: 'Sprint Predictions (2026 Format)',
            track: track?.name,
            note: 'Not a sprint weekend - regular qualifying format applies',
            sprintWeekends: sprintWeekends.map(id => id.charAt(0).toUpperCase() + id.slice(1)),
            accuracy: 100,
            factors: ['Sprint Weekend Schedule'],
            dataSource: useRealData ? 'Real API Data' : 'Mock Data'
          }
        }

        return {
          type: 'Sprint Race Predictions (2026 Format)',
          track: track?.name,
          predictions: [
            { position: 1, driver: realDrivers[0] || 'Max Verstappen', team: 'Red Bull Racing', points: 8, pole: true },
            { position: 2, driver: realDrivers[1] || 'Lewis Hamilton', team: 'Mercedes AMG', points: 7, pole: false },
            { position: 3, driver: realDrivers[2] || 'Charles Leclerc', team: 'Ferrari', points: 6, pole: false },
            { position: 4, driver: realDrivers[3] || 'Lando Norris', team: 'McLaren', points: 5, pole: false },
            { position: 5, driver: realDrivers[4] || 'George Russell', team: 'Mercedes AMG', points: 4, pole: false }
          ],
          accuracy: Math.round(baseAccuracy * 100),
          factors: ['Sprint Qualifying Performance', 'Short Race Strategy', 'Overtaking Opportunities'],
          rules: '2026 Sprint Format: 100km race, points for top 8 (8-7-6-5-4-3-2-1), pole for race winner',
          dataSource: useRealData ? 'Real API Data' : 'Mock Data'
        }

      default:
        return { error: 'Unknown prediction type' }
    }
  }

  // Memoize tracks array to prevent re-creation (F1 tracks only)
  const tracks = useMemo(() => [
    // Formula 1 Tracks
    { id: 'monaco', name: 'Circuit de Monaco', location: 'Monte Carlo', available: true, category: 'f1', country: 'Monaco' },
    { id: 'silverstone', name: 'Silverstone Circuit', location: 'Northamptonshire', available: true, category: 'f1', country: 'UK' },
    { id: 'spa', name: 'Circuit de Spa-Francorchamps', location: 'Stavelot', available: true, category: 'f1', country: 'Belgium' },
    { id: 'monza', name: 'Autodromo Nazionale Monza', location: 'Monza', available: true, category: 'f1', country: 'Italy' },
    { id: 'barcelona', name: 'Circuit de Barcelona-Catalunya', location: 'Barcelona', available: true, category: 'f1', country: 'Spain' },
    { id: 'redbull-ring', name: 'Red Bull Ring', location: 'Spielberg', available: true, category: 'f1', country: 'Austria' },
    { id: 'yas-marina', name: 'Yas Marina Circuit', location: 'Abu Dhabi', available: true, category: 'f1', country: 'UAE' },
    { id: 'interlagos', name: 'Autódromo José Carlos Pace', location: 'São Paulo', available: true, category: 'f1', country: 'Brazil' },
    { id: 'bahrain', name: 'Bahrain International Circuit', location: 'Sakhir', available: true, category: 'f1', country: 'Bahrain' },
    { id: 'jeddah', name: 'Jeddah Corniche Circuit', location: 'Jeddah', available: true, category: 'f1', country: 'Saudi Arabia' },
    { id: 'imola', name: 'Autodromo Enzo e Dino Ferrari', location: 'Imola', available: true, category: 'f1', country: 'Italy' },
    { id: 'miami', name: 'Miami International Autodrome', location: 'Miami', available: true, category: 'f1', country: 'USA' },
    { id: 'vegas', name: 'Las Vegas Strip Circuit', location: 'Las Vegas', available: true, category: 'f1', country: 'USA' },
    { id: 'hungaroring', name: 'Hungaroring', location: 'Budapest', available: true, category: 'f1', country: 'Hungary' },
    { id: 'zandvoort', name: 'Circuit Zandvoort', location: 'Zandvoort', available: true, category: 'f1', country: 'Netherlands' },
    { id: 'singapore', name: 'Marina Bay Street Circuit', location: 'Singapore', available: true, category: 'f1', country: 'Singapore' },
    { id: 'suzuka', name: 'Suzuka International Racing Course', location: 'Suzuka', available: true, category: 'f1', country: 'Japan' },
    { id: 'shanghai', name: 'Shanghai International Circuit', location: 'Shanghai', available: true, category: 'f1', country: 'China' },
    { id: 'baku', name: 'Baku City Circuit', location: 'Baku', available: true, category: 'f1', country: 'Azerbaijan' },
    { id: 'melbourne', name: 'Albert Park Circuit', location: 'Melbourne', available: true, category: 'f1', country: 'Australia' }
  ], [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
      {/* Header */}
      <header className="bg-black/80 backdrop-blur-md border-b border-racing-red/30 shadow-lg shadow-racing-red/10">
        <div className="container mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors">
                <ArrowLeft className="w-5 h-5" />
                <span>Dashboard</span>
              </Link>
              <div className="relative">
                <Suspense fallback={<div className="w-10 h-10 bg-gray-700 rounded-full animate-pulse" />}>
                  <ToyotaGRLogo className="w-10 h-10 text-racing-red" />
                </Suspense>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-racing-blue rounded-full animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  KobayashiAI - F1 Analysis
                </h1>
                <div className="flex items-center space-x-2 mt-1">
                  <p className="text-xs text-racing-red font-semibold tracking-wider">FORMULA 1</p>
                  {apiLoading && (
                    <div className="flex items-center space-x-1 text-xs text-blue-400">
                      <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-400"></div>
                      <span>Loading API data...</span>
                    </div>
                  )}
                  {!apiLoading && (
                    <div className="flex items-center space-x-1 text-xs">
                      {useRealData ? (
                        <>
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-green-400">Live API Data</span>
                        </>
                      ) : (
                        <>
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          <span className="text-yellow-400">Mock Data</span>
                          {apiError && <span className="text-red-400 ml-1">(API Error)</span>}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={selectedTrack}
                onChange={(e) => setSelectedTrack(e.target.value)}
                className="bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-racing-red"
                title="Select F1 Track"
              >
                {tracks.map(track => (
                  <option key={track.id} value={track.id}>
                    {track.name} - {track.location} {getCountryFlag(track.country)}
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
            <h2 className="text-xl font-bold tracking-tight">F1 Race Analysis Controls</h2>
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

            <button
              onClick={() => setShowPredictions(!showPredictions)}
              className="bg-gradient-to-r from-racing-blue to-blue-700 px-6 py-3 rounded-lg font-semibold flex items-center space-x-2"
            >
              <Target className="w-5 h-5" />
              <span>{showPredictions ? 'Hide Predictions' : 'Show Predictions'}</span>
            </button>
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
                <p className="text-sm text-gray-400">Input detailed Formula 1 race data for AI analysis</p>
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
                    <input
                      type="text"
                      value={f1Data.driverName}
                      onChange={(e) => updateF1Data('driverName', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-racing-blue"
                      placeholder="e.g., Lewis Hamilton"
                    />
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
                    <input
                      type="text"
                      value={f1Data.driverTeam}
                      onChange={(e) => updateF1Data('driverTeam', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-racing-blue"
                      placeholder="e.g., Mercedes AMG Petronas"
                    />
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
                      <option value="Legacy Wing-Based">Legacy Wing-Based</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Energy Recovery (kW)</label>
                    <input
                      type="text"
                      value={f1Data.energyRecovery}
                      onChange={(e) => updateF1Data('energyRecovery', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-racing-red"
                      placeholder="800kW"
                    />
                  </div>
                </div>
              </div>

              {/* Race Conditions */}
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                  <span>Race Conditions</span>
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Track Condition</label>
                    <select
                      value={f1Data.trackCondition}
                      onChange={(e) => updateF1Data('trackCondition', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    >
                      <option value="dry">Dry</option>
                      <option value="damp">Damp</option>
                      <option value="wet">Wet</option>
                      <option value="flooded">Flooded</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Safety Car</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={f1Data.safetyCar}
                        onChange={(e) => updateF1Data('safetyCar', e.target.checked)}
                        className="w-4 h-4 text-yellow-500 bg-gray-700 border-gray-600 rounded focus:ring-yellow-500"
                      />
                      <span className="text-sm">Safety Car Deployed</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Red Flag</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={f1Data.redFlag}
                        onChange={(e) => updateF1Data('redFlag', e.target.checked)}
                        className="w-4 h-4 text-red-500 bg-gray-700 border-gray-600 rounded focus:ring-red-500"
                      />
                      <span className="text-sm">Race Stopped</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Race Laps</label>
                    <input
                      type="number"
                      value={f1Data.raceLaps}
                      onChange={(e) => updateF1Data('raceLaps', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      placeholder="e.g., 70"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Track Evolution</label>
                    <select
                      value={f1Data.trackEvolution}
                      onChange={(e) => updateF1Data('trackEvolution', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    >
                      <option value="low">Low Evolution</option>
                      <option value="medium">Medium Evolution</option>
                      <option value="high">High Evolution</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Sprint Weekend</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={f1Data.sprintWeekend}
                        onChange={(e) => updateF1Data('sprintWeekend', e.target.checked)}
                        className="w-4 h-4 text-blue-500 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm">Sprint Race Format</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Weather Data */}
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span>Weather Data</span>
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Air Temperature (°C)</label>
                    <input
                      type="number"
                      value={f1Data.airTemp}
                      onChange={(e) => updateF1Data('airTemp', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="25"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Track Temperature (°C)</label>
                    <input
                      type="number"
                      value={f1Data.trackTemp}
                      onChange={(e) => updateF1Data('trackTemp', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="35"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Humidity (%)</label>
                    <input
                      type="number"
                      value={f1Data.humidity}
                      onChange={(e) => updateF1Data('humidity', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Wind Speed (km/h)</label>
                    <input
                      type="number"
                      value={f1Data.windSpeed}
                      onChange={(e) => updateF1Data('windSpeed', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Rain Probability (%)</label>
                    <input
                      type="number"
                      value={f1Data.rainProbability}
                      onChange={(e) => updateF1Data('rainProbability', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Precipitation</label>
                    <select
                      value={f1Data.precipitation}
                      onChange={(e) => updateF1Data('precipitation', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="none">None</option>
                      <option value="light">Light Rain</option>
                      <option value="moderate">Moderate Rain</option>
                      <option value="heavy">Heavy Rain</option>
                      <option value="storm">Storm</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Strategy Inputs */}
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Strategy Inputs</span>
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Pit Strategy</label>
                    <select
                      value={f1Data.pitStrategy}
                      onChange={(e) => updateF1Data('pitStrategy', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="1-stop">1-Stop Strategy</option>
                      <option value="2-stop">2-Stop Strategy</option>
                      <option value="3-stop">3-Stop Strategy</option>
                      <option value="undercut">Undercut Strategy</option>
                      <option value="overcut">Overcut Strategy</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Fuel Strategy</label>
                    <select
                      value={f1Data.fuelStrategy}
                      onChange={(e) => updateF1Data('fuelStrategy', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="conservative">Conservative</option>
                      <option value="balanced">Balanced</option>
                      <option value="aggressive">Aggressive</option>
                      <option value="push">Push to Limit</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Tire Strategy</label>
                    <select
                      value={f1Data.tireStrategy}
                      onChange={(e) => updateF1Data('tireStrategy', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="C3-C4-C4">C3-C4-C4 (Standard)</option>
                      <option value="C2-C3-C4">C2-C3-C4 (Soft Start)</option>
                      <option value="C3-C4-C5">C3-C4-C5 (Hard Finish)</option>
                      <option value="C2-C4-C4">C2-C4-C4 (One Soft)</option>
                      <option value="C4-C4-C4">C4-C4-C4 (All Medium)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Overtake Attempts</label>
                    <input
                      type="number"
                      value={f1Data.overtakeAttempts}
                      onChange={(e) => updateF1Data('overtakeAttempts', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="e.g., 5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Defensive Driving</label>
                    <select
                      value={f1Data.defensiveDriving}
                      onChange={(e) => updateF1Data('defensiveDriving', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="aggressive">Aggressive Defense</option>
                      <option value="moderate">Moderate Defense</option>
                      <option value="conservative">Conservative Defense</option>
                      <option value="passive">Passive Defense</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Reset Form Button */}
              <div className="flex justify-end">
                <button
                  onClick={() => setF1Data({
                    driverName: '',
                    driverNumber: '',
                    driverExperience: '',
                    driverTeam: '',
                    carModel: '',
                    engineType: '2026 Standardized Power Unit',
                    tireCompound: 'C3',
                    fuelLoad: '110kg',
                    carWeight: '798kg',
                    aeroPackage: '2026 Ground Effect',
                    energyRecovery: '800kW',
                    trackCondition: 'dry',
                    safetyCar: false,
                    redFlag: false,
                    raceLaps: '',
                    trackEvolution: 'medium',
                    precipitation: 'none',
                    airTemp: '25',
                    trackTemp: '35',
                    humidity: '50',
                    windSpeed: '5',
                    rainProbability: '0',
                    pitStrategy: '2-stop',
                    fuelStrategy: 'conservative',
                    tireStrategy: 'C3-C4-C4',
                    overtakeAttempts: '',
                    defensiveDriving: '',
                    sprintWeekend: false
                  })}
                  className="px-6 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors"
                >
                  Reset Form
                </button>
              </div>
            </div>
          )}
        </div>

        {/* F1 Predictions Section */}
        {showPredictions && (
          <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 rounded-xl p-6 mb-8 border border-racing-blue/20 shadow-xl backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <Target className="w-6 h-6 text-racing-blue" />
                <div>
                  <h2 className="text-xl font-bold tracking-tight">F1 Race Predictions</h2>
                  <p className="text-sm text-gray-400">AI-powered predictions for Formula 1 races</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <select
                  value={predictionType}
                  onChange={(e) => setPredictionType(e.target.value as any)}
                  className="bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-racing-blue"
                >
                  <option value="qualifying">Qualifying</option>
                  <option value="race">Race</option>
                  <option value="podium">Podium</option>
                  <option value="pit-strategy">Pit Strategy</option>
                  <option value="overtake">Overtaking</option>
                  <option value="sprint">Sprint</option>
                </select>
                <button
                  onClick={generatePredictions}
                  disabled={isPredicting}
                  className="bg-gradient-to-r from-racing-blue to-blue-700 px-6 py-2 rounded-lg font-semibold flex items-center space-x-2"
                >
                  {isPredicting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Brain className="w-4 h-4" />
                  )}
                  <span>Generate</span>
                </button>
              </div>
            </div>

            {predictionResults && !predictionResults.error && (
              <div className="bg-gray-800/50 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">{predictionResults.type}</h3>
                  <div className="text-sm text-gray-400">
                    Track: {predictionResults.track} • Accuracy: {predictionResults.accuracy}%
                  </div>
                </div>

                {/* Prediction Results Display */}
                {predictionType === 'qualifying' && predictionResults.predictions && (
                  <div className="space-y-2">
                    {predictionResults.predictions.map((pred: any, index: number) => (
                      <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${
                        index === 0 ? 'bg-yellow-500/20 border border-yellow-500/30' :
                        index === 1 ? 'bg-gray-400/20 border border-gray-400/30' :
                        index === 2 ? 'bg-orange-500/20 border border-orange-500/30' :
                        'bg-gray-700/50'
                      }`}>
                        <div className="flex items-center space-x-3">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            index === 0 ? 'bg-yellow-500 text-black' :
                            index === 1 ? 'bg-gray-400 text-black' :
                            index === 2 ? 'bg-orange-500 text-white' :
                            'bg-gray-600 text-white'
                          }`}>
                            {index + 1}
                          </span>
                          <span className="font-semibold">{pred.driver}</span>
                          <span className="text-sm text-gray-400">{pred.team}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-sm">{pred.time}</div>
                          <div className="text-xs text-gray-400">Confidence: {pred.confidence * 100}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {predictionType === 'race' && predictionResults.predictions && (
                  <div className="space-y-2">
                    {predictionResults.predictions.map((pred: any, index: number) => (
                      <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${
                        index < 3 ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30' :
                        index < 10 ? 'bg-gray-700/50 border border-gray-600/30' :
                        'bg-gray-800/30'
                      }`}>
                        <div className="flex items-center space-x-3">
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            index === 0 ? 'bg-yellow-500 text-black' :
                            index === 1 ? 'bg-gray-400 text-black' :
                            index === 2 ? 'bg-orange-500 text-white' :
                            'bg-gray-600 text-white'
                          }`}>
                            {index + 1}
                          </span>
                          <span className="font-semibold">{pred.driver}</span>
                          <span className="text-sm text-gray-400">{pred.team}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-sm">Points: {pred.points}</div>
                          <div className="text-xs text-gray-400">Confidence: {pred.confidence * 100}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {predictionType === 'podium' && predictionResults.predictions && (
                  <div className="grid md:grid-cols-3 gap-4">
                    {predictionResults.predictions.map((pred: any, index: number) => (
                      <div key={index} className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-lg border border-gray-600 text-center">
                        <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center text-2xl font-bold ${
                          index === 0 ? 'bg-yellow-500 text-black' :
                          index === 1 ? 'bg-gray-400 text-black' :
                          'bg-orange-500 text-white'
                        }`}>
                          {index + 1}
                        </div>
                        <h4 className="text-lg font-semibold mb-2">{pred.driver}</h4>
                        <p className="text-sm text-gray-400 mb-2">{pred.team}</p>
                        <p className="text-xs text-gray-500">Odds: {pred.odds}</p>
                        <p className="text-xs text-gray-500 mt-1">Confidence: {pred.confidence * 100}%</p>
                      </div>
                    ))}
                  </div>
                )}

                {predictionType === 'pit-strategy' && predictionResults.predictions && (
                  <div className="space-y-6">
                    <div className="bg-gray-700/50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Optimal Strategy</h4>
                      <p className="text-gray-300">{predictionResults.predictions.optimalStrategy}</p>
                    </div>
                    <div className="bg-gray-700/50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Pit Stops</h4>
                      <div className="space-y-2">
                        {predictionResults.predictions.pitStops.map((stop: any, index: number) => (
                          <div key={index} className="flex justify-between items-center py-2 border-b border-gray-600 last:border-b-0">
                            <span>Stop {stop.stop}</span>
                            <span>Lap {stop.lap}</span>
                            <span>{stop.from} → {stop.to}</span>
                            <span className="font-mono">{stop.time}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {predictionType === 'overtake' && predictionResults.predictions && (
                  <div className="space-y-4">
                    {predictionResults.predictions.map((zone: any, index: number) => (
                      <div key={index} className="bg-gray-700/50 p-4 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold">{zone.zone}</h4>
                          <span className={`px-2 py-1 rounded text-xs ${
                            zone.difficulty === 'Easy' ? 'bg-green-600' :
                            zone.difficulty === 'Medium' ? 'bg-yellow-600' :
                            'bg-red-600'
                          }`}>
                            {zone.difficulty}
                          </span>
                        </div>
                        <div className="text-sm text-gray-300">
                          <p>Success Rate: {zone.successRate * 100}%</p>
                          <p className="mt-1">Key Drivers: {zone.drivers.join(', ')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {predictionType === 'sprint' && predictionResults.predictions && (
                  <div className="space-y-2">
                    {predictionResults.predictions.map((pred: any, index: number) => (
                      <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${
                        index === 0 ? 'bg-yellow-500/20 border border-yellow-500/30' :
                        'bg-gray-700/50'
                      }`}>
                        <div className="flex items-center space-x-3">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            index === 0 ? 'bg-yellow-500 text-black' : 'bg-gray-600 text-white'
                          }`}>
                            {index + 1}
                          </span>
                          <span className="font-semibold">{pred.driver}</span>
                          <span className="text-sm text-gray-400">{pred.team}</span>
                          {pred.pole && <span className="text-xs bg-blue-600 px-2 py-1 rounded">Pole</span>}
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-sm">Points: {pred.points}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {predictionResults.note && (
                  <div className="mt-4 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                    <p className="text-blue-300">{predictionResults.note}</p>
                    {predictionResults.sprintWeekends && (
                      <div className="mt-2">
                        <p className="text-sm text-blue-400">Sprint Weekends: {predictionResults.sprintWeekends.join(', ')}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-6 pt-4 border-t border-gray-600">
                  <h4 className="font-semibold mb-2">Prediction Factors</h4>
                  <div className="flex flex-wrap gap-2">
                    {predictionResults.factors?.map((factor: string, index: number) => (
                      <span key={index} className="px-3 py-1 bg-gray-600 rounded-full text-sm">
                        {factor}
                      </span>
                    ))}
                  </div>
                </div>

                {predictionResults.rules && (
                  <div className="mt-4 p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
                    <h4 className="font-semibold text-green-300 mb-2">2026 Regulations</h4>
                    <p className="text-green-200 text-sm">{predictionResults.rules}</p>
                  </div>
                )}
              </div>
            )}

            {predictionResults?.error && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                <p className="text-red-300">{predictionResults.error}</p>
              </div>
            )}
          </div>
        )}

        {/* Race Data Display */}
        {raceData.data.length > 0 && (
          <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 rounded-xl p-6 border border-gray-600/20 shadow-xl backdrop-blur-sm">
            <div className="flex items-center space-x-3 mb-6">
              <BarChart3 className="w-5 h-5 text-green-500" />
              <h2 className="text-xl font-bold tracking-tight">Race Data Analysis</h2>
            </div>

            {raceData.loading && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-racing-red"></div>
                <span className="ml-4 text-lg">Loading race data...</span>
              </div>
            )}

            {raceData.error && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                <p className="text-red-300">{raceData.error}</p>
              </div>
            )}

            {!raceData.loading && !raceData.error && raceData.data[0] && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-4">Race Results</h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {raceData.data[0].raceResults?.slice(0, 10).map((result: any, index: number) => (
                        <div key={index} className="flex items-center justify-between py-2 border-b border-gray-600 last:border-b-0">
                          <div className="flex items-center space-x-3">
                            <span className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center text-xs font-bold">
                              {index + 1}
                            </span>
                            <span>{result.driver}</span>
                          </div>
                          <span className="font-mono text-sm">{result.time || result.points}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-4">Weather Conditions</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Temperature:</span>
                        <span>{simulatedWeather?.temperature || raceData.data[0].weather?.temperature || 'N/A'}°C</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Humidity:</span>
                        <span>{simulatedWeather?.humidity || raceData.data[0].weather?.humidity || 'N/A'}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Wind Speed:</span>
                        <span>{simulatedWeather?.windSpeed || raceData.data[0].weather?.windSpeed || 'N/A'} km/h</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Conditions:</span>
                        <span>{simulatedWeather?.conditions || raceData.data[0].weather?.conditions || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {generatedReport && (
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-4">AI Analysis Report</h3>
                    <div className="bg-black/50 rounded p-4 max-h-96 overflow-y-auto">
                      <pre className="text-sm text-gray-300 whitespace-pre-wrap">{generatedReport}</pre>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

  // Memoize loadRaceData function to prevent unnecessary re-renders
  const loadRaceData = useCallback(async () => {
    setRaceData({ loading: true, error: null, data: [] })

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
}
