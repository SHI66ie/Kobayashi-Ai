'use client'

import React, { useState, useEffect } from 'react'
import { 
  Settings as SettingsIcon, 
  Cpu, 
  Database, 
  Bell, 
  Palette, 
  Save, 
  RefreshCcw,
  Zap,
  Github,
  Globe
} from 'lucide-react'
import { useTheme } from '../components/ThemeProvider'

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [activeSection, setActiveSection] = useState('general')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  
  // Settings state
  const [settings, setSettings] = useState({
    aiModel: 'qwen-2.5',
    refreshRate: '10',
    notifications: true,
    predictiveAccuracy: 'high'
  })

  useEffect(() => {
    const saved = localStorage.getItem('kb-settings')
    if (saved) {
      try {
        setSettings(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to load settings', e)
      }
    }
  }, [])

  const handleSave = () => {
    setSaveStatus('saving')
    localStorage.setItem('kb-settings', JSON.stringify(settings))
    setTimeout(() => {
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    }, 1000)
  }

  const sections = [
    { id: 'general', name: 'General', icon: SettingsIcon },
    { id: 'ai', name: 'AI Engine', icon: Cpu },
    { id: 'data', name: 'Data Feed', icon: Database },
    { id: 'notifications', name: 'Alerts', icon: Bell },
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <SettingsIcon className="w-8 h-8 text-racing-red" />
            System Settings
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Configure your KobayashiAI racing environment</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => window.location.reload()}
            className="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
            title="Reload settings"
          >
            <RefreshCcw className="w-5 h-5" />
          </button>
          <button 
            onClick={handleSave}
            disabled={saveStatus !== 'idle'}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold transition-all ${
              saveStatus === 'saved' 
                ? 'bg-green-600 text-white' 
                : 'bg-racing-red hover:bg-red-700 text-white shadow-lg shadow-red-600/20'
            }`}
          >
            <Save className={`w-4 h-4 ${saveStatus === 'saving' ? 'animate-spin' : ''}`} />
            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Settings Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar Navigation */}
        <aside className="lg:col-span-3 space-y-1">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeSection === section.id
                  ? 'bg-racing-red text-white shadow-md shadow-red-600/10'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <section.icon className="w-5 h-5" />
              {section.name}
            </button>
          ))}
        </aside>

        {/* Content Area */}
        <main className="lg:col-span-9 space-y-6">
          {activeSection === 'general' && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
                <h3 className="font-bold flex items-center gap-2">
                  <Palette className="w-5 h-5 text-racing-blue" />
                  Interface & Display
                </h3>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-medium text-gray-900 dark:text-white">Dashboard Theme</label>
                    <p className="text-sm text-gray-500">Choose your preferred visual appearance</p>
                  </div>
                  <select 
                    value={theme}
                    onChange={(e) => setTheme(e.target.value as any)}
                    className="bg-gray-100 dark:bg-gray-700 border-none rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-racing-red"
                  >
                    <option value="dark">F1 Night Mode (Dark)</option>
                    <option value="light">Daylight (Light)</option>
                    <option value="system">System Default</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-medium text-gray-900 dark:text-white">Refresh Interval</label>
                    <p className="text-sm text-gray-500">How often the live telemetry updates (seconds)</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <input 
                      type="range" 
                      min="5" 
                      max="60" 
                      step="5"
                      value={settings.refreshRate}
                      onChange={(e) => setSettings({...settings, refreshRate: e.target.value})}
                      className="w-32 accent-racing-red"
                    />
                    <span className="text-sm font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{settings.refreshRate}s</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'ai' && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
                <h3 className="font-bold flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  AI Decision Engine
                </h3>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="block font-medium text-gray-900 dark:text-white mb-2">Prime Model</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { id: 'qwen-2.5', name: 'Qwen 3.5 Max', desc: 'Active • Ultra-fast strategy' },
                      { id: 'gemini-pro', name: 'Gemini 1.5 Pro', desc: 'Deep multimodal analysis' },
                      { id: 'deepseek-v3', name: 'DeepSeek V3', desc: 'Advanced math reasoning' },
                      { id: 'gpt-4o', name: 'GPT-4o', desc: 'Balanced race coaching' }
                    ].map((model) => (
                      <button
                        key={model.id}
                        onClick={() => setSettings({...settings, aiModel: model.id})}
                        className={`p-4 rounded-xl border text-left transition-all ${
                          settings.aiModel === model.id
                            ? 'border-racing-red bg-red-50 dark:bg-red-900/10'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <p className="font-bold text-sm text-gray-900 dark:text-white">{model.name}</p>
                        <p className="text-xs text-gray-500">{model.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                  <div>
                    <label className="font-medium text-gray-900 dark:text-white">Predictive Sensitivity</label>
                    <p className="text-sm text-gray-500">Adjust the Alpha Simulator confidence threshold</p>
                  </div>
                  <select 
                    value={settings.predictiveAccuracy}
                    onChange={(e) => setSettings({...settings, predictiveAccuracy: e.target.value})}
                    className="bg-gray-100 dark:bg-gray-700 border-none rounded-lg px-4 py-2 text-sm"
                  >
                    <option value="high">Strict (95%+ Confidence)</option>
                    <option value="medium">Balanced (80%+ Confidence)</option>
                    <option value="aggressive">Aggressive (Experimental)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'data' && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
                <h3 className="font-bold flex items-center gap-2">
                  <Database className="w-5 h-5 text-racing-blue" />
                  Primary Data Stream
                </h3>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-start gap-4 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30">
                  <Globe className="w-10 h-10 text-racing-blue shrink-0" />
                  <div>
                    <p className="font-bold text-sm text-gray-900 dark:text-white">Active Source: OpenF1 API</p>
                    <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                      Currently streaming live data from Albert Park Circuit, Melbourne. 
                      Connection status: <span className="font-bold uppercase">Optimal</span>
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Force Legacy Fallback</p>
                      <p className="text-xs text-gray-500">Use cached Ergast data if live stream drops</p>
                    </div>
                    <div className="w-12 h-6 bg-racing-red rounded-full relative cursor-pointer opacity-50">
                       <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <footer className="pt-12 flex items-center justify-between border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-4">
          <Github className="w-5 h-5 text-gray-400" />
          <span className="text-xs text-gray-500">KobayashiAI v1.2.4-stable</span>
        </div>
        <div className="flex gap-6 text-xs text-gray-500">
          <button className="hover:text-gray-900 dark:hover:text-white transition-colors">Documentation</button>
          <button className="hover:text-gray-900 dark:hover:text-white transition-colors">Support</button>
          <button className="hover:text-gray-900 dark:hover:text-white transition-colors">Terms of Service</button>
        </div>
      </footer>
    </div>
  )
}
