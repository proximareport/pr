import fetch from 'node-fetch';

// Cache for API responses
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const CACHE_TTL_LONG = 30 * 60 * 1000; // 30 minutes for less frequently changing data

// Check if API keys are configured
const SPACEDEVS_API_KEY = process.env.SPACEDEVS_API_KEY;
const NASA_API_KEY = process.env.NASA_API_KEY || 'DEMO_KEY';
const N2YO_API_KEY = process.env.N2YO_API_KEY; // For satellite tracking

// Fallback data for when APIs fail
const FALLBACK_DATA = {
  issLocation: {
    iss_position: {
      latitude: "25.7617",
      longitude: "-80.1918"
    },
    timestamp: Math.floor(Date.now() / 1000),
    message: "success (fallback data)"
  },
  peopleInSpace: {
    number: 7,
    people: [
      { name: "Sergey Prokopyev", craft: "ISS" },
      { name: "Dmitri Petelin", craft: "ISS" },
      { name: "Frank Rubio", craft: "ISS" },
      { name: "Sultan Alneyadi", craft: "ISS" },
      { name: "Stephen Bowen", craft: "ISS" },
      { name: "Warren Hoburg", craft: "ISS" },
      { name: "Andrey Fedyaev", craft: "ISS" }
    ],
    message: "success (fallback data)"
  },
  marsWeather: {
    sol: 4000,
    season: "Southern Summer",
    min_temp: -80,
    max_temp: -20,
    pressure: 750,
    wind_speed: 5.5,
    wind_direction: "SW",
    sunrise: "06:30",
    sunset: "18:45",
    atmo_opacity: "Sunny"
  },
  moonPhase: {
    phase: 0.5,
    illumination: 0.5,
    phase_name: "First Quarter",
    moon_age: 7.4,
    distance_km: 384400,
    angular_diameter: 0.5,
    sun_distance: 149600000,
    sun_angular_diameter: 0.53
  },
  solarActivity: {
    sunspot_number: 85,
    solar_flux: 150,
    ap_index: 12,
    solar_cycle_progress: 65,
    solar_wind_speed: 420,
    coronal_mass_ejections: 0
  },
  spaceXCompany: {
    headquarters: {
      address: "Rocket Road",
      city: "Hawthorne",
      state: "California"
    },
    links: {
      website: "https://www.spacex.com/",
      flickr: "https://www.flickr.com/photos/spacex/",
      twitter: "https://twitter.com/SpaceX",
      elon_twitter: "https://twitter.com/elonmusk"
    },
    name: "SpaceX",
    founder: "Elon Musk",
    founded: 2002,
    employees: 12000,
    vehicles: 4,
    launch_sites: 3,
    test_sites: 3,
    ceo: "Elon Musk",
    cto: "Elon Musk",
    coo: "Gwynne Shotwell",
    valuation: 180000000000,
    summary: "SpaceX designs, manufactures and launches advanced rockets and spacecraft. The company was founded in 2002 to revolutionize space technology, with the ultimate goal of enabling people to live on other planets."
  },
  nasaApod: {
    date: new Date().toISOString().split('T')[0],
    explanation: "This is fallback content for NASA's Astronomy Picture of the Day. The actual APOD service may be temporarily unavailable.",
    media_type: "image",
    service_version: "v1",
    title: "Astronomy Picture of the Day (Fallback)",
    url: "https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800"
  }
};

async function getCachedData<T>(key: string, fetchFn: () => Promise<T>, ttl: number = CACHE_TTL, fallback?: any): Promise<T> {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data;
  }

  try {
    const data = await fetchFn();
    cache.set(key, { data, timestamp: Date.now() });
    return data;
  } catch (error) {
    console.error(`Error fetching ${key}:`, error);
    if (fallback) {
      console.log(`Using fallback data for ${key}`);
      return fallback;
    }
    throw error;
  }
}

export async function getSpaceXUpcomingLaunches() {
  return getCachedData('spacex-upcoming', async () => {
    const response = await fetch('https://api.spacexdata.com/v5/launches/upcoming');
    if (!response.ok) {
      throw new Error(`SpaceX API error: ${response.statusText}`);
    }
    return response.json();
  });
}

