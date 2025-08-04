import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BriefcaseIcon, MapPinIcon, ClockIcon, UsersIcon, RocketIcon, StarIcon, GlobeIcon, ZapIcon, HeartIcon, ExternalLinkIcon } from "lucide-react";
import { Link } from "wouter";

interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  type: "full-time" | "part-time" | "contract" | "internship";
  experience: string;
  description: string;
  requirements: string[];
  benefits: string[];
  postedDate: string;
  urgent?: boolean;
}

function Careers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");

  const jobs: Job[] = [
    {
      id: "1",
      title: "Senior Space Journalist",
      department: "Editorial",
      location: "Remote",
      type: "full-time",
      experience: "5+ years",
      description: "Lead our space journalism team, covering breaking news, conducting interviews with industry leaders, and producing in-depth investigative pieces.",
      requirements: [
        "Bachelor's degree in Journalism, Science Communication, or related field",
        "5+ years of experience in science or space journalism",
        "Strong writing and editing skills",
        "Knowledge of space industry and current events",
        "Experience with digital media and social platforms"
      ],
      benefits: [
        "Competitive salary with equity options",
        "Flexible remote work environment",
        "Health, dental, and vision insurance",
        "Professional development opportunities",
        "Access to exclusive space industry events"
      ],
      postedDate: "2024-01-10",
      urgent: true
    },
    {
      id: "2",
      title: "Frontend Developer",
      department: "Engineering",
      location: "San Francisco, CA",
      type: "full-time",
      experience: "3+ years",
      description: "Build and maintain our web platform using React, TypeScript, and modern web technologies. Help create an amazing user experience for space enthusiasts.",
      requirements: [
        "3+ years of experience with React and TypeScript",
        "Strong understanding of modern web technologies",
        "Experience with responsive design and accessibility",
        "Knowledge of performance optimization",
        "Experience with testing frameworks"
      ],
      benefits: [
        "Competitive salary with equity options",
        "Flexible work arrangements",
        "Health, dental, and vision insurance",
        "Professional development budget",
        "Latest hardware and software tools"
      ],
      postedDate: "2024-01-08"
    },
    {
      id: "3",
      title: "Space Content Creator",
      department: "Content",
      location: "Remote",
      type: "contract",
      experience: "2+ years",
      description: "Create engaging space content including articles, videos, and social media posts. Help educate and inspire the next generation of space enthusiasts.",
      requirements: [
        "2+ years of content creation experience",
        "Strong knowledge of space science and current events",
        "Experience with video editing and social media",
        "Excellent communication skills",
        "Creative mindset and attention to detail"
      ],
      benefits: [
        "Competitive hourly rate",
        "Flexible schedule",
        "Creative freedom",
        "Access to space industry resources",
        "Portfolio building opportunities"
      ],
      postedDate: "2024-01-05"
    },
    {
      id: "4",
      title: "Community Manager",
      department: "Community",
      location: "Remote",
      type: "full-time",
      experience: "3+ years",
      description: "Build and nurture our global community of space enthusiasts. Organize events, manage forums, and create engaging community experiences.",
      requirements: [
        "3+ years of community management experience",
        "Strong interpersonal and communication skills",
        "Experience with community platforms and tools",
        "Knowledge of space industry and community",
        "Event planning and organization skills"
      ],
      benefits: [
        "Competitive salary with equity options",
        "Flexible remote work environment",
        "Health, dental, and vision insurance",
        "Travel opportunities for events",
        "Professional development opportunities"
      ],
      postedDate: "2024-01-03"
    },
    {
      id: "5",
      title: "Data Scientist",
      department: "Analytics",
      location: "New York, NY",
      type: "full-time",
      experience: "4+ years",
      description: "Analyze user behavior, content performance, and market trends to help drive data-informed decisions across our platform.",
      requirements: [
        "4+ years of experience in data science or analytics",
        "Strong programming skills (Python, R, SQL)",
        "Experience with machine learning and statistical analysis",
        "Knowledge of data visualization tools",
        "Experience with A/B testing and experimentation"
      ],
      benefits: [
        "Competitive salary with equity options",
        "Flexible work arrangements",
        "Health, dental, and vision insurance",
        "Professional development budget",
        "Access to cutting-edge tools and technologies"
      ],
      postedDate: "2024-01-01"
    }
  ];

  const departments = ["All Departments", "Editorial", "Engineering", "Content", "Community", "Analytics"];
  const locations = ["All Locations", "Remote", "San Francisco, CA", "New York, NY", "Los Angeles, CA"];

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = !selectedDepartment || selectedDepartment === "All Departments" || job.department === selectedDepartment;
    const matchesLocation = !selectedLocation || selectedLocation === "All Locations" || job.location === selectedLocation;
    
    return matchesSearch && matchesDepartment && matchesLocation;
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case "full-time":
        return "bg-green-500/20 text-green-300 border-green-500/30";
      case "part-time":
        return "bg-blue-500/20 text-blue-300 border-blue-500/30";
      case "contract":
        return "bg-orange-500/20 text-orange-300 border-orange-500/30";
      case "internship":
        return "bg-purple-500/20 text-purple-300 border-purple-500/30";
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/30";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0F] via-[#14141E] to-[#1A1A2E]">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4 bg-purple-500/20 text-purple-300 border-purple-500/30">
            <BriefcaseIcon className="w-3 h-3 mr-1" />
            Join Our Team
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-6">
            Careers at Proxima Report
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Help us inspire the next generation of space explorers. Join a team passionate about 
            sharing the wonders of space with the world.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="max-w-4xl mx-auto mb-12">
          <Card className="bg-gray-900/50 border border-gray-800/50">
            <CardContent className="p-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label htmlFor="search" className="text-gray-300">Search Jobs</Label>
                  <Input
                    id="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-gray-800/50 border-gray-700 text-white"
                    placeholder="Search by title or keywords..."
                  />
                </div>
                <div>
                  <Label htmlFor="department" className="text-gray-300">Department</Label>
                  <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                    <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                      <SelectValue placeholder="All Departments" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="location" className="text-gray-300">Location</Label>
                  <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                    <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                      <SelectValue placeholder="All Locations" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      {locations.map((loc) => (
                        <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Job Listings */}
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-white">
              Open Positions ({filteredJobs.length})
            </h2>
            <Button asChild variant="outline" className="border-purple-500 text-purple-400 hover:bg-purple-500/10">
              <Link href="/jobs">
                <ExternalLinkIcon className="h-4 w-4 mr-2" />
                View All Jobs
              </Link>
            </Button>
          </div>

          <div className="space-y-6">
            {filteredJobs.map((job) => (
              <Card key={job.id} className="bg-gray-900/50 border border-gray-800/50 hover:border-purple-500/30 transition-all duration-300">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <CardTitle className="text-white text-xl">{job.title}</CardTitle>
                        {job.urgent && (
                          <Badge className="bg-red-500/20 text-red-300 border-red-500/30">
                            Urgent
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="text-gray-400 text-base">
                        {job.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {/* Job Details */}
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="flex items-center space-x-2">
                      <BriefcaseIcon className="h-4 w-4 text-purple-400" />
                      <span className="text-gray-300 text-sm">{job.department}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPinIcon className="h-4 w-4 text-purple-400" />
                      <span className="text-gray-300 text-sm">{job.location}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <ClockIcon className="h-4 w-4 text-purple-400" />
                      <span className="text-gray-300 text-sm">{job.type}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <UsersIcon className="h-4 w-4 text-purple-400" />
                      <span className="text-gray-300 text-sm">{job.experience}</span>
                    </div>
                  </div>

                  {/* Requirements Preview */}
                  <div>
                    <h4 className="text-white font-semibold mb-3">Key Requirements</h4>
                    <div className="grid gap-2 md:grid-cols-2">
                      {job.requirements.slice(0, 4).map((req, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <StarIcon className="h-4 w-4 text-purple-400 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-300 text-sm">{req}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Benefits Preview */}
                  <div>
                    <h4 className="text-white font-semibold mb-3">Benefits</h4>
                    <div className="grid gap-2 md:grid-cols-2">
                      {job.benefits.slice(0, 4).map((benefit, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <HeartIcon className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-300 text-sm">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <span>Posted {formatDate(job.postedDate)}</span>
                      <Badge className={getTypeColor(job.type)}>
                        {job.type.replace('-', ' ')}
                      </Badge>
                    </div>
                    <div className="flex space-x-3">
                      <Button variant="outline" className="border-gray-700 text-gray-300 hover:border-purple-500 hover:text-purple-400">
                        Save Job
                      </Button>
                      <Button className="bg-gradient-to-r from-purple-600 to-violet-700 hover:from-purple-700 hover:to-violet-800">
                        Apply Now
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredJobs.length === 0 && (
            <Card className="bg-gray-900/30 border border-gray-800/50 text-center">
              <CardContent className="p-12">
                <BriefcaseIcon className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No jobs found</h3>
                <p className="text-gray-400">Try adjusting your search criteria or check back later for new opportunities.</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Company Culture Section */}
        <div className="mt-20 max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Why Join Proxima Report?
            </h2>
            <p className="text-gray-400 text-lg">
              Be part of a team that's shaping the future of space journalism and education
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: <RocketIcon className="h-6 w-6" />,
                title: "Mission-Driven",
                description: "Work on projects that inspire the next generation of space explorers"
              },
              {
                icon: <GlobeIcon className="h-6 w-6" />,
                title: "Global Impact",
                description: "Reach millions of space enthusiasts worldwide"
              },
              {
                icon: <ZapIcon className="h-6 w-6" />,
                title: "Innovation",
                description: "Use cutting-edge technology to tell space stories"
              },
              {
                icon: <UsersIcon className="h-6 w-6" />,
                title: "Great Team",
                description: "Collaborate with passionate space enthusiasts and professionals"
              }
            ].map((feature, index) => (
              <Card key={index} className="bg-gray-900/30 border border-gray-800/50 text-center hover:border-purple-500/30 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-violet-700 rounded-xl flex items-center justify-center mx-auto mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-white font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-400 text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center">
          <Card className="bg-gradient-to-br from-purple-900/30 to-violet-900/30 border border-purple-500/30 max-w-3xl mx-auto">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-white mb-4">Don't See the Right Fit?</h3>
              <p className="text-gray-300 mb-6">
                We're always looking for talented individuals to join our team. 
                Send us your resume and let us know how you can contribute to our mission.
              </p>
              <Button className="bg-gradient-to-r from-purple-600 to-violet-700 hover:from-purple-700 hover:to-violet-800">
                <MailIcon className="h-5 w-5 mr-2" />
                Send Open Application
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default Careers; 