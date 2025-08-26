import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BannerAd, InContentAd } from "@/components/AdPlacement";
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
  PaletteIcon,
  TrendingUpIcon,
  Users2Icon,
  ClockIcon
} from "lucide-react";
import { Link } from "wouter";
import { useState, useEffect } from "react";
import { analyticsTracker } from "@/lib/analytics";

interface Tool {
  name: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  category: string;
  isExternal?: boolean;
  badge?: string;
}

interface ToolGroup {
  name: string;
  description: string;
  icon: React.ReactNode;
  tools: Tool[];
  analytics?: {
    totalUsage: number;
    uniqueUsers: number;
    avgUsageTime: number;
    topTools: Array<{
      name: string;
      usageCount: number;
      avgTime: number;
    }>;
  };
}

function ProxiHub() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [toolGroups, setToolGroups] = useState<ToolGroup[]>([]);

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
      name: "Space Fact Generator",
      description: "Discover random space facts and astronomical trivia",
      icon: <ZapIcon className="h-6 w-6" />,
      href: "/tools/fact-generator",
      category: "Education",
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
      name: "Delta-V Calculator",
      description: "Calculate delta-v requirements for space missions and orbital transfers",
      icon: <CalculatorIcon className="h-6 w-6" />,
      href: "/tools/delta-v-calculator",
      category: "Calculators",
      badge: "Beta Experimental"
    },
    {
      name: "Planet Calculator",
      description: "Calculate planetary positions and orbital mechanics",
      icon: <CalculatorIcon className="h-6 w-6" />,
      href: "https://ssd-api.jpl.nasa.gov",
      category: "Calculators",
      isExternal: true
    },
    {
      name: "Astrophysics Playground",
      description: "Interactive simulations and experiments for astrophysics concepts",
      icon: <AtomIcon className="h-6 w-6" />,
      href: "/tools/astrophysics-playground",
      category: "Education",
      badge: "Beta Experimental"
    },
    {
      name: "Space Color Palette",
      description: "Generate space-themed color schemes for design projects",
      icon: <PaletteIcon className="h-6 w-6" />,
      href: "/tools/color-palette",
      category: "Design",
      badge: "New"
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
      name: "ISS Tracker",
      description: "Track the International Space Station in real-time",
      icon: <GlobeIcon className="h-6 w-6" />,
      href: "https://spotthestation.nasa.gov",
      category: "Space Missions",
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
    }
  ];

  const categories = ["All", "Generators", "Calculators", "Astronomy", "Space Missions", "Data & APIs", "Education", "Community", "Monitoring", "Advanced", "Design", "Events"];

  // Group tools by category
  useEffect(() => {
    const groups: Record<string, ToolGroup> = {};
    
    tools.forEach(tool => {
      if (!groups[tool.category]) {
        groups[tool.category] = {
          name: tool.category,
          description: getCategoryDescription(tool.category),
          icon: getCategoryIcon(tool.category),
          tools: []
        };
      }
      groups[tool.category].tools.push(tool);
    });

    // Convert to array and sort by number of tools
    const sortedGroups = Object.values(groups).sort((a, b) => b.tools.length - a.tools.length);
    setToolGroups(sortedGroups);
  }, []);

  // Load analytics data for tool groups
  useEffect(() => {
    const loadAnalytics = () => {
      const groupAnalytics = analyticsTracker.getToolGroupAnalytics();
      
      setToolGroups(prevGroups => 
        prevGroups.map(group => {
          const analytics = groupAnalytics.find(ga => ga.category === group.name);
          return {
            ...group,
            analytics: analytics ? {
              totalUsage: analytics.totalUsage,
              uniqueUsers: analytics.uniqueUsers,
              avgUsageTime: analytics.avgUsageTime,
              topTools: analytics.topTools
            } : undefined
          };
        })
      );
    };

    loadAnalytics();
    
    // Refresh analytics every 30 seconds
    const interval = setInterval(loadAnalytics, 30000);
    return () => clearInterval(interval);
  }, []);

  const getCategoryDescription = (category: string): string => {
    const descriptions: Record<string, string> = {
      "Generators": "AI-powered tools for creating space-themed content",
      "Calculators": "Mathematical tools for space calculations and orbital mechanics",
      "Astronomy": "Tools for stargazing and celestial observation",
      "Space Missions": "Real-time tracking and information about space missions",
      "Data & APIs": "Access to space data and external APIs",
      "Education": "Learning resources and educational tools",
      "Community": "Connect with space enthusiasts and professionals",
      "Monitoring": "Tools for monitoring space weather and conditions",
      "Advanced": "Advanced tools for space professionals and researchers",
      "Design": "Creative tools for space-themed design projects",
      "Events": "Space events and astronomical phenomena"
    };
    return descriptions[category] || "Collection of space tools and resources";
  };

  const getCategoryIcon = (category: string): React.ReactNode => {
    const icons: Record<string, React.ReactNode> = {
      "Generators": <SparklesIcon className="h-8 w-8" />,
      "Calculators": <CalculatorIcon className="h-8 w-8" />,
      "Astronomy": <TelescopeIcon className="h-8 w-8" />,
      "Space Missions": <RocketIcon className="h-8 w-8" />,
      "Data & APIs": <DatabaseIcon className="h-8 w-8" />,
      "Education": <BookOpenIcon className="h-8 w-8" />,
      "Community": <UsersIcon className="h-8 w-8" />,
      "Monitoring": <ChartBarIcon className="h-8 w-8" />,
      "Advanced": <AtomIcon className="h-8 w-8" />,
      "Design": <PaletteIcon className="h-8 w-8" />,
      "Events": <CalendarIcon className="h-8 w-8" />
    };
    return icons[category] || <GlobeIcon className="h-8 w-8" />;
  };

  const handleToolClick = (tool: Tool) => {
    // Track tool usage for analytics
    analyticsTracker.trackToolUsage(tool.name, tool.category, 0, tool.isExternal || false);
    
    // If external tool, let the default link behavior handle it
    if (tool.isExternal) {
      return;
    }
    
    // For internal tools, we can add additional tracking if needed
    // The analytics will be tracked when the user actually uses the tool
  };

  const filteredGroups = toolGroups.filter(group => {
    if (selectedCategory !== "All" && group.name !== selectedCategory) {
      return false;
    }
    
    if (searchTerm) {
      const hasMatchingTool = group.tools.some(tool => 
        tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      return hasMatchingTool;
    }
    
    return true;
  });

  const filteredTools = searchTerm 
    ? tools.filter(tool => 
        tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : tools;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0F] via-[#14141E] to-[#1A1A2E]">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-7xl mx-auto">
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

          {/* Small Top Ad - Less Intrusive */}
          <div className="mb-6">
            <div className="max-w-2xl mx-auto">
              <InContentAd />
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="max-w-4xl mx-auto mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search tools..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20"
              >
                {categories.map(category => (
                  <option key={category} value={category} className="bg-gray-800 text-white">
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tool Groups */}
          {searchTerm ? (
            // Search Results View
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6">
                Search Results ({filteredTools.length} tools)
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTools.map((tool, index) => (
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
                            onClick={() => handleToolClick(tool)}
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
                            onClick={() => handleToolClick(tool)}
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
            </div>
          ) : (
            // Grouped View
            <div className="space-y-12">
              {filteredGroups.map((group, groupIndex) => (
                <div key={groupIndex} className="space-y-6">
                  {/* Group Header with Analytics */}
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl flex items-center justify-center">
                        {group.icon}
                      </div>
                      <div>
                        <h2 className="text-3xl font-bold text-white">{group.name}</h2>
                        <p className="text-gray-400 max-w-2xl">{group.description}</p>
                      </div>
                    </div>
                    
                    {/* Group Analytics */}
                    {group.analytics && (
                      <div className="flex flex-wrap gap-3">
                        <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2 border border-white/10">
                          <TrendingUpIcon className="h-4 w-4 text-green-400" />
                          <span className="text-sm text-gray-300">
                            {group.analytics.totalUsage.toLocaleString()} uses
                          </span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2 border border-white/10">
                          <Users2Icon className="h-4 w-4 text-blue-400" />
                          <span className="text-sm text-gray-300">
                            {group.analytics.uniqueUsers.toLocaleString()} users
                          </span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2 border border-white/10">
                          <ClockIcon className="h-4 w-4 text-purple-400" />
                          <span className="text-sm text-gray-300">
                            {Math.round(group.analytics.avgUsageTime / 1000)}s avg
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Tools Grid */}
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {group.tools.map((tool, toolIndex) => (
                      <Card key={toolIndex} className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 group">
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
                          
                          {/* Tool-specific analytics if available */}
                          {group.analytics?.topTools.find(tt => tt.name === tool.name) && (
                            <div className="mb-3 p-2 bg-white/5 rounded border border-white/10">
                              <div className="flex items-center justify-between text-xs text-gray-400">
                                <span>Usage: {group.analytics.topTools.find(tt => tt.name === tool.name)?.usageCount}</span>
                                <span>Avg: {Math.round((group.analytics.topTools.find(tt => tt.name === tool.name)?.avgTime || 0) / 1000)}s</span>
                              </div>
                            </div>
                          )}
                          
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
                                onClick={() => handleToolClick(tool)}
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
                                onClick={() => handleToolClick(tool)}
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
                </div>
              ))}

              {/* In-Content Ad after first group */}
              {filteredGroups.length > 0 && (
                <div className="my-8">
                  <InContentAd />
                </div>
              )}
            </div>
          )}

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
                      Version 1.3.0
                    </Badge>
                    <Badge variant="outline" className="bg-blue-500/20 text-blue-300 border-blue-500/30 px-4 py-2">
                      Grouped Analytics
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