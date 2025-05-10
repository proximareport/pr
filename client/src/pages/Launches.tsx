import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  RocketIcon,
  CalendarIcon,
  MapPinIcon,
  ExternalLinkIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  TimerIcon,
  FilterIcon,
} from "lucide-react";
import LaunchCountdown from "@/components/article/LaunchCountdown";

interface Launch {
  id: string;
  name: string;
  date_utc: string;
  details: string;
  upcoming: boolean;
  success?: boolean;
  links: {
    patch: {
      small: string;
    };
    webcast: string;
    wikipedia: string;
    article: string;
  };
  rocket: {
    name: string;
  };
  launchpad: {
    name: string;
    locality: string;
    region: string;
  };
}

function Launches() {
  const [filterStatus, setFilterStatus] = useState("all");
  
  // Fetch upcoming launches
  const { data: upcomingLaunches, isLoading: isLoadingUpcoming } = useQuery<Launch[]>({
    queryKey: ['/api/spacex/upcoming'],
  });
  
  // Fetch past launches
  const { data: pastLaunches, isLoading: isLoadingPast } = useQuery<Launch[]>({
    queryKey: ['/api/spacex/launches'],
  });
  
  // Sort and filter past launches
  const filteredPastLaunches = pastLaunches 
    ? pastLaunches
        .filter(launch => !launch.upcoming)
        .filter(launch => {
          if (filterStatus === "all") return true;
          if (filterStatus === "success") return launch.success === true;
          if (filterStatus === "failed") return launch.success === false;
          return true;
        })
        .sort((a, b) => {
          // Sort by date descending (newest first)
          return new Date(b.date_utc).getTime() - new Date(a.date_utc).getTime();
        })
    : [];
  
  // Format date for display
  const formatLaunchDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };
  
  // Get time ago for past launches
  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(months / 12);
    
    if (years > 0) return `${years} year${years !== 1 ? 's' : ''} ago`;
    if (months > 0) return `${months} month${months !== 1 ? 's' : ''} ago`;
    if (days > 0) return `${days} day${days !== 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    return `${seconds} second${seconds !== 1 ? 's' : ''} ago`;
  };

  return (
    <div className="bg-[#0D0D17] min-h-screen">
      {/* Next Launch Countdown */}
      <LaunchCountdown />
      
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-space font-bold mb-8">Launch Schedule</h1>
        
        <Tabs defaultValue="upcoming" className="space-y-6">
          <TabsList className="bg-[#14141E]">
            <TabsTrigger value="upcoming">Upcoming Launches</TabsTrigger>
            <TabsTrigger value="past">Past Launches</TabsTrigger>
          </TabsList>
          
          {/* Upcoming Launches */}
          <TabsContent value="upcoming">
            {isLoadingUpcoming ? (
              <div className="text-center py-12">
                <div className="animate-spin h-10 w-10 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-white/70">Loading upcoming launches...</p>
              </div>
            ) : upcomingLaunches && upcomingLaunches.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {upcomingLaunches.map(launch => (
                  <Card key={launch.id} className="bg-[#14141E] border-white/10 hover:border-purple-500/30 transition-colors">
                    <CardHeader className="relative pb-2">
                      <div className="flex items-start gap-4">
                        {launch.links.patch.small ? (
                          <img 
                            src={launch.links.patch.small} 
                            alt={`${launch.name} mission patch`}
                            className="h-16 w-16 object-contain"
                          />
                        ) : (
                          <div className="h-16 w-16 rounded-full bg-purple-900/20 flex items-center justify-center">
                            <RocketIcon className="h-8 w-8 text-purple-500" />
                          </div>
                        )}
                        <div>
                          <CardTitle className="text-xl mb-1">{launch.name}</CardTitle>
                          <div className="flex items-center text-white/60 text-sm">
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            {formatLaunchDate(launch.date_utc)}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <p className="text-white/80 mb-4 line-clamp-3">
                        {launch.details || "No details available for this mission."}
                      </p>
                      <div className="grid grid-cols-1 gap-2">
                        <div className="flex items-center text-white/70 text-sm">
                          <RocketIcon className="h-4 w-4 mr-2" />
                          {launch.rocket?.name || "Unknown rocket"}
                        </div>
                        <div className="flex items-center text-white/70 text-sm">
                          <MapPinIcon className="h-4 w-4 mr-2" />
                          {launch.launchpad?.name || "Unknown location"}
                          {launch.launchpad?.locality && `, ${launch.launchpad.locality}`}
                        </div>
                      </div>
                      <div className="mt-4 flex items-center space-x-2">
                        {launch.links.webcast && (
                          <a 
                            href={launch.links.webcast} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-purple-400 hover:text-purple-300 flex items-center"
                          >
                            <ExternalLinkIcon className="h-3 w-3 mr-1" /> Webcast
                          </a>
                        )}
                        {launch.links.wikipedia && (
                          <>
                            <span className="text-white/30">|</span>
                            <a 
                              href={launch.links.wikipedia} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-purple-400 hover:text-purple-300 flex items-center"
                            >
                              <ExternalLinkIcon className="h-3 w-3 mr-1" /> Wiki
                            </a>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-[#14141E] rounded-lg border border-white/10">
                <RocketIcon className="h-12 w-12 mx-auto mb-4 text-white/30" />
                <p className="text-white/70">No upcoming launches at the moment</p>
              </div>
            )}
          </TabsContent>
          
          {/* Past Launches */}
          <TabsContent value="past">
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-xl font-space font-medium">Launch History</h2>
              <div className="flex items-center">
                <FilterIcon className="h-4 w-4 mr-2 text-white/60" />
                <select 
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-[#1E1E2D] border border-white/10 rounded p-1.5 text-sm"
                >
                  <option value="all">All Launches</option>
                  <option value="success">Successful Only</option>
                  <option value="failed">Failed Only</option>
                </select>
              </div>
            </div>
            
            {isLoadingPast ? (
              <div className="text-center py-12">
                <div className="animate-spin h-10 w-10 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-white/70">Loading launch history...</p>
              </div>
            ) : filteredPastLaunches.length > 0 ? (
              <div className="rounded-lg border border-white/10 overflow-hidden">
                <Table>
                  <TableHeader className="bg-[#14141E]">
                    <TableRow>
                      <TableHead>Mission</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden md:table-cell">Rocket</TableHead>
                      <TableHead className="hidden lg:table-cell">Launch Site</TableHead>
                      <TableHead className="text-right">Links</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPastLaunches.slice(0, 15).map(launch => (
                      <TableRow key={launch.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            {launch.links.patch.small ? (
                              <img 
                                src={launch.links.patch.small} 
                                alt={`${launch.name} mission patch`}
                                className="h-8 w-8 object-contain"
                              />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-purple-900/20 flex items-center justify-center">
                                <RocketIcon className="h-4 w-4 text-purple-500" />
                              </div>
                            )}
                            <span>{launch.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div>{new Date(launch.date_utc).toLocaleDateString()}</div>
                            <div className="text-xs text-white/60">{getTimeAgo(launch.date_utc)}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {launch.success === true && (
                            <div className="flex items-center text-green-500">
                              <CheckCircleIcon className="h-4 w-4 mr-1" /> Success
                            </div>
                          )}
                          {launch.success === false && (
                            <div className="flex items-center text-red-500">
                              <AlertCircleIcon className="h-4 w-4 mr-1" /> Failed
                            </div>
                          )}
                          {launch.success === undefined && (
                            <div className="flex items-center text-yellow-500">
                              <TimerIcon className="h-4 w-4 mr-1" /> Unknown
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {launch.rocket?.name || "N/A"}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {launch.launchpad?.name || "N/A"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            {launch.links.webcast && (
                              <a 
                                href={launch.links.webcast} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-purple-400 hover:text-purple-300"
                                title="Watch webcast"
                              >
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M21.543 6.498C22 8.28 22 12 22 12s0 3.72-.457 5.502c-.254.985-.997 1.76-1.938 2.022C17.896 20 12 20 12 20s-5.893 0-7.605-.476c-.945-.266-1.687-1.04-1.938-2.022C2 15.72 2 12 2 12s0-3.72.457-5.502c.254-.985.997-1.76 1.938-2.022C6.107 4 12 4 12 4s5.896 0 7.605.476c.945.266 1.687 1.04 1.938 2.022zM10 15.5l6-3.5-6-3.5v7z" />
                                </svg>
                              </a>
                            )}
                            {launch.links.article && (
                              <a 
                                href={launch.links.article} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-purple-400 hover:text-purple-300"
                                title="Read article"
                              >
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" />
                                  <path d="M14 17H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                                </svg>
                              </a>
                            )}
                            {launch.links.wikipedia && (
                              <a 
                                href={launch.links.wikipedia} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-purple-400 hover:text-purple-300"
                                title="Wikipedia"
                              >
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M12.09 13.119c-.936 1.932-2.217 4.548-2.853 5.728-.616 1.074-1.127.931-1.532.029-1.406-3.321-4.293-9.144-5.651-12.409-.251-.601-.441-.987-.619-1.139-.181-.15-.554-.24-1.122-.271C.103 5.033 0 4.982 0 4.898v-.455l.052-.045c.924-.005 5.401 0 5.401 0l.051.045v.434c0 .084-.103.135-.208.157-.966.135-1.103.223-1.103.511 0 .271.208.623.464 1.227.258.603 3.101 7.218 3.101 7.218l4.353-9.855.191-.155h1.51l.123.096c-.206 2.223-.498 5.607-.498 5.607l-.353.096s-.429.135-.528.135-.799-1.922-1.103-2.748c-.251-.622-.459-1.128-.564-1.304-.289-.511-.448-.622-.997-.73-.103-.023-.204-.096-.204-.181v-.434l.051-.045h4.611l.051.045v.434c0 .084-.102.135-.207.157-.904.146-1.05.25-1.05.522 0 .35.858 2.132 2.621 6.1.958 2.135 1.85 3.699 2.359 4.745l.437-.937s3.954-8.252 5.501-11.55c.193-.394.257-.665.257-.861 0-.2-.039-.382-.742-.572-.206-.056-.308-.093-.308-.176v-.455l.052-.045h5.401l.051.045v.434c0 .084-.104.157-.207.18-.966.12-1.493.421-1.995 1.352-.929 1.716-5.401 11.36-7.235 15.486-.586 1.328-.927 1.094-1.548.072l-4.677-9.883z"/>
                                </svg>
                              </a>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12 bg-[#14141E] rounded-lg border border-white/10">
                <RocketIcon className="h-12 w-12 mx-auto mb-4 text-white/30" />
                <p className="text-white/70">No launch data available</p>
              </div>
            )}
            
            {filteredPastLaunches.length > 15 && (
              <div className="text-center mt-6">
                <Button variant="outline">
                  Load More Launches
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default Launches;
