'use client'

import React, { useState, useEffect } from 'react'
import { Satellite, Activity, Zap, TrendingUp, AlertCircle, Clock, Users, Trophy } from 'lucide-react'

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

interface LiveDataTickerProps {
  trackId: string
  drivers: string[]
  className?: string
}

const LiveDataTicker: React.FC<LiveDataTickerProps> = ({
  trackId,
  drivers = [],
  className = ''
}) => {
  const [liveData, setLiveData] = useState<LiveDataItem[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const [isRealTime, setIsRealTime] = useState(false)

  // Simulate live data feed
  useEffect(() => {
    const fetchRealData = async () => {
      try {
        const { openf1Api } = await import('@/lib/openf1-api')
        const sessions = await openf1Api.getSessions()
        const latest = sessions.length > 0 ? sessions[sessions.length - 1] : null
        
        if (!latest) return null

        const [rc, weather] = await Promise.all([
          openf1Api.getRaceControlData(latest.session_key),
          openf1Api.getWeatherData(latest.session_key)
        ])

        const events: LiveDataItem[] = rc.slice(-8).map((msg: any, i: number) => ({
          id: `rc-tick-${msg.date}-${i}`,
          type: msg.category === 'Flag' ? 'flag' : 'pit',
          timestamp: new Date(msg.date),
          message: msg.message,
          urgency: msg.flag === 'RED' ? 'high' : msg.flag === 'YELLOW' ? 'medium' : 'low'
        }))

        if (weather.length > 0) {
          const w = weather[weather.length - 1]
          events.push({
            id: `wth-tick-${w.date}`,
            type: 'weather',
            timestamp: new Date(w.date),
            message: `Track: ${w.track_temperature}°C | Air: ${w.air_temperature}°C`,
            urgency: 'low'
          })
        }

        return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      } catch (e) {
        console.error('Ticker real-time error:', e)
        return null
      }
    }

    const generateMockData = (): LiveDataItem[] => {
      const events: LiveDataItem[] = []
      const timestamp = new Date()
      
      const eventTypes = [
        { type: 'position' as const, messages: [`${drivers[0] || 'Leader'} increases gap`, 'Battle for P10 heating up'], urgency: 'medium' as const },
        { type: 'lap_time' as const, messages: ['Green sector for top 5', 'Pace improving'], urgency: 'low' as const },
        { type: 'tire' as const, messages: ['Checking tire degradation', 'Switching to Plan B'], urgency: 'medium' as const },
        { type: 'flag' as const, messages: ['Track conditions optimal', 'Sector 1 yellow cleared'], urgency: 'low' as const }
      ]

      for (let i = 0; i < 4; i++) {
        const et = eventTypes[i % eventTypes.length]
        events.push({
          id: `mock-tick-${timestamp.getTime()}-${i}`,
          type: et.type,
          timestamp: new Date(timestamp.getTime() - i * 60000),
          message: et.messages[Math.floor(Math.random() * et.messages.length)],
          urgency: et.urgency
        })
      }
      return events
    }

    const refreshData = async () => {
      const real = await fetchRealData()
      if (real && real.length > 0) {
        setLiveData(real)
        setIsRealTime(true)
      } else {
        setLiveData(generateMockData())
        setIsRealTime(false)
      }
      setIsConnected(true)
      setLastUpdate(new Date())
    }

    refreshData()
    const interval = setInterval(refreshData, 15000)

    return () => clearInterval(interval)
  }, [drivers, trackId])


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
    <div className={`space-y-4 ${className}`}>
      {/* Live Data Header */}
      <div className="bg-gray-900 rounded-xl p-4 border border-white/5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Satellite className="w-5 h-5 text-racing-red" />
              <h3 className="text-lg font-bold text-white">Live Data Feed</h3>
            </div>
            <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? (isRealTime ? 'bg-green-500 animate-pulse' : 'bg-blue-500') : 'bg-red-500'}`}></div>
            <span className="text-xs text-gray-400">
              {isConnected ? (isRealTime ? 'Real-Time' : 'Simulated') : 'Disconnected'}
            </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Last Update</p>
            <p className="text-sm text-gray-400">{formatTimestamp(lastUpdate)}</p>
          </div>
        </div>

        {/* Live Data Ticker */}
        <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
          {liveData.map((item) => (
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
          ))}
        </div>

        {/* Live Stats Summary */}
        <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-xs text-gray-400">Active Drivers</p>
            <p className="text-lg font-bold text-racing-red">20</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400">Track Temp</p>
            <p className="text-lg font-bold text-orange-500">32°C</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400">Lap Count</p>
            <p className="text-lg font-bold text-blue-500">42/66</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400">Race Status</p>
            <p className="text-lg font-bold text-green-500">Live</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LiveDataTicker
