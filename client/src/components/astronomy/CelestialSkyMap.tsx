import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Maximize2, Minimize2, Settings } from "lucide-react";

// Note: d3-celestial uses global window.Celestial object
declare global {
  interface Window {
    Celestial: any;
  }
}

interface CelestialSkyMapProps {
  height?: string;
  width?: string;
  fullScreen?: boolean;
  onToggleFullScreen?: () => void;
}

export default function CelestialSkyMap({
  height = "500px",
  width = "100%",
  fullScreen = false,
  onToggleFullScreen
}: CelestialSkyMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfiguring, setIsConfiguring] = useState(false);

  useEffect(() => {
    // Load d3-celestial scripts dynamically
    const loadScripts = async () => {
      setIsLoading(true);
      
      // Only load scripts once
      if (typeof window.Celestial !== 'undefined') {
        initializeMap();
        return;
      }
      
      try {
        // First load D3 since celestial depends on it
        const d3Script = document.createElement('script');
        d3Script.src = 'https://cdn.jsdelivr.net/npm/d3@5/dist/d3.min.js';
        d3Script.async = true;
        
        // After D3 loads, load d3-celestial
        d3Script.onload = () => {
          const celestialScript = document.createElement('script');
          celestialScript.src = 'https://cdn.jsdelivr.net/npm/d3-celestial@0.7.35/dist/celestial.min.js';
          celestialScript.async = true;
          
          celestialScript.onload = () => {
            initializeMap();
          };
          
          document.body.appendChild(celestialScript);
        };
        
        document.body.appendChild(d3Script);
      } catch (error) {
        console.error("Error loading d3-celestial:", error);
        setIsLoading(false);
      }
    };
    
    // Initialize the celestial map
    const initializeMap = () => {
      if (!mapContainerRef.current || !window.Celestial) return;
      
      // Clear previous map if exists
      mapContainerRef.current.innerHTML = '';
      
      // Get user's location (this would ideally use the Geolocation API)
      // For now we'll use a default location
      const config = {
        width: fullScreen ? window.innerWidth : mapContainerRef.current.offsetWidth,
        height: parseInt(height),
        projection: "stereographic",
        transform: "equatorial",
        center: [0, 0, 0], // Center on current user's position (lon, lat, orientation)
        background: {
          fill: "#14141E",
          stroke: "#000000",
          opacity: 1,
          width: 1
        },
        stars: {
          colors: true,
          names: true,
          style: { fill: "#ffffff", opacity: 0.7 },
          limit: 6,
          size: 5
        },
        dsos: {
          show: true,
          names: true,
          style: { fill: "#cccccc", opacity: 0.7 },
          limit: 6
        },
        constellations: {
          names: true,
          namesType: "iau",
          nameStyle: { fill: "#9d4edd", font: "14px Helvetica, Arial, sans-serif", align: "center", baseline: "middle" },
          lines: true,
          lineStyle: { stroke: "#9d4edd", width: 1, opacity: 0.6 },
          bounds: false
        },
        mw: {
          show: true,
          style: { fill: "#ffffff", opacity: 0.15 }
        },
        planets: {
          show: true,
          which: ["sol", "mer", "ven", "ter", "lun", "mar", "jup", "sat", "ura", "nep"],
          style: {
            sol: { fill: "#ffff00", size: 12 },
            mer: { fill: "#cccccc" },
            ven: { fill: "#eeeecc" },
            ter: { fill: "#00ccff" },
            lun: { fill: "#ffffff" },
            mar: { fill: "#ff6600" },
            jup: { fill: "#ffaa33" },
            sat: { fill: "#ffdd66" },
            ura: { fill: "#66ccff" },
            nep: { fill: "#6666ff" }
          },
          names: true
        },
        lines: {
          graticule: {
            show: true,
            stroke: "#cccccc",
            width: 0.6,
            opacity: 0.8,
            // Grid lines by default 30°, 15°
            lon: {
              pos: ["", ""],
              fill: "#cccccc",
              font: "10px Helvetica, Arial, sans-serif"
            },
            lat: {
              pos: ["", ""],
              fill: "#cccccc",
              font: "10px Helvetica, Arial, sans-serif"
            }
          },
          equatorial: { show: true, stroke: "#aaaaaa", width: 1.3, opacity: 0.7 },
          ecliptic: { show: true, stroke: "#66cc66", width: 1.3, opacity: 0.7 },
          galactic: { show: false, stroke: "#cc6666", width: 1.3, opacity: 0.7 },
          supergalactic: { show: false, stroke: "#cc66cc", width: 1.3, opacity: 0.7 }
        },
        daylight: {
          show: false
        },
        set: function(config: unknown) { 
          // Configuration callback
          setIsLoading(false);
        },
        interactive: true,
        controls: true,
        container: mapContainerRef.current
      };
      
      // Initialize celestial with config
      window.Celestial.display(config);
    };
    
    loadScripts();
    
    // Add window resize listener for fullscreen mode
    const handleResize = () => {
      if (fullScreen && window.Celestial) {
        initializeMap();
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [fullScreen, height]);

  // Get container style based on props
  const containerStyle = fullScreen ? {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    height: '100vh',
    width: '100vw',
  } : {
    height,
    width,
  };
  
  return (
    <div style={containerStyle as React.CSSProperties} className={`relative ${fullScreen ? 'bg-black' : ''}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#14141E]/80 z-10">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        </div>
      )}
      
      <div ref={mapContainerRef} className="w-full h-full"></div>
      
      {onToggleFullScreen && !isLoading && (
        <Button
          onClick={onToggleFullScreen}
          className="absolute bottom-4 right-4 bg-black/60 hover:bg-black/80 backdrop-blur"
          size="sm"
        >
          {fullScreen ? <Minimize2 className="h-4 w-4 mr-2" /> : <Maximize2 className="h-4 w-4 mr-2" />}
          {fullScreen ? "Exit Fullscreen" : "Fullscreen"}
        </Button>
      )}
      
      {!isLoading && (
        <Button
          onClick={() => setIsConfiguring(!isConfiguring)}
          className="absolute bottom-4 left-4 bg-black/60 hover:bg-black/80 backdrop-blur"
          size="sm"
        >
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      )}
    </div>
  );
}