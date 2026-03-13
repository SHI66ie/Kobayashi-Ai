'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, 
  BarChart3, 
  Settings, 
  Activity, 
  Zap, 
  Target, 
  TrendingUp,
  Menu,
  X,
  ChevronDown,
  Users,
  Globe,
  Shield,
  Database
} from 'lucide-react'

interface DashboardLayoutProps {
  children: React.ReactNode
}

const navigationItems = [
  {
    category: 'Main',
    items: [
      { name: 'Dashboard', href: '/', icon: Home, description: 'Overview & Quick Stats' },
      { name: 'F1 Analytics', href: '/f1', icon: BarChart3, description: 'F1 Racing Analysis' },
    ]
  },
  {
    category: 'Analytics',
    items: [
      { name: 'Performance', href: '/performance', icon: TrendingUp, description: 'Performance Metrics' },
      { name: 'Telemetry', href: '/telemetry', icon: Activity, description: 'Live Telemetry Data' },
      { name: 'Strategy', href: '/strategy', icon: Target, description: 'Race Strategy' },
    ]
  },
  {
    category: 'Tools',
    items: [
      { name: 'AI Coach', href: '/ai-coach', icon: Zap, description: 'AI-Powered Coaching' },
      { name: 'Data Sources', href: '/data', icon: Database, description: 'Data Management' },
      { name: 'Settings', href: '/settings', icon: Settings, description: 'System Settings' },
    ]
  }
]

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['Main', 'Analytics'])
  const pathname = usePathname()

  useEffect(() => {
    // Close sidebar on route change on mobile
    if (window.innerWidth < 768) {
      setSidebarOpen(false)
    }
  }, [pathname])

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  const isActiveRoute = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden bg-gray-900/50 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
        transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">KobayashiAI</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Racing Analytics</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
            {navigationItems.map((category) => (
              <div key={category.category}>
                <button
                  onClick={() => toggleCategory(category.category)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <span>{category.category}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${expandedCategories.includes(category.category) ? 'rotate-180' : ''}`} />
                </button>
                
                {expandedCategories.includes(category.category) && (
                  <div className="mt-2 space-y-1">
                    {category.items.map((item) => {
                      const Icon = item.icon
                      const active = isActiveRoute(item.href)
                      
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={`
                            group flex items-center px-3 py-2.5 rounded-lg transition-all duration-200
                            ${active 
                              ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-l-4 border-red-600' 
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:translate-x-1'
                            }
                          `}
                        >
                          <div className={`
                            flex items-center justify-center w-10 h-10 rounded-lg mr-3
                            ${active 
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' 
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 group-hover:bg-gray-200 dark:group-hover:bg-gray-600'
                            }
                          `}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium">{item.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.description}</p>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-4 text-white">
              <div className="flex items-center mb-2">
                <Shield className="w-5 h-5 mr-2" />
                <span className="font-medium text-sm">Pro Features</span>
              </div>
              <p className="text-xs opacity-90 mb-3">Unlock advanced analytics and AI coaching</p>
              <button className="w-full bg-white/20 hover:bg-white/30 rounded-lg py-2 text-xs font-medium transition-colors">
                Upgrade Now
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 lg:ml-0">
        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Menu className="w-5 h-5 text-gray-500" />
            </button>

            {/* Search Bar */}
            <div className="flex-1 max-w-lg mx-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search drivers, races, analytics..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                <BarChart3 className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
              </div>
            </div>

            {/* Right side items */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <Activity className="w-5 h-5 text-gray-500" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* User Menu */}
              <div className="flex items-center space-x-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Admin User</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Premium Plan</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1">
          <div className="p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
