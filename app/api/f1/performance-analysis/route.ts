import { NextRequest, NextResponse } from 'next/server'
import { openf1Api } from '@/lib/openf1-api'
import { F1PerformanceAnalyzer } from '@/lib/performance-analyzer'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionKey = searchParams.get('session_key')
    const circuitName = searchParams.get('circuit') || 'Unknown Circuit'
    const sessionType = searchParams.get('session_type') || 'race'

    if (!sessionKey) {
      return NextResponse.json(
        { error: 'session_key parameter is required' },
        { status: 400 }
      )
    }

    // Fetch all necessary data from OpenF1 API
    const [lapData, carData, weatherData] = await Promise.all([
      openf1Api.getLaps(parseInt(sessionKey)),
      openf1Api.getCarData(parseInt(sessionKey)),
      openf1Api.getWeatherData(parseInt(sessionKey))
    ])

    if (!lapData.length) {
      return NextResponse.json(
        { error: 'No lap data available for this session' },
        { status: 404 }
      )
    }

    // Initialize performance analyzer
    const analyzer = new F1PerformanceAnalyzer()

    // Perform comprehensive analysis
    const analysis = await analyzer.analyzeSession(
      parseInt(sessionKey),
      lapData,
      carData,
      weatherData,
      circuitName,
      sessionType
    )

    return NextResponse.json({
      success: true,
      data: analysis,
      metadata: {
        sessionKey,
        circuitName,
        sessionType,
        dataPoints: {
          laps: lapData.length,
          carDataPoints: carData.length,
          weatherPoints: weatherData.length
        },
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Performance analysis error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to analyze performance data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionKey, circuitName, sessionType, customAnalysis } = body

    if (!sessionKey) {
      return NextResponse.json(
        { error: 'session_key is required' },
        { status: 400 }
      )
    }

    // Fetch data
    const [lapData, carData, weatherData] = await Promise.all([
      openf1Api.getLaps(sessionKey),
      openf1Api.getCarData(sessionKey),
      openf1Api.getWeatherData(sessionKey)
    ])

    if (!lapData.length) {
      return NextResponse.json(
        { error: 'No lap data available' },
        { status: 404 }
      )
    }

    const analyzer = new F1PerformanceAnalyzer()
    const analysis = await analyzer.analyzeSession(
      sessionKey,
      lapData,
      carData,
      weatherData,
      circuitName || 'Unknown Circuit',
      sessionType || 'race'
    )

    // Apply custom analysis if provided
    if (customAnalysis) {
      // Add custom analysis logic here
      const enhancedAnalysis = {
        ...analysis,
        customInsights: generateCustomInsights(analysis, customAnalysis)
      }
      
      return NextResponse.json({
        success: true,
        data: enhancedAnalysis,
        customAnalysis: customAnalysis || null
      })
    }

    return NextResponse.json({
      success: true,
      data: analysis,
      customAnalysis: customAnalysis || null
    })

  } catch (error) {
    console.error('Custom performance analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to perform custom analysis' },
      { status: 500 }
    )
  }
}

function generateCustomInsights(analysis: any, customParams: any) {
  const insights = []

  // Custom tire strategy insights
  if (customParams.focusTireStrategy) {
    const criticalTires = analysis.tireAnalysis.filter((tire: any) => 
      tire.estimatedLapsRemaining < 10
    )
    
    if (criticalTires.length > 0) {
      insights.push({
        type: 'tire_strategy',
        priority: 'high',
        message: `${criticalTires.length} drivers need immediate pit attention`,
        drivers: criticalTires.map((tire: any) => tire.driverNumber)
      })
    }
  }

  // Custom performance insights
  if (customParams.focusPerformance) {
    const topPerformers = analysis.driverPerformance
      .sort((a: any, b: any) => b.averageSpeed - a.averageSpeed)
      .slice(0, 3)

    insights.push({
      type: 'performance',
      priority: 'medium',
      message: 'Top performers by average speed',
      data: topPerformers
    })
  }

  return insights
}
