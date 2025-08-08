import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { 
  AtomIcon, 
  StarIcon, 
  GlobeIcon, 
  ZapIcon, 
  PlayIcon, 
  PauseIcon, 
  RotateCcwIcon,
  InfoIcon,
  CopyIcon,
  DownloadIcon
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import SEO from "@/components/SEO";

interface SimulationState {
  isRunning: boolean;
  time: number;
  step: number;
}

interface BlackHoleSimulation {
  mass: number;
  distance: number;
  velocity: number;
  timeDilation: number;
  gravitationalForce: number;
}

interface StellarEvolution {
  mass: number;
  age: number;
  temperature: number;
  luminosity: number;
  radius: number;
  stage: string;
}

function AstrophysicsPlayground() {
  const [activeSimulation, setActiveSimulation] = useState<string>("blackhole");
  const [simulationState, setSimulationState] = useState<SimulationState>({
    isRunning: false,
    time: 0,
    step: 0
  });
  const [blackHoleData, setBlackHoleData] = useState<BlackHoleSimulation>({
    mass: 10,
    distance: 1000,
    velocity: 0.1,
    timeDilation: 1.0,
    gravitationalForce: 6.67e-11
  });
  const [stellarData, setStellarEvolution] = useState<StellarEvolution>({
    mass: 1.0,
    age: 0,
    temperature: 5778,
    luminosity: 1.0,
    radius: 1.0,
    stage: "Main Sequence"
  });
  const { toast } = useToast();

  const simulations = [
    {
      id: "blackhole",
      name: "Black Hole Simulator",
      description: "Explore gravitational effects and time dilation near black holes",
      icon: <AtomIcon className="h-6 w-6" />
    },
    {
      id: "stellar",
      name: "Stellar Evolution",
      description: "Watch stars evolve from birth to death",
      icon: <StarIcon className="h-6 w-6" />
    },
    {
      id: "orbital",
      name: "Orbital Mechanics",
      description: "Simulate planetary orbits and gravitational interactions",
      icon: <GlobeIcon className="h-6 w-6" />
    },
    {
      id: "cosmic",
      name: "Cosmic Expansion",
      description: "Visualize the expansion of the universe",
      icon: <ZapIcon className="h-6 w-6" />
    }
  ];

  const startSimulation = () => {
    setSimulationState(prev => ({ ...prev, isRunning: true }));
    toast({
      title: "Simulation Started",
      description: "The astrophysics simulation is now running",
    });
  };

  const pauseSimulation = () => {
    setSimulationState(prev => ({ ...prev, isRunning: false }));
    toast({
      title: "Simulation Paused",
      description: "The simulation has been paused",
    });
  };

  const resetSimulation = () => {
    setSimulationState({ isRunning: false, time: 0, step: 0 });
    toast({
      title: "Simulation Reset",
      description: "The simulation has been reset to initial conditions",
    });
  };

  const updateBlackHoleSimulation = (mass: number, distance: number, velocity: number) => {
    const G = 6.67e-11;
    const c = 3e8;
    const rs = (2 * G * mass * 1.989e30) / (c * c); // Schwarzschild radius
    
    const timeDilation = 1 / Math.sqrt(1 - (rs / distance));
    const gravitationalForce = (G * mass * 1.989e30) / (distance * distance);
    
    setBlackHoleData({
      mass,
      distance,
      velocity,
      timeDilation,
      gravitationalForce
    });
  };

  const updateStellarEvolution = (mass: number, age: number) => {
    // Simplified stellar evolution model
    let temperature = 5778;
    let luminosity = 1.0;
    let radius = 1.0;
    let stage = "Main Sequence";

    if (age < 1e9) {
      stage = "Protostar";
      temperature = 3000 + (age / 1e9) * 2778;
      luminosity = 0.1 + (age / 1e9) * 0.9;
      radius = 2.0 - (age / 1e9);
    } else if (age < 1e10) {
      stage = "Main Sequence";
      temperature = 5778;
      luminosity = Math.pow(mass, 3.5);
      radius = Math.pow(mass, 0.8);
    } else if (age < 1.2e10) {
      stage = "Red Giant";
      temperature = 3000;
      luminosity = 100;
      radius = 100;
    } else {
      stage = "White Dwarf";
      temperature = 10000;
      luminosity = 0.01;
      radius = 0.01;
    }

    setStellarEvolution({
      mass,
      age,
      temperature,
      luminosity,
      radius,
      stage
    });
  };

  const copyResults = () => {
    const results = `Astrophysics Simulation Results:
Simulation: ${activeSimulation}
Time: ${simulationState.time}s
Step: ${simulationState.step}`;
    
    navigator.clipboard.writeText(results);
    toast({
      title: "Results Copied",
      description: "Simulation results copied to clipboard",
    });
  };

  const renderBlackHoleSimulation = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gray-900/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Parameters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-white">Black Hole Mass (Solar Masses)</Label>
              <Slider
                value={[blackHoleData.mass]}
                onValueChange={(value) => updateBlackHoleSimulation(value[0], blackHoleData.distance, blackHoleData.velocity)}
                max={100}
                min={1}
                step={1}
                className="mt-2"
              />
              <div className="text-sm text-gray-400 mt-1">{blackHoleData.mass} M☉</div>
            </div>
            
            <div>
              <Label className="text-white">Distance (km)</Label>
              <Slider
                value={[blackHoleData.distance]}
                onValueChange={(value) => updateBlackHoleSimulation(blackHoleData.mass, value[0], blackHoleData.velocity)}
                max={10000}
                min={100}
                step={100}
                className="mt-2"
              />
              <div className="text-sm text-gray-400 mt-1">{blackHoleData.distance.toLocaleString()} km</div>
            </div>
            
            <div>
              <Label className="text-white">Velocity (c)</Label>
              <Slider
                value={[blackHoleData.velocity]}
                onValueChange={(value) => updateBlackHoleSimulation(blackHoleData.mass, blackHoleData.distance, value[0])}
                max={0.99}
                min={0.01}
                step={0.01}
                className="mt-2"
              />
              <div className="text-sm text-gray-400 mt-1">{blackHoleData.velocity}c</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-gray-800/50 rounded-lg">
              <div className="text-sm text-gray-400">Time Dilation Factor</div>
              <div className="text-xl font-bold text-purple-400">
                {blackHoleData.timeDilation.toFixed(4)}
              </div>
            </div>
            
            <div className="p-3 bg-gray-800/50 rounded-lg">
              <div className="text-sm text-gray-400">Gravitational Force</div>
              <div className="text-xl font-bold text-blue-400">
                {(blackHoleData.gravitationalForce / 1e6).toFixed(2)} MN
              </div>
            </div>
            
            <div className="p-3 bg-gray-800/50 rounded-lg">
              <div className="text-sm text-gray-400">Schwarzschild Radius</div>
              <div className="text-xl font-bold text-red-400">
                {((2 * 6.67e-11 * blackHoleData.mass * 1.989e30) / (3e8 * 3e8) / 1000).toFixed(2)} km
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gray-900/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Visualization</CardTitle>
          <CardDescription className="text-gray-400">
            Interactive visualization of the black hole's gravitational field
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gradient-radial from-purple-900/20 via-gray-800/50 to-gray-900 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-black rounded-full mx-auto mb-4 border-2 border-purple-400 shadow-lg shadow-purple-400/50"></div>
              <div className="text-white font-semibold">Black Hole</div>
              <div className="text-gray-400 text-sm">{blackHoleData.mass} M☉</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderStellarEvolution = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gray-900/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Star Parameters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-white">Mass (Solar Masses)</Label>
              <Slider
                value={[stellarData.mass]}
                onValueChange={(value) => updateStellarEvolution(value[0], stellarData.age)}
                max={20}
                min={0.1}
                step={0.1}
                className="mt-2"
              />
              <div className="text-sm text-gray-400 mt-1">{stellarData.mass} M☉</div>
            </div>
            
            <div>
              <Label className="text-white">Age (Years)</Label>
              <Slider
                value={[stellarData.age]}
                onValueChange={(value) => updateStellarEvolution(stellarData.mass, value[0])}
                max={1.5e10}
                min={0}
                step={1e8}
                className="mt-2"
              />
              <div className="text-sm text-gray-400 mt-1">
                {(stellarData.age / 1e9).toFixed(1)} billion years
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Stellar Properties</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-gray-800/50 rounded-lg">
              <div className="text-sm text-gray-400">Evolutionary Stage</div>
              <div className="text-xl font-bold text-yellow-400">{stellarData.stage}</div>
            </div>
            
            <div className="p-3 bg-gray-800/50 rounded-lg">
              <div className="text-sm text-gray-400">Temperature</div>
              <div className="text-xl font-bold text-orange-400">
                {stellarData.temperature.toLocaleString()} K
              </div>
            </div>
            
            <div className="p-3 bg-gray-800/50 rounded-lg">
              <div className="text-sm text-gray-400">Luminosity</div>
              <div className="text-xl font-bold text-blue-400">
                {stellarData.luminosity.toFixed(2)} L☉
              </div>
            </div>
            
            <div className="p-3 bg-gray-800/50 rounded-lg">
              <div className="text-sm text-gray-400">Radius</div>
              <div className="text-xl font-bold text-red-400">
                {stellarData.radius.toFixed(2)} R☉
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gray-900/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Stellar Evolution Timeline</CardTitle>
          <CardDescription className="text-gray-400">
            Visual representation of the star's evolution
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-32 bg-gradient-to-r from-blue-900 via-yellow-600 to-red-900 rounded-lg flex items-center justify-center relative">
            <div 
              className="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg"
              style={{ 
                left: `${(stellarData.age / 1.5e10) * 100}%`,
                transform: 'translate(-50%, -50%)'
              }}
            ></div>
            <div className="text-white font-semibold text-center">
              <div>{stellarData.stage}</div>
              <div className="text-sm">{(stellarData.age / 1e9).toFixed(1)} Gyr</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderOrbitalMechanics = () => (
    <Card className="bg-gray-900/50 border-gray-700">
      <CardContent className="pt-6">
        <div className="text-center text-gray-400">
          <GlobeIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p>Orbital Mechanics simulation coming soon...</p>
          <p className="text-sm mt-2">Interactive planetary orbit visualization</p>
        </div>
      </CardContent>
    </Card>
  );

  const renderCosmicExpansion = () => (
    <Card className="bg-gray-900/50 border-gray-700">
      <CardContent className="pt-6">
        <div className="text-center text-gray-400">
          <ZapIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p>Cosmic Expansion simulation coming soon...</p>
          <p className="text-sm mt-2">Universe expansion visualization</p>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <SEO 
        title="Astrophysics Playground"
        description="Interactive simulations and experiments for astrophysics concepts. Explore black holes, stellar evolution, orbital mechanics, and cosmic phenomena."
        keywords="astrophysics playground, black hole simulator, stellar evolution, orbital mechanics, cosmic expansion, space simulations, physics experiments"
        type="tool"
        contentType="educational, scientific, simulation"
        topic="astrophysics, space physics, stellar evolution"
        expertise="astrophysics, black holes, stellar physics, orbital mechanics"
      />
      
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <AtomIcon className="h-8 w-8 text-purple-400 mr-3" />
          <h1 className="text-4xl font-bold text-white">Astrophysics Playground</h1>
          <Badge variant="secondary" className="ml-3 bg-orange-500/20 text-orange-300 border-orange-500/30">
            Beta Experimental
          </Badge>
        </div>
        <p className="text-lg text-gray-300 max-w-2xl mx-auto">
          Interactive simulations and experiments for astrophysics concepts. 
          Explore the wonders of the universe through hands-on learning.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        {simulations.map((sim) => (
          <Card 
            key={sim.id}
            className={`cursor-pointer transition-all ${
              activeSimulation === sim.id 
                ? 'bg-purple-900/20 border-purple-500' 
                : 'bg-gray-900/50 border-gray-700 hover:border-gray-600'
            }`}
            onClick={() => setActiveSimulation(sim.id)}
          >
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="flex justify-center mb-3">
                  {sim.icon}
                </div>
                <h3 className="font-semibold text-white mb-2">{sim.name}</h3>
                <p className="text-sm text-gray-400">{sim.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Simulation Controls */}
      <Card className="bg-gray-900/50 border-gray-700 mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-white">
                <div className="text-sm text-gray-400">Simulation Time</div>
                <div className="font-semibold">{simulationState.time.toFixed(1)}s</div>
              </div>
              <div className="text-white">
                <div className="text-sm text-gray-400">Step</div>
                <div className="font-semibold">{simulationState.step}</div>
              </div>
            </div>
            
            <div className="flex space-x-2">
              {simulationState.isRunning ? (
                <Button onClick={pauseSimulation} variant="outline" size="sm">
                  <PauseIcon className="h-4 w-4 mr-2" />
                  Pause
                </Button>
              ) : (
                <Button onClick={startSimulation} variant="outline" size="sm">
                  <PlayIcon className="h-4 w-4 mr-2" />
                  Start
                </Button>
              )}
              <Button onClick={resetSimulation} variant="outline" size="sm">
                <RotateCcwIcon className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button onClick={copyResults} variant="outline" size="sm">
                <CopyIcon className="h-4 w-4 mr-2" />
                Copy
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Simulation Content */}
      <div className="mb-8">
        {activeSimulation === "blackhole" && renderBlackHoleSimulation()}
        {activeSimulation === "stellar" && renderStellarEvolution()}
        {activeSimulation === "orbital" && renderOrbitalMechanics()}
        {activeSimulation === "cosmic" && renderCosmicExpansion()}
      </div>

      {/* Information Tabs */}
      <Tabs defaultValue="about" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-gray-800">
          <TabsTrigger value="about" className="text-white">About</TabsTrigger>
          <TabsTrigger value="physics" className="text-white">Physics</TabsTrigger>
          <TabsTrigger value="resources" className="text-white">Resources</TabsTrigger>
        </TabsList>
        
        <TabsContent value="about" className="mt-6">
          <Card className="bg-gray-900/50 border-gray-700">
            <CardContent className="pt-6">
              <div className="prose prose-invert max-w-none">
                <h3 className="text-white text-xl font-semibold mb-4">About Astrophysics Playground</h3>
                <p className="text-gray-300 mb-4">
                  The Astrophysics Playground provides interactive simulations to explore fundamental 
                  concepts in astrophysics and space science. These tools help visualize complex 
                  phenomena that are otherwise difficult to observe directly.
                </p>
                <h4 className="text-white text-lg font-semibold mb-2">Available Simulations:</h4>
                <ul className="text-gray-300 space-y-1">
                  <li>• <strong>Black Hole Simulator:</strong> Explore gravitational effects and time dilation</li>
                  <li>• <strong>Stellar Evolution:</strong> Watch stars evolve from birth to death</li>
                  <li>• <strong>Orbital Mechanics:</strong> Simulate planetary orbits and gravitational interactions</li>
                  <li>• <strong>Cosmic Expansion:</strong> Visualize the expansion of the universe</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="physics" className="mt-6">
          <Card className="bg-gray-900/50 border-gray-700">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-white text-lg font-semibold mb-3">Key Physics Concepts</h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-gray-800/50 rounded-lg">
                      <div className="font-medium text-white">General Relativity</div>
                      <div className="text-sm text-gray-400">Spacetime curvature and gravitational effects</div>
                    </div>
                    <div className="p-3 bg-gray-800/50 rounded-lg">
                      <div className="font-medium text-white">Stellar Physics</div>
                      <div className="text-sm text-gray-400">Nuclear fusion and stellar structure</div>
                    </div>
                    <div className="p-3 bg-gray-800/50 rounded-lg">
                      <div className="font-medium text-white">Orbital Mechanics</div>
                      <div className="text-sm text-gray-400">Kepler's laws and gravitational dynamics</div>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-white text-lg font-semibold mb-3">Mathematical Models</h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-gray-800/50 rounded-lg">
                      <div className="font-medium text-white">Schwarzschild Metric</div>
                      <div className="text-sm text-gray-400">Black hole spacetime geometry</div>
                    </div>
                    <div className="p-3 bg-gray-800/50 rounded-lg">
                      <div className="font-medium text-white">Stellar Evolution</div>
                      <div className="text-sm text-gray-400">Mass-luminosity relationships</div>
                    </div>
                    <div className="p-3 bg-gray-800/50 rounded-lg">
                      <div className="font-medium text-white">Hubble's Law</div>
                      <div className="text-sm text-gray-400">Cosmic expansion rate</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources" className="mt-6">
          <Card className="bg-gray-900/50 border-gray-700">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-white text-lg font-semibold mb-3">Learning Resources</h3>
                  <div className="space-y-3">
                    <a href="https://www.nasa.gov" target="_blank" rel="noopener noreferrer" className="block p-3 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition-colors">
                      <div className="font-medium text-white">NASA Astrophysics</div>
                      <div className="text-sm text-gray-400">Official NASA astrophysics resources</div>
                    </a>
                    <a href="https://www.esa.int" target="_blank" rel="noopener noreferrer" className="block p-3 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition-colors">
                      <div className="font-medium text-white">ESA Science</div>
                      <div className="text-sm text-gray-400">European Space Agency science portal</div>
                    </a>
                    <a href="https://www.space.com" target="_blank" rel="noopener noreferrer" className="block p-3 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition-colors">
                      <div className="font-medium text-white">Space.com</div>
                      <div className="text-sm text-gray-400">Space news and educational content</div>
                    </a>
                  </div>
                </div>
                <div>
                  <h3 className="text-white text-lg font-semibold mb-3">Advanced Topics</h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-gray-800/50 rounded-lg">
                      <div className="font-medium text-white">Quantum Mechanics</div>
                      <div className="text-sm text-gray-400">Particle physics and quantum effects</div>
                    </div>
                    <div className="p-3 bg-gray-800/50 rounded-lg">
                      <div className="font-medium text-white">Cosmology</div>
                      <div className="text-sm text-gray-400">Origin and evolution of the universe</div>
                    </div>
                    <div className="p-3 bg-gray-800/50 rounded-lg">
                      <div className="font-medium text-white">Exoplanets</div>
                      <div className="text-sm text-gray-400">Planets beyond our solar system</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AstrophysicsPlayground; 