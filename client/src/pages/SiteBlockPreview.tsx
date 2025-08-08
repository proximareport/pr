import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import SiteBlock from '@/components/SiteBlock';

export default function SiteBlockPreview() {
  const { data: siteBlock, isLoading } = useQuery({
    queryKey: ['site-block'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/site-block');
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!siteBlock) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">No site block configuration found.</p>
      </div>
    );
  }

  return <SiteBlock siteBlock={siteBlock} />;
}
