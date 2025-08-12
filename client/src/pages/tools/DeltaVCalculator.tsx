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
  fuelMass: number;
  totalMass: number;
  engineSpecs: {
    type: string;
    cycles: number;
    efficiency: number;
    thrust: number;
  };
}

interface VehicleSpecs {
  dryMass: number;
  propellantType: string;
  engineType: string;
  engineCycles: number;
  mode: string;
  company: string;
  weatherFactor: number;
  atmosphericConditions: string;
  launchType: string; // "earth_launch" or "spacecraft"
  currentOrbit: string; // "leo", "geo", "lunar", "mars", etc.
  currentAltitude: number; // km
}

function DeltaVCalculator() {
  const [missionType, setMissionType] = useState<string>("leo");
  const [payload, setPayload] = useState<string>("1000");
  const [destination, setDestination] = useState<string>("leo");
  const [vehicleSpecs, setVehicleSpecs] = useState<VehicleSpecs>({
    dryMass: 5000,
    propellantType: "rp1_lox",
    engineType: "merlin_1d",
    engineCycles: 1,
    mode: "sea_level",
    company: "spacex",
    weatherFactor: 1.0,
    atmosphericConditions: "standard",
    launchType: "earth_launch",
    currentOrbit: "leo",
    currentAltitude: 400
  });
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

  // Realistic constraints for different mission types
  const missionConstraints = {
    leo: { maxMassRatio: 15, maxDeltaV: 12000, difficulty: "Easy" },
    geo: { maxMassRatio: 12, maxDeltaV: 16000, difficulty: "Moderate" },
    moon: { maxMassRatio: 10, maxDeltaV: 20000, difficulty: "Difficult" },
    mars: { maxMassRatio: 8, maxDeltaV: 25000, difficulty: "Challenging" },
    venus: { maxMassRatio: 8, maxDeltaV: 22000, difficulty: "Challenging" },
    jupiter: { maxMassRatio: 6, maxDeltaV: 35000, difficulty: "Very Challenging" },
    saturn: { maxMassRatio: 5, maxDeltaV: 40000, difficulty: "Very Challenging" },
    interstellar: { maxMassRatio: 3, maxDeltaV: 100000, difficulty: "Theoretical" }
  };

  const destinations = [
    { value: "leo", label: "Low Earth Orbit (LEO)", altitude: "200-2000 km" },
    { value: "geo", label: "Geosynchronous Orbit (GEO)", altitude: "35,786 km" },
    { value: "moon", label: "Lunar Orbit", altitude: "384,400 km" },
    { value: "mars", label: "Mars Orbit", altitude: "225 million km" },
    { value: "venus", label: "Venus Orbit", altitude: "108 million km" },
    { value: "jupiter", label: "Jupiter Orbit", altitude: "778 million km" },
    { value: "saturn", label: "Saturn Orbit", altitude: "1.4 billion km" }
  ];

  const propellantTypes = [
    { value: "rp1_lox", label: "RP-1/LOX (Kerosene)", isp: 311, density: 1000 },
    { value: "lh2_lox", label: "LH2/LOX (Hydrogen)", isp: 450, density: 360 },
    { value: "udmh_n2o4", label: "UDMH/N2O4", isp: 318, density: 1200 },
    { value: "solid", label: "Solid Propellant", isp: 250, density: 1800 },
    { value: "electric", label: "Electric Propulsion", isp: 3000, density: 100 },
    { value: "nuclear", label: "Nuclear Thermal", isp: 900, density: 800 }
  ];

  const engineTypes = [
    { value: "merlin_1d", label: "Merlin 1D (SpaceX)", thrust: 845, cycles: 1, company: "SpaceX" },
    { value: "raptor", label: "Raptor (SpaceX)", thrust: 2200, cycles: 2, company: "SpaceX" },
    { value: "rd_180", label: "RD-180 (Energomash)", thrust: 4152, cycles: 2, company: "Energomash" },
    { value: "rs_25", label: "RS-25 (Aerojet)", thrust: 2278, cycles: 1, company: "Aerojet" },
    { value: "vega_engine", label: "Vega Engine (ESA)", thrust: 2500, cycles: 1, company: "ESA" },
    { value: "custom", label: "Custom Engine", thrust: 1000, cycles: 1, company: "Custom" }
  ];

  const companies = [
    { value: "spacex", label: "SpaceX", reliability: 0.98, costFactor: 0.8 },
    { value: "blue_origin", label: "Blue Origin", reliability: 0.95, costFactor: 0.9 },
    { value: "ula", label: "United Launch Alliance", reliability: 0.99, costFactor: 1.2 },
    { value: "arianespace", label: "Arianespace", reliability: 0.97, costFactor: 1.1 },
    { value: "roscosmos", label: "Roscosmos", reliability: 0.94, costFactor: 0.7 },
    { value: "custom", label: "Custom/Experimental", reliability: 0.85, costFactor: 0.6 }
  ];

  const weatherConditions = [
    { value: "standard", label: "Standard Conditions", factor: 1.0, description: "Normal launch conditions" },
    { value: "high_wind", label: "High Wind", factor: 1.15, description: "Increased atmospheric drag" },
    { value: "high_temp", label: "High Temperature", factor: 1.08, description: "Reduced engine efficiency" },
    { value: "high_humidity", label: "High Humidity", factor: 1.05, description: "Slight performance impact" },
    { value: "storm", label: "Storm Conditions", factor: 1.25, description: "Significant performance impact" },
    { value: "optimal", label: "Optimal Conditions", factor: 0.95, description: "Best possible performance" },
    { value: "space", label: "Space Environment", factor: 1.0, description: "No atmospheric effects" }
  ];

  const launchTypes = [
    { value: "earth_launch", label: "Earth Launch", description: "Rocket launching from Earth's surface" },
    { value: "spacecraft", label: "Spacecraft Maneuver", description: "Vehicle already in space performing maneuvers" }
  ];

  const currentOrbits = [
    { value: "leo", label: "Low Earth Orbit (LEO)", altitude: 400, deltaV: 0 },
    { value: "geo", label: "Geosynchronous Orbit (GEO)", altitude: 35786, deltaV: 0 },
    { value: "lunar", label: "Lunar Orbit", altitude: 384400, deltaV: 0 },
    { value: "mars", label: "Mars Orbit", altitude: 225000000, deltaV: 0 },
    { value: "venus", label: "Venus Orbit", altitude: 108000000, deltaV: 0 },
    { value: "jupiter", label: "Jupiter Orbit", altitude: 778000000, deltaV: 0 },
    { value: "saturn", label: "Saturn Orbit", altitude: 1400000000, deltaV: 0 },
    { value: "custom", label: "Custom Orbit", altitude: 0, deltaV: 0 }
  ];

  const calculateDeltaV = () => {
    setIsCalculating(true);
    
    // Simulate calculation delay
    setTimeout(() => {
      const selectedMission = missionTypes.find(m => m.value === missionType);
      const selectedDest = destinations.find(d => d.value === destination);
      const selectedPropellant = propellantTypes.find(p => p.value === vehicleSpecs.propellantType);
      const selectedEngine = engineTypes.find(e => e.value === vehicleSpecs.engineType);
      const selectedCompany = companies.find(c => c.value === vehicleSpecs.company);
      const selectedWeather = weatherConditions.find(w => w.value === vehicleSpecs.atmosphericConditions);
      
      const payloadMass = parseFloat(payload);
      const dryMass = vehicleSpecs.dryMass;
      
      if (!selectedMission || !selectedDest || !selectedPropellant || !selectedEngine || !selectedCompany || !selectedWeather) return;

      // Start with base mission delta-v
      let totalDeltaV = selectedMission.deltaV;
      let feasibility = "Feasible";
      let notes: string[] = [];

      // Calculate total mass and mass ratio
      const totalMass = dryMass + payloadMass;
      const massRatio = totalMass / dryMass;
      
      // Handle different launch types
      if (vehicleSpecs.launchType === "spacecraft") {
        // Spacecraft already in space - no atmospheric effects
        notes.push("Spacecraft maneuver - no atmospheric drag or weather effects");
        
        // Calculate delta-v from current orbit to target
        const currentOrbitData = currentOrbits.find(o => o.value === vehicleSpecs.currentOrbit);
        if (currentOrbitData && currentOrbitData.value !== "custom") {
          if (vehicleSpecs.currentOrbit === "leo" && missionType !== "leo") {
            // From LEO to other destinations
            totalDeltaV = selectedMission.deltaV - 9400; // Remove Earth surface to LEO
            notes.push(`Calculating from ${currentOrbitData.label} (${vehicleSpecs.currentAltitude} km)`);
          } else if (vehicleSpecs.currentOrbit === missionType) {
            // Already at destination
            totalDeltaV = 0;
            notes.push("Already at target destination");
          } else {
            // Interplanetary transfer from current orbit
            totalDeltaV = selectedMission.deltaV - 9400; // Approximate
            notes.push(`Interplanetary transfer from ${currentOrbitData.label}`);
          }
        } else if (vehicleSpecs.currentOrbit === "custom") {
          // Custom orbit altitude
          const customAltitude = vehicleSpecs.currentAltitude;
          if (customAltitude < 2000) {
            // Suborbital or very low orbit
            totalDeltaV = selectedMission.deltaV - (customAltitude / 2000) * 9400;
            notes.push(`Custom orbit at ${customAltitude} km altitude`);
          } else {
            // Higher orbit
            totalDeltaV = selectedMission.deltaV - 9400;
            notes.push(`Custom orbit at ${customAltitude} km altitude`);
          }
        }
      } else {
        // Earth launch - apply weather factors
        const weatherMultiplier = selectedWeather.factor;
        totalDeltaV *= weatherMultiplier;
        if (weatherMultiplier !== 1.0) {
          notes.push(`${selectedWeather.label}: ${selectedWeather.description}`);
        }
      }

      // Apply company reliability factor (affects overall mission success)
      const reliabilityMultiplier = 1 + (1 - selectedCompany.reliability) * 0.3; // Reduced impact
      totalDeltaV *= reliabilityMultiplier;
      notes.push(`${selectedCompany.label} reliability factor: ${(selectedCompany.reliability * 100).toFixed(1)}%`);

      // Mass ratio penalties (realistic constraints)
      if (massRatio > 15) {
        totalDeltaV += 5000;
        notes.push("Extremely high mass ratio - mission likely impossible");
        feasibility = "Impossible";
      } else if (massRatio > 10) {
        totalDeltaV += 3000;
        notes.push("Very high mass ratio requires significant additional delta-v");
        feasibility = "Challenging";
      } else if (massRatio > 6) {
        totalDeltaV += 1500;
        notes.push("High mass ratio requires additional delta-v");
      } else if (massRatio < 2) {
        totalDeltaV -= 500;
        notes.push("Low mass ratio allows for delta-v savings");
      }

      // Propellant efficiency adjustments (realistic ISP impact)
      const baseISP = 300; // Baseline ISP for comparison
      const ispRatio = selectedPropellant.isp / baseISP;
      if (ispRatio > 1.5) {
        totalDeltaV *= 0.85; // High ISP provides significant savings
        notes.push(`${selectedPropellant.label} high ISP (${selectedPropellant.isp}s) provides efficiency`);
      } else if (ispRatio < 0.8) {
        totalDeltaV *= 1.2; // Low ISP requires more delta-v
        notes.push(`${selectedPropellant.label} low ISP (${selectedPropellant.isp}s) requires more delta-v`);
      } else {
        notes.push(`${selectedPropellant.label} ISP: ${selectedPropellant.isp}s`);
      }

      // Engine cycle adjustments (realistic efficiency gains)
      if (selectedEngine.cycles > 1) {
        totalDeltaV *= 0.92; // Multi-cycle engines provide modest efficiency
        notes.push(`${selectedEngine.label}: ${selectedEngine.cycles}-cycle engine provides efficiency`);
      }

      // Mission-specific realistic adjustments
      if (missionType === "mars") {
        totalDeltaV += 2000; // Additional complexity
        notes.push("Requires optimal launch window (every 26 months)");
        notes.push("Consider aerobraking for orbital insertion");
        if (totalDeltaV > 25000) feasibility = "Challenging";
      } else if (missionType === "jupiter") {
        totalDeltaV += 3000; // Significant complexity
        notes.push("Requires gravity assists for efficiency");
        notes.push("Long mission duration (5+ years)");
        feasibility = "Challenging";
      } else if (missionType === "interstellar") {
        totalDeltaV += 10000; // Massive complexity
        feasibility = "Theoretical";
        notes.push("Requires advanced propulsion systems");
        notes.push("Mission duration: decades to centuries");
      } else if (missionType === "saturn") {
        totalDeltaV += 4000;
        feasibility = "Challenging";
        notes.push("Requires multiple gravity assists");
      }

      // Realistic feasibility assessment based on delta-v and mass constraints
      if (totalDeltaV > 35000) {
        feasibility = "Impossible";
        notes.push("Delta-v exceeds current technology limits");
      } else if (totalDeltaV > 25000) {
        feasibility = "Challenging";
        notes.push("Requires multiple stages and advanced propulsion");
      } else if (totalDeltaV > 20000) {
        feasibility = "Difficult";
        notes.push("Requires careful mission planning and optimization");
      } else if (totalDeltaV > 15000) {
        feasibility = "Moderate";
        notes.push("Achievable with current technology");
      }

      // Mission-specific constraint checks
      const constraints = missionConstraints[missionType as keyof typeof missionConstraints];
      if (constraints) {
        if (massRatio > constraints.maxMassRatio) {
          feasibility = "Impossible";
          notes.push(`Mass ratio (${massRatio.toFixed(1)}) exceeds limit for ${missionType.toUpperCase()} missions (${constraints.maxMassRatio})`);
        }
        
        if (totalDeltaV > constraints.maxDeltaV) {
          feasibility = "Impossible";
          notes.push(`Delta-v (${totalDeltaV.toLocaleString()} m/s) exceeds limit for ${missionType.toUpperCase()} missions (${constraints.maxDeltaV.toLocaleString()} m/s)`);
        }
      }

      // General mass constraint checks
      if (massRatio > 20) {
        feasibility = "Impossible";
        notes.push("Mass ratio exceeds physical limits");
      } else if (massRatio > 15 && totalDeltaV > 20000) {
        feasibility = "Impossible";
        notes.push("Combination of high mass ratio and delta-v makes mission impossible");
      }

      // Calculate realistic fuel mass using Tsiolkovsky equation
      const exhaustVelocity = selectedPropellant.isp * 9.81; // Convert ISP to m/s
      const fuelMass = totalMass * (Math.exp(totalDeltaV / exhaustVelocity) - 1);
      
      // Check if fuel mass is reasonable
      if (fuelMass > totalMass * 10) {
        feasibility = "Impossible";
        notes.push("Required fuel mass exceeds reasonable limits");
      } else if (fuelMass > totalMass * 5) {
        feasibility = "Challenging";
        notes.push("Very high fuel mass requirement");
      }

      // Create realistic breakdown based on launch type
      let breakdown = [];
      
      if (vehicleSpecs.launchType === "spacecraft") {
        // Spacecraft maneuver breakdown
        if (vehicleSpecs.currentOrbit === "leo" && missionType !== "leo") {
          breakdown = [
            {
              stage: "LEO to Transfer Orbit",
              deltaV: Math.round(totalDeltaV * 0.7),
              description: `Departure burn from LEO (${vehicleSpecs.currentAltitude} km)`
            },
            {
              stage: "Orbital Insertion",
              deltaV: Math.round(totalDeltaV * 0.3),
              description: `Capture and circularization at ${selectedDest?.label}`
            }
          ];
        } else if (vehicleSpecs.currentOrbit === missionType) {
          breakdown = [
            {
              stage: "No Maneuver Required",
              deltaV: 0,
              description: "Already at target destination"
            }
          ];
        } else {
          // Interplanetary transfer from other orbit
          breakdown = [
            {
              stage: "Departure from Current Orbit",
              deltaV: Math.round(totalDeltaV * 0.6),
              description: `Escape from ${currentOrbits.find(o => o.value === vehicleSpecs.currentOrbit)?.label}`
            },
            {
              stage: "Transfer Maneuver",
              deltaV: Math.round(totalDeltaV * 0.3),
              description: `Interplanetary transfer to ${selectedDest?.label}`
            },
            {
              stage: "Orbital Insertion",
              deltaV: Math.round(totalDeltaV * 0.1),
              description: "Capture and circularization"
            }
          ];
        }
      } else {
        // Earth launch breakdown
        const weatherMultiplier = selectedWeather.factor;
        breakdown = [
          {
            stage: "Earth Surface to LEO",
            deltaV: Math.round(9400 * weatherMultiplier),
            description: "Basic orbital insertion with weather adjustment"
          }
        ];

        if (missionType !== "leo") {
          const transferDeltaV = Math.round((selectedMission.deltaV - 9400) * weatherMultiplier);
          breakdown.push({
            stage: "LEO to Transfer Orbit",
            deltaV: transferDeltaV,
            description: `Transfer to ${selectedDest?.label}`
          });

          breakdown.push({
            stage: "Orbital Insertion",
            deltaV: Math.round(1000 * weatherMultiplier),
            description: "Capture and circularization"
          });
        }
      }

      setResult({
        total: Math.round(totalDeltaV),
        breakdown,
        missionType: selectedMission.label,
        feasibility,
        notes,
        fuelMass: Math.round(fuelMass),
        totalMass: totalMass,
        engineSpecs: {
          type: selectedEngine.label,
          cycles: selectedEngine.cycles,
          efficiency: selectedCompany.reliability,
          thrust: selectedEngine.thrust
        }
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
                 <p className="text-lg text-gray-300 max-w-3xl mx-auto">
           Calculate the delta-v requirements for space missions and orbital transfers. 
           Supports both Earth launches (with weather factors) and spacecraft maneuvers (pure orbital mechanics). 
           Plan your space missions with precision using our comprehensive calculator.
         </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                 {/* Input Panel */}
         <div className="lg:col-span-1">
           {/* Launch Type Info */}
           <div className="mb-4 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
             <div className="flex items-center gap-2 mb-2">
               <InfoIcon className="h-5 w-5 text-blue-400" />
               <span className="text-blue-300 font-semibold">Launch Type Selection</span>
             </div>
             <div className="text-sm text-blue-200">
               <p><strong>Earth Launch:</strong> Rocket launching from Earth's surface (weather affects performance)</p>
               <p><strong>Spacecraft Maneuver:</strong> Vehicle already in space (no atmospheric effects)</p>
             </div>
           </div>
           
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

              <div className="space-y-2">
                <Label htmlFor="dry-mass" className="text-white">Vehicle Dry Mass (kg)</Label>
                <Input
                  id="dry-mass"
                  type="number"
                  value={vehicleSpecs.dryMass}
                  onChange={(e) => setVehicleSpecs({...vehicleSpecs, dryMass: parseFloat(e.target.value) || 0})}
                  placeholder="5000"
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="propellant" className="text-white">Propellant Type</Label>
                <Select value={vehicleSpecs.propellantType} onValueChange={(value) => setVehicleSpecs({...vehicleSpecs, propellantType: value})}>
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                    <SelectValue placeholder="Select propellant" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    {propellantTypes.map((prop) => (
                      <SelectItem key={prop.value} value={prop.value} className="text-white">
                        {prop.label} ({prop.isp}s ISP)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="engine" className="text-white">Engine Type</Label>
                <Select value={vehicleSpecs.engineType} onValueChange={(value) => setVehicleSpecs({...vehicleSpecs, engineType: value})}>
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                    <SelectValue placeholder="Select engine" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    {engineTypes.map((engine) => (
                      <SelectItem key={engine.value} value={engine.value} className="text-white">
                        {engine.label} ({engine.thrust} kN)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company" className="text-white">Company/Provider</Label>
                <Select value={vehicleSpecs.company} onValueChange={(value) => setVehicleSpecs({...vehicleSpecs, company: value})}>
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                    <SelectValue placeholder="Select company" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    {companies.map((company) => (
                      <SelectItem key={company.value} value={company.value} className="text-white">
                        {company.label} ({company.reliability * 100}% reliability)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

                             <div className="space-y-2">
                 <Label htmlFor="launch-type" className="text-white">Launch Type</Label>
                 <Select value={vehicleSpecs.launchType} onValueChange={(value) => {
                   const newSpecs = {...vehicleSpecs, launchType: value};
                   // Auto-set weather to space for spacecraft maneuvers
                   if (value === "spacecraft") {
                     newSpecs.atmosphericConditions = "space";
                   } else if (value === "earth_launch" && vehicleSpecs.atmosphericConditions === "space") {
                     newSpecs.atmosphericConditions = "standard";
                   }
                   setVehicleSpecs(newSpecs);
                 }}>
                   <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                     <SelectValue placeholder="Select launch type" />
                   </SelectTrigger>
                   <SelectContent className="bg-gray-800 border-gray-600">
                     {launchTypes.map((type) => (
                       <SelectItem key={type.value} value={type.value} className="text-white">
                         {type.label}
                       </SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>

               {vehicleSpecs.launchType === "spacecraft" && (
                 <>
                   <div className="space-y-2">
                     <Label htmlFor="current-orbit" className="text-white">Current Orbit</Label>
                     <Select value={vehicleSpecs.currentOrbit} onValueChange={(value) => setVehicleSpecs({...vehicleSpecs, currentOrbit: value})}>
                       <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                         <SelectValue placeholder="Select current orbit" />
                       </SelectTrigger>
                       <SelectContent className="bg-gray-800 border-gray-600">
                         {currentOrbits.map((orbit) => (
                           <SelectItem key={orbit.value} value={orbit.value} className="text-white">
                             {orbit.label}
                           </SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                   </div>

                   {vehicleSpecs.currentOrbit === "custom" && (
                     <div className="space-y-2">
                       <Label htmlFor="current-altitude" className="text-white">Current Altitude (km)</Label>
                       <Input
                         id="current-altitude"
                         type="number"
                         value={vehicleSpecs.currentAltitude}
                         onChange={(e) => setVehicleSpecs({...vehicleSpecs, currentAltitude: parseFloat(e.target.value) || 0})}
                         placeholder="400"
                         className="bg-gray-800 border-gray-600 text-white"
                       />
                     </div>
                   )}
                 </>
               )}

               {vehicleSpecs.launchType === "earth_launch" && (
                 <div className="space-y-2">
                   <Label htmlFor="weather" className="text-white">Weather Conditions</Label>
                   <Select value={vehicleSpecs.atmosphericConditions} onValueChange={(value) => setVehicleSpecs({...vehicleSpecs, atmosphericConditions: value})}>
                     <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                       <SelectValue placeholder="Select conditions" />
                     </SelectTrigger>
                     <SelectContent className="bg-gray-800 border-gray-600">
                       {weatherConditions.filter(w => w.value !== "space").map((weather) => (
                         <SelectItem key={weather.value} value={weather.value} className="text-white">
                           {weather.label} (×{weather.factor})
                         </SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </div>
               )}

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
                              result.feasibility === "Moderate" ? "default" :
                              result.feasibility === "Difficult" ? "secondary" :
                              result.feasibility === "Challenging" ? "secondary" : 
                              result.feasibility === "Theoretical" ? "outline" : "destructive"}
                      className={`ml-2 ${
                        result.feasibility === "Feasible" ? "bg-green-600 hover:bg-green-700" :
                        result.feasibility === "Moderate" ? "bg-blue-600 hover:bg-blue-700" :
                        result.feasibility === "Difficult" ? "bg-yellow-600 hover:bg-yellow-700" :
                        result.feasibility === "Challenging" ? "bg-orange-600 hover:bg-orange-700" :
                        result.feasibility === "Theoretical" ? "bg-purple-600 hover:bg-purple-700 border-purple-400" :
                        "bg-red-600 hover:bg-red-700"
                      }`}
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
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                      <div className="text-lg font-bold text-green-400">
                        {result.fuelMass.toFixed(0)} kg
                      </div>
                      <div className="text-sm text-gray-400">Fuel Mass</div>
                    </div>
                    <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                      <div className="text-lg font-bold text-orange-400">
                        {result.totalMass.toFixed(0)} kg
                      </div>
                      <div className="text-sm text-gray-400">Total Mass</div>
                    </div>
                    <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                      <div className="text-lg font-bold text-cyan-400">
                        {result.engineSpecs.type}
                      </div>
                      <div className="text-sm text-gray-400">Engine</div>
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
                           <TabsList className="grid w-full grid-cols-5 bg-gray-800">
           <TabsTrigger value="about" className="text-white">About Delta-V</TabsTrigger>
           <TabsTrigger value="examples" className="text-white">Mission Examples</TabsTrigger>
           <TabsTrigger value="formulas" className="text-white">Formulas</TabsTrigger>
           <TabsTrigger value="equations" className="text-white">Equations</TabsTrigger>
           <TabsTrigger value="advanced" className="text-white">Advanced</TabsTrigger>
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
                  <h3 className="text-white text-xl font-semibold mb-4">Delta-V Calculation Formulas</h3>
                  
                  <div className="space-y-6">
                    {/* Tsiolkovsky Rocket Equation */}
                    <div className="p-6 bg-gray-800/50 rounded-lg border border-gray-700">
                      <h4 className="text-white text-lg font-semibold mb-3 flex items-center">
                        <CalculatorIcon className="h-5 w-5 mr-2 text-purple-400" />
                        Tsiolkovsky Rocket Equation
                      </h4>
                      <div className="text-center mb-4">
                        <div className="text-2xl font-mono text-purple-400 bg-gray-900 p-3 rounded border border-gray-600">
                          Δv = vₑ × ln(m₀/m₁)
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-300 mb-2"><strong>Where:</strong></p>
                          <ul className="text-gray-400 space-y-1">
                            <li>• <strong>Δv</strong> = Change in velocity (delta-v)</li>
                            <li>• <strong>vₑ</strong> = Exhaust velocity (m/s)</li>
                            <li>• <strong>m₀</strong> = Initial mass (kg)</li>
                            <li>• <strong>m₁</strong> = Final mass (kg)</li>
                          </ul>
                        </div>
                        <div>
                          <p className="text-gray-300 mb-2"><strong>Key Insights:</strong></p>
                          <ul className="text-gray-400 space-y-1">
                            <li>• Higher exhaust velocity = more efficient</li>
                            <li>• Mass ratio (m₀/m₁) is critical</li>
                            <li>• Logarithmic relationship with mass</li>
                            <li>• Foundation of all rocket propulsion</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Specific Impulse */}
                    <div className="p-6 bg-gray-800/50 rounded-lg border border-gray-700">
                      <h4 className="text-white text-lg font-semibold mb-3 flex items-center">
                        <RocketIcon className="h-5 w-5 mr-2 text-green-400" />
                        Specific Impulse (ISP)
                      </h4>
                      <div className="text-center mb-4">
                        <div className="text-2xl font-mono text-green-400 bg-gray-900 p-3 rounded border border-gray-600">
                          ISP = vₑ / g₀
                        </div>
                      </div>
                      <p className="text-gray-300 mb-3">
                        Specific impulse measures how efficiently a rocket engine uses propellant. Higher ISP means less fuel needed for the same delta-v.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-gray-300 mb-2"><strong>Propellant Types:</strong></p>
                          <ul className="text-gray-400 space-y-1 text-sm">
                            <li>• <strong>Solid:</strong> 180-250s (lowest efficiency)</li>
                            <li>• <strong>RP-1/LOX:</strong> 280-320s (medium efficiency)</li>
                            <li>• <strong>LH2/LOX:</strong> 350-450s (high efficiency)</li>
                            <li>• <strong>Electric:</strong> 1000-5000s (highest efficiency)</li>
                          </ul>
                        </div>
                        <div>
                          <p className="text-gray-300 mb-2"><strong>Conversion:</strong></p>
                          <div className="text-gray-400 text-sm">
                            <p><strong>vₑ = ISP × g₀</strong></p>
                            <p>Where g₀ = 9.81 m/s²</p>
                            <p className="mt-2">Example: 300s ISP = 2,943 m/s exhaust velocity</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Hohmann Transfer */}
                    <div className="p-6 bg-gray-800/50 rounded-lg border border-gray-700">
                      <h4 className="text-white text-lg font-semibold mb-3 flex items-center">
                        <TargetIcon className="h-5 w-5 mr-2 text-blue-400" />
                        Hohmann Transfer Orbit
                      </h4>
                      <div className="text-center mb-4">
                        <div className="text-2xl font-mono text-blue-400 bg-gray-900 p-3 rounded border border-gray-600">
                          Δv₁ = √(μ/r₁) × (√(2r₂/(r₁+r₂)) - 1)
                        </div>
                        <div className="text-xl font-mono text-blue-400 bg-gray-900 p-3 rounded border border-gray-600 mt-2">
                          Δv₂ = √(μ/r₂) × (1 - √(2r₁/(r₁+r₂)))
                        </div>
                      </div>
                      <p className="text-gray-300 mb-3">
                        The Hohmann transfer is the most fuel-efficient way to transfer between two circular orbits. It uses two burns: one to leave the initial orbit and another to enter the final orbit.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-gray-300 mb-2"><strong>Variables:</strong></p>
                          <ul className="text-gray-400 space-y-1 text-sm">
                            <li>• <strong>μ</strong> = GM (gravitational parameter)</li>
                            <li>• <strong>r₁</strong> = Initial orbital radius</li>
                            <li>• <strong>r₂</strong> = Final orbital radius</li>
                            <li>• <strong>Δv₁</strong> = First burn (departure)</li>
                            <li>• <strong>Δv₂</strong> = Second burn (arrival)</li>
                          </ul>
                        </div>
                        <div>
                          <p className="text-gray-300 mb-2"><strong>Characteristics:</strong></p>
                          <ul className="text-gray-400 space-y-1 text-sm">
                            <li>• Most fuel-efficient transfer</li>
                            <li>• Takes exactly 180° around the Sun</li>
                            <li>• Only works for circular orbits</li>
                            <li>• Transfer time: π√((r₁+r₂)³/(8μ))</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Atmospheric Drag */}
                    <div className="p-6 bg-gray-800/50 rounded-lg border border-gray-700">
                      <h4 className="text-white text-lg font-semibold mb-3 flex items-center">
                        <InfoIcon className="h-5 w-5 mr-2 text-orange-400" />
                        Atmospheric Drag & Weather Factors
                      </h4>
                      <div className="text-center mb-4">
                        <div className="text-2xl font-mono text-orange-400 bg-gray-900 p-3 rounded border border-gray-600">
                          Δv_weather = Δv_basic × weather_factor
                        </div>
                      </div>
                      <p className="text-gray-300 mb-3">
                        Weather conditions significantly affect rocket performance during atmospheric flight. The weather factor multiplies the base delta-v requirement.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-gray-300 mb-2"><strong>Weather Factors:</strong></p>
                          <ul className="text-gray-400 space-y-1 text-sm">
                            <li>• <strong>Optimal:</strong> ×0.95 (5% improvement)</li>
                            <li>• <strong>Standard:</strong> ×1.00 (baseline)</li>
                            <li>• <strong>High Wind:</strong> ×1.15 (15% penalty)</li>
                            <li>• <strong>Storm:</strong> ×1.25 (25% penalty)</li>
                          </ul>
                        </div>
                        <div>
                          <p className="text-gray-300 mb-2"><strong>Effects:</strong></p>
                          <ul className="text-gray-400 space-y-1 text-sm">
                            <li>• Wind increases atmospheric drag</li>
                            <li>• Temperature affects engine efficiency</li>
                            <li>• Humidity impacts combustion</li>
                            <li>• Pressure variations affect thrust</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Mass Ratio */}
                    <div className="p-6 bg-gray-800/50 rounded-lg border border-gray-700">
                      <h4 className="text-white text-lg font-semibold mb-3 flex items-center">
                        <RefreshCwIcon className="h-5 w-5 mr-2 text-cyan-400" />
                        Mass Ratio & Staging
                      </h4>
                      <div className="text-center mb-4">
                        <div className="text-2xl font-mono text-cyan-400 bg-gray-900 p-3 rounded border border-gray-600">
                          Mass Ratio = m₀ / m₁
                        </div>
                      </div>
                      <p className="text-gray-300 mb-3">
                        The mass ratio is crucial for rocket performance. A higher mass ratio means more propellant relative to the final mass, enabling higher delta-v.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-gray-300 mb-2"><strong>Typical Values:</strong></p>
                          <ul className="text-gray-400 space-y-1 text-sm">
                            <li>• <strong>Single Stage:</strong> 2-4 (limited delta-v)</li>
                            <li>• <strong>Two Stage:</strong> 4-8 (moderate delta-v)</li>
                            <li>• <strong>Three Stage:</strong> 8-15 (high delta-v)</li>
                            <li>• <strong>Multi-Stage:</strong> 15+ (very high delta-v)</li>
                          </ul>
                        </div>
                        <div>
                          <p className="text-gray-300 mb-2"><strong>Staging Benefits:</strong></p>
                          <ul className="text-gray-400 space-y-1 text-sm">
                            <li>• Shed empty fuel tanks</li>
                            <li>• Reduce gravitational losses</li>
                            <li>• Optimize engine performance</li>
                            <li>• Increase overall efficiency</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
                     </TabsContent>

           <TabsContent value="equations" className="mt-6">
             <Card className="bg-gray-900/50 border-gray-700">
               <CardContent className="pt-6">
                 <div className="prose prose-invert max-w-none">
                   <h3 className="text-white text-xl font-semibold mb-4">Detailed Mathematical Equations</h3>
                   
                   <div className="space-y-6">
                     {/* Launch Type Calculations */}
                     <div className="p-6 bg-gray-800/50 rounded-lg border border-gray-700">
                       <h4 className="text-white text-lg font-semibold mb-3 flex items-center">
                         <RocketIcon className="h-5 w-5 mr-2 text-purple-400" />
                         Launch Type Calculations
                       </h4>
                       <div className="space-y-4">
                         <div>
                           <h5 className="text-white font-semibold mb-2">Earth Launch (Surface to Orbit)</h5>
                           <div className="text-center mb-3">
                             <div className="text-lg font-mono text-purple-400 bg-gray-900 p-3 rounded border border-gray-600">
                               Δv_total = Δv_launch × weather_factor + Δv_transfer + Δv_insertion
                             </div>
                           </div>
                           <p className="text-gray-300 text-sm">
                             Where Δv_launch = 9,400 m/s (Earth surface to LEO), weather_factor accounts for atmospheric conditions
                           </p>
                         </div>
                         
                         <div>
                           <h5 className="text-white font-semibold mb-2">Spacecraft Maneuver (Orbit to Orbit)</h5>
                           <div className="text-center mb-3">
                             <div className="text-lg font-mono text-blue-400 bg-gray-900 p-3 rounded border border-gray-600">
                               Δv_total = Δv_departure + Δv_transfer + Δv_insertion
                             </div>
                           </div>
                           <p className="text-gray-300 text-sm">
                             No atmospheric effects, pure orbital mechanics calculations
                           </p>
                         </div>
                       </div>
                     </div>

                     {/* Weather Factor Calculations */}
                     <div className="p-6 bg-gray-800/50 rounded-lg border border-gray-700">
                       <h4 className="text-white text-lg font-semibold mb-3 flex items-center">
                         <InfoIcon className="h-5 w-5 mr-2 text-orange-400" />
                         Weather Factor Calculations
                       </h4>
                       <div className="space-y-4">
                         <div>
                           <h5 className="text-white font-semibold mb-2">Atmospheric Drag Factor</h5>
                           <div className="text-center mb-3">
                             <div className="text-lg font-mono text-orange-400 bg-gray-900 p-3 rounded border border-gray-600">
                               F_drag = ½ × ρ × v² × C_d × A × weather_factor
                             </div>
                           </div>
                           <p className="text-gray-300 text-sm">
                             Weather factor multiplies atmospheric drag: Optimal (×0.95), Standard (×1.00), Storm (×1.25)
                           </p>
                         </div>
                         
                         <div>
                           <h5 className="text-white font-semibold mb-2">Engine Performance Factor</h5>
                           <div className="text-center mb-3">
                             <div className="text-lg font-mono text-orange-400 bg-gray-900 p-3 rounded border border-gray-600">
                               η_engine = η_nominal × temperature_factor × humidity_factor
                             </div>
                           </div>
                           <p className="text-gray-300 text-sm">
                             Temperature and humidity affect combustion efficiency and thrust
                           </p>
                         </div>
                       </div>
                     </div>

                     {/* Orbital Transfer Calculations */}
                     <div className="p-6 bg-gray-800/50 rounded-lg border border-gray-700">
                       <h4 className="text-white text-lg font-semibold mb-3 flex items-center">
                         <TargetIcon className="h-5 w-5 mr-2 text-blue-400" />
                         Orbital Transfer Calculations
                       </h4>
                       <div className="space-y-4">
                         <div>
                           <h5 className="text-white font-semibold mb-2">Hohmann Transfer (Most Efficient)</h5>
                           <div className="text-center mb-3">
                             <div className="text-lg font-mono text-blue-400 bg-gray-900 p-3 rounded border border-gray-600">
                               Δv₁ = √(μ/r₁) × (√(2r₂/(r₁+r₂)) - 1)
                             </div>
                             <div className="text-lg font-mono text-blue-400 bg-gray-900 p-3 rounded border border-gray-600 mt-2">
                               Δv₂ = √(μ/r₂) × (1 - √(2r₁/(r₁+r₂)))
                             </div>
                           </div>
                           <p className="text-gray-300 text-sm">
                             Where μ = GM (gravitational parameter), r₁ = initial radius, r₂ = final radius
                           </p>
                         </div>
                         
                         <div>
                           <h5 className="text-white font-semibold mb-2">Bi-Elliptic Transfer (Higher Δv but Different Timing)</h5>
                           <div className="text-center mb-3">
                             <div className="text-lg font-mono text-blue-400 bg-gray-900 p-3 rounded border border-gray-600">
                               Δv_total = Δv₁ + Δv₂ + Δv₃
                             </div>
                           </div>
                           <p className="text-gray-300 text-sm">
                             Uses intermediate high orbit for more efficient transfers in some cases
                           </p>
                         </div>
                       </div>
                     </div>

                     {/* Mass Ratio and Staging */}
                     <div className="p-6 bg-gray-800/50 rounded-lg border border-gray-700">
                       <h4 className="text-white text-lg font-semibold mb-3 flex items-center">
                         <RefreshCwIcon className="h-5 w-5 mr-2 text-cyan-400" />
                         Mass Ratio and Staging Calculations
                       </h4>
                       <div className="space-y-4">
                         <div>
                           <h5 className="text-white font-semibold mb-2">Mass Ratio Definition</h5>
                           <div className="text-center mb-3">
                             <div className="text-lg font-mono text-cyan-400 bg-gray-900 p-3 rounded border border-gray-600">
                               Mass Ratio = m₀ / m₁ = (m_dry + m_payload + m_fuel) / (m_dry + m_payload)
                             </div>
                           </div>
                           <p className="text-gray-300 text-sm">
                             Higher mass ratio means more propellant relative to final mass
                           </p>
                         </div>
                         
                         <div>
                           <h5 className="text-white font-semibold mb-2">Staging Efficiency</h5>
                           <div className="text-center mb-3">
                             <div className="text-lg font-mono text-cyan-400 bg-gray-900 p-3 rounded border border-gray-600">
                               Δv_staged = Σ(Δv_stage × ln(mass_ratio_stage))
                             </div>
                           </div>
                           <p className="text-gray-300 text-sm">
                             Each stage contributes to total delta-v based on its mass ratio
                           </p>
                         </div>
                       </div>
                     </div>

                     {/* Propellant Efficiency */}
                     <div className="p-6 bg-gray-800/50 rounded-lg border border-gray-700">
                       <h4 className="text-white text-lg font-semibold mb-3 flex items-center">
                         <CalculatorIcon className="h-5 w-5 mr-2 text-green-400" />
                         Propellant Efficiency Calculations
                       </h4>
                       <div className="space-y-4">
                         <div>
                           <h5 className="text-white font-semibold mb-2">Specific Impulse Impact</h5>
                           <div className="text-center mb-3">
                             <div className="text-lg font-mono text-green-400 bg-gray-900 p-3 rounded border border-gray-600">
                               Δv_required = Δv_baseline × (300 / ISP_actual)
                             </div>
                           </div>
                           <p className="text-gray-300 text-sm">
                             Higher ISP reduces required delta-v for same mission
                           </p>
                         </div>
                         
                         <div>
                           <h5 className="text-white font-semibold mb-2">Fuel Mass Calculation</h5>
                           <div className="text-center mb-3">
                             <div className="text-lg font-mono text-green-400 bg-gray-900 p-3 rounded border border-gray-600">
                               m_fuel = m_final × (e^(Δv/v_exhaust) - 1)
                             </div>
                           </div>
                           <p className="text-gray-300 text-sm">
                             Where v_exhaust = ISP × g₀ (9.81 m/s²)
                           </p>
                         </div>
                       </div>
                     </div>

                     {/* Real-World Constraints */}
                     <div className="p-6 bg-gray-800/50 rounded-lg border border-gray-700">
                       <h4 className="text-white text-lg font-semibold mb-3 flex items-center">
                         <InfoIcon className="h-5 w-5 mr-2 text-red-400" />
                         Real-World Constraint Equations
                       </h4>
                       <div className="space-y-4">
                         <div>
                           <h5 className="text-white font-semibold mb-2">Feasibility Check</h5>
                           <div className="text-center mb-3">
                             <div className="text-lg font-mono text-red-400 bg-gray-900 p-3 rounded border border-gray-600">
                               Feasible = (Δv_total ≤ Δv_max) AND (mass_ratio ≤ mass_ratio_max)
                             </div>
                           </div>
                           <p className="text-gray-300 text-sm">
                             Mission is only feasible if both delta-v and mass ratio constraints are met
                           </p>
                         </div>
                         
                         <div>
                           <h5 className="text-white font-semibold mb-2">Safety Margin</h5>
                           <div className="text-center mb-3">
                             <div className="text-lg font-mono text-red-400 bg-gray-900 p-3 rounded border border-gray-600">
                               Δv_with_margin = Δv_calculated × (1 + safety_factor)
                             </div>
                           </div>
                           <p className="text-gray-300 text-sm">
                             Safety factors: Nominal (+5-10%), Conservative (+15-20%), Experimental (+25-30%)
                           </p>
                         </div>
                       </div>
                     </div>
                   </div>
                 </div>
               </CardContent>
             </Card>
           </TabsContent>

           <TabsContent value="advanced" className="mt-6">
            <Card className="bg-gray-900/50 border-gray-700">
              <CardContent className="pt-6">
                <div className="prose prose-invert max-w-none">
                  <h3 className="text-white text-xl font-semibold mb-4">Advanced Delta-V Calculations</h3>
                  
                  <div className="space-y-6">
                    {/* Gravitational Losses */}
                    <div className="p-6 bg-gray-800/50 rounded-lg border border-gray-700">
                      <h4 className="text-white text-lg font-semibold mb-3 flex items-center">
                        <RefreshCwIcon className="h-5 w-5 mr-2 text-red-400" />
                        Gravitational Losses
                      </h4>
                      <div className="text-center mb-4">
                        <div className="text-2xl font-mono text-red-400 bg-gray-900 p-3 rounded border border-gray-600">
                          Δv_loss = g₀ × t_burn × sin(θ)
                        </div>
                      </div>
                      <p className="text-gray-300 mb-3">
                        During vertical ascent, gravity continuously reduces the rocket's velocity. The longer the burn time and the more vertical the trajectory, the greater the gravitational losses.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-gray-300 mb-2"><strong>Factors:</strong></p>
                          <ul className="text-gray-400 space-y-1 text-sm">
                            <li>• <strong>g₀:</strong> Surface gravity (9.81 m/s²)</li>
                            <li>• <strong>t_burn:</strong> Engine burn time</li>
                            <li>• <strong>θ:</strong> Flight path angle</li>
                            <li>• <strong>Altitude:</strong> Gravity decreases with height</li>
                          </ul>
                        </div>
                        <div>
                          <p className="text-gray-300 mb-2"><strong>Minimization:</strong></p>
                          <ul className="text-gray-400 space-y-1 text-sm">
                            <li>• Gravity turn (gradual pitch-over)</li>
                            <li>• Shorter burn times</li>
                            <li>• Higher thrust-to-weight ratios</li>
                            <li>• Optimal trajectory planning</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Atmospheric Drag */}
                    <div className="p-6 bg-gray-800/50 rounded-lg border border-gray-700">
                      <h4 className="text-white text-lg font-semibold mb-3 flex items-center">
                        <InfoIcon className="h-5 w-5 mr-2 text-yellow-400" />
                        Atmospheric Drag
                      </h4>
                      <div className="text-center mb-4">
                        <div className="text-2xl font-mono text-yellow-400 bg-gray-900 p-3 rounded border border-gray-600">
                          F_drag = ½ × ρ × v² × C_d × A
                        </div>
                      </div>
                      <p className="text-gray-300 mb-3">
                        Atmospheric drag increases with the square of velocity and is most significant during the early stages of launch when the rocket is moving fast through dense air.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-gray-300 mb-2"><strong>Variables:</strong></p>
                          <ul className="text-gray-400 space-y-1 text-sm">
                            <li>• <strong>ρ:</strong> Air density (kg/m³)</li>
                            <li>• <strong>v:</strong> Velocity (m/s)</li>
                            <li>• <strong>C_d:</strong> Drag coefficient</li>
                            <li>• <strong>A:</strong> Cross-sectional area</li>
                          </ul>
                        </div>
                        <div>
                          <p className="text-gray-300 mb-2"><strong>Reduction Methods:</strong></p>
                          <ul className="text-gray-400 space-y-1 text-sm">
                            <li>• Aerodynamic fairings</li>
                            <li>• Streamlined design</li>
                            <li>• High-altitude launch sites</li>
                            <li>• Optimal ascent profiles</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Engine Performance */}
                    <div className="p-6 bg-gray-800/50 rounded-lg border border-gray-700">
                      <h4 className="text-white text-lg font-semibold mb-3 flex items-center">
                        <RocketIcon className="h-5 w-5 mr-2 text-green-400" />
                        Engine Performance Factors
                      </h4>
                      <div className="text-center mb-4">
                        <div className="text-2xl font-mono text-green-400 bg-gray-900 p-3 rounded border border-gray-600">
                          η_engine = P_actual / P_theoretical
                        </div>
                      </div>
                      <p className="text-gray-300 mb-3">
                        Real rocket engines never achieve 100% efficiency. Factors like combustion efficiency, nozzle expansion, and atmospheric pressure all affect performance.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-gray-300 mb-2"><strong>Efficiency Factors:</strong></p>
                          <ul className="text-gray-400 space-y-1 text-sm">
                            <li>• <strong>Combustion:</strong> 95-99% (fuel mixing)</li>
                            <li>• <strong>Nozzle:</strong> 85-95% (expansion ratio)</li>
                            <li>• <strong>Pumps:</strong> 70-85% (turbomachinery)</li>
                            <li>• <strong>Overall:</strong> 60-80% (combined)</li>
                          </ul>
                        </div>
                        <div>
                          <p className="text-gray-300 mb-2"><strong>Performance Losses:</strong></p>
                          <ul className="text-gray-400 space-y-1 text-sm">
                            <li>• Incomplete combustion</li>
                            <li>• Heat transfer to walls</li>
                            <li>• Friction in pumps</li>
                            <li>• Atmospheric back-pressure</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Mission Planning */}
                    <div className="p-6 bg-gray-800/50 rounded-lg border border-gray-700">
                      <h4 className="text-white text-lg font-semibold mb-3 flex items-center">
                        <TargetIcon className="h-5 w-5 mr-2 text-blue-400" />
                        Mission Planning Considerations
                      </h4>
                      <div className="text-center mb-4">
                        <div className="text-2xl font-mono text-blue-400 bg-gray-900 p-3 rounded border border-gray-600">
                          Δv_total = Σ(Δv_stage) + Δv_losses + Δv_margin
                        </div>
                      </div>
                      <p className="text-gray-300 mb-3">
                        Successful mission planning requires accounting for all delta-v requirements, including losses and safety margins. The total delta-v determines fuel requirements and mission feasibility.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-gray-300 mb-2"><strong>Safety Margins:</strong></p>
                          <ul className="text-gray-400 space-y-1 text-sm">
                            <li>• <strong>Nominal:</strong> +5-10% (standard missions)</li>
                            <li>• <strong>Conservative:</strong> +15-20% (critical missions)</li>
                            <li>• <strong>Experimental:</strong> +25-30% (new technology)</li>
                            <li>• <strong>Emergency:</strong> +50%+ (abort scenarios)</li>
                          </ul>
                        </div>
                        <div>
                          <p className="text-gray-300 mb-2"><strong>Mission Phases:</strong></p>
                          <ul className="text-gray-400 space-y-1 text-sm">
                            <li>• Launch and ascent</li>
                            <li>• Orbital insertion</li>
                            <li>• Transfer maneuvers</li>
                            <li>• Orbital adjustments</li>
                            <li>• Deorbit and landing</li>
                          </ul>
                        </div>
                      </div>
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