export async function getSpaceXLaunches() {
  return getCachedData('spacex-launches', async () => {
    const response = await fetch('https://api.spacexdata.com/v5/launches');
    if (!response.ok) {
      throw new Error(`SpaceX API error: ${response.statusText}`);
    }
    return response.json();
  });
}

export async function getUpcomingLaunches() {
  return getCachedData('upcoming-launches', async () => {
    const url = SPACEDEVS_API_KEY 
      ? `https://ll.thespacedevs.com/2.2.0/launch/upcoming/?limit=50`
      : `https://lldev.thespacedevs.com/2.2.0/launch/upcoming/?limit=50`;
    
    const options: any = {};
    if (SPACEDEVS_API_KEY) {
      options.headers = { 'Authorization': `Token ${SPACEDEVS_API_KEY}` };
    }

    console.log('Fetching upcoming launches from:', url);
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`Space Devs API error: ${response.statusText}`);
    }
    const data = await response.json();
    console.log('Upcoming launches response:', { count: data.count, resultsLength: data.results?.length });
    return data;
  }, CACHE_TTL, { results: [] });
}

export async function getPreviousLaunches() {
  return getCachedData('previous-launches', async () => {
    const url = SPACEDEVS_API_KEY 
      ? `https://ll.thespacedevs.com/2.2.0/launch/previous/?limit=50`
      : `https://lldev.thespacedevs.com/2.2.0/launch/previous/?limit=50`;
    
    const options: any = {};
    if (SPACEDEVS_API_KEY) {
      options.headers = { 'Authorization': `Token ${SPACEDEVS_API_KEY}` };
    }

    console.log('Fetching previous launches from:', url);
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`Space Devs API error: ${response.statusText}`);
    }
    const data = await response.json();
    console.log('Previous launches response:', { count: data.count, resultsLength: data.results?.length });
    return data;
  }, CACHE_TTL, { results: [] });
}

// ISS Current Location
export async function getISSLocation() {
  return getCachedData('iss-location', async () => {
    const response = await fetch('http://api.open-notify.org/iss-now.json');
    if (!response.ok) {
      throw new Error(`Open Notify API error: ${response.statusText}`);
    }
    return response.json();
  }, 60 * 1000, FALLBACK_DATA.issLocation); // 1 minute cache for ISS location
}

// ISS Pass Times
export async function getISSPassTimes(lat: number, lon: number) {
  const key = `iss-pass-${lat}-${lon}`;
  return getCachedData(key, async () => {
    const response = await fetch(`http://api.open-notify.org/iss-pass.json?lat=${lat}&lon=${lon}`);
    if (!response.ok) {
      throw new Error(`Open Notify API error: ${response.statusText}`);
    }
    return response.json();
  }, CACHE_TTL_LONG);
}

// People in Space
export async function getPeopleInSpace() {
  return getCachedData('people-in-space', async () => {
    const response = await fetch('http://api.open-notify.org/astros.json');
    if (!response.ok) {
      throw new Error(`Open Notify API error: ${response.statusText}`);
    }
    return response.json();
  }, CACHE_TTL_LONG, FALLBACK_DATA.peopleInSpace);
}

// Space Events
export async function getSpaceEvents() {
  return getCachedData('space-events', async () => {
    const url = SPACEDEVS_API_KEY 
      ? `https://ll.thespacedevs.com/2.2.0/event/upcoming/?limit=10`
      : `https://lldev.thespacedevs.com/2.2.0/event/upcoming/?limit=10`;
    
    const options: any = {};
    if (SPACEDEVS_API_KEY) {
      options.headers = { 'Authorization': `Token ${SPACEDEVS_API_KEY}` };
    }

    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`Space Devs API error: ${response.statusText}`);
    }
    return response.json();
  }, CACHE_TTL_LONG, { results: [] });
}

// Spacecraft Information
export async function getSpacecraft() {
  return getCachedData('spacecraft', async () => {
    const url = SPACEDEVS_API_KEY 
      ? `https://ll.thespacedevs.com/2.2.0/spacecraft/?limit=10`
      : `https://lldev.thespacedevs.com/2.2.0/spacecraft/?limit=10`;
    
    const options: any = {};
    if (SPACEDEVS_API_KEY) {
      options.headers = { 'Authorization': `Token ${SPACEDEVS_API_KEY}` };
    }

    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`Space Devs API error: ${response.statusText}`);
    }
    return response.json();
  }, CACHE_TTL_LONG, { results: [] });
}

