'use client'

import React, { useState, useEffect } from 'react'
import { Brain, Sparkles, TrendingUp, Target, Zap, Activity, BarChart3, Settings, MessageSquare, Trophy, Gauge, Wind, Droplets } from 'lucide-react'
import F1AIChat from '../components/F1AIChat'
import AIToolsPanel from '../components/AIToolsPanel'
import AdvancedAIPanel from '../components/AdvancedAIPanel'

export default function AICoachPage() {
  const [activeSection, setActiveSection] = useState<'chat' | 'tools' | 'advanced'>('chat')
  const [raceData, setRaceData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading race data
    const mockRaceData = {
      lapTimes: Array.from({ length: 50 }, (_, i) => ({
        lap: i + 1,
        time: 95 + Math.random() * 5,
        driver: 'Max Verstappen',
        position: Math.floor(Math.random() * 10) + 1
      })),
      weather: {
        temperature: 25,
        humidity: 60,
        windSpeed: 10,
        trackTemp: 35,
        condition: 'dry'
      },
      track: 'Monaco',
      race: 'Monaco Grand Prix',
      tireCompound: 'C3',
      trackCondition: 'dry',
      telemetry: {
        speed: 280,
        rpm: 15000,
        throttle: 85,
        brake: 15,
        drs: false
      }
    }

    setTimeout(() => {
      setRaceData(mockRaceData)
      setLoading(false)
    }, 1000)
  }, [])

  const aiFeatures = [
    {
      id: 'chat',
      title: 'AI Race Analyst',
      description: 'Ask questions about race strategy, tire compounds, and driver performance',
      icon: MessageSquare,
      color: 'from-blue-500 to-purple-600'
    },
    {
      id: 'tools',
      title: 'AI Prediction Tools',
      description: 'Advanced race predictions and performance analysis',
      icon: TrendingUp,
      color: 'from-green-500 to-teal-600'
    },
    {
      id: 'advanced',
      title: 'Advanced AI Analytics',
      description: 'Deep insights with machine learning models',
      icon: Brain,
      color: 'from-red-500 to-orange-600'
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-racing-red mx-auto mb-4"></div>
          <p className="text-gray-400">Loading AI Systems...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      {/* Header */}
      <div className="bg-black/50 backdrop-blur-md border-b border-racing-red/30">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-racing-red to-red-700 rounded-xl">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">KobayashiAI Coach</h1>
                <p className="text-gray-400">Advanced F1 Analytics & Strategy Assistant</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2 px-3 py-1 bg-green-500/20 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-400 text-sm">AI Systems Online</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Tabs */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {aiFeatures.map((feature) => {
            const Icon = feature.icon
            return (
              <button
                key={feature.id}
                onClick={() => setActiveSection(feature.id as any)}
                className={`p-6 rounded-xl border transition-all duration-200 ${
                  activeSection === feature.id
                    ? 'bg-gradient-to-r ' + feature.color + ' text-white border-transparent shadow-lg'
                    : 'bg-gray-800/50 border-gray-700 text-gray-300 hover:border-racing-red/50 hover:shadow-lg'
                }`}
              >
                <div className="flex items-center space-x-4 mb-4">
                  <div className={`p-3 rounded-lg ${activeSection === feature.id ? 'bg-white/20' : 'bg-gray-700'}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-lg">{feature.title}</h3>
                    <p className={`text-sm ${activeSection === feature.id ? 'text-white/80' : 'text-gray-400'}`}>
                      {feature.description}
                    </p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* AI Content Sections */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
          {activeSection === 'chat' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center">
                    <MessageSquare className="w-6 h-6 mr-3 text-racing-red" />
                    AI Race Analyst Chat
                  </h2>
                  <p className="text-gray-400">Get expert insights on race strategy, tire compounds, and driver performance</p>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-400">
                  <div className="flex items-center space-x-2">
                    <Wind className="w-4 h-4" />
                    <span>Track: {raceData?.trackTemp || 35}°C</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Droplets className="w-4 h-4" />
                    <span>Humidity: {raceData?.weather?.humidity || 60}%</span>
                  </div>
                </div>
              </div>
              <div className="h-[600px]">
                <F1AIChat contextData={raceData} />
              </div>
            </div>
          )}

          {activeSection === 'tools' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center">
                    <TrendingUp className="w-6 h-6 mr-3 text-green-500" />
                    AI Prediction Tools
                  </h2>
                  <p className="text-gray-400">Advanced race predictions and performance analysis</p>
                </div>
              </div>
              <AIToolsPanel 
                raceData={raceData} 
                track={raceData?.track || 'Monaco'} 
                race={raceData?.race || 'Monaco Grand Prix'}
                simulatedWeather={raceData?.weather}
              />
            </div>
          )}

          {activeSection === 'advanced' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center">
                    <Brain className="w-6 h-6 mr-3 text-orange-500" />
                    Advanced AI Analytics
                  </h2>
                  <p className="text-gray-400">Deep insights with machine learning models</p>
                </div>
              </div>
              <AdvancedAIPanel 
                raceData={raceData} 
                track={raceData?.track || 'Monaco'} 
                race={raceData?.race || 'Monaco Grand Prix'}
              />
            </div>
          )}
        </div>

        {/* AI Status Panel */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-5 h-5 text-racing-red" />
              <span className="text-xs text-green-400">Active</span>
            </div>
            <p className="text-sm text-gray-400">Race Analysis</p>
            <p className="text-lg font-bold text-white">Real-time</p>
          </div>
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-5 h-5 text-blue-500" />
              <span className="text-xs text-green-400">Active</span>
            </div>
            <p className="text-sm text-gray-400">Predictions</p>
            <p className="text-lg font-bold text-white">95% Accuracy</p>
          </div>
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Gauge className="w-5 h-5 text-green-500" />
              <span className="text-xs text-green-400">Active</span>
            </div>
            <p className="text-sm text-gray-400">Performance</p>
            <p className="text-lg font-bold text-white">Optimized</p>
          </div>
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              <span className="text-xs text-green-400">Active</span>
            </div>
            <p className="text-sm text-gray-400">AI Models</p>
            <p className="text-lg font-bold text-white">12 Running</p>
          </div>
        </div>
      </div>
    </div>
  )
}
