'use client'

import { useState, useEffect } from 'react'

interface Driver {
  position: number
  driver: string
  driverCode: string
  team: string
  teamColor?: string
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
  teamColor?: string
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

export function useF1Standings(season: string = '2025') {
  const [driverStandings, setDriverStandings] = useState<Driver[]>([])
  const [constructorStandings, setConstructorStandings] = useState<Constructor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>('')
  const [actualSeason, setActualSeason] = useState<string>(season)
  const [dataNote, setDataNote] = useState<string>('')

  const fetchStandings = async (targetSeason: string) => {
    try {
      setLoading(true)
      setError(null)
      setDataNote('')

      // Fetch driver standings - full grid
      const driverResponse = await fetch(`/api/f1/standings?season=${targetSeason}&type=drivers`)
      if (!driverResponse.ok) {
        throw new Error('Failed to fetch driver standings')
      }
      const driverData: StandingsResponse = await driverResponse.json()

      if (!driverData.success) {
        throw new Error(driverData.error || 'Failed to fetch driver standings')
      }

      // Fetch constructor standings - full grid
      const constructorResponse = await fetch(`/api/f1/standings?season=${targetSeason}&type=constructors`)
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
      setActualSeason(targetSeason)

      // If we had to fall back to an older season, show a note
      if (targetSeason !== season && parseInt(season) > 2025) {
        setDataNote(`2026 season standings not yet published — showing ${targetSeason} data`)
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      console.error('Error fetching F1 standings:', errorMessage)
      setError(errorMessage)
      
      // Graceful fallback only for very recent/future seasons
      if (parseInt(targetSeason) >= 2025) {
        // Try previous year automatically
        if (targetSeason === '2026' || targetSeason === '2025') {
          console.log('[useF1Standings] Auto-falling back to 2024 for real data')
          return fetchStandings('2024')
        }
      }
      
      // Last resort static fallback (clearly marked)
      setDataNote('Using demo data — live API unavailable')
      setDriverStandings([
        { position: 1, driver: 'Max Verstappen', driverCode: 'VER', team: 'Red Bull', teamColor: '#1E41FF', nationality: 'Netherlands', countryFlag: '🇳🇱', points: 437, wins: 9, podiums: 14 },
        { position: 2, driver: 'Lando Norris', driverCode: 'NOR', team: 'McLaren', teamColor: '#FF8700', nationality: 'United Kingdom', countryFlag: '🇬🇧', points: 374, wins: 3, podiums: 12 },
        { position: 3, driver: 'Charles Leclerc', driverCode: 'LEC', team: 'Ferrari', teamColor: '#DC143C', nationality: 'Monaco', countryFlag: '🇲🇨', points: 356, wins: 3, podiums: 11 },
        { position: 4, driver: 'Oscar Piastri', driverCode: 'PIA', team: 'McLaren', teamColor: '#FF8700', nationality: 'Australia', countryFlag: '🇦🇺', points: 292, wins: 2, podiums: 8 },
        { position: 5, driver: 'Carlos Sainz', driverCode: 'SAI', team: 'Ferrari', teamColor: '#DC143C', nationality: 'Spain', countryFlag: '🇪🇸', points: 290, wins: 2, podiums: 8 },
      ])
      
      setConstructorStandings([
        { position: 1, team: 'McLaren', teamColor: '#FF8700', nationality: 'United Kingdom', countryFlag: '🇬🇧', points: 666, wins: 5, podiums: 20, drivers: ['L. Norris', 'O. Piastri'] },
        { position: 2, team: 'Ferrari', teamColor: '#DC143C', nationality: 'Italy', countryFlag: '🇮🇹', points: 652, wins: 5, podiums: 19, drivers: ['C. Leclerc', 'C. Sainz'] },
        { position: 3, team: 'Red Bull', teamColor: '#1E41FF', nationality: 'Austria', countryFlag: '🇦🇹', points: 589, wins: 9, podiums: 16, drivers: ['M. Verstappen', 'S. Perez'] },
        { position: 4, team: 'Mercedes', teamColor: '#00D2BE', nationality: 'Germany', countryFlag: '🇩🇪', points: 468, wins: 0, podiums: 6, drivers: ['L. Hamilton', 'G. Russell'] },
        { position: 5, team: 'Aston Martin', teamColor: '#006F62', nationality: 'United Kingdom', countryFlag: '🇬🇧', points: 94, wins: 0, podiums: 0, drivers: ['F. Alonso', 'L. Stroll'] },
      ])
      
      setLastUpdated(new Date().toISOString())
      setActualSeason(targetSeason)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStandings(season)
  }, [season])

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchStandings(actualSeason || season)
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [actualSeason, season])

  return {
    driverStandings,
    constructorStandings,
    loading,
    error,
    lastUpdated,
    actualSeason,
    dataNote,
    refetch: () => fetchStandings(actualSeason || season),
    season
  }
}

// Legacy helpers kept for backward compat in other components (now recommend using full grid)
export function getTopDrivers(drivers: Driver[], count: number = 10): Driver[] {
  return [...drivers].sort((a, b) => a.position - b.position).slice(0, count)
}

export function getTopConstructors(constructors: Constructor[], count: number = 10): Constructor[] {
  return [...constructors].sort((a, b) => a.position - b.position).slice(0, count)
}

export function findDriverByPosition(drivers: Driver[], position: number): Driver | undefined {
  return drivers.find(driver => driver.position === position)
}

export function findConstructorByPosition(constructors: Constructor[], position: number): Constructor | undefined {
  return constructors.find(constructor => constructor.position === position)
}