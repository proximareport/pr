import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrainIcon, CopyIcon, RefreshCwIcon, BookOpenIcon, StarIcon, RocketIcon, GlobeIcon, ZapIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
}

interface Quiz {
  title: string;
  description: string;
  questions: QuizQuestion[];
  totalQuestions: number;
  estimatedTime: string;
  difficulty: string;
}

function QuizGenerator() {
  const [generatedQuiz, setGeneratedQuiz] = useState<Quiz | null>(null);
  const [topic, setTopic] = useState("space-exploration");
  const [difficulty, setDifficulty] = useState("medium");
  const [questionCount, setQuestionCount] = useState(10);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const topics = {
    "space-exploration": {
      name: "Space Exploration",
      description: "Questions about space missions, astronauts, and exploration history",
      icon: <RocketIcon className="h-4 w-4" />
    },
    "astronomy": {
      name: "Astronomy",
      description: "Questions about stars, planets, galaxies, and celestial objects",
      icon: <StarIcon className="h-4 w-4" />
    },
    "planetary-science": {
      name: "Planetary Science",
      description: "Questions about planets, moons, and solar system bodies",
      icon: <GlobeIcon className="h-4 w-4" />
    },
    "space-technology": {
      name: "Space Technology",
      description: "Questions about rockets, satellites, and space technology",
      icon: <ZapIcon className="h-4 w-4" />
    },
    "space-history": {
      name: "Space History",
      description: "Questions about the history of space exploration and achievements",
      icon: <BookOpenIcon className="h-4 w-4" />
    }
  };

  const questionBank = {
    "space-exploration": [
      {
        question: "Who was the first human to walk on the Moon?",
        options: ["Neil Armstrong", "Buzz Aldrin", "Yuri Gagarin", "Alan Shepard"],
        correctAnswer: "Neil Armstrong",
        explanation: "Neil Armstrong became the first human to walk on the Moon on July 20, 1969, during the Apollo 11 mission.",
        difficulty: "easy"
      },
      {
        question: "What was the name of the first space station?",
        options: ["Mir", "Skylab", "Salyut 1", "International Space Station"],
        correctAnswer: "Salyut 1",
        explanation: "Salyut 1 was the first space station, launched by the Soviet Union in 1971.",
        difficulty: "medium"
      },
      {
        question: "Which spacecraft was the first to reach interstellar space?",
        options: ["Voyager 1", "Voyager 2", "Pioneer 10", "New Horizons"],
        correctAnswer: "Voyager 1",
        explanation: "Voyager 1 became the first spacecraft to reach interstellar space in 2012, crossing the heliopause.",
        difficulty: "hard"
      }
    ],
    "astronomy": [
      {
        question: "What is the closest star to Earth (other than the Sun)?",
        options: ["Alpha Centauri", "Proxima Centauri", "Sirius", "Vega"],
        correctAnswer: "Proxima Centauri",
        explanation: "Proxima Centauri is the closest star to Earth at about 4.24 light-years away.",
        difficulty: "easy"
      },
      {
        question: "What type of galaxy is the Milky Way?",
        options: ["Elliptical", "Spiral", "Irregular", "Lenticular"],
        correctAnswer: "Spiral",
        explanation: "The Milky Way is a barred spiral galaxy with a central bar and spiral arms.",
        difficulty: "medium"
      },
      {
        question: "What is a black hole's event horizon?",
        options: ["The surface of the black hole", "The point of no return", "The accretion disk", "The singularity"],
        correctAnswer: "The point of no return",
        explanation: "The event horizon is the boundary beyond which nothing, not even light, can escape the black hole's gravity.",
        difficulty: "hard"
      }
    ],
    "planetary-science": [
      {
        question: "Which planet has the most moons in our solar system?",
        options: ["Jupiter", "Saturn", "Uranus", "Neptune"],
        correctAnswer: "Saturn",
        explanation: "Saturn has the most moons with over 80 confirmed satellites, including its famous rings.",
        difficulty: "easy"
      },
      {
        question: "What is the largest volcano in the solar system?",
        options: ["Mount Everest", "Olympus Mons", "Mauna Kea", "Mount Kilimanjaro"],
        correctAnswer: "Olympus Mons",
        explanation: "Olympus Mons on Mars is the largest volcano in the solar system, standing about 22 km high.",
        difficulty: "medium"
      },
      {
        question: "What causes the Great Red Spot on Jupiter?",
        options: ["A massive storm", "Volcanic activity", "Magnetic fields", "Atmospheric pressure"],
        correctAnswer: "A massive storm",
        explanation: "The Great Red Spot is a persistent anticyclonic storm that has been raging for at least 400 years.",
        difficulty: "hard"
      }
    ],
    "space-technology": [
      {
        question: "What fuel do most modern rockets use?",
        options: ["Liquid hydrogen and oxygen", "Solid rocket fuel", "Nuclear fuel", "Electric propulsion"],
        correctAnswer: "Liquid hydrogen and oxygen",
        explanation: "Most modern rockets use liquid hydrogen and liquid oxygen as propellants for their high efficiency.",
        difficulty: "easy"
      },
      {
        question: "What is the purpose of a satellite's geostationary orbit?",
        options: ["To stay over one point on Earth", "To escape Earth's gravity", "To reach other planets", "To save fuel"],
        correctAnswer: "To stay over one point on Earth",
        explanation: "Geostationary satellites orbit at the same speed as Earth's rotation, staying over the same point.",
        difficulty: "medium"
      },
      {
        question: "What is ion propulsion?",
        options: ["Nuclear-powered rockets", "Electric propulsion using ions", "Solar sail technology", "Chemical rockets"],
        correctAnswer: "Electric propulsion using ions",
        explanation: "Ion propulsion uses electric fields to accelerate ions, providing low thrust but high efficiency over time.",
        difficulty: "hard"
      }
    ],
    "space-history": [
      {
        question: "In what year did the Space Age begin?",
        options: ["1957", "1961", "1969", "1973"],
        correctAnswer: "1957",
        explanation: "The Space Age began in 1957 with the launch of Sputnik 1, the first artificial satellite.",
        difficulty: "easy"
      },
      {
        question: "What was the first animal to orbit Earth?",
        options: ["Laika the dog", "Ham the chimpanzee", "Albert the monkey", "Félicette the cat"],
        correctAnswer: "Laika the dog",
        explanation: "Laika, a Soviet space dog, became the first animal to orbit Earth aboard Sputnik 2 in 1957.",
        difficulty: "medium"
      },
      {
        question: "What was the purpose of the Apollo-Soyuz Test Project?",
        options: ["Moon landing", "Space station construction", "US-Soviet cooperation", "Mars mission preparation"],
        correctAnswer: "US-Soviet cooperation",
        explanation: "The Apollo-Soyuz Test Project was the first joint US-Soviet space mission, marking the end of the Space Race.",
        difficulty: "hard"
      }
    ]
  };

  const generateQuiz = () => {
    setIsGenerating(true);
    
    setTimeout(() => {
      const topicData = questionBank[topic as keyof typeof questionBank];
      const filteredQuestions = topicData.filter(q => q.difficulty === difficulty);
      
      // Shuffle and select questions
      const shuffled = [...filteredQuestions].sort(() => 0.5 - Math.random());
      const selectedQuestions = shuffled.slice(0, Math.min(questionCount, shuffled.length));
      
      // Add some questions from other difficulties if needed
      if (selectedQuestions.length < questionCount) {
        const otherQuestions = topicData.filter(q => q.difficulty !== difficulty);
        const shuffledOthers = [...otherQuestions].sort(() => 0.5 - Math.random());
        selectedQuestions.push(...shuffledOthers.slice(0, questionCount - selectedQuestions.length));
      }
      
      const quiz: Quiz = {
        title: `${topics[topic as keyof typeof topics].name} Quiz`,
        description: `Test your knowledge of ${topics[topic as keyof typeof topics].name.toLowerCase()} with ${selectedQuestions.length} questions.`,
        questions: selectedQuestions,
        totalQuestions: selectedQuestions.length,
        estimatedTime: `${Math.ceil(selectedQuestions.length * 1.5)} minutes`,
        difficulty: difficulty.charAt(0).toUpperCase() + difficulty.slice(1)
      };
      
      setGeneratedQuiz(quiz);
      setIsGenerating(false);
    }, 1000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Quiz copied to clipboard",
    });
  };

  const exportQuiz = () => {
    if (!generatedQuiz) return;
    
    const quizText = `
${generatedQuiz.title}
${generatedQuiz.description}

Difficulty: ${generatedQuiz.difficulty}
Estimated Time: ${generatedQuiz.estimatedTime}
Total Questions: ${generatedQuiz.totalQuestions}

${generatedQuiz.questions.map((q, i) => `
${i + 1}. ${q.question}
   A) ${q.options[0]}
   B) ${q.options[1]}
   C) ${q.options[2]}
   D) ${q.options[3]}

   Answer: ${q.correctAnswer}
   Explanation: ${q.explanation}
