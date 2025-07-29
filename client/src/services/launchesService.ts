import { useQuery } from '@tanstack/react-query';

export interface SpaceXLaunch {
  id: string;
  name: string;
  date_utc: string;
  flight_number: number;
  details: string;
  links: {
    patch: {
      small: string;
      large: string;
    };
    webcast: string;
    article: string;
    wikipedia: string;
  };
  rocket: {
    name: string;
    type: string;
  };
  launchpad: {
    name: string;
    full_name: string;
  };
  success: boolean;
}

export interface SpaceDevsLaunch {
  id: string;
  name: string;
  net: string;
  status: {
    name: string;
    abbrev: string;
  };
  mission: {
    name: string;
    description: string;
    type: string;
  };
  rocket: {
    configuration: {
      name: string;
      family: string;
    };
  };
  pad: {
    name: string;
    location: {
      name: string;
      country_code: string;
    };
  };
  webcast_live: boolean;
  image_url: string;
  url: string;
}

export interface ISSLocation {
  iss_position: {
    latitude: string;
    longitude: string;
  };
  timestamp: number;
  message: string;
}

export interface ISSPass {
  duration: number;
  risetime: number;
}

export interface PersonInSpace {
  name: string;
  craft: string;
}

export interface PeopleInSpace {
  number: number;
  people: PersonInSpace[];
  message: string;
}

export interface SpaceEvent {
  id: number;
  name: string;
  description: string;
  date: string;
  type: {
    name: string;
  };
  location: string;
  news_url: string;
  video_url: string;
  feature_image: string;
}

export interface SpaceAgency {
  id: number;
  name: string;
  abbrev: string;
  type: string;
  country_code: string;
  description: string;
  administrator: string;
  founding_year: string;
  launchers: string;
  spacecraft: string;
  logo_url: string;
}

export interface SpaceXRocket {
  id: string;
  name: string;
  type: string;
  active: boolean;
  stages: number;
  boosters: number;
  cost_per_launch: number;
  success_rate_pct: number;
  first_flight: string;
  country: string;
  company: string;
  height: {
    meters: number;
    feet: number;
  };
  diameter: {
    meters: number;
    feet: number;
  };
  mass: {
    kg: number;
    lb: number;
  };
  description: string;
  flickr_images: string[];
}

export interface SpaceNews {
  id: number;
  title: string;
  url: string;
  image_url: string;
  news_site: string;
  summary: string;
  published_at: string;
  updated_at: string;
}

export interface NASAAPOD {
  date: string;
  explanation: string;
  hdurl?: string;
  media_type: string;
  service_version: string;
  title: string;
  url: string;
}

export interface NearEarthObject {
  id: string;
  name: string;
  nasa_jpl_url: string;
  absolute_magnitude_h: number;
  estimated_diameter: {
    kilometers: {
      estimated_diameter_min: number;
      estimated_diameter_max: number;
    };
    meters: {
      estimated_diameter_min: number;
      estimated_diameter_max: number;
    };
  };
  is_potentially_hazardous_asteroid: boolean;
  close_approach_data: Array<{
    close_approach_date: string;
    relative_velocity: {
      kilometers_per_second: string;
      kilometers_per_hour: string;
    };
    miss_distance: {
      astronomical: string;
      lunar: string;
      kilometers: string;
    };
  }>;
}

export interface MarsWeather {
  sol: number;
  season: string;
  min_temp: number;
  max_temp: number;
  pressure: number;
  wind_speed: number;
  wind_direction: string;
  sunrise: string;
  sunset: string;
  atmo_opacity: string;
}

export interface MoonPhase {
  phase: number;
  illumination: number;
  phase_name: string;
  moon_age: number;
  distance_km: number;
  angular_diameter: number;
  sun_distance: number;
  sun_angular_diameter: number;
}

export interface SpaceWeatherData {
  time_tag: string;
  solar_wind_speed: number;
  solar_wind_density: number;
  solar_wind_temperature: number;
  magnetic_field: number;
  kp_index: number;
  aurora_activity: string;
  solar_flare_probability: string;
}

