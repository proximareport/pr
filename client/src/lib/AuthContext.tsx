import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  membershipTier: string;
  profilePicture?: string;
  bio?: string;
  themePreference?: string;
  profileCustomization?: {
    color?: string;
    backgroundColor?: string;
    animatedBackground?: boolean;
    [key: string]: any;
  };
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  login: (userData: { email: string; password: string } | any) => Promise<void>;
  register: (userData: { username: string; email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  refetch: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current user data
  const { data: userData, isLoading, refetch } = useQuery({
    queryKey: ['/api/me'],
    queryFn: () => 
      apiRequest('GET', '/api/me')
        .then((res: Response) => res.json())
        .catch((err: any) => {
          // If user is not logged in, return null without showing error
          if (err.message.includes('401')) {
            return null;
          }
          throw err;
        }),
    // Don't retry on 401 errors
    retry: (failureCount, error: any) => {
      return !error?.message?.includes('401') && failureCount < 3;
    },
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: (credentials: { email?: string; username?: string; password: string }) =>
      apiRequest('POST', '/api/login', credentials).then((res: Response) => res.json()),
    onSuccess: () => {
      refetch();
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: (userData: { username: string; email: string; password: string }) =>
      apiRequest('POST', '/api/register', userData).then((res: Response) => res.json()),
    onSuccess: () => {
      refetch();
      toast({
        title: "Registration successful",
        description: "Your account has been created.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Registration failed",
        description: error.message || "Could not create your account",
        variant: "destructive",
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/logout').then((res: Response) => res.json()),
    onSuccess: () => {
      setUser(null);
      queryClient.clear();
      toast({
        title: "Logged out",
        description: "You have been logged out successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Logout failed",
        description: error.message || "Could not log you out",
        variant: "destructive",
      });
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: (userData: Partial<User>) =>
      apiRequest('PUT', '/api/me', userData).then((res: Response) => res.json()),
    onSuccess: () => {
      refetch();
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Could not update your profile",
        variant: "destructive",
      });
    },
  });

  // Update user data when userData changes
  useEffect(() => {
    if (userData) {
      setUser(userData);
    } else {
      setUser(null);
    }
  }, [userData]);

  // Login function
  const login = async (userData: any) => {
    // If the user is already logged in from API call, just set the user state
    if (userData && userData.id) {
      setUser(userData);
      return;
    }
    
    // Create credentials object
    const credentials: { email?: string; username?: string; password: string } = {
      password: userData.password
    };
    
    // Add email or username based on what was provided
    if (userData.email) {
      credentials.email = userData.email;
    }
    
    if (userData.username) {
      credentials.username = userData.username;
    }
    
    // Call login mutation with credentials
    if (typeof userData === 'object' && (userData.email || userData.username) && userData.password) {
      await loginMutation.mutateAsync(credentials);
    }
  };

  // Register function
  const register = async (userData: { username: string; email: string; password: string }) => {
    await registerMutation.mutateAsync(userData);
  };

  // Logout function
  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  // Update user function
  const updateUser = async (data: Partial<User>) => {
    await updateUserMutation.mutateAsync(data);
  };

  // Check if user is admin
  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        isLoading,
        isAdmin,
        login,
        register,
        logout,
        updateUser,
        refetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}