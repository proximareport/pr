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

const LoadingCard = ({ title }: { title: string }) => (
  <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
    <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
    <div className="flex items-center justify-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
      <span className="ml-3 text-slate-300">Loading...</span>
    </div>
  </div>
);

const ErrorCard = ({ title, error }: { title: string; error: string }) => (
  <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
    <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
    <div className="text-red-400 bg-red-900/20 p-4 rounded-lg border border-red-800">
      <p className="font-medium mb-2">Failed to load data</p>
      <p className="text-sm text-red-300">{error}</p>
    </div>
  </div>
);

const DataFreshnessIndicator = ({ isOld, message }: { isOld: boolean; message?: string }) => {
  if (!isOld) return null;
  
  return (
    <div className="mb-4 bg-yellow-900/20 border border-yellow-700 rounded-lg p-3">
      <div className="flex items-center">
        <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></div>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Proxima Mission Control</h1>
              <p className="text-slate-300 mt-1">Real-time space data and mission tracking</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-400">Last updated</div>
              <div className="text-white font-mono">{new Date().toLocaleTimeString()}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            
            {/* Quick Launch Overview */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center">
                  <div className="w-1 h-6 bg-blue-500 rounded-full mr-3"></div>
                  Mission Overview
                </h2>
                <a 
                  href="/launches" 
                  className="text-blue-400 hover:text-blue-300 text-sm font-medium px-4 py-2 bg-blue-900/20 rounded-lg border border-blue-700 hover:border-blue-600 transition-colors"
                >
                  View All Launches →
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
                      <div key={launch.id} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 hover:border-slate-600 transition-colors">
                        <div className="flex flex-col md:flex-row md:items-center justify-between">
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-white mb-2">{launch.name}</h4>
                            <div className="flex flex-wrap gap-4 text-sm text-slate-300">
                              <span className="flex items-center">
                                <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                                {formatDate(launch.net).formatted}
                                {formatDate(launch.net).isOld && <span className="ml-2 text-yellow-400">(Historical)</span>}
                              </span>
                              {launch.launch_service_provider && (
                                <span className="flex items-center">
                                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                                  {launch.launch_service_provider.name}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="mt-2 md:mt-0 md:ml-6">
                            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                              launch.status?.name === 'Go' ? 'bg-green-900/50 text-green-300 border border-green-700' :
                              launch.status?.name === 'TBD' ? 'bg-yellow-900/50 text-yellow-300 border border-yellow-700' :
                              'bg-slate-700 text-slate-300 border border-slate-600'
                            }`}>
                              {launch.status?.name || 'Unknown'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <div>No upcoming launches available</div>
                  </div>
                )}
              </div>
            </section>

            {/* ISS Tracking */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <div className="w-1 h-6 bg-green-500 rounded-full mr-3"></div>
                International Space Station
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* ISS Location */}
                <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
                  <h3 className="text-lg font-semibold text-white mb-4">Current Location</h3>
                  {issLocationLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-400"></div>
                      <span className="ml-3 text-slate-300">Tracking ISS...</span>
                    </div>
                  ) : issLocationError ? (
                    <div className="text-red-400 bg-red-900/20 p-4 rounded-lg border border-red-800">
                      <p className="text-sm">Using fallback location data</p>
                    </div>
                  ) : null}
                  
                  {issLocation && (
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-slate-300">Latitude:</span>
                        <span className="text-white font-mono">{parseFloat(issLocation.iss_position.latitude).toFixed(4)}°</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-300">Longitude:</span>
                        <span className="text-white font-mono">{parseFloat(issLocation.iss_position.longitude).toFixed(4)}°</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-300">Updated:</span>
                        <span className="text-white text-sm">{new Date(issLocation.timestamp * 1000).toLocaleTimeString()}</span>
                      </div>
                      <div className="mt-4 p-3 bg-green-900/20 rounded-lg border border-green-700">
                        <div className="text-green-300 text-sm">
                          🛰️ ISS is currently orbiting at ~408 km altitude, traveling at 27,600 km/h
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* People in Space */}
                <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
                  <h3 className="text-lg font-semibold text-white mb-4">Astronauts Currently in Space</h3>
                  {peopleInSpaceLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
                      <span className="ml-3 text-slate-300">Loading crew info...</span>
                    </div>
                  ) : peopleInSpaceError ? (
                    <div className="text-red-400 bg-red-900/20 p-4 rounded-lg border border-red-800">
                      <p className="text-sm">Using fallback crew data</p>
                    </div>
                  ) : null}
                  
                  {peopleInSpace && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-slate-300">Total People in Space:</span>
                        <span className="text-2xl font-bold text-blue-400">{peopleInSpace.number || peopleInSpace.people?.length || 0}</span>
                      </div>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {peopleInSpace.people?.map((person: any, index: number) => (
                          <div key={index} className="flex justify-between items-center p-2 bg-slate-700/30 rounded">
                            <span className="text-white text-sm">{person.name}</span>
                            <span className="text-blue-300 text-xs px-2 py-1 bg-blue-900/30 rounded">{person.craft}</span>
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
                  <div className="w-1 h-6 bg-purple-500 rounded-full mr-3"></div>
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
                    <div key={event.id} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                      <h3 className="text-lg font-semibold text-white mb-2">{event.name}</h3>
                      <p className="text-slate-300 text-sm mb-3 line-clamp-2">{event.description}</p>
                      <div className="text-sm text-slate-400">
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
                <div className="text-center py-8 text-slate-400">
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
                <div className="w-1 h-5 bg-orange-500 rounded-full mr-2"></div>
                NASA Picture of the Day
              </h2>
              
              {nasaApodLoading ? (
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <div className="animate-pulse">
                    <div className="bg-slate-700 h-48 rounded mb-4"></div>
                    <div className="bg-slate-700 h-4 rounded mb-2"></div>
                    <div className="bg-slate-700 h-3 rounded"></div>
                  </div>
                </div>
              ) : nasaApodError ? (
                <ErrorCard title="NASA APOD" error={nasaApodError.message} />
              ) : nasaApod ? (
                <div className="bg-slate-800/50 rounded-lg overflow-hidden border border-slate-700">
                  {nasaApod.media_type === 'image' && (
                    <img 
                      src={nasaApod.url} 
                      alt={nasaApod.title}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-white mb-2">{nasaApod.title}</h3>
                    <p className="text-slate-300 text-sm line-clamp-4">{nasaApod.explanation}</p>
                    <div className="mt-3 text-xs text-slate-400">
                      {new Date(nasaApod.date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ) : null}
            </section>

            {/* Space News */}
            <section>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                <div className="w-1 h-5 bg-red-500 rounded-full mr-2"></div>
                Latest Space News
              </h2>
              
              {spaceNewsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                      <div className="animate-pulse">
                        <div className="bg-slate-700 h-4 rounded mb-2"></div>
                        <div className="bg-slate-700 h-3 rounded mb-2"></div>
                        <div className="bg-slate-700 h-3 rounded w-3/4"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : spaceNewsError ? (
                <ErrorCard title="Space News" error={spaceNewsError.message} />
              ) : spaceNews?.results && spaceNews.results.length > 0 ? (
                <div className="space-y-4">
                  {spaceNews.results.slice(0, 5).map((article: any) => (
                    <div key={article.id} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 hover:border-slate-600 transition-colors">
                      <h3 className="text-sm font-semibold text-white mb-2 line-clamp-2">
                        <a href={article.url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-400">
                          {article.title}
                        </a>
                      </h3>
                      <p className="text-slate-400 text-xs mb-2 line-clamp-2">{article.summary}</p>
                      <div className="flex justify-between items-center text-xs text-slate-500">
                        <span>{article.news_site}</span>
                        <span>{new Date(article.published_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-slate-400">
                  <div>No space news available</div>
                </div>
              )}
            </section>

            {/* SpaceX Company Info */}
            <section>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                <div className="w-1 h-5 bg-blue-500 rounded-full mr-2"></div>
                SpaceX Status
              </h2>
              
              {spacexCompanyLoading ? (
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <div className="animate-pulse space-y-3">
                    <div className="bg-slate-700 h-3 rounded"></div>
                    <div className="bg-slate-700 h-3 rounded w-3/4"></div>
                    <div className="bg-slate-700 h-3 rounded w-1/2"></div>
                  </div>
                </div>
              ) : spacexCompanyError ? (
                <ErrorCard title="SpaceX Info" error={spacexCompanyError.message} />
              ) : spacexCompany ? (
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <DataFreshnessIndicator 
                    isOld={checkDataFreshness([spacexCompany], 'founded')} 
                    message="SpaceX data may be from 2022 due to API limitations"
                  />
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-300">Founded:</span>
                      <span className="text-white">{spacexCompany.founded}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-300">Employees:</span>
                      <span className="text-white">{spacexCompany.employees?.toLocaleString() || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-300">Valuation:</span>
                      <span className="text-white">${spacexCompany.valuation?.toLocaleString() || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-300">Vehicles:</span>
                      <span className="text-white">{spacexCompany.vehicles || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-300">Launch Sites:</span>
                      <span className="text-white">{spacexCompany.launch_sites || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-300">Test Sites:</span>
                      <span className="text-white">{spacexCompany.test_sites || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              ) : null}
            </section>

            {/* Space Agencies */}
            <section>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                <div className="w-1 h-5 bg-indigo-500 rounded-full mr-2"></div>
                Global Space Agencies
              </h2>
              
              {spaceAgenciesLoading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                      <div className="animate-pulse">
                        <div className="bg-slate-700 h-3 rounded mb-2"></div>
                        <div className="bg-slate-700 h-2 rounded w-2/3"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : spaceAgenciesError ? (
                <ErrorCard title="Space Agencies" error={spaceAgenciesError.message} />
              ) : spaceAgencies?.results && spaceAgencies.results.length > 0 ? (
                <div className="space-y-3">
                  {spaceAgencies.results.slice(0, 8).map((agency: any) => (
                    <div key={agency.id} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700 hover:border-slate-600 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-semibold text-white">{agency.name}</h3>
                          <p className="text-xs text-slate-400">{agency.abbrev} • {agency.country_code}</p>
                        </div>
                        <span className="text-xs px-2 py-1 bg-indigo-900/30 text-indigo-300 rounded">
                          {agency.type}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-slate-400">
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