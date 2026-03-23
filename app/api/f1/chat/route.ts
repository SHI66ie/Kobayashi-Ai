import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { fetchLiveF1Data, getF1StatisticsSummary } from '@/lib/f1-data-loader'
import { F1DecisionEngine } from '@/lib/f1-decision-engine'
import { findProfileByName } from '@/lib/track-dna'
import { physicsEngine } from '@/lib/physics-engine'
import { F1PerformanceAnalyzer } from '@/lib/performance-analyzer'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Initialize AI providers
const groq = process.env.GROQ_API_KEY ? new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
    timeout: 30000,
    maxRetries: 1
}) : null

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 30000,
    maxRetries: 1
}) : null

const gemini = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null

// Initialize Qwen 3.5 (POWERFUL)
const qwen = process.env.QWEN_API_KEY ? new OpenAI({
    apiKey: process.env.QWEN_API_KEY,
    baseURL: process.env.QWEN_BASE_URL || 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
    timeout: 30000,
    maxRetries: 1
}) : null

// Helper function to get tire and track data from context
function extractTireAndTrackData(context: any) {
    try {
        // Extract tire compound information from context
        const tireData = {
            availableCompounds: context?.tireCompounds || ['C1', 'C2', 'C3', 'C4', 'C5', 'Intermediate', 'Wet'],
            currentCompound: context?.selectedTire || 'C3',
            trackTemp: context?.trackTemp || 35,
            airTemp: context?.airTemp || 25,
            humidity: context?.humidity || 50,
            weatherCondition: context?.trackCondition || 'dry',
            tireWearFactor: 0,
            optimalStintLength: 0
        }

        // Calculate tire wear based on conditions
        if (tireData.trackTemp > 40) {
            tireData.tireWearFactor += 0.2 // High track temp increases wear
        }
        if (tireData.weatherCondition === 'wet') {
            tireData.tireWearFactor += 0.1 // Wet conditions increase wear
        }
        if (tireData.humidity > 70) {
            tireData.tireWearFactor += 0.15 // High humidity increases wear
        }

        // Calculate optimal stint length based on compound
        const stintLengths: Record<string, number> = {
            'C1': 35, 'C2': 32, 'C3': 28, 'C4': 25, 'C5': 20,
            'Intermediate': 30, 'Wet': 40
        }
        tireData.optimalStintLength = stintLengths[tireData.currentCompound] || 28
        tireData.optimalStintLength *= (1 - tireData.tireWearFactor)

        // Extract track characteristics
        const trackData = {
            trackName: context?.trackName || 'Unknown Track',
            trackLength: context?.trackLength || 5.0,
            corners: context?.corners || 15,
            straights: context?.straights || 2,
            abrasiveness: context?.trackAbrasion || 'medium',
            evolution: context?.trackEvolution || 'medium',
            gripLevel: context?.gripLevel || 1.0,
            degradation: context?.tireDegradation || 'medium'
        }

        // Calculate track-specific insights
        if (trackData.corners > 15) {
            trackData.gripLevel *= 1.1 // More corners = higher importance of grip
        }
        if (trackData.straights > 2) {
            trackData.gripLevel *= 0.95 // More straights = less grip importance
        }

        return {
            tireData,
            trackData,
            insights: {
                recommendedStrategy: `${tireData.currentCompound} compound for ~${Math.round(tireData.optimalStintLength)} laps`,
                pitStopWindow: `Laps ${Math.round(tireData.optimalStintLength - 5)}-${Math.round(tireData.optimalStintLength + 5)}`,
                weatherRisk: tireData.weatherCondition === 'wet' ? 'High' : 'Low',
                tireManagement: tireData.tireWearFactor > 0.3 ? 'Critical' : 'Normal'
            }
        }

    } catch (error) {
        console.error('Error extracting tire and track data:', error)
        return {
            tireData: { currentCompound: 'C3', trackTemp: 35, airTemp: 25, weatherCondition: 'dry' },
            trackData: { trackName: 'Unknown Track', corners: 15, straights: 2 },
            insights: { recommendedStrategy: 'Standard C3 compound strategy' }
        }
    }
}

