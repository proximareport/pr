import React from 'react';
import SEO from '@/components/SEO';

const EthicsPolicy = () => {
  return (
    <>
      <SEO 
        title="Ethics Policy | Proxima Report"
        description="Our commitment to ethical journalism and responsible reporting in space news and STEM education."
        keywords="ethics policy, journalism ethics, space news ethics, STEM education, responsible reporting"
        url="https://proximareport.com/ethics-policy"
        type="website"
      />
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950/40 to-black">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold text-white mb-8">Ethics Policy</h1>
            
            <div className="prose prose-lg prose-invert max-w-none">
              <div className="bg-white/5 rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4">Our Commitment to Ethical Journalism</h2>
                <p className="text-white/80 leading-relaxed">
                  At Proxima Report, we are committed to maintaining the highest standards of journalistic integrity 
                  and ethical reporting in all our coverage of space news, STEM education, and scientific developments.
                </p>
              </div>

              <div className="bg-white/5 rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4">Editorial Independence</h2>
                <ul className="text-white/80 space-y-3">
                  <li>• We maintain complete editorial independence from external influences</li>
                  <li>• Our content decisions are based solely on journalistic merit and public interest</li>
                  <li>• We clearly disclose any potential conflicts of interest</li>
                  <li>• We do not accept payment for favorable coverage</li>
                </ul>
              </div>

              <div className="bg-white/5 rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4">Accuracy and Verification</h2>
                <ul className="text-white/80 space-y-3">
                  <li>• We verify all information through multiple reliable sources</li>
                  <li>• We correct errors promptly and transparently</li>
                  <li>• We distinguish between news reporting and opinion</li>
                  <li>• We cite sources and provide context for complex topics</li>
                </ul>
              </div>

              <div className="bg-white/5 rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4">Transparency</h2>
                <ul className="text-white/80 space-y-3">
                  <li>• We clearly identify our funding sources and partnerships</li>
                  <li>• We disclose when content is sponsored or promotional</li>
                  <li>• We are transparent about our editorial process</li>
                  <li>• We provide clear attribution for all content</li>
                </ul>
              </div>

              <div className="bg-white/5 rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4">Privacy and Respect</h2>
                <ul className="text-white/80 space-y-3">
                  <li>• We respect the privacy of individuals unless there's a compelling public interest</li>
                  <li>• We obtain consent for interviews and content use</li>
                  <li>• We protect confidential sources</li>
                  <li>• We treat all subjects with dignity and respect</li>
                </ul>
              </div>

              <div className="bg-white/5 rounded-2xl p-8">
                <h2 className="text-2xl font-semibold text-white mb-4">Contact Us</h2>
                <p className="text-white/80 leading-relaxed">
                  If you have concerns about our ethical standards or wish to report a violation, 
                  please contact us at <a href="mailto:ethics@proximareport.com" className="text-purple-400 hover:text-purple-300">ethics@proximareport.com</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default EthicsPolicy;
