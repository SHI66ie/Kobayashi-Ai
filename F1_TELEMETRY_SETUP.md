# F1 Telemetry Data Setup Guide

## Overview
This guide explains how to add telemetry data files for Formula 1 racing to the KobayashiAI application.

## File Structure

Telemetry files should be placed in:
- **Local Development**: `Data/{track-folder}/` (gitignored)
- **Sample Data**: `public/f1-sample-data/` (tracked in git)

## Naming Conventions

### Single-File Telemetry
```
{track}_{race}_f1_telemetry_data.json
```

Examples:
- `monaco_R1_f1_telemetry_data.json`
- `silverstone_R2_f1_telemetry_data.json`
- `spa_R1_f1_telemetry_data.json`

### Alternative Patterns (also supported)
- `f1_{race}_{track}_telemetry.json`
- `{track}_{race}_f1_telemetry.json`

## Data Schema

### Root Structure
```typescript
{
  sessionId: string,      // Unique session identifier
  track: string,          // Track name (e.g., "monaco")
  race: string,           // Race identifier (e.g., "R1")
  driver: string,         // Driver name
  car: string,            // Car specification
  timestamp: string,      // ISO timestamp
  laps: F1LapData[],      // Lap-by-lap data
  telemetry: F1TelemetryPoint[]  // High-frequency telemetry
}
```

### Lap Data Structure
```typescript
interface F1LapData {
  lapNumber: number
  lapTime: number          // milliseconds
  sector1Time: number
  sector2Time: number
  sector3Time: number
  position: number
  gapToLeader: number      // seconds
  gapToFront: number       // seconds
  bestLap: boolean
  pitStop: boolean
  tireCompound: 'C1' | 'C2' | 'C3' | 'C4' | 'C5' | 'Intermediate' | 'Wet'
  fuelLevel: number        // percentage
  engineTemp: number       // celsius
  brakeTemp: number        // celsius
  tirePressures: {
    frontLeft: number
    frontRight: number
    rearLeft: number
    rearRight: number
  }
  tireTemps: {
    frontLeft: number[]
    frontRight: number[]
    rearLeft: number[]
    rearRight: number[]
  }
}
```

### Telemetry Point Structure
```typescript
interface F1TelemetryPoint {
  timestamp: number        // milliseconds since session start
  lapNumber: number
  lapDistance: number      // 0-1 normalized position on lap

  position: { x: number, y: number, z: number }    // World coordinates
  velocity: { x: number, y: number, z: number }    // m/s
  acceleration: { x: number, y: number, z: number } // m/s²

  engine: {
    rpm: number
    throttle: number        // 0-100%
    brake: number           // 0-100%
    gear: number
    fuelFlow: number        // kg/h
  }

  aero: {
    frontWing: number       // degrees
    rearWing: number        // degrees
    drag: number            // Newtons
    downforce: number       // Newtons
  }

  tires: {
    frontLeft: { pressure: number, temperature: { inner: number, middle: number, outer: number }, wear: number }
    frontRight: { pressure: number, temperature: { inner: number, middle: number, outer: number }, wear: number }
    rearLeft: { pressure: number, temperature: { inner: number, middle: number, outer: number }, wear: number }
    rearRight: { pressure: number, temperature: { inner: number, middle: number, outer: number }, wear: number }
  }

  temperatures: {
    engine: number
    brakes: { frontLeft: number, frontRight: number, rearLeft: number, rearRight: number }
    gearbox: number
    battery: number
  }

  raceData: {
    position: number
    gapToLeader: number     // seconds
    gapToFront: number      // seconds
    bestLapTime: number
    lastLapTime: number
    sector1Time: number
    sector2Time: number
    sector3Time: number
  }

  weather?: {
    airTemp: number
    trackTemp: number
    humidity: number
    windSpeed: number
    windDirection: number
    precipitation: number
  }
}
```

## How to Add Telemetry Data

### Option 1: Use the Sample Generator
1. Use the `generateSampleF1Telemetry()` function from `lib/f1-telemetry-generator.ts`
2. Customize the parameters for your track/race
3. Save the output as a JSON file with the correct naming convention

### Option 2: Manual Creation
1. Create a JSON file following the schema above
2. Ensure data is realistic for F1 racing
3. Use appropriate units (milliseconds for time, celsius for temperature, etc.)

### Option 3: From Real F1 Data
1. Collect telemetry data from F1 games or simulations
2. Transform the data to match the schema
3. Validate the data structure

## File Locations

### For Local Development
Place files in: `Data/{track-folder}/`
Example: `Data/circuit-of-the-americas/monaco_R1_f1_telemetry_data.json`

### For Sample Data (tracked in git)
Place files in: `public/f1-sample-data/`
Example: `public/f1-sample-data/monaco_R1_f1_telemetry_data.json`

## API Response

When telemetry data is found, the race data API returns:

```json
{
  "telemetry": {
    "available": true,
    "type": "single-file",
    "fileName": "monaco_R1_f1_telemetry_data.json",
    "dataType": "f1-telemetry",
    "totalPoints": 500,
    "totalLaps": 78
  }
}
```

## Testing

To test telemetry loading:
1. Start the development server
2. Visit: `http://localhost:3000/api/race-data/monaco/R1`
3. Check the response for telemetry availability
4. Look for console logs showing telemetry detection

## Tools Available

- **Schema Definition**: `lib/f1-telemetry-schema.ts`
- **Sample Generator**: `lib/f1-telemetry-generator.ts`
- **Sample Data**: `public/f1-sample-data/R1_monaco_f1_telemetry_data.json`

## Chunked Telemetry (Advanced)

For very large telemetry datasets, you can use chunked files:

1. Create an index file: `{race}_{track}_telemetry_data_index.json`
2. Create chunk files: `chunk_001.json`, `chunk_002.json`, etc.

The API will automatically detect and handle chunked telemetry.
