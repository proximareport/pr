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
  InfoIcon,
  Rocket,
  UserIcon, 
  UsersIcon,
  ImageIcon,
  LucideGlobe,
  Satellite,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { format, isAfter, formatDistance } from "date-fns";

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

// ISS Position Interface
interface ISSPosition {
  message: string;
  timestamp: number;
  iss_position: {
    latitude: string;
    longitude: string;
  };
}

// People in Space Interface
interface PeopleInSpace {
  message: string;
  number: number;
  people: {
    name: string;
    craft: string;
  }[];
}

// NASA APOD Interface
interface NASAAPOD {
  date: string;
  explanation: string;
  hdurl: string;
  media_type: string;
  service_version: string;
  title: string;
  url: string;
}

// Helper to display countdown to launch
function getTimeToLaunch(launchDate: string) {
  const now = new Date();
  const launch = new Date(launchDate);
  
  if (isAfter(now, launch)) {
    return "Launched";
  }
  
  return formatDistance(launch, now, { addSuffix: true });
}

function LaunchesTab() {
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
    
    // Sort by date (closest first for upcoming)
    combined.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      
      // Check for invalid dates and put them at the end
      if (isNaN(dateA.getTime())) return 1;
      if (isNaN(dateB.getTime())) return -1;
      
      return dateA.getTime() - dateB.getTime();
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
    
    // Sort by date (newest first for past launches)
    combined.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      
      // Check for invalid dates and put them at the end
      if (isNaN(dateA.getTime())) return 1;
      if (isNaN(dateB.getTime())) return -1;
      
      return dateB.getTime() - dateA.getTime();
    });
    
    setCombinedPastLaunches(combined);
  }, [spacexPastLaunches, tsdPastData]);
  
  // Filter upcoming launches based on user selections and ensure they are really upcoming
  const filteredUpcomingLaunches = combinedUpcomingLaunches.filter(launch => {
    // First, ensure the launch date is in the future or very recent (last 24 hours)
    const launchDate = new Date(launch.date);
    const now = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Skip launch if date is invalid
    if (isNaN(launchDate.getTime())) return false;
    
    // Only include launches that are after yesterday
    if (launchDate < yesterday) return false;
    
    // Then apply agency filter
    if (filterAgency === "all") return true;
    return launch.agency?.toLowerCase().includes(filterAgency.toLowerCase());
  });
  
  const filteredPastLaunches = combinedPastLaunches.filter(launch => {
    // First, ensure the launch date is in the past (older than a day)
    const launchDate = new Date(launch.date);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Skip launch if date is invalid
    if (isNaN(launchDate.getTime())) return false;
    
    // Only include launches that are before yesterday
    if (launchDate > yesterday) return false;
    
    // Then, filter by agency if one is selected
    if (filterAgency !== "all" && !launch.agency?.toLowerCase().includes(filterAgency.toLowerCase())) {
      return false;
    }
    
    // Finally, filter by status
    if (filterStatus === "success") return launch.success === true;
    if (filterStatus === "failed") return launch.success === false;
    return true; // "all" status
  });
  
  const isLoadingPast = isLoadingSpaceXPast || isLoadingTSDPast;
  
  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold font-space">Space Launches &amp; Data</h1>
        <p className="text-white/70">Track upcoming and past launches, astronauts in space, and more.</p>
      </div>
      
      <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-[#14141E] p-1 mb-4">
          <TabsTrigger value="dashboard" className="data-[state=active]:bg-purple-800 data-[state=active]:text-white">Dashboard</TabsTrigger>
          <TabsTrigger value="upcoming" className="data-[state=active]:bg-purple-800 data-[state=active]:text-white">Upcoming Launches</TabsTrigger>
          <TabsTrigger value="past" className="data-[state=active]:bg-purple-800 data-[state=active]:text-white">Launch History</TabsTrigger>
          <TabsTrigger value="iss" className="data-[state=active]:bg-purple-800 data-[state=active]:text-white">ISS Tracker</TabsTrigger>
          <TabsTrigger value="apod" className="data-[state=active]:bg-purple-800 data-[state=active]:text-white">NASA Photo of the Day</TabsTrigger>
        </TabsList>
        
        {/* Dashboard */}
        <TabsContent value="dashboard">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-[#14141E] border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UsersIcon className="h-5 w-5 text-blue-400" />
                  People in Space
                </CardTitle>
                <CardDescription>
                  Current astronauts aboard the ISS and other spacecraft
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingPeople ? (
                  <div className="h-40 flex items-center justify-center">
                    <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
                  </div>
                ) : peopleInSpace ? (
                  <div>
                    <div className="mb-4">
                      <div className="text-3xl font-bold mb-1">{peopleInSpace.number}</div>
                      <div className="text-sm text-white/60">Current humans in orbit</div>
                    </div>
                    
                    <ul className="space-y-3">
                      {peopleInSpace.people.map((person, index) => (
                        <li key={index} className="flex items-center justify-between border-b border-white/10 pb-2">
                          <div className="flex items-center gap-3">
                            <div className="bg-purple-900/40 h-9 w-9 rounded-full flex items-center justify-center">
                              <UserIcon className="h-5 w-5 text-purple-300" />
                            </div>
                            <div>
                              <div className="font-medium">{person.name}</div>
                              <Badge variant="outline" className="bg-blue-900/20 text-blue-300 border-blue-500/20 mt-1">
                                {person.craft}
                              </Badge>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="h-40 flex items-center justify-center text-white/60">
                    Failed to load people in space data
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card className="bg-[#14141E] border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Satellite className="h-5 w-5 text-blue-400" />
                  ISS Tracker
                </CardTitle>
                <CardDescription>
                  Current location of the International Space Station
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingISS ? (
                  <div className="h-40 flex items-center justify-center">
                    <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
                  </div>
                ) : issData ? (
                  <div>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-[#1E1E2D] p-3 rounded-lg">
                        <div className="text-sm text-white/60 mb-1">Latitude</div>
                        <div className="text-xl font-mono font-medium">{issData.iss_position.latitude}°</div>
                      </div>
                      <div className="bg-[#1E1E2D] p-3 rounded-lg">
                        <div className="text-sm text-white/60 mb-1">Longitude</div>
                        <div className="text-xl font-mono font-medium">{issData.iss_position.longitude}°</div>
                      </div>
                    </div>
                    
                    <div className="text-sm text-white/60 mb-2">ISS Location</div>
                    <div className="bg-[#1E1E2D] h-40 rounded-lg flex items-center justify-center relative">
                      <LucideGlobe className="h-28 w-28 text-blue-400/40" />
                      <div className="absolute h-3 w-3 bg-blue-500 rounded-full animate-pulse" 
                        style={{ 
                          left: `${(parseFloat(issData.iss_position.longitude) + 180) / 360 * 100}%`, 
                          top: `${(90 - parseFloat(issData.iss_position.latitude)) / 180 * 100}%` 
                        }}
                      />
                    </div>
                    <p className="text-xs text-white/60 mt-2 text-center">
                      Updated {format(new Date(issData.timestamp * 1000), 'HH:mm:ss')}
                    </p>
                  </div>
                ) : (
                  <div className="h-40 flex items-center justify-center text-white/60">
                    Failed to load ISS location data
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card className="bg-[#14141E] border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-blue-400" />
                  NASA Astronomy Picture of the Day
                </CardTitle>
                <CardDescription>
                  Daily image or photograph of our fascinating universe
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingAPOD ? (
                  <div className="h-60 flex items-center justify-center">
                    <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
                  </div>
                ) : apodData ? (
                  <div className="space-y-3">
                    <div className="relative h-60 rounded-lg overflow-hidden">
                      <img 
                        src={apodData.url} 
                        alt={apodData.title} 
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                        <h3 className="font-medium text-white">{apodData.title}</h3>
                        <p className="text-xs text-white/70">{format(new Date(apodData.date), 'MMMM d, yyyy')}</p>
                      </div>
                    </div>
                    <p className="text-sm text-white/80 line-clamp-4">{apodData.explanation}</p>
                    <div>
                      <a 
                        href={apodData.hdurl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs inline-flex items-center text-blue-400 hover:text-blue-300"
                      >
                        View High-Resolution Image
                        <ExternalLinkIcon className="h-3 w-3 ml-1" />
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="h-60 flex items-center justify-center text-white/60">
                    <div className="flex flex-col items-center">
                      <ImageIcon className="h-10 w-10 mb-2 text-white/30" />
                      Failed to load NASA APOD data
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card className="bg-[#14141E] border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RocketIcon className="h-5 w-5 text-blue-400" />
                  Launch Statistics
                </CardTitle>
                <CardDescription>
                  Overview of upcoming and historical launches
                </CardDescription>
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
            <div className="rounded-lg border border-white/10 overflow-hidden">
              <Table>
                <TableHeader className="bg-[#14141E]">
                  <TableRow>
                    <TableHead>Mission</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="hidden sm:table-cell">Agency</TableHead>
                    <TableHead>Countdown</TableHead>
                    <TableHead className="hidden md:table-cell">Rocket</TableHead>
                    <TableHead className="text-right">Links</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUpcomingLaunches.map(launch => (
                    <TableRow key={launch.id} className="border-white/5 hover:bg-white/5">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          {launch.image ? (
                            <img 
                              src={launch.image} 
                              alt={`${launch.name} mission patch`}
                              className="h-8 w-8 object-contain rounded-md"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-md bg-purple-900/20 flex items-center justify-center">
                              <RocketIcon className="h-4 w-4 text-purple-500" />
                            </div>
                          )}
                          <span>{launch.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{format(new Date(launch.date), 'MMM d, yyyy - HH:mm')}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {launch.source === 'spacex' ? 'SpaceX' : launch.agency || 'Unknown'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-blue-900/20 text-blue-300 border-blue-500/20">
                          {getTimeToLaunch(launch.date)}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{launch.rocket?.name}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {launch.links?.webcast && (
                            <a 
                              href={launch.links.webcast} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="p-1.5 text-xs bg-[#1E1E2D] text-red-400 hover:text-red-300 rounded-md"
                              title="Watch Webcast"
                            >
                              <RocketIcon className="h-3.5 w-3.5" />
                            </a>
                          )}
                          {launch.links?.wiki && (
                            <a 
                              href={launch.links.wiki} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="p-1.5 text-xs bg-[#1E1E2D] text-purple-400 hover:text-purple-300 rounded-md"
                              title="Wiki"
                            >
                              <InfoIcon className="h-3.5 w-3.5" />
                            </a>
                          )}
                          {launch.links?.article && (
                            <a 
                              href={launch.links.article} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="p-1.5 text-xs bg-[#1E1E2D] text-purple-400 hover:text-purple-300 rounded-md"
                              title="Article"
                            >
                              <ExternalLinkIcon className="h-3.5 w-3.5" />
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
                  {filteredPastLaunches.map(launch => (
                    <TableRow key={launch.id} className="border-white/5 hover:bg-white/5">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          {launch.image ? (
                            <img 
                              src={launch.image} 
                              alt={`${launch.name} mission patch`}
                              className="h-8 w-8 object-contain rounded-md"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-md bg-purple-900/20 flex items-center justify-center">
                              <RocketIcon className="h-4 w-4 text-purple-500" />
                            </div>
                          )}
                          <span>{launch.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{format(new Date(launch.date), 'MMM d, yyyy')}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {launch.agency || (launch.source === 'spacex' ? 'SpaceX' : 'Unknown')}
                      </TableCell>
                      <TableCell>
                        {launch.success === true ? (
                          <Badge className="bg-green-900/20 text-green-300 border-green-500/20">
                            <CheckCircleIcon className="h-3.5 w-3.5 mr-1" />
                            Success
                          </Badge>
                        ) : launch.success === false ? (
                          <Badge className="bg-red-900/20 text-red-300 border-red-500/20">
                            <AlertCircleIcon className="h-3.5 w-3.5 mr-1" />
                            Failed
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-900/20 text-yellow-300 border-yellow-500/20">
                            <TimerIcon className="h-3.5 w-3.5 mr-1" />
                            Unknown
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {launch.rocket?.name}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {launch.links?.webcast && (
                            <a 
                              href={launch.links.webcast} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="p-1.5 text-xs bg-[#1E1E2D] text-red-400 hover:text-red-300 rounded-md"
                              title="Watch Webcast"
                            >
                              <RocketIcon className="h-3.5 w-3.5" />
                            </a>
                          )}
                          {launch.links?.wiki && (
                            <a 
                              href={launch.links.wiki} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="p-1.5 text-xs bg-[#1E1E2D] text-purple-400 hover:text-purple-300 rounded-md"
                              title="Wiki"
                            >
                              <InfoIcon className="h-3.5 w-3.5" />
                            </a>
                          )}
                          {launch.links?.article && (
                            <a 
                              href={launch.links.article} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="p-1.5 text-xs bg-[#1E1E2D] text-purple-400 hover:text-purple-300 rounded-md"
                              title="Article"
                            >
                              <ExternalLinkIcon className="h-3.5 w-3.5" />
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
            <div className="text-center py-12 border border-white/10 rounded-lg bg-[#14141E]">
              <Rocket className="h-12 w-12 text-white/30 mx-auto mb-4" />
              <h3 className="text-xl font-medium mb-2">No launch history found</h3>
              <p className="text-white/60 max-w-md mx-auto">
                No past launches match your filter criteria. Try adjusting your filters or check back later.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default LaunchesTab;