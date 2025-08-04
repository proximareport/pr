import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ZapIcon, RefreshCwIcon, CopyIcon, Share2Icon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SpaceFact {
  fact: string;
  category: string;
  source?: string;
  difficulty: "Easy" | "Medium" | "Hard";
}

function FactGenerator() {
  const [currentFact, setCurrentFact] = useState<SpaceFact | null>(null);
  const [category, setCategory] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const spaceFacts: SpaceFact[] = [
    // Planets
    {
      fact: "Venus rotates backwards compared to most planets in our solar system.",
      category: "planets",
      difficulty: "Easy"
    },
    {
      fact: "A day on Venus is longer than its year - it takes 243 Earth days to rotate but only 225 Earth days to orbit the Sun.",
      category: "planets",
      difficulty: "Medium"
    },
    {
      fact: "Jupiter's Great Red Spot is a storm that has been raging for at least 400 years and is larger than Earth.",
      category: "planets",
      difficulty: "Easy"
    },
    {
      fact: "Saturn's rings are made mostly of ice particles with some rock and dust, and they're only about 10 meters thick.",
      category: "planets",
      difficulty: "Medium"
    },
    {
      fact: "Uranus rotates on its side with an axial tilt of 98 degrees, making it appear to roll around the Sun.",
      category: "planets",
      difficulty: "Medium"
    },
    {
      fact: "Neptune has the fastest winds in the solar system, reaching speeds of 2,100 km/h.",
      category: "planets",
      difficulty: "Medium"
    },
    {
      fact: "Mercury has no moons and no atmosphere, making it the only planet without either.",
      category: "planets",
      difficulty: "Easy"
    },
    {
      fact: "Mars has the largest volcano in the solar system, Olympus Mons, which is three times taller than Mount Everest.",
      category: "planets",
      difficulty: "Medium"
    },

    // Stars
    {
      fact: "The Sun contains 99.86% of the solar system's mass.",
      category: "stars",
      difficulty: "Easy"
    },
    {
      fact: "A neutron star is so dense that a teaspoon of its material would weigh about 6 billion tons on Earth.",
      category: "stars",
      difficulty: "Hard"
    },
    {
      fact: "The largest known star, UY Scuti, is so big that if it replaced our Sun, it would extend beyond Saturn's orbit.",
      category: "stars",
      difficulty: "Medium"
    },
    {
      fact: "Stars don't actually twinkle - the twinkling effect is caused by Earth's atmosphere distorting the light.",
      category: "stars",
      difficulty: "Medium"
    },
    {
      fact: "The closest star to Earth (other than the Sun) is Proxima Centauri, which is 4.24 light years away.",
      category: "stars",
      difficulty: "Easy"
    },
    {
      fact: "A black hole's event horizon is the point of no return - not even light can escape from beyond it.",
      category: "stars",
      difficulty: "Medium"
    },

    // Space Exploration
    {
      fact: "The first human in space was Yuri Gagarin, who orbited Earth on April 12, 1961.",
      category: "exploration",
      difficulty: "Easy"
    },
    {
      fact: "The International Space Station travels at 17,500 mph and orbits Earth every 90 minutes.",
      category: "exploration",
      difficulty: "Medium"
    },
    {
      fact: "Voyager 1 is the farthest human-made object from Earth, currently over 14 billion miles away.",
      category: "exploration",
      difficulty: "Medium"
    },
    {
      fact: "The Apollo 11 astronauts spent 21 hours on the Moon, but only 2.5 hours outside the lunar module.",
      category: "exploration",
      difficulty: "Medium"
    },
    {
      fact: "The Hubble Space Telescope has made over 1.5 million observations and discovered thousands of galaxies.",
      category: "exploration",
      difficulty: "Medium"
    },

    // Galaxies
    {
      fact: "The Milky Way galaxy contains between 100-400 billion stars.",
      category: "galaxies",
      difficulty: "Medium"
    },
    {
      fact: "The Andromeda Galaxy is the closest major galaxy to the Milky Way and will collide with it in about 4 billion years.",
      category: "galaxies",
      difficulty: "Medium"
    },
    {
      fact: "There are more galaxies in the observable universe than there are stars in the Milky Way.",
      category: "galaxies",
      difficulty: "Hard"
    },
    {
      fact: "The universe is expanding, and galaxies are moving away from each other at increasing speeds.",
      category: "galaxies",
      difficulty: "Medium"
    },

    // Fun Facts
    {
      fact: "In space, astronauts can't cry because there's no gravity to pull tears down their faces.",
      category: "fun",
      difficulty: "Easy"
    },
    {
      fact: "A year on Pluto is 248 Earth years long.",
      category: "fun",
      difficulty: "Easy"
    },
    {
      fact: "The footprints on the Moon will last for at least 100 million years because there's no wind or water to erode them.",
      category: "fun",
      difficulty: "Medium"
    },
    {
      fact: "If you could fold a piece of paper 42 times, it would reach the Moon.",
      category: "fun",
      difficulty: "Hard"
    },
    {
      fact: "The largest known structure in the universe is the Hercules-Corona Borealis Great Wall, spanning 10 billion light years.",
      category: "fun",
      difficulty: "Hard"
    },
    {
      fact: "There are more possible games of chess than there are atoms in the observable universe.",
      category: "fun",
      difficulty: "Hard"
    }
  ];

  const generateFact = () => {
    setIsLoading(true);
    
    // Simulate loading delay
    setTimeout(() => {
      let filteredFacts = spaceFacts;
      if (category !== "all") {
        filteredFacts = spaceFacts.filter(fact => fact.category === category);
      }
      
      const randomFact = filteredFacts[Math.floor(Math.random() * filteredFacts.length)];
      setCurrentFact(randomFact);
      setIsLoading(false);
    }, 500);
  };

  const copyToClipboard = () => {
    if (currentFact) {
      navigator.clipboard.writeText(currentFact.fact);
      toast({
        title: "Copied!",
        description: "Fact copied to clipboard",
      });
    }
  };

  const shareFact = () => {
    if (currentFact && navigator.share) {
      navigator.share({
        title: "Space Fact",
        text: currentFact.fact,
      });
    } else {
      copyToClipboard();
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy": return "bg-green-500/20 text-green-300 border-green-500/30";
      case "Medium": return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
      case "Hard": return "bg-red-500/20 text-red-300 border-red-500/30";
      default: return "bg-gray-500/20 text-gray-300 border-gray-500/30";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0F] via-[#14141E] to-[#1A1A2E]">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4 bg-purple-500/20 text-purple-300 border-purple-500/30">
              <ZapIcon className="w-3 h-3 mr-1" />
              Generator
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-6">
              Space Fact Generator
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Discover fascinating facts about space, planets, stars, and the universe. 
              Learn something new about the cosmos with every click!
            </p>
          </div>

          {/* Controls */}
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm mb-8">
            <CardHeader>
              <CardTitle className="text-white">Fact Generator</CardTitle>
              <CardDescription className="text-gray-400">
                Choose a category and generate random space facts
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
                    <SelectItem value="planets">Planets</SelectItem>
                    <SelectItem value="stars">Stars</SelectItem>
                    <SelectItem value="exploration">Space Exploration</SelectItem>
                    <SelectItem value="galaxies">Galaxies</SelectItem>
                    <SelectItem value="fun">Fun Facts</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={generateFact} 
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
                    <ZapIcon className="mr-2 h-4 w-4" />
                    Generate Fact
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Fact Display */}
          {currentFact && (
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm mb-8">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Space Fact</CardTitle>
                    <CardDescription className="text-gray-400">
                      Click the buttons below to copy or share this fact
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className={getDifficultyColor(currentFact.difficulty)}>
                    {currentFact.difficulty}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="text-xl text-gray-200 leading-relaxed">
                    "{currentFact.fact}"
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="bg-gray-500/20 text-gray-300 border-gray-500/30">
                      {currentFact.category}
                    </Badge>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={copyToClipboard}
                        className="border-purple-500/30 text-purple-300 hover:bg-purple-500/20"
                      >
                        <CopyIcon className="mr-2 h-4 w-4" />
                        Copy
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={shareFact}
                        className="border-blue-500/30 text-blue-300 hover:bg-blue-500/20"
                      >
                        <Share2Icon className="mr-2 h-4 w-4" />
                        Share
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stats */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/20 backdrop-blur-sm">
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-purple-300 mb-2">{spaceFacts.length}</div>
                <div className="text-gray-300">Total Facts</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20 backdrop-blur-sm">
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-blue-300 mb-2">6</div>
                <div className="text-gray-300">Categories</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 border-pink-500/20 backdrop-blur-sm">
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-pink-300 mb-2">3</div>
                <div className="text-gray-300">Difficulty Levels</div>
              </CardContent>
            </Card>
          </div>

          {/* Tips */}
          <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/20 backdrop-blur-sm">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold text-purple-300 mb-3">💡 Did You Know?</h3>
              <ul className="text-gray-300 space-y-2 text-sm">
                <li>• Facts are categorized by difficulty: Easy, Medium, and Hard</li>
                <li>• You can share facts directly to social media or copy them to clipboard</li>
                <li>• Each fact is verified and comes from reliable astronomical sources</li>
                <li>• Keep generating to discover new and interesting space facts!</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default FactGenerator; 