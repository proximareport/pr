import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const CookiePolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-white mb-2">Cookie Policy</CardTitle>
            <p className="text-gray-400">Last updated: {new Date().toLocaleDateString()}</p>
          </CardHeader>
          <CardContent className="text-gray-300 space-y-6">
            
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">1. What Are Cookies</h2>
              <p>Cookies are small text files that are placed on your device when you visit our website. They help us provide you with a better experience by remembering your preferences and understanding how you use our site.</p>
            </section>

            <Separator className="bg-gray-600" />

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">2. How We Use Cookies</h2>
              <p className="mb-3">We use cookies for several purposes:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>To keep you logged in to your account</li>
                <li>To remember your preferences and settings</li>
                <li>To analyze how our website is used</li>
                <li>To display relevant advertisements</li>
                <li>To improve our website's performance</li>
                <li>To prevent fraud and ensure security</li>
              </ul>
            </section>

            <Separator className="bg-gray-600" />

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">3. Types of Cookies We Use</h2>
              
              <div className="space-y-4">
                <div className="bg-gray-700/50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-cyan-400 mb-2">Essential Cookies</h3>
                  <p className="text-sm mb-2">These cookies are necessary for our website to function properly.</p>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Session cookies to maintain your login state</li>
                    <li>Security cookies to protect against fraud</li>
                    <li>Preference cookies to remember your settings</li>
                  </ul>
                </div>

                <div className="bg-gray-700/50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-cyan-400 mb-2">Analytics Cookies</h3>
                  <p className="text-sm mb-2">These cookies help us understand how visitors interact with our website.</p>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li><strong>Google Analytics:</strong> Tracks page views, user behavior, and site performance</li>
                    <li><strong>Internal Analytics:</strong> Helps us understand content popularity and user preferences</li>
                    <li><strong>Performance Monitoring:</strong> Identifies technical issues and optimization opportunities</li>
                  </ul>
                </div>

                <div className="bg-gray-700/50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-cyan-400 mb-2">Advertising Cookies</h3>
                  <p className="text-sm mb-2">These cookies are used to deliver personalized advertisements.</p>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li><strong>Google Ads:</strong> Displays relevant ads based on your interests</li>
                    <li><strong>Google AdSense:</strong> Serves contextual and personalized advertisements</li>
                    <li><strong>Remarketing:</strong> Shows ads to users who have previously visited our site</li>
                    <li><strong>Ad Measurement:</strong> Tracks ad performance and effectiveness</li>
                  </ul>
                </div>

                <div className="bg-gray-700/50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-cyan-400 mb-2">Social Media Cookies</h3>
                  <p className="text-sm mb-2">These cookies enable social media features and sharing.</p>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Share buttons for social media platforms</li>
                    <li>Embedded content from social media sites</li>
                    <li>Social media login functionality</li>
                  </ul>
                </div>
              </div>
            </section>

            <Separator className="bg-gray-600" />

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">4. Third-Party Cookies</h2>
              <p className="mb-3">We use services from third parties that may set their own cookies:</p>
              
              <div className="space-y-3">
                <div className="border border-gray-600 p-3 rounded">
                  <h4 className="font-medium text-white mb-1">Google Services</h4>
                  <p className="text-sm text-gray-400">Google Analytics, Google Ads, and Google AdSense use cookies to provide their services.</p>
                  <a href="https://policies.google.com/technologies/cookies" className="text-cyan-400 hover:underline text-sm" target="_blank" rel="noopener noreferrer">Learn more about Google's cookie policy</a>
                </div>
                
                <div className="border border-gray-600 p-3 rounded">
                  <h4 className="font-medium text-white mb-1">Stripe</h4>
                  <p className="text-sm text-gray-400">Payment processing cookies for subscription and payment services.</p>
                  <a href="https://stripe.com/cookies-policy" className="text-cyan-400 hover:underline text-sm" target="_blank" rel="noopener noreferrer">View Stripe's cookie policy</a>
                </div>
                
                <div className="border border-gray-600 p-3 rounded">
                  <h4 className="font-medium text-white mb-1">Content Delivery Networks</h4>
                  <p className="text-sm text-gray-400">CDN services may use cookies to optimize content delivery.</p>
                </div>
              </div>
            </section>

            <Separator className="bg-gray-600" />

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">5. Managing Your Cookie Preferences</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-cyan-400 mb-2">Browser Settings</h3>
                  <p className="mb-2">You can control cookies through your browser settings:</p>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Block all cookies</li>
                    <li>Allow only first-party cookies</li>
                    <li>Delete existing cookies</li>
                    <li>Receive notifications when cookies are set</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-cyan-400 mb-2">Google Ad Settings</h3>
                  <p className="mb-2">You can opt out of personalized advertising:</p>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li><a href="https://adssettings.google.com/" className="text-cyan-400 hover:underline" target="_blank" rel="noopener noreferrer">Google Ads Settings</a></li>
                    <li><a href="https://tools.google.com/dlpage/gaoptout" className="text-cyan-400 hover:underline" target="_blank" rel="noopener noreferrer">Google Analytics Opt-out</a></li>
                    <li><a href="https://www.aboutads.info/choices/" className="text-cyan-400 hover:underline" target="_blank" rel="noopener noreferrer">Digital Advertising Alliance Opt-out</a></li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-cyan-400 mb-2">Account Settings</h3>
                  <p className="mb-2">Registered users can control some cookie preferences in their account settings:</p>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Personalized advertising preferences</li>
                    <li>Analytics data collection</li>
                    <li>Newsletter and marketing preferences</li>
                  </ul>
                </div>
              </div>
            </section>

            <Separator className="bg-gray-600" />

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">6. Cookie Consent</h2>
              <p className="mb-3">By using our website, you consent to the use of cookies as described in this policy. You can withdraw your consent at any time by:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Changing your browser settings</li>
                <li>Clearing your browser cookies</li>
                <li>Adjusting your account preferences</li>
                <li>Contacting us directly</li>
              </ul>
            </section>

            <Separator className="bg-gray-600" />

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">7. Impact of Disabling Cookies</h2>
              <p className="mb-3">Disabling cookies may affect your experience on our website:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>You may need to log in repeatedly</li>
                <li>Your preferences may not be saved</li>
                <li>Some features may not work properly</li>
                <li>You may see less relevant advertisements</li>
              </ul>
            </section>

            <Separator className="bg-gray-600" />

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">8. Updates to This Policy</h2>
              <p>We may update this Cookie Policy from time to time to reflect changes in our practices or applicable laws. We will notify you of any material changes by posting the updated policy on our website.</p>
            </section>

            <Separator className="bg-gray-600" />

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">9. Contact Us</h2>
              <p className="mb-3">If you have any questions about our use of cookies, please contact us:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Email: privacy@proximareport.com</li>
                <li>Mail: Proxima Report, Privacy Officer, [Your Address]</li>
                <li>Phone: [Your Phone Number]</li>
              </ul>
            </section>

            <div className="mt-8 p-4 bg-gray-700/50 rounded-lg">
              <p className="text-sm text-gray-400">
                <strong>For Google Ads Compliance:</strong> This website uses Google AdSense and other Google advertising services 
                that may use cookies to serve ads based on your visits to this site and other sites on the Internet. 
                You can opt out of personalized advertising by visiting 
                <a href="https://adssettings.google.com/" className="text-cyan-400 hover:underline ml-1" target="_blank" rel="noopener noreferrer">
                  Google Ads Settings
                </a>.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CookiePolicy; 