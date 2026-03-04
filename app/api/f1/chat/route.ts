import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'

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

export async function POST(request: NextRequest) {
    try {
        const { message, context }: any = await request.json()

        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 })
        }

        // Build the system prompt with F1 context
        const systemPrompt = `
You are KobayashiAI, a world-class Formula 1 data analyst and prediction expert, similar to the most advanced AI betting assistants (like Monsterbet).
Your goal is to provide users with deep, data-driven insights, outcomes, and reasoning for F1 races.

DATA SOURCE: 
You are powered by OpenF1, providing high-fidelity telemetry, session data, and driver statistics from 2023-2026.

CONTEXT DATA:
${JSON.stringify(context, null, 2)}

INSTRUCTIONS:
1. Use the provided F1 context (standings, session history, track data) to answer questions.
2. If the user asks for a prediction (e.g., "Who will win the next race?" or "What position will Hulk take?"), provide a specific outcome.
3. Crucially, provide REASONING based on:
   - Historical performance at this track (using context).
   - Technical factors (2026 Aero Package, Ground Effect, Power Unit efficiency).
   - Real-time data points like tire wear and track evolution if mentioned.
4. Maintain a professional, expert, yet exciting "Monsterbet" style tone. Use motorsport terminology (e.g., "undercut", "dirty air", "DRS train").
5. Be confident in your picks but acknowledge the "edge" and statistical probability.
6. If the user asks about "Hulk", you are referring to Nico Hülkenberg. Consider his reputation for consistency and qualifying strength.

Regime: 2026 Technical Regulations (Active aero, standardized power units, 800kW MGU-K).
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
                    model: 'llama-3.3-70b-versatile',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: message }
                    ],
                    temperature: 0.7,
                    max_tokens: 2000
                })
                analysis = completion.choices[0]?.message?.content || ''
                modelUsed = 'llama-3.3-70b-versatile (Groq)'
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
        return NextResponse.json({ success: true, response: analysis, model: modelUsed })

    } catch (error: any) {
        console.error('F1 Chat Error:', error)
        return NextResponse.json({ error: 'Failed to process request', message: error.message }, { status: 500 })
    }
}
