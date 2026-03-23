import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const groq = process.env.GROQ_API_KEY ? new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
}) : null

import fs from 'fs'
import path from 'path'
import { F1DecisionEngine } from '@/lib/f1-decision-engine'
import { findProfileByName } from '@/lib/track-dna'

export async function POST(request: NextRequest) {
    try {
        const { type, track, f1Data, context }: any = await request.json()

        if (!groq) {
            return NextResponse.json({ error: 'Groq API not configured' }, { status: 503 })
        }

        // --- NEW: Enhanced Neural Core Metrics ---
        let brainInsights = ""
        try {
            const engine = F1DecisionEngine.getInstance()
            const profile = findProfileByName(track?.name || "")
            
            if (profile) {
                const trackDNA = profile.dna
                const sisterContext = await (engine as any).getSisterRaceContext(f1Data.driverName || "", profile)
                
                brainInsights = `
TRACK DNA: ${trackDNA}
${sisterContext}
                `.trim()
            }
        } catch (brainErr) {
            console.warn("Failed to load brain insights:", brainErr)
        }

        const systemPrompt = `
You are KobayashiAI Alpha Engine, a specialized F1 predictive model for the 2026 technical regulations.
Your goal is to simulate F1 race outcomes by scanning the ENTIRE field, including all drivers, constructors, track conditions, and weather telemetry.

REGULATIONS CONTEXT (2026):
- Active Aerodynamics (X-mode for straights, Z-mode for corners).
- Standardized 1.6L V6 Turbo Hybrid Power Units with 100% sustainable fuels.
- 3x MGU-K Boost (350kW to 800kW shift).
- Minimum weight: 768kg.

INPUT DATA:
- Prediction Type: ${type}
- Track: ${track?.name || 'Unknown'} (${track?.location})
- Focus Driver/Car (User Input): ${JSON.stringify(f1Data)}
- Full Field Context (Standings/Drivers): ${JSON.stringify(context?.standings)}
- Constructors & Teams: ${JSON.stringify(context?.teams?.slice(0, 10))}
- Kobayashi Brain Insights (Historical/Sister Tracks): ${brainInsights}

TASK:
Provide a highly detailed, field-wide race prediction in JSON format.
Incorporate BOTH live context and Historical DNA into your 2026 simulation.
Analyze how the ENTIRE grid will interact (traffic, pit windows, constructor battles, tire degradation across different car philosophies).

Include:
1. "analysis": A deep technical explanation (3-4 sentences) in "Monsterbet" style. Analyze the field-wide dynamics, including specific constructor performance deltas and how the focus driver fits into the global strategy. Mention Historical DNA trends.
2. "confidence": A percentage string (e.g. "94%").
3. "outcomes": An array of 5 possible scenarios for the WHOLE FIELD (e.g. "Red Bull vs Ferrari Pit Battle", "McLaren Mid-field Surge", "Focus Driver P1 Finish").
4. "predictions": An array of the top 8 simulated finishers, each with "position", "driver", "team", and "confidence" (e.g. {position: 1, driver: "Max Verstappen", team: "Red Bull", confidence: "92%"}).
5. "factors": 5-7 technical factors influenced by 2026 rules and current track conditions.
6. "sim_metrics": Object containing "tire_degradation" (array of 10 values for chart), "pit_window" (range string), and "mgu_k_depletion" (percentage).

Format your response as a valid JSON object only. No markdown formatting outside the JSON.`

        const prompt = context?.featuredScenario === 'melbourne_undercut'
            ? `FEATURED SCENARIO: Melbourne Undercut. Simulate a high-intensity battle at Albert Park. Verstappen leads, but the entire top 6 are separated by only 4 seconds. Leclerc and Norris are closing fast via aggressive undercut strategies. Analyze the MGU-K deployment and tire life for the WHOLE lead group.`
            : `Perform a comprehensive ${type} simulation for the entire F1 field at ${track?.name || 'this track'} under ${f1Data.trackCondition} conditions. Pay special attention to ${f1Data.driverName || 'the focus driver'} and their team ${f1Data.driverTeam}, but simulate and analyze the performance deltas for all major constructors (Red Bull, Ferrari, Mercedes, McLaren) based on their 2026 technical profiles.`

        const completion = await groq.chat.completions.create({
            model: 'llama-3.1-8b-instant',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.6,
        })

        const result = JSON.parse(completion.choices[0]?.message?.content || '{}')

        return NextResponse.json({ success: true, ...result })

    } catch (error: any) {
        console.error('F1 Prediction Error:', error)
        return NextResponse.json({ error: 'Simulation failed', message: error.message }, { status: 500 })
    }
}


