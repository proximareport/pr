import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['/api/me'],
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error
  };
}