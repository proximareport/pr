import React from 'react';
import { 
  useUpcomingLaunches, 
  usePreviousLaunches,
  useISSLocation, 
  usePeopleInSpace, 
  useSpaceEvents, 
  useSpaceNews, 
  useNASAAPOD, 
  useSpaceXCompany, 
  useSpaceAgencies 
} from '../services/launchesService';
import { 
  RocketIcon, 
  SatelliteIcon, 
  UsersIcon, 
  CalendarIcon, 
  NewspaperIcon, 
  CameraIcon, 
  BuildingIcon, 
  GlobeIcon,
  ClockIcon,
  ExternalLinkIcon,
  AlertTriangleIcon,
  ActivityIcon
} from 'lucide-react';

const LoadingCard = ({ title }: { title: string }) => (
  <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl p-6 border border-purple-900/30">
    <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
    <div className="flex items-center justify-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-400/30 border-t-purple-400"></div>
      <span className="ml-3 text-gray-300">Loading...</span>
    </div>
  </div>
);

const ErrorCard = ({ title, error }: { title: string; error: string }) => (
  <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl p-6 border border-purple-900/30">
    <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
    <div className="text-red-400 bg-red-950/50 p-4 rounded-xl border border-red-800/50">
      <p className="font-medium mb-2">Failed to load data</p>
      <p className="text-sm text-red-300">{error}</p>
    </div>
  </div>
);

const DataFreshnessIndicator = ({ isOld, message }: { isOld: boolean; message?: string }) => {
  if (!isOld) return null;
  
  return (
    <div className="mb-4 bg-yellow-950/30 border border-yellow-800/50 rounded-xl p-3">
      <div className="flex items-center">
        <AlertTriangleIcon className="w-4 h-4 text-yellow-400 mr-2" />
        <span className="text-yellow-300 text-sm">
          {message || "Note: This data may be outdated due to API limitations"}
        </span>
      </div>
    </div>
  );
};

