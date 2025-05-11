import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from './queryClient';
import { useToast } from '@/hooks/use-toast';

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();

  // Fetch current user data
  const { data: userData, isLoading, refetch } = useQuery({
    queryKey: ['/api/me'],
    queryFn: () => 
      apiRequest('GET', '/api/me')
        .then(res => res.json())
        .catch(err => {
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
    mutationFn: (credentials: { email: string; password: string }) =>
      apiRequest('POST', '/api/login', credentials).then(res => res.json()),
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
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: (userData: { username: string; email: string; password: string }) =>
      apiRequest('POST', '/api/register', userData).then(res => res.json()),
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
    mutationFn: () => apiRequest('POST', '/api/logout').then(res => res.json()),
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
      apiRequest('PUT', '/api/me', userData).then(res => res.json()),
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
    // Otherwise, call login mutation with email and password
    if (typeof userData === 'object' && userData.email && userData.password) {
      await loginMutation.mutateAsync({ 
        email: userData.email, 
        password: userData.password 
      });
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