`).join('\n')}
    `.trim();
    
    navigator.clipboard.writeText(quizText);
    toast({
      title: "Exported!",
      description: "Quiz exported to clipboard",
    });
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case "easy":
        return "bg-green-500/20 text-green-300 border-green-500/30";
      case "medium":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
      case "hard":
        return "bg-red-500/20 text-red-300 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/30";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0F] via-[#14141E] to-[#1A1A2E]">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4 bg-purple-500/20 text-purple-300 border-purple-500/30">
            <BrainIcon className="w-3 h-3 mr-1" />
            Quiz Generator
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-6">
            Space Quiz Generator
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Create custom space and STEM quizzes for learning and testing knowledge. 
            Perfect for educators, students, and space enthusiasts.
          </p>
        </div>

        {/* Controls */}
        <div className="max-w-4xl mx-auto mb-12">
          <Card className="bg-gray-900/50 border border-gray-800/50">
            <CardContent className="p-6">
              <div className="grid gap-6 md:grid-cols-4">
                <div>
                  <Label htmlFor="topic" className="text-gray-300">Topic</Label>
                  <Select value={topic} onValueChange={setTopic}>
                    <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      {Object.entries(topics).map(([key, topicData]) => (
                        <SelectItem key={key} value={key}>
                          {topicData.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-gray-400 text-sm mt-2">
                    {topics[topic as keyof typeof topics].description}
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="difficulty" className="text-gray-300">Difficulty</Label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="questionCount" className="text-gray-300">Questions</Label>
                  <Input
                    id="questionCount"
                    type="number"
                    min="5"
                    max="50"
                    value={questionCount}
                    onChange={(e) => setQuestionCount(parseInt(e.target.value) || 5)}
                    className="bg-gray-800/50 border-gray-700 text-white"
                  />
                </div>
                
                <div className="flex items-end">
                  <Button 
                    onClick={generateQuiz}
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
                        <BrainIcon className="h-4 w-4 mr-2" />
                        Generate Quiz
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        {generatedQuiz && (
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">{generatedQuiz.title}</h2>
                <p className="text-gray-400">{generatedQuiz.description}</p>
              </div>
              <div className="flex space-x-3">
                <Button 
                  onClick={exportQuiz}
                  variant="outline"
                  className="border-purple-500 text-purple-400 hover:bg-purple-500/10"
                >
                  <CopyIcon className="h-4 w-4 mr-2" />
                  Export Quiz
                </Button>
              </div>
            </div>
            
            <div className="grid gap-4 mb-6">
              <div className="flex space-x-4 text-sm">
                <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                  {generatedQuiz.totalQuestions} Questions
                </Badge>
                <Badge className={getDifficultyColor(generatedQuiz.difficulty)}>
                  {generatedQuiz.difficulty}
                </Badge>
                <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                  {generatedQuiz.estimatedTime}
                </Badge>
              </div>
            </div>
            
            <div className="space-y-6">
              {generatedQuiz.questions.map((question, index) => (
                <Card key={index} className="bg-gray-900/50 border border-gray-800/50">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-white text-lg">
                        Question {index + 1}
                      </CardTitle>
                      <Badge className={getDifficultyColor(question.difficulty)}>
                        {question.difficulty}
                      </Badge>
                    </div>
                    <CardDescription className="text-gray-300 text-base">
                      {question.question}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-2">
                      {question.options.map((option, optIndex) => (
                        <div 
                          key={optIndex}
                          className={`p-3 rounded-lg border ${
                            option === question.correctAnswer 
                              ? "bg-green-500/10 border-green-500/30 text-green-300" 
                              : "bg-gray-800/30 border-gray-700 text-gray-300"
                          }`}
                        >
                          <span className="font-medium mr-2">
                            {String.fromCharCode(65 + optIndex)}) 
                          </span>
                          {option}
                          {option === question.correctAnswer && (
                            <Badge className="ml-2 bg-green-500/20 text-green-300 border-green-500/30">
                              Correct
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    <div className="bg-gray-800/30 rounded-lg p-4">
                      <h4 className="font-semibold text-purple-400 mb-2">Explanation:</h4>
                      <p className="text-gray-300 text-sm">{question.explanation}</p>
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
              <h3 className="text-xl font-semibold text-white mb-4">Quiz Tips</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-semibold text-purple-400 mb-2">For Educators</h4>
                  <ul className="text-gray-300 text-sm space-y-1">
                    <li>• Use quizzes to assess student knowledge</li>
                    <li>• Export quizzes for offline use</li>
                    <li>• Mix difficulty levels for engagement</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-purple-400 mb-2">For Students</h4>
                  <ul className="text-gray-300 text-sm space-y-1">
                    <li>• Start with easy questions to build confidence</li>
                    <li>• Read explanations to learn from mistakes</li>
                    <li>• Practice regularly to improve knowledge</li>
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

export default QuizGenerator; 