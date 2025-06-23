import React, { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface TelemetryData {
  label: string;
  value: string;
  unit?: string;
  status: 'normal' | 'warning' | 'critical';
}

export const MissionControlSidebar: React.FC = () => {
  const { currentTheme } = useTheme();
  const [telemetryData, setTelemetryData] = useState<TelemetryData[]>([]);
  const [missionTime, setMissionTime] = useState('00:00:00');

  // Generate fake telemetry data
  useEffect(() => {
    const generateTelemetryData = (): TelemetryData[] => [
      {
        label: 'OXYGEN LEVEL',
        value: (95 + Math.random() * 5).toFixed(1),
        unit: '%',
        status: 'normal'
      },
      {
        label: 'CO2 SCRUBBERS',
        value: (85 + Math.random() * 15).toFixed(1),
        unit: '%',
        status: 'normal'
      },
      {
        label: 'ELECTRICAL POWER',
        value: (98 + Math.random() * 2).toFixed(1),
        unit: '%',
        status: 'normal'
      },
      {
        label: 'COMMUNICATIONS',
        value: 'NOMINAL',
        status: 'normal'
      },
      {
        label: 'NAVIGATION',
        value: 'ACTIVE',
        status: 'normal'
      },
      {
        label: 'LIFE SUPPORT',
        value: 'GREEN',
        status: 'normal'
      },
      {
        label: 'FUEL CELLS',
        value: (92 + Math.random() * 8).toFixed(1),
        unit: '%',
        status: 'normal'
      },
      {
        label: 'COOLANT TEMP',
        value: (65 + Math.random() * 10).toFixed(1),
        unit: '°F',
        status: 'normal'
      },
      {
        label: 'HULL INTEGRITY',
        value: '100.0',
        unit: '%',
        status: 'normal'
      },
      {
        label: 'RADIATION SHIELD',
        value: (97 + Math.random() * 3).toFixed(1),
        unit: '%',
        status: 'normal'
      }
    ];

    setTelemetryData(generateTelemetryData());

    // Update telemetry every 5 seconds
    const interval = setInterval(() => {
      setTelemetryData(generateTelemetryData());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Update mission time
  useEffect(() => {
    const startTime = Date.now();
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const hours = Math.floor(elapsed / 3600000);
      const minutes = Math.floor((elapsed % 3600000) / 60000);
      const seconds = Math.floor((elapsed % 60000) / 1000);
      
      setMissionTime(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Only show for Apollo theme
  if (currentTheme?.name !== 'apollo') {
    return null;
  }

  return (
    <div className="mission-control-sidebar">
      <h3>MISSION CONTROL</h3>
      
      <div className="telemetry-data">
        <div className="telemetry-item">
          <span className="telemetry-label">MISSION TIME</span>
          <span className="telemetry-value">{missionTime}</span>
        </div>
        <div className="telemetry-item">
          <span className="telemetry-label">MISSION STATUS</span>
          <span className="telemetry-value">NOMINAL</span>
        </div>
        <div className="telemetry-item">
          <span className="telemetry-label">CREW STATUS</span>
          <span className="telemetry-value">ALL GREEN</span>
        </div>
      </div>

      <h3>SYSTEMS TELEMETRY</h3>
      
      <div className="telemetry-data">
        {telemetryData.map((item, index) => (
          <div key={index} className="telemetry-item">
            <span className="telemetry-label">{item.label}</span>
            <span className="telemetry-value">
              {item.value}{item.unit}
            </span>
          </div>
        ))}
      </div>

      <h3>MISSION LOG</h3>
      
      <div className="telemetry-data">
        <div className="telemetry-item">
          <span className="telemetry-label">T+{missionTime}</span>
          <span className="telemetry-value">ALL SYSTEMS NOMINAL</span>
        </div>
        <div className="telemetry-item">
          <span className="telemetry-label">T+{missionTime}</span>
          <span className="telemetry-value">NAVIGATION LOCKED</span>
        </div>
        <div className="telemetry-item">
          <span className="telemetry-label">T+{missionTime}</span>
          <span className="telemetry-value">COMMUNICATIONS ACTIVE</span>
        </div>
      </div>

      <h3>CLASSIFIED</h3>
      
      <div className="telemetry-data">
        <div className="telemetry-item">
          <span className="telemetry-label">CLEARANCE</span>
          <span className="telemetry-value">LEVEL 1</span>
        </div>
        <div className="telemetry-item">
          <span className="telemetry-label">STATUS</span>
          <span className="telemetry-value">RESTRICTED</span>
        </div>
      </div>
    </div>
  );
}; 