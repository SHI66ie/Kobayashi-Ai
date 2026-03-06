import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const trackName = searchParams.get('track')

        if (!trackName) {
            return NextResponse.json({ error: 'Track name is required' }, { status: 400 })
        }

        const dataDir = path.join(process.cwd(), 'Data', 'f1-telemetry')
        if (!fs.existsSync(dataDir)) {
            return NextResponse.json({ history: [] })
        }

        const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'))
        const trackKeywords = trackName.split(' ')[0].toLowerCase()
        let historicalEntries: any[] = []

        for (const file of files) {
            const filePath = path.join(dataDir, file)
            const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'))

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
                            // Extract relevant fields regardless of structure
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
