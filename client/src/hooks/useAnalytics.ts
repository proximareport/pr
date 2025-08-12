import { useState, useEffect } from 'react';
import { analyticsTracker } from '@/lib/analytics';

export const useAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState(analyticsTracker.getAnalyticsData());
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const refreshData = () => {
    setAnalyticsData(analyticsTracker.getAnalyticsData());
    setLastUpdated(new Date());
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(refreshData, 30000);
    return () => clearInterval(interval);
  }, []);

  return {
    analyticsData,
    lastUpdated,
    refreshData
  };
};
