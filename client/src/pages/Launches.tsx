import React, { useState } from 'react';
import { 
  useUpcomingLaunches, 
  usePreviousLaunches 
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
        case 'Go': return 'bg-green-900/50 text-green-300 border border-green-700';
        case 'TBD': return 'bg-yellow-900/50 text-yellow-300 border border-yellow-700';
        case 'Hold': return 'bg-orange-900/50 text-orange-300 border border-orange-700';
        default: return 'bg-slate-700 text-slate-300 border border-slate-600';
      }
    } else {
      switch (status) {
        case 'Success': return 'bg-green-900/50 text-green-300 border border-green-700';
        case 'Failure': return 'bg-red-900/50 text-red-300 border border-red-700';
        case 'Partial Failure': return 'bg-yellow-900/50 text-yellow-300 border border-yellow-700';
        default: return 'bg-slate-700 text-slate-300 border border-slate-600';
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-4">Global Space Launches</h1>
            <p className="text-slate-300 text-lg max-w-3xl mx-auto">
              Comprehensive tracking of space missions from agencies worldwide including NASA, SpaceX, ESA, Roscosmos, JAXA, ISRO, and more
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-slate-800/50 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'upcoming'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-300 hover:text-white hover:border-slate-300'
              }`}
            >
              Upcoming Launches
              {upcomingLaunches?.count && (
                <span className="ml-2 bg-blue-900/50 text-blue-300 px-2 py-1 rounded-full text-xs">
                  {upcomingLaunches.count}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('previous')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'previous'
                  ? 'border-green-500 text-green-400'
                  : 'border-transparent text-slate-300 hover:text-white hover:border-slate-300'
              }`}
            >
              Recent Launches
              {previousLaunches?.count && (
                <span className="ml-2 bg-green-900/50 text-green-300 px-2 py-1 rounded-full text-xs">
                  {previousLaunches.count}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'upcoming' && (
          <div>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                  <div>
                    <p className="text-slate-300 text-sm">Total Upcoming</p>
                    <p className="text-2xl font-bold text-white">{upcomingLaunches?.count || 0}</p>
                  </div>
                </div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <div>
                    <p className="text-slate-300 text-sm">Confirmed (Go)</p>
                    <p className="text-2xl font-bold text-white">
                      {upcomingLaunches?.results?.filter(l => l.status?.name === 'Go').length || 0}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                  <div>
                    <p className="text-slate-300 text-sm">To Be Determined</p>
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
                    <div key={launch.id} className="bg-slate-800/50 rounded-lg p-6 border border-slate-700 hover:border-slate-600 transition-colors">
                      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Main Info */}
                        <div className="lg:col-span-2">
                          <div className="flex items-start justify-between mb-4">
                            <h3 className="text-xl font-bold text-white">{launch.name}</h3>
                            <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(launch.status?.name, true)}`}>
                              {launch.status?.name || 'Unknown'}
                            </div>
                          </div>
                          {launch.mission && (
                            <div className="mb-4">
                              <h4 className="text-sm font-semibold text-slate-300 mb-2">Mission</h4>
                              <p className="text-slate-400 text-sm leading-relaxed">{launch.mission.description}</p>
                            </div>
                          )}
                          {launch.rocket && (
                            <div className="mb-4">
                              <h4 className="text-sm font-semibold text-slate-300 mb-2">Vehicle</h4>
                              <p className="text-white">{launch.rocket.configuration?.name}</p>
                              {launch.rocket.configuration?.family && (
                                <p className="text-slate-400 text-sm">{launch.rocket.configuration.family} family</p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Launch Details */}
                        <div>
                          <h4 className="text-sm font-semibold text-slate-300 mb-3">Launch Details</h4>
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="text-slate-400">Date & Time:</span>
                              <p className="text-white">{formatDateShort(launch.net)}</p>
                              {dateInfo.isOld && (
                                <p className="text-yellow-400 text-xs">(Historical data)</p>
                              )}
                            </div>
                            {launch.launch_service_provider && (
                              <div>
                                <span className="text-slate-400">Provider:</span>
                                <p className="text-white">{launch.launch_service_provider.name}</p>
                              </div>
                            )}
                            {launch.pad && (
                              <div>
                                <span className="text-slate-400">Launch Site:</span>
                                <p className="text-white">{launch.pad.name}</p>
                                {launch.pad.location && (
                                  <p className="text-slate-400 text-xs">{launch.pad.location.name}</p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Mission Type & Links */}
                        <div>
                          <h4 className="text-sm font-semibold text-slate-300 mb-3">Mission Info</h4>
                          <div className="space-y-2 text-sm">
                            {launch.mission?.type && (
                              <div>
                                <span className="text-slate-400">Type:</span>
                                <p className="text-white">{launch.mission.type}</p>
                              </div>
                            )}
                            {launch.webcast_live && (
                              <div className="pt-2">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-900/30 text-red-300 border border-red-700">
                                  🔴 Live Stream Available
                                </span>
                              </div>
                            )}
                            {launch.url && (
                              <div className="pt-2">
                                <a 
                                  href={launch.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-400 hover:text-blue-300 text-xs underline"
                                >
                                  More Details →
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
              <div className="text-center py-12 text-slate-400">
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
              <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <div>
                    <p className="text-slate-300 text-sm">Successful</p>
                    <p className="text-2xl font-bold text-white">
                      {previousLaunches?.results?.filter(l => l.status?.name === 'Success').length || 0}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                  <div>
                    <p className="text-slate-300 text-sm">Failed</p>
                    <p className="text-2xl font-bold text-white">
                      {previousLaunches?.results?.filter(l => l.status?.name === 'Failure').length || 0}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                  <div>
                    <p className="text-slate-300 text-sm">Partial Success</p>
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
                    <div key={launch.id} className="bg-slate-800/50 rounded-lg p-6 border border-slate-700 hover:border-slate-600 transition-colors">
                      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Main Info */}
                        <div className="lg:col-span-2">
                          <div className="flex items-start justify-between mb-4">
                            <h3 className="text-xl font-bold text-white">{launch.name}</h3>
                            <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(launch.status?.name, false)}`}>
                              {launch.status?.name || 'Unknown'}
                            </div>
                          </div>
                          {launch.mission && (
                            <div className="mb-4">
                              <h4 className="text-sm font-semibold text-slate-300 mb-2">Mission</h4>
                              <p className="text-slate-400 text-sm leading-relaxed">{launch.mission.description}</p>
                            </div>
                          )}
                          {launch.rocket && (
                            <div className="mb-4">
                              <h4 className="text-sm font-semibold text-slate-300 mb-2">Vehicle</h4>
                              <p className="text-white">{launch.rocket.configuration?.name}</p>
                              {launch.rocket.configuration?.family && (
                                <p className="text-slate-400 text-sm">{launch.rocket.configuration.family} family</p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Launch Details */}
                        <div>
                          <h4 className="text-sm font-semibold text-slate-300 mb-3">Launch Details</h4>
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="text-slate-400">Date & Time:</span>
                              <p className="text-white">{formatDateShort(launch.net)}</p>
                              {dateInfo.isOld && (
                                <p className="text-yellow-400 text-xs">(Historical data)</p>
                              )}
                            </div>
                            {launch.launch_service_provider && (
                              <div>
                                <span className="text-slate-400">Provider:</span>
                                <p className="text-white">{launch.launch_service_provider.name}</p>
                              </div>
                            )}
                            {launch.pad && (
                              <div>
                                <span className="text-slate-400">Launch Site:</span>
                                <p className="text-white">{launch.pad.name}</p>
                                {launch.pad.location && (
                                  <p className="text-slate-400 text-xs">{launch.pad.location.name}</p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Mission Type & Links */}
                        <div>
                          <h4 className="text-sm font-semibold text-slate-300 mb-3">Mission Info</h4>
                          <div className="space-y-2 text-sm">
                            {launch.mission?.type && (
                              <div>
                                <span className="text-slate-400">Type:</span>
                                <p className="text-white">{launch.mission.type}</p>
                              </div>
                            )}
                            {launch.url && (
                              <div className="pt-2">
                                <a 
                                  href={launch.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-400 hover:text-blue-300 text-xs underline"
                                >
                                  More Details →
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
              <div className="text-center py-12 text-slate-400">
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