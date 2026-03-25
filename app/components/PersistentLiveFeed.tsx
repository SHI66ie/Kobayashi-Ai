'use client'

import React, { useState, useEffect, useRef, useMemo, createContext, useContext } from 'react'
import { Play, Pause, RotateCcw, Settings, Activity, Zap, TrendingUp, AlertCircle, Users, Trophy, Clock, Satellite, Minimize2, Maximize2, X, ChevronLeft, ChevronRight } from 'lucide-react'

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

interface PersistentLiveFeedProps {
  activeTab: string
  drivers: string[]
  trackId: string
}

// Context for live feed state
interface LiveFeedContextType {
  isVisible: boolean
  setIsVisible: (visible: boolean) => void
  position: 'right' | 'bottom'
  setPosition: (position: 'right' | 'bottom') => void
  isMinimized: boolean
  setIsMinimized: (minimized: boolean) => void
}

const LiveFeedContext = createContext<LiveFeedContextType | null>(null)

export const useLiveFeed = () => {
  const context = useContext(LiveFeedContext)
  if (!context) throw new Error('useLiveFeed must be used within PersistentLiveFeed')
  return context
}

const PersistentLiveFeed: React.FC<PersistentLiveFeedProps> = ({
  activeTab,
  drivers = [],
  trackId
}) => {
  const [liveData, setLiveData] = useState<LiveDataItem[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [maxEvents, setMaxEvents] = useState(25)
  const [eventFilter, setEventFilter] = useState<string>('all')
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const updateThrottleRef = useRef<NodeJS.Timeout | null>(null)

  // Persistent state
  const [isVisible, setIsVisible] = useState(true)
  const [position, setPosition] = useState<'right' | 'bottom'>('right')
  const [isMinimized, setIsMinimized] = useState(false)
  const [isRealTime, setIsRealTime] = useState(false)

  // Smart update frequency based on context
  const updateFrequency = useMemo(() => {
    switch (activeTab) {
      case 'analytics': return 5000   // High frequency for analysis
      case 'standings': return 15000  // Lower for championship
      case 'builder': return 10000   // Medium for strategy
      case 'practice': return 2000   // Highest for sessions
      default: return 10000
    }
  }, [activeTab])

  // Context-aware data generation
  const generateContextAwareData = async (): Promise<LiveDataItem[]> => {
    const baseEvents: LiveDataItem[] = []
    
    switch (activeTab) {
      case 'analytics':
        // Analytics-focused events
        baseEvents.push(
          {
            id: `analytics_${Date.now()}`,
            type: 'lap_time',
            timestamp: new Date(),
            driver: drivers[0] || 'VER',
            team: 'Red Bull Racing',
            message: 'New fastest lap: 1:23.456',
            value: '1:23.456',
            change: 'up',
            urgency: 'medium'
          },
          {
            id: `analytics_telemetry_${Date.now()}`,
            type: 'tire',
            timestamp: new Date(),
            driver: drivers[1] || 'HAM',
            team: 'Mercedes',
            message: 'Tire wear at 67%',
            value: '67%',
            change: 'down',
            urgency: 'high'
          }
        )
        break
        
      case 'standings':
        // Standings-focused events
        baseEvents.push(
          {
            id: `standings_${Date.now()}`,
            type: 'position',
            timestamp: new Date(),
            driver: drivers[0] || 'VER',
            team: 'Red Bull Racing',
            message: 'Otook HAM for P2',
            change: 'up',
            urgency: 'high'
          },
          {
            id: `standings_points_${Date.now()}`,
            type: 'position',
            timestamp: new Date(),
            driver: drivers[2] || 'NOR',
            team: 'McLaren',
            message: 'Championship lead +5 points',
            value: '+5',
            change: 'up',
            urgency: 'medium'
          }
        )
        break
        
      case 'builder':
        // Strategy-focused events
        baseEvents.push(
          {
            id: `strategy_${Date.now()}`,
            type: 'tire',
            timestamp: new Date(),
            message: 'Optimal compound: Medium (C2)',
            value: 'C2',
            urgency: 'medium'
          },
          {
            id: `strategy_weather_${Date.now()}`,
            type: 'weather',
            timestamp: new Date(),
            message: 'Track temp 32°C, humidity 45%',
            value: '32°C',
            urgency: 'low'
          }
        )
        break
        
      case 'practice':
        // Practice-focused events
        baseEvents.push(
          {
            id: `practice_session_${Date.now()}`,
            type: 'lap_time',
            timestamp: new Date(),
            driver: drivers[0] || 'VER',
            team: 'Red Bull Racing',
            message: 'Practice lap: 1:25.789',
            value: '1:25.789',
            change: 'up',
            urgency: 'low'
          },
          {
            id: `practice_pit_${Date.now()}`,
            type: 'pit',
            timestamp: new Date(),
            driver: drivers[1] || 'HAM',
            team: 'Mercedes',
            message: 'Practice pit stop completed',
            value: '2.8s',
            urgency: 'medium'
          }
        )
        break
        
      default:
        // Generic events
        baseEvents.push(
          {
            id: `generic_${Date.now()}`,
            type: 'position',
            timestamp: new Date(),
            driver: drivers[0] || 'VER',
            team: 'Red Bull Racing',
            message: 'Sector 3 improvement',
            change: 'up',
            urgency: 'medium'
          }
        )
    }

    return baseEvents
  }

  // Start live data
  const startLiveData = async () => {
    try {
      // Initial data
      const initialData = await generateContextAwareData()
      setLiveData(initialData)
      setIsConnected(true)

      // Set up interval for updates
      intervalRef.current = setInterval(async () => {
        if (!isPaused) {
          const generated = await generateContextAwareData()
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
    } catch (error) {
      console.error('Live feed error:', error)
      setIsConnected(false)
    }
  }

  // Stop live data
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
  }

  // Initialize on mount
  useEffect(() => {
    startLiveData()
    return () => stopLiveData()
  }, [activeTab, updateFrequency, isPaused])

  // Filter events
  const filteredData = useMemo(() => {
    if (eventFilter === 'all') return liveData
    return liveData.filter(item => item.type === eventFilter)
  }, [liveData, eventFilter])

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'position': return <Users className="w-3 h-3" />
      case 'lap_time': return <Clock className="w-3 h-3" />
      case 'tire': return <Activity className="w-3 h-3" />
      case 'weather': return <Zap className="w-3 h-3" />
      case 'drs': return <TrendingUp className="w-3 h-3" />
      case 'pit': return <AlertCircle className="w-3 h-3" />
      case 'flag': return <Trophy className="w-3 h-3" />
      default: return <Activity className="w-3 h-3" />
    }
  }

  const getEventColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-500/20 border-red-500/50 text-red-400'
      case 'medium': return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400'
      case 'low': return 'bg-green-500/20 border-green-500/50 text-green-400'
      default: return 'bg-gray-500/20 border-gray-500/50 text-gray-400'
    }
  }

  const formatTimestamp = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const seconds = Math.floor(diff / 1000)
    
    if (seconds < 60) return 'just now'
    if (seconds < 120) return '1m ago'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    return `${Math.floor(seconds / 3600)}h ago`
  }

  const contextValue: LiveFeedContextType = {
    isVisible,
    setIsVisible,
    position,
    setPosition,
    isMinimized,
    setIsMinimized
  }

  if (!isVisible) return null

  // Right sidebar layout
  if (position === 'right') {
    return (
      <LiveFeedContext.Provider value={contextValue}>
        <div className={`fixed right-0 top-20 h-[calc(100vh-5rem)] w-80 bg-gray-900/95 backdrop-blur-xl border-l border-white/10 shadow-2xl transition-all duration-300 z-50 ${
          isMinimized ? 'w-12' : 'w-80'
        }`}>
          
          {/* Header */}
          <div className="bg-gradient-to-r from-racing-red/20 to-racing-blue/20 border-b border-white/10 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Satellite className={`w-4 h-4 ${isRealTime ? 'text-green-500' : 'text-racing-red'}`} />
                {!isMinimized && (
                  <span className="text-xs font-bold text-white truncate max-w-[120px]">
                    {activeTab === 'analytics' && 'Analytics Feed'}
                    {activeTab === 'standings' && 'Standings Feed'}
                    {activeTab === 'builder' && 'Strategy Feed'}
                    {activeTab === 'practice' && 'Practice Feed'}
                    {activeTab === 'upcoming' && 'Race Feed'}
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                >
                  {isMinimized ? <Maximize2 className="w-3 h-3 text-gray-300" /> : <Minimize2 className="w-3 h-3 text-gray-300" />}
                </button>
                <button
                  onClick={() => setIsVisible(false)}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                >
                  <X className="w-3 h-3 text-gray-300" />
                </button>
              </div>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Controls */}
              <div className="p-3 border-b border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={togglePause}
                      disabled={!isConnected}
                      className="flex items-center space-x-1 px-2 py-1 bg-racing-red hover:bg-red-600 disabled:opacity-50 rounded text-white text-xs transition-colors"
                    >
                      {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                    </button>
                    
                    <button
                      onClick={resetFeed}
                      className="flex items-center space-x-1 px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-white text-xs transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  </div>
                  
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                </div>

                {/* Filter */}
                <select
                  value={eventFilter}
                  onChange={(e) => setEventFilter(e.target.value)}
                  className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs text-gray-300 focus:outline-none focus:ring-1 focus:ring-racing-red"
                >
                  <option value="all">All Events</option>
                  <option value="position">Positions</option>
                  <option value="lap_time">Lap Times</option>
                  <option value="tire">Tire Data</option>
                  <option value="weather">Weather</option>
                  <option value="drs">DRS</option>
                  <option value="pit">Pit Stops</option>
                  <option value="flag">Flags</option>
                </select>
              </div>

              {/* Events */}
              <div className="flex-1 overflow-y-auto space-y-2 p-2" style={{ maxHeight: 'calc(100% - 120px)' }}>
                {filteredData.slice(0, 15).map((item, index) => (
                  <div
                    key={item.id}
                    className={`p-2 rounded-lg border transition-all duration-200 ${getEventColor(item.urgency)}`}
                  >
                    <div className="flex items-start space-x-2">
                      <div className="flex-shrink-0 mt-0.5">
                        {getEventIcon(item.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white font-medium leading-tight">
                          {item.message}
                        </p>
                        {item.driver && (
                          <p className="text-[10px] text-gray-400 mt-1">
                            {item.driver} {item.team && `• ${item.team}`}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-1">
                          {item.change && (
                            <span className={`text-[10px] font-medium ${
                              item.change === 'up' ? 'text-green-500' :
                              item.change === 'down' ? 'text-red-500' :
                              'text-gray-500'
                            }`}>
                              {item.change === 'up' ? '↑' : item.change === 'down' ? '↓' : '→'}
                            </span>
                          )}
                          <span className="text-[10px] text-gray-500">
                            {formatTimestamp(item.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {filteredData.length === 0 && (
                  <div className="text-center py-8">
                    <Activity className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">No events to display</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </LiveFeedContext.Provider>
    )
  }

  // Bottom panel layout
  return (
    <LiveFeedContext.Provider value={contextValue}>
      <div className={`fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-xl border-t border-white/10 shadow-2xl transition-all duration-300 z-50 ${
        isMinimized ? 'h-12' : 'h-48'
      }`}>
        
        {/* Header */}
        <div className="bg-gradient-to-r from-racing-red/20 to-racing-blue/20 border-b border-white/10 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Satellite className={`w-4 h-4 ${isRealTime ? 'text-green-500' : 'text-racing-red'}`} />
              {!isMinimized && (
                <span className="text-xs font-bold text-white">
                  {activeTab === 'analytics' && 'Analytics Feed'}
                  {activeTab === 'standings' && 'Standings Feed'}
                  {activeTab === 'builder' && 'Strategy Feed'}
                  {activeTab === 'practice' && 'Practice Feed'}
                  {activeTab === 'upcoming' && 'Race Feed'}
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1 hover:bg-white/10 rounded transition-colors"
              >
                {isMinimized ? <ChevronRight className="w-3 h-3 text-gray-300" /> : <ChevronLeft className="w-3 h-3 text-gray-300" />}
              </button>
              <button
                onClick={() => setIsVisible(false)}
                className="p-1 hover:bg-white/10 rounded transition-colors"
              >
                <X className="w-3 h-3 text-gray-300" />
              </button>
            </div>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Content */}
            <div className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={togglePause}
                    disabled={!isConnected}
                    className="flex items-center space-x-1 px-2 py-1 bg-racing-red hover:bg-red-600 disabled:opacity-50 rounded text-white text-xs transition-colors"
                  >
                    {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                  </button>
                  
                  <button
                    onClick={resetFeed}
                    className="flex items-center space-x-1 px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-white text-xs transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                </div>
                
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              </div>

              {/* Events scroll */}
              <div className="flex-1 overflow-x-auto space-x-2 mt-2 pb-2">
                {filteredData.slice(0, 8).map((item, index) => (
                  <div
                    key={item.id}
                    className={`flex-shrink-0 p-2 rounded-lg border transition-all duration-200 ${getEventColor(item.urgency)}`}
                    style={{ minWidth: '200px' }}
                  >
                    <div className="flex items-center space-x-2">
                      <div className="flex-shrink-0">
                        {getEventIcon(item.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white font-medium leading-tight truncate">
                          {item.message}
                        </p>
                        <span className="text-[10px] text-gray-500">
                          {formatTimestamp(item.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </LiveFeedContext.Provider>
  )
}

export default PersistentLiveFeed
export { useLiveFeed }
