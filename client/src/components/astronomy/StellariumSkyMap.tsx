import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Maximize2, Minimize2 } from "lucide-react";

interface StellariumSkyMapProps {
  height?: string;
  fullScreen?: boolean;
  onToggleFullScreen?: () => void;
}

export default function StellariumSkyMap({ 
  height = "500px", 
  fullScreen = false,
  onToggleFullScreen
}: StellariumSkyMapProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Reset loading state when height or fullScreen props change
    setIsLoading(true);
    
    // Handle iframe load event
    const handleLoad = () => {
      setIsLoading(false);
    };
    
    const iframe = iframeRef.current;
    if (iframe) {
      iframe.addEventListener('load', handleLoad);
    }
    
    return () => {
      if (iframe) {
        iframe.removeEventListener('load', handleLoad);
      }
    };
  }, [height, fullScreen]);
  
  const containerStyle = fullScreen ? {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    height: '100vh',
  } : {};
  
  return (
    <div style={containerStyle as React.CSSProperties} className={`relative ${fullScreen ? 'bg-black' : ''}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#14141E]/80 z-10">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        </div>
      )}
      
      <div className="relative w-full" style={{ height: fullScreen ? '100%' : height }}>
        <iframe
          ref={iframeRef}
          src="https://stellarium-web.org/embed"
          className="w-full h-full rounded-lg border border-white/10"
          allowFullScreen
          title="Stellarium Web Sky Map"
        ></iframe>
        
        {onToggleFullScreen && (
          <Button
            onClick={onToggleFullScreen}
            className="absolute bottom-4 right-4 bg-black/60 hover:bg-black/80 backdrop-blur"
            size="sm"
          >
            {fullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            {fullScreen ? " Exit Fullscreen" : " Fullscreen"}
          </Button>
        )}
      </div>
    </div>
  );
}