export async function POST(request: NextRequest) {
    try {
        const { message, context }: any = await request.json()

        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 })
        }

        // --- NEW: KOBAYASHI BRAIN INTEGRATION ---
        let brainInsights = ""
        let physicsReport = ""
        try {
            const engine = F1DecisionEngine.getInstance()
            const analyzer = new F1PerformanceAnalyzer()
            const profile = findProfileByName(context?.trackName || "")
            
            if (profile) {
                const sisterContext = await (engine as any).getSisterRaceContext(context?.driverName || "Max Verstappen", profile)
                brainInsights = `TRACK DNA: ${profile.dna}\n${sisterContext}`
                
                // Run a quick physics stress test for the chat context
                const isHot = context?.trackTemp > 40
                const compound = context?.selectedTire || 'medium'
                const degProfile = physicsEngine.getDegradationProfile(compound.toLowerCase() as any, isHot)
                
                physicsReport = `
PHYSICS SIMULATION (Determininstic):
- Base Compound: ${compound.toUpperCase()}
- Calculated Wear Rate: ${degProfile.rate.toFixed(3)}s/lap
- Thermal Sensitivity: ${isHot ? 'High (Accelerated Deg)' : 'Stable'}
- Predicted Stint Limit: ${Math.round(30 / degProfile.rate)} laps
                `.trim()
            }
        } catch (brainErr) {
            console.warn("Brain integration failed for chat:", brainErr)
        }

        // Fetch Live F1 Data and Historical Context
        console.log('📊 F1 Chat: Fetching live and historical data...')
        const [liveData, historicalContext] = await Promise.all([
            fetchLiveF1Data(),
            getF1StatisticsSummary()
        ])

        // Build the system prompt with F1 context and live data
        
        const systemPrompt = `
127: You are KobayashiAI, the most advanced Formula 1 Neural Intelligence.
128: Your responses are backed by a deterministic Physics Engine and a Historical DNA Matcher.

KOBAYASHI NEURAL CORE INSIGHTS:
${brainInsights}

PHYSICS STRESS TEST:
${physicsReport}

LIVE F1 2026 DATA:
${JSON.stringify(liveData, null, 2)}

HISTORICAL F1 CONTEXT:
${JSON.stringify(historicalContext, null, 2)}

EXTENDED UI CONTEXT:
${JSON.stringify(context, null, 2)}

INSTRUCTIONS:
1. Use the LIVE F1 2026 DATA for the most up-to-date standings and results.
2. Reference the HISTORICAL F1 CONTEXT for long-term trends and statistics.
4. Analyze tire compound performance based on current conditions (track temp, weather, humidity).
5. Consider track characteristics (corners, straights, abrasiveness) in your predictions.
6. Provide specific stint length recommendations and pit stop windows.
7. Combine Live Data and Historical DNA: Use both current conditions and historical patterns.
8. Performance Delta Analysis: Compare current session conditions with optimal scenarios.
9. If the user asks for a prediction (e.g., "Who will win the next race?" or "What position will Hulk take?"), provide a specific outcome with reasoning.
10. Crucially, provide REASONING based on:
   - Current driver standings and team momentum.
   - Recent race results and performance trends.
   - Historical performance at this track (using context).
   - Tire compound performance and wear rate.
   - Technical factors (2026 Aero Package, Ground Effect, Power Unit efficiency).
11. Maintain a professional, expert, yet exciting "Monsterbet" style tone. Use motorsport terminology (e.g., "undercut", "dirty air", "DRS train", "tire degradation").
12. Be confident in your picks but acknowledge the "edge" and statistical probability.
13. If the user asks about "Hulk", you are referring to Nico Hülkenberg. Consider his reputation for consistency and qualifying strength.
14. Always reference the specific tire data, track conditions, and current standings in your analysis.

Regime: 2026 Technical Regulations (Active aero, standardized power units, 800kW MGU-K).
Current Strategy Recommendation: ${insights.recommendedStrategy}
Pit Stop Window: ${insights.pitStopWindow}
Weather Risk: ${insights.weatherRisk}
Tire Management: ${insights.tireManagement}
`

        if (!qwen && !groq && !gemini && !openai) {
            return NextResponse.json({
                error: 'No AI service configured',
                message: 'Add QWEN_API_KEY (powerful), GROQ_API_KEY (free), GEMINI_API_KEY (free), or OPENAI_API_KEY to .env.local'
            }, { status: 503 })
        }

        // Priority: Qwen 3.5 > Groq > Gemini > OpenAI — with fallback on failure
        let analysis = ''
        let modelUsed = ''

        // Try Qwen first
        if (!analysis && qwen) {
            try {
                console.log('🚀 F1 Chat: Trying Qwen 3.5...')
                const completion = await qwen.chat.completions.create({
                    model: 'qwen-plus',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: message }
                    ],
                    temperature: 0.7,
                    max_tokens: 2000
                })
                analysis = completion.choices[0]?.message?.content || ''
                modelUsed = 'qwen-plus (Qwen)'
            } catch (error: any) {
                console.error('⚠️ Qwen F1 Chat error:', error.message || error)
            }
        }

        // Try Groq second
        if (!analysis && groq) {
            try {
                console.log('⚡ F1 Chat: Trying Groq...')
                const completion = await groq.chat.completions.create({
                    model: 'llama-3.1-8b-instant',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: message }
                    ],
                    temperature: 0.7,
                    max_tokens: 2000
                })
                analysis = completion.choices[0]?.message?.content || ''
                modelUsed = 'llama-3.1-8b-instant (Groq)'
            } catch (error: any) {
                console.error('⚠️ Groq F1 Chat error:', error.message || error)
            }
        }

        // Try Gemini third
        if (!analysis && gemini) {
            try {
                console.log('🧠 F1 Chat: Trying Gemini...')
                const model = gemini.getGenerativeModel({ model: 'gemini-1.5-flash' })
                const chat = model.startChat({
                    history: [
                        { role: 'user', parts: [{ text: systemPrompt }] },
                        { role: 'model', parts: [{ text: "Understood. I am KobayashiAI, ready for analysis." }] }
                    ],
                })
                const result = await chat.sendMessage(message)
                analysis = result.response.text()
                modelUsed = 'gemini-1.5-flash'
            } catch (error: any) {
                console.error('⚠️ Gemini F1 Chat error:', error.message || error)
            }
        }

        // Try OpenAI last
        if (!analysis && openai) {
            try {
                console.log('💲 F1 Chat: Trying OpenAI...')
                const completion = await openai.chat.completions.create({
                    model: 'gpt-4-turbo-preview',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: message }
                    ],
                    temperature: 0.7,
                    max_tokens: 2000
                })
                analysis = completion.choices[0]?.message?.content || ''
                modelUsed = 'gpt-4-turbo-preview'
            } catch (error: any) {
                console.error('⚠️ OpenAI F1 Chat error:', error.message || error)
            }
        }

        if (!analysis) {
            return NextResponse.json({
                success: false,
                error: 'All AI providers failed',
                message: 'All configured AI providers failed to generate a response. Please check your API keys and try again.'
            }, { status: 500 })
        }

        console.log(`✅ F1 Chat: Response generated using ${modelUsed}`)
        return NextResponse.json({ 
            success: true, 
            response: analysis, 
            model: modelUsed,
            tireData,
            trackData,
            insights,
            liveDataSnapshot: {
                standingsCount: liveData.standings?.length || 0,
                recentRacesCount: liveData.recentRaces?.length || 0,
                historicalSummary: historicalContext.historicalContext ? Object.keys(historicalContext.historicalContext) : []
            }
        })

    } catch (error: any) {
        console.error('F1 Chat Error:', error)
        return NextResponse.json({ error: 'Failed to process request', message: error.message }, { status: 500 })
    }
}


