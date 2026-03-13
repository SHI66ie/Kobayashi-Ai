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
      const driverData: StandingsResponse = await driverResponse.json()

      if (!driverData.success) {
        throw new Error(driverData.error || 'Failed to fetch driver standings')
      }

      // Fetch constructor standings
      const constructorResponse = await fetch(`/api/f1/standings?season=${season}&type=constructors`)
      const constructorData: StandingsResponse = await constructorResponse.json()

      if (!constructorData.success) {
        throw new Error(constructorData.error || 'Failed to fetch constructor standings')
      }

      setDriverStandings(driverData.standings as Driver[])
      setConstructorStandings(constructorData.standings as Constructor[])
      setLastUpdated(driverData.lastUpdated)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
      console.error('Error fetching F1 standings:', err)
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
