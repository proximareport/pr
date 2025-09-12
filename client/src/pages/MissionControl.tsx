import React, { useState, useEffect } from 'react';
import SatelliteVisualizer from '../components/SatelliteVisualizer';
import { analyticsTracker } from '@/lib/analytics';
import { BannerAd, InContentAd } from '@/components/AdPlacement';
import { useSubscriptionAccess } from '@/hooks/useSubscriptionAccess';
import PremiumAccess from '@/components/PremiumAccess';
import ImageModal from '@/components/ui/ImageModal';
import { 
  useUpcomingLaunches, 
  usePreviousLaunches,
  useISSLocation, 
  usePeopleInSpace, 
  useSpaceEvents, 
  useSpaceNews, 
  useNASAAPOD, 
  useSpaceXCompany, 
  useSpaceAgencies,
  useMarsWeather,
  useMoonPhase,
  useISSPassPredictions,
  useSatelliteTracking,
  useExoplanets,
  useSolarActivity,
  useHubbleImages,
  useEarthquakeData,
  useAdvancedSpaceWeather,
  useNearEarthObjects,
  SpaceDevsLaunch,
  NearEarthObject,
  Satellite,
  Exoplanet,
  HubbleImage,
  Earthquake,
  SolarActivity as SolarActivityType,
  MarsWeather,
  MoonPhase
} from '../services/launchesService';
import { 
  RocketIcon, 
  TargetIcon,
  EyeIcon,
  ThermometerIcon,
  MapIcon,
  SunIcon,
  ShieldIcon,
  MoonIcon,
  RadarIcon,
  CameraIcon,
  TelescopeIcon,
  DatabaseIcon,
  ActivityIcon,
  ClockIcon,
  CloudIcon,
  WavesIcon,
  ExternalLinkIcon,
  ShoppingCartIcon,
  UsersIcon,
  GlobeIcon,
  SatelliteIcon,
  ZapIcon,
  AlertTriangleIcon,
  TrendingUpIcon,
  BarChart3Icon,
  WifiIcon,
  SignalIcon,
  CompassIcon,
  StarIcon,
  Globe2Icon,
  AtomIcon,
  MicroscopeIcon,
  BookOpenIcon,
  LightbulbIcon,
  SettingsIcon,
  RefreshCwIcon,
  MaximizeIcon,
  MinimizeIcon,
  CalendarIcon
} from 'lucide-react';

// Type definitions
interface Location {
  lat: number;
  lon: number;
}

interface SpaceStation {
  name: string;
  country: string;
  launchDate: string;
  crew: number;
  status: 'active' | 'decommissioned' | 'planned';
  orbit: string;
}

interface SpaceMission {
  name: string;
  agency: string;
  status: 'active' | 'completed' | 'planned' | 'failed';
  destination: string;
  launchDate: string;
  duration: string;
  crew: number;
}

interface SpaceEvent {
  title: string;
  date: string;
  type: 'launch' | 'landing' | 'spacewalk' | 'docking' | 'scientific';
  description: string;
  location: string;
}

