import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// Disable caching for dynamic data
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const runtime = 'nodejs'

// Map track IDs to folder names in the local Data directory
const TRACK_FOLDERS: Record<string, string> = {
  'barber': 'barber',
  // Local folder name uses full circuit name instead of shorthand "COTA"
  'cota': 'circuit-of-the-americas',
  'indianapolis': 'indianapolis',
  'road-america': 'road-america',
  'sebring': 'sebring',
  'sonoma': 'sonoma',
  'vir': 'virginia-international-raceway'
}

export async function GET(
  request: NextRequest,
  { params }: { params: { track: string; race: string } }
) {
  try {
    const { track, race } = params
    const trackFolder = TRACK_FOLDERS[track] || track
    const dataDir = path.join(process.cwd(), 'Data', trackFolder)

    console.log(`Loading race data for ${track} - ${race}`)

    // Check if Data directory exists
    if (!fs.existsSync(dataDir)) {
      return NextResponse.json({ 
        error: 'Data not found',
        message: 'Please download the data from Google Drive and place it in the Data/ folder',
        link: 'https://drive.google.com/drive/folders/1AvpoKZzY7CVtcSBX8wA7Oq8JfAWo-oou?usp=sharing'
      }, { status: 404 })
    }

    // Load directory listing once for flexible filename matching
    const allFiles = fs.readdirSync(dataDir)

    // Load race results - try common file patterns first
    const raceNum = race.slice(1) // "R1" -> "1"
    const raceFiles = [
      `03_Results GR Cup Race ${raceNum} Official_Anonymized.json`,
      `03_Results GR Cup Race ${raceNum} Official1_Anonymized.json`,
      `03_GR Cup Race ${raceNum} Official Results.json`,
      `00_Results GR Race ${raceNum} Official_Anonymized.json`,
      `00_Results GR Cup Race ${raceNum} Official_Anonymized.json`,
      `03_Provisional Results_Race ${raceNum}_Anonymized.json`,
      `03_Provisional Results_Race ${raceNum}.json`,
      `03_Provisional_Results_Race ${raceNum}_Anonymized.json`,
      `${race}_${track}_race_results.json`
    ]

    let raceResults = null
    for (const file of raceFiles) {
      const filePath = path.join(dataDir, file)
      if (fs.existsSync(filePath)) {
        raceResults = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
        console.log(`✓ Loaded race results from: ${file}`)
        break
      }
    }

    // Fallback: fuzzy search for any results file mentioning this race
    if (!raceResults) {
      const raceKeyword = `race ${raceNum}`
      const candidate = allFiles.find(f => {
        const name = f.toLowerCase()
        return name.endsWith('.json') &&
          name.includes('result') &&
          (name.includes(raceKeyword) || (!name.includes('race') && raceNum === '1'))
      })

      if (candidate) {
        const filePath = path.join(dataDir, candidate)
        raceResults = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
        console.log(`✓ Loaded race results from fallback: ${candidate}`)
      } else {
        console.warn('⚠️ No race results file found for', track, race)
      }
    }

    // Load lap times (exact pattern first)
    const lapTimeFile = path.join(dataDir, `${race}_${track}_lap_time.json`)
    let lapTimes = null
    if (fs.existsSync(lapTimeFile)) {
      lapTimes = JSON.parse(fs.readFileSync(lapTimeFile, 'utf-8'))
      console.log(`✓ Loaded lap times from: ${path.basename(lapTimeFile)} (${lapTimes.length} entries)`)      
    } else {
      // Fallback: search for any lap_time file starting with race ID
      const lapCandidate = allFiles.find(f => {
        const name = f.toLowerCase()
        return name.endsWith('.json') &&
          name.startsWith(race.toLowerCase()) &&
          name.includes('lap_time')
      })

      if (lapCandidate) {
        const filePath = path.join(dataDir, lapCandidate)
        lapTimes = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
        console.log(`✓ Loaded lap times from fallback: ${lapCandidate} (${lapTimes.length} entries)`)        
      }
    }

    // Load weather data
    const weatherFiles = [
      `26_Weather_Race ${raceNum}_Anonymized.json`,
      `26_Weather_Race ${raceNum}.json`,
      `26_Weather_ Race ${raceNum}_Anonymized.json`,
      `${race}_${track}_weather.json`
    ]
    let weather = null
    for (const file of weatherFiles) {
      const filePath = path.join(dataDir, file)
      if (fs.existsSync(filePath)) {
        weather = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
        console.log(`✓ Loaded weather data from: ${file}`)
        break
      }
    }

    // Fallback: pick any weather file in the folder if race-specific not found
    if (!weather) {
      const raceKeyword = `race ${raceNum}`
      const candidate = allFiles.find(f => {
        const name = f.toLowerCase()
        return name.endsWith('.json') &&
          name.includes('weather') &&
          (name.includes(raceKeyword) || !name.includes('race'))
      })

      if (candidate) {
        const filePath = path.join(dataDir, candidate)
        weather = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
        console.log(`✓ Loaded weather data from fallback: ${candidate}`)
      } else {
        console.warn('⚠️ No weather file found for', track, race)
      }
    }

    // Check for telemetry data
    const telemetryIndexFile = path.join(dataDir, `${race}_${track}_telemetry_data_index.json`)
    let telemetry: any = { available: false }

    // Prefer chunked telemetry when an index is available
    if (fs.existsSync(telemetryIndexFile)) {
      const telemetryInfo = JSON.parse(fs.readFileSync(telemetryIndexFile, 'utf-8'))
      telemetry = {
        available: true,
        type: 'chunked',
        totalRows: telemetryInfo.totalRows,
        totalChunks: telemetryInfo.totalChunks,
        chunkSize: telemetryInfo.chunkSize
      }
      console.log(`Telemetry available (chunked): ${telemetry.totalRows} rows in ${telemetry.totalChunks} chunks`)
    } else {
      // Fallback: detect single-file telemetry JSONs without loading them into memory
      const telemetryCandidate = allFiles.find(f => {
        const name = f.toLowerCase()
        return name.endsWith('.json') && name.includes('telemetry')
      })

      if (telemetryCandidate) {
        telemetry = {
          available: true,
          type: 'single-file',
          fileName: telemetryCandidate
        }
        console.log(`Telemetry available (single-file): ${telemetryCandidate}`)
      } else {
        console.log('No telemetry file detected for', track, race)
      }
    }

    return NextResponse.json({
      track,
      race,
      raceResults,
      lapTimes,
      weather,
      telemetry
    })

  } catch (error) {
    console.error('Error loading race data:', error)
    return NextResponse.json(
      { error: 'Failed to load data', details: String(error) },
      { status: 500 }
    )
  }
}
