import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Globe2Icon, CopyIcon, RefreshCwIcon, StarIcon, MoonIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PlanetName {
  name: string;
  type: string;
  description: string;
  origin: string;
}

function PlanetGenerator() {
  const [generatedNames, setGeneratedNames] = useState<PlanetName[]>([]);
  const [planetType, setPlanetType] = useState("terrestrial");
  const [count, setCount] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const planetTypes = {
    terrestrial: {
      name: "Terrestrial Planet",
      description: "Rocky planets like Earth, Mars, Venus",
      prefixes: ["Terra", "Geo", "Litho", "Petra", "Roca", "Kamen", "Stein", "Pietra"],
      suffixes: ["Prime", "Alpha", "Beta", "Gamma", "Delta", "Epsilon", "Zeta", "Eta"],
      origins: ["Ancient Greek", "Latin", "Sanskrit", "Arabic", "Norse", "Celtic"]
    },
    gasGiant: {
      name: "Gas Giant",
      description: "Large gaseous planets like Jupiter, Saturn",
      prefixes: ["Jov", "Sat", "Nep", "Ura", "Aero", "Vent", "Zeph", "Bore"],
      suffixes: ["Major", "Maximus", "Magnus", "Grandis", "Rex", "Imperator", "Dominus"],
      origins: ["Roman", "Greek", "Latin", "Celtic", "Norse", "Egyptian"]
    },
    iceGiant: {
      name: "Ice Giant",
      description: "Cold gaseous planets like Neptune, Uranus",
      prefixes: ["Cryo", "Glac", "Frig", "Niv", "Gel", "Frost", "Ice", "Snow"],
      suffixes: ["Frigidus", "Glacialis", "Nivalis", "Cryogen", "Frost", "Ice"],
      origins: ["Latin", "Greek", "Norse", "Celtic", "Inuit", "Siberian"]
    },
    dwarf: {
      name: "Dwarf Planet",
      description: "Small planetary bodies like Pluto, Ceres",
      prefixes: ["Nano", "Micro", "Mini", "Pico", "Tiny", "Small", "Minor", "Petit"],
      suffixes: ["Minor", "Nanus", "Parvus", "Minimus", "Micro", "Nano"],
      origins: ["Greek", "Latin", "Celtic", "Norse", "Japanese", "Chinese"]
    },
    moon: {
      name: "Moon/Satellite",
      description: "Natural satellites orbiting planets",
      prefixes: ["Luna", "Selene", "Diana", "Artemis", "Cynthia", "Phoebe", "Theia"],
      suffixes: ["Lunar", "Selen", "Moon", "Satellite", "Orbital", "Lunaris"],
      origins: ["Roman", "Greek", "Celtic", "Norse", "Egyptian", "Babylonian"]
    },
    exoplanet: {
      name: "Exoplanet",
      description: "Planets orbiting other stars",
      prefixes: ["Exo", "Alien", "Foreign", "Distant", "Remote", "Far", "Outer"],
      suffixes: ["Exo", "Alien", "Foreign", "Distant", "Remote", "Far"],
      origins: ["Greek", "Latin", "Arabic", "Chinese", "Japanese", "Sanskrit"]
    }
  };

  const generatePlanetNames = () => {
    setIsGenerating(true);
    
    setTimeout(() => {
      const type = planetTypes[planetType as keyof typeof planetTypes];
      const names: PlanetName[] = [];
      
      for (let i = 0; i < count; i++) {
        const prefix = type.prefixes[Math.floor(Math.random() * type.prefixes.length)];
        const suffix = type.suffixes[Math.floor(Math.random() * type.suffixes.length)];
        const origin = type.origins[Math.floor(Math.random() * type.origins.length)];
        
        // Generate name variations
        const nameVariations = [
          `${prefix}${suffix}`,
          `${prefix}-${suffix}`,
          `${prefix} ${suffix}`,
          `${prefix}${suffix}${Math.floor(Math.random() * 999) + 1}`,
          `${prefix}${suffix} ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`,
        ];
        
        const name = nameVariations[Math.floor(Math.random() * nameVariations.length)];
        
        names.push({
          name,
          type: type.name,
          description: type.description,
          origin
        });
      }
      
      setGeneratedNames(names);
      setIsGenerating(false);
    }, 1000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Planet name copied to clipboard",
    });
  };

  const copyAllToClipboard = () => {
    const allNames = generatedNames.map(planet => planet.name).join(", ");
    navigator.clipboard.writeText(allNames);
    toast({
      title: "Copied!",
      description: "All planet names copied to clipboard",
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Terrestrial Planet":
        return <Globe2Icon className="h-4 w-4" />;
      case "Gas Giant":
        return <StarIcon className="h-4 w-4" />;
      case "Ice Giant":
        return <MoonIcon className="h-4 w-4" />;
      case "Dwarf Planet":
        return <Globe2Icon className="h-4 w-4" />;
      case "Moon/Satellite":
        return <MoonIcon className="h-4 w-4" />;
      case "Exoplanet":
        return <StarIcon className="h-4 w-4" />;
      default:
        return <Globe2Icon className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0F] via-[#14141E] to-[#1A1A2E]">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4 bg-purple-500/20 text-purple-300 border-purple-500/30">
            <Globe2Icon className="w-3 h-3 mr-1" />
            Planet Generator
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-6">
            Planet Name Generator
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Create unique and imaginative names for planets, moons, and celestial bodies. 
            Perfect for world-building, sci-fi writing, and space exploration projects.
          </p>
        </div>

        {/* Controls */}
        <div className="max-w-4xl mx-auto mb-12">
          <Card className="bg-gray-900/50 border border-gray-800/50">
            <CardContent className="p-6">
              <div className="grid gap-6 md:grid-cols-3">
                <div>
                  <Label htmlFor="planetType" className="text-gray-300">Planet Type</Label>
                  <Select value={planetType} onValueChange={setPlanetType}>
                    <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      {Object.entries(planetTypes).map(([key, type]) => (
                        <SelectItem key={key} value={key}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-gray-400 text-sm mt-2">
                    {planetTypes[planetType as keyof typeof planetTypes].description}
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="count" className="text-gray-300">Number of Names</Label>
                  <Input
                    id="count"
                    type="number"
                    min="1"
                    max="20"
                    value={count}
                    onChange={(e) => setCount(parseInt(e.target.value) || 1)}
                    className="bg-gray-800/50 border-gray-700 text-white"
                  />
                </div>
                
                <div className="flex items-end">
                  <Button 
                    onClick={generatePlanetNames}
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
                        <Globe2Icon className="h-4 w-4 mr-2" />
                        Generate Names
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        {generatedNames.length > 0 && (
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                Generated Planet Names ({generatedNames.length})
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
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {generatedNames.map((planet, index) => (
                <Card key={index} className="bg-gray-900/50 border border-gray-800/50 hover:border-purple-500/30 transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(planet.type)}
                        <CardTitle className="text-white text-lg">{planet.name}</CardTitle>
                      </div>
                      <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                        {planet.type}
                      </Badge>
                    </div>
                    <CardDescription className="text-gray-400">
                      {planet.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Origin:</span>
                        <span className="text-gray-300">{planet.origin}</span>
                      </div>
                      <Button 
                        onClick={() => copyToClipboard(planet.name)}
                        size="sm"
                        variant="outline"
                        className="w-full border-gray-700 text-gray-300 hover:border-purple-500 hover:text-purple-400"
                      >
                        <CopyIcon className="h-4 w-4 mr-2" />
                        Copy Name
                      </Button>
                    </div>
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
              <h3 className="text-xl font-semibold text-white mb-4">Naming Tips</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-semibold text-purple-400 mb-2">For Terrestrial Planets</h4>
                  <ul className="text-gray-300 text-sm space-y-1">
                    <li>• Use geological terms (Terra, Geo, Litho)</li>
                    <li>• Consider ancient languages (Greek, Latin)</li>
                    <li>• Add descriptive suffixes (Prime, Alpha, Beta)</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-purple-400 mb-2">For Gas Giants</h4>
                  <ul className="text-gray-300 text-sm space-y-1">
                    <li>• Use atmospheric terms (Aero, Vent, Zeph)</li>
                    <li>• Consider mythological gods (Jov, Sat, Nep)</li>
                    <li>• Add majestic suffixes (Major, Maximus, Rex)</li>
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

export default PlanetGenerator; 