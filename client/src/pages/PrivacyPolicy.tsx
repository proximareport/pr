import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-white mb-2">Privacy Policy</CardTitle>
            <p className="text-gray-400">Last updated: {new Date().toLocaleDateString()}</p>
          </CardHeader>
          <CardContent className="text-gray-300 space-y-6">
            
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">1. Information We Collect</h2>
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-cyan-400">Information You Provide</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Account information (username, email address, password)</li>
                  <li>Profile information (bio, preferences, subscription tier)</li>
                  <li>Comments and user-generated content</li>
                  <li>Communication with our support team</li>
                  <li>Payment information (processed securely by Stripe)</li>
                </ul>
                
                <h3 className="text-lg font-medium text-cyan-400">Information We Collect Automatically</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Device information (IP address, browser type, operating system)</li>
                  <li>Usage data (pages visited, time spent, click patterns)</li>
                  <li>Cookies and similar tracking technologies</li>
                  <li>Location data (general geographic location)</li>
                </ul>
              </div>
            </section>

            <Separator className="bg-gray-600" />

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">2. How We Use Your Information</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>Provide and maintain our services</li>
                <li>Process payments and manage subscriptions</li>
                <li>Personalize content and recommendations</li>
                <li>Send important notifications about your account</li>
                <li>Improve our website and user experience</li>
                <li>Comply with legal obligations</li>
                <li>Prevent fraud and ensure security</li>
              </ul>
            </section>

            <Separator className="bg-gray-600" />

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">3. Advertising and Analytics</h2>
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-cyan-400">Google Ads and Analytics</h3>
                <p>We use Google Ads and Google Analytics to:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Display relevant advertisements</li>
                  <li>Analyze website traffic and user behavior</li>
                  <li>Measure advertising effectiveness</li>
                  <li>Provide personalized ad experiences</li>
                </ul>
                
                <h3 className="text-lg font-medium text-cyan-400">Third-Party Advertisers</h3>
                <p>We may work with third-party advertising networks that use cookies and similar technologies to:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Collect information about your visits to our website</li>
                  <li>Provide advertisements tailored to your interests</li>
                  <li>Measure ad performance and engagement</li>
                </ul>
                
                <h3 className="text-lg font-medium text-cyan-400">Ad Personalization</h3>
                <p>You can control ad personalization by:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Visiting your Google Ads Settings</li>
                  <li>Opting out of interest-based advertising</li>
                  <li>Adjusting your privacy settings in your account</li>
                </ul>
              </div>
            </section>

            <Separator className="bg-gray-600" />

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">4. Cookies and Tracking Technologies</h2>
              <p className="mb-3">We use cookies and similar technologies to:</p>
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-cyan-400">Essential Cookies</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Maintain your login session</li>
                  <li>Remember your preferences</li>
                  <li>Ensure website security</li>
                </ul>
                
                <h3 className="text-lg font-medium text-cyan-400">Analytics Cookies</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Understand how visitors use our website</li>
                  <li>Improve website performance</li>
                  <li>Generate usage statistics</li>
                </ul>
                
                <h3 className="text-lg font-medium text-cyan-400">Advertising Cookies</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Display relevant advertisements</li>
                  <li>Measure ad effectiveness</li>
                  <li>Prevent showing the same ad repeatedly</li>
                </ul>
              </div>
            </section>

            <Separator className="bg-gray-600" />

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">5. Information Sharing</h2>
              <p className="mb-3">We may share your information with:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Service Providers:</strong> Third parties that help us operate our website</li>
                <li><strong>Advertising Partners:</strong> Google and other advertising networks</li>
                <li><strong>Legal Compliance:</strong> When required by law or to protect our rights</li>
                <li><strong>Business Transfers:</strong> In connection with mergers or acquisitions</li>
              </ul>
              <p className="mt-3 text-sm text-gray-400">We do not sell your personal information to third parties.</p>
            </section>

            <Separator className="bg-gray-600" />

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">6. Data Security</h2>
              <p>We implement appropriate security measures to protect your personal information, including:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Encryption of sensitive data</li>
                <li>Secure server infrastructure</li>
                <li>Regular security audits</li>
                <li>Access controls for our team</li>
              </ul>
            </section>

            <Separator className="bg-gray-600" />

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">7. Your Rights and Choices</h2>
              <p className="mb-3">You have the right to:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Access your personal information</li>
                <li>Correct inaccurate information</li>
                <li>Delete your account and data</li>
                <li>Opt out of marketing communications</li>
                <li>Control cookie preferences</li>
                <li>Request data portability</li>
              </ul>
              <p className="mt-3">To exercise these rights, please contact us at privacy@proximareport.com</p>
            </section>

            <Separator className="bg-gray-600" />

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">8. Children's Privacy</h2>
              <p>Our website is not intended for children under 13. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately.</p>
            </section>

            <Separator className="bg-gray-600" />

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">9. International Data Transfers</h2>
              <p>Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your data during such transfers.</p>
            </section>

            <Separator className="bg-gray-600" />

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">10. Changes to This Policy</h2>
              <p>We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.</p>
            </section>

            <Separator className="bg-gray-600" />

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">11. Contact Information</h2>
              <p>If you have any questions about this Privacy Policy, please contact us:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Email: privacy@proximareport.com</li>
                <li>Mail: Proxima Report, Privacy Officer, [Your Address]</li>
                <li>Phone: [Your Phone Number]</li>
              </ul>
            </section>

            <div className="mt-8 p-4 bg-gray-700/50 rounded-lg">
              <p className="text-sm text-gray-400">
                <strong>Google Ads Compliance:</strong> This website uses Google AdSense and other Google advertising services. 
                By using this website, you consent to the use of cookies and data collection as described in this policy. 
                For more information about Google's privacy practices, visit 
                <a href="https://policies.google.com/privacy" className="text-cyan-400 hover:underline ml-1" target="_blank" rel="noopener noreferrer">
                  Google's Privacy Policy
                </a>.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PrivacyPolicy; 