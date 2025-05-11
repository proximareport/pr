import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
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
  UserIcon, 
  UsersIcon,
  ImageIcon,
  MoonIcon,
  SunIcon,
  CloudIcon,
  CloudLightningIcon,
  LucideGlobe,
  Satellite,
} from "lucide-react";
import LaunchCountdown from "@/components/article/LaunchCountdown";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";

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

// New interface for ISS data
interface ISSPosition {
  message: string;
  timestamp: number;
  iss_position: {
    latitude: string;
    longitude: string;
  };
}

// Interface for astronauts in space
interface PeopleInSpace {
  message: string;
  number: number;
  people: {
    name: string;
    craft: string;
  }[];
}

// NASA APOD interface
interface NASAAPOD {
  date: string;
  explanation: string;
  hdurl: string;
  media_type: string;
  service_version: string;
  title: string;
  url: string;
}

function Launches() {
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterAgency, setFilterAgency] = useState("all");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [combinedUpcomingLaunches, setCombinedUpcomingLaunches] = useState<CombinedLaunch[]>([]);
  const [combinedPastLaunches, setCombinedPastLaunches] = useState<CombinedLaunch[]>([]);
  
  // Fetch SpaceX upcoming launches
  const { data: spacexUpcomingLaunches, isLoading: isLoadingSpaceX } = useQuery<SpaceXLaunch[]>({
    queryKey: ['/api/spacex/upcoming'],
  });
  
  // Fetch The Space Devs upcoming launches via our API
  const { data: tsdUpcomingData, isLoading: isLoadingTSD } = useQuery({
    queryKey: ['/api/launches/upcoming'],
  });
  
  // Fetch past launches from SpaceX
  const { data: spacexPastLaunches, isLoading: isLoadingSpaceXPast } = useQuery<SpaceXLaunch[]>({
    queryKey: ['/api/spacex/launches'],
  });
  
  // Fetch past launches from The Space Devs
  const { data: tsdPastData, isLoading: isLoadingTSDPast } = useQuery({
    queryKey: ['/api/launches/previous'],
  });
  
  // Fetch ISS location data
  const { data: issData, isLoading: isLoadingISS } = useQuery<ISSPosition>({
    queryKey: ['/api/iss/location'],
    // Refresh every 30 seconds
    refetchInterval: 30000,
  });
  
  // Fetch people in space data
  const { data: peopleInSpace, isLoading: isLoadingPeople } = useQuery<PeopleInSpace>({
    queryKey: ['/api/space/people'],
  });
  
  // Fetch NASA APOD data
  const { data: apodData, isLoading: isLoadingAPOD } = useQuery<NASAAPOD>({
    queryKey: ['/api/nasa/apod'],
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
  
  // Combine upcoming launch data from multiple sources
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
          image: launch.links?.patch?.small,
          links: {
            webcast: launch.links?.webcast,
            wiki: launch.links?.wikipedia,
            article: launch.links?.article,
          }
        });
      });
    }
    
    // Add The Space Devs data, filtering out SpaceX launches to avoid duplicates
    if (tsdUpcomingData && (tsdUpcomingData as any).results) {
      (tsdUpcomingData as any).results.forEach((launch: any) => {
        // Skip if it's a SpaceX launch (to avoid duplicates)
        if (launch.rocket?.configuration?.manufacturer?.name === "SpaceX") {
          return;
        }
        
        combined.push({
          id: launch.id,
          source: 'thespacedevs',
          name: launch.name,
          date: launch.net,
          details: launch.mission?.description,
          upcoming: true,
          agency: launch.rocket?.configuration?.manufacturer?.name,
          rocket: {
            name: launch.rocket?.configuration?.full_name || launch.rocket?.configuration?.name || "Unknown Rocket",
            manufacturer: launch.rocket?.configuration?.manufacturer?.name,
          },
          location: {
            name: launch.pad?.name || "Unknown Location",
            locality: launch.pad?.location?.name,
            country: launch.pad?.location?.country_code,
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
  
  // Process past launch data and combine from multiple sources
  useEffect(() => {
    const combined: CombinedLaunch[] = [];
    
    // Add SpaceX past launches
    if (spacexPastLaunches) {
      spacexPastLaunches
        .filter(launch => !launch.upcoming)
        .forEach(launch => {
          combined.push({
            id: launch.id,
            source: 'spacex',
            name: launch.name,
            date: launch.date_utc,
            details: launch.details,
            upcoming: false,
            success: launch.success,
            agency: 'SpaceX',
            rocket: {
              name: launch.rocket?.name || 'Unknown Rocket',
            },
            location: {
              name: launch.launchpad?.name || 'Unknown Location',
              locality: launch.launchpad?.locality,
              country: launch.launchpad?.region,
            },
            image: launch.links?.patch?.small,
            links: {
              webcast: launch.links?.webcast,
              wiki: launch.links?.wikipedia,
              article: launch.links?.article,
            }
          });
        });
    }
    
    // Add The Space Devs past launch data
    if (tsdPastData && (tsdPastData as any).results) {
      (tsdPastData as any).results.forEach((launch: any) => {
        // Skip if it's a SpaceX launch to avoid duplicates
        if (launch.rocket?.configuration?.manufacturer?.name === "SpaceX") {
          return;
        }
        
        let success: boolean | undefined = undefined;
        if (launch.status?.abbrev === "Success") success = true;
        else if (launch.status?.abbrev === "Failure") success = false;
        
        combined.push({
          id: launch.id,
          source: 'thespacedevs',
          name: launch.name,
          date: launch.net,
          details: launch.mission?.description,
          upcoming: false,
          success: success,
          agency: launch.rocket?.configuration?.manufacturer?.name,
          rocket: {
            name: launch.rocket?.configuration?.full_name || launch.rocket?.configuration?.name || "Unknown Rocket",
            manufacturer: launch.rocket?.configuration?.manufacturer?.name,
          },
          location: {
            name: launch.pad?.name || "Unknown Location",
            locality: launch.pad?.location?.name,
            country: launch.pad?.location?.country_code,
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
    
    // Sort by date descending (newest first)
    combined.sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
    
    setCombinedPastLaunches(combined);
  }, [spacexPastLaunches, tsdPastData]);
  
  // Filter combined upcoming launches by agency
  const filteredUpcomingLaunches = combinedUpcomingLaunches.filter(launch => {
    if (filterAgency === "all") return true;
    
    // Check if agency name contains filter string (case insensitive)
    return launch.agency?.toLowerCase().includes(filterAgency.toLowerCase());
  });
  
  // Filter past launches
  const filteredPastLaunches = combinedPastLaunches
    .filter(launch => {
      if (filterStatus === "all") return true;
      if (filterStatus === "success") return launch.success === true;
      if (filterStatus === "failed") return launch.success === false;
      return true;
    })
    .filter(launch => {
      if (filterAgency === "all") return true;
      return launch.agency?.toLowerCase().includes(filterAgency.toLowerCase());
    });
  
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
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-space font-bold mb-8">Space Data Hub</h1>
        
        <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-[#14141E]">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming Launches</TabsTrigger>
            <TabsTrigger value="past">Past Launches</TabsTrigger>
          </TabsList>
          
          {/* Space Dashboard */}
          <TabsContent value="dashboard">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* People in Space */}
              <Card className="bg-[#14141E] border-white/10 hover:border-purple-500/30 transition-colors col-span-1">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <UsersIcon className="h-5 w-5 text-purple-400" />
                    People in Space
                  </CardTitle>
                  <CardDescription>Currently in Earth orbit</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingPeople ? (
                    <div className="flex justify-center p-6">
                      <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
                    </div>
                  ) : peopleInSpace ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-white/80">Total astronauts</span>
                        <Badge className="text-xl bg-purple-900/20 text-purple-300 border-purple-500/20">
                          {peopleInSpace.number}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        {peopleInSpace.people.map((person, index) => (
                          <div 
                            key={index} 
                            className="flex justify-between items-center p-2 rounded-md bg-[#1E1E2D]"
                          >
                            <div className="flex items-center">
                              <UserIcon className="h-4 w-4 mr-2 text-white/70" />
                              <span>{person.name}</span>
                            </div>
                            <Badge variant="outline">{person.craft}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-white/60">
                      <p>Unable to load astronaut data</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* ISS Tracking */}
              <Card className="bg-[#14141E] border-white/10 hover:border-purple-500/30 transition-colors col-span-1">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <Satellite className="h-5 w-5 text-purple-400" />
                    ISS Tracker
                  </CardTitle>
                  <CardDescription>International Space Station location</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingISS ? (
                    <div className="flex justify-center p-6">
                      <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
                    </div>
                  ) : issData ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-[#1E1E2D] p-3 rounded-md">
                          <div className="text-xs text-white/60 mb-1">Latitude</div>
                          <div className="text-xl font-semibold">{parseFloat(issData.iss_position.latitude).toFixed(4)}°</div>
                        </div>
                        <div className="bg-[#1E1E2D] p-3 rounded-md">
                          <div className="text-xs text-white/60 mb-1">Longitude</div>
                          <div className="text-xl font-semibold">{parseFloat(issData.iss_position.longitude).toFixed(4)}°</div>
                        </div>
                      </div>
                      <div className="bg-[#1E1E2D] p-3 rounded-md">
                        <div className="text-xs text-white/60 mb-1">Velocity</div>
                        <div className="text-xl font-semibold">7.66 km/s</div>
                        <div className="text-xs text-white/60">27,576 km/h (17,134 mph)</div>
                      </div>
                      <div className="bg-[#1E1E2D] p-3 rounded-md">
                        <div className="text-xs text-white/60 mb-1">Altitude</div>
                        <div className="text-xl font-semibold">408 km</div>
                        <div className="text-xs text-white/60">254 miles</div>
                      </div>
                      <div className="text-center text-xs text-white/60">
                        Last updated: {new Date(issData.timestamp * 1000).toLocaleTimeString()}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-white/60">
                      <p>Unable to load ISS tracking data</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* NASA APOD */}
              <Card className="bg-[#14141E] border-white/10 hover:border-purple-500/30 transition-colors col-span-1 lg:row-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5 text-purple-400" />
                    Astronomy Picture of the Day
                  </CardTitle>
                  <CardDescription>NASA's daily space image</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isLoadingAPOD ? (
                    <div className="flex justify-center py-12">
                      <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
                    </div>
                  ) : apodData ? (
                    <>
                      <div className="relative aspect-video overflow-hidden rounded-md">
                        <img 
                          src={apodData.url} 
                          alt={apodData.title}
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{apodData.title}</h3>
                        <p className="text-sm text-white/60">{apodData.date}</p>
                        <p className="text-sm text-white/80 mt-2 line-clamp-6">{apodData.explanation}</p>
                      </div>
                      <div>
                        <a 
                          href={apodData.hdurl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-purple-400 hover:text-purple-300 flex items-center"
                        >
                          <ExternalLinkIcon className="h-3 w-3 mr-1" />
                          View high-resolution image
                        </a>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12 text-white/60">
                      <ImageIcon className="h-12 w-12 mx-auto mb-4 text-white/30" />
                      <p>NASA Astronomy Picture of the Day unavailable</p>
                      <p className="text-xs mt-2">The NASA API may be experiencing issues</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Next Launch */}
              <Card className="bg-[#14141E] border-white/10 hover:border-purple-500/30 transition-colors col-span-1 md:col-span-2 lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <RocketIcon className="h-5 w-5 text-purple-400" />
                    Next Launch
                  </CardTitle>
                  <CardDescription>Upcoming mission details</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingSpaceX && isLoadingTSD ? (
                    <div className="flex justify-center p-6">
                      <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
                    </div>
                  ) : combinedUpcomingLaunches.length > 0 ? (
                    <div className="space-y-4">
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="md:w-1/3">
                          {combinedUpcomingLaunches[0].image ? (
                            <img 
                              src={combinedUpcomingLaunches[0].image} 
                              alt={`${combinedUpcomingLaunches[0].name} mission patch`}
                              className="h-32 w-full object-contain rounded-md bg-black/20 p-2"
                            />
                          ) : (
                            <div className="h-32 w-full rounded-md bg-purple-900/20 flex items-center justify-center">
                              <RocketIcon className="h-16 w-16 text-purple-500/50" />
                            </div>
                          )}
                        </div>
                        <div className="md:w-2/3 space-y-2">
                          <div>
                            <h3 className="text-xl font-semibold">{combinedUpcomingLaunches[0].name}</h3>
                            <p className="text-white/60">
                              {combinedUpcomingLaunches[0].agency || 'Unknown Agency'} • {formatLaunchDate(combinedUpcomingLaunches[0].date)}
                            </p>
                          </div>
                          <div className="text-white/80">
                            {combinedUpcomingLaunches[0].details || combinedUpcomingLaunches[0].mission?.name || "No mission details available."}
                          </div>
                          <div className="grid grid-cols-2 gap-3 pt-2">
                            <div className="flex items-center">
                              <Rocket className="h-4 w-4 mr-2 text-white/70" />
                              <span>{combinedUpcomingLaunches[0].rocket?.name || "Unknown rocket"}</span>
                            </div>
                            <div className="flex items-center">
                              <MapPinIcon className="h-4 w-4 mr-2 text-white/70" />
                              <span>{combinedUpcomingLaunches[0].location?.name || "Unknown location"}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-2">
                        {combinedUpcomingLaunches[0].links?.webcast && (
                          <a 
                            href={combinedUpcomingLaunches[0].links.webcast} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md flex items-center"
                          >
                            <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path d="M21.543 6.498C22 8.28 22 12 22 12s0 3.72-.457 5.502c-.254.985-.997 1.76-1.938 2.022C17.896 20 12 20 12 20s-5.893 0-7.605-.476c-.945-.266-1.687-1.04-1.938-2.022C2 15.72 2 12 2 12s0-3.72.457-5.502c.254-.985.997-1.76 1.938-2.022C6.107 4 12 4 12 4s5.896 0 7.605.476c.945.266 1.687 1.04 1.938 2.022zM10 15.5l6-3.5-6-3.5v7z" />
                            </svg>
                            Watch Live
                          </a>
                        )}
                        {combinedUpcomingLaunches[0].links?.wiki && (
                          <a 
                            href={combinedUpcomingLaunches[0].links.wiki} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-[#1E1E2D] hover:bg-[#282838] text-white rounded-md flex items-center"
                          >
                            <InfoIcon className="h-4 w-4 mr-2" />
                            More Info
                          </a>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-white/60">
                      <RocketIcon className="h-12 w-12 mx-auto mb-4 text-white/30" />
                      <p>No upcoming launches found</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Launch Statistics */}
              <Card className="bg-[#14141E] border-white/10 hover:border-purple-500/30 transition-colors col-span-1 md:col-span-2 lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <LucideGlobe className="h-5 w-5 text-purple-400" />
                    Launch Statistics
                  </CardTitle>
                  <CardDescription>Global spaceflight metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-[#1E1E2D] p-4 rounded-md text-center">
                      <div className="text-3xl font-bold">{combinedUpcomingLaunches.length}</div>
                      <div className="text-xs text-white/60 mt-1">Upcoming Launches</div>
                    </div>
                    <div className="bg-[#1E1E2D] p-4 rounded-md text-center">
                      <div className="text-3xl font-bold">{combinedPastLaunches.filter(l => l.success === true).length}</div>
                      <div className="text-xs text-white/60 mt-1">Successful Launches</div>
                    </div>
                    <div className="bg-[#1E1E2D] p-4 rounded-md text-center">
                      <div className="text-3xl font-bold">{peopleInSpace?.number || 0}</div>
                      <div className="text-xs text-white/60 mt-1">People in Space</div>
                    </div>
                    <div className="bg-[#1E1E2D] p-4 rounded-md text-center">
                      <div className="text-3xl font-bold">{combinedPastLaunches.length + combinedUpcomingLaunches.length}</div>
                      <div className="text-xs text-white/60 mt-1">Total Tracked</div>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="text-sm font-medium mb-2 text-white/70">Upcoming Launches by Agency</h3>
                    <div className="space-y-4">
                      {agencies.slice(0, 5).map(agency => {
                        const count = combinedUpcomingLaunches.filter(l => 
                          l.agency?.toLowerCase().includes(agency.id.toLowerCase())
                        ).length;
                        const percentage = combinedUpcomingLaunches.length > 0 
                          ? (count / combinedUpcomingLaunches.length) * 100 
                          : 0;
                          
                        return (
                          <div key={agency.id} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>{agency.name}</span>
                              <span>{count} launches</span>
                            </div>
                            <Progress value={percentage} className="h-2" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
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
            
            {/* Debug info */}
            <div className="mb-4 p-4 bg-black/50 text-xs font-mono overflow-auto">
              <p>SpaceX API status: {isLoadingSpaceX ? 'Loading' : spacexUpcomingLaunches ? `Loaded ${spacexUpcomingLaunches.length} launches` : 'Failed'}</p>
              <p>Space Devs API status: {isLoadingTSD ? 'Loading' : tsdUpcomingData ? 'Loaded' : 'Failed'}</p>
              <p>Combined launches: {combinedUpcomingLaunches.length}</p>
              <p>Filtered launches: {filteredUpcomingLaunches.length}</p>
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
                        {launch.links?.webcast && (
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
                        {launch.links?.wiki && (
                          <a 
                            href={launch.links.wiki} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 text-xs bg-[#1E1E2D] text-purple-400 hover:text-purple-300 rounded-full flex items-center"
                          >
                            <InfoIcon className="h-3 w-3 mr-1" />
                            Wiki
                          </a>
                        )}
                        {launch.links?.article && (
                          <a 
                            href={launch.links.article} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 text-xs bg-[#1E1E2D] text-purple-400 hover:text-purple-300 rounded-full flex items-center"
                          >
                            <ExternalLinkIcon className="h-3 w-3 mr-1" />
                            Article
                          </a>
                        )}
                        {launch.links?.info && (
                          <a 
                            href={launch.links.info} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 text-xs bg-[#1E1E2D] text-purple-400 hover:text-purple-300 rounded-full flex items-center"
                          >
                            <InfoIcon className="h-3 w-3 mr-1" />
                            Info
                          </a>
                        )}
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border border-white/10 rounded-lg bg-[#14141E]">
                <Rocket className="h-12 w-12 text-white/30 mx-auto mb-4" />
                <h3 className="text-xl font-medium mb-2">No launches found</h3>
                <p className="text-white/60 max-w-md mx-auto">
                  No upcoming launches match your filter criteria. Try selecting a different agency or check back later.
                </p>
              </div>
            )}
          </TabsContent>
          
          {/* Past Launches */}
          <TabsContent value="past">
            <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h2 className="text-xl font-space font-medium">Launch History</h2>
              <div className="flex items-center space-x-2">
                <select 
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-[#1E1E2D] border border-white/10 rounded p-1.5 text-sm"
                  aria-label="Filter by status"
                >
                  <option value="all">All Launches</option>
                  <option value="success">Successful Only</option>
                  <option value="failed">Failed Only</option>
                </select>
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
            
            {/* Debug info */}
            <div className="mb-4 p-4 bg-black/50 text-xs font-mono overflow-auto">
              <p>SpaceX Past API status: {isLoadingSpaceXPast ? 'Loading' : spacexPastLaunches ? `Loaded ${spacexPastLaunches.length} launches` : 'Failed'}</p>
              <p>Space Devs Past API status: {isLoadingTSDPast ? 'Loading' : tsdPastData ? 'Loaded' : 'Failed'}</p>
              <p>Combined past launches: {combinedPastLaunches.length}</p>
              <p>Filtered past launches: {filteredPastLaunches.length}</p>
            </div>
            
            {isLoadingSpaceXPast && isLoadingTSDPast ? (
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
                      <TableHead className="hidden sm:table-cell">Agency</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden md:table-cell">Rocket</TableHead>
                      <TableHead className="text-right">Links</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPastLaunches.slice(0, 20).map(launch => (
                      <TableRow key={launch.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            {launch.image ? (
                              <img 
                                src={launch.image} 
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
                            <div>{new Date(launch.date).toLocaleDateString()}</div>
                            <div className="text-xs text-white/60">{getTimeAgo(launch.date)}</div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant="outline" className="font-normal">
                            {launch.agency || "Unknown"}
                          </Badge>
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
                        <TableCell className="hidden md:table-cell">{launch.rocket?.name || "Unknown"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex space-x-1 justify-end">
                            {launch.links?.webcast && (
                              <a 
                                href={launch.links.webcast} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="p-1 text-purple-400 hover:text-purple-300"
                                title="Watch webcast"
                              >
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M21.582 6.186C22 8.009 22 12 22 12C22 12 22 15.991 21.582 17.814C21.392 18.65 21.04 19.328 20.334 19.836C19.628 20.344 18.825 20.569 17.944 20.663C16.292 20.84 12 20.84 12 20.84C12 20.84 7.708 20.84 6.056 20.663C5.175 20.569 4.372 20.344 3.666 19.836C2.96 19.328 2.608 18.65 2.418 17.814C2 15.991 2 12 2 12C2 12 2 8.009 2.418 6.186C2.608 5.35 2.96 4.672 3.666 4.164C4.372 3.656 5.175 3.431 6.056 3.337C7.708 3.16 12 3.16 12 3.16C12 3.16 16.292 3.16 17.944 3.337C18.825 3.431 19.628 3.656 20.334 4.164C21.04 4.672 21.392 5.35 21.582 6.186ZM10 15.464L16 12L10 8.536V15.464Z"/>
                                </svg>
                              </a>
                            )}
                            {launch.links?.article && (
                              <a 
                                href={launch.links.article} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="p-1 text-purple-400 hover:text-purple-300"
                                title="Read article"
                              >
                                <ExternalLinkIcon className="h-4 w-4" />
                              </a>
                            )}
                            {launch.links?.wiki && (
                              <a 
                                href={launch.links.wiki} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="p-1 text-purple-400 hover:text-purple-300"
                                title="Wikipedia"
                              >
                                <LucideGlobe className="h-4 w-4" />
                              </a>
                            )}
                            {launch.links?.info && (
                              <a 
                                href={launch.links.info} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="p-1 text-purple-400 hover:text-purple-300"
                                title="More information"
                              >
                                <InfoIcon className="h-4 w-4" />
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
                <p className="text-white/70">No past launches matching your filters</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default Launches;