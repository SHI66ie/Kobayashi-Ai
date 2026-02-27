// Create a minimal test file to isolate the error
const fs = require('fs')
const { execSync } = require('child_process')

// Create a minimal test that reproduces the issue
const testContent = `'use client'

import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense, Fragment } from 'react'
import { Trophy, Zap, Target, Brain, Clock, Play, Pause, BarChart3, Download, Flag, TrendingUp, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function TestPage() {
  const generatePredictionResults = (type: string, track: any) => {
    const baseAccuracy = 0.78
    switch (type) {
      case 'qualifying':
        return { type: 'Q', accuracy: baseAccuracy }
      case 'pit-strategy': {
        const trackFactor = { tireWear: 0.80 }
        return { type: 'P', tireWearFactor: trackFactor.tireWear }
      }
      case 'overtake': {
        const overtakeTrackFactor = { power: 0.92 }
        return { type: 'O', power: overtakeTrackFactor.power > 0.92 ? 'Even' : 'Medium' }
      }
      default:
        return { error: 'Unknown' }
    }
  }

  const exportReport = async () => {
    const report = 'KobayashiAI Race Analysis Report\\n' +
      'Track: test\\n' +
      'Generated: ' + new Date().toLocaleString()
    console.log(report)
  }

  return (
    <div className="min-h-screen">
      <header className="bg-black">
        <div className="container">Test</div>
      </header>
    </div>
  )
}
`

fs.writeFileSync('app/_minimal_test.tsx', testContent)
console.log('Test file created. Now running build check...')

try {
    const result = execSync('cmd /c "npm run build 2>&1 | findstr /i _minimal_test"', {
        cwd: process.cwd(),
        stdio: 'pipe',
        timeout: 60000
    })
    console.log('Result:', result.toString())
} catch (e) {
    const out = ((e.stdout || Buffer.alloc(0)).toString() + (e.stderr || Buffer.alloc(0)).toString())
    if (out.includes('_minimal_test')) {
        console.log('MINIMAL TEST FAILS:', out)
    } else {
        console.log('Minimal test passes, issue is in main file specific content')
    }
}

try { fs.unlinkSync('app/_minimal_test.tsx') } catch (e) { }
