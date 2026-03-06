'use client'

import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense, Fragment } from 'react'
import { Trophy, Zap, Target, Brain, Clock, Play, Pause, BarChart3, Download, Flag, TrendingUp, ArrowLeft, Calendar, LayoutDashboard, Settings, Info, Cloud, Thermometer, Wind, Droplets, History, Database } from 'lucide-react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'

import Link from 'next/link'
import { openf1Api, transformOpenF1Data } from '../../lib/openf1-api'


// Lazy load heavy components for F1 optimization
const TrackMapViewer = lazy(() => import('../components/TrackMapViewer'))
const WeatherControls = lazy(() => import('../components/WeatherControls'))
const F1AIChat = lazy(() => import('../components/F1AIChat'))
const DecisionPanel = lazy(() => import('../components/DecisionPanel'))


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

  // Top-level Navigation Tabs
  const [activeTab, setActiveTab] = useState<'upcoming' | 'builder' | 'analytics' | 'ai' | 'practice'>('upcoming')


  // Mock upcoming races 2026
  const upcomingRacesList = useMemo(() => [
    { id: 'melbourne', name: 'Australian GP', date: 'March 6-8, 2026', track: 'Albert Park Circuit', country: 'Australia', leader: 'Max Verstappen', format: 'Standard' },
    { id: 'shanghai', name: 'Chinese GP', date: 'March 15, 2026', track: 'Shanghai International Circuit', country: 'China', leader: 'Lando Norris', format: 'Standard' },
    { id: 'suzuka', name: 'Japanese GP', date: 'March 29, 2026', track: 'Suzuka International Racing Course', country: 'Japan', leader: 'Charles Leclerc', format: 'Sprint' },
  ], [])

  // API Data State
  const [apiTeams, setApiTeams] = useState<any[]>([])
  const [apiDrivers, setApiDrivers] = useState<any[]>([])
  const [apiSessions, setApiSessions] = useState<any[]>([])
  const [apiRaces, setApiRaces] = useState<any[]>([])
  const [apiStandings, setApiStandings] = useState<any[]>([])
  const [nextEvent, setNextEvent] = useState<any>(null)
  const [apiLoading, setApiLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [useRealData, setUseRealData] = useState(false)

  // Practice/Testing State
  const [practiceSessions, setPracticeSessions] = useState<any[]>([])
  const [selectedPracticeSession, setSelectedPracticeSession] = useState<number | null>(null)
  const [practiceData, setPracticeData] = useState<any[]>([])
  const [practiceLoading, setPracticeLoading] = useState(false)

  // New Historical Data States
  const [historicalData, setHistoricalData] = useState<any[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  // UseEffect to fetch historical data
  useEffect(() => {
    const fetchHistory = async () => {
      if (!selectedTrack) return;
      setHistoryLoading(true);
      try {
        const track = upcomingRacesList.find(t => t.id === selectedTrack)?.name || selectedTrack;
        const res = await fetch(`/api/f1/history?track=${encodeURIComponent(track)}`);
        const data = await res.json();
        if (data.success) {
          setHistoricalData(data.history);
        }
      } catch (err) {
        console.error("History fetch error:", err);
      } finally {
        setHistoryLoading(false);
      }
    };
    fetchHistory();
  }, [selectedTrack, upcomingRacesList]);

  // UseEffect to filter practice sessions
  useEffect(() => {
    if (apiSessions.length > 0) {
      const ptSessions = apiSessions.filter(s => s.session_type.includes('Practice') || s.session_type.includes('Testing')).sort((a, b) => new Date(b.date_start).getTime() - new Date(a.date_start).getTime());
      setPracticeSessions(ptSessions);
      if (ptSessions.length > 0 && !selectedPracticeSession) {
        setSelectedPracticeSession(ptSessions[0].session_key);
      }
    }
  }, [apiSessions]);

  // UseEffect to fetch laps
  useEffect(() => {
    const fetchPracticeLaps = async () => {
      if (!selectedPracticeSession) return;
      setPracticeLoading(true);
      try {
        const laps = await openf1Api.getLaps(selectedPracticeSession);
        // Group by driver and find fastest lap
        const driverLaps = new Map();
        laps.forEach(lap => {
          if (lap.lap_duration && (!driverLaps.has(lap.driver_number) || lap.lap_duration < driverLaps.get(lap.driver_number).lap_duration)) {
            driverLaps.set(lap.driver_number, lap);
          }
        });

        const sortedData = Array.from(driverLaps.values())
          .sort((a, b) => a.lap_duration - b.lap_duration)
          .map((lap, idx, arr) => {
            const bestTime = arr[0].lap_duration;
            const driver = apiDrivers.find(d => Number(d.id) === lap.driver_number) || { name: `Driver ${lap.driver_number}`, team: 'Unknown' };
            return {
              position: idx + 1,
              driver: driver.name,
              team: driver.team,
              driverNumber: lap.driver_number,
              time: lap.lap_duration,
              timeStr: `${Math.floor(lap.lap_duration / 60)}:${(lap.lap_duration % 60).toFixed(3).padStart(6, '0')}`,
              gapToFirst: idx === 0 ? '-' : `+${(lap.lap_duration - bestTime).toFixed(3)}s`,
              speedSt: lap.st_speed ? `${lap.st_speed} km/h` : 'N/A'
            };
          });

        setPracticeData(sortedData);
      } catch (e) {
        console.error("Failed to load practice laps", e);
      } finally {
        setPracticeLoading(false);
      }
    };
    fetchPracticeLaps();
  }, [selectedPracticeSession, apiDrivers]);

  // Derived race list from API or Mock
  const raceList = useMemo(() => {
    if (useRealData && apiRaces.length > 0) {
      return apiRaces.map(r => ({
        id: r.id,
        name: r.name,
        date: new Date(r.date).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' }),
        track: r.circuit,
        country: r.country,
        leader: 'TBD',
        format: r.type === 'Sprint' ? 'Sprint' : 'Standard'
      }))
    }
    return upcomingRacesList
  }, [apiRaces, useRealData, upcomingRacesList])

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

  // Countdown Timer Logic
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 })
  const [isLive, setIsLive] = useState(false)
  const [isSessionDay, setIsSessionDay] = useState(false)

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date()

      // Use nextEvent from API if available, else fallback to hardcoded Practice 1 fallback for Melbourne
      const targetDateStr = nextEvent ? nextEvent.date_start : '2026-03-06T00:00:00'
      const endDateStr = nextEvent ? nextEvent.date_end : '2026-03-08T17:00:00'

      const targetDate = new Date(targetDateStr).getTime()
      const endDate = new Date(endDateStr).getTime()
      const nowTime = now.getTime()

      // Check if session is LIVE
      if (nowTime >= targetDate && nowTime <= endDate) {
        setIsLive(true)
        setIsSessionDay(true)
        setTimeLeft({ days: 0, hours: 0, mins: 0, secs: 0 })
        return
      }

      setIsLive(false)

      // Check if it's Session Day (but not yet started)
      const isSameDay = now.toDateString() === new Date(targetDate).toDateString()
      setIsSessionDay(isSameDay)

      const difference = targetDate - nowTime

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          mins: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          secs: Math.floor((difference % (1000 * 60)) / 1000)
        })
      } else {
        setTimeLeft({ days: 0, hours: 0, mins: 0, secs: 0 })
      }
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [nextEvent])

  const formatTime = (time: number) => time.toString().padStart(2, '0')

  // Helper function to update F1 data
  const updateF1Data = (field: string, value: any) => {
    setF1Data(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Helper function to fill F1 form with random data
  const fillRandomF1Data = () => {
    const drivers = [
      { name: 'Max Verstappen', number: '1', team: 'Red Bull Racing', exp: '10' },
      { name: 'Charles Leclerc', number: '16', team: 'Ferrari', exp: '7' },
      { name: 'Lando Norris', number: '4', team: 'McLaren', exp: '6' },
      { name: 'Lewis Hamilton', number: '44', team: 'Ferrari', exp: '18' },
      { name: 'George Russell', number: '63', team: 'Mercedes AMG', exp: '6' },
      { name: 'Oscar Piastri', number: '81', team: 'McLaren', exp: '2' },
      { name: 'Carlos Sainz', number: '55', team: 'Williams', exp: '10' },
      { name: 'Fernando Alonso', number: '14', team: 'Aston Martin', exp: '23' },
    ];
    const tireCompounds = ['C1', 'C2', 'C3', 'C4', 'C5', 'Intermediate', 'Wet'];
    const trackConds = ['dry', 'wet', 'damp'];

    const randomDriver = drivers[Math.floor(Math.random() * drivers.length)];

    setF1Data({
      driverName: randomDriver.name,
      driverNumber: randomDriver.number,
      driverExperience: randomDriver.exp,
      driverTeam: randomDriver.team,
      carModel: `2026 Spec ${randomDriver.team.split(' ')[0]}`,
      engineType: '2026 Standardized Power Unit',
      tireCompound: tireCompounds[Math.floor(Math.random() * tireCompounds.length)],
      fuelLoad: `${Math.floor(Math.random() * 20) + 90}kg`,
      carWeight: '798kg',
      aeroPackage: '2026 Ground Effect',
      energyRecovery: '800kW',
      trackCondition: trackConds[Math.floor(Math.random() * trackConds.length)],
      safetyCar: Math.random() > 0.8,
      redFlag: Math.random() > 0.9,
      raceLaps: `${Math.floor(Math.random() * 20) + 50}`,
      trackEvolution: 'medium',
      airTemp: `${Math.floor(Math.random() * 20) + 15}`,
      trackTemp: `${Math.floor(Math.random() * 30) + 20}`,
      humidity: `${Math.floor(Math.random() * 50) + 30}`,
      windSpeed: `${Math.floor(Math.random() * 15)}`,
      rainProbability: `${Math.floor(Math.random() * 100)}`,
      precipitation: Math.random() > 0.8 ? 'light rain' : 'none',
      pitStrategy: Math.random() > 0.5 ? '1-stop' : '2-stop',
      fuelStrategy: Math.random() > 0.5 ? 'conservative' : 'aggressive',
      tireStrategy: 'C3-C4-C4',
      overtakeAttempts: `${Math.floor(Math.random() * 10) + 1}`,
      defensiveDriving: 'high',
      sprintWeekend: Math.random() > 0.7
    });

    // Auto-show form if it's currently hidden when they generate data
    if (!showF1DataInput) setShowF1DataInput(true);
  }

  const loadMelbourneUndercutScenario = () => {
    setSelectedTrack('melbourne');
    setF1Data({
      driverName: 'Max Verstappen',
      driverNumber: '1',
      driverExperience: '10',
      driverTeam: 'Red Bull Racing',
      carModel: '2026 Spec RB22',
      engineType: '2026 Standardized Power Unit',
      tireCompound: 'C3',
      fuelLoad: '105kg',
      carWeight: '798kg',
      aeroPackage: '2026 Ground Effect',
      energyRecovery: '800kW',
      trackCondition: 'dry',
      safetyCar: false,
      redFlag: false,
      raceLaps: '58',
      trackEvolution: 'high',
      precipitation: 'none',
      airTemp: '22',
      trackTemp: '34',
      humidity: '45',
      windSpeed: '8',
      rainProbability: '0',
      pitStrategy: 'undercut',
      fuelStrategy: 'balanced',
      tireStrategy: 'C2-C3-C4',
      overtakeAttempts: '3',
      defensiveDriving: 'moderate',
      sprintWeekend: false
    });
    setPredictionType('pit-strategy');
    if (!showF1DataInput) setShowF1DataInput(true);
    setActiveTab('builder');
  };

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
      'Australia': '🇦🇺',
      'Canada': '🇨🇦',
      'Mexico': '🇲🇽',
      'Qatar': '🇶🇦'
    }
    return flags[country] || '🏁'
  }

  // F1 Race Prediction Functions
  const generatePredictions = async () => {
    setIsPredicting(true)
    setPredictionResults(null)

    try {
      const track = tracks.find(t => t.id === selectedTrack)

      const response = await fetch('/api/f1/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: predictionType,
          track: track,
          f1Data: f1Data,
          context: {
            standings: apiStandings,
            drivers: apiDrivers,
            teams: apiTeams,
            featuredScenario: f1Data.pitStrategy === 'undercut' && selectedTrack === 'melbourne' ? 'melbourne_undercut' : null
          }
        })
      })

      const result = await response.json()

      if (result.success) {
        setPredictionResults(result)
      } else {
        throw new Error(result.message || 'Simulation failed')
      }
    } catch (error: any) {
      console.error('Prediction error:', error)
      setPredictionResults({ error: error.message || 'Failed to generate predictions' })
    } finally {
      setIsPredicting(false)
    }
  }

  // Load real API data from OpenF1 with caching and retries
  const loadApiData = useCallback(async (retryCount = 0) => {
    setApiLoading(true)
    setApiError(null)

    // Try to load from cache first for immediate UI responsiveness
    if (retryCount === 0) {
      const cached = localStorage.getItem('kobayashi_f1_api_cache');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Date.now() - parsed.timestamp < 1000 * 60 * 15) { // 15 min cache
            setApiDrivers(parsed.drivers);
            setApiTeams(parsed.teams);
            setApiStandings(parsed.standings);
            setApiSessions(parsed.sessions);
            setApiRaces(parsed.races);
            setNextEvent(parsed.nextEvent);
            setUseRealData(true);
            setApiLoading(false);
            return;
          }
        } catch (e) {
          localStorage.removeItem('kobayashi_f1_api_cache');
        }
      }
    }

    try {
      // 1. Get latest session to find the active context
      const sessions = await openf1Api.getLatestSession()
      if (!sessions || sessions.length === 0) throw new Error('No active sessions')

      const latestSession = sessions[0]
      const sessionKey = latestSession.session_key

      // 2. Get drivers for this session
      const driversData = await openf1Api.getDrivers(sessionKey)
      const mappedDrivers = driversData.map(transformOpenF1Data.driver)
      setApiDrivers(mappedDrivers)

      // Extract teams from drivers
      const teamsMap = new Map()
      driversData.forEach(d => {
        if (!teamsMap.has(d.team_name)) {
          teamsMap.set(d.team_name, { id: d.team_name, name: d.team_name, color: d.team_colour })
        }
      })
      const mappedTeams = Array.from(teamsMap.values())
      setApiTeams(mappedTeams)

      // 3. Get standings (if available for this session)
      let mappedStandings = []
      try {
        const standingsData = await openf1Api.getDriverStandings(sessionKey)
        if (standingsData && standingsData.length > 0) {
          mappedStandings = standingsData.map(s => transformOpenF1Data.standing(s, driversData))
          setApiStandings(mappedStandings)
        }
      } catch (standingErr) {
        mappedStandings = driversData.map((d, i) => ({
          position: i + 1,
          driver: transformOpenF1Data.driver(d),
          team: { name: d.team_name },
          points: 0
        }))
        setApiStandings(mappedStandings)
      }

      // 4. Get and deduplicate season sessions
      const year = new Date().getFullYear()
      const allSessions = await openf1Api.getSessions(year)
      setApiSessions(allSessions)

      const racesMap = new Map()
      allSessions.forEach(s => {
        if (s.session_type === 'Race') {
          const key = s.circuit_short_name.toLowerCase()
          if (!racesMap.has(key) || new Date(s.date_start) > new Date(racesMap.get(key).date)) {
            racesMap.set(key, transformOpenF1Data.session(s))
          }
        }
      })
      const mappedRaces = Array.from(racesMap.values())
      setApiRaces(mappedRaces)
      setNextEvent(latestSession)

      // Update Cache
      localStorage.setItem('kobayashi_f1_api_cache', JSON.stringify({
        timestamp: Date.now(),
        drivers: mappedDrivers,
        teams: mappedTeams,
        standings: mappedStandings,
        sessions: allSessions,
        races: mappedRaces,
        nextEvent: latestSession
      }))

      setUseRealData(true)
    } catch (error: any) {
      if (retryCount < 2) {
        setTimeout(() => loadApiData(retryCount + 1), 2000)
        return
      }
      setApiError(error.message || 'Connection lost to OpenF1 Feed')
      setUseRealData(false)
    } finally {
      setApiLoading(false)
    }
  }, []);

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

      case 'pit-strategy': {
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
      }

      case 'overtake': {
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

  // Memoize loadRaceData function to prevent unnecessary re-renders
  const loadRaceData = useCallback(async () => {
    setRaceData({ loading: true, error: null, data: [] })

    try {
      if (dataSourceMode === 'custom') {
        setRaceData(prev => ({ ...prev, loading: false }))
        return
      }

      // Instead of failing over to GR Cup API which returns null for F1 tracks,
      // We will generate intelligent mock telemetry/race data based on the Ergast standings and F1 Data Form parameters.
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate analysis delay

      const realDrivers = useRealData && apiDrivers.length > 0
        ? apiDrivers.map(driver => driver.name)
        : ['Max Verstappen', 'Lewis Hamilton', 'Charles Leclerc', 'Lando Norris', 'George Russell', 'Carlos Sainz', 'Oscar Piastri', 'Fernando Alonso'];

      const mockRaceResults = realDrivers.map((driver, index) => ({
        driver: driver,
        time: index === 0 ? '1:24:32.450' : `+${(Math.random() * 5 + index * 2).toFixed(3)}s`,
        points: [25, 18, 15, 12, 10, 8, 6, 4, 2, 1][index] || 0
      }));

      // Generate a realistic weather mock based on form inputs if available
      const generatedWeather = {
        temperature: f1Data.airTemp || '25',
        humidity: f1Data.humidity || '50',
        windSpeed: f1Data.windSpeed || '5',
        conditions: f1Data.trackCondition === 'dry' ? 'Sunny' : f1Data.trackCondition === 'wet' ? 'Rain' : 'Cloudy'
      };

      const mockLapTimes = Array.from({ length: 50 }).map((_, i) => ({
        lap: i + 1,
        time: (70 + Math.random() * 3).toFixed(3), // 1:10.xxx approx
        driver: realDrivers[0]
      }));

      setRaceData({
        loading: false,
        error: null,
        data: [{
          track: selectedTrack,
          race: selectedRace,
          raceResults: mockRaceResults,
          lapTimes: mockLapTimes,
          weather: generatedWeather,
          telemetry: { available: true, type: 'simulated' },
          dataSource: 'AI Simulated F1 Session'
        }]
      })
    } catch (error: any) {
      setRaceData({
        loading: false,
        error: `Failed to load race data: ${error.message}`,
        data: []
      })
    }
  }, [selectedTrack, selectedRace, dataSourceMode, useRealData, apiDrivers, f1Data])

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
          race: selectedRace,
          series: 'Formula 1'
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'AI analysis failed')
      }

      const report = 'KobayashiAI Race Analysis Report\n' +
        'Track: ' + (tracks.find(t => t.id === selectedTrack)?.name || selectedTrack) + '\n' +
        'Race: ' + selectedRace + '\n' +
        'Generated: ' + new Date().toLocaleString() + '\n\n' +
        (result.analysis || 'Analysis complete.')

      setGeneratedReport(report)

      const blob = new Blob([report], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `KobayashiAI_${selectedTrack}_${selectedRace}_report.txt`
      a.click()
      URL.revokeObjectURL(url)

    } catch (error: any) {
      const report = 'KobayashiAI Race Analysis Report\n' +
        'Track: ' + (tracks.find(t => t.id === selectedTrack)?.name || selectedTrack) + '\n' +
        'Race: ' + selectedRace + '\n' +
        'Generated: ' + new Date().toLocaleString() + '\n\n' +
        '⚠️ AI Analysis Unavailable\n' +
        (error.message || 'Could not connect to AI service')

      setGeneratedReport(report)
    } finally {
      setIsGeneratingReport(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
      {/* Header */}
      <header className="bg-black/80 backdrop-blur-md border-b border-racing-red/30 shadow-lg shadow-racing-red/10 sticky top-0 z-50">
        <div className="container mx-auto px-4 md:px-6 py-4 md:py-5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-4 w-full md:w-auto">
              <Link href="/" className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors">
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
              <div>
                <h1 className="text-lg md:text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  KobayashiAI - F1
                </h1>
                <div className="flex items-center space-x-2 mt-0.5">
                  <p className="text-[10px] text-racing-red font-black tracking-widest uppercase">FORMULA 1</p>
                  {apiLoading ? (
                    <div className="flex items-center space-x-1 text-[10px] text-blue-400">
                      <div className="animate-spin rounded-full h-2 w-2 border-b border-blue-400"></div>
                      <span>Syncing...</span>
                    </div>
                  ) : useRealData ? (
                    <div className="flex items-center space-x-1 text-[10px] text-green-400 font-bold uppercase tracking-tighter">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                      <span>Live</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1 text-[10px] text-yellow-500 font-bold uppercase tracking-tighter">
                      <span>Offline</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3 w-full md:w-auto">
              <select
                value={selectedTrack}
                onChange={(e) => setSelectedTrack(e.target.value)}
                className="bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-racing-red w-full md:w-auto"
                title="Select F1 Track"
              >
                {tracks.map(track => (
                  <option key={track.id} value={track.id}>
                    {track.name} {getCountryFlag(track.country)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Main App Navigation Tabs - Scrollable on mobile */}
          <div className="flex space-x-6 mt-4 md:mt-6 overflow-x-auto whitespace-nowrap scrollbar-hide pb-1">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`pb-3 flex items-center space-x-2 font-bold text-xs md:text-sm transition-colors relative ${activeTab === 'upcoming' ? 'text-racing-red' : 'text-gray-400 hover:text-white'}`}
            >
              <Calendar className="w-4 h-4" />
              <span>Calendar</span>
              {activeTab === 'upcoming' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-racing-red rounded-full" />}
            </button>
            <button
              onClick={() => setActiveTab('builder')}
              className={`pb-3 flex items-center space-x-2 font-bold text-xs md:text-sm transition-colors relative ${activeTab === 'builder' ? 'text-racing-red' : 'text-gray-400 hover:text-white'}`}
            >
              <Target className="w-4 h-4" />
              <span>Strategy</span>
              {activeTab === 'builder' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-racing-red rounded-full" />}
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`pb-3 flex items-center space-x-2 font-bold text-xs md:text-sm transition-colors relative ${activeTab === 'analytics' ? 'text-racing-red' : 'text-gray-400 hover:text-white'}`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Analytics</span>
              {activeTab === 'analytics' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-racing-red rounded-full" />}
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`pb-3 flex items-center space-x-2 font-bold text-xs md:text-sm transition-colors relative ${activeTab === 'ai' ? 'text-racing-red' : 'text-gray-400 hover:text-white'}`}
            >
              <Brain className="w-4 h-4" />
              <span>AI Oracle</span>
              {activeTab === 'ai' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-racing-red rounded-full" />}
            </button>
            <button
              onClick={() => setActiveTab('practice')}
              className={`pb-3 flex items-center space-x-2 font-bold text-xs md:text-sm transition-colors relative ${activeTab === 'practice' ? 'text-racing-red' : 'text-gray-400 hover:text-white'}`}
            >
              <Clock className="w-4 h-4" />
              <span>P&T Data</span>
              {activeTab === 'practice' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-racing-red rounded-full" />}
            </button>
          </div>
        </div>
      </header>

      {/* Network Error Toast / Banner */}
      {apiError && (
        <div className="bg-red-500/10 border-b border-red-500/20 text-red-400 py-3 px-6 flex justify-between items-center text-sm font-semibold z-50">
          <div className="flex items-center space-x-3 container mx-auto">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            <span>Connection Warning: {apiError}. The app has fallen back to offline mock mode for uninterrupted use.</span>
            <button onClick={() => loadApiData()} className="ml-4 px-3 py-1 bg-red-500/20 hover:bg-red-500/40 rounded text-xs transition">Retry Connection</button>
          </div>
        </div>
      )}

      <div className="container mx-auto px-6 py-8">
        {/* UPCOMING RACES DASHBOARD */}
        {activeTab === 'upcoming' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* Hero Section - Responsive */}
            <div className="relative bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-6 md:p-8 border border-gray-700/50 overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-64 md:w-96 h-64 md:h-96 bg-racing-red/10 rounded-full blur-3xl -mr-12 md:-mr-20 -mt-12 md:-mt-20"></div>
              <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-8">
                <div className="text-center lg:text-left">
                  <div className={`inline-block px-3 py-1 ${isLive ? 'bg-green-500/20 border-green-500/30 text-green-400 animate-pulse' : 'bg-racing-red/20 border-racing-red/30 text-racing-red'} border font-black text-[10px] md:text-xs rounded-full uppercase tracking-widest mb-4`}>
                    {isLive ? 'LIVE NOW' : isSessionDay ? 'SESSION DAY' : 'Next Event'}
                  </div>
                  <h2 className="text-3xl md:text-5xl font-black mb-3 tracking-tight leading-tight">
                    {nextEvent ? `${nextEvent.session_name}` : upcomingRacesList[0].name}
                  </h2>
                  <p className="text-lg md:text-xl text-gray-400 mb-6 flex items-center justify-center lg:justify-start">
                    <Flag className="w-5 h-5 mr-2 text-gray-500" />
                    <span className="truncate">{nextEvent ? `${nextEvent.circuit_short_name}` : `${upcomingRacesList[0].track}`}</span>
                  </p>

                  {!isLive ? (
                    <div className="flex justify-center lg:justify-start space-x-4 md:space-x-6 mb-2">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-500 uppercase font-black">Days</span>
                        <span className="text-2xl md:text-3xl font-mono font-bold leading-none">{formatTime(timeLeft.days)}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-500 uppercase font-black">Hrs</span>
                        <span className="text-2xl md:text-3xl font-mono font-bold leading-none">{formatTime(timeLeft.hours)}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-500 uppercase font-black">Min</span>
                        <span className="text-2xl md:text-3xl font-mono font-bold leading-none">{formatTime(timeLeft.mins)}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-racing-red uppercase font-black">Sec</span>
                        <span className="text-2xl md:text-3xl font-mono font-bold text-racing-red leading-none">{formatTime(timeLeft.secs)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-center gap-4 bg-green-500/10 border border-green-500/30 p-4 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                            <Play className="w-5 h-5 text-black fill-current" />
                          </div>
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-gray-900 rounded-full"></div>
                        </div>
                        <div>
                          <span className="text-green-400 font-bold text-lg block leading-tight">LIVE</span>
                          <span className="text-gray-400 text-[10px] uppercase font-bold tracking-tighter">Real-time Feed Active</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveTab('analytics')}
                        className="w-full sm:w-auto px-4 py-2 bg-green-500 hover:bg-green-600 text-black font-black rounded-lg transition-colors text-xs uppercase tracking-wider"
                      >
                        Launch Live View
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-gray-700/50 p-2 mb-6 bg-black/50 flex items-center justify-center overflow-hidden shadow-inner">
                    {nextEvent ? (
                      <span className="text-5xl md:text-6xl">{getCountryFlag(nextEvent.country_name)}</span>
                    ) : (
                      <span className="text-5xl md:text-6xl">🇦🇺</span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setSelectedTrack(nextEvent ? nextEvent.circuit_short_name.toLowerCase() : 'melbourne');
                      setActiveTab('ai');
                    }}
                    className="w-full sm:w-auto bg-gradient-to-r from-racing-red to-red-700 hover:from-red-600 hover:to-red-500 px-8 py-4 rounded-xl font-black text-sm md:text-base uppercase tracking-widest shadow-xl shadow-racing-red/20 transform transition hover:scale-105 active:scale-95 flex items-center justify-center space-x-3"
                  >
                    <Target className="w-5 h-5 md:w-6 md:h-6" />
                    <span>Generate Forecast</span>
                  </button>
                </div>
              </div>
            </div>

            {/* AI Top Picks - Monsterbet Style - Responsive Grid */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-500 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  <span>AI Edge Forecasts</span>
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                  {
                    label: "Race Winner",
                    driver: useRealData && apiDrivers.length > 0 ? apiDrivers[0].name : "Max Verstappen",
                    prob: "74%",
                    edge: "+5.2%",
                    color: "border-yellow-500/30",
                    trend: "up"
                  },
                  {
                    label: "Podium Lock",
                    driver: useRealData && apiDrivers.length > 0 ? (apiDrivers[2] ? apiDrivers[2].name : "Charles Leclerc") : "Charles Leclerc",
                    prob: "62%",
                    edge: "+3.1%",
                    color: "border-racing-red/30",
                    trend: "up"
                  },
                  {
                    label: "Top 10 Sleeper",
                    driver: useRealData && apiDrivers.length > 0 ? (apiDrivers.find(d => d.name.toLowerCase().includes('hulk'))?.name || apiDrivers[9]?.name || "Nico Hülkenberg") : "Nico Hülkenberg",
                    prob: "48%",
                    edge: "+12.4%",
                    color: "border-green-500/30",
                    trend: "up"
                  },
                  {
                    label: "Fastest Lap",
                    driver: useRealData && apiDrivers.length > 0 ? (apiDrivers[1] ? apiDrivers[1].name : "Lando Norris") : "Lando Norris",
                    prob: "35%",
                    edge: "-1.2%",
                    color: "border-racing-blue/30",
                    trend: "down"
                  }
                ].map((pick, i) => (
                  <div key={i} className={`bg-gray-900 border ${pick.color} rounded-2xl p-5 hover:border-racing-red/50 transition-all cursor-pointer group shadow-xl relative overflow-hidden`} onClick={() => setActiveTab('ai')}>
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-30 transition-opacity">
                      <Target className="w-12 h-12" />
                    </div>
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{pick.label}</span>
                      <div className="relative group/tooltip">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${pick.edge.startsWith('+') ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                          {pick.edge} ALPHA
                        </span>
                      </div>
                    </div>
                    <h4 className="font-bold text-white text-lg group-hover:text-racing-red transition-colors mb-4">{pick.driver}</h4>
                    <div className="flex items-center justify-between">
                      <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden mr-3">
                        <div className="h-full bg-gradient-to-r from-racing-red/50 via-racing-red to-racing-blue shadow-[0_0_10px_rgba(211,47,47,0.5)]" style={{ width: pick.prob }} />
                      </div>
                      <span className="text-xs font-mono font-black text-white">{pick.prob}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Races Grid */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-racing-red" />
                  <span>2026 Season Calendar</span>
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {(apiSessions.length > 0 ? raceList : upcomingRacesList.slice(1)).map((race, i) => {
                  const isCurrentNext = nextEvent && race.name === nextEvent.session_name;
                  return (
                    <div
                      key={race.id || i}
                      className={`bg-gray-800/80 rounded-xl p-5 border ${isCurrentNext ? 'border-racing-red shadow-lg shadow-racing-red/10' : 'border-gray-700'} hover:border-racing-red/50 transition-all group cursor-pointer relative overflow-hidden`}
                      onClick={() => {
                        setSelectedTrack(race.id || 'melbourne');
                        setActiveTab('ai');
                      }}
                    >
                      {isCurrentNext && (
                        <div className="absolute top-0 right-0 bg-racing-red text-white text-[10px] font-black px-3 py-1 rounded-bl-lg uppercase tracking-tighter">
                          Next
                        </div>
                      )}
                      <div className="flex justify-between items-start mb-4">
                        <div className="max-w-[80%]">
                          <p className="text-[10px] font-black text-racing-red mb-1 uppercase tracking-widest">{race.date}</p>
                          <h4 className="font-bold text-base md:text-lg group-hover:text-racing-red transition-colors leading-tight mb-1">{race.name}</h4>
                          <p className="text-xs text-gray-400 truncate font-semibold uppercase tracking-tighter">{race.track}</p>
                        </div>
                        <span className="text-2xl opacity-80 group-hover:opacity-100 transition-opacity">{getCountryFlag(race.country)}</span>
                      </div>
                      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-700/50">
                        <div className="text-[10px] font-bold uppercase tracking-widest">
                          <span className="text-gray-500 mr-1">{apiSessions.length > 0 ? 'Loc:' : 'Predict:'}</span>
                          <span className="text-gray-200">{apiSessions.length > 0 ? race.country : race.leader.split(' ').pop()}</span>
                        </div>
                        <div className={`text-[10px] px-2 py-0.5 ${race.format === 'Sprint' ? 'bg-orange-500/20 text-orange-400' : 'bg-gray-700/50 text-gray-400'} rounded font-black uppercase tracking-tighter`}>
                          {race.format}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* DATA ANALYTICS DASHBOARD */}
        {activeTab === 'analytics' && (
          <div className="animate-in fade-in duration-500">
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
          </div>
        )}

        {/* PREDICTION BUILDER */}
        {activeTab === 'builder' && (
          <div className="animate-in fade-in duration-500">
            {/* F1 Data Input Section */}
            <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 rounded-xl p-6 mb-8 border border-racing-red/20 shadow-xl backdrop-blur-sm">
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-racing-red to-red-700 rounded-xl flex items-center justify-center shadow-lg shadow-racing-red/20 flex-shrink-0">
                    <span className="text-white font-black text-sm">F1</span>
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-black tracking-tight">Strategy Forge</h2>
                    <p className="text-sm text-gray-400 mt-1 max-w-2xl leading-relaxed hidden sm:block">
                      Simulate 2026 outcomes by modifying variables via our live LLM/PyTorch inference engine.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={loadMelbourneUndercutScenario}
                    className="flex-1 sm:flex-none px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 rounded-lg transition-all flex items-center justify-center space-x-2 font-bold shadow-lg shadow-blue-900/20 text-xs uppercase tracking-wider"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Melbourne</span>
                  </button>
                  <button
                    onClick={fillRandomF1Data}
                    className="flex-1 sm:flex-none px-4 py-2.5 bg-gradient-to-r from-racing-red to-red-700 hover:from-red-600 hover:to-red-500 rounded-lg transition-all flex items-center justify-center space-x-2 font-bold shadow-lg shadow-red-900/20 text-xs uppercase tracking-wider"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Random</span>
                  </button>
                  <button
                    onClick={() => setShowF1DataInput(!showF1DataInput)}
                    className="flex-1 sm:flex-none px-4 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-all flex items-center justify-center space-x-2 font-bold text-xs uppercase tracking-wider"
                  >
                    <span>{showF1DataInput ? 'Hide' : 'Show'} Form</span>
                    <span className={`transform transition-transform duration-200 ${showF1DataInput ? 'rotate-180' : ''}`}>▼</span>
                  </button>
                </div>
              </div>

              {showF1DataInput && (
                <div className="space-y-8 animate-in slide-in-from-top-4 duration-300">
                  {/* Driver Information */}
                  <div className="bg-gray-800/30 rounded-2xl p-6 border border-gray-700/50">
                    <h3 className="text-base font-black mb-6 flex items-center space-x-3 uppercase tracking-widest text-gray-400">
                      <span className="w-6 h-0.5 bg-racing-blue rounded-full"></span>
                      <span>Driver Profile</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Driver Name</label>
                        <input
                          type="text"
                          value={f1Data.driverName}
                          onChange={(e) => updateF1Data('driverName', e.target.value)}
                          className="w-full px-4 py-2.5 bg-black/40 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-racing-blue transition-all text-sm font-semibold"
                          placeholder="e.g., Lewis Hamilton"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Driver #</label>
                        <input
                          type="text"
                          value={f1Data.driverNumber}
                          onChange={(e) => updateF1Data('driverNumber', e.target.value)}
                          className="w-full px-4 py-2.5 bg-black/40 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-racing-blue transition-all text-sm font-semibold"
                          placeholder="e.g., 44"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Exp (Years)</label>
                        <input
                          type="number"
                          value={f1Data.driverExperience}
                          onChange={(e) => updateF1Data('driverExperience', e.target.value)}
                          className="w-full px-4 py-2.5 bg-black/40 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-racing-blue transition-all text-sm font-semibold"
                          placeholder="e.g., 15"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Constructor</label>
                        <input
                          type="text"
                          value={f1Data.driverTeam}
                          onChange={(e) => updateF1Data('driverTeam', e.target.value)}
                          className="w-full px-4 py-2.5 bg-black/40 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-racing-blue transition-all text-sm font-semibold"
                          placeholder="e.g., Mercedes AMG"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Car Specifications (2026 Technical Regulations) */}
                  <div className="bg-gray-800/30 rounded-2xl p-6 border border-gray-700/50">
                    <h3 className="text-base font-black mb-6 flex items-center space-x-3 uppercase tracking-widest text-gray-400">
                      <span className="w-6 h-0.5 bg-racing-red rounded-full"></span>
                      <span>2026 Spec Technicals</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Chassis ID</label>
                        <input
                          type="text"
                          value={f1Data.carModel}
                          onChange={(e) => updateF1Data('carModel', e.target.value)}
                          className="w-full px-4 py-2.5 bg-black/40 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-racing-red transition-all text-sm font-semibold"
                          placeholder="e.g., W15"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Power Unit</label>
                        <select
                          value={f1Data.engineType}
                          onChange={(e) => updateF1Data('engineType', e.target.value)}
                          className="w-full px-4 py-2.5 bg-black/40 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-racing-red transition-all text-sm font-semibold appearance-none"
                        >
                          <option value="2026 Standardized Power Unit">2026 Std. PU</option>
                          <option value="Legacy V6 Turbo Hybrid">Legacy Hybrid</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Compound</label>
                        <select
                          value={f1Data.tireCompound}
                          onChange={(e) => updateF1Data('tireCompound', e.target.value)}
                          className="w-full px-4 py-2.5 bg-black/40 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-racing-red transition-all text-sm font-semibold appearance-none"
                        >
                          <option value="C1">C1 (Hard)</option>
                          <option value="C2">C2</option>
                          <option value="C3">C3 (Med)</option>
                          <option value="C4">C4</option>
                          <option value="C5">C5 (Soft)</option>
                          <option value="Intermediate">Inter</option>
                          <option value="Wet">Wet</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Fuel (kg)</label>
                        <input
                          type="text"
                          value={f1Data.fuelLoad}
                          onChange={(e) => updateF1Data('fuelLoad', e.target.value)}
                          className="w-full px-4 py-2.5 bg-black/40 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-racing-red transition-all text-sm font-semibold"
                          placeholder="110kg"
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

            {/* Prediction Execution Section - Monsterbet Style */}
            <div className="grid lg:grid-cols-3 gap-8 mb-12">
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-gray-900 border border-racing-red/20 rounded-2xl p-6 shadow-2xl">
                  <h3 className="text-lg font-bold mb-4 flex items-center space-x-2">
                    <Zap className="w-5 h-5 text-racing-red" />
                    <span>Quick Selectors</span>
                  </h3>
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {['Qualifying', 'Race', 'Podium', 'Pit Strategy', 'Overtakes', 'Sprint'].map((type) => (
                      <button
                        key={type}
                        onClick={() => setPredictionType(type.toLowerCase() as any)}
                        className={`py-3 px-2 rounded-xl text-xs font-bold transition-all border ${predictionType === type.toLowerCase()
                          ? 'bg-racing-red border-racing-red text-white shadow-lg shadow-racing-red/20'
                          : 'bg-white/5 border-gray-700 text-gray-400 hover:border-gray-500'
                          }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={generatePredictions}
                    disabled={isPredicting}
                    className="w-full bg-gradient-to-r from-racing-red to-red-600 hover:from-red-600 hover:to-red-500 py-4 rounded-xl font-black text-lg shadow-xl shadow-racing-red/30 transform transition active:scale-95 flex items-center justify-center space-x-3 mb-4"
                  >
                    {isPredicting ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <Brain className="w-6 h-6" />
                        <span>RUN ALPHA SIMULATION</span>
                      </>
                    )}
                  </button>
                  <p className="text-[10px] text-center text-gray-500 uppercase tracking-widest font-bold">
                    Powered by Kobayashi Llama 3.3
                  </p>
                </div>

                {/* Accuracy Card */}
                <div className="bg-gradient-to-br from-indigo-900/20 to-racing-blue/10 border border-racing-blue/20 rounded-2xl p-6">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] font-black text-racing-blue uppercase tracking-widest">Model Confidence</span>
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  </div>
                  <div className="text-4xl font-mono font-black text-white mb-2">92.4%</div>
                  <p className="text-xs text-gray-400 leading-relaxed">Based on 2026 ground-effect simulation parameters and OpenF1 telemetry profiles.</p>
                </div>

                {/* Alpha Methodology Breakdown */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center">
                    <Info className="w-3 h-3 mr-2" />
                    Alpha Methodology
                  </h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-[10px] font-bold">
                      <span className="text-gray-400">Historical Weight</span>
                      <span className="text-white">70%</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold">
                      <span className="text-gray-400">Live Telemetry Mix</span>
                      <span className="text-white">20%</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold">
                      <span className="text-gray-400">Heuristic Offset</span>
                      <span className="text-white">10%</span>
                    </div>
                    <p className="text-[9px] text-gray-500 italic mt-2">
                      Alpha represents our model's historical replay delta compared to real outcomes.
                    </p>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2">
                {predictionResults ? (
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl animate-in slide-in-from-right duration-500">
                    <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-4 border-b border-gray-800 flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="font-bold text-sm uppercase tracking-widest">Live Prediction Result</span>
                      </div>
                      <span className="text-xs font-mono text-gray-500">ID: ALPHA-{Math.random().toString(36).substr(2, 6).toUpperCase()}</span>
                    </div>

                    <div className="p-8">
                      {predictionResults.error ? (
                        <div className="text-center py-12">
                          <Brain className="w-16 h-16 text-gray-700 mx-auto mb-4 opacity-50" />
                          <p className="text-red-400 font-bold">{predictionResults.error}</p>
                        </div>
                      ) : (
                        <div className="space-y-8">
                          <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                              <div>
                                <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Win/Loss Probabilities</h4>
                                <div className="space-y-4">
                                  {predictionResults.outcomes?.slice(0, 3).map((out: any, i: number) => (
                                    <div key={i} className="space-y-2">
                                      <div className="flex justify-between text-sm">
                                        <span className="font-bold">{out.label}</span>
                                        <span className="font-mono text-racing-red">{out.probability}</span>
                                      </div>
                                      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-racing-red" style={{ width: out.probability }} />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>

                            <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
                              <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Alpha Reasoning</h4>
                              <p className="text-sm text-gray-300 leading-relaxed italic">
                                "{predictionResults.analysis || "The 2026 regulations favor high-downforce setups at this sector. Expect significant tire degradation on the leading edge."}"
                              </p>
                              <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <div className="w-6 h-6 bg-racing-blue rounded-full flex items-center justify-center">
                                    <span className="text-[10px] font-bold">K</span>
                                  </div>
                                  <span className="text-xs font-bold">Kobayashi Intelligence</span>
                                </div>
                                <button className="text-[10px] font-black text-racing-red uppercase hover:underline">View Deep Trace</button>
                              </div>
                            </div>
                          </div>

                          {/* NEW: Step-by-step factor breakdown */}
                          {predictionResults.factors && predictionResults.factors.length > 0 && (
                            <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700 mt-6">
                              <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center">
                                <Target className="w-4 h-4 mr-2 text-racing-blue" />
                                Simulation Variable Weights
                              </h4>
                              <p className="text-xs text-gray-500 mb-4">Step-by-step breakdown of how outcomes were derived based on your inputs:</p>
                              <div className="grid md:grid-cols-2 gap-4">
                                {predictionResults.factors.map((factor: string, i: number) => (
                                  <div key={i} className="flex items-start space-x-3 bg-black/20 p-3 rounded-lg border border-white/5">
                                    <div className="w-6 h-6 rounded-full bg-racing-blue/20 text-racing-blue flex items-center justify-center font-bold text-xs shrink-0">
                                      {i + 1}
                                    </div>
                                    <span className="text-sm text-gray-300">{factor}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* NEW: Technical Simulation Metrics Visualization */}
                          {predictionResults.sim_metrics && (
                            <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-700 rounded-2xl p-6 mt-6 overflow-hidden shadow-2xl">
                              <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center">
                                <TrendingUp className="w-4 h-4 mr-2 text-green-500" />
                                Technical Simulation Metrics
                              </h4>
                              <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                                    <span className="text-xs text-gray-400 font-bold uppercase tracking-tighter">Pit Stop Window</span>
                                    <span className="text-white font-mono font-black">{predictionResults.sim_metrics.pit_window || 'Laps 16-22'}</span>
                                  </div>
                                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                                    <span className="text-xs text-gray-400 font-bold uppercase tracking-tighter">MGU-K Depletion</span>
                                    <div className="flex items-center space-x-2">
                                      <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-yellow-500" style={{ width: predictionResults.sim_metrics.mgu_k_depletion || '15%' }} />
                                      </div>
                                      <span className="text-white font-mono font-black text-xs">{predictionResults.sim_metrics.mgu_k_depletion || '15%'}</span>
                                    </div>
                                  </div>
                                </div>
                                {predictionResults.sim_metrics.tire_degradation && (
                                  <div className="h-28 w-full bg-black/40 rounded-xl p-4 border border-white/5">
                                    <ResponsiveContainer width="100%" height="100%">
                                      <LineChart data={predictionResults.sim_metrics.tire_degradation.map((val: number, i: number) => ({ lap: i, life: val }))}>
                                        <Line type="monotone" dataKey="life" stroke="#ef4444" strokeWidth={3} dot={false} animationDuration={2000} />
                                        <XAxis hide />
                                        <YAxis hide domain={[0, 100]} />
                                        <Tooltip
                                          content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                              return (
                                                <div className="bg-gray-900 border border-gray-700 p-2 rounded shadow-xl">
                                                  <p className="text-[10px] font-black text-white">LAP {payload[0].payload.lap}</p>
                                                  <p className="text-[10px] font-black text-red-500">{payload[0].value}% LIFE</p>
                                                </div>
                                              );
                                            }
                                            return null;
                                          }}
                                        />
                                      </LineChart>
                                    </ResponsiveContainer>
                                    <p className="text-[10px] text-center text-gray-500 mt-2 uppercase font-black tracking-widest">Predicted Tire Wear Curve</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="h-full min-h-[400px] border-2 border-dashed border-gray-800 rounded-2xl flex flex-col items-center justify-center text-gray-600 space-y-4">
                    <Brain className="w-16 h-16 opacity-20" />
                    <p className="font-bold tracking-widest uppercase text-xs">Awaiting Simulation Parameters</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}


        {/* DATA ANALYTICS DASHBOARD - Race Data Display */}
        {activeTab === 'analytics' && (
          <div className="space-y-8 animate-in fade-in duration-700">
            {/* Analytics Header Section */}
            <div className="grid lg:grid-cols-4 gap-6">
              {[
                { label: 'Avg Lap Time', value: '1:34.221', icon: Clock, color: 'text-racing-blue' },
                { label: 'Top Speed', value: '342 km/h', icon: Zap, color: 'text-yellow-500' },
                { label: 'Tire Life', value: '74%', icon: Info, color: 'text-green-500' },
                { label: 'Consistency', value: '98.2%', icon: Target, color: 'text-racing-red' }
              ].map((stat, i) => (
                <div key={i} className="bg-gray-900 border border-white/5 rounded-2xl p-6 shadow-xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{stat.label}</span>
                    <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                  <div className="text-2xl font-mono font-black">{stat.value}</div>
                </div>
              ))}
            </div>

            {/* Performance Chart - Recharts Integration */}
            <div className="bg-gray-900 border border-white/5 rounded-2xl p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-bold">Lap Time Variance</h3>
                  <p className="text-sm text-gray-500">Stints Analysis • 2026 Simulation Parameters</p>
                </div>
                <div className="flex space-x-2">
                  <span className="px-3 py-1 bg-racing-red/10 border border-racing-red/20 text-racing-red text-[10px] font-black rounded-full uppercase">Live Telemetry</span>
                </div>
              </div>

              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={[
                    { lap: 1, p1: 94.2, p2: 95.1, p3: 95.8, p4: 96.2, p5: 96.5 },
                    { lap: 2, p1: 93.8, p2: 94.5, p3: 95.2, p4: 95.7, p5: 96.1 },
                    { lap: 3, p1: 93.5, p2: 94.2, p3: 94.8, p4: 95.3, p5: 95.8 },
                    { lap: 4, p1: 93.2, p2: 93.9, p3: 94.5, p4: 95.0, p5: 95.4 },
                    { lap: 5, p1: 93.1, p2: 93.8, p3: 94.4, p4: 94.8, p5: 95.2 },
                    { lap: 6, p1: 94.5, p2: 94.1, p3: 94.8, p4: 95.2, p5: 95.6 },
                    { lap: 7, p1: 93.8, p2: 93.7, p3: 94.3, p4: 94.9, p5: 95.3 },
                    { lap: 8, p1: 93.6, p2: 93.5, p3: 94.1, p4: 94.6, p5: 95.1 },
                    { lap: 9, p1: 93.4, p2: 93.4, p3: 94.0, p4: 94.5, p5: 95.0 },
                    { lap: 10, p1: 93.3, p2: 93.3, p3: 93.9, p4: 94.4, p5: 94.9 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" vertical={false} />
                    <XAxis dataKey="lap" stroke="#718096" fontSize={12} tickLine={false} axisLine={false} label={{ value: 'Lap Number', position: 'bottom', fill: '#4a5568', fontSize: 10 }} />
                    <YAxis stroke="#718096" fontSize={12} tickLine={false} axisLine={false} domain={['92', '98']} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1a202c', border: 'none', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }}
                      itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                    />
                    <Legend verticalAlign="top" height={36} iconType="circle" />
                    <Line type="monotone" dataKey="p1" name="Hülkenberg (P1)" stroke="#e10600" strokeWidth={3} dot={{ r: 4, fill: '#e10600', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="p2" name="Verstappen (P2)" stroke="#1e40af" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                    <Line type="monotone" dataKey="p3" name="Leclerc (P3)" stroke="#ef4444" strokeWidth={2} strokeDasharray="3 3" dot={false} />
                    <Line type="monotone" dataKey="p4" name="Norris (P4)" stroke="#ff8000" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                    <Line type="monotone" dataKey="p5" name="Russell (P5)" stroke="#00d2be" strokeWidth={2} strokeDasharray="2 2" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-gray-900 border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                <div className="px-6 py-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                  <h4 className="text-sm font-black uppercase tracking-widest">Driver Standings Matrix</h4>
                  <button className="text-xs text-racing-red font-bold hover:underline">Full Leaderboard</button>
                </div>
                <div className="p-0">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="text-gray-500 border-b border-white/5 uppercase text-[10px] font-black">
                        <th className="px-6 py-4">Pos</th>
                        <th className="px-6 py-4">Driver</th>
                        <th className="px-6 py-4">Constructor</th>
                        <th className="px-6 py-4">Interval</th>
                        <th className="px-6 py-4 text-right">Points</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {apiStandings.slice(0, 6).map((standing, i) => (
                        <tr key={i} className="hover:bg-white/5 transition-colors group">
                          <td className="px-6 py-4 bg-racing-red/0 group-hover:bg-racing-red/10 transition-colors">
                            <span className="font-mono font-bold">{standing.position}</span>
                          </td>
                          <td className="px-6 py-4 font-bold text-white">{standing.driver?.name}</td>
                          <td className="px-6 py-4 text-gray-400">{standing.team?.name}</td>
                          <td className="px-6 py-4 font-mono text-gray-500 text-xs">--</td>
                          <td className="px-6 py-4 text-right font-black text-white">{standing.points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-6">
                {/* Historical DNA - Real Data from local archives */}
                <div className="bg-gradient-to-br from-indigo-900/40 to-black border border-indigo-500/20 rounded-2xl p-6 shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-2">
                    <History className="w-12 h-12 text-indigo-500/10 group-hover:text-indigo-500/20 transition-colors" />
                  </div>
                  <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-6 flex items-center">
                    <Database className="w-4 h-4 mr-2" />
                    Historical DNA Archive
                  </h4>

                  {historyLoading ? (
                    <div className="animate-pulse space-y-4">
                      <div className="h-4 bg-white/5 rounded w-3/4"></div>
                      <div className="h-4 bg-white/5 rounded w-1/2"></div>
                      <div className="h-4 bg-white/5 rounded w-2/3"></div>
                    </div>
                  ) : historicalData.length > 0 ? (
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {historicalData.map((yearEntry, idx) => (
                        <div key={idx} className="space-y-2">
                          <div className="flex items-center justify-between border-b border-white/5 pb-1">
                            <span className="text-[10px] font-black text-gray-500">{yearEntry.year} Results</span>
                            <span className="text-[10px] text-indigo-400 font-bold">ARC-{yearEntry.year}</span>
                          </div>
                          <div className="space-y-2">
                            {yearEntry.results.slice(0, 3).map((res: any, rIdx: number) => (
                              <div key={rIdx} className="flex justify-between items-center text-xs p-2 bg-white/5 rounded-lg border border-white/5">
                                <div className="flex flex-col">
                                  <span className="font-bold text-white">{res.driver}</span>
                                  <span className="text-[10px] text-gray-500 uppercase">{res.team}</span>
                                </div>
                                <div className="text-right">
                                  <div className="font-black text-indigo-400">P{res.position}</div>
                                  <div className="text-[10px] text-gray-500 font-mono">{res.time !== 'N/A' ? res.time : '--'}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Info className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                      <p className="text-[10px] text-gray-500 uppercase font-black">No Local Archives Found</p>
                    </div>
                  )}

                  <div className="mt-6 pt-4 border-t border-white/5 text-[10px] text-gray-500 italic">
                    Utilized by AI Oracle for 2026 Alpha Simulations
                  </div>
                </div>

                {/* Weather Station */}
                <div className="bg-gradient-to-br from-gray-900 to-black border border-white/5 rounded-2xl p-6 shadow-2xl">
                  <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-6 flex items-center">
                    <Cloud className="w-4 h-4 mr-2 text-racing-blue" />
                    Live Track Weather
                  </h4>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <div className="flex items-center text-gray-400 text-xs mb-1">
                        <Thermometer className="w-3 h-3 mr-1" />
                        Air Temp
                      </div>
                      <div className="text-2xl font-mono font-bold text-white">24.5°C</div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center text-gray-400 text-xs mb-1">
                        <Droplets className="w-3 h-3 mr-1" />
                        Humidity
                      </div>
                      <div className="text-2xl font-mono font-bold text-white">42%</div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center text-gray-400 text-xs mb-1">
                        <Wind className="w-3 h-3 mr-1" />
                        Wind
                      </div>
                      <div className="text-2xl font-mono font-bold text-white">12km/h</div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center text-gray-400 text-xs mb-1">
                        <Cloud className="w-3 h-3 mr-1" />
                        Track
                      </div>
                      <div className="text-2xl font-mono font-bold text-white">38.2°C</div>
                    </div>
                  </div>
                </div>

                {/* AI Analysis Quick Highlight */}
                {generatedReport && (
                  <div className="bg-racing-red/5 border border-racing-red/20 rounded-2xl p-6">
                    <div className="flex items-center space-x-2 mb-4 text-racing-red">
                      <Brain className="w-5 h-5" />
                      <span className="font-black text-xs uppercase tracking-widest">Alpha Debrief</span>
                    </div>
                    <p className="text-sm text-gray-400 leading-relaxed max-h-48 overflow-y-auto font-medium mb-4 italic">
                      {generatedReport.slice(0, 300)}...
                    </p>
                    <button className="w-full py-3 bg-racing-red/10 hover:bg-racing-red/20 border border-racing-red/30 rounded-xl text-racing-red text-xs font-black uppercase tracking-widest transition-all">
                      Open Full Intelligence
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* AI ORACLE CHAT */}
        {
          activeTab === 'ai' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  <Suspense fallback={<div className="h-[600px] w-full bg-gray-800 animate-pulse rounded-2xl" />}>
                    <F1AIChat contextData={{
                      standings: apiStandings,
                      drivers: apiDrivers,
                      teams: apiTeams,
                      nextRaces: upcomingRacesList,
                      currentTrack: tracks.find(t => t.id === selectedTrack)
                    }} />
                  </Suspense>
                </div>
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-gray-900 to-black p-6 rounded-2xl border border-white/10 shadow-xl border-racing-red/20">
                    <h4 className="text-xl font-bold mb-4 flex items-center text-racing-red">
                      <Target className="w-5 h-5 mr-2" />
                      Alpha Pick Accuracy
                    </h4>
                    <div className="flex items-end justify-between mb-2">
                      <span className="text-4xl font-black text-white tracking-tighter">94.2%</span>
                      <span className="text-green-500 text-sm font-bold flex items-center mb-1">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        +2.1%
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Last 10 Races Analysis</p>
                    <div className="mt-6 space-y-4">
                      <div className="p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                        <p className="text-[10px] text-gray-400 mb-1 uppercase font-bold">Top Prediction Strength</p>
                        <p className="text-sm font-bold text-white">Podium Outcomes</p>
                      </div>
                      <div className="p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                        <p className="text-[10px] text-gray-400 mb-1 uppercase font-bold">Key Insight Factor</p>
                        <p className="text-sm font-bold text-white">2026 Aero Efficiency</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/5 p-6 rounded-2xl border border-white/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full blur-3xl" />
                    <h4 className="font-bold text-white mb-4 flex items-center text-sm uppercase tracking-wider">
                      <Zap className="w-4 h-4 mr-2 text-yellow-500" />
                      Live Alpha Tickers
                    </h4>
                    <div className="space-y-4">
                      {[
                        { label: "Verstappen Confidence", value: "High (0.91)" },
                        { label: "Hulk P10 Probability", value: "Medium (0.68)" },
                        { label: "Ferrari Reliability", value: "Increasing" },
                        { label: "Track Evolution", value: "High" }
                      ].map((ticker, i) => (
                        <div key={i} className="flex justify-between items-center text-xs">
                          <span className="text-gray-400">{ticker.label}</span>
                          <span className="text-white font-mono bg-white/5 px-2 py-0.5 rounded border border-white/5">{ticker.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Decision Panel */}
              <Suspense fallback={<div className="h-[400px] w-full bg-gray-800 animate-pulse rounded-2xl" />}>
                <DecisionPanel
                  driver="Max Verstappen"
                  race={tracks.find(t => t.id === selectedTrack)?.name || "Monaco Grand Prix"}
                  currentConditions={simulatedWeather}
                />
              </Suspense>
            </div>
          )
        }
        {/* PRACTICE & TESTING DASHBOARD */}
        {activeTab === 'practice' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-black tracking-tight text-white flex items-center">
                <Clock className="w-8 h-8 mr-3 text-racing-red" />
                Practice & Testing Analysis
              </h2>
              {practiceSessions.length > 0 && (
                <select
                  className="bg-gray-900 border border-gray-700 text-white rounded-lg px-4 py-2 font-semibold focus:outline-none focus:border-racing-red"
                  value={selectedPracticeSession || ''}
                  onChange={(e) => setSelectedPracticeSession(Number(e.target.value))}
                >
                  {practiceSessions.map(s => (
                    <option key={s.session_key} value={s.session_key}>
                      {s.session_name} - {s.circuit_short_name} ({new Date(s.date_start).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {practiceLoading ? (
              <div className="flex flex-col items-center justify-center p-20 bg-gray-900/50 rounded-2xl border border-white/5">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-racing-red mb-4"></div>
                <p className="text-gray-400 font-bold tracking-widest uppercase">Fetching Telemetry & Lap Data...</p>
              </div>
            ) : practiceData.length > 0 ? (
              <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                <div className="px-6 py-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                  <h4 className="text-sm font-black uppercase tracking-widest">Fastest Laps Leaderboard</h4>
                  <span className="text-xs text-gray-400 bg-black/50 px-3 py-1 rounded-full border border-white/10">{practiceData.length} Drivers Logged</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="text-gray-500 border-b border-white/5 uppercase text-[10px] font-black bg-black/20">
                        <th className="px-6 py-4 rounded-tl-xl">Pos</th>
                        <th className="px-6 py-4">Driver</th>
                        <th className="px-6 py-4 hidden md:table-cell">Team</th>
                        <th className="px-6 py-4 text-right">Best Lap</th>
                        <th className="px-6 py-4 text-right border-l border-white/5">Gap</th>
                        <th className="px-6 py-4 text-right hidden md:table-cell rounded-tr-xl">Speed Trap</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {practiceData.map((lap, i) => (
                        <tr key={i} className="hover:bg-white/5 transition-colors group">
                          <td className="px-6 py-4 bg-racing-red/0 group-hover:bg-racing-red/10 transition-colors">
                            <span className={`font-mono font-bold ${i === 0 ? 'text-racing-red' : 'text-gray-400'}`}>{lap.position}</span>
                          </td>
                          <td className="px-6 py-4 font-bold text-white flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-xs border border-white/10 font-mono">
                              {lap.driverNumber}
                            </div>
                            <span>{lap.driver}</span>
                          </td>
                          <td className="px-6 py-4 text-gray-400 hidden md:table-cell font-semibold">{lap.team}</td>
                          <td className="px-6 py-4 text-right font-mono font-black text-white">{lap.timeStr}</td>
                          <td className="px-6 py-4 text-right font-mono text-gray-500 text-xs border-l border-white/5">{lap.gapToFirst}</td>
                          <td className="px-6 py-4 text-right font-mono text-gray-400 text-xs hidden md:table-cell">{lap.speedSt}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-20 bg-gray-900/50 rounded-2xl border border-white/5 border-dashed">
                <Clock className="w-16 h-16 text-gray-600 mb-4" />
                <p className="text-xl font-bold text-gray-300 mb-2">No Practice Data Available</p>
                <p className="text-gray-500 max-w-md text-center">Session data might not be logged yet, or telemetry is currently unavailable from OpenF1.</p>
              </div>
            )}
          </div>
        )}
      </div >

    </div >
  )
}
