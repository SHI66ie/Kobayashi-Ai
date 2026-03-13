'use client'

import React, { useState, useEffect } from 'react'
import { 
  Database, 
  Globe, 
  Folder, 
  Zap, 
  RefreshCcw, 
  Search, 
  Trash2, 
  Download, 
  CheckCircle, 
  AlertCircle,
  Activity,
  HardDrive,
  Cpu,
  Unlink,
  ExternalLink
} from 'lucide-react'

export default function DataCenter() {
  const [activeTab, setActiveTab] = useState<'sources' | 'cache' | 'hybrid'>('sources')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const dataSources = [
    { 
      name: 'OpenF1 API', 
      type: 'Real-time', 
      status: 'Connected', 
      latency: '42ms', 
      endpoint: 'api.openf1.org',
      description: 'Live car telemetry, lap times, and track-side weather.',
      icon: Activity,
      color: 'text-green-500' 
    },
    { 
      name: 'trddev.com Cloud Storage', 
      type: 'Historical', 
      status: 'Available', 
      latency: '115ms', 
      endpoint: 'trddev.com/hackathon-2025/',
      description: 'Host for massive 3GB+ racing telemetry ZIP archives.',
      icon: Globe,
      color: 'text-blue-500' 
    },
    { 
      name: 'Local Data Engine', 
      type: 'Fallback', 
      status: 'Active', 
      latency: '< 1ms', 
      endpoint: 'Local Filesystem (/Data)',
      description: 'Curated historical F1 seasons (2020-2025) and GR Cup data.',
      icon: HardDrive,
      color: 'text-orange-500' 
    },
    { 
      name: 'Ergast F1 Motor Data', 
      type: 'Archive', 
      status: 'Connected', 
      latency: '88ms', 
      endpoint: 'ergast.com/api/f1',
      description: 'The standard for historical standings and race results.',
      icon: Database,
      color: 'text-purple-500' 
    }
  ]

  const cachedFiles = [
    { name: 'circuit-of-the-americas.zip', size: '2.8 GB', lastUsed: '2 mins ago', track: 'COTA' },
    { name: 'road-america.zip', size: '1.4 GB', lastUsed: '1 hour ago', track: 'Road America' },
    { name: 'sebring.zip', size: '0.9 GB', lastUsed: 'Yesterday', track: 'Sebring' },
    { name: '2024_austria_telemetry.json', size: '45 MB', lastUsed: '2 days ago', track: 'Red Bull Ring' }
  ]

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => setIsRefreshing(false), 1500)
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white flex items-center gap-4 tracking-tighter uppercase italic">
            <Database className="w-10 h-10 text-racing-red" />
            Data Stream Center
          </h1>
          <p className="text-gray-400 mt-2 font-medium">Manage and synchronize the KobayashiAI hybrid data engine</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">Global Uplink: OK</span>
          </div>
          <button 
            onClick={handleRefresh}
            className={`p-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg border border-white/5 transition-all ${isRefreshing ? 'animate-spin' : ''}`}
          >
            <RefreshCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Cloud Cache', value: '5.15 GB', icon: Globe, color: 'text-blue-500' },
          { label: 'Active Streams', value: '4 Source(s)', icon: Activity, color: 'text-green-500' },
          { label: 'Fusion Weight', value: '60/40 Split', icon: Cpu, color: 'text-purple-500' },
          { label: 'Local Files', value: '1,248 Files', icon: Folder, color: 'text-orange-500' }
        ].map((stat, i) => (
          <div key={i} className="bg-gradient-to-br from-gray-900 to-black p-6 rounded-2xl border border-white/5 shadow-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{stat.label}</span>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <p className="text-2xl font-black text-white tabular-nums tracking-tight">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs Layout */}
      <div className="bg-gray-900/40 backdrop-blur-xl rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
        <div className="flex border-b border-white/5 bg-black/20">
          {[
            { id: 'sources', name: 'Input Sources', icon: Database },
            { id: 'cache', name: 'Cloud & Local Cache', icon: HardDrive },
            { id: 'hybrid', name: 'Fusion Engine', icon: Cpu }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-3 px-8 py-5 text-sm font-bold transition-all relative ${
                activeTab === tab.id 
                  ? 'text-white' 
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.name}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 w-full h-1 bg-racing-red shadow-[0_0_15px_rgba(211,47,47,0.5)]"></div>
              )}
            </button>
          ))}
        </div>

        <div className="p-8">
          {activeTab === 'sources' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {dataSources.map((source, i) => (
                  <div key={i} className="bg-black/30 p-6 rounded-2xl border border-white/5 hover:border-racing-red/30 transition-all group">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl bg-gray-800 ${source.color} group-hover:scale-110 transition-transform`}>
                          <source.icon className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-white">{source.name}</h3>
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{source.type}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-xs font-bold ring-1 ring-green-500/20">
                        <CheckCircle className="w-3 h-3" />
                        {source.status}
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-400 mb-4 leading-relaxed">{source.description}</p>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-gray-500">{source.endpoint}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-white uppercase">{source.latency}</span>
                        <div className="w-1 h-4 bg-green-500/50 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'cache' && (
            <div className="space-y-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-black/40 p-6 rounded-2xl border border-white/5">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                  <input 
                    type="text" 
                    placeholder="Search cached telemetry archives..." 
                    className="w-full bg-gray-800 border-none rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:ring-2 focus:ring-racing-red transition-all"
                  />
                </div>
                <div className="flex gap-3">
                  <button className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold rounded-lg transition-all">
                    <Download className="w-3 h-3 text-blue-500" />
                    Download All
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-red-900/20 hover:bg-red-900/40 text-racing-red text-xs font-bold rounded-lg transition-all">
                    <Trash2 className="w-3 h-3" />
                    Purge Cache
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="text-xs font-black text-gray-500 uppercase tracking-widest">
                    <tr>
                      <th className="pb-4 pl-4">Asset Name</th>
                      <th className="pb-4">Track Context</th>
                      <th className="pb-4">Size</th>
                      <th className="pb-4">Last Accessed</th>
                      <th className="pb-4 pr-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {cachedFiles.map((file, i) => (
                      <tr key={i} className="group hover:bg-white/[0.02] transition-colors">
                        <td className="py-4 pl-4">
                          <div className="flex items-center gap-3">
                            <Folder className="w-4 h-4 text-orange-500" />
                            <span className="text-sm font-bold text-white tracking-tight">{file.name}</span>
                          </div>
                        </td>
                        <td className="py-4">
                          <span className="px-2 py-1 bg-gray-800/80 rounded text-[10px] font-bold text-gray-300 uppercase">{file.track}</span>
                        </td>
                        <td className="py-4 text-sm font-mono text-gray-400">{file.size}</td>
                        <td className="py-4 text-xs text-gray-500 font-medium">{file.lastUsed}</td>
                        <td className="py-4 pr-4">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white"><ExternalLink className="w-4 h-4" /></button>
                            <button className="p-2 hover:bg-red-900/20 rounded-lg text-gray-400 hover:text-racing-red"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'hybrid' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <div className="bg-black/30 p-8 rounded-3xl border border-white/5 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Zap className="w-32 h-32 text-yellow-500" />
                  </div>
                  
                  <h3 className="text-2xl font-black text-white mb-6 uppercase tracking-tight italic">Hybrid Intelligence Fusion</h3>
                  <p className="text-gray-400 text-sm leading-relaxed mb-8 max-w-xl">
                    Our Fusion Service dynamically balances historical reliability with real-time volatility. 
                    Currently using a <span className="text-racing-red font-bold">60/40 weighting</span> that prioritizes 
                    trusted local data while allowing OpenF1 telemetry to color the predictive outcomes.
                  </p>

                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between mb-3">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Local Archives Weight</span>
                        <span className="text-xs font-black text-racing-red italic">60%</span>
                      </div>
                      <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-racing-red shadow-[0_0_15px_rgba(211,47,47,0.5)]" style={{ width: '60%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-3">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Real-time Stream Integration</span>
                        <span className="text-xs font-black text-blue-500 italic">40%</span>
                      </div>
                      <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500/80 shadow-[0_0_15px_rgba(0,102,204,0.5)]" style={{ width: '40%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 bg-green-500/5 rounded-2xl border border-green-500/10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-green-500/20 rounded-lg text-green-500">
                        <CheckCircle className="w-5 h-5" />
                      </div>
                      <h4 className="font-bold text-white uppercase tracking-tight">Active Logic</h4>
                    </div>
                    <ul className="space-y-3">
                      {['Weather Impact Scoring', 'Delta Time Smoothing', 'Tyre Degradation Modeling'].map((logic, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs text-green-400/80 font-medium">
                          <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                          {logic}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-6 bg-yellow-500/5 rounded-2xl border border-yellow-500/10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-yellow-500/20 rounded-lg text-yellow-500">
                        <AlertCircle className="w-5 h-5" />
                      </div>
                      <h4 className="font-bold text-white uppercase tracking-tight">Fusion Alerts</h4>
                    </div>
                    <p className="text-[10px] text-yellow-400/60 leading-relaxed font-bold uppercase">
                      Telemetry jitter detected in Sector 2. Smart smoothing engaged. OpenF1 weight reduced to 15% for the current session.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-gradient-to-br from-racing-red to-red-800 p-8 rounded-3xl shadow-2xl text-white">
                  <h4 className="text-lg font-black mb-4 uppercase italic">Force Full Live</h4>
                  <p className="text-xs text-white/70 mb-6 leading-relaxed">
                    Instantly bypass historical anchors and rely 100% on the live OpenF1 stream. Use only during active race sessions.
                  </p>
                  <button className="w-full py-4 bg-white text-racing-red font-black uppercase text-sm rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl">
                    ENGAGE ALPHA DATA
                  </button>
                </div>
                
                <div className="bg-gray-900 border border-white/5 p-6 rounded-3xl">
                  <h4 className="text-sm font-black text-white mb-4 uppercase tracking-widest text-center">Sync Log</h4>
                  <div className="space-y-4 font-mono text-[9px]">
                    {[
                      { t: '15:40:12', m: 'OpenF1: Handshake successful', s: 'text-green-500' },
                      { t: '15:40:08', m: 'Cache: Loaded circuit-of-the-americas.zip', s: 'text-gray-400' },
                      { t: '15:39:55', m: 'Hybrid: Weights adjusted (60/40)', s: 'text-blue-400' },
                      { t: '15:39:40', m: 'System: Remote Data Center Online', s: 'text-purple-400' }
                    ].map((log, i) => (
                      <div key={i} className="flex gap-3">
                        <span className="text-gray-600">{log.t}</span>
                        <span className={log.s}>{log.m}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
