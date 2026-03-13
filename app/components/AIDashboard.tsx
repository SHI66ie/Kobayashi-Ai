'use client'

import React, { useState, useEffect } from 'react'
import { Brain, MessageSquare, TrendingUp, Activity, Zap, Target, Wind, Droplets, Gauge, BarChart3, Cpu, Eye, Navigation } from 'lucide-react'
import F1AIChat from './F1AIChat'
import AIToolsPanel from './AIToolsPanel'
import AdvancedAIPanel from './AdvancedAIPanel'

interface AIDashboardProps {
  raceData: any
  track: string
  race: string
}

export default function AIDashboard({ raceData, track, race }: AIDashboardProps) {
  const [activeTab, setActiveTab] = useState<'chat' | 'tools' | 'advanced'>('chat')
  const [aiStatus, setAiStatus] = useState<'online' | 'offline' | 'processing'>('online')
  const [contextData, setContextData] = useState<any>(null)

  useEffect(() => {
    // Prepare enhanced context data for AI components
    const enhancedContext = {
      ...raceData,
      track,
      race,
      trackTemp: raceData?.weather?.trackTemp || 35,
      airTemp: raceData?.weather?.airTemp || 25,
      humidity: raceData?.weather?.humidity || 60,
      windSpeed: raceData?.weather?.windSpeed || 10,
      trackCondition: 'dry',
      tireCompound: 'C3',
      currentDriver: 'Max Verstappen',
      position: 1,
      telemetry: raceData?.telemetry || {
        speed: 280,
        rpm: 15000,
        throttle: 85,
        brake: 15,
        drs: false
      }
    }
    setContextData(enhancedContext)
  }, [raceData, track, race])

  const aiFeatures = [
    {
      id: 'chat',
      title: 'AI Race Analyst',
      description: 'Ask questions about race strategy, tire compounds, and driver performance',
      icon: MessageSquare,
      color: 'from-blue-500 to-purple-600',
      capabilities: ['Real-time Analysis', 'Tire Strategy', 'Driver Insights', 'Track Conditions']
    },
    {
      id: 'tools',
      title: 'AI Prediction Tools',
      description: 'Advanced race predictions and performance analysis',
      icon: TrendingUp,
      color: 'from-green-500 to-teal-600',
      capabilities: ['Race Predictions', 'Performance Analysis', 'Strategy Optimization', 'Risk Assessment']
    },
    {
      id: 'advanced',
      title: 'Advanced AI Analytics',
      description: 'Deep insights with machine learning models',
      icon: Brain,
      color: 'from-red-500 to-orange-600',
      capabilities: ['Telemetry Analysis', 'Autonomous Systems', 'Safety Monitoring', 'Comprehensive Reports']
    }
  ]

  const renderStatusIndicator = () => (
    <div className="flex items-center space-x-2">
      <div className={`w-2 h-2 rounded-full ${
        aiStatus === 'online' ? 'bg-green-500 animate-pulse' :
        aiStatus === 'processing' ? 'bg-yellow-500 animate-pulse' :
        'bg-red-500'
      }`}></div>
      <span className={`text-xs font-medium ${
        aiStatus === 'online' ? 'text-green-400' :
        aiStatus === 'processing' ? 'text-yellow-400' :
        'text-red-400'
      }`}>
        {aiStatus === 'online' ? 'AI Systems Online' :
         aiStatus === 'processing' ? 'Processing...' :
         'AI Systems Offline'}
      </span>
    </div>
  )

  const renderLiveMetrics = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
        <div className="flex items-center justify-between mb-1">
          <Wind className="w-4 h-4 text-blue-400" />
          <span className="text-xs text-gray-400">Track Temp</span>
        </div>
        <p className="text-lg font-bold text-white">{contextData?.trackTemp || 35}°C</p>
      </div>
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
        <div className="flex items-center justify-between mb-1">
          <Droplets className="w-4 h-4 text-cyan-400" />
          <span className="text-xs text-gray-400">Humidity</span>
        </div>
        <p className="text-lg font-bold text-white">{contextData?.humidity || 60}%</p>
      </div>
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
        <div className="flex items-center justify-between mb-1">
          <Gauge className="w-4 h-4 text-green-400" />
          <span className="text-xs text-gray-400">Speed</span>
        </div>
        <p className="text-lg font-bold text-white">{contextData?.telemetry?.speed || 280} km/h</p>
      </div>
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
        <div className="flex items-center justify-between mb-1">
          <Target className="w-4 h-4 text-red-400" />
          <span className="text-xs text-gray-400">Position</span>
        </div>
        <p className="text-lg font-bold text-white">P{contextData?.position || 1}</p>
      </div>
    </div>
  )

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
                <h1 className="text-3xl font-bold text-white">KobayashiAI Dashboard</h1>
                <p className="text-gray-400">Advanced F1 Analytics & Strategy Assistant</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {renderStatusIndicator()}
            </div>
          </div>
        </div>
      </div>

      {/* Live Metrics */}
      <div className="container mx-auto px-4 py-6">
        {renderLiveMetrics()}
      </div>

      {/* AI Feature Tabs */}
      <div className="container mx-auto px-4 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {aiFeatures.map((feature) => {
            const Icon = feature.icon
            return (
              <button
                key={feature.id}
                onClick={() => setActiveTab(feature.id as any)}
                className={`p-6 rounded-xl border transition-all duration-200 ${
                  activeTab === feature.id
                    ? 'bg-gradient-to-r ' + feature.color + ' text-white border-transparent shadow-lg'
                    : 'bg-gray-800/50 border-gray-700 text-gray-300 hover:border-racing-red/50 hover:shadow-lg'
                }`}
              >
                <div className="flex items-center space-x-4 mb-4">
                  <div className={`p-3 rounded-lg ${activeTab === feature.id ? 'bg-white/20' : 'bg-gray-700'}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-lg">{feature.title}</h3>
                    <p className={`text-sm ${activeTab === feature.id ? 'text-white/80' : 'text-gray-400'}`}>
                      {feature.description}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {feature.capabilities.map((cap, i) => (
                    <span
                      key={i}
                      className={`text-xs px-2 py-1 rounded-full ${
                        activeTab === feature.id 
                          ? 'bg-white/20 text-white' 
                          : 'bg-gray-700 text-gray-400'
                      }`}
                    >
                      {cap}
                    </span>
                  ))}
                </div>
              </button>
            )
          })}
        </div>

        {/* AI Content Sections */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6 min-h-[600px]">
          {activeTab === 'chat' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center">
                    <MessageSquare className="w-6 h-6 mr-3 text-racing-red" />
                    AI Race Analyst Chat
                  </h2>
                  <p className="text-gray-400">Get expert insights on race strategy, tire compounds, and driver performance</p>
                </div>
              </div>
              <div className="h-[500px]">
                <F1AIChat contextData={contextData} />
              </div>
            </div>
          )}

          {activeTab === 'tools' && (
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
                raceData={contextData} 
                track={track} 
                race={race}
                simulatedWeather={contextData?.weather}
              />
            </div>
          )}

          {activeTab === 'advanced' && (
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
                raceData={contextData} 
                track={track} 
                race={race}
                simulatedWeather={contextData?.weather}
              />
            </div>
          )}
        </div>

        {/* AI System Status */}
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
              <Zap className="w-5 h-5 text-purple-500" />
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
