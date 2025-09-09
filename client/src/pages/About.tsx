import React from 'react';
import { 
  UsersIcon, 
  StarIcon, 
  GlobeIcon, 
  HeartIcon, 
  TargetIcon,
  TrendingUpIcon,
  AwardIcon,
  ExternalLinkIcon,
  LinkedinIcon,
  TwitterIcon,
  MailIcon,
  ShoppingCartIcon,
  InstagramIcon,
  YoutubeIcon,
  FacebookIcon
} from 'lucide-react';
import { useEffect } from 'react';
import { Link } from 'wouter';

// Import logo image
import mobileLogo from "../assets/images/proxima-logo-mobile.png";

import { useQuery } from '@tanstack/react-query';
import SEO from '@/components/SEO';
import { useGoogleAdSense } from "@/hooks/useGoogleAdSense";

// Types
interface TeamMember {
  id: number;
  user_id?: number;
  name: string;
  role: string;
  bio: string;
  profile_image_url?: string;
  is_founder: boolean;
  expertise: string[];
  social_linkedin?: string;
  social_twitter?: string;
  social_email?: string;
  display_order: number;
  user?: {
    id: number;
    username: string;
    email: string;
    profile_picture?: string;
    bio?: string;
  };
}

const stats = [
  { icon: <UsersIcon className="h-6 w-6" />, value: "10K+", label: "Active Users" },
  { icon: <GlobeIcon className="h-6 w-6" />, value: "100+", label: "Countries Reached" },
  { icon: <StarIcon className="h-6 w-6" />, value: "99.9%", label: "Uptime" },
  { icon: <img src={mobileLogo} alt="Proxima Report" className="h-6 w-6 object-contain" />, value: "200+", label: "Launches Tracked" }
];

const values = [
  {
    icon: <TargetIcon className="h-6 w-6 text-blue-400" />,
    title: "Accuracy",
    description: "We provide the most accurate and up-to-date space data from trusted sources."
  },
  {
    icon: <HeartIcon className="h-6 w-6 text-red-400" />,
    title: "Passion",
    description: "Our team is driven by genuine passion for space exploration and discovery."
  },
  {
    icon: <TrendingUpIcon className="h-6 w-6 text-green-400" />,
    title: "Innovation",
    description: "We continuously push the boundaries of what's possible in space data presentation."
  },
  {
    icon: <AwardIcon className="h-6 w-6 text-yellow-400" />,
    title: "Excellence",
    description: "We strive for excellence in every aspect of our platform and user experience."
  }
];

