import React, { useState } from 'react';
import { 
  useUpcomingLaunches, 
  usePreviousLaunches 
} from '../services/launchesService';
import { RocketIcon, CalendarIcon, MapPinIcon, BuildingIcon, ExternalLinkIcon, PlayIcon } from 'lucide-react';

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

export default function Launches() {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'previous'>('upcoming');
  
  // API hooks
  const { data: upcomingLaunches, isLoading: upcomingLaunchesLoading, error: upcomingLaunchesError } = useUpcomingLaunches();
  const { data: previousLaunches, isLoading: previousLaunchesLoading, error: previousLaunchesError } = usePreviousLaunches();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isOld = (now.getTime() - date.getTime()) > (30 * 24 * 60 * 60 * 1000); // 30 days
    
    return {
      formatted: date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      }),
      isOld
    };
  };

  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string, isUpcoming: boolean = true) => {
    if (isUpcoming) {
      switch (status) {
        case 'Go': return 'bg-green-950/50 text-green-300 border border-green-800/50';
        case 'TBD': return 'bg-yellow-950/50 text-yellow-300 border border-yellow-800/50';
        case 'Hold': return 'bg-orange-950/50 text-orange-300 border border-orange-800/50';
        default: return 'bg-gray-800/50 text-gray-300 border border-gray-700/50';
      }
    } else {
      switch (status) {
        case 'Success': return 'bg-green-950/50 text-green-300 border border-green-800/50';
        case 'Failure': return 'bg-red-950/50 text-red-300 border border-red-800/50';
        case 'Partial Failure': return 'bg-yellow-950/50 text-yellow-300 border border-yellow-800/50';
        default: return 'bg-gray-800/50 text-gray-300 border border-gray-700/50';
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950/40 to-black relative overflow-hidden">
      {/* Dark purple background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-purple-900/10 via-violet-900/10 to-purple-800/10"></div>
        <div className="absolute top-20 left-20 w-64 h-64 bg-gradient-to-r from-purple-600/10 to-violet-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-r from-purple-700/10 to-pink-700/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-gradient-to-r from-violet-600/8 to-purple-600/8 rounded-full blur-2xl animate-bounce"></div>
        <div className="absolute inset-0 bg-black/20"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 bg-gray-950/80 backdrop-blur-sm border-b border-purple-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-700 flex items-center justify-center shadow-lg shadow-purple-500/25">
                <RocketIcon className="h-8 w-8 text-white transform -rotate-45" />
              </div>
            </div>
            <h1 className="text-5xl font-bold text-white mb-4">
              Global Space <span className="text-purple-400">Launches</span>
            </h1>
            <p className="text-gray-300 text-lg max-w-3xl mx-auto leading-relaxed">
              Comprehensive tracking of space missions from agencies worldwide including NASA, SpaceX, ESA, Roscosmos, JAXA, ISRO, and more
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="relative z-10 bg-gray-900/30 backdrop-blur-sm border-b border-purple-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`py-6 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-all duration-300 ${
                activeTab === 'upcoming'
                  ? 'border-purple-500 text-purple-400'
                  : 'border-transparent text-gray-300 hover:text-white hover:border-purple-400/50'
              }`}
            >
              <CalendarIcon className="h-4 w-4" />
              <span>Upcoming Launches</span>
              {upcomingLaunches?.count && (
                <span className="ml-2 bg-purple-950/50 text-purple-300 px-3 py-1 rounded-full text-xs border border-purple-800/50">
                  {upcomingLaunches.count}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('previous')}
              className={`py-6 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-all duration-300 ${
                activeTab === 'previous'
                  ? 'border-purple-500 text-purple-400'
                  : 'border-transparent text-gray-300 hover:text-white hover:border-purple-400/50'
              }`}
            >
              <RocketIcon className="h-4 w-4" />
              <span>Recent Launches</span>
              {previousLaunches?.count && (
                <span className="ml-2 bg-purple-950/50 text-purple-300 px-3 py-1 rounded-full text-xs border border-purple-800/50">
                  {previousLaunches.count}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'upcoming' && (
          <div>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl p-6 border border-purple-900/30 hover:border-purple-800/50 transition-all duration-300">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-purple-500 rounded-full mr-3 animate-pulse"></div>
                  <div>
                    <p className="text-gray-400 text-sm">Total Upcoming</p>
                    <p className="text-2xl font-bold text-white">{upcomingLaunches?.count || 0}</p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl p-6 border border-purple-900/30 hover:border-purple-800/50 transition-all duration-300">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-500 rounded-full mr-3 animate-pulse"></div>
                  <div>
                    <p className="text-gray-400 text-sm">Confirmed (Go)</p>
                    <p className="text-2xl font-bold text-white">
                      {upcomingLaunches?.results?.filter(l => l.status?.name === 'Go').length || 0}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl p-6 border border-purple-900/30 hover:border-purple-800/50 transition-all duration-300">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-yellow-500 rounded-full mr-3 animate-pulse"></div>
                  <div>
                    <p className="text-gray-400 text-sm">To Be Determined</p>
                    <p className="text-2xl font-bold text-white">
                      {upcomingLaunches?.results?.filter(l => l.status?.name === 'TBD').length || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Upcoming Launches */}
            {upcomingLaunchesLoading ? (
              <LoadingCard title="Loading upcoming launches..." />
            ) : upcomingLaunchesError ? (
              <ErrorCard title="Upcoming Launches" error={upcomingLaunchesError.message} />
            ) : upcomingLaunches?.results && upcomingLaunches.results.length > 0 ? (
              <div className="space-y-6">
                {upcomingLaunches.results.map((launch: any) => {
                  const dateInfo = formatDate(launch.net);
                  return (
                    <div key={launch.id} className="bg-gray-900/60 backdrop-blur-sm rounded-xl p-6 border border-purple-900/30 hover:border-purple-800/50 transition-all duration-300 group">
                      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Main Info */}
                        <div className="lg:col-span-2">
                          <div className="flex items-start justify-between mb-4">
                            <h3 className="text-xl font-bold text-white group-hover:text-purple-100 transition-colors duration-300">{launch.name}</h3>
                            <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(launch.status?.name, true)}`}>
                              {launch.status?.name || 'Unknown'}
                            </div>
                          </div>
                          {launch.mission && (
                            <div className="mb-4">
                              <h4 className="text-sm font-semibold text-gray-300 mb-2 flex items-center">
                                <RocketIcon className="h-4 w-4 text-purple-400 mr-2" />
                                Mission
                              </h4>
                              <p className="text-gray-400 text-sm leading-relaxed">{launch.mission.description}</p>
                            </div>
                          )}
                          {launch.rocket && (
                            <div className="mb-4">
                              <h4 className="text-sm font-semibold text-gray-300 mb-2 flex items-center">
                                <BuildingIcon className="h-4 w-4 text-purple-400 mr-2" />
                                Vehicle
                              </h4>
                              <p className="text-white">{launch.rocket.configuration?.name}</p>
                              {launch.rocket.configuration?.family && (
                                <p className="text-gray-400 text-sm">{launch.rocket.configuration.family} family</p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Launch Details */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center">
                            <CalendarIcon className="h-4 w-4 text-purple-400 mr-2" />
                            Launch Details
                          </h4>
                          <div className="space-y-3 text-sm">
                            <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/30">
                              <span className="text-gray-400 block text-xs">Date & Time:</span>
                              <p className="text-white font-medium">{formatDateShort(launch.net)}</p>
                              {dateInfo.isOld && (
                                <p className="text-yellow-400 text-xs mt-1">(Historical data)</p>
                              )}
                            </div>
                            {launch.launch_service_provider && (
                              <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/30">
                                <span className="text-gray-400 block text-xs">Provider:</span>
                                <p className="text-white font-medium">{launch.launch_service_provider.name}</p>
                              </div>
                            )}
                            {launch.pad && (
                              <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/30">
                                <span className="text-gray-400 block text-xs">Launch Site:</span>
                                <p className="text-white font-medium">{launch.pad.name}</p>
                                {launch.pad.location && (
                                  <p className="text-gray-400 text-xs mt-1 flex items-center">
                                    <MapPinIcon className="h-3 w-3 mr-1" />
                                    {launch.pad.location.name}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Mission Type & Links */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-300 mb-3">Mission Info</h4>
                          <div className="space-y-3 text-sm">
                            {launch.mission?.type && (
                              <div className="bg-purple-950/30 rounded-lg p-3 border border-purple-800/30">
                                <span className="text-gray-400 block text-xs">Type:</span>
                                <p className="text-purple-300 font-medium">{launch.mission.type}</p>
                              </div>
                            )}
                            {launch.webcast_live && (
                              <div className="bg-red-950/30 rounded-lg p-3 border border-red-800/30">
                                <span className="inline-flex items-center text-red-300 text-xs font-medium">
                                  <PlayIcon className="h-3 w-3 mr-1" />
                                  Live Stream Available
                                </span>
                              </div>
                            )}
                            {launch.url && (
                              <div className="pt-2">
                                <a 
                                  href={launch.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center text-purple-400 hover:text-purple-300 text-xs font-medium bg-purple-950/30 px-3 py-2 rounded-lg border border-purple-800/30 hover:border-purple-700/50 transition-all duration-300"
                                >
                                  <ExternalLinkIcon className="h-3 w-3 mr-1" />
                                  More Details
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 text-gray-400">
                <RocketIcon className="h-16 w-16 mx-auto mb-4 text-gray-600" />
                <div className="text-lg mb-2">No upcoming launches available</div>
                <div className="text-sm">Check back soon for new mission updates</div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'previous' && (
          <div>
            {/* Recent Launches Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl p-6 border border-purple-900/30 hover:border-purple-800/50 transition-all duration-300">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-500 rounded-full mr-3 animate-pulse"></div>
                  <div>
                    <p className="text-gray-400 text-sm">Successful</p>
                    <p className="text-2xl font-bold text-white">
                      {previousLaunches?.results?.filter(l => l.status?.name === 'Success').length || 0}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl p-6 border border-purple-900/30 hover:border-purple-800/50 transition-all duration-300">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-red-500 rounded-full mr-3 animate-pulse"></div>
                  <div>
                    <p className="text-gray-400 text-sm">Failed</p>
                    <p className="text-2xl font-bold text-white">
                      {previousLaunches?.results?.filter(l => l.status?.name === 'Failure').length || 0}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl p-6 border border-purple-900/30 hover:border-purple-800/50 transition-all duration-300">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-yellow-500 rounded-full mr-3 animate-pulse"></div>
                  <div>
                    <p className="text-gray-400 text-sm">Partial Success</p>
                    <p className="text-2xl font-bold text-white">
                      {previousLaunches?.results?.filter(l => l.status?.name === 'Partial Failure').length || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Previous Launches */}
            {previousLaunchesLoading ? (
              <LoadingCard title="Loading recent launches..." />
            ) : previousLaunchesError ? (
              <ErrorCard title="Recent Launches" error={previousLaunchesError.message} />
            ) : previousLaunches?.results && previousLaunches.results.length > 0 ? (
              <div className="space-y-6">
                {previousLaunches.results.map((launch: any) => {
                  const dateInfo = formatDate(launch.net);
                  return (
                    <div key={launch.id} className="bg-gray-900/60 backdrop-blur-sm rounded-xl p-6 border border-purple-900/30 hover:border-purple-800/50 transition-all duration-300 group">
                      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Main Info */}
                        <div className="lg:col-span-2">
                          <div className="flex items-start justify-between mb-4">
                            <h3 className="text-xl font-bold text-white group-hover:text-purple-100 transition-colors duration-300">{launch.name}</h3>
                            <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(launch.status?.name, false)}`}>
                              {launch.status?.name || 'Unknown'}
                            </div>
                          </div>
                          {launch.mission && (
                            <div className="mb-4">
                              <h4 className="text-sm font-semibold text-gray-300 mb-2 flex items-center">
                                <RocketIcon className="h-4 w-4 text-purple-400 mr-2" />
                                Mission
                              </h4>
                              <p className="text-gray-400 text-sm leading-relaxed">{launch.mission.description}</p>
                            </div>
                          )}
                          {launch.rocket && (
                            <div className="mb-4">
                              <h4 className="text-sm font-semibold text-gray-300 mb-2 flex items-center">
                                <BuildingIcon className="h-4 w-4 text-purple-400 mr-2" />
                                Vehicle
                              </h4>
                              <p className="text-white">{launch.rocket.configuration?.name}</p>
                              {launch.rocket.configuration?.family && (
                                <p className="text-gray-400 text-sm">{launch.rocket.configuration.family} family</p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Launch Details */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center">
                            <CalendarIcon className="h-4 w-4 text-purple-400 mr-2" />
                            Launch Details
                          </h4>
                          <div className="space-y-3 text-sm">
                            <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/30">
                              <span className="text-gray-400 block text-xs">Date & Time:</span>
                              <p className="text-white font-medium">{formatDateShort(launch.net)}</p>
                              {dateInfo.isOld && (
                                <p className="text-yellow-400 text-xs mt-1">(Historical data)</p>
                              )}
                            </div>
                            {launch.launch_service_provider && (
                              <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/30">
                                <span className="text-gray-400 block text-xs">Provider:</span>
                                <p className="text-white font-medium">{launch.launch_service_provider.name}</p>
                              </div>
                            )}
                            {launch.pad && (
                              <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/30">
                                <span className="text-gray-400 block text-xs">Launch Site:</span>
                                <p className="text-white font-medium">{launch.pad.name}</p>
                                {launch.pad.location && (
                                  <p className="text-gray-400 text-xs mt-1 flex items-center">
                                    <MapPinIcon className="h-3 w-3 mr-1" />
                                    {launch.pad.location.name}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Mission Type & Links */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-300 mb-3">Mission Info</h4>
                          <div className="space-y-3 text-sm">
                            {launch.mission?.type && (
                              <div className="bg-purple-950/30 rounded-lg p-3 border border-purple-800/30">
                                <span className="text-gray-400 block text-xs">Type:</span>
                                <p className="text-purple-300 font-medium">{launch.mission.type}</p>
                              </div>
                            )}
                            {launch.url && (
                              <div className="pt-2">
                                <a 
                                  href={launch.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center text-purple-400 hover:text-purple-300 text-xs font-medium bg-purple-950/30 px-3 py-2 rounded-lg border border-purple-800/30 hover:border-purple-700/50 transition-all duration-300"
                                >
                                  <ExternalLinkIcon className="h-3 w-3 mr-1" />
                                  More Details
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 text-gray-400">
                <RocketIcon className="h-16 w-16 mx-auto mb-4 text-gray-600" />
                <div className="text-lg mb-2">No recent launches available</div>
                <div className="text-sm">Check back soon for launch history</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 