export default function MissionControl() {
  // API hooks
  const { data: upcomingLaunches, isLoading: upcomingLaunchesLoading, error: upcomingLaunchesError } = useUpcomingLaunches();
  const { data: previousLaunches, isLoading: previousLaunchesLoading, error: previousLaunchesError } = usePreviousLaunches();
  
  // Debug logging
  console.log('MissionControl component data:', {
    upcomingLaunches,
    previousLaunches,
    upcomingLoading: upcomingLaunchesLoading,
    previousLoading: previousLaunchesLoading,
    upcomingError: upcomingLaunchesError,
    previousError: previousLaunchesError,
    upcomingCount: upcomingLaunches?.results?.length,
    previousCount: previousLaunches?.results?.length,
    firstUpcoming: upcomingLaunches?.results?.[0]?.name,
    firstPrevious: previousLaunches?.results?.[0]?.name
  });
  const { data: issLocation, isLoading: issLocationLoading, error: issLocationError } = useISSLocation();
  const { data: peopleInSpace, isLoading: peopleInSpaceLoading, error: peopleInSpaceError } = usePeopleInSpace();
  const { data: spaceEvents, isLoading: spaceEventsLoading, error: spaceEventsError } = useSpaceEvents();
  const { data: spaceNews, isLoading: spaceNewsLoading, error: spaceNewsError } = useSpaceNews();
  const { data: nasaApod, isLoading: nasaApodLoading, error: nasaApodError } = useNASAAPOD();
  const { data: spacexCompany, isLoading: spacexCompanyLoading, error: spacexCompanyError } = useSpaceXCompany();
  const { data: spaceAgencies, isLoading: spaceAgenciesLoading, error: spaceAgenciesError } = useSpaceAgencies();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isOld = (now.getTime() - date.getTime()) > (30 * 24 * 60 * 60 * 1000); // 30 days
    
    return {
      formatted: date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      isOld
    };
  };

  const checkDataFreshness = (data: any[], dateField: string = 'date_utc') => {
    if (!data || data.length === 0) return false;
    const latestDate = new Date(data[0][dateField]);
    const now = new Date();
    return (now.getTime() - latestDate.getTime()) > (30 * 24 * 60 * 60 * 1000); // 30 days old
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950/40 to-black relative overflow-hidden">
      {/* Dark purple background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-purple-900/10 via-violet-900/10 to-purple-800/10"></div>
        <div className="absolute top-20 left-20 w-64 h-64 bg-gradient-to-r from-purple-600/10 to-violet-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-r from-purple-700/10 to-pink-700/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-gradient-to-r from-violet-600/8 to-purple-600/8 rounded-full blur-2xl animate-bounce"></div>
        <div className="absolute top-3/4 right-1/4 w-48 h-48 bg-gradient-to-r from-purple-600/8 to-violet-600/8 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute inset-0 bg-black/20"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 bg-gray-950/80 backdrop-blur-sm border-b border-purple-900/30 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-violet-700 flex items-center justify-center shadow-lg shadow-purple-500/25">
                <ActivityIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white">
                  Proxima <span className="text-purple-400">Mission Control</span>
                </h1>
                <p className="text-gray-300 mt-1">Real-time space data and mission tracking</p>
              </div>
            </div>
            <div className="text-right bg-gray-900/50 rounded-xl p-4 border border-purple-900/30">
              <div className="text-sm text-gray-400 flex items-center">
                <ClockIcon className="h-4 w-4 mr-2" />
                Last updated
              </div>
              <div className="text-white font-mono text-lg">{new Date().toLocaleTimeString()}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            
            {/* Quick Launch Overview */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center">
                  <div className="w-1 h-8 bg-gradient-to-b from-purple-500 to-violet-600 rounded-full mr-3"></div>
                  <RocketIcon className="h-6 w-6 text-purple-400 mr-2" />
                  Mission Overview
                </h2>
                <a 
                  href="/launches" 
                  className="text-purple-400 hover:text-purple-300 text-sm font-medium px-6 py-3 bg-purple-950/30 rounded-xl border border-purple-800/50 hover:border-purple-700/50 transition-all duration-300 flex items-center space-x-2"
                >
                  <span>View All Launches</span>
                  <ExternalLinkIcon className="h-4 w-4" />
                </a>
              </div>
              
              {/* Next 3 Upcoming Missions */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-white mb-4">Next Upcoming Missions</h3>
                {upcomingLaunchesLoading ? (
                  <LoadingCard title="Loading upcoming launches..." />
                ) : upcomingLaunchesError ? (
                  <ErrorCard title="Upcoming Launches" error={upcomingLaunchesError.message} />
                ) : upcomingLaunches?.results && upcomingLaunches.results.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingLaunches.results.slice(0, 3).map((launch: any) => (
                      <div key={launch.id} className="bg-gray-900/60 backdrop-blur-sm rounded-xl p-6 border border-purple-900/30 hover:border-purple-800/50 transition-all duration-300 group">
                        <div className="flex flex-col md:flex-row md:items-center justify-between">
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-white mb-3 group-hover:text-purple-100 transition-colors duration-300">{launch.name}</h4>
                            <div className="flex flex-wrap gap-4 text-sm text-gray-300">
                              <span className="flex items-center bg-purple-950/30 px-3 py-1 rounded-lg border border-purple-800/30">
                                <CalendarIcon className="w-4 h-4 text-purple-400 mr-2" />
                                {formatDate(launch.net).formatted}
                                {formatDate(launch.net).isOld && <span className="ml-2 text-yellow-400">(Historical)</span>}
                              </span>
                              {launch.launch_service_provider && (
                                <span className="flex items-center bg-gray-800/30 px-3 py-1 rounded-lg border border-gray-700/30">
                                  <BuildingIcon className="w-4 h-4 text-green-400 mr-2" />
                                  {launch.launch_service_provider.name}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="mt-3 md:mt-0 md:ml-6">
                            <div className={`px-4 py-2 rounded-xl text-sm font-medium ${
                              launch.status?.name === 'Go' ? 'bg-green-950/50 text-green-300 border border-green-800/50' :
                              launch.status?.name === 'TBD' ? 'bg-yellow-950/50 text-yellow-300 border border-yellow-800/50' :
                              'bg-gray-800/50 text-gray-300 border border-gray-700/50'
                            }`}>
                              {launch.status?.name || 'Unknown'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400 bg-gray-900/30 rounded-xl border border-purple-900/30">
                    <RocketIcon className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                    <div>No upcoming launches available</div>
                  </div>
                )}
              </div>
            </section>

            {/* ISS Tracking */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <div className="w-1 h-8 bg-gradient-to-b from-green-500 to-emerald-600 rounded-full mr-3"></div>
                <SatelliteIcon className="h-6 w-6 text-green-400 mr-2" />
                International Space Station
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* ISS Location */}
                <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl p-6 border border-purple-900/30 hover:border-purple-800/50 transition-all duration-300">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <GlobeIcon className="h-5 w-5 text-green-400 mr-2" />
                    Current Location
                  </h3>
                  {issLocationLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-green-400/30 border-t-green-400"></div>
                      <span className="ml-3 text-gray-300">Tracking ISS...</span>
                    </div>
                  ) : issLocationError ? (
                    <div className="text-red-400 bg-red-950/30 p-4 rounded-xl border border-red-800/50">
                      <p className="text-sm">Using fallback location data</p>
                    </div>
                  ) : null}
                  
                  {issLocation && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/30">
                          <span className="text-gray-400 text-xs block">Latitude</span>
                          <span className="text-white font-mono text-lg">{parseFloat(issLocation.iss_position.latitude).toFixed(4)}°</span>
                        </div>
                        <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/30">
                          <span className="text-gray-400 text-xs block">Longitude</span>
                          <span className="text-white font-mono text-lg">{parseFloat(issLocation.iss_position.longitude).toFixed(4)}°</span>
                        </div>
                      </div>
                      <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/30">
                        <span className="text-gray-400 text-xs block">Updated</span>
                        <span className="text-white">{new Date(issLocation.timestamp * 1000).toLocaleTimeString()}</span>
                      </div>
                      <div className="bg-green-950/30 rounded-xl p-4 border border-green-800/50">
                        <div className="text-green-300 text-sm flex items-start">
                          <SatelliteIcon className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0" />
                          ISS is currently orbiting at ~408 km altitude, traveling at 27,600 km/h
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* People in Space */}
                <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl p-6 border border-purple-900/30 hover:border-purple-800/50 transition-all duration-300">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <UsersIcon className="h-5 w-5 text-blue-400 mr-2" />
                    Astronauts Currently in Space
                  </h3>
                  {peopleInSpaceLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-400/30 border-t-blue-400"></div>
                      <span className="ml-3 text-gray-300">Loading crew info...</span>
                    </div>
                  ) : peopleInSpaceError ? (
                    <div className="text-red-400 bg-red-950/30 p-4 rounded-xl border border-red-800/50">
                      <p className="text-sm">Using fallback crew data</p>
                    </div>
                  ) : null}
                  
                  {peopleInSpace && (
                    <div className="space-y-4">
                      <div className="bg-blue-950/30 rounded-xl p-4 border border-blue-800/50 text-center">
                        <span className="text-blue-300 text-sm block">Total People in Space</span>
                        <span className="text-3xl font-bold text-blue-400">{peopleInSpace.number || peopleInSpace.people?.length || 0}</span>
                      </div>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {peopleInSpace.people?.map((person: any, index: number) => (
                          <div key={index} className="flex justify-between items-center p-3 bg-gray-800/30 rounded-lg border border-gray-700/30 hover:border-gray-600/50 transition-colors duration-300">
                            <span className="text-white font-medium">{person.name}</span>
                            <span className="text-blue-300 text-xs px-3 py-1 bg-blue-950/30 rounded-full border border-blue-800/30">{person.craft}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Space Events Preview */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center">
                  <div className="w-1 h-8 bg-gradient-to-b from-purple-500 to-violet-600 rounded-full mr-3"></div>
                  <CalendarIcon className="h-6 w-6 text-purple-400 mr-2" />
                  Upcoming Events
                </h2>
              </div>
              
              {spaceEventsLoading ? (
                <LoadingCard title="Loading space events..." />
              ) : spaceEventsError ? (
                <ErrorCard title="Space Events" error={spaceEventsError.message} />
              ) : spaceEvents?.results && spaceEvents.results.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {spaceEvents.results.slice(0, 2).map((event: any) => (
                    <div key={event.id} className="bg-gray-900/60 backdrop-blur-sm rounded-xl p-6 border border-purple-900/30 hover:border-purple-800/50 transition-all duration-300 group">
                      <h3 className="text-lg font-semibold text-white mb-3 group-hover:text-purple-100 transition-colors duration-300">{event.name}</h3>
                      <p className="text-gray-300 text-sm mb-4 line-clamp-2 leading-relaxed">{event.description}</p>
                      <div className="text-sm text-purple-300 bg-purple-950/30 px-3 py-2 rounded-lg border border-purple-800/30 inline-flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        {new Date(event.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400 bg-gray-900/30 rounded-xl border border-purple-900/30">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                  <div>No upcoming space events available</div>
                </div>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-8">
            {/* NASA APOD */}
            <section>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                <div className="w-1 h-6 bg-gradient-to-b from-orange-500 to-red-600 rounded-full mr-2"></div>
                <CameraIcon className="h-5 w-5 text-orange-400 mr-2" />
                NASA Picture of the Day
              </h2>
              
              {nasaApodLoading ? (
                <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl p-4 border border-purple-900/30">
                  <div className="animate-pulse">
                    <div className="bg-gray-700/50 h-48 rounded-lg mb-4"></div>
                    <div className="bg-gray-700/50 h-4 rounded mb-2"></div>
                    <div className="bg-gray-700/50 h-3 rounded"></div>
                  </div>
                </div>
              ) : nasaApodError ? (
                <ErrorCard title="NASA APOD" error={nasaApodError.message} />
              ) : nasaApod ? (
                <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl overflow-hidden border border-purple-900/30 hover:border-purple-800/50 transition-all duration-300">
                  {nasaApod.media_type === 'image' && (
                    <img 
                      src={nasaApod.url} 
                      alt={nasaApod.title}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-white mb-2">{nasaApod.title}</h3>
                    <p className="text-gray-300 text-sm line-clamp-4 leading-relaxed">{nasaApod.explanation}</p>
                    <div className="mt-3 text-xs text-purple-300 bg-purple-950/30 px-3 py-1 rounded-lg border border-purple-800/30 inline-block">
                      {new Date(nasaApod.date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ) : null}
            </section>

            {/* Space News */}
            <section>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                <div className="w-1 h-6 bg-gradient-to-b from-red-500 to-pink-600 rounded-full mr-2"></div>
                <NewspaperIcon className="h-5 w-5 text-red-400 mr-2" />
                Latest Space News
              </h2>
              
              {spaceNewsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-gray-900/60 backdrop-blur-sm rounded-xl p-4 border border-purple-900/30">
                      <div className="animate-pulse">
                        <div className="bg-gray-700/50 h-4 rounded mb-2"></div>
                        <div className="bg-gray-700/50 h-3 rounded mb-2"></div>
                        <div className="bg-gray-700/50 h-3 rounded w-3/4"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : spaceNewsError ? (
                <ErrorCard title="Space News" error={spaceNewsError.message} />
              ) : spaceNews?.results && spaceNews.results.length > 0 ? (
                <div className="space-y-4">
                  {spaceNews.results.slice(0, 5).map((article: any) => (
                    <div key={article.id} className="bg-gray-900/60 backdrop-blur-sm rounded-xl p-4 border border-purple-900/30 hover:border-purple-800/50 transition-all duration-300 group">
                      <h3 className="text-sm font-semibold text-white mb-2 line-clamp-2 group-hover:text-purple-100 transition-colors duration-300">
                        <a href={article.url} target="_blank" rel="noopener noreferrer" className="hover:text-purple-400">
                          {article.title}
                        </a>
                      </h3>
                      <p className="text-gray-400 text-xs mb-3 line-clamp-2 leading-relaxed">{article.summary}</p>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-purple-300 bg-purple-950/30 px-2 py-1 rounded border border-purple-800/30">{article.news_site}</span>
                        <span className="text-gray-500">{new Date(article.published_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400 bg-gray-900/30 rounded-xl border border-purple-900/30">
                  <NewspaperIcon className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                  <div>No space news available</div>
                </div>
              )}
            </section>

            {/* SpaceX Company Info */}
            <section>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full mr-2"></div>
                <RocketIcon className="h-5 w-5 text-blue-400 mr-2" />
                SpaceX Status
              </h2>
              
              {spacexCompanyLoading ? (
                <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl p-4 border border-purple-900/30">
                  <div className="animate-pulse space-y-3">
                    <div className="bg-gray-700/50 h-3 rounded"></div>
                    <div className="bg-gray-700/50 h-3 rounded w-3/4"></div>
                    <div className="bg-gray-700/50 h-3 rounded w-1/2"></div>
                  </div>
                </div>
              ) : spacexCompanyError ? (
                <ErrorCard title="SpaceX Info" error={spacexCompanyError.message} />
              ) : spacexCompany ? (
                <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl p-4 border border-purple-900/30 hover:border-purple-800/50 transition-all duration-300">
                  <DataFreshnessIndicator 
                    isOld={checkDataFreshness([spacexCompany], 'founded')} 
                    message="SpaceX data may be from 2022 due to API limitations"
                  />
                  <div className="grid grid-cols-1 gap-3 text-sm">
                    {[
                      { label: 'Founded', value: spacexCompany.founded },
                      { label: 'Employees', value: spacexCompany.employees?.toLocaleString() || 'N/A' },
                      { label: 'Valuation', value: spacexCompany.valuation ? `$${spacexCompany.valuation.toLocaleString()}` : 'N/A' },
                      { label: 'Vehicles', value: spacexCompany.vehicles || 'N/A' },
                      { label: 'Launch Sites', value: spacexCompany.launch_sites || 'N/A' },
                      { label: 'Test Sites', value: spacexCompany.test_sites || 'N/A' }
                    ].map((item, index) => (
                      <div key={index} className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/30">
                        <span className="text-gray-400 text-xs block">{item.label}</span>
                        <span className="text-white font-medium">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </section>

            {/* Space Agencies */}
            <section>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                <div className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full mr-2"></div>
                <BuildingIcon className="h-5 w-5 text-indigo-400 mr-2" />
                Global Space Agencies
              </h2>
              
              {spaceAgenciesLoading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-gray-900/60 backdrop-blur-sm rounded-xl p-3 border border-purple-900/30">
                      <div className="animate-pulse">
                        <div className="bg-gray-700/50 h-3 rounded mb-2"></div>
                        <div className="bg-gray-700/50 h-2 rounded w-2/3"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : spaceAgenciesError ? (
                <ErrorCard title="Space Agencies" error={spaceAgenciesError.message} />
              ) : spaceAgencies?.results && spaceAgencies.results.length > 0 ? (
                <div className="space-y-3">
                  {spaceAgencies.results.slice(0, 8).map((agency: any) => (
                    <div key={agency.id} className="bg-gray-900/60 backdrop-blur-sm rounded-xl p-3 border border-purple-900/30 hover:border-purple-800/50 transition-all duration-300 group">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-semibold text-white group-hover:text-purple-100 transition-colors duration-300">{agency.name}</h3>
                          <p className="text-xs text-gray-400">{agency.abbrev} • {agency.country_code}</p>
                        </div>
                        <span className="text-xs px-3 py-1 bg-indigo-950/30 text-indigo-300 rounded-full border border-indigo-800/30">
                          {agency.type}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400 bg-gray-900/30 rounded-xl border border-purple-900/30">
                  <BuildingIcon className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                  <div>No space agencies data available</div>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
} 