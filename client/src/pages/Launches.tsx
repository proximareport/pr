import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RocketIcon, CalendarIcon, MapPinIcon, ClockIcon, ExternalLinkIcon, PlayIcon } from "lucide-react";

interface Launch {
  id: string;
  name: string;
  date: string;
  time: string;
  location: string;
  mission: string;
  rocket: string;
  status: "upcoming" | "recent" | "completed";
  description: string;
  image?: string;
  livestream?: string;
}

function Launches() {
  const [launches, setLaunches] = useState<Launch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading launches data
    setTimeout(() => {
      const mockLaunches: Launch[] = [
        {
          id: "1",
          name: "Starlink Group 6-45",
          date: "2024-01-15",
          time: "14:30 UTC",
          location: "Kennedy Space Center, Florida",
          mission: "Deploy 23 Starlink satellites to low Earth orbit",
          rocket: "Falcon 9",
          status: "upcoming",
          description: "SpaceX will launch another batch of Starlink satellites to expand global internet coverage.",
          livestream: "https://www.spacex.com/launches"
        },
        {
          id: "2",
          name: "Artemis II",
          date: "2024-11-20",
          time: "12:00 UTC",
          location: "Kennedy Space Center, Florida",
          mission: "Crewed lunar flyby mission",
          rocket: "SLS",
          status: "upcoming",
          description: "NASA's first crewed mission to the Moon since Apollo 17, carrying four astronauts on a lunar flyby.",
          livestream: "https://www.nasa.gov/nasatv"
        },
        {
          id: "3",
          name: "CST-100 Starliner Crew Flight Test",
          date: "2024-04-10",
          time: "10:15 UTC",
          location: "Cape Canaveral Space Force Station",
          mission: "Crewed test flight to ISS",
          rocket: "Atlas V",
          status: "upcoming",
          description: "Boeing's CST-100 Starliner will carry NASA astronauts to the International Space Station.",
          livestream: "https://www.nasa.gov/nasatv"
        },
        {
          id: "4",
          name: "Starlink Group 6-44",
          date: "2024-01-10",
          time: "16:45 UTC",
          location: "Vandenberg Space Force Base, California",
          mission: "Deploy 22 Starlink satellites",
          rocket: "Falcon 9",
          status: "completed",
          description: "Successfully deployed 22 Starlink satellites to low Earth orbit.",
          livestream: "https://www.spacex.com/launches"
        },
        {
          id: "5",
          name: "Vulcan Centaur Certification-1",
          date: "2024-01-08",
          time: "07:18 UTC",
          location: "Cape Canaveral Space Force Station",
          mission: "Certification flight with Peregrine lunar lander",
          rocket: "Vulcan Centaur",
          status: "completed",
          description: "United Launch Alliance's Vulcan Centaur rocket made its maiden flight carrying Astrobotic's Peregrine lunar lander.",
          livestream: "https://www.ulalaunch.com"
        }
      ];
      setLaunches(mockLaunches);
      setLoading(false);
    }, 1000);
  }, []);

  const upcomingLaunches = launches.filter(launch => launch.status === "upcoming");
  const recentLaunches = launches.filter(launch => launch.status === "completed");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "upcoming":
        return "bg-blue-500/20 text-blue-300 border-blue-500/30";
      case "completed":
        return "bg-green-500/20 text-green-300 border-green-500/30";
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/30";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
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

  return (
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
                          {launch.rocket} • {launch.mission}
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor(launch.status)}>
                        {launch.status === "upcoming" ? "Upcoming" : "Completed"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-300">
                        <CalendarIcon className="w-4 h-4 mr-2 text-purple-400" />
                        {formatDate(launch.date)} at {launch.time}
                      </div>
                      <div className="flex items-center text-sm text-gray-300">
                        <MapPinIcon className="w-4 h-4 mr-2 text-purple-400" />
                        {launch.location}
                      </div>
                    </div>
                    
                    <p className="text-gray-400 text-sm leading-relaxed">
                      {launch.description}
                    </p>

                    <div className="flex gap-2 pt-2">
                      {launch.livestream && (
                        <Button size="sm" className="flex-1 bg-purple-600 hover:bg-purple-700">
                          <PlayIcon className="w-4 h-4 mr-2" />
                          Watch Live
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
                          {launch.rocket} • {launch.mission}
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor(launch.status)}>
                        Completed
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-300">
                        <CalendarIcon className="w-4 h-4 mr-2 text-purple-400" />
                        {formatDate(launch.date)} at {launch.time}
                      </div>
                      <div className="flex items-center text-sm text-gray-300">
                        <MapPinIcon className="w-4 h-4 mr-2 text-purple-400" />
                        {launch.location}
                      </div>
                    </div>
                    
                    <p className="text-gray-400 text-sm leading-relaxed">
                      {launch.description}
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
  );
}

export default Launches; 