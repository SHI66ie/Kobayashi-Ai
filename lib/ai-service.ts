import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Groq (FREE & FAST - PRIMARY)
let groq: OpenAI | null = null;
try {
    if (process.env.GROQ_API_KEY) {
        groq = new OpenAI({
            apiKey: process.env.GROQ_API_KEY,
            baseURL: 'https://api.groq.com/openai/v1',
            timeout: 50000,
            maxRetries: 2
        });
    }
} catch (error) {
    console.error('Failed to initialize Groq:', error);
}

// Initialize DeepSeek (FREE - backup)
let deepseek: OpenAI | null = null;
try {
    if (process.env.DEEPSEEK_API_KEY) {
        deepseek = new OpenAI({
            apiKey: process.env.DEEPSEEK_API_KEY,
            baseURL: 'https://api.deepseek.com',
            timeout: 50000,
            maxRetries: 2
        });
    }
} catch (error) {
    console.error('Failed to initialize DeepSeek:', error);
}

// Initialize Gemini (FREE - fallback)
let gemini: GoogleGenerativeAI | null = null;
try {
    if (process.env.GEMINI_API_KEY) {
        gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
} catch (error) {
    console.error('Failed to initialize Gemini:', error);
}

// Initialize OpenAI (paid - final fallback)
let openai: OpenAI | null = null;
try {
    if (process.env.OPENAI_API_KEY) {
        openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
            timeout: 50000,
            maxRetries: 2
        });
    }
} catch (error) {
    console.error('Failed to initialize OpenAI:', error);
}

export interface AIResponse {
    content: string;
    model: string;
    provider: string;
}

export async function getAICompletion(prompt: string, systemPrompt: string = "You are an expert F1 race strategist."): Promise<AIResponse> {
    // Try Groq
    if (groq) {
        try {
            const completion = await groq.chat.completions.create({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.4,
            });
            return {
                content: completion.choices[0]?.message?.content || '',
                model: 'llama-3.3-70b-versatile',
                provider: 'Groq'
            };
        } catch (e) { console.error("Groq failed", e); }
    }

    // Try DeepSeek
    if (deepseek) {
        try {
            const completion = await deepseek.chat.completions.create({
                model: 'deepseek-chat',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.4,
            });
            return {
                content: completion.choices[0]?.message?.content || '',
                model: 'deepseek-chat',
                provider: 'DeepSeek'
            };
        } catch (e) { console.error("DeepSeek failed", e); }
    }

    // Try Gemini
    if (gemini) {
        try {
            const model = gemini.getGenerativeModel({ model: 'gemini-1.5-pro' });
            const result = await model.generateContent({
                contents: [{ role: 'user', parts: [{ text: systemPrompt + "\n\n" + prompt }] }],
                generationConfig: { temperature: 0.4 }
            });
            return {
                content: result.response.text(),
                model: 'gemini-1.5-pro',
                provider: 'Gemini'
            };
        } catch (e) { console.error("Gemini failed", e); }
    }

    // Try OpenAI
    if (openai) {
        try {
            const completion = await openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.4,
            });
            return {
                content: completion.choices[0]?.message?.content || '',
                model: 'gpt-4o',
                provider: 'OpenAI'
            };
        } catch (e) { console.error("OpenAI failed", e); }
    }

    throw new Error("No AI providers available or all failed.");
}