export interface Satellite {
  satid: number;
  satname: string;
  intDesignator: string;
  launchDate: string;
  satlat: number;
  satlng: number;
  satalt: number;
}

export interface Exoplanet {
  pl_name: string;
  hostname: string;
  sy_dist: number;
  pl_orbper: number;
  pl_bmasse: number;
  pl_rade: number;
  st_teff: number;
  disc_year: number;
  discoverymethod: string;
}

export interface SolarActivity {
  sunspot_number: number;
  solar_flux: number;
  ap_index: number;
  solar_cycle_progress: number;
  solar_wind_speed: number;
  coronal_mass_ejections: number;
}

export interface HubbleImage {
  id: string;
  name: string;
  description: string;
  image_files: Array<{
    file_url: string;
    file_size: number;
  }>;
  mission: string;
  collection: string;
  date_created: string;
}

export interface Earthquake {
  id: string;
  properties: {
    mag: number;
    place: string;
    time: number;
    updated: number;
    tz: number;
    url: string;
    detail: string;
    felt: number;
    cdi: number;
    mmi: number;
    alert: string;
    status: string;
    tsunami: number;
    sig: number;
    net: string;
    code: string;
    ids: string;
    sources: string;
    types: string;
    nst: number;
    dmin: number;
    rms: number;
    gap: number;
    magType: string;
    type: string;
    title: string;
  };
  geometry: {
    type: string;
    coordinates: [number, number, number];
  };
}

export function useSpaceXUpcomingLaunches() {
  return useQuery<SpaceXLaunch[]>({
    queryKey: ['spacex-upcoming'],
    queryFn: async () => {
      const response = await fetch('/api/spacex/upcoming');
      if (!response.ok) {
        throw new Error('Failed to fetch SpaceX upcoming launches');
      }
      return response.json();
    }
  });
}

export function useSpaceXLaunches() {
  return useQuery<SpaceXLaunch[]>({
    queryKey: ['spacex-launches'],
    queryFn: async () => {
      const response = await fetch('/api/spacex/launches');
      if (!response.ok) {
        throw new Error('Failed to fetch SpaceX launches');
      }
      return response.json();
    }
  });
}

export function useUpcomingLaunches() {
  return useQuery<{ results: SpaceDevsLaunch[]; count: number; next: string | null }>({
    queryKey: ['upcoming-launches'],
    queryFn: async () => {
      const response = await fetch('/api/launches/upcoming');
      if (!response.ok) {
        throw new Error('Failed to fetch upcoming launches');
      }
      const data = await response.json();
      return data;
    }
  });
}

export function usePreviousLaunches() {
  return useQuery<{ results: SpaceDevsLaunch[]; count: number; next: string | null }>({
    queryKey: ['previous-launches'],
    queryFn: async () => {
      const response = await fetch('/api/launches/previous');
      if (!response.ok) {
        throw new Error('Failed to fetch previous launches');
      }
      const data = await response.json();
      return data;
    }
  });
}

export function useISSLocation() {
  return useQuery<ISSLocation>({
    queryKey: ['iss-location'],
    queryFn: async () => {
      const response = await fetch('/api/iss/location');
      if (!response.ok) {
        throw new Error('Failed to fetch ISS location');
      }
      return response.json();
    },
    refetchInterval: 60000,
  });
}

export function useISSPassTimes(lat?: number, lon?: number) {
  return useQuery<{ response: ISSPass[] }>({
    queryKey: ['iss-pass', lat, lon],
    queryFn: async () => {
      if (!lat || !lon) {
        throw new Error('Latitude and longitude required');
      }
      const response = await fetch(`/api/iss/pass?lat=${lat}&lon=${lon}`);
      if (!response.ok) {
        throw new Error('Failed to fetch ISS pass times');
      }
      return response.json();
    },
    enabled: !!lat && !!lon,
  });
}

export function usePeopleInSpace() {
  return useQuery<PeopleInSpace>({
    queryKey: ['people-in-space'],
    queryFn: async () => {
      const response = await fetch('/api/space/people');
      if (!response.ok) {
        throw new Error('Failed to fetch people in space');
      }
      return response.json();
    },
  });
}

