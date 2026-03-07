'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Satellite, Activity, Zap, TrendingUp, AlertCircle, Users, Trophy, Clock, Settings, Play, Pause, RotateCcw, BarChart3, Globe } from 'lucide-react'
import LiveFeedSection from '../components/LiveFeedSection'

export default function LiveFeedPage() {
  const [selectedTrack, setSelectedTrack] = useState('melbourne')
  const [drivers, setDrivers] = useState<string[]>([])

  // Mock drivers data
  useEffect(() => {
    const mockDrivers = [
      'Max Verstappen', 'Charles Leclerc', 'Lando Norris', 'Lewis Hamilton',
      'George Russell', 'Oscar Piastri', 'Carlos Sainz', 'Fernando Alonso',
      'Sergio Perez', 'Pierre Gasly', 'Esteban Ocon', 'Lance Stroll',
      'Valtteri Bottas', 'Guanyu Zhou', 'Nico Hülkenberg', 'Kevin Magnussen',
      'Alexander Albon', 'Logan Sargeant', 'Daniel Ricciardo', 'Yuki Tsunoda'
    ]
    setDrivers(mockDrivers)
  }, [])

  const tracks = [
    { id: 'melbourne', name: 'Australian GP', country: 'Australia' },
    { id: 'shanghai', name: 'Chinese GP', country: 'China' },
    { id: 'suzuka', name: 'Japanese GP', country: 'Japan' },
    { id: 'bahrain', name: 'Bahrain GP', country: 'Bahrain' },
    { id: 'jeddah', name: 'Saudi Arabian GP', country: 'Saudi Arabia' },
    { id: 'miami', name: 'Miami GP', country: 'USA' },
    { id: 'imola', name: 'Emilia Romagna GP', country: 'Italy' },
    { id: 'monaco', name: 'Monaco GP', country: 'Monaco' },
    { id: 'villeneuve', name: 'Canadian GP', country: 'Canada' },
    { id: 'catalunya', name: 'Spanish GP', country: 'Spain' },
    { id: 'redbull-ring', name: 'Austrian GP', country: 'Austria' },
    { id: 'silverstone', name: 'British GP', country: 'UK' },
    { id: 'hungaroring', name: 'Hungarian GP', country: 'Hungary' },
    { id: 'spa', name: 'Belgian GP', country: 'Belgium' },
    { id: 'zandvoort', name: 'Dutch GP', country: 'Netherlands' },
    { id: 'monza', name: 'Italian GP', country: 'Italy' },
    { id: 'baku', name: 'Azerbaijan GP', country: 'Azerbaijan' },
    { id: 'marina-bay', name: 'Singapore GP', country: 'Singapore' },
    { id: 'americas', name: 'United States GP', country: 'USA' },
    { id: 'rodriguez', name: 'Mexico City GP', country: 'Mexico' },
    { id: 'interlagos', name: 'São Paulo GP', country: 'Brazil' },
    { id: 'vegas', name: 'Las Vegas GP', country: 'USA' },
    { id: 'yas-marina', name: 'Abu Dhabi GP', country: 'UAE' }
  ]

  const getCountryFlag = (country: string) => {
    const flags: { [key: string]: string } = {
      'Monaco': '🇲🇨', 'UK': '🇬🇧', 'Belgium': '🇧🇪', 'Italy': '🇮🇹',
      'Spain': '🇪🇸', 'Austria': '🇦🇹', 'UAE': '🇦🇪', 'Brazil': '🇧🇷',
      'Bahrain': '🇧🇭', 'Saudi Arabia': '🇸🇦', 'USA': '🇺🇸', 'Hungary': '🇭🇺',
      'Netherlands': '🇳🇱', 'Singapore': '🇸🇬', 'Japan': '🇯🇵', 'China': '🇨🇳',
      'Azerbaijan': '🇦🇿', 'Australia': '🇦🇺', 'Canada': '🇨🇦', 'Mexico': '🇲🇽'
    }
    return flags[country] || '🏁'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="bg-gray-900/50 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                href="/f1"
                className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Back to F1</span>
              </Link>
              
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-racing-red rounded-lg shadow-lg shadow-racing-red/20">
                  <Satellite className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white">Live Feed Visualizations</h1>
                  <p className="text-gray-400">Real-time F1 Data Stream with Performance Controls</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-400 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                <Globe className="w-4 h-4 text-racing-blue" />
                <span>Global Feed</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Track Selector */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
            <Globe className="w-5 h-5 text-racing-blue" />
            <span>Select Track</span>
          </h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {tracks.map((track) => (
              <button
                key={track.id}
                onClick={() => setSelectedTrack(track.id)}
                className={`p-3 rounded-lg border transition-all text-left ${
                  selectedTrack === track.id
                    ? 'bg-racing-red/20 border-racing-red text-white'
                    : 'bg-gray-800/50 border-white/10 text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-lg">{getCountryFlag(track.country)}</span>
                  <span className="text-sm font-medium truncate">{track.name}</span>
                </div>
              </button>
            ))}
          </div>
          
          <div className="mt-4 flex items-center justify-between text-sm text-gray-400">
            <span>Current Track: <span className="text-white font-medium">{tracks.find(t => t.id === selectedTrack)?.name}</span></span>
            <span>Active Drivers: <span className="text-white font-medium">{drivers.length}</span></span>
          </div>
        </div>
      </div>

      {/* Live Feed Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <LiveFeedSection 
          trackId={selectedTrack}
          drivers={drivers}
          className="mb-8"
        />
        
        {/* Additional Info Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-racing-red" />
              <span>Feed Statistics</span>
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Update Frequency</span>
                <span className="text-white font-medium">Configurable</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Event Types</span>
                <span className="text-white font-medium">7 Categories</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Max Events</span>
                <span className="text-white font-medium">20 Events</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Performance Mode</span>
                <span className="text-green-500 font-medium">Optimized</span>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
              <Settings className="w-5 h-5 text-racing-blue" />
              <span>Control Features</span>
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Pause/Play</span>
                <span className="text-white font-medium">✓ Available</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Reset Feed</span>
                <span className="text-white font-medium">✓ Available</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Frequency Control</span>
                <span className="text-white font-medium">5s - 30s</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Performance Throttling</span>
                <span className="text-green-500 font-medium">✓ Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
