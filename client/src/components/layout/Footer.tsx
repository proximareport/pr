import { Link } from "wouter";
import { MapPinIcon, MailIcon, PhoneIcon, ArrowRightIcon, ExternalLinkIcon, ClockIcon, CookieIcon } from "lucide-react";
import { FaTwitter, FaFacebook, FaInstagram, FaYoutube, FaLinkedin, FaDiscord } from "react-icons/fa";
import { useState } from "react";
import { useGoogleAds } from "../GoogleAdsProvider";

// Import logo image
import mobileLogo from "../../assets/images/proxima-logo-mobile.png";

function Footer() {
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { consentGiven, setConsentGiven } = useGoogleAds();

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Newsletter subscription logic would go here
    setTimeout(() => {
      setIsSubmitting(false);
      setEmail("");
      // Show success message
    }, 1000);
  };

  const handleAcceptCookies = () => {
    setConsentGiven(true);
    // Store in localStorage for persistence - use same key as GoogleAdsProvider
    localStorage.setItem('ads-consent', 'true');
  };
  
  return (
    <footer className="relative bg-gradient-to-br from-gray-950 via-purple-950/40 to-black border-t border-purple-900/30 overflow-hidden">
      {/* Dark purple geometric background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-purple-900/10 via-violet-900/10 to-purple-800/10"></div>
        <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-r from-purple-600/15 to-violet-600/15 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-gradient-to-r from-purple-700/15 to-pink-700/15 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-gradient-to-r from-violet-600/10 to-purple-600/10 rounded-full blur-2xl"></div>
        <div className="absolute inset-0 bg-black/20"></div>
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Brand Section - Enhanced with Purple */}
            <div className="lg:col-span-4">
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-700 flex items-center justify-center shadow-lg shadow-purple-500/25 overflow-hidden">
                      <img 
                        src={mobileLogo} 
                        alt="Proxima Report" 
                        className="h-8 w-8 object-contain" 
                      />
                    </div>
                    <div className="absolute -inset-1 bg-gradient-to-br from-purple-500 to-violet-700 rounded-2xl opacity-30 blur-sm"></div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">
                      PROXIMA<span className="text-purple-400">REPORT</span>
                    </h2>
                    <p className="text-gray-500 text-sm">Space • Science • Future</p>
                  </div>
                </div>
                
                <p className="text-gray-300 leading-relaxed max-w-sm">
                  Your premier destination for space exploration, scientific discovery, and the future of humanity among the stars.
                </p>
                
                {/* Contact Info */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 text-gray-400">
                    <MapPinIcon className="h-4 w-4 text-purple-400" />
                    <span className="text-sm">Space</span>
                  </div>
                  <div className="flex items-center space-x-3 text-gray-400">
                    <MailIcon className="h-4 w-4 text-purple-400" />
                    <span className="text-sm">contact@proximareport.com</span>
                  </div>
                </div>
                
                {/* Social Media - Purple Theme */}
                <div className="flex space-x-4 pt-2">
                  {[
                    { icon: FaTwitter, href: "#", label: "Twitter" },
                    { icon: FaYoutube, href: "#", label: "YouTube" },
                    { icon: FaInstagram, href: "#", label: "Instagram" },
                    { icon: FaLinkedin, href: "#", label: "LinkedIn" },
                    { icon: FaDiscord, href: "#", label: "Discord" },
                  ].map(({ icon: Icon, href, label }) => (
                    <a
                      key={label}
                      href={href}
                      aria-label={label}
                      className="group relative w-10 h-10 rounded-xl bg-gray-900/50 border border-gray-800/50 flex items-center justify-center hover:bg-gray-800/50 hover:border-purple-400/30 transition-all duration-300"
                    >
                      <Icon className="h-4 w-4 text-gray-400 group-hover:text-purple-400 transition-colors duration-300" />
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-400/0 to-violet-400/0 group-hover:from-purple-400/10 group-hover:to-violet-400/10 transition-all duration-300"></div>
                    </a>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Navigation Sections */}
            <div className="lg:col-span-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                
                {/* Explore Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                    <span>Explore</span>
                  </h3>
                  <ul className="space-y-3">
                    {[
                      { href: "/", label: "Latest News" },
                      { href: "/launches", label: "Launches" },
                      { href: "/missioncontrol", label: "Mission Control" },
                      { href: "/astronomy", label: "Astronomy" },
                      { href: "/gallery", label: "Gallery" },
                    ].map(({ href, label }) => (
                      <li key={label}>
                        <Link 
                          href={href} 
                          className="group flex items-center text-gray-400 hover:text-purple-400 transition-all duration-300"
                        >
                          <span className="group-hover:translate-x-1 transition-transform duration-300">{label}</span>
                          <ArrowRightIcon className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-all duration-300" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* Membership Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                    <MailIcon className="h-5 w-5 text-purple-400" />
                    <span>Membership</span>
                  </h3>
                  <ul className="space-y-3">
                    {[
                      { href: "/subscribe", label: "Join Now", disabled: true },
                      { href: "/pricing", label: "Pricing", disabled: false },
                      { href: "/benefits", label: "Benefits", disabled: false },
                      { href: "/gift", label: "Gift Membership", disabled: true },
                    ].map(({ href, label, disabled }) => (
                      <li key={label}>
                        {disabled ? (
                          <span className="group flex items-center text-gray-600 transition-all duration-300 cursor-not-allowed">
                            <span className="group-hover:translate-x-1 transition-transform duration-300">{label}</span>
                            <ClockIcon className="h-3 w-3 ml-1 opacity-50" />
                          </span>
                        ) : (
                          <Link 
                            href={href} 
                            className="group flex items-center text-gray-400 hover:text-purple-400 transition-all duration-300"
                          >
                            <span className="group-hover:translate-x-1 transition-transform duration-300">{label}</span>
                            <ArrowRightIcon className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-all duration-300" />
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* Company Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                    <ExternalLinkIcon className="h-5 w-5 text-purple-400" />
                    <span>Company</span>
                  </h3>
                  <ul className="space-y-3">
                    {[
                      { href: "/about", label: "About Us" },
                      { href: "/contact", label: "Contact" },
                      { href: "/sitemap", label: "Sitemap" },
                      { href: "/advertise", label: "Advertise" },
                      { href: "/careers", label: "Careers" },
                      { href: "/privacy", label: "Privacy" },
                      { href: "/terms", label: "Terms" },
                    ].map(({ href, label }) => (
                      <li key={label}>
                        <Link 
                          href={href} 
                          className="group flex items-center text-gray-400 hover:text-purple-400 transition-all duration-300"
                        >
                          <span className="group-hover:translate-x-1 transition-transform duration-300">{label}</span>
                          <ArrowRightIcon className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-all duration-300" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            
            {/* Newsletter Section - Dark Purple */}
            <div className="lg:col-span-2">
              <div className="bg-gradient-to-br from-gray-900/80 to-purple-950/50 backdrop-blur-sm rounded-2xl border border-purple-900/30 p-6 space-y-4">
                <h3 className="text-lg font-semibold text-white">Stay Updated</h3>
                <p className="text-gray-400 text-sm">
                  Get the latest space news and updates delivered to your inbox.
                </p>
                
                <form onSubmit={handleNewsletterSubmit} className="space-y-3">
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full px-4 py-3 bg-black/50 border border-gray-800/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400/50 transition-all duration-300"
                      required
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-violet-700 hover:from-purple-700 hover:to-violet-800 text-white font-medium rounded-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <span>Subscribe</span>
                        <ArrowRightIcon className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>
                
                <p className="text-xs text-gray-600">
                  No spam. Unsubscribe anytime.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom Bar - Darker */}
        <div className="border-t border-purple-900/30 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-6 text-sm text-gray-500">
              <span>© {currentYear} Proxima Report</span>
              <Link href="/privacy" className="hover:text-purple-400 transition-colors duration-300">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-purple-400 transition-colors duration-300">
                Terms
              </Link>
              <Link href="/cookies" className="hover:text-purple-400 transition-colors duration-300">
                Cookies
              </Link>
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>Site Version 2.5</span>
              <a 
                href="/rss.xml" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center space-x-1 hover:text-purple-400 transition-colors duration-300"
              >
                <span>RSS</span>
                <ExternalLinkIcon className="h-3 w-3" />
              </a>
            </div>
          </div>

          {/* Cookie Consent Button */}
          {!consentGiven && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={handleAcceptCookies}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-violet-700 hover:from-purple-700 hover:to-violet-800 text-white font-medium rounded-xl transition-all duration-300 transform hover:scale-[1.02] border border-purple-500/30 hover:border-purple-400/50"
              >
                <CookieIcon className="h-4 w-4" />
                <span>Accept Cookies</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}

export default Footer;
