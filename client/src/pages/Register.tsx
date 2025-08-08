import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, EyeIcon, EyeOffIcon, UserIcon, MailIcon, LockIcon, CheckIcon } from "lucide-react";

// Import logo image
import mobileLogo from "../assets/images/proxima-logo-mobile.png";
import { apiRequest } from "@/lib/queryClient";
import ModernButton from "@/components/ui/modern-button";

function Register() {
  const [, navigate] = useLocation();
  const { register: registerUser, login } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
    if (password.match(/\d/)) strength++;
    if (password.match(/[^a-zA-Z\d]/)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(password);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!username.trim()) {
      newErrors.username = "Username is required";
    } else if (username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      newErrors.username = "Username can only contain letters, numbers, and underscores";
    }
    
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid";
    }
    
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
    
    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      await registerUser({ 
        username, 
        email, 
        password
      });
      
      toast({
        title: "Registration successful!",
        description: "Your account has been created. Welcome to Proxima Report!",
      });
      
      navigate("/");
    } catch (error) {
      toast({
        title: "Registration failed",
        description: "This email or username may already be in use. Please try another.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStrengthColor = (strength: number) => {
    if (strength <= 1) return "bg-red-500";
    if (strength === 2) return "bg-yellow-500";
    if (strength === 3) return "bg-blue-500";
    return "bg-green-500";
  };

  const getStrengthText = (strength: number) => {
    if (strength <= 1) return "Weak";
    if (strength === 2) return "Fair";
    if (strength === 3) return "Good";
    return "Strong";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950/60 to-black flex items-center justify-center py-12 px-4 relative overflow-hidden">
      {/* Enhanced dark purple background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-purple-900/20 via-violet-900/20 to-purple-800/20"></div>
        <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-r from-purple-600/20 to-violet-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-gradient-to-r from-purple-700/20 to-pink-700/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 right-10 w-24 h-24 bg-gradient-to-r from-violet-600/15 to-purple-600/15 rounded-full blur-2xl animate-bounce"></div>
        <div className="absolute inset-0 bg-black/30"></div>
      </div>
      
      <div className="relative z-10 w-full max-w-md">
        <Card className="border border-purple-900/40 bg-gray-950/80 backdrop-blur-2xl shadow-2xl shadow-purple-500/10 rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-transparent to-violet-900/10"></div>
          
          <CardHeader className="relative space-y-1 text-center pt-8 pb-2">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-700 flex items-center justify-center shadow-lg shadow-purple-500/25 overflow-hidden">
                  <img 
                    src={mobileLogo} 
                    alt="Proxima Report" 
                    className="h-10 w-10 object-contain" 
                  />
                </div>
                <div className="absolute -inset-1 bg-gradient-to-br from-purple-500 to-violet-700 rounded-2xl opacity-30 blur-sm"></div>
                <div className="absolute inset-0 w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-700 opacity-20 animate-ping"></div>
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-white tracking-tight">
              Join <span className="text-purple-400">Proxima</span>
            </CardTitle>
            <CardDescription className="text-gray-400 text-base">
              Create your account and explore the cosmos
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6 px-6">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-gray-300 font-medium">Username</Label>
                <div className="relative">
                  <Input
                    id="username"
                    placeholder="Choose a username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={`bg-gray-900/50 border-gray-800/50 text-white placeholder:text-gray-500 focus:border-purple-400 focus:ring-purple-400/20 transition-all duration-300 rounded-xl h-12 pl-4 pr-4 ${errors.username ? "border-red-500 focus:border-red-500" : ""}`}
                  />
                  <UserIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
                {errors.username && (
                  <p className="text-red-400 text-sm mt-1 flex items-center space-x-1">
                    <span>⚠️</span><span>{errors.username}</span>
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300 font-medium">Email Address</Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="your-email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`bg-gray-900/50 border-gray-800/50 text-white placeholder:text-gray-500 focus:border-purple-400 focus:ring-purple-400/20 transition-all duration-300 rounded-xl h-12 pl-4 pr-4 ${errors.email ? "border-red-500 focus:border-red-500" : ""}`}
                  />
                  <MailIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
                {errors.email && (
                  <p className="text-red-400 text-sm mt-1 flex items-center space-x-1">
                    <span>⚠️</span><span>{errors.email}</span>
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300 font-medium">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`bg-gray-900/50 border-gray-800/50 text-white placeholder:text-gray-500 focus:border-purple-400 focus:ring-purple-400/20 transition-all duration-300 rounded-xl h-12 pl-4 pr-12 ${errors.password ? "border-red-500 focus:border-red-500" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-purple-400 transition-colors duration-300"
                  >
                    {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
                {password && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400">Password strength:</span>
                      <span className={`text-xs font-medium ${passwordStrength <= 1 ? 'text-red-400' : passwordStrength === 2 ? 'text-yellow-400' : passwordStrength === 3 ? 'text-blue-400' : 'text-green-400'}`}>
                        {getStrengthText(passwordStrength)}
                      </span>
                    </div>
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                            level <= passwordStrength ? getStrengthColor(passwordStrength) : 'bg-gray-700'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {errors.password && (
                  <p className="text-red-400 text-sm mt-1 flex items-center space-x-1">
                    <span>⚠️</span><span>{errors.password}</span>
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-300 font-medium">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`bg-gray-900/50 border-gray-800/50 text-white placeholder:text-gray-500 focus:border-purple-400 focus:ring-purple-400/20 transition-all duration-300 rounded-xl h-12 pl-4 pr-12 ${errors.confirmPassword ? "border-red-500 focus:border-red-500" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-purple-400 transition-colors duration-300"
                  >
                    {showConfirmPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                  {confirmPassword && password === confirmPassword && (
                    <CheckIcon className="absolute right-10 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-400" />
                  )}
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-400 text-sm mt-1 flex items-center space-x-1">
                    <span>⚠️</span><span>{errors.confirmPassword}</span>
                  </p>
                )}
              </div>
              
              <div className="text-sm text-gray-400 bg-gray-900/30 rounded-xl p-4 border border-gray-800/50">
                By registering, you agree to our{" "}
                <Link href="/terms" className="text-purple-400 hover:text-purple-300 transition-colors duration-300 underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-purple-400 hover:text-purple-300 transition-colors duration-300 underline">
                  Privacy Policy
                </Link>
                .
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col px-6 pb-8 pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-gradient-to-r from-purple-600 to-violet-700 hover:from-purple-700 hover:to-violet-800 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2 shadow-lg shadow-purple-500/25"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                  </>
                )}
              </button>
              
              <div className="mt-6 text-center">
                <p className="text-gray-400 text-sm">
                  Already have an account?{" "}
                  <Link href="/login" className="text-purple-400 hover:text-purple-300 transition-colors duration-300 font-semibold">
                    Sign in here
                  </Link>
                </p>
              </div>
            </CardFooter>
          </form>
        </Card>
        
        {/* Additional decorative elements */}
        <div className="absolute -z-10 top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-purple-600/10 to-violet-600/10 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
}

export default Register;
