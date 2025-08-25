import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { MailIcon, PhoneIcon, MapPinIcon, ClockIcon, MessageSquareIcon, HeadphonesIcon } from 'lucide-react';
import { useGoogleAdSense } from "@/hooks/useGoogleAdSense";

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    category: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Load Google AdSense script
  useGoogleAdSense();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSelectChange = (value: string) => {
    setFormData({
      ...formData,
      category: value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Here you would typically send the form data to your backend
      // For now, we'll just simulate a successful submission
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Message sent successfully!",
        description: "Thank you for contacting us. We'll get back to you within 24 hours.",
      });

      // Reset form
      setFormData({
        name: '',
        email: '',
        subject: '',
        category: '',
        message: ''
      });

    } catch (error) {
      toast({
        title: "Error sending message",
        description: "Please try again later or contact us directly via email.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950/40 to-black relative overflow-hidden">
      {/* Geometric ambient effects */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-violet-600/10 rounded-full blur-2xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-purple-600/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
        <div className="absolute top-1/2 right-1/3 w-28 h-28 bg-indigo-500/10 rounded-full blur-2xl animate-pulse delay-3000"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12 max-w-6xl">
        
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Contact <span className="text-purple-400">Us</span>
          </h1>
          <p className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
            Have a question, story tip, or feedback? We'd love to hear from you. 
            Get in touch with our team and join the conversation about space exploration.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          
          {/* Contact Form */}
          <Card className="bg-white/5 backdrop-blur-sm border border-purple-500/20">
            <CardHeader className="border-b border-purple-500/20 bg-purple-900/10">
              <CardTitle className="text-2xl text-white flex items-center">
                <MessageSquareIcon className="w-6 h-6 mr-2 text-purple-400" />
                Send us a Message
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" className="text-white/90">Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="bg-white/10 border-purple-500/30 text-white placeholder-white/50 focus:border-purple-400"
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-white/90">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="bg-white/10 border-purple-500/30 text-white placeholder-white/50 focus:border-purple-400"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="category" className="text-white/90">Category</Label>
                  <Select onValueChange={handleSelectChange} value={formData.category}>
                    <SelectTrigger className="bg-white/10 border-purple-500/30 text-white focus:border-purple-400">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-purple-500/30">
                      <SelectItem value="general">General Inquiry</SelectItem>
                      <SelectItem value="editorial">Editorial/Story Tip</SelectItem>
                      <SelectItem value="technical">Technical Support</SelectItem>
                      <SelectItem value="partnership">Partnership/Collaboration</SelectItem>
                      <SelectItem value="advertising">Advertising</SelectItem>
                      <SelectItem value="press">Press Inquiry</SelectItem>
                      <SelectItem value="feedback">Feedback/Suggestion</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="subject" className="text-white/90">Subject *</Label>
                  <Input
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                    className="bg-white/10 border-purple-500/30 text-white placeholder-white/50 focus:border-purple-400"
                    placeholder="Brief subject line"
                  />
                </div>

                <div>
                  <Label htmlFor="message" className="text-white/90">Message *</Label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={6}
                    className="bg-white/10 border-purple-500/30 text-white placeholder-white/50 focus:border-purple-400 resize-none"
                    placeholder="Tell us what's on your mind..."
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3"
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <div className="space-y-6">
            
            {/* Direct Contact */}
            <Card className="bg-white/5 backdrop-blur-sm border border-purple-500/20">
              <CardHeader className="border-b border-purple-500/20 bg-purple-900/10">
                <CardTitle className="text-xl text-white flex items-center">
                  <HeadphonesIcon className="w-5 h-5 mr-2 text-purple-400" />
                  Direct Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="flex items-start space-x-3">
                  <MailIcon className="w-5 h-5 text-purple-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-white/90 font-medium">General Inquiries</p>
                    <p className="text-white/70">contact@proximareport.com</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <MailIcon className="w-5 h-5 text-purple-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-white/90 font-medium">Editorial Team</p>
                    <p className="text-white/70">editorial@proximareport.com</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <MailIcon className="w-5 h-5 text-purple-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-white/90 font-medium">Press Inquiries</p>
                    <p className="text-white/70">press@proximareport.com</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Response Times */}
            <Card className="bg-white/5 backdrop-blur-sm border border-purple-500/20">
              <CardHeader className="border-b border-purple-500/20 bg-purple-900/10">
                <CardTitle className="text-xl text-white flex items-center">
                  <ClockIcon className="w-5 h-5 mr-2 text-purple-400" />
                  Response Times
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-white/90">General Inquiries</span>
                  <span className="text-purple-300">24-48 hours</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/90">Editorial/News Tips</span>
                  <span className="text-purple-300">12-24 hours</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/90">Technical Support</span>
                  <span className="text-purple-300">24-72 hours</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/90">Press Inquiries</span>
                  <span className="text-purple-300">6-12 hours</span>
                </div>
              </CardContent>
            </Card>

            {/* Office Information */}
            <Card className="bg-white/5 backdrop-blur-sm border border-purple-500/20">
              <CardHeader className="border-b border-purple-500/20 bg-purple-900/10">
                <CardTitle className="text-xl text-white flex items-center">
                  <MapPinIcon className="w-5 h-5 mr-2 text-purple-400" />
                  Our Mission
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-white/80 leading-relaxed">
                  We're a digital-first publication dedicated to making space science accessible to everyone. 
                  Our team works around the clock to bring you the latest in space exploration, STEM education, 
                  and cosmic discoveries.
                </p>
              </CardContent>
            </Card>

          </div>
        </div>

        {/* FAQ Section */}
        <Card className="bg-white/5 backdrop-blur-sm border border-purple-500/20">
          <CardHeader className="border-b border-purple-500/20 bg-purple-900/10">
            <CardTitle className="text-2xl text-white">Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-purple-300 mb-2">How can I submit a story tip?</h3>
                <p className="text-white/80 mb-4">
                  We welcome story tips! Use our contact form above with the "Editorial/Story Tip" category, 
                  or email us directly at editorial@proximareport.com with your news tip or story idea.
                </p>
                
                <h3 className="text-lg font-semibold text-purple-300 mb-2">Do you accept guest articles?</h3>
                <p className="text-white/80">
                  Yes! We're always looking for quality content from space enthusiasts, scientists, and educators. 
                  Please contact our editorial team with your article proposal and writing samples.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-purple-300 mb-2">How can I advertise with you?</h3>
                <p className="text-white/80 mb-4">
                  We offer various advertising opportunities for space-related businesses and organizations. 
                  Contact us using the "Advertising" category for information about our advertising packages.
                </p>
                
                <h3 className="text-lg font-semibold text-purple-300 mb-2">Can I use your content?</h3>
                <p className="text-white/80">
                  Our content is protected by copyright. For permission to republish or use our content, 
                  please contact us with details about your intended use.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default Contact; 