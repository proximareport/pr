import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SparklesIcon, CopyIcon, RefreshCwIcon, RocketIcon, SatelliteIcon, TelescopeIcon, GlobeIcon, StarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Mission {
  name: string;
  type: string;
  objective: string;
  destination: string;
  duration: string;
  crew: string;
  technology: string;
  challenges: string[];
}

function MissionGenerator() {
  const [generatedMissions, setGeneratedMissions] = useState<Mission[]>([]);
  const [missionType, setMissionType] = useState("exploration");
  const [count, setCount] = useState(3);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const missionTypes = {
    exploration: {
      name: "Exploration Mission",
      description: "Discover new worlds and phenomena",
      objectives: [
        "Map uncharted regions of space",
        "Study unknown celestial phenomena",
        "Search for signs of extraterrestrial life",
        "Investigate mysterious cosmic events",
        "Explore asteroid belts and comets",
        "Study interstellar medium"
      ],
      destinations: [
        "Alpha Centauri system",
        "Oort Cloud",
        "Kuiper Belt",
        "Interstellar space",
        "Unknown exoplanet",
        "Rogue planet",
        "Neutron star",
        "Black hole vicinity"
      ],
      technologies: [
        "Advanced propulsion systems",
        "Cryogenic sleep chambers",
        "AI navigation systems",
        "Quantum communication",
        "Self-repairing materials",
        "Advanced life support"
      ]
    },
    colonization: {
      name: "Colonization Mission",
      description: "Establish human presence on new worlds",
      objectives: [
        "Establish permanent human settlement",
        "Build self-sustaining habitat",
        "Create agricultural systems",
        "Develop local resource extraction",
        "Establish communication networks",
        "Prepare for population expansion"
      ],
      destinations: [
        "Mars surface",
        "Lunar base",
        "Venus floating cities",
        "Europa subsurface",
        "Titan surface",
        "Ceres mining colony",
        "Space station network",
        "Orbital habitat"
      ],
      technologies: [
        "3D printing construction",
        "Closed-loop life support",
        "Radiation shielding",
        "In-situ resource utilization",
        "Advanced robotics",
        "Genetic engineering"
      ]
    },
    research: {
      name: "Research Mission",
      description: "Conduct scientific experiments and studies",
      objectives: [
        "Study cosmic radiation effects",
        "Research microgravity biology",
        "Investigate dark matter",
        "Study gravitational waves",
        "Research quantum phenomena",
        "Analyze cosmic rays"
      ],
      destinations: [
        "International Space Station",
        "Lagrange points",
        "Solar orbit",
        "Jupiter's moons",
        "Saturn's rings",
        "Comet surface",
        "Asteroid mining site",
        "Solar observatory"
      ],
      technologies: [
        "Precision instruments",
        "Quantum sensors",
        "Advanced telescopes",
        "Particle detectors",
        "Biological research labs",
        "Data analysis systems"
      ]
    },
    mining: {
      name: "Mining Mission",
      description: "Extract valuable resources from space",
      objectives: [
        "Extract rare minerals and metals",
        "Harvest water ice",
        "Collect helium-3",
        "Mine platinum group metals",
        "Extract construction materials",
        "Harvest solar energy"
      ],
      destinations: [
        "Near-Earth asteroids",
        "Lunar surface",
        "Martian moons",
        "Asteroid belt",
        "Comet nucleus",
        "Meteorite impact sites",
        "Space debris",
        "Solar power satellites"
      ],
      technologies: [
        "Automated mining robots",
        "Laser cutting systems",
        "Magnetic separators",
        "3D printing refineries",
        "Solar power arrays",
        "Transport systems"
      ]
    },
    defense: {
      name: "Defense Mission",
      description: "Protect Earth from cosmic threats",
      objectives: [
        "Monitor near-Earth objects",
        "Deflect asteroid impacts",
        "Track space debris",
        "Monitor solar storms",
        "Protect satellites",
        "Early warning systems"
      ],
      destinations: [
        "Earth orbit",
        "Lagrange points",
        "Near-Earth space",
        "Solar monitoring stations",
        "Asteroid deflection sites",
        "Space debris fields",
        "Solar storm monitoring",
        "Satellite protection zones"
      ],
      technologies: [
        "Kinetic impactors",
        "Gravity tractors",
        "Laser defense systems",
        "Solar sail technology",
        "Advanced sensors",
        "Autonomous defense drones"
      ]
    }
  };

  const crewSizes = ["1-3 astronauts", "4-6 astronauts", "7-12 astronauts", "20+ colonists", "Robotic only", "Mixed crew"];
  const durations = ["6 months", "1 year", "2-3 years", "5-10 years", "Permanent", "Indefinite"];
  
  const challenges = [
    "Radiation exposure",
    "Microgravity health effects",
    "Psychological isolation",
    "Equipment failure",
    "Communication delays",
    "Resource limitations",
    "Environmental hazards",
    "Technical malfunctions",
    "Crew conflicts",
    "Mission drift",
    "Unexpected discoveries",
    "Political complications"
  ];

  const generateMissions = () => {
    setIsGenerating(true);
    
    setTimeout(() => {
      const type = missionTypes[missionType as keyof typeof missionTypes];
      const missions: Mission[] = [];
      
      for (let i = 0; i < count; i++) {
        const objective = type.objectives[Math.floor(Math.random() * type.objectives.length)];
        const destination = type.destinations[Math.floor(Math.random() * type.destinations.length)];
        const technology = type.technologies[Math.floor(Math.random() * type.technologies.length)];
        const crew = crewSizes[Math.floor(Math.random() * crewSizes.length)];
        const duration = durations[Math.floor(Math.random() * durations.length)];
        
        // Generate mission name
        const missionNames = [
          `Project ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(Math.random() * 999) + 1}`,
          `Mission ${type.name.split(' ')[0]} ${Math.floor(Math.random() * 999) + 1}`,
          `${destination.split(' ')[0]} ${type.name.split(' ')[0]}`,
          `Operation ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`,
          `${technology.split(' ')[0]} ${type.name.split(' ')[0]}`,
        ];
        
        const name = missionNames[Math.floor(Math.random() * missionNames.length)];
        
        // Generate 2-3 random challenges
        const missionChallenges = [];
        const numChallenges = Math.floor(Math.random() * 2) + 2; // 2-3 challenges
        const shuffledChallenges = [...challenges].sort(() => 0.5 - Math.random());
        for (let j = 0; j < numChallenges; j++) {
          missionChallenges.push(shuffledChallenges[j]);
        }
        
        missions.push({
          name,
          type: type.name,
          objective,
          destination,
          duration,
          crew,
          technology,
          challenges: missionChallenges
        });
      }
      
      setGeneratedMissions(missions);
      setIsGenerating(false);
    }, 1000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Mission details copied to clipboard",
    });
  };

  const copyAllToClipboard = () => {
    const allMissions = generatedMissions.map(mission => 
      `${mission.name}: ${mission.objective} to ${mission.destination}`
    ).join("\n");
    navigator.clipboard.writeText(allMissions);
    toast({
      title: "Copied!",
      description: "All mission details copied to clipboard",
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Exploration Mission":
        return <TelescopeIcon className="h-4 w-4" />;
      case "Colonization Mission":
        return <GlobeIcon className="h-4 w-4" />;
      case "Research Mission":
        return <StarIcon className="h-4 w-4" />;
      case "Mining Mission":
        return <SatelliteIcon className="h-4 w-4" />;
      case "Defense Mission":
        return <RocketIcon className="h-4 w-4" />;
      default:
        return <SparklesIcon className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0F] via-[#14141E] to-[#1A1A2E]">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4 bg-purple-500/20 text-purple-300 border-purple-500/30">
            <SparklesIcon className="w-3 h-3 mr-1" />
            Mission Generator
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-6">
            Space Mission Generator
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Generate creative space mission concepts and scenarios. Perfect for sci-fi writing, 
            game design, and space exploration planning.
          </p>
        </div>

        {/* Controls */}
        <div className="max-w-4xl mx-auto mb-12">
          <Card className="bg-gray-900/50 border border-gray-800/50">
            <CardContent className="p-6">
              <div className="grid gap-6 md:grid-cols-3">
                <div>
                  <Label htmlFor="missionType" className="text-gray-300">Mission Type</Label>
                  <Select value={missionType} onValueChange={setMissionType}>
                    <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      {Object.entries(missionTypes).map(([key, type]) => (
                        <SelectItem key={key} value={key}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-gray-400 text-sm mt-2">
                    {missionTypes[missionType as keyof typeof missionTypes].description}
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="count" className="text-gray-300">Number of Missions</Label>
                  <Input
                    id="count"
                    type="number"
                    min="1"
                    max="10"
                    value={count}
                    onChange={(e) => setCount(parseInt(e.target.value) || 1)}
                    className="bg-gray-800/50 border-gray-700 text-white"
                  />
                </div>
                
                <div className="flex items-end">
                  <Button 
                    onClick={generateMissions}
                    disabled={isGenerating}
                    className="w-full bg-gradient-to-r from-purple-600 to-violet-700 hover:from-purple-700 hover:to-violet-800"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCwIcon className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <SparklesIcon className="h-4 w-4 mr-2" />
                        Generate Missions
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        {generatedMissions.length > 0 && (
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                Generated Missions ({generatedMissions.length})
              </h2>
              <Button 
                onClick={copyAllToClipboard}
                variant="outline"
                className="border-purple-500 text-purple-400 hover:bg-purple-500/10"
              >
                <CopyIcon className="h-4 w-4 mr-2" />
                Copy All
              </Button>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2">
              {generatedMissions.map((mission, index) => (
                <Card key={index} className="bg-gray-900/50 border border-gray-800/50 hover:border-purple-500/30 transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(mission.type)}
                        <CardTitle className="text-white text-lg">{mission.name}</CardTitle>
                      </div>
                      <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                        {mission.type}
                      </Badge>
                    </div>
                    <CardDescription className="text-gray-400">
                      {mission.objective}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Destination:</span>
                        <span className="text-gray-300">{mission.destination}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Duration:</span>
                        <span className="text-gray-300">{mission.duration}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Crew:</span>
                        <span className="text-gray-300">{mission.crew}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Technology:</span>
                        <span className="text-gray-300">{mission.technology}</span>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-semibold text-purple-400 mb-2">Challenges:</h4>
                      <div className="flex flex-wrap gap-1">
                        {mission.challenges.map((challenge, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs border-gray-600 text-gray-300">
                            {challenge}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <Button 
                      onClick={() => copyToClipboard(`${mission.name}: ${mission.objective} to ${mission.destination}`)}
                      size="sm"
                      variant="outline"
                      className="w-full border-gray-700 text-gray-300 hover:border-purple-500 hover:text-purple-400"
                    >
                      <CopyIcon className="h-4 w-4 mr-2" />
                      Copy Mission
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="mt-16 max-w-4xl mx-auto">
          <Card className="bg-gray-900/30 border border-gray-800/50">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Mission Planning Tips</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-semibold text-purple-400 mb-2">For Exploration Missions</h4>
                  <ul className="text-gray-300 text-sm space-y-1">
                    <li>• Focus on scientific objectives</li>
                    <li>• Plan for unexpected discoveries</li>
                    <li>• Include flexible timelines</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-purple-400 mb-2">For Colonization Missions</h4>
                  <ul className="text-gray-300 text-sm space-y-1">
                    <li>• Consider long-term sustainability</li>
                    <li>• Plan for population growth</li>
                    <li>• Include resource management</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default MissionGenerator; 