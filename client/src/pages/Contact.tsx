import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { MailIcon, PhoneIcon, MapPinIcon, ClockIcon, MessageSquareIcon, HeadphonesIcon } from 'lucide-react';

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
        description: "Please try again later or use our direct email contact.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Contact <span className="text-cyan-400">Us</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Get in touch with our team. We're here to help with questions, feedback, partnerships, or anything space-related!
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Contact Information */}
          <div className="lg:col-span-1 space-y-6">
            
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <MailIcon className="w-5 h-5 mr-2 text-cyan-400" />
                  Email Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-300 space-y-3">
                <div>
                  <h4 className="font-medium text-white">General Inquiries</h4>
                  <p className="text-sm">contact@proximareport.com</p>
                </div>
                <div>
                  <h4 className="font-medium text-white">Editorial Team</h4>
                  <p className="text-sm">editorial@proximareport.com</p>
                </div>
                <div>
                  <h4 className="font-medium text-white">Technical Support</h4>
                  <p className="text-sm">support@proximareport.com</p>
                </div>
                <div>
                  <h4 className="font-medium text-white">Advertising</h4>
                  <p className="text-sm">ads@proximareport.com</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <MapPinIcon className="w-5 h-5 mr-2 text-green-400" />
                  Mailing Address
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-300">
                <address className="not-italic">
                  Proxima Report<br />
                  [Your Street Address]<br />
                  [City, State ZIP Code]<br />
                  [Country]
                </address>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <ClockIcon className="w-5 h-5 mr-2 text-yellow-400" />
                  Response Times
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-300 space-y-2">
                <div className="flex justify-between">
                  <span>General Inquiries:</span>
                  <span className="text-cyan-400">24-48 hours</span>
                </div>
                <div className="flex justify-between">
                  <span>Technical Support:</span>
                  <span className="text-cyan-400">12-24 hours</span>
                </div>
                <div className="flex justify-between">
                  <span>Press Inquiries:</span>
                  <span className="text-cyan-400">4-8 hours</span>
                </div>
                <div className="flex justify-between">
                  <span>Advertising:</span>
                  <span className="text-cyan-400">1-2 business days</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <HeadphonesIcon className="w-5 h-5 mr-2 text-purple-400" />
                  Other Ways to Reach Us
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-300 space-y-3">
                <div>
                  <h4 className="font-medium text-white">Social Media</h4>
                  <p className="text-sm">Follow us for updates and quick responses</p>
                </div>
                <div>
                  <h4 className="font-medium text-white">Community Forum</h4>
                  <p className="text-sm">Join discussions with our community</p>
                </div>
                <div>
                  <h4 className="font-medium text-white">Emergency Contact</h4>
                  <p className="text-sm">For urgent press or security issues</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-2xl text-white flex items-center">
                  <MessageSquareIcon className="w-6 h-6 mr-2 text-cyan-400" />
                  Send us a Message
                </CardTitle>
                <p className="text-gray-400">
                  Fill out the form below and we'll get back to you as soon as possible.
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name" className="text-white">Name *</Label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={handleInputChange}
                        className="bg-gray-700 border-gray-600 text-white mt-1"
                        placeholder="Your full name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-white">Email *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        className="bg-gray-700 border-gray-600 text-white mt-1"
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="category" className="text-white">Category</Label>
                    <Select onValueChange={handleSelectChange} value={formData.category}>
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white mt-1">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General Inquiry</SelectItem>
                        <SelectItem value="editorial">Editorial/Content</SelectItem>
                        <SelectItem value="technical">Technical Support</SelectItem>
                        <SelectItem value="advertising">Advertising/Partnership</SelectItem>
                        <SelectItem value="press">Press Inquiry</SelectItem>
                        <SelectItem value="feedback">Feedback/Suggestions</SelectItem>
                        <SelectItem value="bug">Bug Report</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="subject" className="text-white">Subject *</Label>
                    <Input
                      id="subject"
                      name="subject"
                      type="text"
                      required
                      value={formData.subject}
                      onChange={handleInputChange}
                      className="bg-gray-700 border-gray-600 text-white mt-1"
                      placeholder="Brief description of your inquiry"
                    />
                  </div>

                  <div>
                    <Label htmlFor="message" className="text-white">Message *</Label>
                    <Textarea
                      id="message"
                      name="message"
                      required
                      value={formData.message}
                      onChange={handleInputChange}
                      className="bg-gray-700 border-gray-600 text-white mt-1 min-h-[120px]"
                      placeholder="Please provide details about your inquiry..."
                    />
                  </div>

                  <div className="text-sm text-gray-400">
                    <p>* Required fields</p>
                    <p className="mt-2">
                      By submitting this form, you agree to our{' '}
                      <a href="/privacy" className="text-cyan-400 hover:underline">Privacy Policy</a>{' '}
                      and{' '}
                      <a href="/terms" className="text-cyan-400 hover:underline">Terms of Service</a>.
                    </p>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
                  >
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* FAQ Section */}
        <Card className="bg-gray-800/50 border-gray-700 mt-12">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-300">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-white mb-2">How can I submit a news tip?</h3>
                  <p className="text-sm">Send your tips to editorial@proximareport.com with "News Tip" in the subject line. Include all relevant details and sources.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">Can I advertise on your website?</h3>
                  <p className="text-sm">Yes! Contact ads@proximareport.com for advertising opportunities and rates. We offer various placement options.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">How do I report a technical issue?</h3>
                  <p className="text-sm">Use our contact form with "Technical Support" category or email support@proximareport.com with details about the issue.</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-white mb-2">Can I contribute content?</h3>
                  <p className="text-sm">We welcome guest contributions! Contact editorial@proximareport.com with your proposal and writing samples.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">How do I unsubscribe from emails?</h3>
                  <p className="text-sm">Use the unsubscribe link in any email, or contact support@proximareport.com for assistance.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">Do you offer internships?</h3>
                  <p className="text-sm">We occasionally offer internship opportunities. Send your resume and cover letter to contact@proximareport.com.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default Contact; 