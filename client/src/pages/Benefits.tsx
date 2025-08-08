import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckIcon, StarIcon, RocketIcon, UsersIcon, ShieldIcon, ZapIcon, GlobeIcon, BookOpenIcon, VideoIcon, GiftIcon, ClockIcon } from "lucide-react";
import { Link } from "wouter";

interface Benefit {
  title: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  tier: "free" | "supporter" | "pro";
}

function Benefits() {
  const benefits: Benefit[] = [
    {
      title: "Free Membership",
      description: "Access to basic content and community features",
      icon: <UsersIcon className="h-8 w-8" />,
      features: [
        "Access to latest space news",
        "Basic community forum access",
        "Newsletter subscription",
        "Limited article access",
        "Basic search functionality"
      ],
      tier: "free"
    },
    {
      title: "Supporter",
      description: "Enhanced features and exclusive content",
      icon: <StarIcon className="h-8 w-8" />,
      features: [
        "All Free features",
        "Ad-free experience",
        "Exclusive member-only articles",
        "Early access to content",
        "Member-only community channels",
        "Priority customer support",
        "Digital member badge"
      ],
      tier: "supporter"
    },
    {
      title: "Pro Member",
      description: "Ultimate space enthusiast experience",
      icon: <RocketIcon className="h-8 w-8" />,
      features: [
        "All Supporter features",
        "Live launch coverage",
        "Exclusive interviews and Q&As",
        "Advanced analytics and insights",
        "Personalized content recommendations",
        "Access to premium tools and calculators",
        "Member-only events and webinars",
        "Physical welcome package"
      ],
      tier: "pro"
    }
  ];

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "free":
        return "bg-gray-500/20 text-gray-300 border-gray-500/30";
      case "supporter":
        return "bg-purple-500/20 text-purple-300 border-purple-500/30";
      case "pro":
        return "bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border-purple-500/30";
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/30";
    }
  };

  const getTierGradient = (tier: string) => {
    switch (tier) {
      case "free":
        return "from-gray-600 to-gray-700";
      case "supporter":
        return "from-purple-600 to-violet-700";
      case "pro":
        return "from-purple-600 via-pink-600 to-violet-700";
      default:
        return "from-gray-600 to-gray-700";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0F] via-[#14141E] to-[#1A1A2E]">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4 bg-purple-500/20 text-purple-300 border-purple-500/30">
            <StarIcon className="w-3 h-3 mr-1" />
            Membership Benefits
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-6">
            Choose Your Journey
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Join our community of space enthusiasts and unlock exclusive content, tools, and experiences. 
            From free access to premium features, find the perfect membership level for your cosmic curiosity.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto mb-16">
          {benefits.map((benefit, index) => (
            <Card key={index} className="bg-gray-900/50 border border-gray-800/50 hover:border-purple-500/30 transition-all duration-300 relative overflow-hidden">
              {/* Background gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${getTierGradient(benefit.tier)} opacity-5`}></div>
              
              <CardHeader className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${getTierGradient(benefit.tier)}`}>
                      {benefit.icon}
                    </div>
                    <div>
                      <CardTitle className="text-white text-xl">{benefit.title}</CardTitle>
                      <Badge className={getTierColor(benefit.tier)}>
                        {benefit.tier === "free" ? "Free" : benefit.tier === "supporter" ? "Supporter" : "Pro"}
                      </Badge>
                    </div>
                  </div>
                </div>
                <CardDescription className="text-gray-400 text-base">
                  {benefit.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="relative z-10 space-y-6">
                <div className="space-y-3">
                  {benefit.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-start space-x-3">
                      <CheckIcon className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-300 text-sm leading-relaxed">{feature}</span>
                    </div>
                  ))}
                </div>
                
                <div className="pt-4">
                  {benefit.tier === "free" ? (
                    <Button className="w-full bg-gray-600 hover:bg-gray-700" disabled>
                      Current Plan
                    </Button>
                  ) : (
                    <Button className={`w-full bg-gray-600 hover:bg-gray-700 cursor-not-allowed`} disabled>
                      <ClockIcon className="h-4 w-4 mr-2" />
                      Coming Soon
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Features Section */}
        <div className="max-w-6xl mx-auto mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Premium Features & Tools
            </h2>
            <p className="text-gray-400 text-lg">
              Exclusive access to advanced tools and resources for space enthusiasts
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: <ZapIcon className="h-6 w-6" />,
                title: "ProxiHub Tools",
                description: "Access to advanced space calculators and generators"
              },
              {
                icon: <VideoIcon className="h-6 w-6" />,
                title: "Live Coverage",
                description: "Exclusive live streams of launches and events"
              },
              {
                icon: <BookOpenIcon className="h-6 w-6" />,
                title: "Premium Content",
                description: "In-depth articles and exclusive interviews"
              },
              {
                icon: <GlobeIcon className="h-6 w-6" />,
                title: "Global Community",
                description: "Connect with space enthusiasts worldwide"
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
        <div className="text-center">
          <Card className="bg-gradient-to-br from-purple-900/30 to-violet-900/30 border border-purple-500/30 max-w-3xl mx-auto">
            <CardContent className="p-8">
              <div className="flex items-center justify-center mb-4">
                <GiftIcon className="h-8 w-8 text-purple-400 mr-3" />
                <h3 className="text-2xl font-bold text-white">Ready to Explore?</h3>
              </div>
              <p className="text-gray-300 mb-6 text-lg">
                Join thousands of space enthusiasts and unlock exclusive content, tools, and experiences. 
                Start your cosmic journey today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-gray-600 hover:bg-gray-700 cursor-not-allowed" disabled>
                  <ClockIcon className="h-5 w-5 mr-2" />
                  Coming Soon
                </Button>
                <Button asChild size="lg" variant="outline" className="border-purple-500 text-purple-400 hover:bg-purple-500/10">
                  <Link href="/pricing">
                    <RocketIcon className="h-5 w-5 mr-2" />
                    View All Plans
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default Benefits; 