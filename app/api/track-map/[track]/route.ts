import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { isAWSConfigured, getAWSInfo } from '@/lib/aws-data'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Map track IDs to folder names to match S3/local structure
const TRACK_FOLDERS: Record<string, string> = {
  'barber': 'barber',
  'cota': 'circuit-of-the-americas',
  'indianapolis': 'indianapolis',
  'road-america': 'road-america',
  'sebring': 'sebring',
  'sonoma': 'sonoma',
  'vir': 'virginia-international-raceway'
}

// Map track IDs to possible map filenames (PDF base names; images use same base)
const TRACK_PDF_CANDIDATES: Record<string, string[]> = {
  barber: [
    'Barber_Circuit_Map.pdf',
    'barber_circuit_map.pdf'
  ],
  cota: [
    'COTA_Circuit_Map.pdf',
    'cota_circuit_map.pdf',
    'Circuit_of_the_Americas_Circuit_Map.pdf'
  ],
  indianapolis: [
    'Indianapolis_Circuit_Map.pdf',
    'indianapolis_circuit_map.pdf',
    'Indy_Circuit_Map.pdf',
    'Indy_Circuit_Map - Copy.pdf'
  ],
  'road-america': [
    'Road_America_Circuit_Map.pdf',
    'road_america_circuit_map.pdf',
    'Road_America_Map.pdf',
    'Road_America_Map - Copy.pdf'
  ],
  sebring: [
    'Sebring_Circuit_Map.pdf',
    'sebring_circuit_map.pdf',
    'Sebring_Track_Sector_Map.pdf',
    'Sebring_Track_Sector_Map - Copy.pdf'
  ],
  sonoma: [
    'Sonoma_Circuit_Map.pdf',
    'sonoma_circuit_map.pdf',
    'Sonoma_Map.pdf',
    'Sonoma_Map - Copy.pdf'
  ],
  vir: [
    'VIR_Circuit_Map.pdf',
    'vir_circuit_map.pdf',
    'Virginia_International_Raceway_Circuit_Map.pdf',
    'VIR_map.pdf',
    'VIR_map - Copy.pdf',
    'vir_map.pdf'
  ]
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { track: string } }
) {
  try {
    const { track } = params
    const awsConfigured = isAWSConfigured()
    
    if (awsConfigured) {
      console.log(`🌐 Using AWS CloudFront for track map: ${getAWSInfo().domain}`)
    } else {
      console.log(`📂 Using local filesystem for track map`)
    }
    
    const dataRoot = path.join(process.cwd(), 'Data')

    if (!awsConfigured && !fs.existsSync(dataRoot)) {
      return new NextResponse('Data folder not found', { status: 404 })
    }

    const trackFolder = TRACK_FOLDERS[track] || track
    const candidates = TRACK_PDF_CANDIDATES[track] || []

    // Build list of candidate filenames for multiple extensions (png/jpg/jpeg/pdf)
    // We prefer image formats first when available.
    const allCandidates: string[] = []
    for (const name of candidates) {
      const base = name.replace(/\.(pdf|png|jpe?g)$/i, '')
      allCandidates.push(
        `${base}.png`,
        `${base}.jpg`,
        `${base}.jpeg`,
        `${base}.pdf`
      )
    }
    
    if (awsConfigured) {
      // AWS: Try to fetch map file from CloudFront (image or PDF)
      const cloudFrontDomain = getAWSInfo().domain
      const mapsPrefix = 'maps'
      const dataPrefix = 'Data'
      
      // Try mapped candidate filenames first, across multiple possible key layouts
      for (const name of allCandidates) {
        const urlCandidates = [
          // Preferred new layout: maps/<trackFolder>/<name>
          `https://${cloudFrontDomain}/${mapsPrefix}/${trackFolder}/${name}`,
          // maps/<name>
          `https://${cloudFrontDomain}/${mapsPrefix}/${name}`,
          // Legacy layouts with Data/ prefix
          `https://${cloudFrontDomain}/${dataPrefix}/maps/${trackFolder}/${name}`,
          `https://${cloudFrontDomain}/${dataPrefix}/maps/${name}`,
          // Original layout: <trackFolder>/<name>
          `https://${cloudFrontDomain}/${trackFolder}/${name}`,
          // Root-level fallback
          `https://${cloudFrontDomain}/${name}`
        ]

        for (const url of urlCandidates) {
          try {
            const response = await fetch(url)
            if (response.ok) {
              console.log(` Found track map at: ${url}`)
              const fileBuffer = await response.arrayBuffer()
              const ext = path.extname(name).toLowerCase()
              const contentType =
                ext === '.png' ? 'image/png' :
                ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' :
                'application/pdf'
              
              return new NextResponse(fileBuffer, {
                status: 200,
                headers: {
                  'Content-Type': contentType,
                  'Content-Disposition': `inline; filename="${name}"`
                }
              })
            }
          } catch (error) {
            console.log(`❌ Failed to fetch ${name} from ${url}:`, error)
          }
        }
      }
      
      // If no candidate found, return 404
      return new NextResponse('Track map file not found on AWS', { status: 404 })
    } else {
      // Local: Use existing filesystem logic, plus optional Data/maps/<trackFolder>/
      const trackDir = path.join(dataRoot, track)
      const mappedTrackFolder = TRACK_FOLDERS[track] || track
      const mapsTrackDir = path.join(dataRoot, 'maps', mappedTrackFolder)
      const searchPaths: string[] = []

      // 1) Maps folder for this track inside Data/maps
      if (fs.existsSync(mapsTrackDir) && fs.statSync(mapsTrackDir).isDirectory()) {
        searchPaths.push(mapsTrackDir)
      }

      // 2) Track-specific folder at Data/<track>
      if (fs.existsSync(trackDir) && fs.statSync(trackDir).isDirectory()) {
        searchPaths.push(trackDir)
      }

      // 3) Data root as fallback
      searchPaths.push(dataRoot)

      let pdfPath: string | null = null

      // Try mapped candidate filenames first (pdf/png/jpg/jpeg)
      for (const baseDir of searchPaths) {
        for (const name of allCandidates) {
          const fullPath = path.join(baseDir, name)
          if (fs.existsSync(fullPath)) {
            pdfPath = fullPath
            break
          }
        }
        if (pdfPath) break
      }

      // Final fallback: first map file that contains track id in its name
      if (!pdfPath) {
        for (const baseDir of searchPaths) {
          const files = fs.readdirSync(baseDir)
          const candidate = files.find(f => {
            const lower = f.toLowerCase()
            const isMapFile =
              lower.endsWith('.pdf') ||
              lower.endsWith('.png') ||
              lower.endsWith('.jpg') ||
              lower.endsWith('.jpeg')
            return isMapFile && lower.includes(track.toLowerCase())
          })
          if (candidate) {
            pdfPath = path.join(baseDir, candidate)
            break
          }
        }
      }

      if (!pdfPath) {
        return new NextResponse('Track map file not found', { status: 404 })
      }

      const fileBuffer = fs.readFileSync(pdfPath)
      const ext = path.extname(pdfPath).toLowerCase()
      const contentType =
        ext === '.png' ? 'image/png' :
        ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' :
        'application/pdf'

      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `inline; filename="${path.basename(pdfPath)}"`
        }
      })
    }
  } catch (error) {
    console.error('Error serving track map PDF:', error)
    return new NextResponse('Failed to load track map', { status: 500 })
  }
}