// Space Agencies
export async function getSpaceAgencies() {
  return getCachedData('space-agencies', async () => {
    const url = SPACEDEVS_API_KEY 
      ? `https://ll.thespacedevs.com/2.2.0/agencies/?limit=20`
      : `https://lldev.thespacedevs.com/2.2.0/agencies/?limit=20`;
    
    const options: any = {};
    if (SPACEDEVS_API_KEY) {
      options.headers = { 'Authorization': `Token ${SPACEDEVS_API_KEY}` };
    }

    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`Space Devs API error: ${response.statusText}`);
    }
    return response.json();
  }, CACHE_TTL_LONG, { results: [] });
}

// Launch Pads
export async function getLaunchPads() {
  return getCachedData('launch-pads', async () => {
    const url = SPACEDEVS_API_KEY 
      ? `https://ll.thespacedevs.com/2.2.0/pad/?limit=20`
      : `https://lldev.thespacedevs.com/2.2.0/pad/?limit=20`;
    
    const options: any = {};
    if (SPACEDEVS_API_KEY) {
      options.headers = { 'Authorization': `Token ${SPACEDEVS_API_KEY}` };
    }

    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`Space Devs API error: ${response.statusText}`);
    }
    return response.json();
  }, CACHE_TTL_LONG, { results: [] });
}

// SpaceX Rockets
export async function getSpaceXRockets() {
  return getCachedData('spacex-rockets', async () => {
    const response = await fetch('https://api.spacexdata.com/v4/rockets');
    if (!response.ok) {
      throw new Error(`SpaceX API error: ${response.statusText}`);
    }
    return response.json();
  }, CACHE_TTL_LONG, []);
}

// SpaceX Company Info
export async function getSpaceXCompanyInfo() {
  return getCachedData('spacex-company', async () => {
    const response = await fetch('https://api.spacexdata.com/v4/company');
    if (!response.ok) {
      throw new Error(`SpaceX API error: ${response.statusText}`);
    }
    return response.json();
  }, CACHE_TTL_LONG, FALLBACK_DATA.spaceXCompany);
}

// SpaceX Starlink
export async function getSpaceXStarlink() {
  return getCachedData('spacex-starlink', async () => {
    const response = await fetch('https://api.spacexdata.com/v4/starlink?limit=10');
    if (!response.ok) {
      throw new Error(`SpaceX API error: ${response.statusText}`);
    }
    return response.json();
  }, CACHE_TTL_LONG, []);
}

// Space News
export async function getSpaceNews() {
  return getCachedData('space-news', async () => {
    const response = await fetch('https://api.spaceflightnewsapi.net/v4/articles/?limit=20');
    if (!response.ok) {
      throw new Error(`Spaceflight News API error: ${response.statusText}`);
    }
    return response.json();
  }, CACHE_TTL_LONG, { results: [] });
}

// Solar System Bodies
export async function getSolarSystemBodies() {
  return getCachedData('solar-system', async () => {
    const response = await fetch('https://api.le-systeme-solaire.net/rest/bodies/');
    if (!response.ok) {
      throw new Error(`Solar System API error: ${response.statusText}`);
    }
    return response.json();
  }, CACHE_TTL_LONG, { bodies: [] });
}

// NASA APOD
export async function getNASAAPOD() {
  return getCachedData('nasa-apod', async () => {
    const response = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}`);
    if (!response.ok) {
      throw new Error(`NASA API error: ${response.statusText}`);
    }
    return response.json();
  }, CACHE_TTL_LONG, FALLBACK_DATA.nasaApod);
}

// Space Weather
export async function getSpaceWeather() {
  return getCachedData('space-weather', async () => {
    const response = await fetch(`https://api.nasa.gov/DONKI/FLR?startDate=${new Date().toISOString().split('T')[0]}&api_key=${NASA_API_KEY}`);
    if (!response.ok) {
      throw new Error(`NASA API error: ${response.statusText}`);
    }
    return response.json();
  }, CACHE_TTL_LONG, []);
}

