'use client'

import React, { useState, useEffect, useRef } from 'react'
import { 
  Database, 
  Globe, 
  Folder, 
  Zap, 
  RefreshCcw, 
  CheckCircle, 
  AlertCircle,
  Activity,
  Cpu,
  Unlink,
  ExternalLink,
  UploadCloud,
  Layers,
  FileCode,
  Link,
  Brain,
  ChevronRight,
  ShieldCheck,
  Plus
} from 'lucide-react'

export default function DataCenter() {
  const [activeTab, setActiveTab] = useState<'sources' | 'hybrid' | 'ingestion'>('sources')
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // Ingestion State
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'complete'>('idle')
  const [scanResult, setScanResult] = useState<any>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [apiTerminalLogs, setApiTerminalLogs] = useState<string[]>([])
  
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    }
  ]

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => setIsRefreshing(false), 1500)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadFile(file)
      simulateScan('file', file.name)
    }
  }

  const simulateScan = (type: 'file' | 'api', name: string) => {
    setScanStatus('scanning')
    setApiTerminalLogs([
      `Initializing Kobayashi AI Scanner...`,
      `Detecting source: ${name}`,
      `Analyzing byte structure...`,
      `Identifying telemetry patterns...`
    ])

    const interval = setInterval(() => {
      setApiTerminalLogs(prev => [...prev, `Checking for mapping: ${Math.random() > 0.5 ? 'Speed' : 'LapTime'} found...`].slice(-6))
    }, 800)

    setTimeout(() => {
      clearInterval(interval)
      setScanStatus('complete')
      setScanResult({
        dataType: type === 'file' ? 'High-Frequency Telemetry' : 'Driver Performance Stream',
        fieldsFound: ['GPS_Lat', 'GPS_Long', 'Speed_KPH', 'Throttle_Pct', 'Brake_Pres', 'Gear', 'DRS_Status'],
        mapping: { 'Speed': 'Speed_KPH', 'Throttle': 'Throttle_Pct', 'Brake': 'Brake_Pres' },
        confidence: 94,
        isCompatible: true
      })
      setApiTerminalLogs(prev => [...prev, `Scan successful. Data is 100% compatible with Kobayashi-Ai V1 core.`])
    }, 4000)
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
          <div className="px-4 py-2 bg-black/40 border border-white/10 rounded-lg flex items-center gap-2">
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

      {/* Tabs Layout */}
      <div className="bg-gray-900/40 backdrop-blur-xl rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
        <div className="flex flex-wrap border-b border-white/5 bg-black/20">
          {[
            { id: 'sources', name: 'Input Sources', icon: Database },
            { id: 'ingestion', name: 'AI Data Ingestion', icon: UploadCloud },
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
                
                {/* NEW SOURCE CTA */}
                <button 
                  onClick={() => setActiveTab('ingestion')}
                  className="bg-dashed border-2 border-dashed border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 hover:border-racing-red/50 hover:bg-racing-red/5 transition-all text-gray-500 hover:text-white"
                >
                  <Plus className="w-8 h-8" />
                  <span className="font-bold uppercase tracking-widest text-xs">Add Custom Data Source</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'ingestion' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-7 space-y-6">
                {/* UPLOAD SECTION */}
                <div className="bg-black/30 p-8 rounded-3xl border border-white/5">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                    <UploadCloud className="w-5 h-5 text-racing-red" />
                    Upload Raw Telemetry
                  </h3>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-white/10 rounded-2xl p-12 flex flex-col items-center justify-center gap-4 hover:border-racing-red/40 hover:bg-red-950/5 transition-all cursor-pointer group"
                  >
                    <div className="p-4 bg-gray-800 rounded-full group-hover:scale-110 transition-transform">
                      <FileCode className="w-10 h-10 text-gray-400 group-hover:text-racing-red" />
                    </div>
                    <div className="text-center">
                      <p className="text-gray-300 font-bold">Drag & Drop or Click to Upload</p>
                      <p className="text-gray-500 text-xs mt-1">Supports CSV, JSON, ZIP (Max 5GB)</p>
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                  </div>
                </div>

                {/* API CONNECTOR */}
                <div className="bg-black/30 p-8 rounded-3xl border border-white/5">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                    <Link className="w-5 h-5 text-blue-500" />
                    External API Connector
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Endpoint URL</label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="https://api.motorsport-data.com/v1/live" 
                          className="flex-1 bg-gray-800 border border-white/5 rounded-lg px-4 py-3 text-sm text-white focus:ring-2 focus:ring-blue-500"
                        />
                        <button 
                          onClick={() => simulateScan('api', 'External API')}
                          className="px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all"
                        >
                          Scan API
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Auth Method</label>
                        <select className="w-full bg-gray-800 border border-white/5 rounded-lg px-4 py-3 text-sm text-white">
                          <option>Bearer Token</option>
                          <option>API Key (Header)</option>
                          <option>No Auth</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Frequency</label>
                        <select className="w-full bg-gray-800 border border-white/5 rounded-lg px-4 py-3 text-sm text-white">
                          <option>Real-time (Stream)</option>
                          <option>Every 10s</option>
                          <option>On-demand</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI SCANNER SIDEBAR */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-gradient-to-br from-gray-900 via-black to-gray-900 border border-racing-red/20 rounded-3xl p-8 sticky top-8 shadow-2xl">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-racing-red/20 rounded-lg">
                        <Brain className="w-6 h-6 text-racing-red" />
                      </div>
                      <h3 className="font-bold text-xl text-white">AI Data Scanner</h3>
                    </div>
                    {scanStatus === 'scanning' && (
                       <RefreshCcw className="w-5 h-5 text-racing-red animate-spin" />
                    )}
                  </div>

                  {scanStatus === 'idle' ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Layers className="w-16 h-16 text-gray-700 mb-4" />
                      <p className="text-gray-400 text-sm font-medium">Ready for ingestion analysis.<br/>Upload a file or provide an API URL.</p>
                    </div>
                  ) : scanStatus === 'scanning' ? (
                    <div className="space-y-6">
                      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-racing-red animate-progress-fast" style={{ width: '40%' }}></div>
                      </div>
                      <div className="bg-black/50 p-4 rounded-xl font-mono text-[10px] text-green-500/80 leading-relaxed border border-green-500/10">
                        {apiTerminalLogs.map((log, i) => (
                          <div key={i} className="flex gap-2">
                            <span className="text-green-900">[{i}]</span>
                            <span>{log}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6 animate-in zoom-in-95 duration-500">
                      <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center gap-4">
                        <ShieldCheck className="w-8 h-8 text-green-500" />
                        <div>
                          <p className="text-xs font-bold text-green-500 uppercase tracking-widest">Compatibility Rank</p>
                          <p className="text-2xl font-black text-white italic">{scanResult.confidence}% Confidence</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex justify-between items-center py-2 border-b border-white/5">
                          <span className="text-gray-500 text-xs font-bold uppercase">Data Nature</span>
                          <span className="text-white text-sm font-bold tracking-tight">{scanResult.dataType}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 text-xs font-bold uppercase mb-3 block">Detected Telemetry Channels</span>
                          <div className="flex flex-wrap gap-2">
                            {scanResult.fieldsFound.map((f: string, i: number) => (
                              <span key={i} className="px-2 py-1 bg-gray-800 text-[9px] font-mono text-gray-300 rounded border border-white/5">{f}</span>
                            ))}
                          </div>
                        </div>
                        <div className="p-4 bg-racing-red/10 rounded-xl border border-racing-red/20 shadow-lg">
                           <button className="w-full flex items-center justify-center gap-2 text-white font-black uppercase text-xs tracking-widest">
                             Commit Map to Engine
                             <ChevronRight className="w-4 h-4" />
                           </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
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
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
