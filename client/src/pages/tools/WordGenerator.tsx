import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TypeIcon, CopyIcon, RefreshCwIcon, SparklesIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function WordGenerator() {
  const [generatedWords, setGeneratedWords] = useState<string[]>([]);
  const [wordType, setWordType] = useState("spacecraft");
  const [count, setCount] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const wordLists = {
    spacecraft: [
      "Nebula Voyager", "Stellar Phoenix", "Cosmic Explorer", "Aurora Runner", "Pulsar Drifter",
      "Quantum Leap", "Stardust Cruiser", "Nova Chaser", "Meteor Swift", "Comet Tracker",
      "Galaxy Seeker", "Orbit Master", "Solar Sailor", "Lunar Walker", "Mars Rover",
      "Venus Flyer", "Jupiter Jumper", "Saturn Surfer", "Uranus Cruiser", "Neptune Navigator"
    ],
    planets: [
      "Aethon", "Borealis", "Caelum", "Draco", "Elysium", "Fortuna", "Gaia", "Helios",
      "Icarus", "Juno", "Kronos", "Luna", "Mira", "Nova", "Orion", "Perseus",
      "Quasar", "Rigel", "Sirius", "Titan", "Ursa", "Vega", "Warp", "Xenon"
    ],
    stations: [
      "Alpha Station", "Beta Base", "Gamma Gateway", "Delta Depot", "Echo Enterprise",
      "Falcon Fortress", "Guardian Gateway", "Horizon Hub", "Infinity Station", "Jupiter Junction",
      "Kepler Keep", "Lunar Lodge", "Mars Manor", "Nebula Nest", "Orbital Oasis",
      "Polaris Port", "Quantum Quarters", "Rigel Refuge", "Solar Sanctuary", "Titan Tower"
    ],
    missions: [
      "Project Stardust", "Operation Nova", "Mission Aurora", "Voyage Pulsar", "Quest Comet",
      "Expedition Galaxy", "Journey Orbit", "Adventure Solar", "Trek Lunar", "Rover Mars",
      "Flyer Venus", "Jumper Jupiter", "Surfer Saturn", "Cruiser Uranus", "Navigator Neptune"
    ],
    technologies: [
      "Quantum Drive", "Plasma Engine", "Fusion Reactor", "Gravity Well", "Warp Core",
      "Shield Generator", "Tractor Beam", "Photon Torpedo", "Ion Cannon", "Laser Array",
      "Neutrino Detector", "Tachyon Scanner", "Hyperspace Module", "Wormhole Generator", "Time Dilation Field"
    ]
  };

  const generateWords = () => {
    setIsGenerating(true);
    
    // Simulate generation delay
    setTimeout(() => {
      const selectedList = wordLists[wordType as keyof typeof wordLists];
      const shuffled = [...selectedList].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, Math.min(count, selectedList.length));
      setGeneratedWords(selected);
      setIsGenerating(false);
    }, 500);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Word copied to clipboard",
    });
  };

  const copyAllToClipboard = () => {
    const allWords = generatedWords.join(", ");
    navigator.clipboard.writeText(allWords);
    toast({
      title: "Copied!",
      description: "All words copied to clipboard",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0F] via-[#14141E] to-[#1A1A2E]">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4 bg-purple-500/20 text-purple-300 border-purple-500/30">
              <TypeIcon className="w-3 h-3 mr-1" />
              Generator
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-6">
              Space Word Generator
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Generate creative space-themed names and terminology for your projects, stories, and missions.
            </p>
          </div>

          {/* Controls */}
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm mb-8">
            <CardHeader>
              <CardTitle className="text-white">Generator Settings</CardTitle>
              <CardDescription className="text-gray-400">
                Customize your word generation preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="wordType" className="text-white">Word Type</Label>
                  <Select value={wordType} onValueChange={setWordType}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A1A2E] border-white/10">
                      <SelectItem value="spacecraft">Spacecraft Names</SelectItem>
                      <SelectItem value="planets">Planet Names</SelectItem>
                      <SelectItem value="stations">Space Stations</SelectItem>
                      <SelectItem value="missions">Mission Names</SelectItem>
                      <SelectItem value="technologies">Technologies</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="count" className="text-white">Number of Words</Label>
                  <Input
                    id="count"
                    type="number"
                    min="1"
                    max="20"
                    value={count}
                    onChange={(e) => setCount(parseInt(e.target.value) || 1)}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>
              <Button 
                onClick={generateWords} 
                disabled={isGenerating}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {isGenerating ? (
                  <>
                    <RefreshCwIcon className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="mr-2 h-4 w-4" />
                    Generate Words
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          {generatedWords.length > 0 && (
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Generated Words</CardTitle>
                    <CardDescription className="text-gray-400">
                      Click any word to copy it to your clipboard
                    </CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={copyAllToClipboard}
                    className="border-purple-500/30 text-purple-300 hover:bg-purple-500/20"
                  >
                    <CopyIcon className="mr-2 h-4 w-4" />
                    Copy All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {generatedWords.map((word, index) => (
                    <div
                      key={index}
                      onClick={() => copyToClipboard(word)}
                      className="p-4 bg-white/5 border border-white/10 rounded-lg cursor-pointer hover:bg-white/10 transition-all duration-200 group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-white font-medium group-hover:text-purple-300 transition-colors">
                          {word}
                        </span>
                        <CopyIcon className="h-4 w-4 text-gray-400 group-hover:text-purple-300 transition-colors" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tips */}
          <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/20 backdrop-blur-sm mt-8">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold text-purple-300 mb-3">💡 Tips for Using Generated Words</h3>
              <ul className="text-gray-300 space-y-2 text-sm">
                <li>• Combine multiple words to create unique compound names</li>
                <li>• Use these as inspiration for your own creative variations</li>
                <li>• Consider the meaning and origin of space terminology</li>
                <li>• Mix and match from different categories for variety</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default WordGenerator; 