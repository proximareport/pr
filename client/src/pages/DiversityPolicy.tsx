import React from 'react';
import SEO from '@/components/SEO';

const DiversityPolicy = () => {
  return (
    <>
      <SEO 
        title="Diversity Policy | Proxima Report"
        description="Our commitment to diversity, equity, and inclusion in space news, STEM education, and our organization."
        keywords="diversity policy, inclusion, equity, STEM diversity, space industry diversity, accessibility"
        url="https://proximareport.com/diversity-policy"
        type="website"
      />
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950/40 to-black">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold text-white mb-8">Diversity Policy</h1>
            
            <div className="prose prose-lg prose-invert max-w-none">
              <div className="bg-white/5 rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4">Our Commitment to Diversity, Equity, and Inclusion</h2>
                <p className="text-white/80 leading-relaxed">
                  At Proxima Report, we believe that diversity, equity, and inclusion are fundamental to advancing 
                  space exploration and STEM education. We are committed to creating an inclusive environment that 
                  celebrates diverse perspectives and ensures equal access to space science and technology.
                </p>
              </div>

              <div className="bg-white/5 rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4">Content Representation</h2>
                <ul className="text-white/80 space-y-3">
                  <li>• We actively seek to highlight diverse voices in space science and technology</li>
                  <li>• We feature stories from underrepresented communities in STEM</li>
                  <li>• We ensure our content is accessible to people of all backgrounds</li>
                  <li>• We challenge stereotypes and promote inclusive narratives</li>
                </ul>
              </div>

              <div className="bg-white/5 rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4">Accessibility</h2>
                <ul className="text-white/80 space-y-3">
                  <li>• We design our website to be accessible to users with disabilities</li>
                  <li>• We provide alternative text for images and captions for videos</li>
                  <li>• We use clear, inclusive language in all our content</li>
                  <li>• We ensure our content is available in multiple formats</li>
                </ul>
              </div>

              <div className="bg-white/5 rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4">Educational Equity</h2>
                <ul className="text-white/80 space-y-3">
                  <li>• We provide free educational resources to promote STEM accessibility</li>
                  <li>• We partner with organizations that support underrepresented students</li>
                  <li>• We create content that is culturally relevant and inclusive</li>
                  <li>• We actively work to reduce barriers to STEM education</li>
                </ul>
              </div>

              <div className="bg-white/5 rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4">Community Engagement</h2>
                <ul className="text-white/80 space-y-3">
                  <li>• We engage with diverse communities in space science</li>
                  <li>• We amplify voices from underrepresented groups</li>
                  <li>• We create safe spaces for discussion and learning</li>
                  <li>• We actively listen to feedback from our diverse audience</li>
                </ul>
              </div>

              <div className="bg-white/5 rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4">Our Team</h2>
                <ul className="text-white/80 space-y-3">
                  <li>• We are committed to building a diverse team of writers and contributors</li>
                  <li>• We provide equal opportunities for professional development</li>
                  <li>• We foster an inclusive workplace culture</li>
                  <li>• We value different perspectives and experiences</li>
                </ul>
              </div>

              <div className="bg-white/5 rounded-2xl p-8">
                <h2 className="text-2xl font-semibold text-white mb-4">Contact Us</h2>
                <p className="text-white/80 leading-relaxed">
                  We welcome feedback on our diversity and inclusion efforts. 
                  Please contact us at <a href="mailto:diversity@proximareport.com" className="text-purple-400 hover:text-purple-300">diversity@proximareport.com</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DiversityPolicy;