export function useSpaceEvents() {
  return useQuery<{ results: SpaceEvent[] }>({
    queryKey: ['space-events'],
    queryFn: async () => {
      const response = await fetch('/api/space/events');
      if (!response.ok) {
        throw new Error('Failed to fetch space events');
      }
      return response.json();
    },
  });
}

export function useSpacecraft() {
  return useQuery<{ results: any[] }>({
    queryKey: ['spacecraft'],
    queryFn: async () => {
      const response = await fetch('/api/space/spacecraft');
      if (!response.ok) {
        throw new Error('Failed to fetch spacecraft');
      }
      return response.json();
    },
  });
}

export function useSpaceAgencies() {
  return useQuery<{ results: SpaceAgency[] }>({
    queryKey: ['space-agencies'],
    queryFn: async () => {
      const response = await fetch('/api/space/agencies');
      if (!response.ok) {
        throw new Error('Failed to fetch space agencies');
      }
      return response.json();
    },
  });
}

export function useLaunchPads() {
  return useQuery<{ results: any[] }>({
    queryKey: ['launch-pads'],
    queryFn: async () => {
      const response = await fetch('/api/space/launchpads');
      if (!response.ok) {
        throw new Error('Failed to fetch launch pads');
      }
      return response.json();
    },
  });
}

export function useSpaceXRockets() {
  return useQuery<SpaceXRocket[]>({
    queryKey: ['spacex-rockets'],
    queryFn: async () => {
      const response = await fetch('/api/spacex/rockets');
      if (!response.ok) {
        throw new Error('Failed to fetch SpaceX rockets');
      }
      return response.json();
    },
  });
}

export function useSpaceXCompany() {
  return useQuery<any>({
    queryKey: ['spacex-company'],
    queryFn: async () => {
      const response = await fetch('/api/spacex/company');
      if (!response.ok) {
        throw new Error('Failed to fetch SpaceX company info');
      }
      return response.json();
    },
  });
}

export function useSpaceXStarlink() {
  return useQuery<any[]>({
    queryKey: ['spacex-starlink'],
    queryFn: async () => {
      const response = await fetch('/api/spacex/starlink');
      if (!response.ok) {
        throw new Error('Failed to fetch SpaceX Starlink data');
      }
      return response.json();
    },
  });
}

export function useSpaceNews() {
  return useQuery<{ results: SpaceNews[] }>({
    queryKey: ['space-news'],
    queryFn: async () => {
      const response = await fetch('/api/space/news');
      if (!response.ok) {
        throw new Error('Failed to fetch space news');
      }
      return response.json();
    },
  });
}

export function useSolarSystemBodies() {
  return useQuery<{ bodies: any[] }>({
    queryKey: ['solar-system-bodies'],
    queryFn: async () => {
      const response = await fetch('/api/space/solar-system');
      if (!response.ok) {
        throw new Error('Failed to fetch solar system bodies');
      }
      return response.json();
    },
  });
}

export function useNASAAPOD() {
  return useQuery<NASAAPOD>({
    queryKey: ['nasa-apod'],
    queryFn: async () => {
      const response = await fetch('/api/nasa/apod');
      if (!response.ok) {
        throw new Error('Failed to fetch NASA APOD');
      }
      return response.json();
    },
  });
}

export function useSpaceWeather() {
  return useQuery<SpaceWeatherData[]>({
    queryKey: ['space-weather'],
    queryFn: async () => {
      const response = await fetch('/api/nasa/space-weather');
      if (!response.ok) {
        throw new Error('Failed to fetch space weather');
      }
      return response.json();
    },
  });
}

export function useNearEarthObjects() {
  return useQuery<{ near_earth_objects: Record<string, NearEarthObject[]> }>({
    queryKey: ['near-earth-objects'],
    queryFn: async () => {
      const response = await fetch('/api/nasa/neo');
      if (!response.ok) {
        throw new Error('Failed to fetch near earth objects');
      }
      return response.json();
    },
  });
}

// NEW API HOOKS FOR ALL THE ADDITIONAL DATA SOURCES

