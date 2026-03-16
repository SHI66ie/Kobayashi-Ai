import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const trackName = searchParams.get('track')
        const fileName = searchParams.get('file')

        const dataDir = path.join(process.cwd(), 'Data', 'f1-telemetry')

        // Direct file retrieval
        if (fileName) {
            const filePath = path.join(dataDir, fileName)
            if (fs.existsSync(filePath)) {
                const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
                return NextResponse.json({ 
                    success: true, 
                    history: {
                        results: Array.isArray(content.content?.raceResults) ? content.content.raceResults : 
                                 Array.isArray(content.content?.standings) ? content.content.standings : 
                                 Array.isArray(content.content) ? content.content : []
                    }
                })
            }
            return NextResponse.json({ error: 'File not found' }, { status: 404 })
        }

        if (!trackName) {
            return NextResponse.json({ error: 'Track name is required' }, { status: 400 })
        }

        if (!fs.existsSync(dataDir)) {
            return NextResponse.json({ history: [] })
        }

        const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'))
        const trackKeywords = trackName.split(' ')[0].toLowerCase()
        let historicalEntries: any[] = []

        for (const file of files) {
            const filePath = path.join(dataDir, file)
            const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'))

            // Handle modern recordings from our own record API
            if (file.startsWith('Recorded_')) {
                const isMatch = (content.session_name && content.session_name.toLowerCase().includes(trackKeywords)) ||
                                (content.track && content.track.toLowerCase().includes(trackKeywords));
                
                if (isMatch) {
                    historicalEntries.push({
                        year: file.match(/\d{4}/)?.[0] || new Date().getFullYear().toString(),
                        type: content.data_type || 'Archive',
                        name: content.session_name || content.track || 'Session',
                        timestamp: content.timestamp,
                        results: Array.isArray(content.content?.raceResults) ? content.content.raceResults : 
                                 Array.isArray(content.content?.standings) ? content.content.standings : []
                    });
                }
                continue;
            }

            // Fallback for legacy data structures
            const dataArray = Array.isArray(content) ? content : (content[" 2024 Race Data"] || [])

            if (Array.isArray(dataArray)) {
                // Look for race match
                const match = dataArray.filter((r: any) =>
                    (r.race_name && r.race_name.toLowerCase().includes(trackKeywords)) ||
                    (r.Race && r.Race.toLowerCase().includes(trackKeywords))
                )

                if (match.length > 0) {
                    historicalEntries.push({
                        year: file.match(/\d{4}/)?.[0] || 'Unknown',
                        results: match.map((m: any) => {
                            return {
                                driver: m.driver || m.Driver || "Unknown",
                                team: m.team || m.Team || m.constructor || "Unknown",
                                position: m["finish position"] || m["Finish Position"] || m.position || "N/A",
                                time: m["fastest lap time"] || m["Fastest Lap Time"] || m.q3 || "N/A"
                            }
                        })
                    })
                }
            }
        }

        return NextResponse.json({ success: true, history: historicalEntries })

    } catch (error: any) {
        console.error('F1 History Error:', error)
        return NextResponse.json({ error: 'Failed to load history', message: error.message }, { status: 500 })
    }
}
