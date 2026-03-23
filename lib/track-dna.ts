// F1 Track DNA Utility
// Centralizes circuit characteristics for simulation and matching

export interface TrackProfile {
  id: string;
  name: string;
  dna: string;
  tags: string[];
}

export const TRACK_PROFILES: Record<string, TrackProfile> = {
  'bahrain': { id: 'bahrain', name: 'Bahrain', dna: 'High-deg, traction-heavy, warm asphalt', tags: ['traction', 'high-deg', 'hot'] },
  'saudi arabian': { id: 'saudi', name: 'Saudi Arabia', dna: 'High-speed, street circuit, low-deg', tags: ['street', 'high-speed', 'low-deg'] },
  'australian': { id: 'melbourne', name: 'Australia', dna: 'Semi-street, medium-deg, technical flow', tags: ['semi-street', 'medium-deg', 'technical'] },
  'suzuka': { id: 'suzuka', name: 'Japan', dna: 'High-speed corners, aero-dependent, figure-8 technical', tags: ['high-speed', 'aero', 'technical'] },
  'shanghai': { id: 'shanghai', name: 'China', dna: 'Technical, heavy-braking, front-limited', tags: ['technical', 'braking', 'front-limited'] },
  'miami': { id: 'miami', name: 'Miami', dna: 'Street, traction-heavy, high-track-temp', tags: ['street', 'traction', 'hot'] },
  'emilia romagna': { id: 'imola', name: 'Imola', dna: 'Technical, narrow, high-kerb usage', tags: ['technical', 'narrow', 'kerbs'] },
  'monaco': { id: 'monaco', name: 'Monaco', dna: 'Low-speed, street, zero-overtaking, manual agility', tags: ['low-speed', 'street', 'no-overtaking'] },
  'canadian': { id: 'montreal', name: 'Canada', dna: 'Stop-start, heavy-braking, chassis-dependent', tags: ['stop-start', 'braking', 'chassis'] },
  'spanish': { id: 'barcelona', name: 'Spain', dna: 'Aero-dependent, high-deg, reference circuit', tags: ['aero', 'high-deg', 'reference'] },
  'austrian': { id: 'redbull_ring', name: 'Austria', dna: 'High-speed, elevation, short-lap, braking-limited', tags: ['high-speed', 'elevation', 'short-lap'] },
  'british': { id: 'silverstone', name: 'Great Britain', dna: 'High-speed, aero-heavy, tire-killing (lateral loads)', tags: ['high-speed', 'aero', 'high-tire-load'] },
  'hungarian': { id: 'budapest', name: 'Hungary', dna: 'Low-speed, technical, high-ambient-temp', tags: ['low-speed', 'technical', 'hot'] },
  'belgian': { id: 'spa', name: 'Belgium', dna: 'Ultra-high-speed, massive elevation, changeable-weather', tags: ['ultra-high-speed', 'elevation', 'rain'] },
  'dutch': { id: 'zandvoort', name: 'Netherlands', dna: 'Technical, banking, narrow, high-downforce', tags: ['technical', 'banking', 'narrow'] },
  'italian': { id: 'monza', name: 'Italy', dna: 'Ultra-high-speed, low-downforce, heavy-braking', tags: ['ultra-high-speed', 'low-downforce', 'braking'] },
  'azerbaijan': { id: 'baku', name: 'Azerbaijan', dna: 'Street, ultra-long-straight, heavy-braking, low-downforce', tags: ['street', 'long-straight', 'braking'] },
  'singapore': { id: 'singapore', name: 'Singapore', dna: 'Street, high-humidity, low-speed, bumpy, lights', tags: ['street', 'humidity', 'bumpy', 'night'] },
  'united states': { id: 'austin', name: 'USA (Austin)', dna: 'All-rounder, bumpy, technical first sector', tags: ['all-rounder', 'bumpy', 'technical'] },
  'mexico city': { id: 'mexico', name: 'Mexico', dna: 'High-altitude, low-air-density, cooling-critical, low-grip', tags: ['altitude', 'cooling', 'low-grip'] },
  'sao paulo': { id: 'brazil', name: 'Brazil', dna: 'Elevation, short-lap, changeable-weather, traction', tags: ['elevation', 'short-lap', 'rain', 'traction'] },
  'las vegas': { id: 'vegas', name: 'USA (Las Vegas)', dna: 'Street, high-speed, cold-track, low-downforce', tags: ['street', 'high-speed', 'cold'] },
  'qatar': { id: 'losail', name: 'Qatar', dna: 'High-speed, high-g, lateral-limited, sand-risk', tags: ['high-speed', 'high-g', 'sand'] },
  'abu dhabi': { id: 'yas_marina', name: 'Abu Dhabi', dna: 'Traction-heavy, medium-speed, dusk conditions', tags: ['traction', 'dusk', 'medium-speed'] }
};

export function findProfileByName(name: string): TrackProfile | null {
  const key = Object.keys(TRACK_PROFILES).find(k => name.toLowerCase().includes(k));
  return key ? TRACK_PROFILES[key] : null;
}

export function findSimilarProfiles(profile: TrackProfile): TrackProfile[] {
  return Object.values(TRACK_PROFILES).filter(p => 
    p.id !== profile.id && p.tags.some(t => profile.tags.includes(t))
  );
}