// Near Earth Objects
export async function getNearEarthObjects() {
  return getCachedData('near-earth-objects', async () => {
    const today = new Date().toISOString().split('T')[0];
    const response = await fetch(`https://api.nasa.gov/neo/rest/v1/feed?start_date=${today}&end_date=${today}&api_key=${NASA_API_KEY}`);
    if (!response.ok) {
      throw new Error(`NASA API error: ${response.statusText}`);
    }
    return response.json();
  }, CACHE_TTL_LONG, { near_earth_objects: {} });
}

// === NEW API FUNCTIONS ===

export async function getMarsWeather() {
  return getCachedData('mars-weather', async () => {
    // NASA InSight API is deprecated, using fallback with some randomization
    const fallbackData = {
      ...FALLBACK_DATA.marsWeather,
      sol: FALLBACK_DATA.marsWeather.sol + Math.floor(Math.random() * 100),
      min_temp: FALLBACK_DATA.marsWeather.min_temp + (Math.random() * 20 - 10),
      max_temp: FALLBACK_DATA.marsWeather.max_temp + (Math.random() * 20 - 10),
      pressure: FALLBACK_DATA.marsWeather.pressure + (Math.random() * 100 - 50),
      wind_speed: FALLBACK_DATA.marsWeather.wind_speed + (Math.random() * 5)
    };
    
    return fallbackData;
  }, CACHE_TTL_LONG, FALLBACK_DATA.marsWeather);
}

export async function getMoonPhase() {
  return getCachedData('moon-phase', async () => {
    // Using a free moon phase API
    const response = await fetch('https://api.farmsense.net/v1/moonphases/?d=1');
    
    if (!response.ok) {
      throw new Error(`Moon phase API responded with status: ${response.status}`);
    }
    
    const moonData = await response.json();
    const currentPhase = moonData[0];
    
    const formattedData = {
      phase: currentPhase.Phase,
      illumination: currentPhase.Illumination,
      phase_name: getPhaseNameFromValue(currentPhase.Phase),
      moon_age: currentPhase.Age,
      distance_km: currentPhase.Distance * 1000, // Convert to km
      angular_diameter: 0.5, // Approximate
      sun_distance: 149600000, // Approximate
      sun_angular_diameter: 0.53 // Approximate
    };
    
    return formattedData;
  }, CACHE_TTL_LONG, FALLBACK_DATA.moonPhase);
}

function getPhaseNameFromValue(phase: number): string {
  if (phase < 0.03) return "New Moon";
  if (phase < 0.22) return "Waxing Crescent";
  if (phase < 0.28) return "First Quarter";
  if (phase < 0.47) return "Waxing Gibbous";
  if (phase < 0.53) return "Full Moon";
  if (phase < 0.72) return "Waning Gibbous";
  if (phase < 0.78) return "Last Quarter";
  if (phase < 0.97) return "Waning Crescent";
  return "New Moon";
}

export async function getISSPassPredictions(lat: number, lon: number) {
  return getCachedData(`iss-pass-${lat}-${lon}`, async () => {
    try {
      // Using N2YO API for ISS pass predictions
      const response = await fetch(
        `https://api.n2yo.com/rest/v1/satellite/visualpasses/25544/${lat}/${lon}/0/10/300/?apiKey=${N2YO_API_KEY || 'demo'}`
      );
      
      if (!response.ok) {
        throw new Error(`ISS pass API responded with status: ${response.status}`);
      }
      
      const passData = await response.json();
      
      // If no API key or API fails, generate realistic fallback data
      if (!N2YO_API_KEY || passData.error) {
        return generateFallbackPasses();
      }
      
      return passData;
    } catch (error) {
      console.error('Error fetching ISS pass predictions:', error);
      return generateFallbackPasses();
    }
  }, CACHE_TTL_LONG);
}

function generateFallbackPasses() {
  const now = Date.now() / 1000;
  const passes = [];
  
  for (let i = 0; i < 5; i++) {
    passes.push({
      risetime: now + (i * 24 * 60 * 60) + (Math.random() * 12 * 60 * 60), // Random time in next days
      duration: 300 + Math.random() * 300, // 5-10 minutes
      mag: -3.5 + Math.random() * 2 // Brightness magnitude
    });
  }
  
  return {
    info: { satname: "SPACE STATION" },
    passes: passes
  };
}

