// Sportradar F1 API Integration
// Documentation: https://developer.sportradar.com/docs/read/racing/Formula_1_v2
// API endpoints and authentication for Sportradar Formula 1 v2

const API_BASE_URL = 'https://api.sportradar.com'
const API_KEY = process.env.F1_API_KEY

// Check if we have API configuration
const hasApiConfig = API_KEY && API_KEY !== 'your_sportradar_api_key_here'

// Sportradar API Response types (based on their documentation)
export interface SRCompetition {
  id: string
  name: string
  parent_id?: string
  gender?: string
}

export interface SRSeason {
  id: string
  name: string
  start_date: string
  end_date: string
  year: string
  competition_id: string
}

export interface SRTeam {
  id: string
  name: string
  country_code?: string
  abbreviation?: string
  gender?: string
}

export interface SRDriver {
  id: string
  name: string
  country_code?: string
  date_of_birth?: string
  nationality?: string
}

export interface SRVenue {
  id: string
  name: string
  capacity?: number
  city_name?: string
  country_name?: string
  country_code?: string
  timezone?: string
}

export interface SRStage {
  id: string
  name: string
  description?: string
  scheduled?: string
  scheduled_end?: string
  type: string
  status: string
  venue?: SRVenue
  competitors?: Array<{
    id: string
    name: string
    country?: string
    country_code?: string
    abbreviation?: string
    qualifier?: string
  }>
}

export interface SRSeasonResponse {
  generated_at: string
  competitions: SRCompetition[]
  seasons: SRSeason[]
}

export interface SRStandingsResponse {
  generated_at: string
  season: SRSeason
  standings: Array<{
    type: string
    groups: Array<{
      id: string
      name: string
      standings: Array<{
        rank: number
        competitor: SRTeam
        points: number
        wins?: number
      }>
    }>
  }>
}

export interface SRRaceResponse {
  generated_at: string
  season: SRSeason
  stages: SRStage[]
}

// Generic API fetch function for Sportradar
async function sportradarFetch<T>(endpoint: string): Promise<T> {
  if (!API_KEY || API_KEY === 'your_sportradar_api_key_here') {
    throw new Error('F1 API key is not configured. Please set F1_API_KEY in your environment variables.')
  }

  const url = `${API_BASE_URL}${endpoint}?api_key=${API_KEY}`

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Sportradar API request failed: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  return data
}

// Sportradar API Functions
export const f1Api = {
  // Get seasons for Formula 1
  async getSeasons(): Promise<SRSeasonResponse> {
    return await sportradarFetch<SRSeasonResponse>('/formula1/trial/v2/en/seasons.json')
  },

  // Get current season standings
  async getStandings(seasonId?: string): Promise<SRStandingsResponse> {
    const endpoint = seasonId
      ? `/formula1/trial/v2/en/seasons/${seasonId}/standings.json`
      : '/formula1/trial/v2/en/seasons/standings.json'
    return await sportradarFetch<SRStandingsResponse>(endpoint)
  },

  // Get race schedule for a season
  async getRaces(seasonId: string): Promise<SRRaceResponse> {
    return await sportradarFetch<SRRaceResponse>(`/formula1/trial/v2/en/seasons/${seasonId}/stages.json`)
  },

  // Get specific race details
  async getRace(seasonId: string, stageId: string): Promise<any> {
    return await sportradarFetch(`/formula1/trial/v2/en/seasons/${seasonId}/stages/${stageId}.json`)
  },

  // Get competitor (team/driver) information
  async getCompetitor(competitorId: string): Promise<any> {
    return await sportradarFetch(`/formula1/trial/v2/en/competitors/${competitorId}/profile.json`)
  }
}

// Helper functions to transform Sportradar API data to our app format
export const transformApiData = {
  // Transform Sportradar team to our app format
  team(srTeam: SRTeam): any {
    return {
      id: srTeam.id,
      name: srTeam.name,
      abbreviation: srTeam.abbreviation,
      country: srTeam.country_code
    }
  },

  // Transform Sportradar driver to our app format
  driver(srDriver: SRDriver): any {
    return {
      id: srDriver.id,
      name: srDriver.name,
      nationality: srDriver.nationality,
      countryCode: srDriver.country_code,
      dateOfBirth: srDriver.date_of_birth
    }
  },

  // Transform Sportradar race/stage to our app format
  race(srStage: SRStage): any {
    return {
      id: srStage.id,
      name: srStage.name,
      venue: srStage.venue?.name,
      city: srStage.venue?.city_name,
      country: srStage.venue?.country_name,
      scheduled: srStage.scheduled,
      status: srStage.status
    }
  },

  // Transform Sportradar standing to our app format
  standing(srStanding: any): any {
    return {
      position: srStanding.rank,
      team: srStanding.competitor.name,
      points: srStanding.points,
      wins: srStanding.wins || 0
    }
  }
}

// Error handling wrapper
export async function safeApiCall<T>(
  apiCall: () => Promise<T>,
  fallbackData?: T
): Promise<{ data: T | null; error: string | null }> {
  try {
    const data = await apiCall()
    return { data, error: null }
  } catch (error) {
    console.error('Sportradar F1 API Error:', error)
    return {
      data: fallbackData || null,
      error: error instanceof Error ? error.message : 'Unknown API error'
    }
  }
}
