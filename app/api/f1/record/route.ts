import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { session_key, session_name, data_type, content } = body

        if (!session_key || !content) {
            return NextResponse.json({ error: 'Session key and content are required' }, { status: 400 })
        }

        const dataDir = path.join(process.cwd(), 'Data', 'f1-telemetry')
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true })
        }

        const fileName = `Recorded_${session_name || 'Session'}_${session_key}_${data_type || 'data'}_${Date.now()}.json`
        const filePath = path.join(dataDir, fileName)

        fs.writeFileSync(filePath, JSON.stringify(content, null, 2))

        return NextResponse.json({ 
            success: true, 
            message: 'Data recorded successfully',
            file: fileName
        })

    } catch (error: any) {
        console.error('F1 Record Error:', error)
        return NextResponse.json({ error: 'Failed to record data', message: error.message }, { status: 500 })
    }
}
