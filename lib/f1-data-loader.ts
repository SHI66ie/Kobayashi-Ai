import fs from 'fs';
import path from 'path';
import { openf1Api, transformOpenF1Data } from './openf1-api';

export interface F1Data {
    season: string;
    races: any[];
    standings?: any;
}

export async function loadEmbeddedF1Data(season: string): Promise<any> {
    try {
        const dataPath = path.join(process.cwd(), 'Data', 'f1-telemetry');
        let fileName = '';
        
        if (season === '2024') {
            fileName = 'F1_Seasons_Cleaned_2024.json';
        } else if (season === '2025') {
            fileName = 'F1-Seasons-2025.json';
        } else {
            // Default to 2024 if unknown
            fileName = 'F1_Seasons_Cleaned_2024.json';
        }

        const filePath = path.join(dataPath, fileName);
        if (!fs.existsSync(filePath)) {
            console.warn(`F1 Data file not found: ${filePath}`);
            return null;
        }

        const fileContent = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(fileContent);
    } catch (error) {
        console.error(`Error loading embedded F1 data for season ${season}:`, error);
        return null;
    }
}

export async function getF1StatisticsSummary(): Promise<{ historicalContext?: any, error?: string }> {
    try {
        const data2024 = await loadEmbeddedF1Data('2024');
        const data2025 = await loadEmbeddedF1Data('2025');

        // 2024 Summary: Get last race's standings if available
        let topDrivers2024 = [];
        if (Array.isArray(data2024)) {
            const lastRace = data2024[data2024.length - 1];
            topDrivers2024 = lastRace?.data?.filter((d: any) => d.pos && d.pts).slice(0, 10) || [];
        }

        // 2025 Summary: Get standings from last available race
        let topDrivers2025 = [];
        if (data2025) {
            const races = typeof data2025 === 'object' && !Array.isArray(data2025) ? Object.values(data2025) : [];
            const lastRace: any = races.length > 0 ? races[races.length - 1] : null;
            if (lastRace?.standings?.drivers) {
                topDrivers2025 = lastRace.standings.drivers.slice(0, 10);
            }
        }

        const summary = {
            historicalContext: {
                '2024': {
                    totalRaces: Array.isArray(data2024) ? data2024.length : 0,
                    finalStandings: topDrivers2024
                },
                '2025': {
                    totalRaces: data2025 && typeof data2025 === 'object' ? Object.keys(data2025).length : 0,
                    recentWinners: data2025 && typeof data2025 === 'object' ? Object.values(data2025).slice(-5).map((r: any) => ({ race: r.name, winner: r.winner?.driver })) : [],
                    standings: topDrivers2025
                }
            }
        };

        return summary;
    } catch (error) {
        console.error('Error generating F1 statistics summary:', error);
        return { error: 'Failed to generate summary' };
    }
}

export async function fetchLiveF1Data(): Promise<{ 
    currentSeason: string, 
    standings: any[], 
    recentRaces: any[], 
    nextRace: any, 
    liveSession?: any,
    weather?: any,
    error?: string 
}> {
    try {
        // Attempt to get real live data from OpenF1 API first
        console.log('🏎️  Fetching live F1 data from OpenF1...');
        const latestSessions = await openf1Api.getSessions();
        const latestSession = latestSessions.length > 0 ? latestSessions[latestSessions.length - 1] : null;
        
        let liveData: any = {
            currentSeason: new Date().getFullYear().toString(),
            standings: [],
            recentRaces: [],
            nextRace: null
        };

        if (latestSession) {
            const [drivers, standings, weather] = await Promise.all([
                openf1Api.getDrivers(latestSession.session_key),
                openf1Api.getDriverStandings(latestSession.session_key),
                openf1Api.getWeatherData(latestSession.session_key)
            ]);

            liveData.liveSession = transformOpenF1Data.session(latestSession);
            liveData.standings = standings.map(s => transformOpenF1Data.standing(s, drivers)).slice(0, 10);
            liveData.weather = weather.length > 0 ? transformOpenF1Data.weatherData([weather[weather.length - 1]])[0] : null;
            
            console.log(`✅ Fetched real live data for ${latestSession.circuit_short_name}`);
        }

        // Fallback to local 2026 mock API if real API is insufficient or offline
        if (liveData.standings.length === 0) {
            console.log('⚠️  Real-time data sparse, blending with 2026 mock data...');
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
            const [standingsRes, resultsRes] = await Promise.all([
                fetch(`${baseUrl}/api/f1/standings?season=2026`),
                fetch(`${baseUrl}/api/f1/race-results?season=2026`)
            ]);

            const standings = await standingsRes.json();
            const results = await resultsRes.json();

            liveData.standings = standings.success ? standings.standings.slice(0, 10) : liveData.standings;
            liveData.recentRaces = results.success ? results.races.filter((r: any) => r.status === 'completed').slice(-3) : [];
            liveData.nextRace = results.success ? results.nextRace : null;
        }

        return liveData;
    } catch (error) {
        console.error('Error fetching live F1 data:', error);
        return { 
            currentSeason: '2026',
            standings: [],
            recentRaces: [],
            nextRace: null,
            error: 'Failed to fetch live data' 
        };
    }
}