export default function About() {
  // Load Google AdSense script
  useGoogleAdSense();

  // Fetch team members from API
  const { data: teamMembers, isLoading, error } = useQuery<TeamMember[]>({
    queryKey: ['team-members'],
    queryFn: async () => {
      const response = await fetch('/api/team-members');
      if (!response.ok) {
        throw new Error('Failed to fetch team members');
      }
      return response.json();
    }
  });

  // Separate founders and regular team members
  const founders = teamMembers?.filter(member => member.is_founder).sort((a, b) => a.display_order - b.display_order) || [];
  const regularTeam = teamMembers?.filter(member => !member.is_founder).sort((a, b) => a.display_order - b.display_order) || [];
  return (
    <>
      <SEO 
        title="About Proxima Report - Our Mission in Space & STEM News"
        description="Learn about Proxima Report's mission to make space exploration data accessible and inspiring. Meet our team of space enthusiasts, scientists, and communicators dedicated to bringing the universe closer to you."
        keywords="about proxima report, space news team, STEM education mission, space exploration platform, astronomy news team, space technology journalists, NASA coverage team, SpaceX news reporters, space science communicators"
        url="https://proximareport.com/about"
        type="website"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "AboutPage",
          "name": "About Proxima Report",
          "description": "Learn about Proxima Report's mission to make space exploration data accessible and inspiring.",
          "url": "https://proximareport.com/about",
          "mainEntity": {
            "@type": "Organization",
            "name": "Proxima Report",
            "description": "Premier space and STEM news platform covering space exploration, astronomy, and technological breakthroughs",
            "foundingDate": "2023",
            "url": "https://proximareport.com",
            "sameAs": [
              "https://twitter.com/proximareport",
              "https://linkedin.com/company/proximareport",
              "https://instagram.com/proximareport",
              "https://youtube.com/@proximareport"
            ],
            "contactPoint": {
              "@type": "ContactPoint",
              "contactType": "customer service",
              "email": "hello@proximareport.com"
            }
          }
        }}
      />
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950/40 to-black relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-purple-900/10 via-violet-900/10 to-purple-800/10"></div>
        <div className="absolute top-20 left-20 w-64 h-64 bg-gradient-to-r from-purple-600/10 to-violet-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-48 h-48 bg-gradient-to-r from-blue-600/10 to-cyan-600/10 rounded-full blur-3xl animate-pulse"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Mission Statement */}
        <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl p-8 border border-purple-900/30 mb-16">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-6">Our Mission</h2>
            <p className="text-lg text-gray-300 leading-relaxed mb-6">
              Proxima Report, founded in 2023, is a global space and STEM news platform committed to covering humanity's leaps into the cosmos.
            </p>
            <p className="text-lg text-gray-300 leading-relaxed mb-6">
              While many focus solely on Eastern or Western spaceflight, we aim to bridge the divide, offering in-depth coverage of astronomical discoveries, planetary science missions, and cutting-edge rocket technology. Wherever progress happens, from launchpads to observatories, Proxima Report is there!
            </p>
            <p className="text-lg text-purple-400 font-semibold italic">
              Ad Astra Per Scientia - To the Stars, Through Knowledge.
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => (
            <div key={index} className="bg-gray-900/60 backdrop-blur-sm rounded-lg p-6 border border-purple-900/30 text-center">
              <div className="flex justify-center text-purple-400 mb-3">
                {stat.icon}
              </div>
              <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-gray-400 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>





        {/* Founders Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Our Founders</h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Click for news. Stay for the “how have I never heard this before?!” space facts.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {founders.map((founder, index) => {
              const CardContent = (
                <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl overflow-hidden border border-purple-900/30 hover:border-purple-800/50 transition-all duration-300 cursor-pointer">
                  <div className="relative">
                    <div className="w-full h-56 bg-gradient-to-br from-purple-600/20 to-violet-700/20 flex items-center justify-center">
                      <div className="w-28 h-28 rounded-full bg-gradient-to-r from-purple-500 to-violet-700 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                        {founder.name.split(' ').map(n => n[0]).join('')}
                      </div>
                    </div>
                    <div className="absolute top-4 right-4">
                      <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs font-bold px-2 py-1 rounded-full">
                        Founder
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-white mb-1">{founder.name}</h3>
                    <p className="text-purple-400 text-sm font-medium mb-3">{founder.role}</p>
                    <p className="text-gray-400 text-sm mb-4 line-clamp-4">{founder.bio}</p>
                    
                    <div className="mb-4">
                      <h4 className="text-white text-sm font-medium mb-2">Expertise:</h4>
                      <div className="flex flex-wrap gap-1">
                        {founder.expertise.map((skill, skillIndex) => (
                          <span key={skillIndex} className="bg-purple-950/50 text-purple-300 text-xs px-2 py-1 rounded-full">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      {founder.social_linkedin && (
                        <a 
                          href={founder.social_linkedin} 
                          className="text-gray-400 hover:text-blue-400 transition-colors"
                          aria-label="LinkedIn"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <LinkedinIcon className="h-4 w-4" />
                        </a>
                      )}
                      {founder.social_twitter && (
                        <a 
                          href={founder.social_twitter} 
                          className="text-gray-400 hover:text-blue-400 transition-colors"
                          aria-label="Twitter"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <TwitterIcon className="h-4 w-4" />
                        </a>
                      )}
                      {founder.social_email && (
                        <a 
                          href={`mailto:${founder.social_email}`} 
                          className="text-gray-400 hover:text-purple-400 transition-colors"
                          aria-label="Email"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MailIcon className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );

              return founder.user ? (
                <Link key={index} href={`/profile/${founder.user.username}`}>
                  {CardContent}
                </Link>
              ) : (
                <div key={index}>
                  {CardContent}
                </div>
              );
            })}
          </div>
        </div>

        {/* Team Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Our Team</h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Our talented team of scientists, engineers, designers, and communicators work together 
              to bring you the most comprehensive space data platform in the world.
            </p>
          </div>
          
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
              <p className="text-gray-300">Loading team members...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-400 mb-4">Failed to load team members</p>
              <p className="text-gray-400 text-sm">{error.message}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {regularTeam.map((member, index) => {
                const CardContent = (
                  <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl overflow-hidden border border-purple-900/30 hover:border-purple-800/50 transition-all duration-300 cursor-pointer">
                    <div className="relative">
                      <div className="w-full h-48 bg-gradient-to-br from-purple-600/20 to-violet-700/20 flex items-center justify-center">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-r from-purple-500 to-violet-700 flex items-center justify-center text-2xl font-bold text-white">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-white mb-1">{member.name}</h3>
                      <p className="text-purple-400 text-sm font-medium mb-3">{member.role}</p>
                      <p className="text-gray-400 text-sm mb-4 line-clamp-3">{member.bio}</p>
                      
                      <div className="mb-4">
                        <h4 className="text-white text-sm font-medium mb-2">Expertise:</h4>
                        <div className="flex flex-wrap gap-1">
                          {member.expertise.map((skill, skillIndex) => (
                            <span key={skillIndex} className="bg-purple-950/50 text-purple-300 text-xs px-2 py-1 rounded-full">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex gap-3">
                        {member.social_linkedin && (
                          <a 
                            href={member.social_linkedin} 
                            className="text-gray-400 hover:text-blue-400 transition-colors"
                            aria-label="LinkedIn"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <LinkedinIcon className="h-4 w-4" />
                          </a>
                        )}
                        {member.social_twitter && (
                          <a 
                            href={member.social_twitter} 
                            className="text-gray-400 hover:text-blue-400 transition-colors"
                            aria-label="Twitter"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <TwitterIcon className="h-4 w-4" />
                          </a>
                        )}
                        {member.social_email && (
                          <a 
                            href={`mailto:${member.social_email}`} 
                            className="text-gray-400 hover:text-purple-400 transition-colors"
                            aria-label="Email"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MailIcon className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );

                return member.user ? (
                  <Link key={index} href={`/profile/${member.user.username}`}>
                    {CardContent}
                  </Link>
                ) : (
                  <div key={index}>
                    {CardContent}
                  </div>
                );
              })}
          </div>
          )}
        </div>

        {/* Technology Stack */}
        <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl p-8 border border-purple-900/30 mb-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-white text-center mb-8">Our Technology</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <GlobeIcon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Real-time APIs</h3>
                <p className="text-gray-400 text-sm">
                  We integrate with NASA, SpaceX, ESA, and other space agencies to provide 
                  real-time data on launches, weather, and astronomical events.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <StarIcon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Modern Stack</h3>
                <p className="text-gray-400 text-sm">
                  Built with React, TypeScript, and Node.js for a fast, reliable, 
                  and scalable user experience across all devices.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <TrendingUpIcon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Data Analytics</h3>
                <p className="text-gray-400 text-sm">
                  Advanced analytics and visualization tools help you understand 
                  complex space data and discover meaningful patterns.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <div key={index} className="bg-gray-900/60 backdrop-blur-sm rounded-lg p-6 border border-purple-900/30 text-center">
                <div className="flex justify-center mb-4">
                  {value.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{value.title}</h3>
                <p className="text-gray-400 text-sm">{value.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Social Media Section */}
        <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl p-8 border border-purple-900/30 mb-16">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-6">Connect With Us</h2>
            <p className="text-lg text-gray-300 leading-relaxed mb-8">
              Stay updated with the latest space news, launches, and discoveries. Follow us across all platforms for real-time updates and exclusive content.
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <a 
                href="https://twitter.com/proximareport" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group bg-gray-800/60 hover:bg-blue-600/20 backdrop-blur-sm rounded-lg p-6 border border-gray-700/50 hover:border-blue-500/50 transition-all duration-300 text-center"
              >
                <div className="flex justify-center mb-3">
                  <TwitterIcon className="h-8 w-8 text-blue-400 group-hover:text-blue-300 transition-colors" />
                </div>
                <h3 className="text-white font-semibold mb-2">Twitter</h3>
                <p className="text-gray-400 text-sm">Real-time updates</p>
              </a>

              <a 
                href="https://linkedin.com/company/proximareport" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group bg-gray-800/60 hover:bg-blue-600/20 backdrop-blur-sm rounded-lg p-6 border border-gray-700/50 hover:border-blue-500/50 transition-all duration-300 text-center"
              >
                <div className="flex justify-center mb-3">
                  <LinkedinIcon className="h-8 w-8 text-blue-400 group-hover:text-blue-300 transition-colors" />
                </div>
                <h3 className="text-white font-semibold mb-2">LinkedIn</h3>
                <p className="text-gray-400 text-sm">Professional network</p>
              </a>

              <a 
                href="https://instagram.com/proximareport" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group bg-gray-800/60 hover:bg-pink-600/20 backdrop-blur-sm rounded-lg p-6 border border-gray-700/50 hover:border-pink-500/50 transition-all duration-300 text-center"
              >
                <div className="flex justify-center mb-3">
                  <InstagramIcon className="h-8 w-8 text-pink-400 group-hover:text-pink-300 transition-colors" />
                </div>
                <h3 className="text-white font-semibold mb-2">Instagram</h3>
                <p className="text-gray-400 text-sm">Visual stories</p>
              </a>

              <a 
                href="https://youtube.com/@proximareport" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group bg-gray-800/60 hover:bg-red-600/20 backdrop-blur-sm rounded-lg p-6 border border-gray-700/50 hover:border-red-500/50 transition-all duration-300 text-center"
              >
                <div className="flex justify-center mb-3">
                  <YoutubeIcon className="h-8 w-8 text-red-400 group-hover:text-red-300 transition-colors" />
                </div>
                <h3 className="text-white font-semibold mb-2">YouTube</h3>
                <p className="text-gray-400 text-sm">Video content</p>
              </a>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-700/50">
              <div className="flex justify-center items-center gap-6">
                <a 
                  href="mailto:hello@proximareport.com" 
                  className="flex items-center gap-2 text-gray-300 hover:text-purple-400 transition-colors"
                >
                  <MailIcon className="h-5 w-5" />
                  <span>hello@proximareport.com</span>
                </a>
                <span className="text-gray-500">|</span>
                <a 
                  href="https://store.proximareport.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-gray-300 hover:text-purple-400 transition-colors"
                >
                  <ShoppingCartIcon className="h-5 w-5" />
                  <span>Visit Our Store</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Contact CTA */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-purple-600/20 to-violet-700/20 rounded-xl p-8 border border-purple-900/30">
            <h2 className="text-3xl font-bold text-white mb-4">Join Our Mission</h2>
            <p className="text-lg text-gray-300 mb-6">
              Interested in collaborating, have feedback, or want to learn more about our platform?
            </p>
            <div className="flex justify-center gap-4">
              <a 
                href="/contact" 
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-all duration-300 font-medium"
              >
                Get In Touch
              </a>
              <a 
                href="https://store.proximareport.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="border border-purple-600 text-purple-400 hover:bg-purple-600 hover:text-white px-6 py-3 rounded-lg transition-all duration-300 flex items-center gap-2"
              >
                <ShoppingCartIcon className="h-4 w-4" />
                Shop Now
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
} 