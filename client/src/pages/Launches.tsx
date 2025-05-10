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
  CardFooter,
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
  GlobeIcon,
  InfoIcon,
  Rocket,
  ArrowUpRight,
  BuildingIcon,
  BookmarkIcon,
} from "lucide-react";
import LaunchCountdown from "@/components/article/LaunchCountdown";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";

// SpaceX Launch Interface
interface SpaceXLaunch {
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
    id?: string;
    name: string;
  };
  launchpad: {
    id?: string;
    name: string;
    locality: string;
    region: string;
  };
}

// The Space Devs Launch Interface
interface TSDLaunch {
  id: string;
  name: string;
  status: {
    name: string;
    abbrev: string;
    description: string;
  };
  net: string; // Launch date
  window_start: string;
  window_end: string;
  mission?: {
    name: string;
    description: string;
    type: string;
  };
  rocket: {
    configuration: {
      name: string;
      family: string;
      full_name: string;
      manufacturer: {
        name: string;
      };
    };
  };
  pad: {
    name: string;
    location: {
      name: string;
      country_code: string;
    };
  };
  image: string;
  webcast_live: boolean;
  vidURLs: {
    url: string;
    priority: number;
  }[];
  infoURLs: {
    url: string;
    priority: number;
  }[];
}

// Agency Interface
interface Agency {
  id: string;
  name: string;
  type: string;
  logo_url?: string;
  country_code: string;
  featured: boolean;
}

// Combined launch data interface to handle both APIs
interface CombinedLaunch {
  id: string;
  source: 'spacex' | 'thespacedevs';
  name: string;
  date: string;
  details?: string;
  upcoming: boolean;
  success?: boolean;
  agency?: string;
  rocket: {
    name: string;
    manufacturer?: string;
  };
  location: {
    name: string;
    locality?: string;
    country?: string;
  };
  mission?: {
    name?: string;
    type?: string;
  };
  image?: string;
  links: {
    webcast?: string;
    wiki?: string;
    article?: string;
    info?: string;
  };
}

