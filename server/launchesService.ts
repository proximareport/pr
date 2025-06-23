import fetch from 'node-fetch';

// Cache for API responses
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const CACHE_TTL_LONG = 30 * 60 * 1000; // 30 minutes for less frequently changing data

// Check if Space Devs API key is configured
const SPACEDEVS_API_KEY = process.env.SPACEDEVS_API_KEY;
const NASA_API_KEY = process.env.NASA_API_KEY || 'DEMO_KEY';

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