export function useMarsWeather() {
  return useQuery<MarsWeather>({
    queryKey: ['mars-weather'],
    queryFn: async () => {
      const response = await fetch('/api/nasa/mars-weather');
      if (!response.ok) {
        throw new Error('Failed to fetch Mars weather data');
      }
      return response.json();
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

export function useMoonPhase() {
  return useQuery<MoonPhase>({
    queryKey: ['moon-phase'],
    queryFn: async () => {
      const response = await fetch('/api/astronomy/moon-phase');
      if (!response.ok) {
        throw new Error('Failed to fetch moon phase data');
      }
      return response.json();
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

export function useISSPassPredictions(lat?: number, lon?: number) {
  return useQuery<{ info: any; passes: Array<{ risetime: number; duration: number; mag: number }> }>({
    queryKey: ['iss-pass-predictions', lat, lon],
    queryFn: async () => {
      if (!lat || !lon) {
        // Use default location (New York) if coordinates not provided
        lat = 40.7128;
        lon = -74.0060;
      }
      const response = await fetch(`/api/satellites/iss-passes?lat=${lat}&lon=${lon}`);
      if (!response.ok) {
        throw new Error('Failed to fetch ISS pass predictions');
      }
      return response.json();
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

export function useSatelliteTracking() {
  return useQuery<Satellite[]>({
    queryKey: ['satellite-tracking'],
    queryFn: async () => {
      const response = await fetch('/api/satellites/tracking');
      if (!response.ok) {
        throw new Error('Failed to fetch satellite tracking data');
      }
      return response.json();
    },
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  });
}

export function useExoplanets() {
  return useQuery<Exoplanet[]>({
    queryKey: ['exoplanets'],
    queryFn: async () => {
      const response = await fetch('/api/nasa/exoplanets');
      if (!response.ok) {
        throw new Error('Failed to fetch exoplanet data');
      }
      return response.json();
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  });
}

export function useSolarActivity() {
  return useQuery<SolarActivity>({
    queryKey: ['solar-activity'],
    queryFn: async () => {
      const response = await fetch('/api/space-weather/solar-activity');
      if (!response.ok) {
        throw new Error('Failed to fetch solar activity data');
      }
      return response.json();
    },
    refetchInterval: 15 * 60 * 1000, // 15 minutes
  });
}

export function useHubbleImages() {
  return useQuery<HubbleImage[]>({
    queryKey: ['hubble-images'],
    queryFn: async () => {
      const response = await fetch('/api/nasa/hubble-images');
      if (!response.ok) {
        throw new Error('Failed to fetch Hubble images');
      }
      return response.json();
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

export function useEarthquakeData() {
  return useQuery<{ features: Earthquake[] }>({
    queryKey: ['earthquake-data'],
    queryFn: async () => {
      const response = await fetch('/api/earth/earthquakes');
      if (!response.ok) {
        throw new Error('Failed to fetch earthquake data');
      }
      return response.json();
    },
    refetchInterval: 30 * 60 * 1000, // 30 minutes
  });
}

export function useAdvancedSpaceWeather() {
  return useQuery<{
    aurora_forecast: any;
    solar_wind: any;
    magnetic_field: any;
    radiation_belt: any;
  }>({
    queryKey: ['advanced-space-weather'],
    queryFn: async () => {
      const response = await fetch('/api/space-weather/advanced');
      if (!response.ok) {
        throw new Error('Failed to fetch advanced space weather data');
      }
      return response.json();
    },
    refetchInterval: 15 * 60 * 1000, // 15 minutes
  });
}

export function useComprehensiveSpaceData() {
  return useQuery<{
    issLocation: ISSLocation | null;
    peopleInSpace: PeopleInSpace | null;
    spaceEvents: { results: SpaceEvent[] };
    spaceNews: { results: SpaceNews[] };
    nasaApod: NASAAPOD | null;
    spaceXCompany: any | null;
    spacexRockets: SpaceXRocket[];
  }>({
    queryKey: ['comprehensive-space-data'],
    queryFn: async () => {
      const response = await fetch('/api/space/comprehensive');
      if (!response.ok) {
        throw new Error('Failed to fetch comprehensive space data');
      }
      return response.json();
    },
  });
} 