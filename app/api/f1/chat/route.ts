import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Initialize AI providers
const groq = process.env.GROQ_API_KEY ? new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
}) : null

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
}) : null

const gemini = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null

export async function POST(request: NextRequest) {
    try {
        const { message, context }: any = await request.json()

        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 })
        }

        // Build the system prompt with F1 context
        const systemPrompt = `
You are KobayashiAI, a world-class Formula 1 data analyst and prediction expert, similar to the most advanced AI betting assistants.
Your goal is to provide users with deep, data-driven insights, outcomes, and reasoning for F1 races.

CONTEXT DATA:
${JSON.stringify(context, null, 2)}

INSTRUCTIONS:
1. Use the provided F1 context (standings, race history, track data) to answer questions.
2. If the user asks for a prediction (e.g., "Who will win the next race?" or "What position will Hulk take?"), provide a specific outcome.
3. Crucially, provide REASONING based on:
   - Historical performance at this track.
   - Current form/standings.
   - Technical factors (aero, power unit, tire wear).
   - Any specific data points provided in the context.
4. Maintain a professional, expert, yet exciting tone. Use motorsport terminology (e.g., "undercut", "dirty air", "DRS train").
5. Be confident but acknowledge the unpredictability of racing.
6. If the user asks about "Hulk" (Nico Hülkenberg), use his real name and consider his reputation for consistency and his career stats.

Current Date: ${new Date().toLocaleDateString()}
Regime: 2026 Technical Regulations (Ground effect, standardized power units, 800kW MGU-K).
`

        // Priority: Groq > Gemini > OpenAI
        let analysis = ''

        if (groq) {
            const completion = await groq.chat.completions.create({
                model: 'llama-3.1-70b-versatile',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: message }
                ],
                temperature: 0.7,
            })
            analysis = completion.choices[0]?.message?.content || ''
        } else if (gemini) {
            const model = gemini.getGenerativeModel({ model: 'gemini-1.5-flash' })
            const chat = model.startChat({
                history: [{ role: 'user', parts: [{ text: systemPrompt }] }, { role: 'model', parts: [{ text: "Understood. I am KobayashiAI, ready for analysis." }] }],
            })
            const result = await chat.sendMessage(message)
            analysis = result.response.text()
        } else if (openai) {
            const completion = await openai.chat.completions.create({
                model: 'gpt-4-turbo-preview',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: message }
                ],
            })
            analysis = completion.choices[0]?.message?.content || ''
        } else {
            return NextResponse.json({ error: 'No AI service configured' }, { status: 503 })
        }

        return NextResponse.json({ success: true, response: analysis })

    } catch (error: any) {
        console.error('F1 Chat Error:', error)
        return NextResponse.json({ error: 'Failed to process request', message: error.message }, { status: 500 })
    }
}
