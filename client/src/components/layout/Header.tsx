import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/AuthContext";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MenuIcon, LogOutIcon, UserIcon, SettingsIcon, ShieldIcon, LineChartIcon, Search } from "lucide-react";
import { SearchPopup } from "@/components/search/SearchPopup";

// Import logo images
import desktopLogo from "../../assets/images/proxima-logo-desktop.png";
import mobileLogo from "../../assets/images/proxima-logo-mobile.png";

function Header() {
  const [location] = useLocation();
  const { user, logout, isAdmin } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const navLinks = [
    { name: "Latest", href: "/" },
    { name: "Launches", href: "/launches" },
    { name: "Mission\u00A0Control", href: "/missioncontrol" },
    { name: "Gallery", href: "/gallery" },
    { name: "Jobs", href: "/jobs" },
    { name: "Advertise", href: "/advertise" },
  ];

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <header className="sticky top-0 z-50 bg-[#0D0D17] border-b border-purple-700/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center space-x-6">
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
                className="block md:hidden h-auto w-auto max-h-12 max-w-[48px] object-contain" 
              />
            </Link>
            
            <nav className="hidden md:flex items-center space-x-6">
              {navLinks.map((link) => (
                <Link 
                  key={link.name} 
                  href={link.href}
                  className={`text-sm font-medium transition whitespace-nowrap ${
                    isActive(link.href) 
                      ? "text-purple-500" 
                      : "text-white/90 hover:text-purple-500"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Search Icon Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSearchOpen(true)}
              className="text-white/90 hover:text-purple-500"
            >
              <Search className="h-5 w-5" />
            </Button>
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-full">
                    <Avatar className="h-9 w-9 border border-purple-700/40">
                      <AvatarImage src={user.profilePicture} alt={user.username} />
                      <AvatarFallback className="bg-purple-900 text-white">{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.username}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                      {user.membershipTier !== "free" && (
                        <p className="text-xs font-medium text-purple-500 mt-1">
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
                <Button asChild className="bg-purple-800 hover:bg-purple-700 text-white">
                  <Link href="/login">Sign In</Link>
                </Button>
              </div>
            )}
            
            <div className="block md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-white">
                    <MenuIcon className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="bg-[#14141E] border-l border-purple-900/30 max-w-[300px]">
                  <div className="py-6">
                    <div className="flex items-center mb-6">
                      <img 
                        src={mobileLogo} 
                        alt="Proxima Report" 
                        className="h-auto w-auto max-h-14 max-w-[56px] object-contain" 
                      />
                      <img 
                        src={desktopLogo} 
                        alt="Proxima Report" 
                        className="ml-3 h-auto w-auto max-h-4 max-w-[120px] object-contain" 
                      />
                    </div>
                    
                    <nav className="flex flex-col space-y-4">
                      {navLinks.map((link) => (
                        <Link 
                          key={link.name} 
                          href={link.href}
                          className={`text-base font-medium transition ${
                            isActive(link.href) 
                              ? "text-purple-500" 
                              : "text-white/90 hover:text-purple-500"
                          }`}
                        >
                          {link.name}
                        </Link>
                      ))}
                    </nav>
                    
                    <div className="mt-8 pt-4 border-t border-white/10">
                      {!user && (
                        <div className="space-y-3">
                          <Button asChild className="w-full bg-purple-800 hover:bg-purple-700 text-white">
                            <Link href="/login">Sign In</Link>
                          </Button>
                          <Button asChild variant="outline" className="w-full">
                            <Link href="/register">Register</Link>
                          </Button>
                        </div>
                      )}
                      
                      {user && user.membershipTier === "free" && (
                        <Button asChild className="w-full bg-purple-800 hover:bg-purple-700 text-white">
                          <Link href="/subscribe">Upgrade Membership</Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
      
      {/* Search Popup */}
      <SearchPopup isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </header>
  );
}

export default Header;