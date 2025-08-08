import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  PlayIcon, 
  PauseIcon, 
  RotateCcwIcon, 
  EyeIcon, 
  EyeOffIcon,
  TrashIcon,
  MapPinIcon,
  SatelliteIcon,
  GlobeIcon,
  SettingsIcon,
  UploadIcon,
  StarIcon,
  PlusIcon,
  ClockIcon,
  TargetIcon
} from 'lucide-react';

interface TLEData {
  name: string;
  line1: string;
  line2: string;
  constellation?: string;
  color?: string;
}

interface GroundStation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  altitude: number;
  visible: boolean;
}

interface Satellite {
  id: string;
  name: string;
  tle: TLEData;
  visible: boolean;
  constellation?: string;
  color: string;
  // Realistic orbital parameters
  inclination: number;
  altitude: number;
  period: number;
  currentAngle: number;
  latitude: number;
  longitude: number;
}

interface Constellation {
  name: string;
  color: string;
  satellites: string[];
  visible: boolean;
}

const SatelliteVisualizer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  // State management
  const [isPlaying, setIsPlaying] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState(1);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showGroundStations, setShowGroundStations] = useState(true);
  const [showOrbits, setShowOrbits] = useState(true);
  const [tleInput, setTleInput] = useState('');
  const [satellites, setSatellites] = useState<Satellite[]>([]);
  const [groundStations, setGroundStations] = useState<GroundStation[]>([]);
  const [constellations, setConstellations] = useState<Constellation[]>([]);
  const [selectedSatellite, setSelectedSatellite] = useState<string | null>(null);
  const [newGroundStation, setNewGroundStation] = useState({
    name: '',
    latitude: 0,
    longitude: 0,
    altitude: 0
  });

  // Sample satellites with realistic orbital parameters
  const sampleSatellites: Satellite[] = [
    {
      id: 'iss',
      name: 'ISS (ZARYA)',
      tle: { name: 'ISS', line1: '', line2: '' },
      visible: true,
      constellation: 'ISS',
      color: '#00ff00',
      inclination: 51.6,
      altitude: 408,
      period: 92.7,
      currentAngle: 0,
      latitude: 0,
      longitude: 0
    },
    {
      id: 'starlink-1',
      name: 'STARLINK-1234',
      tle: { name: 'STARLINK', line1: '', line2: '' },
      visible: true,
      constellation: 'Starlink',
      color: '#ff4444',
      inclination: 53.0,
      altitude: 550,
      period: 95.0,
      currentAngle: 45,
      latitude: 0,
      longitude: 0
    },
    {
      id: 'gps-1',
      name: 'GPS IIR-11',
      tle: { name: 'GPS', line1: '', line2: '' },
      visible: true,
      constellation: 'GPS',
      color: '#4444ff',
      inclination: 55.0,
      altitude: 20200,
      period: 718.0,
      currentAngle: 90,
      latitude: 0,
      longitude: 0
    },
    {
      id: 'hst',
      name: 'Hubble Space Telescope',
      tle: { name: 'HST', line1: '', line2: '' },
      visible: true,
      constellation: 'Hubble',
      color: '#ffff44',
      inclination: 28.5,
      altitude: 547,
      period: 95.4,
      currentAngle: 180,
      latitude: 0,
      longitude: 0
    }
  ];

  // Initialize sample data
  useEffect(() => {
    // Sample ground stations
    const sampleStations: GroundStation[] = [
      {
        id: 'kennedy',
        name: 'Kennedy Space Center',
        latitude: 28.5729,
        longitude: -80.6490,
        altitude: 0,
        visible: true
      },
      {
        id: 'baikonur',
        name: 'Baikonur Cosmodrome',
        latitude: 45.9646,
        longitude: 63.3052,
        altitude: 0,
        visible: true
      },
      {
        id: 'jiuquan',
        name: 'Jiuquan Satellite Launch Center',
        latitude: 40.9583,
        longitude: 100.2917,
        altitude: 0,
        visible: true
      },
      {
        id: 'vandenberg',
        name: 'Vandenberg Space Force Base',
        latitude: 34.6321,
        longitude: -120.6106,
        altitude: 0,
        visible: true
      }
    ];
    setGroundStations(sampleStations);

    // Sample constellations
    const sampleConstellations: Constellation[] = [
      { name: 'ISS', color: '#00ff00', satellites: ['iss'], visible: true },
      { name: 'Starlink', color: '#ff4444', satellites: ['starlink-1'], visible: true },
      { name: 'GPS', color: '#4444ff', satellites: ['gps-1'], visible: true },
      { name: 'Hubble', color: '#ffff44', satellites: ['hst'], visible: true }
    ];
    setConstellations(sampleConstellations);

    setSatellites(sampleSatellites);
  }, []);

  // Calculate satellite position based on orbital parameters
  const calculateSatellitePosition = useCallback((satellite: Satellite, time: Date): { lat: number; lon: number } => {
    const earthRadius = 6371; // km
    const totalRadius = earthRadius + satellite.altitude;
    
    // Calculate current position based on orbital period and current angle
    const timeElapsed = time.getTime() / 1000; // seconds
    const angularVelocity = (2 * Math.PI) / (satellite.period * 60); // radians per second
    const currentAngle = satellite.currentAngle + (angularVelocity * timeElapsed * simulationSpeed);
    
    // Convert to latitude and longitude
    const inclinationRad = (satellite.inclination * Math.PI) / 180;
    const angleRad = currentAngle * Math.PI / 180;
    
    // Calculate latitude (simplified)
    const lat = Math.asin(Math.sin(inclinationRad) * Math.sin(angleRad)) * 180 / Math.PI;
    
    // Calculate longitude (simplified)
    const lon = (angleRad * 180 / Math.PI) % 360;
    
    return { lat, lon };
  }, [simulationSpeed]);

  // Professional 2D visualization
  const drawMap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 80;

    // Clear canvas with gradient background
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 2);
    gradient.addColorStop(0, '#001122');
    gradient.addColorStop(1, '#000011');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Earth
    ctx.strokeStyle = '#0077be';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.stroke();

    // Draw Earth fill
    ctx.fillStyle = '#0077be';
    ctx.globalAlpha = 0.2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Draw continents (simplified but recognizable)
    ctx.fillStyle = '#0077be';
    ctx.globalAlpha = 0.4;
    
    // North America
    ctx.beginPath();
    ctx.ellipse(centerX - radius * 0.3, centerY - radius * 0.1, radius * 0.2, radius * 0.15, 0, 0, 2 * Math.PI);
    ctx.fill();
    
    // Europe/Asia
    ctx.beginPath();
    ctx.ellipse(centerX + radius * 0.2, centerY - radius * 0.05, radius * 0.25, radius * 0.2, 0, 0, 2 * Math.PI);
    ctx.fill();
    
    // Africa
    ctx.beginPath();
    ctx.ellipse(centerX + radius * 0.1, centerY + radius * 0.2, radius * 0.15, radius * 0.25, 0, 0, 2 * Math.PI);
    ctx.fill();
    
    // South America
    ctx.beginPath();
    ctx.ellipse(centerX - radius * 0.25, centerY + radius * 0.3, radius * 0.1, radius * 0.2, 0, 0, 2 * Math.PI);
    ctx.fill();

    ctx.globalAlpha = 1;

    // Draw grid lines
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = 0.3;

    // Longitude lines
    for (let i = 0; i < 12; i++) {
      const angle = (i * 30 - 180) * Math.PI / 180;
      ctx.beginPath();
      ctx.moveTo(centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius);
      ctx.lineTo(centerX - Math.cos(angle) * radius, centerY - Math.sin(angle) * radius);
      ctx.stroke();
    }

    // Latitude lines
    for (let i = 1; i < 6; i++) {
      const lat = (i * 30 - 90) * Math.PI / 180;
      const y = centerY - Math.sin(lat) * radius * 0.5;
      const width = Math.cos(lat) * radius;
      
      ctx.beginPath();
      ctx.moveTo(centerX - width, y);
      ctx.lineTo(centerX + width, y);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;

    // Draw satellite orbits
    if (showOrbits) {
      satellites.forEach((satellite) => {
        if (!satellite.visible) return;

        const orbitRadius = radius + (satellite.altitude / 50);
        
        // Draw orbit path
        ctx.strokeStyle = satellite.color;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(centerX, centerY, orbitRadius, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.globalAlpha = 1;
      });
    }

    // Draw ground stations
    if (showGroundStations) {
      groundStations.forEach((station) => {
        if (!station.visible) return;

        const x = centerX + (station.longitude / 180) * radius;
        const y = centerY - (station.latitude / 90) * radius * 0.5;

        // Station marker (cone shape)
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.moveTo(x, y - 8);
        ctx.lineTo(x - 4, y + 4);
        ctx.lineTo(x + 4, y + 4);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Station label
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(station.name, x, y - 15);
      });
    }

    // Draw satellites
    satellites.forEach((satellite) => {
      if (!satellite.visible) return;

      const position = calculateSatellitePosition(satellite, currentTime);
      const x = centerX + (position.lon / 180) * radius;
      const y = centerY - (position.lat / 90) * radius * 0.5;

      // Satellite marker
      ctx.fillStyle = satellite.color;
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Satellite label
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 9px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(satellite.name, x + 10, y + 3);

      // Altitude indicator
      ctx.fillStyle = satellite.color;
      ctx.globalAlpha = 0.5;
      ctx.font = '8px Arial';
      ctx.fillText(`${satellite.altitude}km`, x + 10, y + 15);
      ctx.globalAlpha = 1;
    });

    // Draw legend
    const legendX = 20;
    const legendY = 20;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(legendX - 10, legendY - 10, 200, 120);
    
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Satellite Types:', legendX, legendY);
    
    const legendItems = [
      { color: '#00ff00', name: 'ISS' },
      { color: '#ff4444', name: 'Starlink' },
      { color: '#4444ff', name: 'GPS' },
      { color: '#ffff44', name: 'Hubble' }
    ];
    
    legendItems.forEach((item, index) => {
      ctx.fillStyle = item.color;
      ctx.beginPath();
      ctx.arc(legendX + 10, legendY + 25 + index * 20, 4, 0, 2 * Math.PI);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '10px Arial';
      ctx.fillText(item.name, legendX + 20, legendY + 30 + index * 20);
    });
  }, [satellites, groundStations, showGroundStations, showOrbits, currentTime, calculateSatellitePosition]);

  // Animation loop
  useEffect(() => {
    const animate = () => {
      if (isPlaying) {
        const newTime = new Date(currentTime.getTime() + simulationSpeed * 60000);
        setCurrentTime(newTime);
      }
      
      drawMap();
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, simulationSpeed, currentTime, drawMap]);

  // Parse TLE input
  const parseTLEInput = () => {
    const lines = tleInput.trim().split('\n');
    const newSatellites: Satellite[] = [];

    for (let i = 0; i < lines.length; i += 3) {
      if (i + 2 < lines.length) {
        const name = lines[i].trim();
        const line1 = lines[i + 1].trim();
        const line2 = lines[i + 2].trim();

        if (name && line1 && line2) {
          const newSatellite: Satellite = {
            id: `sat-${Date.now()}-${i}`,
            name,
            tle: { name, line1, line2 },
            visible: true,
            color: '#ffffff',
            inclination: 45 + Math.random() * 30,
            altitude: 400 + Math.random() * 2000,
            period: 90 + Math.random() * 60,
            currentAngle: Math.random() * 360,
            latitude: 0,
            longitude: 0
          };
          newSatellites.push(newSatellite);
        }
      }
    }

    if (newSatellites.length > 0) {
      setSatellites(prev => [...prev, ...newSatellites]);
      setTleInput('');
    }
  };

  // Add ground station
  const addGroundStation = () => {
    if (!newGroundStation.name) return;

    const station: GroundStation = {
      id: `station-${Date.now()}`,
      name: newGroundStation.name,
      latitude: newGroundStation.latitude,
      longitude: newGroundStation.longitude,
      altitude: newGroundStation.altitude,
      visible: true
    };

    setGroundStations(prev => [...prev, station]);
    setNewGroundStation({ name: '', latitude: 0, longitude: 0, altitude: 0 });
  };

  // Remove satellite
  const removeSatellite = (id: string) => {
    setSatellites(prev => prev.filter(sat => sat.id !== id));
  };

  // Remove ground station
  const removeGroundStation = (id: string) => {
    setGroundStations(prev => prev.filter(station => station.id !== id));
  };

  // Toggle satellite visibility
  const toggleSatelliteVisibility = (id: string) => {
    setSatellites(prev => prev.map(sat => 
      sat.id === id ? { ...sat, visible: !sat.visible } : sat
    ));
  };

  // Toggle ground station visibility
  const toggleGroundStationVisibility = (id: string) => {
    setGroundStations(prev => prev.map(station => 
      station.id === id ? { ...station, visible: !station.visible } : station
    ));
  };

  return (
    <div className="h-full flex">
      {/* 2D Visualization */}
      <div className="flex-1 relative bg-gray-900">
        <canvas 
          ref={canvasRef} 
          className="w-full h-full"
        />
        
        {/* Controls overlay */}
        <div className="absolute top-4 left-4 bg-gray-900/90 backdrop-blur-sm rounded-lg p-4 space-y-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2 bg-purple-600 hover:bg-purple-700 rounded text-white transition-colors"
            >
              {isPlaying ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
            </button>
            <button
              onClick={() => setCurrentTime(new Date())}
              className="p-2 bg-gray-600 hover:bg-gray-700 rounded text-white transition-colors"
            >
              <RotateCcwIcon className="h-4 w-4" />
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            <ClockIcon className="h-4 w-4 text-gray-300" />
            <label className="text-white text-xs">Speed:</label>
            <input
              type="range"
              min="0.1"
              max="10"
              step="0.1"
              value={simulationSpeed}
              onChange={(e) => setSimulationSpeed(parseFloat(e.target.value))}
              className="w-20"
            />
            <span className="text-white text-xs font-mono">{simulationSpeed}x</span>
          </div>

          <div className="text-white text-xs font-mono bg-gray-800 px-2 py-1 rounded">
            {currentTime.toLocaleString()}
          </div>
        </div>

        {/* Toggle controls */}
        <div className="absolute top-4 right-4 bg-gray-900/90 backdrop-blur-sm rounded-lg p-3 space-y-2">
          <button
            onClick={() => setShowOrbits(!showOrbits)}
            className={`flex items-center space-x-2 px-3 py-1 rounded text-xs transition-colors ${
              showOrbits ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300'
            }`}
          >
            {showOrbits ? <EyeIcon className="h-3 w-3" /> : <EyeOffIcon className="h-3 w-3" />}
            Orbits
          </button>
          
          <button
            onClick={() => setShowGroundStations(!showGroundStations)}
            className={`flex items-center space-x-2 px-3 py-1 rounded text-xs transition-colors ${
              showGroundStations ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'
            }`}
          >
            {showGroundStations ? <EyeIcon className="h-3 w-3" /> : <EyeOffIcon className="h-3 w-3" />}
            Stations
          </button>
        </div>
      </div>

      {/* Control Panel */}
      <div className="w-80 bg-gray-900 border-l border-gray-700 overflow-y-auto">
        <div className="p-4 space-y-6">
          {/* TLE Input */}
          <div>
            <h3 className="text-white font-semibold mb-2 flex items-center">
              <UploadIcon className="h-4 w-4 mr-2" />
              Add TLE Data
            </h3>
            <textarea
              value={tleInput}
              onChange={(e) => setTleInput(e.target.value)}
              placeholder="Paste TLE data here (name, line1, line2)..."
              className="w-full h-32 bg-gray-800 text-white text-xs p-2 rounded border border-gray-600 resize-none"
            />
            <button
              onClick={parseTLEInput}
              className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded text-sm transition-colors"
            >
              Add Satellites
            </button>
          </div>

          {/* Ground Station Input */}
          <div>
            <h3 className="text-white font-semibold mb-2 flex items-center">
              <MapPinIcon className="h-4 w-4 mr-2" />
              Add Ground Station
            </h3>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Station Name"
                value={newGroundStation.name}
                onChange={(e) => setNewGroundStation(prev => ({ ...prev, name: e.target.value }))}
                className="w-full bg-gray-800 text-white text-xs p-2 rounded border border-gray-600"
              />
              <input
                type="number"
                placeholder="Latitude"
                value={newGroundStation.latitude}
                onChange={(e) => setNewGroundStation(prev => ({ ...prev, latitude: parseFloat(e.target.value) }))}
                className="w-full bg-gray-800 text-white text-xs p-2 rounded border border-gray-600"
              />
              <input
                type="number"
                placeholder="Longitude"
                value={newGroundStation.longitude}
                onChange={(e) => setNewGroundStation(prev => ({ ...prev, longitude: parseFloat(e.target.value) }))}
                className="w-full bg-gray-800 text-white text-xs p-2 rounded border border-gray-600"
              />
              <input
                type="number"
                placeholder="Altitude (m)"
                value={newGroundStation.altitude}
                onChange={(e) => setNewGroundStation(prev => ({ ...prev, altitude: parseFloat(e.target.value) }))}
                className="w-full bg-gray-800 text-white text-xs p-2 rounded border border-gray-600"
              />
              <button
                onClick={addGroundStation}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded text-sm transition-colors"
              >
                Add Station
              </button>
            </div>
          </div>

          {/* Satellites List */}
          <div>
            <h3 className="text-white font-semibold mb-2 flex items-center">
              <SatelliteIcon className="h-4 w-4 mr-2" />
              Satellites ({satellites.length})
            </h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {satellites.map((satellite) => (
                <div key={satellite.id} className="bg-gray-800 p-2 rounded border border-gray-600">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleSatelliteVisibility(satellite.id)}
                        className={`w-3 h-3 rounded-full ${satellite.visible ? 'bg-green-400' : 'bg-gray-400'}`}
                      />
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: satellite.color }}
                      />
                      <span className="text-white text-xs">{satellite.name}</span>
                    </div>
                    <button
                      onClick={() => removeSatellite(satellite.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <TrashIcon className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="text-gray-400 text-xs mt-1">
                    Alt: {satellite.altitude}km | Inc: {satellite.inclination.toFixed(1)}°
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ground Stations List */}
          <div>
            <h3 className="text-white font-semibold mb-2 flex items-center">
              <GlobeIcon className="h-4 w-4 mr-2" />
              Ground Stations ({groundStations.length})
            </h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {groundStations.map((station) => (
                <div key={station.id} className="bg-gray-800 p-2 rounded border border-gray-600">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleGroundStationVisibility(station.id)}
                        className={`w-3 h-3 rounded-full ${station.visible ? 'bg-green-400' : 'bg-gray-400'}`}
                      />
                      <span className="text-white text-xs">{station.name}</span>
                    </div>
                    <button
                      onClick={() => removeGroundStation(station.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <TrashIcon className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="text-gray-400 text-xs mt-1">
                    {station.latitude.toFixed(2)}°, {station.longitude.toFixed(2)}°
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Constellations List */}
          <div>
            <h3 className="text-white font-semibold mb-2 flex items-center">
              <StarIcon className="h-4 w-4 mr-2" />
              Constellations ({constellations.length})
            </h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {constellations.map((constellation) => (
                <div key={constellation.name} className="bg-gray-800 p-2 rounded border border-gray-600">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setConstellations(prev => prev.map(c => 
                            c.name === constellation.name ? { ...c, visible: !c.visible } : c
                          ));
                        }}
                        className={`w-3 h-3 rounded-full ${constellation.visible ? 'bg-green-400' : 'bg-gray-400'}`}
                      />
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: constellation.color }}
                      />
                      <span className="text-white text-xs">{constellation.name}</span>
                    </div>
                    <span className="text-gray-400 text-xs">
                      {constellation.satellites.length} sats
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Statistics */}
          <div>
            <h3 className="text-white font-semibold mb-2 flex items-center">
              <SettingsIcon className="h-4 w-4 mr-2" />
              Statistics
            </h3>
            <div className="bg-gray-800 p-3 rounded border border-gray-600 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Active Satellites:</span>
                <span className="text-white font-mono">{satellites.filter(s => s.visible).length}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Ground Stations:</span>
                <span className="text-white font-mono">{groundStations.filter(s => s.visible).length}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Simulation Speed:</span>
                <span className="text-white font-mono">{simulationSpeed}x</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Total Orbits:</span>
                <span className="text-white font-mono">{satellites.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SatelliteVisualizer; 