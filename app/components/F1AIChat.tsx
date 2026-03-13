'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Sparkles, Loader2, Info, ChevronRight, Target } from 'lucide-react'

interface Message {
    role: 'user' | 'assistant'
    content: string
}

interface F1AIChatProps {
    contextData: any
}

export default function F1AIChat({ contextData }: F1AIChatProps) {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: 'Hello! I am KobayashiAI, your expert F1 analyst with access to live tire and track data. Ask me anything about upcoming races, tire strategies, or driver performance. For example: "What tire compound should be used at Melbourne?" or "How will the current track conditions affect Hulk\'s performance?"' }
    ])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [liveData, setLiveData] = useState<any>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleSend = async () => {
        if (!input.trim() || isLoading) return

        const userMessage = input.trim()
        setInput('')
        setMessages(prev => [...prev, { role: 'user', content: userMessage }])
        setIsLoading(true)

        try {
            const response = await fetch('/api/ai-qa', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: userMessage,
                    series: 'Formula 1',
                    mode: 'auto', // Auto-detect F1 vs general questions
                    contextData: {
                        tireCompound: contextData?.tireCompound,
                        trackTemp: contextData?.trackTemp,
                        airTemp: contextData?.airTemp,
                        humidity: contextData?.humidity,
                        trackCondition: contextData?.trackCondition,
                        track: contextData?.track,
                        currentDriver: contextData?.currentDriver,
                        position: contextData?.position,
                        telemetry: contextData?.telemetry,
                        sessionType: contextData?.sessionType,
                        currentLap: contextData?.currentLap,
                        totalLaps: contextData?.totalLaps
                    },
                    raceResults: contextData?.raceResults || [],
                    lapTimes: contextData?.lapTimes || [],
                    weather: contextData?.weather,
                    track: contextData?.track,
                    race: contextData?.race
                })
            })

            const data = await response.json()

            if (data.answer) {
                setMessages(prev => [...prev, { role: 'assistant', content: data.answer }])
                // Update live data if provided
                if (data.tireData || data.trackData) {
                    setLiveData({
                        tireData: data.tireData,
                        trackData: data.trackData,
                        insights: data.insights
                    })
                }
            } else {
                setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${data.error || 'Failed to get analysis. Please check your API keys.'}` }])
            }
        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error connecting to the race brain.' }])
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex flex-col h-[70vh] sm:h-[600px] bg-gray-900/50 backdrop-blur-xl border border-white/10 rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl relative">
            {/* Glow effects - Optimized for mobile */}
            <div className="absolute -top-12 -left-12 w-32 h-32 sm:w-64 sm:h-64 bg-racing-red/10 rounded-full blur-[50px] sm:blur-[100px] pointer-events-none" />
            <div className="absolute -bottom-12 -right-12 w-32 h-32 sm:w-64 sm:h-64 bg-racing-blue/10 rounded-full blur-[50px] sm:blur-[100px] pointer-events-none" />

            {/* Header - Mobile Optimized */}
            <div className="px-3 sm:px-6 py-3 sm:py-4 bg-white/5 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="p-1.5 sm:p-2 bg-racing-red rounded-lg shadow-lg shadow-racing-red/20">
                        <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-white text-sm sm:text-base tracking-tight truncate">AI Oracle - Alpha</h3>
                        <div className="flex items-center space-x-1">
                            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-[9px] sm:text-[10px] text-gray-400 uppercase font-semibold truncate">Real-time Data Active</span>
                        </div>
                    </div>
                </div>
                <div className="hidden sm:flex items-center space-x-2 text-xs text-gray-400 bg-white/5 px-2 py-1 rounded border border-white/5">
                    <Sparkles className="w-3 h-3 text-yellow-500" />
                    <span>Powered by Kobayashi-AI</span>
                </div>
            </div>

            {/* Messages - Mobile Optimized */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] sm:max-w-[85%] flex space-x-2 sm:space-x-3 ${m.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                            <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 ${m.role === 'user' ? 'bg-racing-blue shadow-lg shadow-racing-blue/20' : 'bg-gray-800 border border-white/10'}`}>
                                {m.role === 'user' ? <User className="w-3 h-3 sm:w-4 sm:h-4 text-white" /> : <Bot className="w-3 h-3 sm:w-4 sm:h-4 text-racing-red" />}
                            </div>
                            <div className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl text-xs sm:text-sm leading-relaxed ${m.role === 'user'
                                ? 'bg-racing-blue/20 border border-racing-blue/30 text-white rounded-tr-none'
                                : 'bg-white/5 border border-white/10 text-gray-200 rounded-tl-none'
                                }`}>
                                {m.content.split('\n').map((line, idx) => (
                                    <p key={idx} className={line.trim() === '' ? 'h-2' : 'mb-1 last:mb-0'}>
                                        {line}
                                    </p>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="flex space-x-2 sm:space-x-3">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gray-800 border border-white/10 flex items-center justify-center shrink-0">
                                <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 text-racing-red animate-spin" />
                            </div>
                            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 text-gray-400 text-xs sm:text-sm animate-pulse">
                                Analyzing race data telemetry...
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestions - Mobile Optimized with Tire/Track Focus */}
            <div className="px-3 sm:px-6 py-2 bg-black/20">
                <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center sm:justify-start">
                    {[
                        "Tire strategy for Melbourne?",
                        "How track temp affects C3?",
                        "Hulk position in wet?",
                        "Pit stop window C2?",
                        "Weather impact on tires?"
                    ].map((s, i) => (
                        <button
                            key={i}
                            onClick={() => setInput(s)}
                            className="text-[10px] sm:text-[11px] px-2 py-1.5 sm:px-3 sm:py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition-all flex items-center space-x-1 mobile-tap-target"
                        >
                            <ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
                            <span className="truncate">{s}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Live Data Display - Mobile Optimized */}
            {liveData && (
                <div className="px-3 sm:px-6 py-2 bg-gradient-to-r from-racing-red/20 to-racing-blue/20 border-t border-white/10">
                    <div className="flex flex-col space-y-1 sm:space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[9px] sm:text-[10px] text-racing-red font-semibold uppercase tracking-wider">Live Strategy</span>
                            <span className="text-[9px] sm:text-[10px] text-racing-blue font-semibold">{liveData.insights?.recommendedStrategy || 'Calculating...'}</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 text-[8px] sm:text-[9px] text-gray-400">
                            <div>
                                <span className="block text-gray-500">Pit Window</span>
                                <span className="text-white font-semibold">{liveData.insights?.pitStopWindow || 'N/A'}</span>
                            </div>
                            <div>
                                <span className="block text-gray-500">Weather Risk</span>
                                <span className="text-white font-semibold">{liveData.insights?.weatherRisk || 'Low'}</span>
                            </div>
                            <div>
                                <span className="block text-gray-500">Tire Management</span>
                                <span className="text-white font-semibold">{liveData.insights?.tireManagement || 'Normal'}</span>
                            </div>
                            <div>
                                <span className="block text-gray-500">Track Temp</span>
                                <span className="text-white font-semibold">{liveData.tireData?.trackTemp || 35}°C</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Input - Mobile Optimized */}
            <div className="p-3 sm:p-4 bg-black/40 border-t border-white/10">
                <div className="relative flex items-center">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask about tire strategy, track conditions..."
                        className="w-full bg-white/5 border border-white/10 rounded-lg sm:rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 pr-12 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-racing-red/50 transition-all placeholder:text-gray-600 text-white mobile-tap-target"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className="absolute right-1.5 sm:right-2 p-1.5 sm:p-2 bg-racing-red hover:bg-red-600 disabled:opacity-50 disabled:grayscale rounded-lg transition-all mobile-tap-target"
                    >
                        <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                    </button>
                </div>
                <div className="mt-2 flex items-center justify-center space-x-3 sm:space-x-4 text-[9px] sm:text-[10px] text-gray-500 uppercase font-black tracking-widest">
                    <span className="flex items-center"><Target className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" /> Precision Picks</span>
                    <span className="flex items-center"><Info className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" /> Data Integrated</span>
                </div>
            </div>
        </div>
    )
}
