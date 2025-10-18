import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RocketIcon, CalendarIcon, MapPinIcon, ClockIcon, ExternalLinkIcon, PlayIcon } from "lucide-react";
import { useUpcomingLaunches, usePreviousLaunches } from "@/services/launchesService";

interface Launch {
  id: string;
  name: string;
  net: string;
  status: {
    name: string;
    description?: string;
  };
  launch_service_provider: {
    name: string;
  };
  rocket: {
    configuration: {
      name: string;
    };
  };
  mission: {
    name: string;
    description?: string;
  };
  pad: {
    name: string;
    location: {
      name: string;
      country: string;
    };
  };
  image?: string;
  webcast_live?: boolean;
  webcast_url?: string;
}

function Launches() {
  const { data: upcomingData, isLoading: upcomingLoading, error: upcomingError } = useUpcomingLaunches();
  const { data: previousData, isLoading: previousLoading, error: previousError } = usePreviousLaunches();

  const upcomingLaunches = upcomingData?.results || [];
  const recentLaunches = previousData?.results || [];

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "go":
      case "tbd":
      case "tbc":
        return "bg-blue-500/20 text-blue-300 border-blue-500/30";
      case "success":
      case "completed":
        return "bg-green-500/20 text-green-300 border-green-500/30";
      case "failure":
      case "failed":
        return "bg-red-500/20 text-red-300 border-red-500/30";
      case "partial failure":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/30";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  if (upcomingLoading || previousLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0A0F] via-[#14141E] to-[#1A1A2E]">
        <div className="container mx-auto px-4 py-16">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (upcomingError || previousError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0A0F] via-[#14141E] to-[#1A1A2E]">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-400 mb-4">Error Loading Launches</h1>
            <p className="text-gray-400">Unable to fetch launch data. Please try again later.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-[#0A0A0F] via-[#14141E] to-[#1A1A2E]">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4 bg-purple-500/20 text-purple-300 border-purple-500/30">
            <RocketIcon className="w-3 h-3 mr-1" />
            Live Updates
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-6">
            Space Launches
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Track upcoming launches, watch live streams, and stay updated with the latest missions to space.
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="upcoming" className="max-w-6xl mx-auto">
          <TabsList className="grid w-full grid-cols-2 bg-gray-900/50 border border-gray-800/50">
            <TabsTrigger value="upcoming" className="data-[state=active]:bg-purple-600">
              <CalendarIcon className="w-4 h-4 mr-2" />
              Upcoming ({upcomingLaunches.length})
            </TabsTrigger>
            <TabsTrigger value="recent" className="data-[state=active]:bg-purple-600">
              <ClockIcon className="w-4 h-4 mr-2" />
              Recent ({recentLaunches.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-8">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {upcomingLaunches.map((launch) => (
                <Card key={launch.id} className="bg-gray-900/50 border border-gray-800/50 hover:border-purple-500/30 transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-white text-lg">{launch.name}</CardTitle>
                        <CardDescription className="text-gray-400 mt-2">
                          {launch.rocket?.configuration?.name || 'Unknown Rocket'} • {launch.mission?.name || 'Unknown Mission'}
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor(launch.status?.name || 'unknown')}>
                        {launch.status?.name || 'Unknown'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-300">
                        <CalendarIcon className="w-4 h-4 mr-2 text-purple-400" />
                        {formatDate(launch.net)} at {formatTime(launch.net)}
                      </div>
                      <div className="flex items-center text-sm text-gray-300">
                        <MapPinIcon className="w-4 h-4 mr-2 text-purple-400" />
                        {launch.pad?.location?.name || 'Unknown Location'}, {launch.pad?.location?.country || 'Unknown Country'}
                      </div>
                    </div>
                    
                    <p className="text-gray-400 text-sm leading-relaxed">
                      {launch.mission?.description || 'No description available'}
                    </p>

                    <div className="flex gap-2 pt-2">
                      {launch.webcast_live && launch.webcast_url && (
                        <Button size="sm" className="flex-1 bg-purple-600 hover:bg-purple-700" asChild>
                          <a href={launch.webcast_url} target="_blank" rel="noopener noreferrer">
                            <PlayIcon className="w-4 h-4 mr-2" />
                            Watch Live
                          </a>
                        </Button>
                      )}
                      <Button size="sm" variant="outline" className="border-gray-700 text-gray-300 hover:border-purple-500 hover:text-purple-400">
                        <ExternalLinkIcon className="w-4 h-4 mr-2" />
                        Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="recent" className="mt-8">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {recentLaunches.map((launch) => (
                <Card key={launch.id} className="bg-gray-900/50 border border-gray-800/50 hover:border-purple-500/30 transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-white text-lg">{launch.name}</CardTitle>
                        <CardDescription className="text-gray-400 mt-2">
                          {launch.rocket?.configuration?.name || 'Unknown Rocket'} • {launch.mission?.name || 'Unknown Mission'}
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor(launch.status?.name || 'unknown')}>
                        {launch.status?.name || 'Unknown'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-300">
                        <CalendarIcon className="w-4 h-4 mr-2 text-purple-400" />
                        {formatDate(launch.net)} at {formatTime(launch.net)}
                      </div>
                      <div className="flex items-center text-sm text-gray-300">
                        <MapPinIcon className="w-4 h-4 mr-2 text-purple-400" />
                        {launch.pad?.location?.name || 'Unknown Location'}, {launch.pad?.location?.country || 'Unknown Country'}
                      </div>
                    </div>
                    
                    <p className="text-gray-400 text-sm leading-relaxed">
                      {launch.mission?.description || 'No description available'}
                    </p>

                    <div className="flex gap-2 pt-2">
                      <Button size="sm" variant="outline" className="border-gray-700 text-gray-300 hover:border-purple-500 hover:text-purple-400">
                        <ExternalLinkIcon className="w-4 h-4 mr-2" />
                        Mission Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Additional Info */}
        <div className="mt-16 text-center">
          <Card className="bg-gray-900/30 border border-gray-800/50 max-w-2xl mx-auto">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Stay Updated</h3>
              <p className="text-gray-400 mb-4">
                Get real-time launch notifications and updates delivered to your inbox.
              </p>
              <Button className="bg-purple-600 hover:bg-purple-700">
                Subscribe to Launch Alerts
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </>
  );
}

export default Launches; 