// OpenF1 API Integration
// Modern F1 data API starting from 2023 season
// Documentation: https://openf1.org/

const OPENF1_BASE_URL = 'https://api.openf1.org/v1'

export interface OpenF1Driver {
    driver_number: number
    broadcast_name: string
    full_name: string
    name_acronym: string
    team_name: string
    team_colour: string
    first_name: string
    last_name: string
    headshot_url: string
    country_code: string
}

export interface OpenF1Session {
    session_key: number
    session_name: string
    session_type: string
    date_start: string
    date_end: string
    location: string
    country_name: string
    circuit_short_name: string
}

export interface OpenF1ChampionshipDriver {
    session_key: number
    driver_number: number
    position: number
    points: number
}

async function openf1Fetch<T>(endpoint: string, params: Record<string, any> = {}): Promise<T> {
    const query = new URLSearchParams(params).toString()
    const url = `${OPENF1_BASE_URL}${endpoint}${query ? `?${query}` : ''}`

    const response = await fetch(url)
    if (!response.ok) {
        throw new Error(`OpenF1 API request failed: ${response.status} ${response.statusText}`)
    }

    return await response.json()
}

export const openf1Api = {
    // Get drivers for a specific session or latest
    async getDrivers(sessionKey?: number): Promise<OpenF1Driver[]> {
        const params = sessionKey ? { session_key: sessionKey } : {}
        return await openf1Fetch<OpenF1Driver[]>('/drivers', params)
    },

    // Get sessions (races, qualifying, etc.)
    async getSessions(year?: number): Promise<OpenF1Session[]> {
        const params = year ? { year } : {}
        return await openf1Fetch<OpenF1Session[]>('/sessions', params)
    },

    // Get championship standings for drivers
    async getDriverStandings(sessionKey: number): Promise<OpenF1ChampionshipDriver[]> {
        return await openf1Fetch<OpenF1ChampionshipDriver[]>('/championship_drivers', { session_key: sessionKey })
    },

    // Get latest session
    async getLatestSession(): Promise<OpenF1Session[]> {
        return await openf1Fetch<OpenF1Session[]>('/sessions', { session_key: 'latest' })
    }
}

export const transformOpenF1Data = {
    driver(d: OpenF1Driver): any {
        return {
            id: d.driver_number.toString(),
            name: d.full_name,
            code: d.name_acronym,
            number: d.driver_number.toString(),
            team: d.team_name,
            color: `#${d.team_colour}`,
            image: d.headshot_url
        }
    },

    session(s: OpenF1Session): any {
        return {
            id: s.session_key.toString(),
            name: s.session_name,
            type: s.session_type,
            location: s.location,
            country: s.country_name,
            circuit: s.circuit_short_name,
            date: s.date_start
        }
    },

    standing(s: OpenF1ChampionshipDriver, drivers: OpenF1Driver[]): any {
        const driver = drivers.find(d => d.driver_number === s.driver_number)
        return {
            position: s.position,
            points: s.points,
            driver: driver ? transformOpenF1Data.driver(driver) : { name: `Driver #${s.driver_number}` },
            team: driver ? { name: driver.team_name } : { name: 'Unknown' }
        }
    }
}
