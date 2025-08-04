import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RulerIcon, CalculatorIcon, RefreshCwIcon, InfoIcon } from "lucide-react";

interface CelestialObject {
  name: string;
  distance: number; // in AU (Astronomical Units)
  type: string;
  description: string;
}

function DistanceCalculator() {
  const [fromObject, setFromObject] = useState("earth");
  const [toObject, setToObject] = useState("mars");
  const [result, setResult] = useState<{
    distance: number;
    unit: string;
    time: string;
    description: string;
  } | null>(null);

  const celestialObjects: Record<string, CelestialObject> = {
    earth: { name: "Earth", distance: 1, type: "Planet", description: "Our home planet" },
    moon: { name: "Moon", distance: 0.00257, type: "Satellite", description: "Earth's natural satellite" },
    sun: { name: "Sun", distance: 0, type: "Star", description: "Our star" },
    mars: { name: "Mars", distance: 1.52, type: "Planet", description: "The red planet" },
    venus: { name: "Venus", distance: 0.72, type: "Planet", description: "Earth's twin" },
    mercury: { name: "Mercury", distance: 0.39, type: "Planet", description: "Closest to the Sun" },
    jupiter: { name: "Jupiter", distance: 5.20, type: "Planet", description: "Largest planet" },
    saturn: { name: "Saturn", distance: 9.58, type: "Planet", description: "Ringed planet" },
    uranus: { name: "Uranus", distance: 19.18, type: "Planet", description: "Ice giant" },
    neptune: { name: "Neptune", distance: 30.07, type: "Planet", description: "Windy planet" },
    pluto: { name: "Pluto", distance: 39.48, type: "Dwarf Planet", description: "Former planet" },
    iss: { name: "International Space Station", distance: 0.0001, type: "Space Station", description: "Orbiting laboratory" },
    voyager1: { name: "Voyager 1", distance: 162, type: "Spacecraft", description: "Farthest human-made object" },
    voyager2: { name: "Voyager 2", distance: 135, type: "Spacecraft", description: "Interstellar probe" },
    proxima: { name: "Proxima Centauri", distance: 268770, type: "Star", description: "Nearest star system" },
    andromeda: { name: "Andromeda Galaxy", distance: 2.537e12, type: "Galaxy", description: "Nearest major galaxy" }
  };

  const calculateDistance = () => {
    const from = celestialObjects[fromObject];
    const to = celestialObjects[toObject];
    
    if (!from || !to) return;

    const distanceAU = Math.abs(to.distance - from.distance);
    const distanceKM = distanceAU * 149597870.7; // 1 AU in km
    const distanceLY = distanceAU * 0.000015813; // 1 AU in light years

    let unit = "AU";
    let distance = distanceAU;
    let time = "";

    if (distanceAU < 0.01) {
      unit = "km";
      distance = distanceKM;
      time = `Travel time: ${Math.round(distance / 28000)} hours at current spacecraft speed`;
    } else if (distanceAU < 100) {
      unit = "AU";
      time = `Travel time: ${Math.round(distance * 0.5)} years at current spacecraft speed`;
    } else if (distanceAU < 1000000) {
      unit = "AU";
      time = `Travel time: ${Math.round(distance * 0.5)} years at current spacecraft speed`;
    } else {
      unit = "light years";
      distance = distanceLY;
      time = `Travel time: ${Math.round(distance)} years at light speed`;
    }

    const description = `Distance from ${from.name} to ${to.name}`;

    setResult({
      distance: Math.round(distance * 1000) / 1000,
      unit,
      time,
      description
    });
  };

  const formatNumber = (num: number) => {
    if (num >= 1e12) return (num / 1e12).toFixed(2) + " trillion";
    if (num >= 1e9) return (num / 1e9).toFixed(2) + " billion";
    if (num >= 1e6) return (num / 1e6).toFixed(2) + " million";
    if (num >= 1e3) return (num / 1e3).toFixed(2) + " thousand";
    return num.toFixed(2);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0F] via-[#14141E] to-[#1A1A2E]">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4 bg-purple-500/20 text-purple-300 border-purple-500/30">
              <RulerIcon className="w-3 h-3 mr-1" />
              Calculator
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-6">
              Space Distance Calculator
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Calculate distances between celestial objects, space missions, and astronomical bodies.
            </p>
          </div>

          {/* Calculator */}
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm mb-8">
            <CardHeader>
              <CardTitle className="text-white">Distance Calculator</CardTitle>
              <CardDescription className="text-gray-400">
                Select two celestial objects to calculate the distance between them
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fromObject" className="text-white">From</Label>
                  <Select value={fromObject} onValueChange={setFromObject}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A1A2E] border-white/10 max-h-60">
                      {Object.entries(celestialObjects).map(([key, obj]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center">
                            <span>{obj.name}</span>
                            <Badge variant="outline" className="ml-2 text-xs bg-gray-500/20">
                              {obj.type}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {celestialObjects[fromObject] && (
                    <p className="text-sm text-gray-400">
                      {celestialObjects[fromObject].description}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="toObject" className="text-white">To</Label>
                  <Select value={toObject} onValueChange={setToObject}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A1A2E] border-white/10 max-h-60">
                      {Object.entries(celestialObjects).map(([key, obj]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center">
                            <span>{obj.name}</span>
                            <Badge variant="outline" className="ml-2 text-xs bg-gray-500/20">
                              {obj.type}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {celestialObjects[toObject] && (
                    <p className="text-sm text-gray-400">
                      {celestialObjects[toObject].description}
                    </p>
                  )}
                </div>
              </div>
              <Button 
                onClick={calculateDistance} 
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                <CalculatorIcon className="mr-2 h-4 w-4" />
                Calculate Distance
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          {result && (
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm mb-8">
              <CardHeader>
                <CardTitle className="text-white">Calculation Result</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-4">
                  <div className="text-4xl font-bold text-purple-300">
                    {formatNumber(result.distance)} {result.unit}
                  </div>
                  <p className="text-gray-300">{result.description}</p>
                  <p className="text-sm text-gray-400">{result.time}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Info Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/20 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="flex items-center mb-3">
                  <InfoIcon className="h-5 w-5 text-purple-300 mr-2" />
                  <h3 className="text-lg font-semibold text-purple-300">Units Explained</h3>
                </div>
                <ul className="text-gray-300 space-y-2 text-sm">
                  <li><strong>AU:</strong> Astronomical Unit (Earth-Sun distance)</li>
                  <li><strong>km:</strong> Kilometers</li>
                  <li><strong>Light Years:</strong> Distance light travels in one year</li>
                </ul>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="flex items-center mb-3">
                  <InfoIcon className="h-5 w-5 text-blue-300 mr-2" />
                  <h3 className="text-lg font-semibold text-blue-300">Travel Times</h3>
                </div>
                <ul className="text-gray-300 space-y-2 text-sm">
                  <li>• Current spacecraft: ~28,000 km/h</li>
                  <li>• Light speed: 299,792 km/s</li>
                  <li>• Times are approximate</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Quick Calculations */}
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Quick Distance Examples</CardTitle>
              <CardDescription className="text-gray-400">
                Common space distances for reference
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                  <div className="text-lg font-semibold text-purple-300">Earth to Moon</div>
                  <div className="text-sm text-gray-400">384,400 km</div>
                </div>
                <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                  <div className="text-lg font-semibold text-purple-300">Earth to Mars</div>
                  <div className="text-sm text-gray-400">225 million km</div>
                </div>
                <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                  <div className="text-lg font-semibold text-purple-300">Earth to Sun</div>
                  <div className="text-sm text-gray-400">149.6 million km</div>
                </div>
                <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                  <div className="text-lg font-semibold text-purple-300">Earth to Jupiter</div>
                  <div className="text-sm text-gray-400">778 million km</div>
                </div>
                <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                  <div className="text-lg font-semibold text-purple-300">Earth to Proxima Centauri</div>
                  <div className="text-sm text-gray-400">4.24 light years</div>
                </div>
                <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                  <div className="text-lg font-semibold text-purple-300">Earth to Andromeda</div>
                  <div className="text-sm text-gray-400">2.5 million light years</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default DistanceCalculator; 