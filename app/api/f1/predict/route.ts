import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const groq = process.env.GROQ_API_KEY ? new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
}) : null

export async function POST(request: NextRequest) {
    try {
        const { type, track, f1Data, context }: any = await request.json()

        if (!groq) {
            return NextResponse.json({ error: 'Groq API not configured' }, { status: 503 })
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

TASK:
Provide a highly detailed, data-driven prediction in JSON format.
Include:
1. "analysis": A deep technical explanation (2-3 sentences) in "Monsterbet" style.
2. "confidence": A percentage string (e.g. "92%").
3. "outcomes": An array of 3 possible scenarios with "label" and "probability" (e.g. "P1 Finish", "85%").
4. "factors": 3-5 technical factors influenced by 2026 rules.

Format your response as a valid JSON object only. No markdown formatting outside the JSON.`

        const prompt = `Simulate a ${type} outcome for ${f1Data.driverName || 'a top driver'} at ${track?.name || 'this track'} under ${f1Data.trackCondition} conditions.`

        const completion = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
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
