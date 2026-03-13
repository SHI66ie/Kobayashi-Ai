'use client'

import React, { useState, useEffect } from 'react'
import { Trophy, Globe, Users, ChevronRight, Download, RefreshCw, Filter, Search } from 'lucide-react'
import { useF1Standings } from '../../hooks/useF1Standings'

export default function StandingsPage() {
  const [activeTab, setActiveTab] = useState<'drivers' | 'constructors'>('drivers')
  const [searchTerm, setSearchTerm] = useState('')
  const [showAll, setShowAll] = useState(false)
  
  const { 
    driverStandings, 
    constructorStandings, 
    loading, 
    error, 
    lastUpdated, 
    refetch 
  } = useF1Standings('2026')

  const filteredDrivers = driverStandings.filter(driver => 
    driver.driver.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.team.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredConstructors = constructorStandings.filter(constructor =>
    constructor.team.toLowerCase().includes(searchTerm.toLowerCase()) ||
    constructor.drivers.some(driver => driver.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const displayDrivers = showAll ? filteredDrivers : filteredDrivers.slice(0, 10)
  const displayConstructors = showAll ? filteredConstructors : filteredConstructors.slice(0, 10)

  const exportStandings = () => {
    const data = activeTab === 'drivers' ? driverStandings : constructorStandings
    const csvContent = activeTab === 'drivers' 
      ? 'Position,Driver,Team,Nationality,Points,Wins,Podiums\n' + 
        driverStandings.map(d => 
          `${d.position},${d.driver},${d.team},${d.nationality},${d.points},${d.wins},${d.podiums}`
        ).join('\n')
      : 'Position,Team,Nationality,Points,Wins,Podiums,Drivers\n' +
        constructorStandings.map(c => 
          `${c.position},${c.team},${c.nationality},${c.points},${c.wins},${c.podiums},${c.drivers.join(' & ')}`
        ).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `f1-standings-${activeTab}-2026.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      {/* Header */}
      <div className="bg-black/50 backdrop-blur-md border-b border-racing-red/30">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-racing-red to-red-700 rounded-xl">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">F1 Championship Standings</h1>
                <p className="text-gray-400">2026 Season - Complete Rankings</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => refetch()}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-racing-red text-white rounded-lg hover:bg-racing-red/80 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              <button
                onClick={exportStandings}
                className="flex items-center space-x-2 px-4 py-2 bg-racing-blue text-white rounded-lg hover:bg-racing-blue/80 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="container mx-auto px-4 py-6">
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Tab Switcher */}
            <div className="flex space-x-2 bg-gray-900/50 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('drivers')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'drivers' 
                    ? 'bg-racing-red text-white' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                Drivers
              </button>
              <button
                onClick={() => setActiveTab('constructors')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'constructors' 
                    ? 'bg-racing-blue text-white' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                Constructors
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search drivers or teams..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-racing-red w-full md:w-64"
              />
            </div>

            {/* Show All Toggle */}
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <button
                onClick={() => setShowAll(!showAll)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  showAll 
                    ? 'bg-green-600/20 text-green-400 border border-green-600/30' 
                    : 'bg-gray-700/50 text-gray-400 border border-gray-700 hover:bg-gray-700'
                }`}
              >
                {showAll ? 'Show All' : 'Top 10'}
              </button>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>Last Updated: {lastUpdated ? new Date(lastUpdated).toLocaleString() : 'Never'}</span>
            {error && (
              <span className="text-red-400 flex items-center space-x-2">
                <span>⚠️ {error}</span>
                <button onClick={refetch} className="text-racing-red hover:text-racing-red/80 underline">
                  Retry
                </button>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Standings Content */}
      <div className="container mx-auto px-4 pb-8">
        {activeTab === 'drivers' && (
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-900/50 border-b border-gray-700">
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Pos</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Driver</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Team</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Nationality</th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">Points</th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">Wins</th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">Podiums</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i} className="border-b border-gray-700/50">
                        <td className="px-6 py-4">
                          <div className="w-8 h-8 bg-gray-700 rounded-full animate-pulse"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-gray-700 rounded w-32 animate-pulse"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-gray-700 rounded w-32 animate-pulse"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-gray-700 rounded w-24 animate-pulse"></div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="h-4 bg-gray-700 rounded w-16 animate-pulse"></div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="h-4 bg-gray-700 rounded w-12 animate-pulse"></div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    displayDrivers.map((driver) => (
                      <tr key={driver.position} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            driver.position === 1 ? 'bg-yellow-500 text-white' :
                            driver.position === 2 ? 'bg-gray-400 text-white' :
                            driver.position === 3 ? 'bg-orange-600 text-white' :
                            'bg-gray-700 text-gray-300'
                          }`}>
                            {driver.position}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <span className="text-lg">{driver.countryFlag}</span>
                            <div>
                              <p className="font-medium text-white">{driver.driver}</p>
                              <p className="text-xs text-gray-400">{driver.driverCode}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-gray-300">{driver.team}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-gray-300">{driver.nationality}</p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <p className="text-xl font-bold text-white">{driver.points}</p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <p className="text-gray-300">{driver.wins}</p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <p className="text-gray-300">{driver.podiums}</p>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {!showAll && filteredDrivers.length > 10 && (
              <div className="p-6 text-center">
                <button
                  onClick={() => setShowAll(true)}
                  className="px-6 py-3 bg-racing-red text-white rounded-lg hover:bg-racing-red/80 transition-colors"
                >
                  Show All {filteredDrivers.length} Drivers <ChevronRight className="inline-block ml-2 w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'constructors' && (
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-900/50 border-b border-gray-700">
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Pos</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Team</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Nationality</th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">Points</th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">Wins</th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">Podiums</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Drivers</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i} className="border-b border-gray-700/50">
                        <td className="px-6 py-4">
                          <div className="w-8 h-8 bg-gray-700 rounded-full animate-pulse"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-gray-700 rounded w-32 animate-pulse"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-gray-700 rounded w-32 animate-pulse"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-gray-700 rounded w-24 animate-pulse"></div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="h-4 bg-gray-700 rounded w-16 animate-pulse"></div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="h-4 bg-gray-700 rounded w-12 animate-pulse"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-gray-700 rounded w-32 animate-pulse"></div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    displayConstructors.map((constructor) => (
                      <tr key={constructor.position} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            constructor.position === 1 ? 'bg-yellow-500 text-white' :
                            constructor.position === 2 ? 'bg-gray-400 text-white' :
                            constructor.position === 3 ? 'bg-orange-600 text-white' :
                            'bg-gray-700 text-gray-300'
                          }`}>
                            {constructor.position}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <span className="text-lg">{constructor.countryFlag}</span>
                            <p className="font-medium text-white">{constructor.team}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-gray-300">{constructor.nationality}</p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <p className="text-xl font-bold text-white">{constructor.points}</p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <p className="text-gray-300">{constructor.wins}</p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <p className="text-gray-300">{constructor.podiums}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-gray-300 text-sm">
                            {constructor.drivers.join(', ')}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {!showAll && filteredConstructors.length > 10 && (
              <div className="p-6 text-center">
                <button
                  onClick={() => setShowAll(true)}
                  className="px-6 py-3 bg-racing-blue text-white rounded-lg hover:bg-racing-blue/80 transition-colors"
                >
                  Show All {filteredConstructors.length} Teams <ChevronRight className="inline-block ml-2 w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
