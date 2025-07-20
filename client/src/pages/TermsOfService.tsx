import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const TermsOfService: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-white mb-2">Terms of Service</CardTitle>
            <p className="text-gray-400">Last updated: {new Date().toLocaleDateString()}</p>
          </CardHeader>
          <CardContent className="text-gray-300 space-y-6">
            
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">1. Acceptance of Terms</h2>
              <p>By accessing and using Proxima Report ("we," "us," or "our"), you accept and agree to be bound by the terms and provision of this agreement. These Terms of Service ("Terms") govern your use of our website, services, and any content or functionality offered on or through our website.</p>
            </section>

            <Separator className="bg-gray-600" />

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">2. Description of Service</h2>
              <p>Proxima Report is a STEM and space news platform that provides:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>News articles and educational content about space and science</li>
                <li>User accounts and community features</li>
                <li>Premium subscription services</li>
                <li>Advertising services for third parties</li>
                <li>Job board and career services</li>
              </ul>
            </section>

            <Separator className="bg-gray-600" />

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">3. User Accounts</h2>
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-cyan-400">Account Creation</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>You must be at least 13 years old to create an account</li>
                  <li>You must provide accurate and complete information</li>
                  <li>You are responsible for maintaining the security of your account</li>
                  <li>You must not share your account credentials with others</li>
                </ul>
                
                <h3 className="text-lg font-medium text-cyan-400">Account Responsibilities</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>You are responsible for all activities that occur under your account</li>
                  <li>You must notify us immediately of any unauthorized use</li>
                  <li>We reserve the right to terminate accounts that violate these terms</li>
                </ul>
              </div>
            </section>

            <Separator className="bg-gray-600" />

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">4. Acceptable Use</h2>
              <p className="mb-3">You agree NOT to use our service to:</p>
              <ul className="list-disc pl-6 space-y-1">
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

            <Separator className="bg-gray-600" />

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">5. Content and Intellectual Property</h2>
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-cyan-400">Our Content</h3>
                <p>All content on our website, including text, images, videos, and software, is owned by us or our licensors and is protected by copyright and other intellectual property laws.</p>
                
                <h3 className="text-lg font-medium text-cyan-400">User-Generated Content</h3>
                <p>By posting content on our website, you:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Grant us a worldwide, non-exclusive license to use, modify, and distribute your content</li>
                  <li>Represent that you have the right to post the content</li>
                  <li>Agree that your content complies with our community guidelines</li>
                  <li>Understand that we may remove content that violates these terms</li>
                </ul>
              </div>
            </section>

            <Separator className="bg-gray-600" />

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">6. Premium Services and Subscriptions</h2>
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-cyan-400">Subscription Terms</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Premium subscriptions are billed monthly or annually</li>
                  <li>Subscriptions automatically renew unless cancelled</li>
                  <li>Cancellations take effect at the end of the current billing period</li>
                  <li>Refunds are provided according to our refund policy</li>
                </ul>
                
                <h3 className="text-lg font-medium text-cyan-400">Premium Features</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Access to exclusive content and features</li>
                  <li>Ad-free browsing experience</li>
                  <li>Priority customer support</li>
                  <li>Enhanced profile customization</li>
                </ul>
              </div>
            </section>

            <Separator className="bg-gray-600" />

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">7. Advertising and Third-Party Services</h2>
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-cyan-400">Advertising Services</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>We display advertisements from Google Ads and other advertising networks</li>
                  <li>Ad content is provided by third parties and does not reflect our views</li>
                  <li>We are not responsible for the accuracy of advertising content</li>
                  <li>Clicking on ads may take you to third-party websites</li>
                </ul>
                
                <h3 className="text-lg font-medium text-cyan-400">Advertiser Terms</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Advertisers must comply with all applicable laws and regulations</li>
                  <li>We reserve the right to reject any advertising content</li>
                  <li>Advertisers are responsible for the accuracy of their content</li>
                  <li>Payment terms are outlined in separate advertising agreements</li>
                </ul>
                
                <h3 className="text-lg font-medium text-cyan-400">Third-Party Links</h3>
                <p>Our website may contain links to third-party websites. We are not responsible for the content or privacy practices of these external sites.</p>
              </div>
            </section>

            <Separator className="bg-gray-600" />

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">8. Privacy and Data Protection</h2>
              <p>Your privacy is important to us. Our Privacy Policy explains how we collect, use, and protect your information. By using our service, you consent to the collection and use of your information as described in our Privacy Policy.</p>
            </section>

            <Separator className="bg-gray-600" />

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">9. Disclaimers and Limitations</h2>
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-cyan-400">Service Availability</h3>
                <p>We strive to maintain service availability but cannot guarantee uninterrupted access. We may suspend service for maintenance or other reasons.</p>
                
                <h3 className="text-lg font-medium text-cyan-400">Content Accuracy</h3>
                <p>While we strive for accuracy, we do not guarantee that all information on our website is current, complete, or error-free.</p>
                
                <h3 className="text-lg font-medium text-cyan-400">Limitation of Liability</h3>
                <p>To the fullest extent permitted by law, we shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of our service.</p>
              </div>
            </section>

            <Separator className="bg-gray-600" />

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">10. Termination</h2>
              <p>We may terminate or suspend your account immediately, without prior notice or liability, for any reason, including:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>Violation of these Terms of Service</li>
                <li>Fraudulent or illegal activity</li>
                <li>Prolonged inactivity</li>
                <li>At our sole discretion</li>
              </ul>
            </section>

            <Separator className="bg-gray-600" />

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">11. Governing Law</h2>
              <p>These Terms shall be governed by and construed in accordance with the laws of [Your Jurisdiction], without regard to its conflict of law provisions. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts in [Your Jurisdiction].</p>
            </section>

            <Separator className="bg-gray-600" />

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">12. Changes to Terms</h2>
              <p>We reserve the right to modify these Terms at any time. We will notify users of any material changes by posting the new Terms on our website and updating the "Last updated" date. Your continued use of the service after changes become effective constitutes acceptance of the new Terms.</p>
            </section>

            <Separator className="bg-gray-600" />

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">13. Contact Information</h2>
              <p>If you have any questions about these Terms of Service, please contact us:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>Email: legal@proximareport.com</li>
                <li>Mail: Proxima Report, Legal Department, [Your Address]</li>
                <li>Phone: [Your Phone Number]</li>
              </ul>
            </section>

            <div className="mt-8 p-4 bg-gray-700/50 rounded-lg">
              <p className="text-sm text-gray-400">
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