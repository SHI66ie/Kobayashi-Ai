'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { 
  BarChart3, 
  TrendingUp, 
  Activity, 
  Target, 
  Zap, 
  Users, 
  Globe,
  ArrowRight,
  Clock,
  Award,
  Shield,
  Database
} from 'lucide-react'

export default function HomePage() {
  const [selectedMetric, setSelectedMetric] = useState('overview')

  // Quick stats data
  const quickStats = useMemo(() => [
    { 
      label: 'Active Sessions', 
      value: '12', 
      change: '+3', 
      icon: Activity,
      color: 'blue'
    },
    { 
      label: 'Drivers Tracked', 
      value: '48', 
      change: '+12', 
      icon: Users,
      color: 'green'
    },
    { 
      label: 'Accuracy Rate', 
      value: '94.2%', 
      change: '+2.1%', 
      icon: Target,
      color: 'purple'
    },
    { 
      label: 'Data Points', 
      value: '2.4M', 
      change: '+180K', 
      icon: Database,
      color: 'orange'
    }
  ], [])

  // Recent activities
  const recentActivities = useMemo(() => [
    {
      id: 1,
      type: 'race_analysis',
      title: 'Monaco GP Analysis Complete',
      description: 'Strategy validation shows 92% accuracy',
      time: '2 hours ago',
      icon: BarChart3
    },
    {
      id: 2,
      type: 'driver_update',
      title: 'New Telemetry Data Available',
      description: 'Max Verstappen - Practice Session 3',
      time: '4 hours ago',
      icon: Activity
    },
    {
      id: 3,
      type: 'ai_insight',
      title: 'AI Strategy Recommendation',
      description: 'Optimal pit window calculated for Ferrari',
      time: '6 hours ago',
      icon: Zap
    },
    {
      id: 4,
      type: 'performance',
      title: 'Performance Report Generated',
      description: 'Weekly driver performance summary',
      time: '1 day ago',
      icon: TrendingUp
    }
  ], [])

  // Quick actions
  const quickActions = useMemo(() => [
    {
      title: 'Start Race Analysis',
      description: 'Analyze current race data and strategies',
      href: '/f1',
      icon: BarChart3,
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'View Live Telemetry',
      description: 'Monitor real-time car performance data',
      href: '/telemetry',
      icon: Activity,
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'AI Strategy Coach',
      description: 'Get AI-powered racing recommendations',
      href: '/ai-coach',
      icon: Zap,
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: 'Performance Metrics',
      description: 'Detailed driver and team performance',
      href: '/performance',
      icon: TrendingUp,
      color: 'from-orange-500 to-orange-600'
    }
  ], [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Welcome back! Here's what's happening with your racing analytics today.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
            Export Report
          </button>
          <button className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">
            New Analysis
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat) => {
          const Icon = stat.icon
          const colorClasses = {
            blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
            green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
            purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
            orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
          }
          
          return (
            <div key={stat.label} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${colorClasses[stat.color]}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-green-600 dark:text-green-400 font-medium">{stat.change}</span>
                <span className="text-gray-500 dark:text-gray-400 ml-2">from last week</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Actions</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Jump into your most used features</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {quickActions.map((action) => {
                  const Icon = action.icon
                  return (
                    <Link
                      key={action.title}
                      href={action.href}
                      className="group relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200"
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-10 transition-opacity`}></div>
                      <div className="relative p-6">
                        <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${action.color} text-white mb-4`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{action.title}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{action.description}</p>
                        <div className="flex items-center text-sm font-medium text-red-600 dark:text-red-400 group-hover:text-red-700 dark:group-hover:text-red-300">
                          Get Started
                          <ArrowRight className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Latest updates and insights</p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentActivities.map((activity) => {
                  const Icon = activity.icon
                  return (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="inline-flex p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                          <Icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.title}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{activity.description}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{activity.time}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
              <button className="w-full mt-6 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300">
                View All Activity
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Performance Overview</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Key metrics and trends</p>
            </div>
            <div className="flex space-x-2">
              {['overview', 'drivers', 'teams', 'races'].map((metric) => (
                <button
                  key={metric}
                  onClick={() => setSelectedMetric(metric)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg capitalize transition-colors ${
                    selectedMetric === metric
                      ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  {metric}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-700/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 font-medium">Performance Chart</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Interactive charts will appear here
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Races */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Upcoming Races</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Next F1 races on the calendar</p>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {[
              { name: 'Australian Grand Prix', location: 'Melbourne', date: 'Mar 16, 2025', days: '3 days' },
              { name: 'Chinese Grand Prix', location: 'Shanghai', date: 'Mar 23, 2025', days: '10 days' },
              { name: 'Japanese Grand Prix', location: 'Suzuka', date: 'Apr 6, 2025', days: '24 days' }
            ].map((race, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                    <Globe className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{race.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{race.location} • {race.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-red-600 dark:text-red-400">{race.days}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">to go</p>
                </div>
              </div>
            ))}
          </div>
          <Link
            href="/f1"
            className="w-full mt-6 flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
          >
            View Full Race Calendar
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>
      </div>
    </div>
  )
}

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

  const handleLiveFeed = () => {
    router.push('/live-feed')
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
            <button
              onClick={handleLiveFeed}
              className="bg-gradient-to-r from-racing-red to-racing-blue hover:from-red-600 hover:to-blue-700 px-4 py-3 sm:px-6 sm:py-3.5 rounded-lg font-bold transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-racing-red/20 text-sm sm:text-base mobile-tap-target"
            >
              Live Feed
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
