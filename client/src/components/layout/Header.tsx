import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/AuthContext";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MenuIcon, LogOutIcon, UserIcon, SettingsIcon, ShieldIcon, LineChartIcon, Search, ChevronDownIcon, ShoppingCartIcon, ExternalLinkIcon, BriefcaseIcon, MegaphoneIcon, RocketIcon, ActivityIcon, ClockIcon } from "lucide-react";
import { SearchPopup } from "@/components/search/SearchPopup";

// Import logo images
import desktopLogo from "../../assets/images/proxima-logo-desktop.png";
import mobileLogo from "../../assets/images/proxima-logo-mobile.png";

function Header() {
  const [location] = useLocation();
  const { user, logout, isAdmin } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: "Mission Control", href: "/missioncontrol" },
    { name: "Gallery", href: "/gallery" },
    { name: "Topics", href: "/topics" },
    { name: "Staff", href: "/staff" },
    { name: "About", href: "/about" },
  ];

  const businessLinks = [
    { name: "Jobs", href: "/jobs", icon: <BriefcaseIcon className="h-4 w-4" /> },
    { name: "Advertise", href: "/advertise", icon: <MegaphoneIcon className="h-4 w-4" /> },
    { name: "Pricing", href: "/pricing", icon: <ShoppingCartIcon className="h-4 w-4" /> },
    { name: "ProxiHub", href: "/proxihub", icon: <RocketIcon className="h-4 w-4" /> },
    { name: "System Status", href: "https://proximareport.statuspage.io", icon: <ActivityIcon className="h-4 w-4" />, external: true },
  ];

  const isActive = (path: string) => location === path;

  // Function to close mobile menu
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Function to handle navigation with auto-close
  const handleNavigation = (href: string) => {
    closeMobileMenu();
    // Navigate to the href
    window.location.href = href;
  };

  return (
    <header className="bg-[#14141E] border-b border-white/10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center">
              {/* Desktop logo (visible on md and larger screens) */}
              <img 
                src={desktopLogo} 
                alt="Proxima Report" 
                className="hidden md:block h-auto w-auto max-h-5 max-w-[180px] object-contain" 
              />
              {/* Mobile logo (visible on smaller screens) */}
              <img 
                src={mobileLogo} 
                alt="Proxima Report" 
                className="block md:hidden h-auto w-auto max-h-10 max-w-[40px] object-contain" 
              />
            </Link>
            
            <nav className="hidden md:flex items-center space-x-8">
              {navLinks.map((link) => (
                <Link 
                  key={link.name} 
                  href={link.href}
                  className={`text-sm font-medium transition-colors ${
                    isActive(link.href) ? "text-purple-400" : "text-white/90 hover:text-purple-400"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              
              {/* Business Services Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className={`flex items-center text-sm font-medium transition-colors ${
                    businessLinks.some(link => isActive(link.href)) ? "text-purple-400" : "text-white/90 hover:text-purple-400"
                  }`}>
                    Services
                    <ChevronDownIcon className="ml-1 h-3 w-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center">
                  {businessLinks.map((link) => (
                    <DropdownMenuItem key={link.name} asChild>
                      {link.external ? (
                        <a 
                          href={link.href} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="flex items-center"
                        >
                          {link.icon}
                          <span className="ml-2">{link.name}</span>
                          <ExternalLinkIcon className="ml-auto h-3 w-3" />
                        </a>
                      ) : (
                        <Link href={link.href} className="flex items-center">
                          {link.icon}
                          <span className="ml-2">{link.name}</span>
                        </Link>
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Store Button */}
              <a 
                href="https://store.proximareport.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1 bg-gradient-to-r from-purple-600 to-violet-700 hover:from-purple-700 hover:to-violet-800 text-white px-3 py-1.5 rounded-lg transition-all duration-300 shadow-lg shadow-purple-500/25 text-sm font-medium"
              >
                <ShoppingCartIcon className="h-4 w-4" />
                Store
                <ExternalLinkIcon className="h-3 w-3" />
              </a>
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Search Icon Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSearchOpen(true)}
              className="text-white/90 hover:text-purple-400"
            >
              <Search className="h-5 w-5" />
            </Button>
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-full">
                    <Avatar className="h-10 w-10 border-2 border-purple-500/40">
                      <AvatarImage src={user.profilePicture} alt={user.username} />
                      <AvatarFallback className="bg-purple-600 text-white font-semibold">{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-2">
                      <p className="text-sm font-semibold leading-none">{user.username}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                      {user.membershipTier !== "free" && (
                        <p className="text-xs font-semibold text-purple-400 mt-1">
                          {user.membershipTier === "supporter" ? "Supporter" : "Pro Member"}
                        </p>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                      <Link href={`/profile/${user.username}`}>
                        <UserIcon className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin">
                          <ShieldIcon className="mr-2 h-4 w-4" />
                          <span>Admin Panel</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                      <Link href="/advertiser-dashboard">
                        <LineChartIcon className="mr-2 h-4 w-4" />
                        <span>Ad Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/profile/settings">
                        <SettingsIcon className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>
                    <LogOutIcon className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden md:block">
                <Button asChild variant="outline">
                  <Link href="/login">Sign In</Link>
                </Button>
              </div>
            )}
            
            <div className="block md:hidden">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-white">
                    <MenuIcon className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="bg-[#14141E] border-l border-white/10 max-w-[300px] p-0">
                  <div className="h-full flex flex-col">
                    {/* Fixed Header with Logo */}
                    <div className="flex-shrink-0 p-6 border-b border-white/10">
                      <div className="flex items-center">
                        <img 
                          src={mobileLogo} 
                          alt="Proxima Report" 
                          className="h-auto w-auto max-h-16 max-w-[64px] object-contain" 
                        />
                        <img 
                          src={desktopLogo} 
                          alt="Proxima Report" 
                          className="ml-3 h-auto w-auto max-h-5 max-w-[140px] object-contain" 
                        />
                      </div>
                    </div>

                    {/* User Profile Section - Mobile (TOP) */}
                    {user && (
                      <div className="flex-shrink-0 p-6 border-b border-white/10 bg-white/5">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-12 w-12 border-2 border-purple-500/40">
                            <AvatarImage src={user.profilePicture} alt={user.username} />
                            <AvatarFallback className="bg-purple-600 text-white font-semibold">
                              {user.username.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{user.username}</p>
                            <p className="text-xs text-gray-400 truncate">{user.email}</p>
                            {user.membershipTier !== "free" && (
                              <p className="text-xs font-semibold text-purple-400 mt-1">
                                {user.membershipTier === "supporter" ? "Supporter" : "Pro Member"}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {/* Quick Profile Actions */}
                        <div className="mt-3 pt-3 border-t border-white/10">
                          <div className="grid grid-cols-2 gap-2">
                            <Button 
                              asChild 
                              variant="outline" 
                              size="sm" 
                              className="text-xs"
                              onClick={closeMobileMenu}
                            >
                              <Link href={`/profile/${user.username}`}>
                                <UserIcon className="h-3 w-3 mr-1" />
                                Profile
                              </Link>
                            </Button>
                            <Button 
                              asChild 
                              variant="outline" 
                              size="sm" 
                              className="text-xs"
                              onClick={closeMobileMenu}
                            >
                              <Link href="/profile/settings">
                                <SettingsIcon className="h-3 w-3 mr-1" />
                                Settings
                              </Link>
                            </Button>
                          </div>
                          {isAdmin && (
                            <Button 
                              asChild 
                              variant="outline" 
                              size="sm" 
                              className="text-xs w-full mt-2"
                              onClick={closeMobileMenu}
                            >
                              <Link href="/admin">
                                <ShieldIcon className="h-3 w-3 mr-1" />
                                Admin Panel
                              </Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#6b7280 #374151' }}>
                      <div className="p-6">
                        <nav className="flex flex-col space-y-6">
                          {navLinks.map((link) => (
                            <Link 
                              key={link.name} 
                              href={link.href}
                              onClick={closeMobileMenu}
                              className={`text-lg font-semibold transition-colors ${
                                isActive(link.href) ? "text-purple-400" : "text-white/90 hover:text-purple-400"
                              }`}
                            >
                              {link.name}
                            </Link>
                          ))}
                          
                          {/* Business Services */}
                          <div>
                            <div className="text-sm font-medium text-gray-400 mb-3">Services</div>
                            <div className="flex flex-col space-y-3 ml-4">
                              {businessLinks.map((link) => (
                                link.external ? (
                                  <a 
                                    key={link.name} 
                                    href={link.href}
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    onClick={closeMobileMenu}
                                    className="text-md font-medium transition-colors flex items-center text-white/90 hover:text-purple-400"
                                  >
                                    {link.icon}
                                    <span className="ml-2">{link.name}</span>
                                    <ExternalLinkIcon className="ml-auto h-3 w-3" />
                                  </a>
                                ) : (
                                  <Link 
                                    key={link.name} 
                                    href={link.href}
                                    onClick={closeMobileMenu}
                                    className={`text-md font-medium transition-colors flex items-center ${
                                      isActive(link.href) ? "text-purple-400" : "text-white/90 hover:text-purple-400"
                                    }`}
                                  >
                                    {link.icon}
                                    <span className="ml-2">{link.name}</span>
                                  </Link>
                                )
                              ))}
                            </div>
                          </div>
                          
                          {/* Store Button Mobile */}
                          <a 
                            href="https://store.proximareport.com" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            onClick={closeMobileMenu}
                            className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-violet-700 hover:from-purple-700 hover:to-violet-800 text-white px-4 py-3 rounded-lg transition-all duration-300 shadow-lg shadow-purple-500/25 font-medium"
                          >
                            <ShoppingCartIcon className="h-5 w-5" />
                            Visit Store
                            <ExternalLinkIcon className="h-4 w-4" />
                          </a>
                        </nav>
                        
                        <div className="mt-8 pt-6 border-t border-white/10">
                          {!user ? (
                            <div className="space-y-4">
                              <Button asChild variant="outline" className="w-full" onClick={closeMobileMenu}>
                                <Link href="/login">Sign In</Link>
                              </Button>
                              <Button asChild variant="outline" className="w-full" onClick={closeMobileMenu}>
                                <Link href="/register">Register</Link>
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <Button 
                                asChild 
                                variant="outline" 
                                className="w-full" 
                                onClick={closeMobileMenu}
                              >
                                <Link href="/advertiser-dashboard">
                                  <LineChartIcon className="h-4 w-4 mr-2" />
                                  Ad Dashboard
                                </Link>
                              </Button>
                              <Button 
                                variant="outline" 
                                className="w-full text-red-400 hover:text-red-300 hover:border-red-400" 
                                onClick={() => {
                                  logout();
                                  closeMobileMenu();
                                }}
                              >
                                <LogOutIcon className="h-4 w-4 mr-2" />
                                Sign Out
                              </Button>
                            </div>
                          )}
                          
                          {user && user.membershipTier === "free" && (
                            <Button variant="outline" className="w-full" disabled>
                              <ClockIcon className="h-4 w-4 mr-2" />
                              Coming Soon
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
      
      <SearchPopup isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </header>
  );
}

export default Header;