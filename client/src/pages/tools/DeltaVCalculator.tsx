import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalculatorIcon, RocketIcon, TargetIcon, InfoIcon, CopyIcon, RefreshCwIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import SEO from "@/components/SEO";

interface DeltaVResult {
  total: number;
  breakdown: {
    stage: string;
    deltaV: number;
    description: string;
  }[];
  missionType: string;
  feasibility: string;
  notes: string[];
}

function DeltaVCalculator() {
  const [missionType, setMissionType] = useState<string>("leo");
  const [payload, setPayload] = useState<string>("1000");
  const [destination, setDestination] = useState<string>("leo");
  const [result, setResult] = useState<DeltaVResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const { toast } = useToast();

  const missionTypes = [
    { value: "leo", label: "Low Earth Orbit (LEO)", deltaV: 9400 },
    { value: "geo", label: "Geosynchronous Orbit (GEO)", deltaV: 13000 },
    { value: "moon", label: "Lunar Orbit", deltaV: 15000 },
    { value: "mars", label: "Mars Transfer", deltaV: 18000 },
    { value: "venus", label: "Venus Transfer", deltaV: 17000 },
    { value: "jupiter", label: "Jupiter Transfer", deltaV: 25000 },
    { value: "saturn", label: "Saturn Transfer", deltaV: 30000 },
    { value: "interstellar", label: "Interstellar Probe", deltaV: 50000 }
  ];

  const destinations = [
    { value: "leo", label: "Low Earth Orbit (LEO)", altitude: "200-2000 km" },
    { value: "geo", label: "Geosynchronous Orbit (GEO)", altitude: "35,786 km" },
    { value: "moon", label: "Lunar Orbit", altitude: "384,400 km" },
    { value: "mars", label: "Mars Orbit", altitude: "225 million km" },
    { value: "venus", label: "Venus Orbit", altitude: "108 million km" },
    { value: "jupiter", label: "Jupiter Orbit", altitude: "778 million km" },
    { value: "saturn", label: "Saturn Orbit", altitude: "1.4 billion km" }
  ];

  const calculateDeltaV = () => {
    setIsCalculating(true);
    
    // Simulate calculation delay
    setTimeout(() => {
      const selectedMission = missionTypes.find(m => m.value === missionType);
      const selectedDest = destinations.find(d => d.value === destination);
      const payloadMass = parseFloat(payload);
      
      if (!selectedMission || !selectedDest) return;

      let totalDeltaV = selectedMission.deltaV;
      let feasibility = "Feasible";
      let notes: string[] = [];

      // Adjust for payload mass
      if (payloadMass > 10000) {
        totalDeltaV += 2000;
        notes.push("High payload mass requires additional delta-v");
      } else if (payloadMass < 100) {
        totalDeltaV -= 500;
        notes.push("Low payload mass allows for delta-v savings");
      }

      // Mission-specific adjustments
      if (missionType === "mars") {
        notes.push("Requires optimal launch window (every 26 months)");
        notes.push("Consider aerobraking for orbital insertion");
      } else if (missionType === "jupiter") {
        notes.push("Requires gravity assists for efficiency");
        notes.push("Long mission duration (5+ years)");
      } else if (missionType === "interstellar") {
        feasibility = "Theoretical";
        notes.push("Requires advanced propulsion systems");
        notes.push("Mission duration: decades to centuries");
      }

      // Feasibility assessment
      if (totalDeltaV > 30000) {
        feasibility = "Challenging";
        notes.push("Requires multiple stages or advanced propulsion");
      }

      const breakdown = [
        {
          stage: "Earth Surface to LEO",
          deltaV: 9400,
          description: "Basic orbital insertion"
        },
        {
          stage: "LEO to Transfer Orbit",
          deltaV: selectedMission.deltaV - 9400,
          description: `Transfer to ${selectedDest?.label}`
        }
      ];

      if (missionType !== "leo") {
        breakdown.push({
          stage: "Orbital Insertion",
          deltaV: 1000,
          description: "Capture and circularization"
        });
      }

      setResult({
        total: totalDeltaV,
        breakdown,
        missionType: selectedMission.label,
        feasibility,
        notes
      });
      setIsCalculating(false);
    }, 1500);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Delta-V calculation copied to clipboard",
    });
  };

  const formatDeltaV = (deltaV: number) => {
    return `${deltaV.toLocaleString()} m/s`;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <SEO 
        title="Delta-V Calculator"
        description="Calculate delta-v requirements for space missions and orbital transfers. Plan your space missions with precision using our comprehensive delta-v calculator."
        keywords="delta-v calculator, space mission planning, orbital mechanics, rocket propulsion, space travel, orbital transfer, mission design"
        type="tool"
        contentType="educational, scientific, calculator"
        topic="space mission planning, orbital mechanics"
        expertise="rocket propulsion, orbital mechanics, space mission design"
      />
      
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <CalculatorIcon className="h-8 w-8 text-purple-400 mr-3" />
          <h1 className="text-4xl font-bold text-white">Delta-V Calculator</h1>
          <Badge variant="secondary" className="ml-3 bg-orange-500/20 text-orange-300 border-orange-500/30">
            Beta Experimental
          </Badge>
        </div>
        <p className="text-lg text-gray-300 max-w-2xl mx-auto">
          Calculate the delta-v requirements for space missions and orbital transfers. 
          Plan your space missions with precision using our comprehensive calculator.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Panel */}
        <div className="lg:col-span-1">
          <Card className="bg-gray-900/50 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <RocketIcon className="h-5 w-5 mr-2" />
                Mission Parameters
              </CardTitle>
              <CardDescription className="text-gray-400">
                Configure your space mission parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="mission-type" className="text-white">Mission Type</Label>
                <Select value={missionType} onValueChange={setMissionType}>
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                    <SelectValue placeholder="Select mission type" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    {missionTypes.map((mission) => (
                      <SelectItem key={mission.value} value={mission.value} className="text-white">
                        {mission.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="destination" className="text-white">Destination</Label>
                <Select value={destination} onValueChange={setDestination}>
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                    <SelectValue placeholder="Select destination" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    {destinations.map((dest) => (
                      <SelectItem key={dest.value} value={dest.value} className="text-white">
                        {dest.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payload" className="text-white">Payload Mass (kg)</Label>
                <Input
                  id="payload"
                  type="number"
                  value={payload}
                  onChange={(e) => setPayload(e.target.value)}
                  placeholder="1000"
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>

              <Button 
                onClick={calculateDeltaV} 
                disabled={isCalculating}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {isCalculating ? (
                  <>
                    <RefreshCwIcon className="h-4 w-4 mr-2 animate-spin" />
                    Calculating...
                  </>
                ) : (
                  <>
                    <CalculatorIcon className="h-4 w-4 mr-2" />
                    Calculate Delta-V
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2">
          {result ? (
            <div className="space-y-6">
              {/* Summary Card */}
              <Card className="bg-gray-900/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-white">
                    <span>Mission Summary</span>
                    <Badge 
                      variant={result.feasibility === "Feasible" ? "default" : 
                              result.feasibility === "Challenging" ? "secondary" : "destructive"}
                      className="ml-2"
                    >
                      {result.feasibility}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-gray-800/50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-400">
                        {formatDeltaV(result.total)}
                      </div>
                      <div className="text-sm text-gray-400">Total Delta-V</div>
                    </div>
                    <div className="text-center p-4 bg-gray-800/50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-400">
                        {result.missionType}
                      </div>
                      <div className="text-sm text-gray-400">Mission Type</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Breakdown Card */}
              <Card className="bg-gray-900/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Delta-V Breakdown</CardTitle>
                  <CardDescription className="text-gray-400">
                    Detailed breakdown of delta-v requirements by mission phase
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {result.breakdown.map((stage, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                        <div>
                          <div className="font-medium text-white">{stage.stage}</div>
                          <div className="text-sm text-gray-400">{stage.description}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-purple-400">
                            {formatDeltaV(stage.deltaV)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Notes Card */}
              {result.notes.length > 0 && (
                <Card className="bg-gray-900/50 border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center text-white">
                      <InfoIcon className="h-5 w-5 mr-2" />
                      Mission Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {result.notes.map((note, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-purple-400 mr-2">•</span>
                          <span className="text-gray-300">{note}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Button 
                  onClick={() => copyToClipboard(`Delta-V Calculation: ${formatDeltaV(result.total)} for ${result.missionType}`)}
                  variant="outline"
                  className="flex-1"
                >
                  <CopyIcon className="h-4 w-4 mr-2" />
                  Copy Results
                </Button>
                <Button 
                  onClick={() => setResult(null)}
                  variant="outline"
                  className="flex-1"
                >
                  <RefreshCwIcon className="h-4 w-4 mr-2" />
                  New Calculation
                </Button>
              </div>
            </div>
          ) : (
            <Card className="bg-gray-900/50 border-gray-700 h-full">
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center text-gray-400">
                  <TargetIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Configure mission parameters and click "Calculate Delta-V" to see results</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Information Tabs */}
      <div className="mt-12">
        <Tabs defaultValue="about" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-800">
            <TabsTrigger value="about" className="text-white">About Delta-V</TabsTrigger>
            <TabsTrigger value="examples" className="text-white">Mission Examples</TabsTrigger>
            <TabsTrigger value="formulas" className="text-white">Formulas</TabsTrigger>
          </TabsList>
          
          <TabsContent value="about" className="mt-6">
            <Card className="bg-gray-900/50 border-gray-700">
              <CardContent className="pt-6">
                <div className="prose prose-invert max-w-none">
                  <h3 className="text-white text-xl font-semibold mb-4">What is Delta-V?</h3>
                  <p className="text-gray-300 mb-4">
                    Delta-v (Δv) is a measure of the impulse needed to perform a maneuver in space. 
                    It represents the change in velocity required to achieve a specific orbital change 
                    or mission objective.
                  </p>
                  <p className="text-gray-300 mb-4">
                    Delta-v is typically measured in meters per second (m/s) and is a fundamental 
                    concept in orbital mechanics and space mission planning.
                  </p>
                  <h4 className="text-white text-lg font-semibold mb-2">Key Concepts:</h4>
                  <ul className="text-gray-300 space-y-1">
                    <li>• <strong>Orbital Insertion:</strong> Delta-v needed to enter orbit around a celestial body</li>
                    <li>• <strong>Orbital Transfer:</strong> Delta-v required to change from one orbit to another</li>
                    <li>• <strong>Escape Velocity:</strong> Delta-v needed to escape a celestial body's gravitational field</li>
                    <li>• <strong>Mission Planning:</strong> Total delta-v determines fuel requirements and mission feasibility</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="examples" className="mt-6">
            <Card className="bg-gray-900/50 border-gray-700">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-white text-lg font-semibold mb-3">Common Missions</h3>
                    <div className="space-y-3">
                      <div className="p-3 bg-gray-800/50 rounded-lg">
                        <div className="font-medium text-white">LEO to GEO</div>
                        <div className="text-sm text-gray-400">~3,600 m/s</div>
                      </div>
                      <div className="p-3 bg-gray-800/50 rounded-lg">
                        <div className="font-medium text-white">Earth to Moon</div>
                        <div className="text-sm text-gray-400">~15,000 m/s</div>
                      </div>
                      <div className="p-3 bg-gray-800/50 rounded-lg">
                        <div className="font-medium text-white">Earth to Mars</div>
                        <div className="text-sm text-gray-400">~18,000 m/s</div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-white text-lg font-semibold mb-3">Historical Missions</h3>
                    <div className="space-y-3">
                      <div className="p-3 bg-gray-800/50 rounded-lg">
                        <div className="font-medium text-white">Apollo 11</div>
                        <div className="text-sm text-gray-400">~15,000 m/s total</div>
                      </div>
                      <div className="p-3 bg-gray-800/50 rounded-lg">
                        <div className="font-medium text-white">Voyager 1</div>
                        <div className="text-sm text-gray-400">~25,000 m/s total</div>
                      </div>
                      <div className="p-3 bg-gray-800/50 rounded-lg">
                        <div className="font-medium text-white">New Horizons</div>
                        <div className="text-sm text-gray-400">~20,000 m/s total</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="formulas" className="mt-6">
            <Card className="bg-gray-900/50 border-gray-700">
              <CardContent className="pt-6">
                <div className="prose prose-invert max-w-none">
                  <h3 className="text-white text-xl font-semibold mb-4">Key Formulas</h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-800/50 rounded-lg">
                      <h4 className="text-white font-semibold mb-2">Tsiolkovsky Rocket Equation</h4>
                      <p className="text-gray-300 mb-2">Δv = vₑ × ln(m₀/m₁)</p>
                      <p className="text-sm text-gray-400">
                        Where vₑ is exhaust velocity, m₀ is initial mass, and m₁ is final mass
                      </p>
                    </div>
                    <div className="p-4 bg-gray-800/50 rounded-lg">
                      <h4 className="text-white font-semibold mb-2">Orbital Velocity</h4>
                      <p className="text-gray-300 mb-2">v = √(GM/r)</p>
                      <p className="text-sm text-gray-400">
                        Where G is gravitational constant, M is central body mass, r is orbital radius
                      </p>
                    </div>
                    <div className="p-4 bg-gray-800/50 rounded-lg">
                      <h4 className="text-white font-semibold mb-2">Hohmann Transfer</h4>
                      <p className="text-gray-300 mb-2">Δv = √(μ/r₁) × (√(2r₂/(r₁+r₂)) - 1)</p>
                      <p className="text-sm text-gray-400">
                        Most efficient transfer between circular orbits
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default DeltaVCalculator; 