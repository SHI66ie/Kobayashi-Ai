import { NextRequest, NextResponse } from 'next/server'
import { f1DecisionEngine, DecisionContext } from '../../../../lib/f1-decision-engine'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(request: NextRequest) {
    try {
        const { driver, race, year, currentConditions }: any = await request.json()

        if (!driver || !race) {
            return NextResponse.json({
                error: 'Missing required parameters',
                message: 'Both driver and race are required'
            }, { status: 400 })
        }

        const context: DecisionContext = {
            driver,
            race,
            year: year || new Date().getFullYear(),
            currentConditions
        }

        const analysis = await f1DecisionEngine.generateRaceDecision(context)

        return NextResponse.json({
            success: true,
            analysis,
            metadata: {
                driver,
                race,
                year: context.year,
                generatedAt: new Date().toISOString()
            }
        })

    } catch (error: any) {
        console.error('❌ Decision Engine Error:', error)
        return NextResponse.json({
            error: 'Decision analysis failed',
            message: error.message
        }, { status: 500 })
    }
}
