import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const TermsOfService: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950/40 to-black relative overflow-hidden">
      {/* Geometric ambient effects */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-violet-600/10 rounded-full blur-2xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-purple-600/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
        <div className="absolute bottom-20 right-1/3 w-28 h-28 bg-indigo-500/10 rounded-full blur-2xl animate-pulse delay-3000"></div>
      </div>

      <div className="relative z-10 container mx-auto px-3 md:px-4 py-8 md:py-12 max-w-4xl">
        <Card className="bg-white/5 backdrop-blur-sm border border-purple-500/20 shadow-2xl hover:border-purple-400/30 transition-all duration-500">
          <CardHeader className="text-center border-b border-purple-500/20 bg-purple-900/10">
            <CardTitle className="text-2xl md:text-3xl font-bold text-white mb-2 bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">Terms of Service</CardTitle>
            <p className="text-white/60">Last updated: {new Date().toLocaleDateString()}</p>
          </CardHeader>
          <CardContent className="text-white/90 space-y-6 p-4 md:p-6">
            
            <section>
              <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                1. Acceptance of Terms
              </h2>
              <p className="text-white/80">By accessing and using Proxima Report ("we," "us," or "our"), you accept and agree to be bound by the terms and provision of this agreement. These Terms of Service ("Terms") govern your use of our website, services, and any content or functionality offered on or through our website.</p>
            </section>

            <Separator className="bg-purple-500/30" />

            <section>
              <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                2. Description of Service
              </h2>
              <p className="text-white/80">Proxima Report is a STEM and space news platform that provides:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2 text-white/80">
                <li>News articles and educational content about space and science</li>
                <li>User accounts and community features</li>
                <li>Premium subscription services</li>
                <li>Advertising services for third parties</li>
                <li>Job board and career services</li>
              </ul>
            </section>

            <Separator className="bg-purple-500/30" />

            <section>
              <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                3. User Accounts
              </h2>
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-purple-400">Account Creation</h3>
                <ul className="list-disc pl-6 space-y-1 text-white/80">
                  <li>You must be at least 13 years old to create an account</li>
                  <li>You must provide accurate and complete information</li>
                  <li>You are responsible for maintaining the security of your account</li>
                  <li>You must not share your account credentials with others</li>
                </ul>
                
                <h3 className="text-lg font-medium text-purple-400">Account Responsibilities</h3>
                <ul className="list-disc pl-6 space-y-1 text-white/80">
                  <li>You are responsible for all activities that occur under your account</li>
                  <li>You must notify us immediately of any unauthorized use</li>
                  <li>We reserve the right to terminate accounts that violate these terms</li>
                </ul>
              </div>
            </section>

            <Separator className="bg-purple-500/30" />

            <section>
              <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                4. Acceptable Use
              </h2>
              <p className="mb-3 text-white/80">You agree NOT to use our service to:</p>
              <ul className="list-disc pl-6 space-y-1 text-white/80">
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe on intellectual property rights</li>
                <li>Transmit spam, viruses, or malicious code</li>
                <li>Harass, threaten, or intimidate other users</li>
                <li>Post false, misleading, or defamatory content</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with the normal operation of our website</li>
                <li>Engage in any form of automated data collection</li>
              </ul>
            </section>

            <Separator className="bg-purple-500/30" />

            <section>
              <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                5. Content and Intellectual Property
              </h2>
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-purple-400">Our Content</h3>
                <p className="text-white/80">All content on our website, including text, images, videos, and software, is owned by us or our licensors and is protected by copyright and other intellectual property laws.</p>
                
                <h3 className="text-lg font-medium text-purple-400">User-Generated Content</h3>
                <p className="text-white/80">By posting content on our website, you:</p>
                <ul className="list-disc pl-6 space-y-1 text-white/80">
                  <li>Grant us a worldwide, non-exclusive license to use, modify, and distribute your content</li>
                  <li>Represent that you have the right to post the content</li>
                  <li>Agree that your content complies with our community guidelines</li>
                  <li>Understand that we may remove content that violates these terms</li>
                </ul>
              </div>
            </section>

            <Separator className="bg-purple-500/30" />

            <section>
              <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                6. Premium Services and Subscriptions
              </h2>
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-purple-400">Subscription Terms</h3>
                <ul className="list-disc pl-6 space-y-1 text-white/80">
                  <li>Premium subscriptions are billed monthly or annually</li>
                  <li>Subscriptions automatically renew unless cancelled</li>
                  <li>Cancellations take effect at the end of the current billing period</li>
                  <li>Refunds are provided according to our refund policy</li>
                </ul>
                
                <h3 className="text-lg font-medium text-purple-400">Premium Features</h3>
                <ul className="list-disc pl-6 space-y-1 text-white/80">
                  <li>Access to exclusive content and features</li>
                  <li>Ad-free browsing experience</li>
                  <li>Priority customer support</li>
                  <li>Enhanced profile customization</li>
                </ul>
              </div>
            </section>

            <Separator className="bg-purple-500/30" />

            <section>
              <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                7. Advertising and Third-Party Services
              </h2>
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-purple-400">Advertising Services</h3>
                <ul className="list-disc pl-6 space-y-1 text-white/80">
                  <li>We display advertisements from Google Ads and other advertising networks</li>
                  <li>Ad content is provided by third parties and does not reflect our views</li>
                  <li>We are not responsible for the accuracy of advertising content</li>
                  <li>Clicking on ads may take you to third-party websites</li>
                </ul>
                
                <h3 className="text-lg font-medium text-purple-400">Advertiser Terms</h3>
                <ul className="list-disc pl-6 space-y-1 text-white/80">
                  <li>Advertisers must comply with all applicable laws and regulations</li>
                  <li>We reserve the right to reject any advertising content</li>
                  <li>Advertisers are responsible for the accuracy of their content</li>
                  <li>Payment terms are outlined in separate advertising agreements</li>
                </ul>
                
                <h3 className="text-lg font-medium text-purple-400">Third-Party Links</h3>
                <p className="text-white/80">Our website may contain links to third-party websites. We are not responsible for the content or privacy practices of these external sites.</p>
              </div>
            </section>

            <Separator className="bg-purple-500/30" />

            <section>
              <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                8. Privacy and Data Protection
              </h2>
              <p className="text-white/80">Your privacy is important to us. Our Privacy Policy explains how we collect, use, and protect your information. By using our service, you consent to the collection and use of your information as described in our Privacy Policy.</p>
            </section>

            <Separator className="bg-purple-500/30" />

            <section>
              <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                9. Disclaimers and Limitations
              </h2>
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-purple-400">Service Availability</h3>
                <p className="text-white/80">We strive to maintain service availability but cannot guarantee uninterrupted access. We may suspend service for maintenance or other reasons.</p>
                
                <h3 className="text-lg font-medium text-purple-400">Content Accuracy</h3>
                <p className="text-white/80">While we strive for accuracy, we do not guarantee that all information on our website is current, complete, or error-free.</p>
                
                <h3 className="text-lg font-medium text-purple-400">Limitation of Liability</h3>
                <p className="text-white/80">To the fullest extent permitted by law, we shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of our service.</p>
              </div>
            </section>

            <Separator className="bg-purple-500/30" />

            <section>
              <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                10. Termination
              </h2>
              <p className="text-white/80">We may terminate or suspend your account immediately, without prior notice or liability, for any reason, including:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2 text-white/80">
                <li>Violation of these Terms of Service</li>
                <li>Fraudulent or illegal activity</li>
                <li>Prolonged inactivity</li>
                <li>At our sole discretion</li>
              </ul>
            </section>

            <Separator className="bg-purple-500/30" />

            <section>
              <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                11. Governing Law
              </h2>
              <p className="text-white/80">These Terms shall be governed by and construed in accordance with the laws of [The United States of America], without regard to its conflict of law provisions. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts in [Kalispell, Montana].</p>
            </section>

            <Separator className="bg-purple-500/30" />

            <section>
              <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                12. Changes to Terms
              </h2>
              <p className="text-white/80">We reserve the right to modify these Terms at any time. We will notify users of any material changes by posting the new Terms on our website and updating the "Last updated" date. Your continued use of the service after changes become effective constitutes acceptance of the new Terms.</p>
            </section>

            <Separator className="bg-purple-500/30" />

            <section>
              <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                13. Contact Information
              </h2>
              <p className="text-white/80">If you have any questions about these Terms of Service, please contact us:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2 text-white/80">
                <li>Email: legal@proximareport.com</li>
                <li>Mail: Proxima Report, Legal Department, [Your Address]</li>
                <li>Phone: [Your Phone Number]</li>
              </ul>
            </section>

            <div className="mt-8 p-4 bg-white/10 rounded-lg">
              <p className="text-sm text-white/60">
                <strong>Google Ads Compliance:</strong> This website participates in Google AdSense and other advertising programs. 
                By using this website, you agree to the display of advertisements and the collection of data for advertising purposes 
                as described in our Privacy Policy and these Terms of Service.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TermsOfService; 