import { Link } from "wouter";
import { RocketIcon } from "lucide-react";
import { FaTwitter, FaFacebook, FaInstagram, FaYoutube } from "react-icons/fa";

function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-[#14141E] border-t border-white/10 py-10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center">
                <RocketIcon className="h-6 w-6 text-white transform -rotate-45" />
              </div>
              <span className="ml-2 text-xl font-space font-bold tracking-wider text-white">
                PROXIMA<span className="text-purple-500">REPORT</span>
              </span>
            </div>
            <p className="text-white/70 mb-4">
              Your premier destination for space exploration and scientific discovery.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-white/60 hover:text-purple-500 transition">
                <FaTwitter size={18} />
              </a>
              <a href="#" className="text-white/60 hover:text-purple-500 transition">
                <FaFacebook size={18} />
              </a>
              <a href="#" className="text-white/60 hover:text-purple-500 transition">
                <FaInstagram size={18} />
              </a>
              <a href="#" className="text-white/60 hover:text-purple-500 transition">
                <FaYoutube size={18} />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="font-space font-bold text-white mb-4">Explore</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-white/70 hover:text-purple-500 transition">
                  Latest News
                </Link>
              </li>
              <li>
                <Link href="/launches" className="text-white/70 hover:text-purple-500 transition">
                  Launches
                </Link>
              </li>
              <li>
                <Link href="/missioncontrol" className="text-white/70 hover:text-purple-500 transition">
                  Mission Control
                </Link>
              </li>
              <li>
                <Link href="/astronomy" className="text-white/70 hover:text-purple-500 transition">
                  Astronomy
                </Link>
              </li>
              <li>
                <Link href="/technology" className="text-white/70 hover:text-purple-500 transition">
                  Technology
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-space font-bold text-white mb-4">Membership</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/subscribe" className="text-white/70 hover:text-purple-500 transition">
                  Join Now
                </Link>
              </li>
              <li>
                <Link href="/membership/benefits" className="text-white/70 hover:text-purple-500 transition">
                  Benefits
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-white/70 hover:text-purple-500 transition">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/gift" className="text-white/70 hover:text-purple-500 transition">
                  Gift Membership
                </Link>
              </li>
              <li>
                <Link href="/profile/settings" className="text-white/70 hover:text-purple-500 transition">
                  Cancel Subscription
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-space font-bold text-white mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-white/70 hover:text-purple-500 transition">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/careers" className="text-white/70 hover:text-purple-500 transition">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/advertise" className="text-white/70 hover:text-purple-500 transition">
                  Advertise
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-white/70 hover:text-purple-500 transition">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-white/70 hover:text-purple-500 transition">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-white/10 text-center">
          <p className="text-white/60 text-sm">
            © {currentYear} Proxima Report. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