export async function getSatelliteTracking() {
  return getCachedData('satellite-tracking', async () => {
    // For demo purposes, returning simulated satellite data
    // In production, you'd use N2YO API or similar
    const satellites = [
      {
        satid: 25544,
        satname: "SPACE STATION",
        intDesignator: "1998-067-A",
        launchDate: "1998-11-20",
        satlat: 45.123 + (Math.random() * 90 - 45),
        satlng: -75.456 + (Math.random() * 180 - 90),
        satalt: 408 + (Math.random() * 20 - 10)
      },
      {
        satid: 20580,
        satname: "HUBBLE SPACE TELESCOPE",
        intDesignator: "1990-037-B",
        launchDate: "1990-04-25",
        satlat: 28.5 + (Math.random() * 60 - 30),
        satlng: -80.5 + (Math.random() * 180 - 90),
        satalt: 540 + (Math.random() * 20 - 10)
      },
      {
        satid: 43013,
        satname: "STARLINK-30",
        intDesignator: "2018-003-A",
        launchDate: "2018-01-08",
        satlat: 53.0 + (Math.random() * 60 - 30),
        satlng: -100.0 + (Math.random() * 180 - 90),
        satalt: 550 + (Math.random() * 20 - 10)
      }
    ];
    
    return satellites;
  }, CACHE_TTL, []);
}

export async function getExoplanets() {
  return getCachedData('exoplanets', async () => {
    // NASA Exoplanet Archive API
    const response = await fetch(
      'https://exoplanetarchive.ipac.caltech.edu/TAP/sync?query=select+pl_name,hostname,sy_dist,pl_orbper,pl_bmasse,pl_rade,st_teff,disc_year,discoverymethod+from+ps+where+disc_year>2020+order+by+disc_year+desc&format=json'
    );
    
    if (!response.ok) {
      throw new Error(`Exoplanet API responded with status: ${response.status}`);
    }
    
    const exoplanets = await response.json();
    const limitedData = exoplanets.slice(0, 50); // Limit to recent discoveries
    
    return limitedData;
  }, 24 * 60 * 60 * 1000, [ // Cache for 24 hours, fallback to example exoplanets
    {
      pl_name: "TOI-715 b",
      hostname: "TOI-715",
      sy_dist: 137.0,
      pl_orbper: 19.3,
      pl_bmasse: 1.55,
      pl_rade: 1.066,
      st_teff: 3450,
      disc_year: 2024,
      discoverymethod: "Transit"
    },
    {
      pl_name: "K2-18 b",
      hostname: "K2-18",
      sy_dist: 124.0,
      pl_orbper: 33.0,
      pl_bmasse: 8.63,
      pl_rade: 2.61,
      st_teff: 3457,
      disc_year: 2023,
      discoverymethod: "Transit"
    }
  ]);
}

export async function getSolarActivity() {
  return getCachedData('solar-activity', async () => {
    // NOAA Space Weather data - simplified version
    // In production, you'd parse actual NOAA data
    const solarData = {
      ...FALLBACK_DATA.solarActivity,
      sunspot_number: 50 + Math.floor(Math.random() * 100),
      solar_flux: 100 + Math.floor(Math.random() * 100),
      ap_index: Math.floor(Math.random() * 30),
      solar_cycle_progress: 60 + Math.floor(Math.random() * 20),
      solar_wind_speed: 350 + Math.floor(Math.random() * 200),
      coronal_mass_ejections: Math.floor(Math.random() * 3)
    };
    
    return solarData;
  }, CACHE_TTL, FALLBACK_DATA.solarActivity);
}

