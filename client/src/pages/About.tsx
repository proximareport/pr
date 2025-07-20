import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RocketIcon, StarIcon, UsersIcon, GlobeIcon, ShieldIcon, HeartIcon } from 'lucide-react';
import { Link } from 'wouter';

const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            About <span className="text-cyan-400">Proxima Report</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Your premier destination for STEM and space exploration news, bringing the universe closer to Earth through cutting-edge journalism and interactive experiences.
          </p>
        </div>

        {/* Mission Section */}
        <Card className="bg-gray-800/50 border-gray-700 mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-white flex items-center">
              <RocketIcon className="w-6 h-6 mr-2 text-cyan-400" />
              Our Mission
            </CardTitle>
          </CardHeader>
          <CardContent className="text-gray-300">
            <p className="text-lg leading-relaxed">
              At Proxima Report, we believe that space exploration and STEM education are the keys to humanity's future. 
              Our mission is to make complex scientific concepts accessible to everyone, inspire the next generation of 
              explorers, and keep the world informed about the latest developments in space technology, astronomy, and 
              scientific discovery.
            </p>
          </CardContent>
        </Card>

        {/* Values Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <StarIcon className="w-5 h-5 mr-2 text-yellow-400" />
                Excellence
              </CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300">
              <p>We strive for accuracy, depth, and clarity in every article, ensuring our readers receive the highest quality space and science news.</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <UsersIcon className="w-5 h-5 mr-2 text-green-400" />
                Community
              </CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300">
              <p>We foster a vibrant community of space enthusiasts, scientists, and curious minds who share our passion for exploration and discovery.</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <GlobeIcon className="w-5 h-5 mr-2 text-blue-400" />
                Accessibility
              </CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300">
              <p>We make complex scientific information accessible to all, breaking down barriers to STEM education and space knowledge.</p>
            </CardContent>
          </Card>
        </div>

        {/* What We Offer */}
        <Card className="bg-gray-800/50 border-gray-700 mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-white">What We Offer</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-300">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-cyan-400 mb-3">Content & News</h3>
                <ul className="space-y-2">
                  <li className="flex items-center"><Badge variant="outline" className="mr-2">•</Badge> Breaking space news and discoveries</li>
                  <li className="flex items-center"><Badge variant="outline" className="mr-2">•</Badge> In-depth analysis of space missions</li>
                  <li className="flex items-center"><Badge variant="outline" className="mr-2">•</Badge> Educational STEM content</li>
                  <li className="flex items-center"><Badge variant="outline" className="mr-2">•</Badge> Astronomy guides and sky maps</li>
                  <li className="flex items-center"><Badge variant="outline" className="mr-2">•</Badge> Launch tracking and countdowns</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-cyan-400 mb-3">Community Features</h3>
                <ul className="space-y-2">
                  <li className="flex items-center"><Badge variant="outline" className="mr-2">•</Badge> Interactive discussion forums</li>
                  <li className="flex items-center"><Badge variant="outline" className="mr-2">•</Badge> User comments and engagement</li>
                  <li className="flex items-center"><Badge variant="outline" className="mr-2">•</Badge> Premium membership benefits</li>
                  <li className="flex items-center"><Badge variant="outline" className="mr-2">•</Badge> Career opportunities in STEM</li>
                  <li className="flex items-center"><Badge variant="outline" className="mr-2">•</Badge> Newsletter and updates</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Company Information */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-xl text-white flex items-center">
                <ShieldIcon className="w-5 h-5 mr-2 text-green-400" />
                Trust & Transparency
              </CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300 space-y-3">
              <p>We are committed to maintaining the highest standards of journalistic integrity and transparency in our operations.</p>
              <ul className="space-y-1 text-sm">
                <li>• Rigorous fact-checking processes</li>
                <li>• Clear editorial guidelines and standards</li>
                <li>• Transparent advertising and sponsorship policies</li>
                <li>• Commitment to user privacy and data protection</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-xl text-white flex items-center">
                <HeartIcon className="w-5 h-5 mr-2 text-red-400" />
                Our Commitment
              </CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300 space-y-3">
              <p>We're dedicated to inspiring curiosity about the universe and supporting the global space community.</p>
              <ul className="space-y-1 text-sm">
                <li>• Supporting STEM education initiatives</li>
                <li>• Promoting diversity in space sciences</li>
                <li>• Environmental responsibility in space exploration</li>
                <li>• Accessible content for all audiences</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Contact Information */}
        <Card className="bg-gray-800/50 border-gray-700 mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-300">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-cyan-400 mb-4">General Contact</h3>
                <ul className="space-y-2">
                  <li><strong>Email:</strong> contact@proximareport.com</li>
                  <li><strong>Press Inquiries:</strong> press@proximareport.com</li>
                  <li><strong>Editorial:</strong> editorial@proximareport.com</li>
                  <li><strong>Support:</strong> support@proximareport.com</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-cyan-400 mb-4">Business Contact</h3>
                <ul className="space-y-2">
                  <li><strong>Advertising:</strong> ads@proximareport.com</li>
                  <li><strong>Partnerships:</strong> partnerships@proximareport.com</li>
                  <li><strong>Legal:</strong> legal@proximareport.com</li>
                  <li><strong>Privacy:</strong> privacy@proximareport.com</li>
                </ul>
              </div>
            </div>
            
            <Separator className="bg-gray-600 my-6" />
            
            <div className="text-center">
              <p className="text-gray-400 mb-4">
                Mailing Address: Proxima Report, [Your Street Address], [City, State, ZIP Code]
              </p>
              <div className="flex justify-center space-x-4">
                <Button asChild variant="outline">
                  <Link href="/contact">Contact Form</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/subscribe">Subscribe to Newsletter</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Compliance Information */}
        <Card className="bg-gray-700/50 border-gray-600">
          <CardHeader>
            <CardTitle className="text-lg text-white">Legal & Compliance</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-300">
            <p className="text-sm mb-4">
              Proxima Report operates in compliance with all applicable laws and regulations. We are committed to 
              protecting user privacy and maintaining transparent business practices.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="ghost" size="sm">
                <Link href="/privacy">Privacy Policy</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/terms">Terms of Service</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/cookies">Cookie Policy</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/sitemap">Sitemap</Link>
              </Button>
            </div>
            
            <div className="mt-4 p-3 bg-gray-800/50 rounded-lg">
              <p className="text-xs text-gray-400">
                <strong>Advertising Disclosure:</strong> This website displays advertisements from Google Ads and other advertising networks. 
                We may receive compensation when you click on ads or make purchases through advertiser links. This helps support our mission 
                to provide free, high-quality space and science content to our readers.
              </p>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default About; 