import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const dataDir = path.join(process.cwd(), 'Data', 'f1-telemetry')
        if (!fs.existsSync(dataDir)) {
            return NextResponse.json({ archives: [] })
        }

        const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'))
        let archives: any[] = []

        for (const file of files) {
            try {
                const filePath = path.join(dataDir, file)
                const stats = fs.statSync(filePath)
                const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'))

                archives.push({
                    fileName: file,
                    size: stats.size,
                    recordedAt: stats.mtime,
                    sessionName: content.session_name || content.track || 'Unknown Session',
                    sessionKey: content.session_key || 'N/A',
                    dataType: content.data_type || 'Unknown Type',
                    itemCount: Array.isArray(content.content) ? content.content.length : 
                              (content.content?.raceResults ? content.content.raceResults.length : 
                               (content.content?.standings ? content.content.standings.length : 0))
                })
            } catch (e) {
                console.error(`Error reading archive file ${file}:`, e)
            }
        }

        // Sort by most recent
        archives.sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())

        return NextResponse.json({ success: true, archives })

    } catch (error: any) {
        console.error('F1 Archives Error:', error)
        return NextResponse.json({ error: 'Failed to load archives', message: error.message }, { status: 500 })
    }
}
