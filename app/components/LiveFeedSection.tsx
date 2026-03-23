'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Play, Pause, RotateCcw, Settings, Activity, Zap, TrendingUp, AlertCircle, Users, Trophy, Clock, Satellite } from 'lucide-react'

interface LiveDataItem {
  id: string
  type: 'position' | 'lap_time' | 'tire' | 'weather' | 'drs' | 'pit' | 'flag'
  timestamp: Date
  driver?: string
  team?: string
  message: string
  value?: string | number
  change?: 'up' | 'down' | 'neutral'
  urgency: 'low' | 'medium' | 'high'
}

interface LiveFeedSectionProps {
  trackId: string
  drivers: string[]
  className?: string
}

const LiveFeedSection: React.FC<LiveFeedSectionProps> = ({
  trackId,
  drivers = [],
  className = ''
}) => {
  const [liveData, setLiveData] = useState<LiveDataItem[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [updateFrequency, setUpdateFrequency] = useState(10000) // 10 seconds default
  const [maxEvents, setMaxEvents] = useState(20)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const updateThrottleRef = useRef<NodeJS.Timeout | null>(null)

  const [isRealTime, setIsRealTime] = useState(false)
  const [sessionKey, setSessionKey] = useState<number | null>(null)

  // Fetch real data from OpenF1
  const fetchRealOpenF1Data = async () => {
    try {
      const { openf1Api, transformOpenF1Data } = await import('@/lib/openf1-api')
      
      // 1. Get latest session if we don't have one
      let currentSessionKey = sessionKey
      if (!currentSessionKey) {
        const latestSessions = await openf1Api.getSessions()
        const latest = latestSessions.length > 0 ? latestSessions[latestSessions.length - 1] : null
        if (latest) {
          currentSessionKey = latest.session_key
          setSessionKey(currentSessionKey)
        }
      }

      if (!currentSessionKey) return []

      // 2. Fetch Race Control Messages
      const raceControlData = await openf1Api.getRaceControlData(currentSessionKey)
      
      // 3. Transform to LiveDataItem format
      const realEvents: LiveDataItem[] = raceControlData.slice(-10).map((msg: any, i: number) => ({
        id: `rc-${msg.date}-${i}`,
        type: msg.category === 'Flag' ? 'flag' : 'pit',
        timestamp: new Date(msg.date),
        driver: msg.driver_number ? `Driver #${msg.driver_number}` : undefined,
        message: msg.message,
        urgency: msg.flag === 'RED' ? 'high' : msg.flag === 'YELLOW' ? 'medium' : 'low'
      }))

      // 4. Fetch Weather for track info
      const weather = await openf1Api.getWeatherData(currentSessionKey)
      if (weather.length > 0) {
        const latestWeather = weather[weather.length - 1]
        realEvents.push({
          id: `wth-${latestWeather.date}`,
          type: 'weather',
          timestamp: new Date(latestWeather.date),
          message: `Track Temp: ${latestWeather.track_temperature}°C / Air: ${latestWeather.air_temperature}°C`,
          urgency: 'low'
        })
      }

      setIsRealTime(true)
      return realEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    } catch (error) {
      console.error('Error fetching real OpenF1 data:', error)
      setIsRealTime(false)
      return []
    }
  }

  const generateLiveData = async (): Promise<LiveDataItem[]> => {
    // Attempt real data first
    const realData = await fetchRealOpenF1Data()
    if (realData.length > 0) return realData

    // Fallback to mock data generator if real data is empty/fails
    const events: LiveDataItem[] = []
    const timestamp = new Date()
    
    const eventTypes = [
      {
        type: 'position' as const,
        messages: [
          `${drivers[0] || 'Verstappen'} gains position on ${drivers[1] || 'Leclerc'}`,
          `${drivers[2] || 'Norris'} defending from ${drivers[3] || 'Hamilton'}`,
          'Close battle for P4',
          'Overtaking attempt in Sector 2'
        ],
        urgency: 'medium' as const
      },
      {
        type: 'lap_time' as const,
        messages: [
          `New fastest lap: ${drivers[0] || 'Verstappen'} - 1:23.456`,
          'Purple sector by leader',
          'Personal best for middle field',
          'Improving pace in Sector 3'
        ],
        urgency: 'low' as const
      },
      {
        type: 'tire' as const,
        messages: [
          'High tire wear detected - Medium compound',
          'Optimal tire temperature reached',
          'Graining issues reported',
          'Tire strategy working well'
        ],
        urgency: 'medium' as const
      },
      {
        type: 'weather' as const,
        messages: [
          'Track temperature rising to 32°C',
          'Wind speed increasing to 15 km/h',
          'Humidity dropping to 45%',
          'Clear conditions expected'
        ],
        urgency: 'low' as const
      },
      {
        type: 'drs' as const,
        messages: [
          'DRS enabled on main straight',
          'DRS train forming',
          'Successful DRS overtake',
          'DRS not within 1 second'
        ],
        urgency: 'medium' as const
      },
      {
        type: 'pit' as const,
        messages: [
          `${drivers[1] || 'Ferrari'} entering pits for Mediums`,
          'Quick pit stop 2.3s',
          'Double stack strategy initiated',
          'Pit window opening'
        ],
        urgency: 'high' as const
      },
      {
        type: 'flag' as const,
        messages: [
          'Yellow flag Sector 3 - debris',
          'Virtual Safety Car deployed',
          'Green flag - track clear',
          'Safety car ending this lap'
        ],
        urgency: 'high' as const
      }
    ]

    const numEvents = Math.floor(Math.random() * 3) + 2 // Generate 2-4 events
    for (let i = 0; i < numEvents; i++) {
      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)]
      const message = eventType.messages[Math.floor(Math.random() * eventType.messages.length)]
      
      events.push({
        id: `${timestamp.getTime()}-${i}`,
        type: eventType.type,
        timestamp: new Date(timestamp.getTime() - i * 30000),
        driver: drivers[Math.floor(Math.random() * drivers.length)],
        team: ['Red Bull', 'Mercedes', 'Ferrari', 'McLaren', 'Aston Martin'][Math.floor(Math.random() * 5)],
        message,
        value: Math.random() * 100,
        change: ['up', 'down', 'neutral'][Math.floor(Math.random() * 3)] as any,
        urgency: eventType.urgency
      })
    }
    
    return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  // Start live data feed
  const startLiveData = async () => {
    if (intervalRef.current) return 

    // Initial data
    const initialData = await generateLiveData()
    setLiveData(initialData)
    setIsConnected(true)

    // Set up interval for updates
    intervalRef.current = setInterval(async () => {
      if (!isPaused) {
        const generated = await generateLiveData()
        const newEvent = generated[0]
        
        if (updateThrottleRef.current) {
          clearTimeout(updateThrottleRef.current)
        }
        
        updateThrottleRef.current = setTimeout(() => {
          setLiveData(prev => {
            const updated = [newEvent, ...prev.slice(0, maxEvents - 1)]
            setLastUpdate(new Date())
            return updated
          })
        }, 100) 
      }
    }, updateFrequency)
  }


  // Stop live data feed
  const stopLiveData = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (updateThrottleRef.current) {
      clearTimeout(updateThrottleRef.current)
      updateThrottleRef.current = null
    }
    setIsConnected(false)
  }

  // Toggle pause/play
  const togglePause = () => {
    setIsPaused(!isPaused)
  }

  // Clear data and restart
  const resetFeed = () => {
    setLiveData([])
    setLastUpdate(new Date())
    if (isConnected) {
      stopLiveData()
      setTimeout(startLiveData, 100)
    }
  }

  // Initialize on mount
  useEffect(() => {
    startLiveData()
    return () => stopLiveData()
  }, [drivers, trackId])

  // Update frequency change
  useEffect(() => {
    if (isConnected) {
      stopLiveData()
      startLiveData()
    }
  }, [updateFrequency, isPaused])

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'position': return <Users className="w-4 h-4" />
      case 'lap_time': return <Clock className="w-4 h-4" />
      case 'tire': return <Activity className="w-4 h-4" />
      case 'weather': return <Zap className="w-4 h-4" />
      case 'drs': return <TrendingUp className="w-4 h-4" />
      case 'pit': return <AlertCircle className="w-4 h-4" />
      case 'flag': return <Trophy className="w-4 h-4" />
      default: return <Activity className="w-4 h-4" />
    }
  }

  const getEventColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'text-red-500 border-red-500/30 bg-red-500/10'
      case 'medium': return 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10'
      case 'low': return 'text-green-500 border-green-500/30 bg-green-500/10'
      default: return 'text-gray-500 border-gray-500/30 bg-gray-500/10'
    }
  }

  const formatTimestamp = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const seconds = Math.floor(diff / 1000)
    
    if (seconds < 60) return 'just now'
    if (seconds < 120) return '1 min ago'
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`
    return `${Math.floor(seconds / 3600)}h ago`
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Live Feed Header with Controls */}
      <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-racing-red/20 to-racing-blue/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Satellite className={`w-6 h-6 ${isRealTime ? 'text-green-500' : 'text-racing-red'}`} />
                <h3 className="text-xl font-bold text-white">Live Feed Visualizations</h3>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-300">
                  {isConnected ? (isPaused ? 'Paused' : (isRealTime ? 'Real-Time (OpenF1)' : 'Simulated')) : 'Disconnected'}
                </span>
              </div>
            </div>
            
            {/* Control Buttons */}
            <div className="flex items-center space-x-3">
              <button
                onClick={togglePause}
                disabled={!isConnected}
                className="flex items-center space-x-2 px-4 py-2 bg-racing-red hover:bg-red-600 disabled:opacity-50 disabled:grayscale rounded-lg transition-all text-white font-medium"
              >
                {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                <span className="hidden sm:inline">{isPaused ? 'Play' : 'Pause'}</span>
              </button>
              
              <button
                onClick={resetFeed}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all text-white font-medium"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline">Reset</span>
              </button>
              
              <div className="flex items-center space-x-2 px-3 py-2 bg-gray-800 rounded-lg">
                <Settings className="w-4 h-4 text-gray-400" />
                <select
                  value={updateFrequency}
                  onChange={(e) => setUpdateFrequency(Number(e.target.value))}
                  className="bg-transparent text-sm text-gray-300 focus:outline-none"
                >
                  <option value={5000}>5s</option>
                  <option value={10000}>10s</option>
                  <option value={15000}>15s</option>
                  <option value={30000}>30s</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="mt-4 flex items-center justify-between text-sm">
            <div className="text-gray-400">
              Last Update: <span className="text-white font-medium">{formatTimestamp(lastUpdate)}</span>
            </div>
            <div className="text-gray-400">
              Events: <span className="text-white font-medium">{liveData.length}/{maxEvents}</span>
            </div>
          </div>
        </div>

        {/* Live Data Visualization */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Live Event Feed */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white flex items-center space-x-2">
                <Activity className="w-5 h-5 text-racing-red" />
                <span>Live Events</span>
              </h4>
              
              <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar pr-2">
                {liveData.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No live events</p>
                  </div>
                ) : (
                  liveData.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-start space-x-3 p-3 rounded-lg border transition-all duration-300 hover:bg-white/5 ${getEventColor(
                        item.urgency
                      )}`}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {getEventIcon(item.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm text-white font-medium">
                              {item.message}
                            </p>
                            {item.driver && (
                              <p className="text-xs text-gray-400 mt-1">
                                {item.driver} {item.team && `• ${item.team}`}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 ml-2">
                            {item.change && (
                              <div className={`text-xs font-medium ${
                                item.change === 'up' ? 'text-green-500' :
                                item.change === 'down' ? 'text-red-500' :
                                'text-gray-500'
                              }`}>
                                {item.change === 'up' ? '↑' :
                                 item.change === 'down' ? '↓' : '→'}
                              </div>
                            )}
                            <span className="text-xs text-gray-500 whitespace-nowrap">
                              {formatTimestamp(item.timestamp)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Live Stats Dashboard */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-racing-blue" />
                <span>Live Statistics</span>
              </h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800/50 rounded-lg p-4 border border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <Users className="w-5 h-5 text-racing-red" />
                    <span className="text-xs text-gray-400">Active</span>
                  </div>
                  <p className="text-2xl font-bold text-white">20</p>
                  <p className="text-xs text-gray-500">Drivers</p>
                </div>
                
                <div className="bg-gray-800/50 rounded-lg p-4 border border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <Zap className="w-5 h-5 text-orange-500" />
                    <span className="text-xs text-gray-400">Track</span>
                  </div>
                  <p className="text-2xl font-bold text-white">32°C</p>
                  <p className="text-xs text-gray-500">Temperature</p>
                </div>
                
                <div className="bg-gray-800/50 rounded-lg p-4 border border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <Clock className="w-5 h-5 text-blue-500" />
                    <span className="text-xs text-gray-400">Progress</span>
                  </div>
                  <p className="text-2xl font-bold text-white">42/66</p>
                  <p className="text-xs text-gray-500">Laps</p>
                </div>
                
                <div className="bg-gray-800/50 rounded-lg p-4 border border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <AlertCircle className="w-5 h-5 text-green-500" />
                    <span className="text-xs text-gray-400">Status</span>
                  </div>
                  <p className="text-2xl font-bold text-white">Live</p>
                  <p className="text-xs text-gray-500">Race</p>
                </div>
              </div>
              
              {/* Event Type Distribution */}
              <div className="bg-gray-800/50 rounded-lg p-4 border border-white/5">
                <h5 className="text-sm font-medium text-gray-300 mb-3">Event Distribution</h5>
                <div className="space-y-2">
                  {['position', 'lap_time', 'tire', 'weather', 'drs', 'pit', 'flag'].map((type) => {
                    const count = liveData.filter(item => item.type === type).length
                    const percentage = liveData.length > 0 ? (count / liveData.length) * 100 : 0
                    
                    return (
                      <div key={type} className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2 w-20">
                          {getEventIcon(type)}
                          <span className="text-xs text-gray-400 capitalize">{type.replace('_', ' ')}</span>
                        </div>
                        <div className="flex-1 bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-racing-red to-racing-blue h-2 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400 w-8 text-right">{count}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LiveFeedSection
