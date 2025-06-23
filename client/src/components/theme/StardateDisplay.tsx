import React, { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

export const StardateDisplay: React.FC = () => {
  const { currentTheme } = useTheme();
  const [stardate, setStardate] = useState('');

  // Calculate Star Trek stardate
  useEffect(() => {
    const calculateStardate = () => {
      const now = new Date();
      const year = now.getFullYear();
      const dayOfYear = Math.floor((now.getTime() - new Date(year, 0, 0).getTime()) / (1000 * 60 * 60 * 24));
      
      // Star Trek stardate formula (simplified)
      // Format: YYYY.DDD (Year.DayOfYear)
      const stardateValue = `${year}.${dayOfYear.toString().padStart(3, '0')}`;
      setStardate(stardateValue);
    };

    calculateStardate();
    
    // Update every minute
    const interval = setInterval(calculateStardate, 60000);
    
    return () => clearInterval(interval);
  }, []);

  // Only show for LCARS theme
  if (currentTheme?.name !== 'lcars') {
    return null;
  }

  return (
    <div className="stardate">
      <div className="text-sm font-bold">STARDATE</div>
      <div className="text-lg">{stardate}</div>
    </div>
  );
}; 