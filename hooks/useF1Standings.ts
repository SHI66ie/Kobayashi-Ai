'use client'

import { useState, useEffect } from 'react'

interface Driver {
  position: number
  driver: string
  driverCode: string
  team: string
  nationality: string
  countryFlag: string
  points: number
  wins: number
  podiums: number
  image?: string
}

interface Constructor {
  position: number
  team: string
  nationality: string
  countryFlag: string
  points: number
  wins: number
  podiums: number
  drivers: string[]
}

interface StandingsResponse {
  success: boolean
  season: string
  type: 'drivers' | 'constructors'
  lastUpdated: string
  standings: Driver[] | Constructor[]
  totalDrivers?: number
  totalTeams?: number
  error?: string
  message?: string
}

export function useF1Standings(season: string = '2026') {
  const [driverStandings, setDriverStandings] = useState<Driver[]>([])
  const [constructorStandings, setConstructorStandings] = useState<Constructor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  const fetchStandings = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch driver standings
      const driverResponse = await fetch(`/api/f1/standings?season=${season}&type=drivers`)
      if (!driverResponse.ok) {
        throw new Error('Failed to fetch driver standings')
      }
      const driverData: StandingsResponse = await driverResponse.json()

      if (!driverData.success) {
        throw new Error(driverData.error || 'Failed to fetch driver standings')
      }

      // Fetch constructor standings
      const constructorResponse = await fetch(`/api/f1/standings?season=${season}&type=constructors`)
      if (!constructorResponse.ok) {
        throw new Error('Failed to fetch constructor standings')
      }
      const constructorData: StandingsResponse = await constructorResponse.json()

      if (!constructorData.success) {
        throw new Error(constructorData.error || 'Failed to fetch constructor standings')
      }

      setDriverStandings(driverData.standings as Driver[])
      setConstructorStandings(constructorData.standings as Constructor[])
      setLastUpdated(driverData.lastUpdated)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      console.error('Error fetching F1 standings:', errorMessage)
      setError(errorMessage)
      
      // Set fallback data to prevent complete failure
      setDriverStandings([
        { position: 1, driver: 'G. Russell', driverCode: 'RUS', team: 'Mercedes', nationality: 'United Kingdom', countryFlag: '🇬🇧', points: 75, wins: 3, podiums: 3 },
        { position: 2, driver: 'A.K. Antonelli', driverCode: 'ANT', team: 'Mercedes', nationality: 'Italy', countryFlag: '🇮🇹', points: 54, wins: 0, podiums: 3 },
        { position: 3, driver: 'C. Leclerc', driverCode: 'LEC', team: 'Ferrari', nationality: 'Monaco', countryFlag: '🇲🇨', points: 45, wins: 0, podiums: 3 },
        { position: 4, driver: 'L. Hamilton', driverCode: 'HAM', team: 'Ferrari', nationality: 'United Kingdom', countryFlag: '🇬🇧', points: 36, wins: 0, podiums: 0 },
        { position: 5, driver: 'L. Norris', driverCode: 'NOR', team: 'McLaren', nationality: 'United Kingdom', countryFlag: '🇬🇧', points: 30, wins: 0, podiums: 0 }
      ])
      
      setConstructorStandings([
        { position: 1, team: 'Mercedes', nationality: 'Germany', countryFlag: '🇩🇪', points: 129, wins: 3, podiums: 6, drivers: ['G. Russell', 'A.K. Antonelli'] },
        { position: 2, team: 'Ferrari', nationality: 'Italy', countryFlag: '🇮🇹', points: 81, wins: 0, podiums: 3, drivers: ['C. Leclerc', 'L. Hamilton'] },
        { position: 3, team: 'McLaren', nationality: 'United Kingdom', countryFlag: '🇬🇧', points: 30, wins: 0, podiums: 0, drivers: ['L. Norris', 'O. Piastri'] },
        { position: 4, team: 'Red Bull', nationality: 'Austria', countryFlag: '🇦🇹', points: 24, wins: 0, podiums: 0, drivers: ['M. Verstappen', 'I. Hadjar'] },
        { position: 5, team: 'Haas', nationality: 'United States', countryFlag: '🇺🇸', points: 18, wins: 0, podiums: 0, drivers: ['O. Bearman', 'E. Ocon'] }
      ])
      
      setLastUpdated(new Date().toISOString())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStandings()
  }, [season])

  // Auto-refresh every 5 minutes during race weekends
  useEffect(() => {
    const interval = setInterval(() => {
      fetchStandings()
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }, [season])

  return {
    driverStandings,
    constructorStandings,
    loading,
    error,
    lastUpdated,
    refetch: fetchStandings
  }
}

// Helper function to get top N drivers
export function getTopDrivers(drivers: Driver[], count: number = 5): Driver[] {
  return drivers.slice(0, count)
}

// Helper function to get top N constructors
export function getTopConstructors(constructors: Constructor[], count: number = 5): Constructor[] {
  return constructors.slice(0, count)
}

// Helper function to find driver by position
export function findDriverByPosition(drivers: Driver[], position: number): Driver | undefined {
  return drivers.find(driver => driver.position === position)
}

// Helper function to find constructor by position
export function findConstructorByPosition(constructors: Constructor[], position: number): Constructor | undefined {
  return constructors.find(constructor => constructor.position === position)
}
