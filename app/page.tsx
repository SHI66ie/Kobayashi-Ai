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
          const colorClasses: Record<string, string> = {
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
              { name: 'Chinese Grand Prix', location: 'Shanghai', date: 'Mar 15, 2026', days: '2 days' },
              { name: 'Japanese Grand Prix', location: 'Suzuka', date: 'Mar 29, 2026', days: '16 days' },
              { name: 'Bahrain Grand Prix', location: 'Sakhir', date: 'Apr 12, 2026', days: '30 days' }
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
