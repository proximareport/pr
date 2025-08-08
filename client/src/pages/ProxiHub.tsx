import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  RocketIcon, 
  TelescopeIcon, 
  CalculatorIcon, 
  GlobeIcon, 
  UsersIcon,
  SatelliteIcon,
  MapIcon,
  DatabaseIcon,
  ChartBarIcon,
  BookOpenIcon,
  CalendarIcon,
  SearchIcon,
  ExternalLinkIcon,
  StarIcon,
  Globe2Icon,
  AtomIcon,
  TypeIcon,
  RulerIcon,
  SparklesIcon,
  BrainIcon,
  ZapIcon,
  PaletteIcon
} from "lucide-react";
import { Link } from "wouter";

interface Tool {
  name: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  category: string;
  isExternal?: boolean;
  badge?: string;
}

function ProxiHub() {
  const tools: Tool[] = [
    // Built-in Tools
    {
      name: "Space Word Generator",
      description: "Generate creative space-themed names and terminology",
      icon: <TypeIcon className="h-6 w-6" />,
      href: "/tools/word-generator",
      category: "Generators",
      badge: "New"
    },
    {
      name: "Planet Name Generator",
      description: "Create unique names for planets, moons, and celestial bodies",
      icon: <Globe2Icon className="h-6 w-6" />,
      href: "/tools/planet-generator",
      category: "Generators",
      badge: "New"
    },
    {
      name: "Space Distance Calculator",
      description: "Calculate distances between celestial objects and space missions",
      icon: <RulerIcon className="h-6 w-6" />,
      href: "/tools/distance-calculator",
      category: "Calculators",
      badge: "New"
    },
    {
      name: "Space Mission Generator",
      description: "Generate creative space mission concepts and scenarios",
      icon: <SparklesIcon className="h-6 w-6" />,
      href: "/tools/mission-generator",
      category: "Generators",
      badge: "New"
    },
    {
      name: "Space Quiz Generator",
      description: "Create custom space and STEM quizzes for learning",
      icon: <BrainIcon className="h-6 w-6" />,
      href: "/tools/quiz-generator",
      category: "Education",
      badge: "New"
    },
    {
      name: "Space Color Palette",
      description: "Generate space-themed color schemes for design projects",
      icon: <PaletteIcon className="h-6 w-6" />,
      href: "/tools/color-palette",
      category: "Design",
      badge: "New"
    },
    {
      name: "Space Fact Generator",
      description: "Discover random space facts and astronomical trivia",
      icon: <ZapIcon className="h-6 w-6" />,
      href: "/tools/fact-generator",
      category: "Education",
      badge: "New"
    },
    {
      name: "Delta-V Calculator",
      description: "Calculate delta-v requirements for space missions and orbital transfers",
      icon: <CalculatorIcon className="h-6 w-6" />,
      href: "/tools/delta-v-calculator",
      category: "Calculators",
      badge: "Beta Experimental"
    },
    {
      name: "Astrophysics Playground",
      description: "Interactive simulations and experiments for astrophysics concepts",
      icon: <AtomIcon className="h-6 w-6" />,
      href: "/tools/astrophysics-playground",
      category: "Education",
      badge: "Beta Experimental"
    },
    
    // Astronomy & Observation Tools
    {
      name: "Sky Map",
      description: "Interactive star map and celestial navigation tool",
      icon: <TelescopeIcon className="h-6 w-6" />,
      href: "/astronomy",
      category: "Astronomy"
    },
    {
      name: "Launch Tracker",
      description: "Real-time rocket launch tracking and countdowns",
      icon: <RocketIcon className="h-6 w-6" />,
      href: "/missioncontrol",
      category: "Space Missions"
    },
    {
      name: "Satellite Tracker",
      description: "Track satellites and space debris in real-time",
      icon: <SatelliteIcon className="h-6 w-6" />,
      href: "https://www.n2yo.com",
      category: "Space Missions",
      isExternal: true
    },
    {
      name: "Planet Calculator",
      description: "Calculate planetary positions and orbital mechanics",
      icon: <CalculatorIcon className="h-6 w-6" />,
      href: "https://ssd-api.jpl.nasa.gov",
      category: "Calculators",
      isExternal: true
    },
    
    // Data & Research Tools
    {
      name: "NASA API Explorer",
      description: "Browse and test NASA's public APIs",
      icon: <DatabaseIcon className="h-6 w-6" />,
      href: "https://api.nasa.gov",
      category: "Data & APIs",
      isExternal: true
    },
    {
      name: "Space Weather",
      description: "Monitor solar activity and space weather conditions",
      icon: <StarIcon className="h-6 w-6" />,
      href: "https://spaceweather.com",
      category: "Monitoring",
      isExternal: true
    },
    {
      name: "ISS Tracker",
      description: "Track the International Space Station in real-time",
      icon: <GlobeIcon className="h-6 w-6" />,
      href: "https://spotthestation.nasa.gov",
      category: "Space Missions",
      isExternal: true
    },
    
    // Educational Tools
    {
      name: "STEM Resources",
      description: "Educational materials and learning resources",
      icon: <BookOpenIcon className="h-6 w-6" />,
      href: "https://www.nasa.gov/stem",
      category: "Education",
      isExternal: true
    },
    {
      name: "Space Calendar",
      description: "Upcoming space events and astronomical phenomena",
      icon: <CalendarIcon className="h-6 w-6" />,
      href: "/missioncontrol",
      category: "Events"
    },
    {
      name: "Community Hub",
      description: "Connect with space enthusiasts and professionals",
      icon: <UsersIcon className="h-6 w-6" />,
      href: "/gallery",
      category: "Community"
    },
    
    // Advanced Tools
    {
      name: "Orbital Mechanics",
      description: "Advanced orbital calculations and simulations",
      icon: <AtomIcon className="h-6 w-6" />,
      href: "https://www.orbital-mechanics.space",
      category: "Advanced",
      isExternal: true,
      badge: "Advanced"
    },
    {
      name: "Space Debris Map",
      description: "Visualize space debris and collision risks",
      icon: <MapIcon className="h-6 w-6" />,
      href: "https://stuffin.space",
      category: "Monitoring",
      isExternal: true
    },
    {
      name: "Astronomy Data",
      description: "Access astronomical databases and catalogs",
      icon: <ChartBarIcon className="h-6 w-6" />,
      href: "https://simbad.u-strasbg.fr/simbad",
      category: "Data & APIs",
      isExternal: true
    }
  ];

  const categories = ["All", "Generators", "Calculators", "Astronomy", "Space Missions", "Data & APIs", "Education", "Community", "Monitoring", "Advanced", "Design", "Events"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0F] via-[#14141E] to-[#1A1A2E]">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4 bg-purple-500/20 text-purple-300 border-purple-500/30">
              <RocketIcon className="w-3 h-3 mr-1" />
              Tools Hub
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-6">
              ProxiHub
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Your comprehensive toolkit for space exploration, astronomy, and STEM research. 
              Access powerful tools, real-time data, and educational resources all in one place.
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-md mx-auto mb-8">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search tools..."
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20"
              />
            </div>
          </div>

          {/* Tools Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tools.map((tool, index) => (
              <Card key={index} className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                      {tool.icon}
                    </div>
                    {tool.badge && (
                      <Badge variant="outline" className={`text-xs ${
                        tool.badge === "New" 
                          ? "bg-green-500/20 text-green-300 border-green-500/30" 
                          : tool.badge === "Advanced"
                          ? "bg-orange-500/20 text-orange-300 border-orange-500/30"
                          : "bg-purple-500/20 text-purple-300 border-purple-500/30"
                      }`}>
                        {tool.badge}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg text-white group-hover:text-purple-300 transition-colors">
                    {tool.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="text-gray-400 mb-4 text-sm">
                    {tool.description}
                  </CardDescription>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="bg-gray-500/20 text-gray-300 border-gray-500/30 text-xs">
                      {tool.category}
                    </Badge>
                    {tool.isExternal ? (
                      <Button 
                        asChild 
                        variant="outline" 
                        size="sm"
                        className="border-purple-500/30 text-purple-300 hover:bg-purple-500/20"
                      >
                        <a href={tool.href} target="_blank" rel="noopener noreferrer">
                          Open
                          <ExternalLinkIcon className="ml-1 h-3 w-3" />
                        </a>
                      </Button>
                    ) : (
                      <Button 
                        asChild 
                        variant="outline" 
                        size="sm"
                        className="border-purple-500/30 text-purple-300 hover:bg-purple-500/20"
                      >
                        <Link href={tool.href}>
                          Open
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* ProxiHub Version Info */}
          <div className="mt-16">
            <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/20 backdrop-blur-sm">
              <CardContent className="pt-8 pb-8">
                <div className="text-center">
                  <h3 className="text-2xl font-semibold text-purple-300 mb-4">
                    📊 ProxiHub Version Info
                  </h3>
                  <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
                    Current version and development status of ProxiHub tools and features.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Badge variant="outline" className="bg-green-500/20 text-green-300 border-green-500/30 px-4 py-2">
                      Version 1.2.0
                    </Badge>
                    <Badge variant="outline" className="bg-blue-500/20 text-blue-300 border-blue-500/30 px-4 py-2">
                      Stable Release
                    </Badge>
                    <Badge variant="outline" className="bg-orange-500/20 text-orange-300 border-orange-500/30 px-4 py-2">
                      Beta Features Available
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProxiHub; 