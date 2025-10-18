import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MailIcon, MapPinIcon, ClockIcon, BriefcaseIcon, UsersIcon, RocketIcon, StarIcon, ArrowRightIcon } from "lucide-react";
import ParticleBackground from "@/components/ParticleBackground";
import GradientBackground from "@/components/GradientBackground";

interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  experience: string;
  description: string;
  requirements: string[];
  benefits: string[];
  featured?: boolean;
}

const mockJobs: Job[] = [
  {
    id: "1",
    title: "Senior Software Engineer - Space Systems",
    department: "Engineering",
    location: "Remote / Houston, TX",
    type: "Full-time",
    experience: "5+ years",
    description: "Lead development of mission-critical space systems software for next-generation spacecraft.",
    requirements: [
      "Bachelor's degree in Computer Science or related field",
      "5+ years experience with C++, Python, and real-time systems",
      "Experience with aerospace software development",
      "Strong problem-solving and communication skills"
    ],
    benefits: [
      "Competitive salary and equity",
      "Comprehensive health insurance",
      "Flexible work arrangements",
      "Professional development budget"
    ],
    featured: true
  },
  {
    id: "2",
    title: "Mission Operations Specialist",
    department: "Operations",
    location: "Houston, TX",
    type: "Full-time",
    experience: "3+ years",
    description: "Coordinate mission operations and ensure successful spacecraft deployments.",
    requirements: [
      "Bachelor's degree in Aerospace Engineering or related field",
      "3+ years experience in mission operations",
      "Knowledge of orbital mechanics and spacecraft systems",
      "Ability to work in high-pressure environments"
    ],
    benefits: [
      "Competitive salary",
      "Health and dental insurance",
      "401(k) matching",
      "Paid time off"
    ]
  },
  {
    id: "3",
    title: "Data Scientist - Space Analytics",
    department: "Data & Analytics",
    location: "Remote",
    type: "Full-time",
    experience: "2+ years",
    description: "Analyze space mission data to optimize operations and drive insights.",
    requirements: [
      "Master's degree in Data Science, Statistics, or related field",
      "2+ years experience with Python, R, and machine learning",
      "Experience with time series analysis",
      "Strong analytical and communication skills"
    ],
    benefits: [
      "Competitive salary and equity",
      "Remote work flexibility",
      "Learning and development opportunities",
      "Health insurance"
    ]
  },
  {
    id: "4",
    title: "Propulsion Engineer",
    department: "Engineering",
    location: "Los Angeles, CA",
    type: "Full-time",
    experience: "4+ years",
    description: "Design and develop advanced propulsion systems for space missions.",
    requirements: [
      "Bachelor's degree in Mechanical or Aerospace Engineering",
      "4+ years experience in propulsion systems",
      "Knowledge of rocket propulsion principles",
      "Experience with CAD software"
    ],
    benefits: [
      "Competitive salary",
      "Health insurance",
      "Relocation assistance",
      "Stock options"
    ]
  },
  {
    id: "5",
    title: "Marketing Manager - Space Technology",
    department: "Marketing",
    location: "Remote",
    type: "Full-time",
    experience: "3+ years",
    description: "Lead marketing initiatives for our space technology products and services.",
    requirements: [
      "Bachelor's degree in Marketing or related field",
      "3+ years experience in B2B marketing",
      "Experience with digital marketing and content creation",
      "Strong writing and communication skills"
    ],
    benefits: [
      "Competitive salary",
      "Flexible work arrangements",
      "Marketing budget for campaigns",
      "Health insurance"
    ]
  },
  {
    id: "6",
    title: "Quality Assurance Engineer",
    department: "Engineering",
    location: "Houston, TX",
    type: "Full-time",
    experience: "2+ years",
    description: "Ensure quality and reliability of space systems through comprehensive testing.",
    requirements: [
      "Bachelor's degree in Engineering or related field",
      "2+ years experience in QA/testing",
      "Knowledge of testing methodologies",
      "Attention to detail and analytical skills"
    ],
    benefits: [
      "Competitive salary",
      "Health insurance",
      "Professional development",
      "Paid time off"
    ]
  }
];

