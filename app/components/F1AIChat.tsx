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
        { role: 'assistant', content: 'Hello! I am KobayashiAI, your expert F1 analyst. Ask me anything about upcoming races, driver prospects, or seasonal outcomes. For example: "What position do you think Hulk will take in the next race?"' }
    ])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
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
            const response = await fetch('/api/f1/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage,
                    context: contextData
                })
            })

            const data = await response.json()

            if (data.success) {
                setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
            } else {
                setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${data.message || 'Failed to get analysis. Please check your API keys.'}` }])
            }
        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error connecting to the race brain.' }])
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex flex-col h-[600px] bg-gray-900/50 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative">
            {/* Glow effects */}
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-racing-red/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-racing-blue/10 rounded-full blur-[100px] pointer-events-none" />

            {/* Header */}
            <div className="px-6 py-4 bg-white/5 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-racing-red rounded-lg shadow-lg shadow-racing-red/20">
                        <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white tracking-tight">AI Oracle - Alpha Analysis</h3>
                        <div className="flex items-center space-x-1">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-[10px] text-gray-400 uppercase font-semibold">Real-time Data Active</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-400 bg-white/5 px-2 py-1 rounded border border-white/5">
                    <Sparkles className="w-3 h-3 text-yellow-500" />
                    <span>Powered by Kobayashi-AI Engine</span>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] flex space-x-3 ${m.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${m.role === 'user' ? 'bg-racing-blue shadow-lg shadow-racing-blue/20' : 'bg-gray-800 border border-white/10'}`}>
                                {m.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-racing-red" />}
                            </div>
                            <div className={`p-4 rounded-2xl text-sm leading-relaxed ${m.role === 'user'
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
                        <div className="flex space-x-3">
                            <div className="w-8 h-8 rounded-full bg-gray-800 border border-white/10 flex items-center justify-center shrink-0">
                                <Loader2 className="w-4 h-4 text-racing-red animate-spin" />
                            </div>
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-gray-400 text-sm animate-pulse">
                                Analyzing race data telemetry...
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestions */}
            <div className="px-6 py-2 overflow-x-auto whitespace-nowrap scrollbar-none flex space-x-2 bg-black/20">
                {[
                    "Hulk position prediction?",
                    "Who wins at Australian GP?",
                    "Podium prediction for 2026?",
                    "Track analysis for Melbourne",
                    "Tire strategy impact"
                ].map((s, i) => (
                    <button
                        key={i}
                        onClick={() => setInput(s)}
                        className="text-[11px] px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition-all flex items-center space-x-1"
                    >
                        <ChevronRight className="w-3 h-3" />
                        <span>{s}</span>
                    </button>
                ))}
            </div>

            {/* Input */}
            <div className="p-4 bg-black/40 border-t border-white/10">
                <div className="relative flex items-center">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask AI for race outcomes..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-racing-red/50 transition-all placeholder:text-gray-600 text-white"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className="absolute right-2 p-2 bg-racing-red hover:bg-red-600 disabled:opacity-50 disabled:grayscale rounded-lg transition-all"
                    >
                        <Send className="w-4 h-4 text-white" />
                    </button>
                </div>
                <div className="mt-2 flex items-center justify-center space-x-4 text-[10px] text-gray-500 uppercase font-black tracking-widest">
                    <span className="flex items-center"><Target className="w-3 h-3 mr-1" /> Precision Picks</span>
                    <span className="flex items-center"><Info className="w-3 h-3 mr-1" /> Data Integrated</span>
                </div>
            </div>
        </div>
    )
}
