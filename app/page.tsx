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
      {/* Header - Mobile Optimized */}
      <header className="bg-black/50 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4">
          <div className="flex flex-col space-y-3 sm:space-y-0">
            {/* Logo and Title */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <Car className="w-6 h-6 sm:w-8 sm:h-8 text-racing-red" />
                <div>
                  <h1 className="text-lg sm:text-xl md:text-2xl font-bold">KobayashiAI</h1>
                  <span className="text-[9px] sm:text-[10px] md:text-sm text-gray-400 block -mt-1 uppercase tracking-wider font-semibold">The Autonomous Co-Driver</span>
                </div>
              </div>
            </div>
            
            {/* Controls Row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 md:space-x-4">
              <select
                value={selectedTrack}
                onChange={(e) => setSelectedTrack(e.target.value)}
                className="bg-gray-800 border border-gray-600 rounded px-2 py-2 sm:px-3 sm:py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-racing-red w-full sm:w-auto"
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
                className="bg-gray-800 border border-gray-600 rounded px-2 py-2 sm:px-3 sm:py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-racing-red w-full sm:w-auto"
                title="Select Race"
              >
                <option value="R1">Race 1</option>
                <option value="R2">Race 2</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - Mobile Optimized */}
      <section className="py-8 sm:py-10 md:py-12 lg:py-20 px-3 sm:px-4 md:px-6">
        <div className="container mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-4 sm:mb-6 leading-tight tracking-tight px-2">
            The Autonomous Co-Driver That Thinks{' '}
            <span className="text-racing-red block sm:inline">3 Laps Ahead</span>
          </h2>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-300 mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed px-4">
            KobayashiAI replays Toyota GR Cup telemetry data to simulate strategy calls in real-time,
            highlighting optimal decisions and validating them against actual race outcomes.
          </p>
          <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 md:space-x-4 justify-center items-stretch px-4">
            <button
              onClick={handleStartRaceReplay}
              className="bg-racing-red hover:bg-red-700 px-4 py-3 sm:px-6 sm:py-3.5 rounded-lg font-bold transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-racing-red/20 text-sm sm:text-base mobile-tap-target"
            >
              Start Race Replay
            </button>
            <button
              onClick={handleViewAnalytics}
              className="border border-gray-600 hover:border-gray-400 px-4 py-3 sm:px-6 sm:py-3.5 rounded-lg font-bold transition-all transform hover:scale-105 active:scale-95 bg-white/5 text-sm sm:text-base mobile-tap-target"
            >
              View Analytics
            </button>
            <button
              onClick={handleF1Predictions}
              className="bg-racing-blue hover:bg-blue-700 px-4 py-3 sm:px-6 sm:py-3.5 rounded-lg font-bold transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-racing-blue/20 text-sm sm:text-base mobile-tap-target"
            >
              F1 Hub
            </button>
          </div>
        </div>
      </section>

      {/* Features Grid - Mobile First */}
      <section className="py-8 sm:py-12 md:py-16 px-3 sm:px-4 md:px-6 bg-black/30">
        <div className="container mx-auto">
          <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-6 sm:mb-8 md:mb-12">Core Features</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
            {features.map((feature, index) => (
              <Suspense key={index} fallback={<div className="bg-gray-800/50 p-4 sm:p-6 rounded-lg border border-gray-700 animate-pulse h-32"></div>}>
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

      {/* Stats Section - Mobile Responsive */}
      <section className="py-8 sm:py-12 md:py-16 px-3 sm:px-4 md:px-6">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 md:gap-8 text-center bg-gray-900/50 p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl border border-gray-800">
            <div className="transform transition-transform duration-300 hover:scale-105 py-4 sm:py-0">
              <div className="text-3xl sm:text-4xl md:text-5xl font-black text-racing-red mb-2">92%</div>
              <div className="text-xs sm:text-sm text-gray-400 uppercase font-bold tracking-widest">Accuracy</div>
            </div>
            <div className="transform transition-transform duration-300 hover:scale-105 border-y sm:border-y-0 sm:border-x border-gray-800 py-4 sm:py-0">
              <div className="text-3xl sm:text-4xl md:text-5xl font-black text-racing-blue mb-2">7</div>
              <div className="text-xs sm:text-sm text-gray-400 uppercase font-bold tracking-widest">Tracks</div>
            </div>
            <div className="transform transition-transform duration-300 hover:scale-105 py-4 sm:py-0">
              <div className="text-3xl sm:text-4xl md:text-5xl font-black text-racing-red mb-2">3</div>
              <div className="text-xs sm:text-sm text-gray-400 uppercase font-bold tracking-widest">Lap Prediction</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Mobile Optimized */}
      <footer className="bg-black/90 border-t border-gray-800 py-8 sm:py-10 px-3 sm:px-4 md:px-6">
        <div className="container mx-auto text-center">
          <div className="flex flex-col items-center justify-center space-y-3 sm:space-y-4 mb-4 sm:mb-6">
            <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-racing-red" />
            <span className="text-xs sm:text-sm text-gray-400 max-w-xs md:max-w-none leading-relaxed px-4">
              Built with ❤️ for Toyota Gazoo Racing • Powered by Real GR Cup Data
            </span>
          </div>
          <p className="text-[9px] sm:text-xs text-gray-600 uppercase tracking-widest font-bold px-4">
            Toyota GR Cup 2025 - Wildcard Submission
          </p>
        </div>
      </footer>
    </div>

  )
}
