import React, { useState, useEffect } from 'react';
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
  ShoppingCartIcon
} from 'lucide-react';

// Type definitions
interface Location {
  lat: number;
  lon: number;
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

  // API hooks
  const { data: upcomingLaunches, isLoading: upcomingLaunchesLoading, error: upcomingLaunchesError } = useUpcomingLaunches();
  const { data: nearEarthObjects, isLoading: nearEarthObjectsLoading, error: nearEarthObjectsError } = useNearEarthObjects();
  const { data: issPassPredictions, isLoading: issPassLoading, error: issPassError } = useISSPassPredictions(userLocation?.lat, userLocation?.lon);
  const { data: marsWeather, isLoading: marsWeatherLoading, error: marsWeatherError } = useMarsWeather();
  const { data: earthquakeData, isLoading: earthquakeDataLoading, error: earthquakeDataError } = useEarthquakeData();
  const { data: solarActivity, isLoading: solarActivityLoading, error: solarActivityError } = useSolarActivity();
  const { data: advancedSpaceWeather, isLoading: advancedSpaceWeatherLoading, error: advancedSpaceWeatherError } = useAdvancedSpaceWeather();
  const { data: moonPhase, isLoading: moonPhaseLoading, error: moonPhaseError } = useMoonPhase();
  const { data: satelliteTracking, isLoading: satelliteTrackingLoading, error: satelliteTrackingError } = useSatelliteTracking();
  const { data: nasaApod, isLoading: nasaApodLoading, error: nasaApodError } = useNASAAPOD();
  const { data: hubbleImages, isLoading: hubbleImagesLoading, error: hubbleImagesError } = useHubbleImages();
  const { data: exoplanets, isLoading: exoplanetsLoading, error: exoplanetsError } = useExoplanets();

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

      {/* Main Content - Compact Grid */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-3">
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
                      <div>
                        <span className="text-gray-400 block">Start</span>
                        <span className="text-white font-medium">{new Date(pass.risetime * 1000).toLocaleTimeString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Duration</span>
                        <span className="text-white font-medium">{pass.duration}s</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Mag</span>
                        <span className="text-yellow-300 font-medium">{pass.mag}</span>
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
                <div className="bg-red-950/30 rounded p-1 border border-red-800/50 text-center">
                  <div className="text-red-300 text-xs">Sol {marsWeather.sol}</div>
                  <div className="text-white font-medium text-xs">{marsWeather.season}</div>
                </div>
                <div className="bg-blue-950/30 rounded p-1 border border-blue-800/50 text-center">
                  <div className="text-blue-300 text-xs">Temp</div>
                  <div className="text-white font-medium text-xs">{marsWeather.min_temp}° / {marsWeather.max_temp}°C</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <div className="bg-purple-950/30 rounded p-1 border border-purple-800/50 text-center">
                  <div className="text-purple-300 text-xs">Pressure</div>
                  <div className="text-white font-medium text-xs">{marsWeather.pressure} Pa</div>
                </div>
                <div className="bg-green-950/30 rounded p-1 border border-green-800/50 text-center">
                  <div className="text-green-300 text-xs">Wind</div>
                  <div className="text-white font-medium text-xs">{marsWeather.wind_speed} m/s</div>
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
          {nasaApodLoading ? (
            <LoadingCard title="Loading APOD..." />
          ) : nasaApodError ? (
            <ErrorCard title="NASA APOD" error={nasaApodError.message} />
          ) : nasaApod ? (
            <div className="md:col-span-2 lg:col-span-2">
              <CompactCard 
                title="Astronomy Picture of the Day" 
                icon={<CameraIcon className="h-4 w-4 text-purple-400" />}
                colorClass="purple"
              >
                {nasaApod.media_type === 'image' && (
                  <div className="mb-2">
                    <img 
                      src={nasaApod.url} 
                      alt={nasaApod.title}
                      className="w-full h-32 object-cover rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <h4 className="text-white font-medium text-xs mb-1">{nasaApod.title}</h4>
                <p className="text-gray-400 text-xs mb-1 line-clamp-2">{nasaApod.explanation}</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-purple-300">{nasaApod.date}</span>
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
        </div>
      </div>
    </div>
  );
}