function Launches() {
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterAgency, setFilterAgency] = useState("all");
  const [activeTab, setActiveTab] = useState("upcoming");
  const [combinedUpcomingLaunches, setCombinedUpcomingLaunches] = useState<CombinedLaunch[]>([]);
  
  // Fetch SpaceX upcoming launches
  const { data: spacexUpcomingLaunches, isLoading: isLoadingSpaceX } = useQuery<SpaceXLaunch[]>({
    queryKey: ['/api/spacex/upcoming'],
  });
  
  // Fetch The Space Devs upcoming launches
  const { data: tsdUpcomingData, isLoading: isLoadingTSD } = useQuery({
    queryKey: ['/api/launches/upcoming'],
  });
  
  // Fetch past launches from SpaceX
  const { data: pastLaunches, isLoading: isLoadingPast } = useQuery<SpaceXLaunch[]>({
    queryKey: ['/api/spacex/launches'],
  });
  
  // Get a list of unique agencies from all launches
  const agencies = [
    { id: 'spacex', name: 'SpaceX' },
    { id: 'nasa', name: 'NASA' },
    { id: 'esa', name: 'European Space Agency' },
    { id: 'roscosmos', name: 'Roscosmos' },
    { id: 'rocket-lab', name: 'Rocket Lab' },
    { id: 'ula', name: 'United Launch Alliance' },
    { id: 'blue-origin', name: 'Blue Origin' },
    { id: 'arianespace', name: 'Arianespace' },
    { id: 'isro', name: 'Indian Space Research Organisation' },
    { id: 'jaxa', name: 'JAXA' },
  ];
  
  // Combine launch data from multiple sources
  useEffect(() => {
    const combined: CombinedLaunch[] = [];
    
    // Add SpaceX data
    if (spacexUpcomingLaunches) {
      spacexUpcomingLaunches.forEach(launch => {
        combined.push({
          id: launch.id,
          source: 'spacex',
          name: launch.name,
          date: launch.date_utc,
          details: launch.details,
          upcoming: true,
          agency: 'SpaceX',
          rocket: {
            name: launch.rocket?.name || 'Unknown Rocket',
          },
          location: {
            name: launch.launchpad?.name || 'Unknown Location',
            locality: launch.launchpad?.locality,
            country: launch.launchpad?.region,
          },
          image: launch.links.patch.small,
          links: {
            webcast: launch.links.webcast,
            wiki: launch.links.wikipedia,
            article: launch.links.article,
          }
        });
      });
    }
    
    // Add The Space Devs data, filtering out SpaceX launches to avoid duplicates
    if (tsdUpcomingData && tsdUpcomingData.results) {
      tsdUpcomingData.results.forEach((launch: TSDLaunch) => {
        // Skip if it's a SpaceX launch (to avoid duplicates)
        if (launch.rocket.configuration.manufacturer?.name === "SpaceX") {
          return;
        }
        
        combined.push({
          id: launch.id,
          source: 'thespacedevs',
          name: launch.name,
          date: launch.net,
          details: launch.mission?.description,
          upcoming: true,
          agency: launch.rocket.configuration.manufacturer?.name,
          rocket: {
            name: launch.rocket.configuration.full_name || launch.rocket.configuration.name,
            manufacturer: launch.rocket.configuration.manufacturer?.name,
          },
          location: {
            name: launch.pad.name,
            locality: launch.pad.location.name,
            country: launch.pad.location.country_code,
          },
          mission: {
            name: launch.mission?.name,
            type: launch.mission?.type,
          },
          image: launch.image,
          links: {
            webcast: launch.vidURLs?.length > 0 ? launch.vidURLs[0].url : undefined,
            info: launch.infoURLs?.length > 0 ? launch.infoURLs[0].url : undefined,
          }
        });
      });
    }
    
    // Sort by date (closest first)
    combined.sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
    
    setCombinedUpcomingLaunches(combined);
  }, [spacexUpcomingLaunches, tsdUpcomingData]);
  
  // Filter combined upcoming launches by agency
  const filteredUpcomingLaunches = combinedUpcomingLaunches.filter(launch => {
    if (filterAgency === "all") return true;
    
    // Check if agency name contains filter string (case insensitive)
    return launch.agency?.toLowerCase().includes(filterAgency.toLowerCase());
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
  
  // Calculate time to launch
  const getTimeToLaunch = (dateString: string) => {
    const launchDate = new Date(dateString);
    const now = new Date();
    
    if (launchDate <= now) {
      return "Launched";
    }
    
    const difference = launchDate.getTime() - now.getTime();
    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    
    if (days > 0) {
      return `T-${days} day${days !== 1 ? 's' : ''}`;
    }
    
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (hours > 0) {
      return `T-${hours} hour${hours !== 1 ? 's' : ''}`;
    }
    
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    return `T-${minutes} minute${minutes !== 1 ? 's' : ''}`;
  };

  return (
    <div className="bg-[#0D0D17] min-h-screen">
      {/* Next Launch Countdown */}
      <LaunchCountdown />
      
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-space font-bold mb-8">Launch Schedule</h1>
        
        <Tabs defaultValue="upcoming" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-[#14141E]">
            <TabsTrigger value="upcoming">Upcoming Launches</TabsTrigger>
            <TabsTrigger value="past">Past Launches</TabsTrigger>
          </TabsList>
          
          {/* Upcoming Launches */}
          <TabsContent value="upcoming">
            <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h2 className="text-xl font-space font-medium">Global Launch Schedule</h2>
              <div className="flex items-center space-x-2">
                <select 
                  value={filterAgency}
                  onChange={(e) => setFilterAgency(e.target.value)}
                  className="bg-[#1E1E2D] border border-white/10 rounded p-1.5 text-sm"
                  aria-label="Filter by agency"
                >
                  <option value="all">All Agencies</option>
                  {agencies.map(agency => (
                    <option key={agency.id} value={agency.id}>{agency.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {isLoadingSpaceX && isLoadingTSD ? (
              <div className="text-center py-12">
                <div className="animate-spin h-10 w-10 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-white/70">Loading upcoming launches from multiple agencies...</p>
              </div>
            ) : filteredUpcomingLaunches.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredUpcomingLaunches.map(launch => (
                  <Card key={launch.id} className="bg-[#14141E] border-white/10 hover:border-purple-500/30 transition-colors flex flex-col">
                    <CardHeader className="relative pb-2 flex-shrink-0">
                      <div className="absolute top-3 right-3">
                        <Badge variant="outline" className="bg-purple-900/20 text-purple-300 border-purple-500/20">
                          {getTimeToLaunch(launch.date)}
                        </Badge>
                      </div>
                      <div className="flex items-start gap-4">
                        {launch.image ? (
                          <img 
                            src={launch.image} 
                            alt={`${launch.name} mission patch`}
                            className="h-16 w-16 object-contain rounded-md"
                          />
                        ) : (
                          <div className="h-16 w-16 rounded-md bg-purple-900/20 flex items-center justify-center">
                            <RocketIcon className="h-8 w-8 text-purple-500" />
                          </div>
                        )}
                        <div>
                          <CardTitle className="text-xl mb-1">{launch.name}</CardTitle>
                          <div className="flex items-center text-white/60 text-sm">
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            {formatLaunchDate(launch.date)}
                          </div>
                          {launch.agency && (
                            <div className="flex items-center mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {launch.agency}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-2 flex-grow">
                      <p className="text-white/80 mb-4 line-clamp-3">
                        {launch.details || launch.mission?.name || "No details available for this mission."}
                      </p>
                      <div className="grid grid-cols-1 gap-2">
                        <div className="flex items-center text-white/70 text-sm">
                          <RocketIcon className="h-4 w-4 mr-2" />
                          {launch.rocket?.name || "Unknown rocket"}
                        </div>
                        <div className="flex items-center text-white/70 text-sm">
                          <MapPinIcon className="h-4 w-4 mr-2" />
                          {launch.location?.name || "Unknown location"}
                          {launch.location?.locality && `, ${launch.location.locality}`}
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0 pb-4 flex-shrink-0">
                      <div className="flex flex-wrap gap-2">
                        {launch.links.webcast && (
                          <a 
                            href={launch.links.webcast} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 text-xs bg-[#1E1E2D] text-purple-400 hover:text-purple-300 rounded-full flex items-center"
                          >
                            <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path d="M21.543 6.498C22 8.28 22 12 22 12s0 3.72-.457 5.502c-.254.985-.997 1.76-1.938 2.022C17.896 20 12 20 12 20s-5.893 0-7.605-.476c-.945-.266-1.687-1.04-1.938-2.022C2 15.72 2 12 2 12s0-3.72.457-5.502c.254-.985.997-1.76 1.938-2.022C6.107 4 12 4 12 4s5.896 0 7.605.476c.945.266 1.687 1.04 1.938 2.022zM10 15.5l6-3.5-6-3.5v7z" />
                            </svg>
                            Watch
                          </a>
                        )}
                        {launch.links.wiki && (
                          <a 
                            href={launch.links.wiki} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 text-xs bg-[#1E1E2D] text-purple-400 hover:text-purple-300 rounded-full flex items-center"
                          >
                            <InfoIcon className="h-3 w-3 mr-1" /> Wiki
                          </a>
                        )}
                        {launch.links.article && (
                          <a 
                            href={launch.links.article} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 text-xs bg-[#1E1E2D] text-purple-400 hover:text-purple-300 rounded-full flex items-center"
                          >
                            <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" />
                              <path d="M14 17H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                            </svg>
                            Article
                          </a>
                        )}
                        {launch.links.info && (
                          <a 
                            href={launch.links.info} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 text-xs bg-[#1E1E2D] text-purple-400 hover:text-purple-300 rounded-full flex items-center"
                          >
                            <ExternalLinkIcon className="h-3 w-3 mr-1" /> More Info
                          </a>
                        )}
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-[#14141E] rounded-lg border border-white/10">
                <RocketIcon className="h-12 w-12 mx-auto mb-4 text-white/30" />
                <p className="text-white/70">No upcoming launches matching your filters</p>
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
                                  <path d="M12.09 13.119c-.936 1.932-2.217 4.548-2.853 5.728-.616 1.074-1.127.931-1.532.029-1.406-3.321-4.293-9.144-5.651-12.409-.251-.601-.441-.987-.619-1.139-.181-.15-.554-.24-1.122-.271C.103 5.033 0 4.982 0 4.898v-.455l.052-.045c.924-.005 5.401 0 5.401 0l.051.045v.434c0 .084-.103.135-.208.157-.966.135-1.103.223-1.103.511 0 .271.208.623.464 1.227.258.603 3.101 7.218 3.101 7.218l4.353-9.855.191-.155h1.51l.123.096c-.206 2.223-.498 5.607-.498 5.607l-.353.096s-.429.135-.528.135-.799-1.922-1.103-2.748c-.251-.622-.459-1.128-.564-1.304-.289-.511-.44-.714-1.251-.82-.126-.018-.185-.063-.185-.151v-.437l.06-.045h4.083l.075.045v.436c0 .085-.041.141-.101.162-.58.009-.131.029-.184.061v.435c0 .12.044.178.076.225.248.359.677 1.072 1.226 2.219.396.837.716 1.504.864 1.857l4.328-10.172.236-.153h1.514l.068.049c-.084 1.118-.171 3.094-.171 3.094l-.222.046s-1.808 4.336-2.548 5.992c-.307.694-.411.84-.411 1.013 0 .21.185.404.298.404.096 0 .308-.062.308-.062l.136.414-.721.31c-.422.18-.982.486-1.548.486-.713 0-1.16-.276-1.16-1.274 0-.589.202-1.219.821-2.816l-2.201 5.073-.218.339-2.646-.04-.078-.4.158-.151 1.974-4.622c-1.604-3.568-2.519-5.636-4.166-9.212-.52-1.125-.941-1.136-1.179-1.153-.104-.009-.199-.068-.199-.178v-.434l.059-.045h5.528l.068.049a59.7 59.7 0 0 0-.073 1.038c0 .16.059.234.095.235a138.25 138.25 0 0 0 .89-1.305l4.636.001" />
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
                <p className="text-white/70">No past launches found</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default Launches;