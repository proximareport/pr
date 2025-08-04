import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { PaletteIcon, RefreshCwIcon, CopyIcon, DownloadIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ColorPalette {
  name: string;
  colors: string[];
  description: string;
  category: string;
}

function ColorPalette() {
  const [currentPalette, setCurrentPalette] = useState<ColorPalette | null>(null);
  const [category, setCategory] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const spacePalettes: ColorPalette[] = [
    {
      name: "Deep Space",
      colors: ["#0B0B0F", "#1A1A2E", "#16213E", "#0F3460", "#533483"],
      description: "Dark cosmic blues and purples inspired by deep space",
      category: "cosmic"
    },
    {
      name: "Aurora Borealis",
      colors: ["#2D3748", "#4A5568", "#38B2AC", "#81E6D9", "#B794F4"],
      description: "Northern lights inspired with teals and purples",
      category: "aurora"
    },
    {
      name: "Solar Flare",
      colors: ["#FF6B35", "#F7931E", "#FFD23F", "#FFEAA7", "#DDA0DD"],
      description: "Warm oranges and yellows like a solar eruption",
      category: "solar"
    },
    {
      name: "Nebula Dream",
      colors: ["#667eea", "#764ba2", "#f093fb", "#f5576c", "#4facfe"],
      description: "Pink and purple gradients like cosmic nebulae",
      category: "nebula"
    },
    {
      name: "Martian Surface",
      colors: ["#8B4513", "#CD853F", "#DEB887", "#F4A460", "#D2691E"],
      description: "Rusty reds and browns of the Martian landscape",
      category: "planetary"
    },
    {
      name: "Ice Giant",
      colors: ["#E0F6FF", "#B3E5FC", "#81D4FA", "#4FC3F7", "#29B6F6"],
      description: "Cool blues and cyans like Uranus and Neptune",
      category: "planetary"
    },
    {
      name: "Stellar Core",
      colors: ["#FF1744", "#FF5722", "#FF9800", "#FFC107", "#FFEB3B"],
      description: "Intense reds and oranges like a star's core",
      category: "stellar"
    },
    {
      name: "Cosmic Dust",
      colors: ["#2C3E50", "#34495E", "#7F8C8D", "#95A5A6", "#BDC3C7"],
      description: "Muted grays and blues like interstellar dust",
      category: "cosmic"
    },
    {
      name: "Galaxy Cluster",
      colors: ["#1A1A2E", "#16213E", "#0F3460", "#533483", "#E94560"],
      description: "Deep space with a pop of cosmic pink",
      category: "galaxy"
    },
    {
      name: "Moonlight",
      colors: ["#F8F9FA", "#E9ECEF", "#DEE2E6", "#CED4DA", "#ADB5BD"],
      description: "Soft silvers and grays like moonlight",
      category: "lunar"
    },
    {
      name: "Comet Tail",
      colors: ["#FFFFFF", "#F0F8FF", "#E6F3FF", "#CCE7FF", "#B3DBFF"],
      description: "Pure whites to light blues like a comet's trail",
      category: "cosmic"
    },
    {
      name: "Black Hole",
      colors: ["#000000", "#1A1A1A", "#333333", "#4D4D4D", "#666666"],
      description: "Deep blacks and grays like a black hole's event horizon",
      category: "cosmic"
    }
  ];

  const generatePalette = () => {
    setIsLoading(true);
    
    setTimeout(() => {
      let filteredPalettes = spacePalettes;
      if (category !== "all") {
        filteredPalettes = spacePalettes.filter(palette => palette.category === category);
      }
      
      const randomPalette = filteredPalettes[Math.floor(Math.random() * filteredPalettes.length)];
      setCurrentPalette(randomPalette);
      setIsLoading(false);
    }, 500);
  };

  const copyToClipboard = (color: string) => {
    navigator.clipboard.writeText(color);
    toast({
      title: "Copied!",
      description: `Color ${color} copied to clipboard`,
    });
  };

  const copyAllColors = () => {
    if (currentPalette) {
      const allColors = currentPalette.colors.join(", ");
      navigator.clipboard.writeText(allColors);
      toast({
        title: "Copied!",
        description: "All colors copied to clipboard",
      });
    }
  };

  const downloadPalette = () => {
    if (currentPalette) {
      const css = `/* ${currentPalette.name} Color Palette */
${currentPalette.colors.map((color, index) => `--color-${index + 1}: ${color};`).join('\n')}

/* Usage */
.primary-color { color: var(--color-1); }
.secondary-color { color: var(--color-2); }
.accent-color { color: var(--color-3); }
.background-color { background-color: var(--color-4); }
.highlight-color { background-color: var(--color-5); }`;

      const blob = new Blob([css], { type: 'text/css' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentPalette.name.toLowerCase().replace(/\s+/g, '-')}-palette.css`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0F] via-[#14141E] to-[#1A1A2E]">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4 bg-purple-500/20 text-purple-300 border-purple-500/30">
              <PaletteIcon className="w-3 h-3 mr-1" />
              Generator
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-6">
              Space Color Palette
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Generate beautiful space-themed color palettes for your design projects. 
              Inspired by the cosmos, planets, and celestial phenomena.
            </p>
          </div>

          {/* Controls */}
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm mb-8">
            <CardHeader>
              <CardTitle className="text-white">Palette Generator</CardTitle>
              <CardDescription className="text-gray-400">
                Choose a category and generate space-inspired color schemes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="category" className="text-white">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A1A2E] border-white/10">
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="cosmic">Cosmic</SelectItem>
                    <SelectItem value="aurora">Aurora</SelectItem>
                    <SelectItem value="solar">Solar</SelectItem>
                    <SelectItem value="nebula">Nebula</SelectItem>
                    <SelectItem value="planetary">Planetary</SelectItem>
                    <SelectItem value="stellar">Stellar</SelectItem>
                    <SelectItem value="galaxy">Galaxy</SelectItem>
                    <SelectItem value="lunar">Lunar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={generatePalette} 
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {isLoading ? (
                  <>
                    <RefreshCwIcon className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <PaletteIcon className="mr-2 h-4 w-4" />
                    Generate Palette
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Palette Display */}
          {currentPalette && (
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm mb-8">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">{currentPalette.name}</CardTitle>
                    <CardDescription className="text-gray-400">
                      {currentPalette.description}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={copyAllColors}
                      className="border-purple-500/30 text-purple-300 hover:bg-purple-500/20"
                    >
                      <CopyIcon className="mr-2 h-4 w-4" />
                      Copy All
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={downloadPalette}
                      className="border-blue-500/30 text-blue-300 hover:bg-blue-500/20"
                    >
                      <DownloadIcon className="mr-2 h-4 w-4" />
                      Download CSS
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-5 gap-4">
                    {currentPalette.colors.map((color, index) => (
                      <div
                        key={index}
                        className="group cursor-pointer"
                        onClick={() => copyToClipboard(color)}
                      >
                        <div 
                          className="h-20 rounded-lg mb-2 border-2 border-white/10 group-hover:border-white/30 transition-all duration-200"
                          style={{ backgroundColor: color }}
                        />
                        <div className="text-center">
                          <div className="text-sm font-mono text-gray-300 group-hover:text-white transition-colors">
                            {color}
                          </div>
                          <div className="text-xs text-gray-500">Click to copy</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Usage Examples */}
          {currentPalette && (
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm mb-8">
              <CardHeader>
                <CardTitle className="text-white">Usage Examples</CardTitle>
                <CardDescription className="text-gray-400">
                  How to use this color palette in your projects
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-purple-300">CSS Variables</h4>
                    <div className="bg-black/20 p-4 rounded-lg">
                      <pre className="text-sm text-gray-300 overflow-x-auto">
{`/* ${currentPalette.name} Palette */
:root {
${currentPalette.colors.map((color, index) => `  --space-${index + 1}: ${color};`).join('\n')}
}`}
                      </pre>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-purple-300">Tailwind Config</h4>
                    <div className="bg-black/20 p-4 rounded-lg">
                      <pre className="text-sm text-gray-300 overflow-x-auto">
{`// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        space: {
${currentPalette.colors.map((color, index) => `          ${index + 1}: '${color}',`).join('\n')}
        }
      }
    }
  }
}`}
                      </pre>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tips */}
          <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/20 backdrop-blur-sm">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold text-purple-300 mb-3">🎨 Design Tips</h3>
              <ul className="text-gray-300 space-y-2 text-sm">
                <li>• Use darker colors for backgrounds and lighter colors for text/accents</li>
                <li>• Consider accessibility - ensure sufficient contrast ratios</li>
                <li>• These palettes work great for space-themed websites, apps, and graphics</li>
                <li>• Download the CSS file for easy integration into your projects</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default ColorPalette; 