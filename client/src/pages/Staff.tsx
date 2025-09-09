import React from 'react';
import { 
  UsersIcon, 
  StarIcon, 
  ExternalLinkIcon,
  LinkedinIcon,
  TwitterIcon,
  MailIcon,
  UserIcon
} from 'lucide-react';
import { Link } from 'wouter';
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

export default function Staff() {
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
        title="Meet Our Staff - Proxima Report Team"
        description="Meet the talented team behind Proxima Report. Our staff includes space scientists, engineers, journalists, and communicators dedicated to bringing you the latest in space exploration and STEM news."
        keywords="proxima report staff, space news team, STEM journalists, space scientists, astronomy team, space technology experts, NASA reporters, SpaceX journalists, space exploration team"
        url="https://proximareport.com/staff"
        type="website"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "AboutPage",
          "name": "Proxima Report Staff",
          "description": "Meet the talented team behind Proxima Report.",
          "url": "https://proximareport.com/staff",
          "mainEntity": {
            "@type": "Organization",
            "name": "Proxima Report",
            "description": "Premier space and STEM news platform",
            "url": "https://proximareport.com"
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
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Meet Our <span className="text-purple-400">Staff</span>
            </h1>
            <p className="text-lg text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Our diverse team of space enthusiasts, scientists, engineers, and communicators work together 
              to bring you the most comprehensive and accurate space news and data.
            </p>
          </div>

          {/* Founders Section */}
          {founders.length > 0 && (
            <div className="mb-16">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-white mb-4 flex items-center justify-center gap-3">
                  <StarIcon className="h-8 w-8 text-yellow-400" />
                  Our Founders
                </h2>
                <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                  The visionaries who started Proxima Report and continue to lead our mission.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {founders.map((founder, index) => {
                  const CardContent = (
                    <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl overflow-hidden border border-purple-900/30 hover:border-purple-800/50 transition-all duration-300 cursor-pointer group">
                      <div className="relative">
                        <div className="w-full h-64 bg-gradient-to-br from-purple-600/20 to-violet-700/20 flex items-center justify-center">
                          {founder.profile_image_url ? (
                            <img 
                              src={founder.profile_image_url} 
                              alt={founder.name}
                              className="w-32 h-32 rounded-full object-cover border-4 border-purple-500/50 shadow-lg"
                            />
                          ) : (
                            <div className="w-32 h-32 rounded-full bg-gradient-to-r from-purple-500 to-violet-700 flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                              {founder.name.split(' ').map(n => n[0]).join('')}
                            </div>
                          )}
                        </div>
                        <div className="absolute top-4 right-4">
                          <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs font-bold px-3 py-1 rounded-full">
                            Founder
                          </span>
                        </div>
                        {founder.user && (
                          <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="bg-purple-600/90 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                              <UserIcon className="h-3 w-3" />
                              View Profile
                            </div>
                          </div>
                        )}
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
          )}

          {/* Team Section */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4 flex items-center justify-center gap-3">
                <UsersIcon className="h-8 w-8 text-blue-400" />
                Our Team
              </h2>
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
            ) : regularTeam.length === 0 ? (
              <div className="text-center py-12">
                <UsersIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No team members found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {regularTeam.map((member, index) => {
                  const CardContent = (
                    <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl overflow-hidden border border-purple-900/30 hover:border-purple-800/50 transition-all duration-300 cursor-pointer group">
                      <div className="relative">
                        <div className="w-full h-48 bg-gradient-to-br from-purple-600/20 to-violet-700/20 flex items-center justify-center">
                          {member.profile_image_url ? (
                            <img 
                              src={member.profile_image_url} 
                              alt={member.name}
                              className="w-24 h-24 rounded-full object-cover border-4 border-purple-500/50 shadow-lg"
                            />
                          ) : (
                            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-purple-500 to-violet-700 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                              {member.name.split(' ').map(n => n[0]).join('')}
                            </div>
                          )}
                        </div>
                        {member.user && (
                          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="bg-purple-600/90 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                              <UserIcon className="h-3 w-3" />
                              View Profile
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="p-4">
                        <h3 className="text-lg font-bold text-white mb-1 truncate">{member.name}</h3>
                        <p className="text-purple-400 text-sm font-medium mb-2 truncate">{member.role}</p>
                        <p className="text-gray-400 text-xs mb-3 line-clamp-2">{member.bio}</p>
                        
                        <div className="mb-3">
                          <div className="flex flex-wrap gap-1">
                            {member.expertise.slice(0, 2).map((skill, skillIndex) => (
                              <span key={skillIndex} className="bg-purple-950/50 text-purple-300 text-xs px-2 py-1 rounded-full">
                                {skill}
                              </span>
                            ))}
                            {member.expertise.length > 2 && (
                              <span className="bg-gray-700/50 text-gray-300 text-xs px-2 py-1 rounded-full">
                                +{member.expertise.length - 2}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          {member.social_linkedin && (
                            <a 
                              href={member.social_linkedin} 
                              className="text-gray-400 hover:text-blue-400 transition-colors"
                              aria-label="LinkedIn"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <LinkedinIcon className="h-3 w-3" />
                            </a>
                          )}
                          {member.social_twitter && (
                            <a 
                              href={member.social_twitter} 
                              className="text-gray-400 hover:text-blue-400 transition-colors"
                              aria-label="Twitter"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <TwitterIcon className="h-3 w-3" />
                            </a>
                          )}
                          {member.social_email && (
                            <a 
                              href={`mailto:${member.social_email}`} 
                              className="text-gray-400 hover:text-purple-400 transition-colors"
                              aria-label="Email"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MailIcon className="h-3 w-3" />
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

          {/* Join Our Team CTA */}
          <div className="text-center">
            <div className="bg-gradient-to-r from-purple-600/20 to-violet-700/20 rounded-xl p-8 border border-purple-900/30">
              <h2 className="text-3xl font-bold text-white mb-4">Join Our Mission</h2>
              <p className="text-lg text-gray-300 mb-6">
                Interested in joining our team? We're always looking for passionate individuals 
                who share our vision of making space exploration accessible to everyone.
              </p>
              <div className="flex justify-center gap-4">
                <a 
                  href="/careers" 
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-all duration-300 font-medium"
                >
                  View Open Positions
                </a>
                <a 
                  href="/contact" 
                  className="border border-purple-600 text-purple-400 hover:bg-purple-600 hover:text-white px-6 py-3 rounded-lg transition-all duration-300"
                >
                  Get In Touch
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
