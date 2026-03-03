'use client'

import { useState, useMemo, lazy, Suspense } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { Car, Trophy, Zap, Target, Brain, Clock } from 'lucide-react'

// Lazy load non-critical components
const LazyFeatureCard = lazy(() => import('./components/FeatureCard'))

export default function HomePage() {
  const [selectedTrack, setSelectedTrack] = useState('cota')
  const [selectedRace, setSelectedRace] = useState('R1')
  const router = useRouter()

  // Memoize tracks array to prevent re-creation
  const tracks = useMemo(() => [
    { id: 'barber', name: 'Barber Motorsports Park', location: 'Alabama' },
    { id: 'cota', name: 'Circuit of the Americas', location: 'Texas' },
    { id: 'indianapolis', name: 'Indianapolis Motor Speedway', location: 'Indiana' },
    { id: 'road-america', name: 'Road America', location: 'Wisconsin' },
    { id: 'sebring', name: 'Sebring International Raceway', location: 'Florida' },
    { id: 'sonoma', name: 'Sonoma Raceway', location: 'California' },
    { id: 'vir', name: 'Virginia International Raceway', location: 'Virginia' }
  ], [])

  // Memoize features array
  const features = useMemo(() => [
    {
      icon: <Brain className="w-8 h-8 text-racing-red" />,
      title: '3-Lap Hindsight Predictor',
      description: 'AI forecasts lap deltas, tire wear, and fuel for next 3 laps with 89-95% accuracy'
    },
    {
      icon: <Clock className="w-8 h-8 text-racing-blue" />,
      title: 'Race Replay Timeline',
      description: 'Interactive race replay with real-time AI alerts and strategy validation'
    },
    {
      icon: <Target className="w-8 h-8 text-racing-red" />,
      title: 'Strategy Validator',
      description: '92% validation rate for pit calls and race decisions against actual outcomes'
    },
    {
      icon: <Zap className="w-8 h-8 text-racing-blue" />,
      title: 'AI Training Export',
      description: 'Generate actionable insights and PDF reports for driver improvement'
    }
  ], [])

  // Optimized navigation handlers
  const handleStartRaceReplay = () => {
    router.push('/dashboard')
  }

  const handleViewAnalytics = () => {
    router.push('/dashboard')
  }

  const handleF1Predictions = () => {
    router.push('/f1')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      {/* Header */}
      <header className="bg-black/50 backdrop-blur-sm border-b border-gray-700">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Car className="w-8 h-8 text-racing-red" />
              <h1 className="text-2xl font-bold">KobayashiAI</h1>
              <span className="text-sm text-gray-400">The Autonomous Co-Driver</span>
            </div>
            <div className="flex items-center space-x-4">
              <select 
                value={selectedTrack}
                onChange={(e) => setSelectedTrack(e.target.value)}
                className="bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-racing-red"
                title="Select Track"
              >
                {tracks.map(track => (
                  <option key={track.id} value={track.id}>
                    {track.name}
                  </option>
                ))}
              </select>
              <select 
                value={selectedRace}
                onChange={(e) => setSelectedRace(e.target.value)}
                className="bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-racing-red"
                title="Select Race"
              >
                <option value="R1">Race 1</option>
                <option value="R2">Race 2</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - Critical above-the-fold content */}
      <section className="py-20 px-6">
        <div className="container mx-auto text-center">
          <h2 className="text-5xl font-bold mb-6">
            The Autonomous Co-Driver That Thinks{' '}
            <span className="text-racing-red">3 Laps Ahead</span>
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            KobayashiAI replays Toyota GR Cup telemetry data to simulate strategy calls in real-time, 
            highlighting optimal decisions and validating them against actual race outcomes.
          </p>
          <div className="flex justify-center space-x-4">
            <button 
              onClick={handleStartRaceReplay}
              className="bg-racing-red hover:bg-red-700 px-8 py-3 rounded-lg font-semibold transition-colors transform hover:scale-105 active:scale-95"
            >
              Start Race Replay
            </button>
            <button 
              onClick={handleViewAnalytics}
              className="border border-gray-600 hover:border-gray-400 px-8 py-3 rounded-lg font-semibold transition-colors transform hover:scale-105 active:scale-95"
            >
              View Analytics
            </button>
            <button 
              onClick={handleF1Predictions}
              className="bg-racing-blue hover:bg-blue-700 px-8 py-3 rounded-lg font-semibold transition-colors transform hover:scale-105 active:scale-95"
            >
              F1 Predictions
            </button>
          </div>
        </div>
      </section>

      {/* Features Grid - Lazy loaded for performance */}
      <section className="py-16 px-6 bg-black/30">
        <div className="container mx-auto">
          <h3 className="text-3xl font-bold text-center mb-12">Core Features</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Suspense key={index} fallback={<div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 animate-pulse h-32"></div>}>
                <LazyFeatureCard 
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                />
              </Suspense>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section - Optimized with CSS Grid */}
      <section className="py-16 px-6">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="transform transition-transform duration-300 hover:scale-105">
              <div className="text-4xl font-bold text-racing-red mb-2">92%</div>
              <div className="text-gray-400">Strategy Validation Accuracy</div>
            </div>
            <div className="transform transition-transform duration-300 hover:scale-105">
              <div className="text-4xl font-bold text-racing-blue mb-2">7</div>
              <div className="text-gray-400">Toyota GR Cup Tracks</div>
            </div>
            <div className="transform transition-transform duration-300 hover:scale-105">
              <div className="text-4xl font-bold text-racing-red mb-2">3</div>
              <div className="text-gray-400">Lap Prediction Horizon</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/50 border-t border-gray-700 py-8 px-6">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Trophy className="w-5 h-5 text-racing-red" />
            <span className="text-sm text-gray-400">
              Built with ❤️ for Toyota Gazoo Racing • Powered by Real GR Cup Data
            </span>
          </div>
          <p className="text-xs text-gray-500">
            Toyota GR Cup Hackathon 2025 - Wildcard Submission
          </p>
        </div>
      </footer>
    </div>
  )
}