interface SystemStatus {
  system: string;
  status: 'operational' | 'degraded' | 'down' | 'maintenance';
  uptime: string;
  lastUpdate: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  type: 'launch' | 'landing' | 'spacewalk' | 'docking' | 'scientific' | 'astronomical' | 'conference' | 'anniversary';
  category: 'space' | 'astronomy' | 'education' | 'commercial';
  description: string;
  location: string;
  agency?: string;
  mission?: string;
  priority: 'high' | 'medium' | 'low';
  isRecurring?: boolean;
  recurrence?: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

// Component definitions
const LoadingCard = ({ title }: { title: string }) => (
  <div className="bg-gray-900/60 backdrop-blur-sm rounded-lg p-2 border border-purple-900/30">
    <h3 className="text-xs font-semibold text-white mb-1">{title}</h3>
    <div className="flex items-center justify-center py-1">
      <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-400/30 border-t-purple-400"></div>
      <span className="ml-2 text-gray-300 text-xs">Loading...</span>
    </div>
  </div>
);

const ErrorCard = ({ title, error }: { title: string; error: string }) => (
  <div className="bg-gray-900/60 backdrop-blur-sm rounded-lg p-2 border border-purple-900/30">
    <h3 className="text-xs font-semibold text-white mb-1">{title}</h3>
    <div className="text-red-400 bg-red-950/50 p-1 rounded border border-red-800/50 text-xs">
      <p className="font-medium">Failed to load</p>
      <p className="text-xs">{error}</p>
    </div>
  </div>
);

const CompactCard = ({ title, icon, children, colorClass = "purple" }: { 
  title: string; 
  icon: React.ReactNode; 
  children: React.ReactNode; 
  colorClass?: "purple" | "blue" | "orange" | "green" | "red" | "cyan" | "teal" | "indigo"; 
}) => {
  const colorClasses = {
    purple: "border-purple-900/30 hover:border-purple-800/50",
    blue: "border-blue-900/30 hover:border-blue-800/50",
    orange: "border-orange-900/30 hover:border-orange-800/50",
    green: "border-green-900/30 hover:border-green-800/50",
    red: "border-red-900/30 hover:border-red-800/50",
    cyan: "border-cyan-900/30 hover:border-cyan-800/50",
    teal: "border-teal-900/30 hover:border-teal-800/50",
    indigo: "border-indigo-900/30 hover:border-indigo-800/50"
  };

  return (
    <div className={`bg-gray-900/60 backdrop-blur-sm rounded-lg p-2 border ${colorClasses[colorClass]} transition-all duration-300`}>
      <div className="flex items-center gap-1 mb-1">
        {icon}
        <h3 className="text-xs font-semibold text-white">{title}</h3>
      </div>
      {children}
    </div>
  );
};

export default function MissionControl() {
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [apodModalOpen, setApodModalOpen] = useState(false);
  const { canAccessFeature } = useSubscriptionAccess();

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
        },
        () => {
          setUserLocation({ lat: 40.7128, lon: -74.0060 });
        }
      );
    } else {
      setUserLocation({ lat: 40.7128, lon: -74.0060 });
    }
  }, []);

  // Track Mission Control page view for analytics
  useEffect(() => {
    analyticsTracker.trackPageView('/mission-control');
  }, []);

  // API hooks
  const { data: upcomingLaunches, isLoading: upcomingLaunchesLoading, error: upcomingLaunchesError } = useUpcomingLaunches();
  const { data: previousLaunches, isLoading: previousLaunchesLoading, error: previousLaunchesError } = usePreviousLaunches();
  const { data: issLocation, isLoading: issLocationLoading, error: issLocationError } = useISSLocation();
  const { data: peopleInSpace, isLoading: peopleInSpaceLoading, error: peopleInSpaceError } = usePeopleInSpace();
  const { data: spaceEvents, isLoading: spaceEventsLoading, error: spaceEventsError } = useSpaceEvents();
  const { data: spaceNews, isLoading: spaceNewsLoading, error: spaceNewsError } = useSpaceNews();
  const { data: nasaAPOD, isLoading: nasaAPODLoading, error: nasaAPODError } = useNASAAPOD();
  const { data: spaceXCompany, isLoading: spaceXCompanyLoading, error: spaceXCompanyError } = useSpaceXCompany();
  const { data: spaceAgencies, isLoading: spaceAgenciesLoading, error: spaceAgenciesError } = useSpaceAgencies();
  const { data: marsWeather, isLoading: marsWeatherLoading, error: marsWeatherError } = useMarsWeather();
  const { data: moonPhase, isLoading: moonPhaseLoading, error: moonPhaseError } = useMoonPhase();
  const { data: issPassPredictions, isLoading: issPassLoading, error: issPassError } = useISSPassPredictions(userLocation?.lat, userLocation?.lon);
  const { data: satellites, isLoading: satellitesLoading, error: satellitesError } = useSatelliteTracking();
  const { data: exoplanets, isLoading: exoplanetsLoading, error: exoplanetsError } = useExoplanets();
  const { data: solarActivity, isLoading: solarActivityLoading, error: solarActivityError } = useSolarActivity();
  const { data: hubbleImages, isLoading: hubbleImagesLoading, error: hubbleImagesError } = useHubbleImages();
  const { data: earthquakeData, isLoading: earthquakeDataLoading, error: earthquakeDataError } = useEarthquakeData();
  const { data: advancedSpaceWeather, isLoading: advancedSpaceWeatherLoading, error: advancedSpaceWeatherError } = useAdvancedSpaceWeather();
  const { data: nearEarthObjects, isLoading: nearEarthObjectsLoading, error: nearEarthObjectsError } = useNearEarthObjects();

  // Additional state for new features
  const [selectedView, setSelectedView] = useState<'dashboard' | 'missions' | 'stations' | 'events' | 'systems' | 'calendar' | 'orbits'>('dashboard');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds

  // Simulated data for new features
  const spaceStations: SpaceStation[] = [
    {
      name: "International Space Station",
      country: "International",
      launchDate: "1998-11-20",
      crew: 7,
      status: "active",
      orbit: "408 km LEO"
    },
    {
      name: "Tiangong Space Station",
      country: "China",
      launchDate: "2021-04-29",
      crew: 3,
      status: "active",
      orbit: "400 km LEO"
    },
    {
      name: "Mir",
      country: "Soviet Union/Russia",
      launchDate: "1986-02-19",
      crew: 0,
      status: "decommissioned",
      orbit: "Deorbited 2001"
    }
  ];

  const activeMissions: SpaceMission[] = [
    {
      name: "Artemis II",
      agency: "NASA",
      status: "planned",
      destination: "Moon",
      launchDate: "2025-09",
      duration: "10 days",
      crew: 4
    },
    {
      name: "Crew Dragon Endurance",
      agency: "SpaceX",
      status: "active",
      destination: "ISS",
      launchDate: "2024-08-26",
      duration: "6 months",
      crew: 4
    },
    {
      name: "Shenzhou-18",
      agency: "CNSA",
      status: "active",
      destination: "Tiangong",
      launchDate: "2024-10-26",
      duration: "6 months",
      crew: 3
    }
  ];

  const upcomingEvents: SpaceEvent[] = [
    {
      title: "SpaceX Starship Test Flight",
      date: "2024-12-15",
      type: "launch",
      description: "Orbital test flight of Starship prototype",
      location: "Starbase, Texas"
    },
    {
      title: "ISS Spacewalk EVA-89",
      date: "2024-12-18",
      type: "spacewalk",
      description: "Installation of new solar arrays",
      location: "International Space Station"
    },
    {
      title: "Jupiter Icy Moons Explorer Arrival",
      date: "2031-07",
      type: "scientific",
      description: "JUICE spacecraft arrives at Jupiter system",
      location: "Jupiter Orbit"
    }
  ];

  const systemStatuses: SystemStatus[] = [
    {
      system: "Ground Control",
      status: "operational",
      uptime: "99.9%",
      lastUpdate: "2 min ago"
    },
    {
      system: "Satellite Network",
      status: "operational",
      uptime: "99.7%",
      lastUpdate: "1 min ago"
    },
    {
      system: "Deep Space Network",
      status: "operational",
      uptime: "99.5%",
      lastUpdate: "5 min ago"
    },
    {
      system: "Mission Control",
      status: "operational",
      uptime: "100%",
      lastUpdate: "30 sec ago"
    }
  ];

  // Space Calendar Data
  const calendarEvents: CalendarEvent[] = [
    {
      id: "1",
      title: "Artemis II Launch",
      date: "2025-09-15",
      time: "14:30 UTC",
      type: "launch",
      category: "space",
      description: "NASA's Artemis II mission will send astronauts around the Moon",
      location: "Kennedy Space Center, Florida",
      agency: "NASA",
      mission: "Artemis II",
      priority: "high"
    },
    {
      id: "2",
      title: "Perseid Meteor Shower Peak",
      date: "2024-08-12",
      time: "22:00 UTC",
      type: "astronomical",
      category: "astronomy",
      description: "Annual meteor shower with up to 100 meteors per hour",
      location: "Worldwide",
      priority: "medium"
    },
    {
      id: "3",
      title: "International Space Station Spacewalk",
      date: "2024-08-20",
      time: "12:00 UTC",
      type: "spacewalk",
      category: "space",
      description: "EVA to install new solar arrays",
      location: "ISS",
      agency: "NASA",
      priority: "medium"
    },
    {
      id: "4",
      title: "SpaceX Starship Test Flight",
      date: "2024-08-25",
      time: "15:00 UTC",
      type: "launch",
      category: "commercial",
      description: "Test flight of SpaceX's Starship vehicle",
      location: "Starbase, Texas",
      agency: "SpaceX",
      priority: "high"
    },
    {
      id: "5",
      title: "International Astronautical Congress",
      date: "2024-10-02",
      type: "conference",
      category: "education",
      description: "Annual space industry conference",
      location: "Milan, Italy",
      priority: "medium"
    },
    {
      id: "6",
      title: "Sputnik Launch Anniversary",
      date: "2024-10-04",
      type: "anniversary",
      category: "space",
      description: "67th anniversary of the first artificial satellite",
      location: "Worldwide",
      priority: "low",
      isRecurring: true,
      recurrence: "yearly"
    },
    {
      id: "7",
      title: "Blue Origin New Shepard Launch",
      date: "2024-08-18",
      time: "13:00 UTC",
      type: "launch",
      category: "commercial",
      description: "Suborbital flight with research payloads",
      location: "West Texas",
      agency: "Blue Origin",
      priority: "medium"
    },
    {
      id: "8",
      title: "Jupiter Opposition",
      date: "2024-09-26",
      type: "astronomical",
      category: "astronomy",
      description: "Jupiter at its closest approach to Earth",
      location: "Worldwide",
      priority: "medium"
    },
    {
      id: "9",
      title: "Space Station Docking",
      date: "2024-08-22",
      time: "10:30 UTC",
      type: "docking",
      category: "space",
      description: "Crew Dragon docking with ISS",
      location: "ISS",
      agency: "SpaceX",
      priority: "medium"
    },
    {
      id: "10",
      title: "Mars Sample Return Mission Launch",
      date: "2026-07-01",
      type: "launch",
      category: "space",
      description: "Mission to return samples from Mars",
      location: "Kennedy Space Center, Florida",
      agency: "NASA/ESA",
      priority: "high"
    }
  ];

  // Additional simulated data
  const activeSatellites = 4852;
  const spaceDebris = 12800;
  const totalLaunches = 156;
  const successfulLaunches = 142;
  const launchSuccessRate = ((successfulLaunches / totalLaunches) * 100).toFixed(1);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // This would trigger a refresh of the data
      // For now, we'll just log that a refresh would happen
      console.log('Auto-refreshing Mission Control data...');
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950/40 to-black relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-purple-900/10 via-violet-900/10 to-purple-800/10"></div>
        <div className="absolute top-20 left-20 w-64 h-64 bg-gradient-to-r from-purple-600/10 to-violet-600/10 rounded-full blur-3xl animate-pulse"></div>
      </div>

      {/* Compact Header */}
      <div className="relative z-10 bg-gray-950/90 backdrop-blur-sm border-b border-purple-900/30 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-violet-700 flex items-center justify-center shadow-lg shadow-purple-500/25">
                <ActivityIcon className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">
                  Proxima <span className="text-purple-400">Mission Control</span>
                </h1>
                <p className="text-gray-300 text-xs">Real-time Space Data Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Store Button */}
              <a 
                href="https://store.proximareport.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1 bg-gradient-to-r from-purple-600 to-violet-700 hover:from-purple-700 hover:to-violet-800 text-white px-3 py-1.5 rounded-lg transition-all duration-300 shadow-lg shadow-purple-500/25 text-xs font-medium"
              >
                <ShoppingCartIcon className="h-3 w-3" />
                Store
                <ExternalLinkIcon className="h-3 w-3" />
              </a>
              <div className="text-right bg-gray-900/50 rounded-lg p-2 border border-purple-900/30">
                <div className="text-xs text-gray-400 flex items-center">
                  <ClockIcon className="h-3 w-3 mr-1" />
                  {new Date().toLocaleTimeString()}
                </div>
                {userLocation && (
                  <div className="text-xs text-purple-300">
                    {userLocation.lat.toFixed(2)}°, {userLocation.lon.toFixed(2)}°
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="relative z-10 bg-gray-900/50 backdrop-blur-sm border-b border-purple-900/20">
        <div className="max-w-7xl mx-auto px-4 py-1">
          <div className="flex items-center justify-between">
            <div className="flex space-x-1">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: <BarChart3Icon className="h-3 w-3" /> },
                { id: 'missions', label: 'Missions', icon: <RocketIcon className="h-3 w-3" /> },
                { id: 'stations', label: 'Stations', icon: <SatelliteIcon className="h-3 w-3" /> },
                { id: 'events', label: 'Events', icon: <CalendarIcon className="h-3 w-3" /> },
                { id: 'calendar', label: 'Calendar', icon: <CalendarIcon className="h-3 w-3" /> },
                { id: 'orbits', label: 'Orbits', icon: <Globe2Icon className="h-3 w-3" /> },
                { id: 'systems', label: 'Systems', icon: <SettingsIcon className="h-3 w-3" /> }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedView(tab.id as any)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                    selectedView === tab.id
                      ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                      : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/30'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-all duration-200 ${
                  autoRefresh 
                    ? 'bg-green-600/20 text-green-300 border border-green-500/30' 
                    : 'bg-gray-800/30 text-gray-400 border border-gray-700/30'
                }`}
              >
                <RefreshCwIcon className={`h-3 w-3 ${autoRefresh ? 'animate-spin' : ''}`} />
                Auto
              </button>
              <button className="flex items-center gap-1 px-2 py-1 bg-gray-800/30 text-gray-400 border border-gray-700/30 rounded text-xs hover:bg-gray-700/30 transition-all duration-200">
                <MaximizeIcon className="h-3 w-3" />
                Full
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Conditional Views */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-3 min-h-[80vh]">
        {selectedView === 'dashboard' && (
          <div className="space-y-4">
            {/* Top Ad for Dashboard */}
            <div className="flex justify-center">
              <div className="w-full max-w-md">
                <BannerAd />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          
          {/* Next Launches */}
          {upcomingLaunchesLoading ? (
            <LoadingCard title="Loading launches..." />
          ) : upcomingLaunchesError ? (
            <ErrorCard title="Launches" error={upcomingLaunchesError.message} />
          ) : upcomingLaunches?.results?.length ? (
            <CompactCard 
              title="Next Launches" 
              icon={<RocketIcon className="h-4 w-4 text-blue-400" />}
              colorClass="blue"
            >
              <div className="space-y-1">
                {upcomingLaunches.results.slice(0, 2).map((launch: SpaceDevsLaunch) => (
                  <div key={launch.id} className="bg-gray-800/30 rounded p-1.5 border border-gray-700/30">
                    <div className="flex items-start justify-between mb-0.5">
                      <h4 className="font-medium text-white text-xs leading-tight">{launch.name}</h4>
                      <span className={`text-xs px-1 py-0.5 rounded text-xs ${
                        launch.net.includes('TBD') || launch.net.includes('NET') 
                          ? 'bg-yellow-950/50 text-yellow-300'
                          : 'bg-green-950/50 text-green-300'
                      }`}>
                        {launch.status.abbrev}
                      </span>
                    </div>
                    <p className="text-gray-400 text-xs mb-0.5">{launch.rocket.configuration.name}</p>
                    <div className="flex items-center text-xs text-gray-400">
                      <ClockIcon className="h-3 w-3 mr-1" />
                      <span>{new Date(launch.net).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CompactCard>
          ) : (
            <CompactCard title="Next Launches" icon={<RocketIcon className="h-4 w-4 text-blue-400" />}>
              <div className="text-center py-2 text-gray-400 text-xs">No data available</div>
            </CompactCard>
          )}

          {/* Near Earth Objects */}
          {nearEarthObjectsLoading ? (
            <LoadingCard title="Scanning asteroids..." />
          ) : nearEarthObjectsError ? (
            <ErrorCard title="Near Earth Objects" error={nearEarthObjectsError.message} />
          ) : nearEarthObjects?.near_earth_objects ? (
            <CompactCard 
              title="Near Earth Objects" 
              icon={<TargetIcon className="h-4 w-4 text-orange-400" />}
              colorClass="orange"
            >
              <div className="space-y-1">
                {Object.entries(nearEarthObjects.near_earth_objects).flatMap(([date, objects]) => 
                  (objects as NearEarthObject[]).slice(0, 2).map((neo) => (
                    <div key={neo.id} className="bg-gray-800/30 rounded p-1.5 border border-gray-700/30">
                      <div className="flex items-center justify-between mb-0.5">
                        <h4 className="font-medium text-white text-xs">{neo.name.substring(0, 20)}...</h4>
                        <span className={`text-xs px-1 py-0.5 rounded ${
                          neo.is_potentially_hazardous_asteroid 
                            ? 'bg-red-950/50 text-red-300'
                            : 'bg-green-950/50 text-green-300'
                        }`}>
                          {neo.is_potentially_hazardous_asteroid ? '⚠️' : '✅'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400">
                        <div>⌀ {Math.round(neo.estimated_diameter.meters.estimated_diameter_min)}-{Math.round(neo.estimated_diameter.meters.estimated_diameter_max)}m</div>
                        <div>🚀 {Math.round(parseFloat(neo.close_approach_data[0].relative_velocity.kilometers_per_hour)).toLocaleString()} km/h</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CompactCard>
          ) : (
            <CompactCard title="Near Earth Objects" icon={<TargetIcon className="h-4 w-4 text-orange-400" />}>
              <div className="text-center py-2 text-gray-400 text-xs">No data available</div>
            </CompactCard>
          )}

          {/* ISS Visibility */}
          {issPassLoading ? (
            <LoadingCard title="Calculating ISS..." />
          ) : issPassError ? (
            <ErrorCard title="ISS Visibility" error={issPassError.message} />
          ) : issPassPredictions?.passes?.length ? (
            <CompactCard 
              title="ISS Visibility" 
              icon={<EyeIcon className="h-4 w-4 text-cyan-400" />}
              colorClass="cyan"
            >
              <div className="text-center mb-1">
                <div className="text-lg">🛰️</div>
                <div className="text-cyan-300 text-xs">Next Pass</div>
              </div>
              <div className="space-y-1">
                {issPassPredictions.passes.slice(0, 2).map((pass: { risetime: number; duration: number; mag: number }, index: number) => (
                  <div key={index} className="bg-gray-800/30 rounded p-1.5 border border-gray-700/30">
                    <div className="grid grid-cols-3 gap-1 text-center text-xs">
                      <div className="min-w-0">
                        <span className="text-gray-400 block">Start</span>
                        <span className="text-white font-medium truncate block" title={new Date(pass.risetime * 1000).toLocaleTimeString()}>
                          {new Date(pass.risetime * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-gray-400 block">Duration</span>
                        <span className="text-white font-medium truncate block" title={`${pass.duration} seconds`}>
                          {pass.duration > 60 ? `${Math.round(pass.duration / 60)}m` : `${pass.duration}s`}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-gray-400 block">Mag</span>
                        <span className="text-yellow-300 font-medium truncate block" title={`Magnitude: ${pass.mag}`}>
                          {pass.mag.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CompactCard>
          ) : (
            <CompactCard title="ISS Visibility" icon={<EyeIcon className="h-4 w-4 text-cyan-400" />}>
              <div className="text-center py-2 text-gray-400 text-xs">Location required</div>
            </CompactCard>
          )}

          {/* Mars Weather */}
          {marsWeatherLoading ? (
            <LoadingCard title="Mars weather..." />
          ) : marsWeatherError ? (
            <ErrorCard title="Mars Weather" error={marsWeatherError.message} />
          ) : marsWeather ? (
            <CompactCard 
              title="Mars Weather" 
              icon={<ThermometerIcon className="h-4 w-4 text-red-400" />}
              colorClass="red"
            >
              <div className="grid grid-cols-2 gap-1 mb-1">
                <div className="bg-red-950/30 rounded p-1 border border-red-800/50 text-center min-w-0">
                  <div className="text-red-300 text-xs">Sol {marsWeather.sol}</div>
                  <div className="text-white font-medium text-xs truncate" title={marsWeather.season}>
                    {marsWeather.season}
                  </div>
                </div>
                <div className="bg-blue-950/30 rounded p-1 border border-blue-800/50 text-center min-w-0">
                  <div className="text-blue-300 text-xs">Temp</div>
                  <div className="text-white font-medium text-xs truncate" title={`${marsWeather.min_temp}°C / ${marsWeather.max_temp}°C`}>
                    {Math.round(marsWeather.min_temp)}° / {Math.round(marsWeather.max_temp)}°C
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <div className="bg-purple-950/30 rounded p-1 border border-purple-800/50 text-center min-w-0">
                  <div className="text-purple-300 text-xs">Pressure</div>
                  <div className="text-white font-medium text-xs truncate" title={`${marsWeather.pressure} Pa`}>
                    {marsWeather.pressure > 1000 ? `${(marsWeather.pressure / 1000).toFixed(1)}k Pa` : `${Math.round(marsWeather.pressure)} Pa`}
                  </div>
                </div>
                <div className="bg-green-950/30 rounded p-1 border border-green-800/50 text-center min-w-0">
                  <div className="text-green-300 text-xs">Wind</div>
                  <div className="text-white font-medium text-xs truncate" title={`${marsWeather.wind_speed} m/s`}>
                    {Math.round(marsWeather.wind_speed)} m/s
                  </div>
                </div>
              </div>
            </CompactCard>
          ) : (
            <CompactCard title="Mars Weather" icon={<ThermometerIcon className="h-4 w-4 text-red-400" />}>
              <div className="text-center py-2 text-gray-400 text-xs">No data available</div>
            </CompactCard>
          )}

          {/* Recent Earthquakes */}
          {earthquakeDataLoading ? (
            <LoadingCard title="Monitoring seismic..." />
          ) : earthquakeDataError ? (
            <ErrorCard title="Earthquakes" error={earthquakeDataError.message} />
          ) : earthquakeData?.features?.length ? (
            <CompactCard 
              title="Recent Earthquakes" 
              icon={<MapIcon className="h-4 w-4 text-yellow-400" />}
              colorClass="orange"
            >
              <div className="space-y-1">
                {earthquakeData.features.slice(0, 3).map((earthquake: Earthquake) => {
                  const magnitude = earthquake.properties.mag;
                  const magnitudeColor = magnitude >= 6 ? 'text-red-400 bg-red-950/30' :
                                         magnitude >= 4.5 ? 'text-orange-400 bg-orange-950/30' :
                                         'text-yellow-400 bg-yellow-950/30';
                  
                  return (
                    <div key={earthquake.id} className="bg-gray-800/30 rounded p-1.5 border border-gray-700/30">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={`text-xs font-bold px-1 py-0.5 rounded ${magnitudeColor}`}>
                          M {magnitude.toFixed(1)}
                        </span>
                        {earthquake.properties.tsunami === 1 && (
                          <span className="text-xs px-1 py-0.5 bg-blue-950/50 text-blue-300 rounded">🌊</span>
                        )}
                      </div>
                      <h4 className="text-white font-medium text-xs mb-0.5">{earthquake.properties.place.substring(0, 25)}...</h4>
                      <div className="text-xs text-gray-400">
                        {new Date(earthquake.properties.time).toLocaleDateString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CompactCard>
          ) : (
            <CompactCard title="Recent Earthquakes" icon={<MapIcon className="h-4 w-4 text-yellow-400" />}>
              <div className="text-center py-2 text-gray-400 text-xs">No data available</div>
            </CompactCard>
          )}

          {/* Solar Activity */}
          {solarActivityLoading ? (
            <LoadingCard title="Monitoring Sun..." />
          ) : solarActivityError ? (
            <ErrorCard title="Solar Activity" error={solarActivityError.message} />
          ) : solarActivity ? (
            <CompactCard 
              title="Solar Activity" 
              icon={<SunIcon className="h-4 w-4 text-yellow-400" />}
              colorClass="orange"
            >
              <div className="grid grid-cols-2 gap-1">
                <div className="bg-yellow-950/30 rounded p-1 border border-yellow-800/50 text-center">
                  <div className="text-yellow-300 text-xs">Sunspots</div>
                  <div className="text-white font-medium text-xs">{solarActivity.sunspot_number}</div>
                </div>
                <div className="bg-orange-950/30 rounded p-1 border border-orange-800/50 text-center">
                  <div className="text-orange-300 text-xs">Solar Flux</div>
                  <div className="text-white font-medium text-xs">{solarActivity.solar_flux}</div>
                </div>
                <div className="bg-red-950/30 rounded p-1 border border-red-800/50 text-center">
                  <div className="text-red-300 text-xs">Ap Index</div>
                  <div className="text-white font-medium text-xs">{solarActivity.ap_index}</div>
                </div>
                <div className="bg-purple-950/30 rounded p-1 border border-purple-800/50 text-center">
                  <div className="text-purple-300 text-xs">Cycle</div>
                  <div className="text-white font-medium text-xs">{solarActivity.solar_cycle_progress}%</div>
                </div>
              </div>
            </CompactCard>
          ) : (
            <CompactCard title="Solar Activity" icon={<SunIcon className="h-4 w-4 text-yellow-400" />}>
              <div className="text-center py-2 text-gray-400 text-xs">No data available</div>
            </CompactCard>
          )}

          {/* Middle Ad for Dashboard */}
          <div className="col-span-full flex justify-center my-4">
            <div className="w-full max-w-lg">
              <InContentAd />
            </div>
          </div>

          {/* Space Weather */}
          {advancedSpaceWeatherLoading ? (
            <LoadingCard title="Space weather..." />
          ) : advancedSpaceWeatherError ? (
            <ErrorCard title="Space Weather" error={advancedSpaceWeatherError.message} />
          ) : advancedSpaceWeather ? (
            <CompactCard 
              title="Space Weather" 
              icon={<ShieldIcon className="h-4 w-4 text-green-400" />}
              colorClass="green"
            >
              <div className="space-y-1">
                <div className="bg-green-950/30 rounded p-1 border border-green-800/50">
                  <div className="text-green-300 text-xs">Aurora</div>
                  <div className="text-white font-medium text-xs">{advancedSpaceWeather.aurora_forecast?.activity || 'Quiet'}</div>
                </div>
                <div className="bg-blue-950/30 rounded p-1 border border-blue-800/50">
                  <div className="text-blue-300 text-xs">Solar Wind</div>
                  <div className="text-white font-medium text-xs">{advancedSpaceWeather.solar_wind?.speed || '400'} km/s</div>
                </div>
                <div className="bg-purple-950/30 rounded p-1 border border-purple-800/50">
                  <div className="text-purple-300 text-xs">Magnetic Field</div>
                  <div className="text-white font-medium text-xs">{advancedSpaceWeather.magnetic_field?.strength || 'Stable'}</div>
                </div>
              </div>
            </CompactCard>
          ) : (
            <CompactCard title="Space Weather" icon={<ShieldIcon className="h-4 w-4 text-green-400" />}>
              <div className="text-center py-2 text-gray-400 text-xs">No data available</div>
            </CompactCard>
          )}

          {/* Lunar Status */}
          {moonPhaseLoading ? (
            <LoadingCard title="Moon phase..." />
          ) : moonPhaseError ? (
            <ErrorCard title="Moon Phase" error={moonPhaseError.message} />
          ) : moonPhase ? (
            <CompactCard 
              title="Lunar Status" 
              icon={<MoonIcon className="h-4 w-4 text-gray-400" />}
              colorClass="purple"
            >
              <div className="text-center mb-1">
                <div className="text-lg">🌙</div>
                <h4 className="text-white font-medium text-xs">{moonPhase.phase_name}</h4>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <div className="bg-gray-800/30 rounded p-1 border border-gray-700/30 text-center">
                  <span className="text-gray-400 text-xs block">Illumination</span>
                  <span className="text-white font-medium text-xs">{(moonPhase.illumination * 100).toFixed(1)}%</span>
                </div>
                <div className="bg-gray-800/30 rounded p-1 border border-gray-700/30 text-center">
                  <span className="text-gray-400 text-xs block">Age</span>
                  <span className="text-white font-medium text-xs">{moonPhase.moon_age.toFixed(1)} days</span>
                </div>
              </div>
            </CompactCard>
          ) : (
            <CompactCard title="Lunar Status" icon={<MoonIcon className="h-4 w-4 text-gray-400" />}>
              <div className="text-center py-2 text-gray-400 text-xs">No data available</div>
            </CompactCard>
          )}

          {/* NASA APOD */}
          {nasaAPODLoading ? (
            <LoadingCard title="Loading APOD..." />
          ) : nasaAPODError ? (
            <ErrorCard title="NASA APOD" error={nasaAPODError.message} />
          ) : nasaAPOD ? (
            <div className="md:col-span-2 lg:col-span-2">
              <CompactCard 
                title="Astronomy Picture of the Day" 
                icon={<CameraIcon className="h-4 w-4 text-purple-400" />}
                colorClass="purple"
              >
                {nasaAPOD.media_type === 'image' && (
                  <div className="mb-2 relative group cursor-pointer" onClick={() => setApodModalOpen(true)}>
                    <img 
                      src={nasaAPOD.url} 
                      alt={nasaAPOD.title}
                      className="w-full h-32 object-cover rounded transition-transform group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-full p-2">
                        <MaximizeIcon className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  </div>
                )}
                <h4 className="text-white font-medium text-xs mb-1">{nasaAPOD.title}</h4>
                <p className="text-gray-400 text-xs mb-1 line-clamp-2">{nasaAPOD.explanation}</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-purple-300">{nasaAPOD.date}</span>
                  <span className="text-gray-500">© NASA</span>
                </div>
              </CompactCard>
            </div>
          ) : (
            <CompactCard title="NASA APOD" icon={<CameraIcon className="h-4 w-4 text-purple-400" />}>
              <div className="text-center py-2 text-gray-400 text-xs">No data available</div>
            </CompactCard>
          )}

          {/* Exoplanets */}
          {exoplanetsLoading ? (
            <LoadingCard title="Scanning exoplanets..." />
          ) : exoplanetsError ? (
            <ErrorCard title="Exoplanets" error={exoplanetsError.message} />
          ) : exoplanets?.length ? (
            <CompactCard 
              title="Exoplanet Discoveries" 
              icon={<DatabaseIcon className="h-4 w-4 text-teal-400" />}
              colorClass="teal"
            >
              <div className="space-y-1">
                {exoplanets.slice(0, 2).map((planet: Exoplanet, index: number) => (
                  <div key={index} className="bg-gray-800/30 rounded p-1.5 border border-gray-700/30">
                    <h4 className="text-white font-medium text-xs mb-0.5">{planet.pl_name}</h4>
                    <div className="text-xs text-gray-400 space-y-0.5">
                      <div>Host: {planet.hostname}</div>
                      <div>Distance: {planet.sy_dist?.toFixed(1) || 'Unknown'} ly</div>
                      <div className="flex justify-between">
                        <span>Year: {planet.disc_year}</span>
                        <span className="text-teal-300">{planet.discoverymethod}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CompactCard>
          ) : (
            <CompactCard title="Exoplanet Discoveries" icon={<DatabaseIcon className="h-4 w-4 text-teal-400" />}>
              <div className="text-center py-2 text-gray-400 text-xs">No data available</div>
            </CompactCard>
          )}

          {/* People in Space */}
          <CompactCard 
            title="People in Space" 
            icon={<UsersIcon className="h-4 w-4 text-blue-400" />}
            colorClass="blue"
          >
            <div className="text-center">
              <div className="text-2xl text-blue-300 font-bold">{peopleInSpace?.number || 0}</div>
              <div className="text-xs text-gray-300">Currently in Space</div>
              <div className="text-xs text-gray-400 mt-1">ISS: 7 | Tiangong: 3</div>
            </div>
          </CompactCard>

          {/* Active Satellites */}
          <CompactCard 
            title="Active Satellites" 
            icon={<SatelliteIcon className="h-4 w-4 text-green-400" />}
            colorClass="green"
          >
            <div className="text-center">
              <div className="text-2xl text-green-300 font-bold">{activeSatellites.toLocaleString()}</div>
              <div className="text-xs text-gray-300">Currently Orbiting</div>
              <div className="text-xs text-gray-400 mt-1">+12 this month</div>
            </div>
          </CompactCard>

          {/* Space Debris */}
          <CompactCard 
            title="Space Debris" 
            icon={<AlertTriangleIcon className="h-4 w-4 text-orange-400" />}
            colorClass="orange"
          >
            <div className="text-center">
              <div className="text-2xl text-orange-300 font-bold">{spaceDebris.toLocaleString()}</div>
              <div className="text-xs text-gray-300">Tracked Objects</div>
              <div className="text-xs text-gray-400 mt-1">{'>'}10cm in size</div>
            </div>
          </CompactCard>

          {/* Launch Statistics */}
          <CompactCard 
            title="Launch Statistics" 
            icon={<TrendingUpIcon className="h-4 w-4 text-purple-400" />}
            colorClass="purple"
          >
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Total Launches</span>
                <span className="text-xs text-white font-medium">{totalLaunches}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Successful</span>
                <span className="text-xs text-green-300 font-medium">{successfulLaunches}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Success Rate</span>
                <span className="text-xs text-purple-300 font-medium">{launchSuccessRate}%</span>
              </div>
            </div>
          </CompactCard>

          {/* Global Space Agencies */}
          <CompactCard 
            title="Space Agencies" 
            icon={<GlobeIcon className="h-4 w-4 text-indigo-400" />}
            colorClass="indigo"
          >
            <div className="space-y-1">
              <div className="flex justify-between items-center bg-gray-800/30 rounded p-1 border border-gray-700/30">
                <span className="text-xs text-gray-300">NASA</span>
                <span className="text-xs text-indigo-300">USA</span>
              </div>
              <div className="flex justify-between items-center bg-gray-800/30 rounded p-1 border border-gray-700/30">
                <span className="text-xs text-gray-300">Roscosmos</span>
                <span className="text-xs text-indigo-300">Russia</span>
              </div>
              <div className="flex justify-between items-center bg-gray-800/30 rounded p-1 border border-gray-700/30">
                <span className="text-xs text-gray-300">CNSA</span>
                <span className="text-xs text-indigo-300">China</span>
              </div>
              <div className="flex justify-between items-center bg-gray-800/30 rounded p-1 border border-gray-700/30">
                <span className="text-xs text-gray-300">ESA</span>
                <span className="text-xs text-indigo-300">Europe</span>
              </div>
            </div>
          </CompactCard>

          {/* Research & Development */}
          <CompactCard 
            title="R&D Projects" 
            icon={<MicroscopeIcon className="h-4 w-4 text-cyan-400" />}
            colorClass="cyan"
          >
            <div className="space-y-1">
              <div className="bg-cyan-950/30 rounded p-1 border border-cyan-800/50">
                <div className="text-xs text-cyan-300 font-medium">Fusion Propulsion</div>
                <div className="text-xs text-gray-400">Phase 2 Testing</div>
              </div>
              <div className="bg-cyan-950/30 rounded p-1 border border-cyan-800/50">
                <div className="text-xs text-cyan-300 font-medium">Space Mining</div>
                <div className="text-xs text-gray-400">Asteroid Survey</div>
              </div>
              <div className="bg-cyan-950/30 rounded p-1 border border-cyan-800/50">
                <div className="text-xs text-cyan-300 font-medium">Mars Habitat</div>
                <div className="text-xs text-gray-400">Prototype Design</div>
              </div>
            </div>
          </CompactCard>
        </div>
          </div>
        )}

        {/* Missions View */}
        {selectedView === 'missions' && (
          <PremiumAccess
            requiredTier="tier1"
            featureName="Mission Tracking"
            description="Advanced mission tracking and monitoring features"
          >
            <div className="space-y-4 min-h-[60vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {activeMissions.map((mission, index) => (
                <CompactCard
                  key={index}
                  title={mission.name}
                  icon={<RocketIcon className="h-4 w-4 text-blue-400" />}
                  colorClass={mission.status === 'active' ? 'green' : mission.status === 'planned' ? 'blue' : 'orange'}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">{mission.agency}</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        mission.status === 'active' ? 'bg-green-950/50 text-green-300' :
                        mission.status === 'planned' ? 'bg-blue-950/50 text-blue-300' :
                        mission.status === 'completed' ? 'bg-gray-950/50 text-gray-300' :
                        'bg-red-950/50 text-red-300'
                      }`}>
                        {mission.status}
                      </span>
                    </div>
                    <div className="text-xs text-gray-300">
                      <div>Destination: {mission.destination}</div>
                      <div>Launch: {mission.launchDate}</div>
                      <div>Duration: {mission.duration}</div>
                      <div>Crew: {mission.crew} astronauts</div>
                    </div>
                  </div>
                </CompactCard>
              ))}
            </div>
          </div>
          </PremiumAccess>
        )}

        {/* Space Stations View */}
        {selectedView === 'stations' && (
          <PremiumAccess
            requiredTier="tier1"
            featureName="Space Station Monitoring"
            description="Real-time space station tracking and data"
          >
            <div className="space-y-4 min-h-[60vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {spaceStations.map((station, index) => (
                <CompactCard
                  key={index}
                  title={station.name}
                  icon={<SatelliteIcon className="h-4 w-4 text-purple-400" />}
                  colorClass={station.status === 'active' ? 'green' : 'purple'}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">{station.country}</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        station.status === 'active' ? 'bg-green-950/50 text-green-300' :
                        'bg-gray-950/50 text-gray-300'
                      }`}>
                        {station.status}
                      </span>
                    </div>
                    <div className="text-xs text-gray-300">
                      <div>Launch: {station.launchDate}</div>
                      <div>Orbit: {station.orbit}</div>
                      <div>Crew: {station.crew} astronauts</div>
                    </div>
                  </div>
                </CompactCard>
              ))}
            </div>
          </div>
          </PremiumAccess>
        )}

        {/* Events View */}
        {selectedView === 'events' && (
          <PremiumAccess
            requiredTier="tier1"
            featureName="Space Events"
            description="Access to space events and calendar features"
          >
            <div className="space-y-4 min-h-[60vh]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {upcomingEvents.map((event, index) => (
                <CompactCard
                  key={index}
                  title={event.title}
                  icon={<CalendarIcon className="h-4 w-4 text-orange-400" />}
                  colorClass="orange"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">{event.date}</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        event.type === 'launch' ? 'bg-blue-950/50 text-blue-300' :
                        event.type === 'spacewalk' ? 'bg-purple-950/50 text-purple-300' :
                        event.type === 'scientific' ? 'bg-green-950/50 text-green-300' :
                        'bg-gray-950/50 text-gray-300'
                      }`}>
                        {event.type}
                      </span>
                    </div>
                    <div className="text-xs text-gray-300">
                      <div>{event.description}</div>
                      <div className="text-gray-400">📍 {event.location}</div>
                    </div>
                  </div>
                </CompactCard>
              ))}
            </div>
          </div>
          </PremiumAccess>
        )}

        {/* Calendar View */}
        {selectedView === 'calendar' && (
          <PremiumAccess
            requiredTier="tier1"
            featureName="Space Calendar"
            description="Access to space calendar and scheduling features"
          >
            <div className="space-y-4 min-h-[60vh]">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-white">Space Calendar</h2>
                <p className="text-gray-400 text-sm">Upcoming space events, launches, and astronomical phenomena</p>
              </div>
              <div className="flex space-x-2">
                <button className="px-3 py-1.5 bg-purple-600/20 text-purple-300 border border-purple-500/30 rounded text-xs hover:bg-purple-600/30 transition-all">
                  <CalendarIcon className="h-3 w-3 inline mr-1" />
                  Add Event
                </button>
                <button className="px-3 py-1.5 bg-gray-800/30 text-gray-300 border border-gray-700/30 rounded text-xs hover:bg-gray-700/30 transition-all">
                  <ExternalLinkIcon className="h-3 w-3 inline mr-1" />
                  Export
                </button>
              </div>
            </div>

            {/* Calendar Filters */}
            <div className="flex flex-wrap gap-2 mb-4">
              <button className="px-3 py-1.5 bg-purple-600/20 text-purple-300 border border-purple-500/30 rounded text-xs">
                All Events
              </button>
              <button className="px-3 py-1.5 bg-gray-800/30 text-gray-400 border border-gray-700/30 rounded text-xs hover:bg-gray-700/30">
                Launches
              </button>
              <button className="px-3 py-1.5 bg-gray-800/30 text-gray-400 border border-gray-700/30 rounded text-xs hover:bg-gray-700/30">
                Astronomical
              </button>
              <button className="px-3 py-1.5 bg-gray-800/30 text-gray-400 border border-gray-700/30 rounded text-xs hover:bg-gray-700/30">
                Conferences
              </button>
              <button className="px-3 py-1.5 bg-gray-800/30 text-gray-400 border border-gray-700/30 rounded text-xs hover:bg-gray-700/30">
                High Priority
              </button>
            </div>

            {/* Calendar Events Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {calendarEvents.map((event) => (
                <CompactCard
                  key={event.id}
                  title={event.title}
                  icon={
                    event.type === 'launch' ? <RocketIcon className="h-4 w-4 text-green-400" /> :
                    event.type === 'astronomical' ? <StarIcon className="h-4 w-4 text-blue-400" /> :
                    event.type === 'spacewalk' ? <UsersIcon className="h-4 w-4 text-orange-400" /> :
                    event.type === 'conference' ? <BookOpenIcon className="h-4 w-4 text-purple-400" /> :
                    event.type === 'anniversary' ? <CalendarIcon className="h-4 w-4 text-cyan-400" /> :
                    <CalendarIcon className="h-4 w-4 text-gray-400" />
                  }
                  colorClass={
                    event.priority === 'high' ? 'red' :
                    event.priority === 'medium' ? 'orange' : 'blue'
                  }
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-300">
                        {new Date(event.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                      {event.time && (
                        <span className="text-xs text-gray-400">{event.time}</span>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className={`text-xs px-2 py-1 rounded ${
                        event.category === 'space' ? 'bg-blue-950/50 text-blue-300' :
                        event.category === 'astronomy' ? 'bg-purple-950/50 text-purple-300' :
                        event.category === 'education' ? 'bg-green-950/50 text-green-300' :
                        'bg-orange-950/50 text-orange-300'
                      }`}>
                        {event.category}
                      </span>
                      {event.isRecurring && (
                        <span className="text-xs text-cyan-400">🔄 {event.recurrence}</span>
                      )}
                    </div>

                    <div className="text-xs text-gray-300">
                      <div className="mb-1">{event.description}</div>
                      <div className="text-gray-400">📍 {event.location}</div>
                      {event.agency && (
                        <div className="text-gray-400">🏛️ {event.agency}</div>
                      )}
                    </div>
                  </div>
                </CompactCard>
              ))}
            </div>

            {/* Calendar Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-6">
              <CompactCard
                title="Total Events"
                icon={<CalendarIcon className="h-4 w-4 text-blue-400" />}
                colorClass="blue"
              >
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-300">{calendarEvents.length}</div>
                  <div className="text-xs text-gray-400">This month</div>
                </div>
              </CompactCard>
              
              <CompactCard
                title="High Priority"
                icon={<AlertTriangleIcon className="h-4 w-4 text-red-400" />}
                colorClass="red"
              >
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-300">
                    {calendarEvents.filter(e => e.priority === 'high').length}
                  </div>
                  <div className="text-xs text-gray-400">Critical events</div>
                </div>
              </CompactCard>
              
              <CompactCard
                title="Launches"
                icon={<RocketIcon className="h-4 w-4 text-green-400" />}
                colorClass="green"
              >
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-300">
                    {calendarEvents.filter(e => e.type === 'launch').length}
                  </div>
                  <div className="text-xs text-gray-400">Scheduled</div>
                </div>
              </CompactCard>
              
              <CompactCard
                title="Astronomical"
                icon={<StarIcon className="h-4 w-4 text-purple-400" />}
                colorClass="purple"
              >
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-300">
                    {calendarEvents.filter(e => e.type === 'astronomical').length}
                  </div>
                  <div className="text-xs text-gray-400">Celestial events</div>
                </div>
              </CompactCard>
            </div>
          </div>
          </PremiumAccess>
        )}

        {/* Orbits View */}
        {selectedView === 'orbits' && (
          <PremiumAccess
            requiredTier="tier1"
            featureName="Satellite Tracking"
            description="Access to satellite tracking and orbital visualization"
          >
            <div className="h-[calc(100vh-200px)] min-h-[60vh]">
              <SatelliteVisualizer />
            </div>
          </PremiumAccess>
        )}

        {/* Systems View */}
        {selectedView === 'systems' && (
          <PremiumAccess
            requiredTier="tier1"
            featureName="System Monitoring"
            description="Access to system status monitoring and diagnostics"
          >
            <div className="space-y-4 min-h-[60vh]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {systemStatuses.map((system, index) => (
                <CompactCard
                  key={index}
                  title={system.system}
                  icon={<SettingsIcon className="h-4 w-4 text-cyan-400" />}
                  colorClass={system.status === 'operational' ? 'green' : 'red'}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs px-2 py-1 rounded ${
                        system.status === 'operational' ? 'bg-green-950/50 text-green-300' :
                        system.status === 'degraded' ? 'bg-yellow-950/50 text-yellow-300' :
                        system.status === 'maintenance' ? 'bg-blue-950/50 text-blue-300' :
                        'bg-red-950/50 text-red-300'
                      }`}>
                        {system.status}
                      </span>
                    </div>
                    <div className="text-xs text-gray-300">
                      <div>Uptime: {system.uptime}</div>
                      <div>Last Update: {system.lastUpdate}</div>
                    </div>
                  </div>
                </CompactCard>
              ))}
            </div>
            
            {/* Additional System Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <CompactCard
                title="Network Status"
                icon={<WifiIcon className="h-4 w-4 text-green-400" />}
                colorClass="green"
              >
                <div className="text-center">
                  <div className="text-lg text-green-300">🟢</div>
                  <div className="text-xs text-gray-300">All Systems Operational</div>
                  <div className="text-xs text-gray-400">99.9% Uptime</div>
                </div>
              </CompactCard>
              
              <CompactCard
                title="Data Throughput"
                icon={<TrendingUpIcon className="h-4 w-4 text-blue-400" />}
                colorClass="blue"
              >
                <div className="text-center">
                  <div className="text-lg text-blue-300">📊</div>
                  <div className="text-xs text-gray-300">2.4 TB/day</div>
                  <div className="text-xs text-gray-400">+12% from last week</div>
                </div>
              </CompactCard>
              
              <CompactCard
                title="Active Connections"
                icon={<SignalIcon className="h-4 w-4 text-purple-400" />}
                colorClass="purple"
              >
                <div className="text-center">
                  <div className="text-lg text-purple-300">📡</div>
                  <div className="text-xs text-gray-300">1,247 Active</div>
                  <div className="text-xs text-gray-400">Global Network</div>
                </div>
              </CompactCard>
              
              <CompactCard
                title="Security Status"
                icon={<ShieldIcon className="h-4 w-4 text-green-400" />}
                colorClass="green"
              >
                <div className="text-center">
                  <div className="text-lg text-green-300">🛡️</div>
                  <div className="text-xs text-gray-300">All Clear</div>
                  <div className="text-xs text-gray-400">No threats detected</div>
                </div>
              </CompactCard>
            </div>
          </div>
          </PremiumAccess>
        )}
      </div>

      {/* APOD Image Modal */}
      {nasaAPOD && (
        <ImageModal
          isOpen={apodModalOpen}
          onClose={() => setApodModalOpen(false)}
          imageUrl={nasaAPOD.url}
          title={nasaAPOD.title}
          description={nasaAPOD.explanation}
          date={nasaAPOD.date}
          copyright="NASA"
          externalUrl="https://apod.nasa.gov/apod/"
        />
      )}
    </div>
  );
}