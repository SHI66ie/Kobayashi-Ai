import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export const dynamic = 'force-dynamic'

// Initialize Qwen (our preferred model for data analysis)
const qwen = process.env.QWEN_API_KEY ? new OpenAI({
  apiKey: process.env.QWEN_API_KEY,
  baseURL: process.env.QWEN_BASE_URL || 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
}) : null

export async function POST(request: NextRequest) {
  try {
    const { type, content, metadata }: any = await request.json()

    if (!qwen) {
      return NextResponse.json({ 
        error: 'AI Scanner Unavailable',
        message: 'QWEN_API_KEY is missing in environment.'
      }, { status: 503 })
    }

    const scannerPrompt = `
      You are the KobayashiAI Data Ingestion Agent. 
      Analyze the following data ${type === 'file' ? 'sample' : 'API response structure'}.
      
      CONTEXT:
      Type: ${type}
      Name/URL: ${metadata?.name || metadata?.url}
      
      DATA CONTENT:
      ${content}
      
      TASK:
      1. Determine if this is useful racing data (telemetry, weather, standings, etc.).
      2. Map the data structure to our internal format (Driver, LapTime, Speed, Throttle, Brake, Gear).
      3. Identify any missing critical fields.
      4. Provide a "Confidence Score" (0-100).
      
      RESPONSE FORMAT:
      Return a JSON object with:
      {
        "dataType": "string (e.g. Telemetry/Weather/Standings)",
        "fieldsFound": ["string"],
        "mapping": {"internalField": "sourceField"},
        "analysis": "string (brief overview)",
        "confidence": number,
        "isCompatible": boolean
      }
    `

    const completion = await qwen.chat.completions.create({
      model: 'qwen-plus',
      messages: [
        { role: 'system', content: 'You are a technical data architect specialized in F1 and motorsports telemetry.' },
        { role: 'user', content: scannerPrompt }
      ],
      response_format: { type: 'json_object' }
    })

    const result = JSON.parse(completion.choices[0].message.content || '{}')

    return NextResponse.json({
      success: true,
      scanResult: result,
      metadata: {
        model: 'Qwen Plus',
        timestamp: new Date().toISOString()
      }
    })

  } catch (error: any) {
    console.error('Data Scan Error:', error)
    return NextResponse.json({ 
      error: 'Scan failed', 
      message: error.message 
    }, { status: 500 })
  }
}
