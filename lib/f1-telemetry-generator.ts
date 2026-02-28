// Sample F1 Telemetry Data Generator
// This creates realistic telemetry data for demonstration

export const generateSampleF1Telemetry = (track: string, race: string, driver: string) => {
  const sessionId = `${track}_${race}_${Date.now()}`
  const totalLaps = track === 'monaco' ? 78 : 70
  const lapLength = track === 'monaco' ? 3340 : 5800 // meters

  // Generate lap data
  const laps = []
  let currentPosition = 1
  let gapToLeader = 0
  let bestLapTime = 90000 // ~1:30.000

  for (let lap = 1; lap <= totalLaps; lap++) {
    const lapTime = bestLapTime + Math.random() * 2000 - 1000 // ±1 second variation
    const sector1 = lapTime * 0.35 + Math.random() * 500
    const sector2 = lapTime * 0.35 + Math.random() * 500
    const sector3 = lapTime * 0.30 + Math.random() * 500

    laps.push({
      lapNumber: lap,
      lapTime: Math.round(lapTime),
      sector1Time: Math.round(sector1),
      sector2Time: Math.round(sector2),
      sector3Time: Math.round(sector3),
      position: currentPosition,
      gapToLeader: gapToLeader,
      gapToFront: gapToLeader > 0 ? gapToLeader - Math.random() * 0.5 : 0,
      bestLap: lapTime < bestLapTime,
      pitStop: lap === 25 || lap === 45, // Simulate pit stops
      tireCompound: lap < 25 ? 'C3' : lap < 45 ? 'C4' : 'C3',
      fuelLevel: Math.max(5, 100 - (lap / totalLaps) * 95), // Fuel decreases over race
      engineTemp: 95 + Math.random() * 10,
      brakeTemp: 150 + Math.random() * 50,
      tirePressures: {
        frontLeft: 38 + Math.random() * 2,
        frontRight: 38 + Math.random() * 2,
        rearLeft: 36 + Math.random() * 2,
        rearRight: 36 + Math.random() * 2
      },
      tireTemps: {
        frontLeft: [85, 90, 88, 87, 85, 83],
        frontRight: [85, 90, 88, 87, 85, 83],
        rearLeft: [88, 92, 90, 89, 87, 85],
        rearRight: [88, 92, 90, 89, 87, 85]
      }
    })

    if (lapTime < bestLapTime) bestLapTime = lapTime
    gapToLeader += Math.random() * 0.2 - 0.1 // Small position changes
    if (gapToLeader < 0) gapToLeader = 0
  }

  // Generate high-frequency telemetry points (every 100ms for 5 laps)
  const telemetry = []
  const sampleRate = 100 // ms
  const sampledLaps = 5

  for (let lap = 1; lap <= sampledLaps; lap++) {
    for (let distance = 0; distance < 1; distance += 0.01) { // 100 points per lap
      const timestamp = (lap - 1) * 90000 + distance * 90000

      telemetry.push({
        timestamp,
        lapNumber: lap,
        lapDistance: distance,

        position: {
          x: Math.sin(distance * Math.PI * 2) * 1000,
          y: Math.cos(distance * Math.PI * 2) * 1000,
          z: 0
        },

        velocity: {
          x: Math.cos(distance * Math.PI * 2) * 80, // ~80 m/s (288 km/h)
          y: -Math.sin(distance * Math.PI * 2) * 80,
          z: 0
        },

        acceleration: {
          x: Math.random() * 20 - 10,
          y: Math.random() * 20 - 10,
          z: Math.random() * 2 - 1
        },

        engine: {
          rpm: 11000 + Math.random() * 2000,
          throttle: 85 + Math.random() * 30,
          brake: Math.random() * 20,
          gear: Math.floor(Math.random() * 8) + 1,
          fuelFlow: 75 + Math.random() * 25
        },

        aero: {
          frontWing: -2 + Math.random() * 4,
          rearWing: 8 + Math.random() * 4,
          drag: 1200 + Math.random() * 200,
          downforce: 2500 + Math.random() * 500
        },

        tires: {
          frontLeft: {
            pressure: 38 + Math.random() * 2,
            temperature: {
              inner: 85 + Math.random() * 10,
              middle: 90 + Math.random() * 10,
              outer: 88 + Math.random() * 10
            },
            wear: Math.min(0.9, distance * 0.1 + Math.random() * 0.05)
          },
          frontRight: {
            pressure: 38 + Math.random() * 2,
            temperature: {
              inner: 85 + Math.random() * 10,
              middle: 90 + Math.random() * 10,
              outer: 88 + Math.random() * 10
            },
            wear: Math.min(0.9, distance * 0.1 + Math.random() * 0.05)
          },
          rearLeft: {
            pressure: 36 + Math.random() * 2,
            temperature: {
              inner: 88 + Math.random() * 10,
              middle: 92 + Math.random() * 10,
              outer: 90 + Math.random() * 10
            },
            wear: Math.min(0.9, distance * 0.1 + Math.random() * 0.05)
          },
          rearRight: {
            pressure: 36 + Math.random() * 2,
            temperature: {
              inner: 88 + Math.random() * 10,
              middle: 92 + Math.random() * 10,
              outer: 90 + Math.random() * 10
            },
            wear: Math.min(0.9, distance * 0.1 + Math.random() * 0.05)
          }
        },

        temperatures: {
          engine: 95 + Math.random() * 15,
          brakes: {
            frontLeft: 150 + Math.random() * 50,
            frontRight: 150 + Math.random() * 50,
            rearLeft: 180 + Math.random() * 50,
            rearRight: 180 + Math.random() * 50
          },
          gearbox: 90 + Math.random() * 20,
          battery: 35 + Math.random() * 10
        },

        raceData: {
          position: 1,
          gapToLeader: 0,
          gapToFront: 0,
          bestLapTime: bestLapTime,
          lastLapTime: 90000 + Math.random() * 2000,
          sector1Time: 31500 + Math.random() * 1000,
          sector2Time: 31500 + Math.random() * 1000,
          sector3Time: 27000 + Math.random() * 1000
        }
      })
    }
  }

  return {
    sessionId,
    track,
    race,
    driver,
    car: 'F1 Car (2026 Spec)',
    timestamp: new Date().toISOString(),
    laps,
    telemetry
  }
}

// Generate sample telemetry for Monaco
export const sampleMonacoTelemetry = generateSampleF1Telemetry('monaco', 'R1', 'Max Verstappen')