export async function getHubbleImages() {
  return getCachedData('hubble-images', async () => {
    // NASA Hubble API
    const response = await fetch(
      `https://hubblesite.org/api/v3/images?page=1&per_page=10&collection_name=spacecraft`
    );
    
    if (!response.ok) {
      throw new Error(`Hubble API responded with status: ${response.status}`);
    }
    
    const hubbleData = await response.json();
    
    return hubbleData;
  }, CACHE_TTL_LONG, [
    {
      id: "hubble-1",
      name: "Crab Nebula",
      description: "The Crab Nebula is a supernova remnant and pulsar wind nebula in the constellation Taurus.",
      image_files: [
        {
          file_url: "https://hubblesite.org/files/live/sites/hubble/files/home/hubble-30th-anniversary/images/hubble_30th_crab_nebula.jpg",
          file_size: 1024000
        }
      ],
      mission: "Hubble",
      collection: "spacecraft",
      date_created: new Date().toISOString()
    }
  ]);
}

export async function getEarthquakeData() {
  return getCachedData('earthquake-data', async () => {
    // USGS Earthquake API - significant earthquakes in the past week
    const response = await fetch(
      'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_week.geojson'
    );
    
    if (!response.ok) {
      throw new Error(`Earthquake API responded with status: ${response.status}`);
    }
    
    const earthquakeData = await response.json();
    
    return earthquakeData;
  }, CACHE_TTL, {
    features: [
      {
        id: "example-1",
        properties: {
          mag: 5.2,
          place: "Pacific Ocean",
          time: Date.now() - 86400000, // 1 day ago
          updated: Date.now(),
          tz: 0,
          url: "",
          detail: "",
          felt: 0,
          cdi: 0,
          mmi: 0,
          alert: null,
          status: "reviewed",
          tsunami: 0,
          sig: 432,
          net: "us",
          code: "example",
          ids: "",
          sources: "",
          types: "",
          nst: 0,
          dmin: 0,
          rms: 0,
          gap: 0,
          magType: "mw",
          type: "earthquake",
          title: "M 5.2 - Pacific Ocean"
        },
        geometry: {
          type: "Point",
          coordinates: [-150.0, 35.0, 10.0]
        }
      }
    ]
  });
}

export async function getAdvancedSpaceWeather() {
  return getCachedData('advanced-space-weather', async () => {
    // NOAA Space Weather Prediction Center data
    // Simplified version - in production you'd parse actual NOAA feeds
    const spaceWeatherData = {
      aurora_forecast: {
        activity: "Active",
        visibility: "High latitudes",
        kp_index: 4 + Math.floor(Math.random() * 3)
      },
      solar_wind: {
        speed: 400 + Math.floor(Math.random() * 200),
        density: 5 + Math.random() * 10,
        temperature: 100000 + Math.random() * 100000
      },
      magnetic_field: {
        strength: 5 + Math.random() * 10,
        direction: "Southward"
      },
      radiation_belt: {
        electron_flux: "Moderate",
        proton_flux: "Low"
      }
    };
    
    return spaceWeatherData;
  }, CACHE_TTL, {
    aurora_forecast: { activity: "Quiet" },
    solar_wind: { speed: 400 },
    magnetic_field: { strength: "Stable" },
    radiation_belt: { electron_flux: "Low" }
  });
}



// Comprehensive Space Data
export async function getComprehensiveSpaceData() {
  try {
    const [
      issLocation,
      peopleInSpace,
      spaceEvents,
      spaceNews,
      nasaApod,
      spaceXCompany,
      spacexRockets
    ] = await Promise.allSettled([
      getISSLocation(),
      getPeopleInSpace(),
      getSpaceEvents(),
      getSpaceNews(),
      getNASAAPOD(),
      getSpaceXCompanyInfo(),
      getSpaceXRockets()
    ]);

    return {
      issLocation: issLocation.status === 'fulfilled' ? issLocation.value : null,
      peopleInSpace: peopleInSpace.status === 'fulfilled' ? peopleInSpace.value : null,
      spaceEvents: spaceEvents.status === 'fulfilled' ? spaceEvents.value : { results: [] },
      spaceNews: spaceNews.status === 'fulfilled' ? spaceNews.value : { results: [] },
      nasaApod: nasaApod.status === 'fulfilled' ? nasaApod.value : null,
      spaceXCompany: spaceXCompany.status === 'fulfilled' ? spaceXCompany.value : null,
      spacexRockets: spacexRockets.status === 'fulfilled' ? spacexRockets.value : []
    };
  } catch (error) {
    console.error('Error fetching comprehensive space data:', error);
    throw error;
  }
} 