const Careers: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");

  const departments = ["All", "Engineering", "Operations", "Data & Analytics", "Marketing"];
  const locations = ["All", "Remote", "Houston, TX", "Los Angeles, CA"];

  const filteredJobs = mockJobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         job.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment = !selectedDepartment || selectedDepartment === "All" || job.department === selectedDepartment;
    const matchesLocation = !selectedLocation || selectedLocation === "All" || job.location.includes(selectedLocation);
    
    return matchesSearch && matchesDepartment && matchesLocation;
  });

  const featuredJobs = filteredJobs.filter(job => job.featured);
  const regularJobs = filteredJobs.filter(job => !job.featured);

  return (
    <>
      <div className="min-h-screen relative overflow-hidden">
        <GradientBackground variant="cosmic" intensity="medium" />
        <ParticleBackground 
          particleCount={60} 
          speed={0.6}
          colors={['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B']}
        />
        
        <div className="relative z-10">
          <div className="container mx-auto px-4 py-16">
            {/* Header */}
            <div className="text-center mb-16">
              <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Join Our Mission
              </h1>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
                Be part of the team that's pushing the boundaries of space exploration and technology. 
                Work on cutting-edge projects that will shape the future of humanity's presence in space.
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-gray-400">
                <div className="flex items-center gap-2">
                  <UsersIcon className="h-5 w-5" />
                  <span>50+ Team Members</span>
                </div>
                <div className="flex items-center gap-2">
                  <RocketIcon className="h-5 w-5" />
                  <span>Multiple Active Missions</span>
                </div>
                <div className="flex items-center gap-2">
                  <StarIcon className="h-5 w-5" />
                  <span>Industry Leading Innovation</span>
                </div>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="mb-12">
              <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <Input
                      placeholder="Search jobs..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                    />
                  </div>
                  <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder="Department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder="Location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((location) => (
                        <SelectItem key={location} value={location}>{location}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Featured Jobs */}
            {featuredJobs.length > 0 && (
              <div className="mb-12">
                <h2 className="text-3xl font-bold mb-8 text-white">Featured Opportunities</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {featuredJobs.map((job) => (
                    <Card key={job.id} className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300 group">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-white group-hover:text-purple-300 transition-colors">
                              {job.title}
                            </CardTitle>
                            <CardDescription className="text-gray-300 mt-2">
                              {job.description}
                            </CardDescription>
                          </div>
                          <Badge className="bg-purple-600/20 text-purple-300 border-purple-500/30">
                            Featured
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-4 mb-4">
                          <div className="flex items-center gap-2 text-gray-300">
                            <BriefcaseIcon className="h-4 w-4" />
                            <span>{job.department}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-300">
                            <MapPinIcon className="h-4 w-4" />
                            <span>{job.location}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-300">
                            <ClockIcon className="h-4 w-4" />
                            <span>{job.type}</span>
                          </div>
                        </div>
                        <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white">
                          View Details
                          <ArrowRightIcon className="h-4 w-4 ml-2" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* All Jobs */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold mb-8 text-white">
                All Open Positions ({filteredJobs.length})
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {regularJobs.map((job) => (
                  <Card key={job.id} className="bg-white/5 backdrop-blur-md border-white/10 hover:bg-white/10 transition-all duration-300 group">
                    <CardHeader>
                      <CardTitle className="text-white group-hover:text-purple-300 transition-colors">
                        {job.title}
                      </CardTitle>
                      <CardDescription className="text-gray-300">
                        {job.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-4 mb-4">
                        <div className="flex items-center gap-2 text-gray-300">
                          <BriefcaseIcon className="h-4 w-4" />
                          <span>{job.department}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-300">
                          <MapPinIcon className="h-4 w-4" />
                          <span>{job.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-300">
                          <ClockIcon className="h-4 w-4" />
                          <span>{job.type}</span>
                        </div>
                      </div>
                      <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                        View Details
                        <ArrowRightIcon className="h-4 w-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Open Application */}
            <div className="text-center">
              <Card className="bg-white/5 backdrop-blur-md border-white/10 max-w-2xl mx-auto">
                <CardHeader>
                  <CardTitle className="text-white">Don't See Your Perfect Role?</CardTitle>
                  <CardDescription className="text-gray-300">
                    We're always looking for exceptional talent. Send us your open application and let us know how you can contribute to our mission.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white">
                    <MailIcon className="h-5 w-5 mr-2" />
                    Send Open Application
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Careers;