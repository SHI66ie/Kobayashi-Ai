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

export async function POST(request: NextRequest) {
    try {
        const { type, track, f1Data, context }: any = await request.json()

        if (!groq) {
            return NextResponse.json({ error: 'Groq API not configured' }, { status: 503 })
        }

        // --- NEW: Load Historical DNA from local Data directory ---
        let historicalDNA = ""
        try {
            const dataDir = path.join(process.cwd(), 'Data', 'f1-telemetry')
            if (fs.existsSync(dataDir)) {
                const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'))

                // Track-specific results extraction
                const trackKeywords = track?.name?.split(' ')[0].toLowerCase() || ""
                let matchingResults: any[] = []

                for (const file of files) {
                    const filePath = path.join(dataDir, file)
                    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'))

                    // Handle different JSON structures found in Data/
                    const dataArray = Array.isArray(content) ? content : (content[" 2024 Race Data"] || [])

                    if (Array.isArray(dataArray)) {
                        const match = dataArray.find((r: any) =>
                            (r.race_name && r.race_name.toLowerCase().includes(trackKeywords)) ||
                            (r.Race && r.Race.toLowerCase().includes(trackKeywords))
                        )
                        if (match) {
                            matchingResults.push({ file, summary: match.data ? match.data.slice(0, 10) : match })
                        }
                    }
                }

                if (matchingResults.length > 0) {
                    historicalDNA = JSON.stringify(matchingResults.slice(0, 2))
                }
            }
        } catch (dnaErr) {
            console.warn("Failed to load historical DNA:", dnaErr)
        }

        const systemPrompt = `
You are KobayashiAI Alpha Engine, a specialized F1 predictive model for the 2026 technical regulations.
Your goal is to simulate F1 race outcomes based on telemetry, track data, and performance variables.

REGULATIONS CONTEXT (2026):
- Active Aerodynamics (X-mode for straights, Z-mode for corners).
- Standardized 1.6L V6 Turbo Hybrid Power Units.
- 800kW MGU-K (3x increase from legacy).
- 100% sustainable fuels.
- Minimum weight: 768kg.

INPUT DATA:
- Prediction Type: ${type}
- Track: ${track?.name || 'Unknown'}
- Driver/Car Variables: ${JSON.stringify(f1Data)}
- Global Context: ${JSON.stringify(context?.standings?.slice(0, 5))}
- Historical DNA (Actual Past Results): ${historicalDNA}

TASK:
Provide a highly detailed, data-driven prediction in JSON format.
Incorporate BOTH live context and Historical DNA into your 2026 simulation.
Include:
1. "analysis": A deep technical explanation (2-3 sentences) in "Monsterbet" style. Include specific mention of tire degradation impact and strategy windows if applicable. Use the Historical DNA to inform your reasoning.
2. "confidence": A percentage string (e.g. "92%").
3. "outcomes": An array of 3 possible scenarios with "label" and "probability" (e.g. "P1 Finish", "85%").
4. "factors": 3-5 technical factors influenced by 2026 rules.
5. "sim_metrics": (Optional) Object containing "tire_degradation" (array for chart), "pit_window" (range string), and "mgu_k_depletion" (percentage).

Format your response as a valid JSON object only. No markdown formatting outside the JSON.`

        const prompt = context?.featuredScenario === 'melbourne_undercut'
            ? `FEATURED SCENARIO: Melbourne Undercut. Simulate a high-intensity battle at Albert Park where Verstappen is leading but Leclerc is closing fast via an aggressive undercut strategy. Focus on the lap 20-25 window and MGU-K usage under the 2026 active aero regs.`
            : `Simulate a ${type} outcome for ${f1Data.driverName || 'a top driver'} at ${track?.name || 'this track'} under ${f1Data.trackCondition} conditions.`

        const completion = await groq.chat.completions.create({
            model: 'llama-3.1-8b-instant',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.7,
        })

        const result = JSON.parse(completion.choices[0]?.message?.content || '{}')

        return NextResponse.json({ success: true, ...result })

    } catch (error: any) {
        console.error('F1 Prediction Error:', error)
        return NextResponse.json({ error: 'Simulation failed', message: error.message }, { status: 500 })
    }
}


