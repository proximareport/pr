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
import { RocketIcon, MenuIcon, SearchIcon, LogOutIcon, UserIcon, SettingsIcon, ShieldIcon } from "lucide-react";

function Header() {
  const [location] = useLocation();
  const { user, logout, isAdmin } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const navLinks = [
    { name: "Latest", href: "/" },
    { name: "Launches", href: "/launches" },
    { name: "Astronomy", href: "/astronomy" },
    { name: "Science", href: "/science" },
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
              <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center">
                <RocketIcon className="h-6 w-6 text-white transform -rotate-45" />
              </div>
              <span className="ml-2 text-xl font-space font-bold tracking-wider text-white">
                PROXIMA<span className="text-purple-500">REPORT</span>
              </span>
            </Link>
            
            <nav className="hidden md:flex items-center space-x-6">
              {navLinks.map((link) => (
                <Link 
                  key={link.name} 
                  href={link.href}
                  className={`text-sm font-medium transition ${
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
            <button 
              className="text-white/90 hover:text-purple-500 transition"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <SearchIcon className="h-5 w-5" />
            </button>
            
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
                      <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center">
                        <RocketIcon className="h-6 w-6 text-white transform -rotate-45" />
                      </div>
                      <span className="ml-2 text-xl font-space font-bold tracking-wider text-white">
                        PROXIMA<span className="text-purple-500">REPORT</span>
                      </span>
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
      
      {/* Search Modal would go here */}
    </header>
  );
}

export default Header;
