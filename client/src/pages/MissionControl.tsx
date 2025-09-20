import React, { useState, useEffect } from 'react';
import { analyticsTracker } from '@/lib/analytics';
import { useAuth } from '@/hooks/useAuth';
import { useSubscriptionAccess } from '@/hooks/useSubscriptionAccess';
import PremiumAccess from '@/components/PremiumAccess';
import ImageModal from '@/components/ui/ImageModal';
import { BannerAd, InContentAd } from '@/components/AdPlacement';
import axios from 'axios';
import { 
  useUpcomingLaunches, 
  usePreviousLaunches,
  useISSLocation, 
  usePeopleInSpace, 
  useSpaceEvents, 
  useSpaceNews, 
  useNASAAPOD, 
  useSpaceXCompany, 
  useSpaceAgencies,
  useMarsWeather,
  useMoonPhase,
  useISSPassPredictions,
  useSatelliteTracking,
  useExoplanets,
  useSolarActivity,
  useHubbleImages,
  useEarthquakeData,
  useAdvancedSpaceWeather,
  useNearEarthObjects,
  SpaceDevsLaunch,
  NearEarthObject,
  Satellite,
  Exoplanet,
  HubbleImage,
  Earthquake,
  SolarActivity as SolarActivityType,
  MarsWeather,
  MoonPhase
} from '../services/launchesService';
import { useCurrentLiveFeed, issLiveFeedAPI, type CurrentLiveFeed } from '../services/issLiveFeedService';
import { 
  RocketIcon, 
  ClockIcon,
  PlayIcon,
  PauseIcon,
  SquareIcon,
  RadioIcon,
  MicIcon,
  HeadphonesIcon,
  VideoIcon,
  MonitorIcon,
  TerminalIcon,
  CpuIcon,
  HardDriveIcon,
  WifiOffIcon,
  CheckCircleIcon,
  XCircleIcon,
  AlertCircleIcon,
  InfoIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  EditIcon,
  SaveIcon,
  XIcon,
  PlusIcon,
  TrashIcon,
  SettingsIcon,
  RefreshCwIcon,
  ActivityIcon,
  AlertTriangleIcon,
  GlobeIcon,
  TargetIcon,
  UsersIcon,
  CalendarIcon,
  ThermometerIcon,
  WindIcon,
  EyeIcon,
  CloudIcon,
  ZapIcon,
  ShieldIcon,
  MapIcon,
  SatelliteIcon,
  BarChart3Icon,
  TrendingUpIcon,
  DatabaseIcon,
  ExternalLinkIcon,
  ToggleLeftIcon,
  ToggleRightIcon,
  SunIcon,
  MoonIcon,
  RadarIcon,
  CameraIcon,
  TelescopeIcon,
  WavesIcon,
  ShoppingCartIcon,
  CompassIcon,
  StarIcon,
  Globe2Icon,
  AtomIcon,
  MicroscopeIcon,
  BookOpenIcon,
  LightbulbIcon,
  MaximizeIcon,
  MinimizeIcon,
  PauseCircleIcon,
  MessageSquareIcon
} from 'lucide-react';

// Type definitions
interface MissionControlMission {
  id: string;
  name: string;
  agency: string;
  launchDate: string;
  status: 'scheduled' | 'live' | 'completed' | 'failed' | 'delayed' | 'upcoming' | 'cancelled';
  description: string;
  vehicle: string;
  payload: string;
  destination: string;
  launchSite: string;
  liveStreamUrl?: string;
  missionPatch?: string;
  crew?: string[];
  objectives: string[];
  milestones: MissionMilestone[];
  liveUpdates: LiveUpdate[];
  weather: LaunchWeather;
  countdown: {
    total: number;
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  };
}

interface MissionMilestone {
  id: string;
  name: string;
  time: string;
  status: 'upcoming' | 'current' | 'completed' | 'failed';
  description: string;
}

interface LiveUpdate {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  author: string;
}

interface LaunchWeather {
  temperature: number;
  windSpeed: number;
  windDirection: string;
  visibility: number;
  humidity: number;
  conditions: string;
  goNoGo: 'GO' | 'NO-GO' | 'CONDITIONAL';
}

interface MissionControlState {
  currentMission: MissionControlMission | null;
  isLive: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
  lastUpdate: string;
  adminMode: boolean;
  sessionId?: string;
}

// Mission Control API Types
interface MissionSession {
  id: number;
  sessionId: string;
  missionId: string;
  missionName: string;
  agency: string;
  launchDate: string;
  status: string;
  description?: string;
  vehicle?: string;
  payload?: string;
  destination?: string;
  launchSite?: string;
  liveStreamUrl?: string;
  missionPatchUrl?: string;
  isLive: boolean;
  adminUserId?: number;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}

interface MissionUpdate {
  id: number;
  sessionId: string;
  updateType: string;
  title: string;
  content: string;
  author: string;
  priority: string;
  isPublic: boolean;
  createdAt: string;
}

interface MissionMilestone {
  id: number;
  sessionId: string;
  name: string;
  timeOffset: string;
  status: string;
  description?: string;
  sortOrder: number;
  createdAt: string;
}

interface MissionWeather {
  id: number;
  sessionId: string;
  temperature?: number;
  windSpeed?: number;
  windDirection?: string;
  visibility?: number;
  humidity?: number;
  conditions?: string;
  goNoGo: string;
  weatherSource?: string;
  recordedAt: string;
}

interface VideoOverlay {
  id: number;
  sessionId: string;
  overlayType: string;
  customText?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Mission Control API Functions
const missionControlAPI = {
  // Get active mission session
  async getActiveSession(): Promise<MissionSession | null> {
    try {
      const response = await axios.get('/api/mission-control/session');
      return response.data;
    } catch (error) {
      console.error('Error fetching active mission session:', error);
      return null;
    }
  },

  // Create new mission session
  async createSession(missionData: {
    missionId: string;
    missionName: string;
    agency: string;
    launchDate: string;
    description?: string;
    vehicle?: string;
    payload?: string;
    destination?: string;
    launchSite?: string;
    liveStreamUrl?: string;
    missionPatchUrl?: string;
    adminUserId?: number;
  }): Promise<MissionSession> {
    const response = await axios.post('/api/mission-control/session', missionData);
    return response.data;
  },

  // Update mission session
  async updateSession(sessionId: string, updates: Partial<MissionSession>): Promise<MissionSession> {
    const response = await axios.put('/api/mission-control/session', { sessionId, updates });
    return response.data;
  },

  // Add mission update
  async addUpdate(updateData: {
    sessionId: string;
    updateType: string;
    title: string;
    content: string;
    author: string;
    priority?: string;
    isPublic?: boolean;
  }): Promise<MissionUpdate> {
    const response = await axios.post('/api/mission-control/updates', updateData);
    return response.data;
  },

  // Get mission updates
  async getUpdates(sessionId: string): Promise<MissionUpdate[]> {
    const response = await axios.get(`/api/mission-control/updates/${sessionId}`);
    return response.data;
  },

  // Add mission milestone
  async addMilestone(milestoneData: {
    sessionId: string;
    name: string;
    timeOffset: string;
    description?: string;
    sortOrder?: number;
  }): Promise<MissionMilestone> {
    const response = await axios.post('/api/mission-control/milestones', milestoneData);
    return response.data;
  },

  // Get mission milestones
  async getMilestones(sessionId: string): Promise<MissionMilestone[]> {
    const response = await axios.get(`/api/mission-control/milestones/${sessionId}`);
    return response.data;
  },

  // Update mission milestone
  async updateMilestone(milestoneId: number, updates: Partial<MissionMilestone>): Promise<MissionMilestone> {
    const response = await axios.put(`/api/mission-control/milestones/${milestoneId}`, updates);
    return response.data;
  },

  // Add mission weather
  async addWeather(weatherData: {
    sessionId: string;
    temperature?: number;
    windSpeed?: number;
    windDirection?: string;
    visibility?: number;
    humidity?: number;
    conditions?: string;
    goNoGo?: string;
    weatherSource?: string;
  }): Promise<MissionWeather> {
    const response = await axios.post('/api/mission-control/weather', weatherData);
    return response.data;
  },

  // Get latest mission weather
  async getLatestWeather(sessionId: string): Promise<MissionWeather | null> {
    const response = await axios.get(`/api/mission-control/weather/${sessionId}`);
    return response.data;
  },

  // Add mission objective
  async addObjective(sessionId: string, objective: string): Promise<any> {
    const response = await axios.post('/api/mission-control/objectives', {
      sessionId,
      objective
    });
    return response.data;
  },

  // Set video overlay
  async setVideoOverlay(overlayData: {
    sessionId: string;
    overlayType: string;
    customText?: string;
    isActive?: boolean;
  }): Promise<VideoOverlay> {
    const response = await axios.post('/api/mission-control/video-overlay', overlayData);
    return response.data;
  },

  // Get video overlay
  async getVideoOverlay(sessionId: string): Promise<VideoOverlay | null> {
    const response = await axios.get(`/api/mission-control/video-overlay/${sessionId}`);
    return response.data;
  }
};

// Additional types for dashboard content
interface Location {
  lat: number;
  lon: number;
}

interface SpaceStation {
  name: string;
  country: string;
  launchDate: string;
  crew: number;
  status: 'active' | 'decommissioned' | 'planned';
  orbit: string;
}

interface SpaceMission {
  name: string;
  agency: string;
  status: 'active' | 'completed' | 'planned' | 'failed';
  destination: string;
  launchDate: string;
  duration: string;
  crew: number;
}

interface SpaceEvent {
  title: string;
  date: string;
  type: 'launch' | 'landing' | 'spacewalk' | 'docking' | 'scientific';
  description: string;
  location: string;
}

interface SystemStatus {
  system: string;
  status: 'operational' | 'degraded' | 'down' | 'maintenance';
  uptime: string;
  lastUpdate: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  type: 'launch' | 'landing' | 'spacewalk' | 'docking' | 'scientific' | 'astronomical' | 'conference' | 'anniversary';
  category: 'space' | 'astronomy' | 'education' | 'commercial';
  description: string;
  location: string;
  agency?: string;
  mission?: string;
  priority: 'high' | 'medium' | 'low';
  isRecurring?: boolean;
  recurrence?: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

// Sample mission data
const defaultMission: MissionControlMission = {
  id: 'no-mission-selected',
  name: 'No Mission Selected',
  agency: 'N/A',
  launchDate: new Date().toISOString(),
  status: 'standby',
  description: 'Select a mission from the upcoming launches to begin mission control operations.',
  vehicle: 'N/A',
  payload: 'N/A',
  destination: 'N/A',
  launchSite: 'N/A',
  liveStreamUrl: '',
  missionPatch: '',
  crew: [],
  objectives: [],
  milestones: [],
  liveUpdates: [],
  weather: {
    temperature: 0,
    windSpeed: 0,
    windDirection: 'N/A',
    visibility: 0,
    humidity: 0,
    conditions: 'N/A',
    goNoGo: 'N/A'
  },
  countdown: {
    total: 0,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  }
};

// Dashboard components
const LoadingCard = ({ title }: { title: string }) => (
  <div className="bg-gray-900/60 backdrop-blur-sm rounded-lg p-2 border border-purple-900/30">
    <h3 className="text-xs font-semibold text-white mb-1">{title}</h3>
    <div className="flex items-center justify-center py-1">
      <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-400/30 border-t-purple-400"></div>
      <span className="ml-2 text-gray-300 text-xs">Loading...</span>
    </div>
  </div>
);

const ErrorCard = ({ title, error }: { title: string; error: string }) => (
  <div className="bg-gray-900/60 backdrop-blur-sm rounded-lg p-2 border border-purple-900/30">
    <h3 className="text-xs font-semibold text-white mb-1">{title}</h3>
    <div className="text-red-400 bg-red-950/50 p-1 rounded border border-red-800/50 text-xs">
      <p className="font-medium">Failed to load</p>
      <p className="text-xs">{error}</p>
    </div>
  </div>
);

const CompactCard = ({ title, icon, children, colorClass = "purple" }: { 
  title: string; 
  icon: React.ReactNode; 
  children: React.ReactNode; 
  colorClass?: "purple" | "blue" | "orange" | "green" | "red" | "cyan" | "teal" | "indigo"; 
}) => {
  const colorClasses = {
    purple: "border-purple-900/30 hover:border-purple-800/50",
    blue: "border-blue-900/30 hover:border-blue-800/50",
    orange: "border-orange-900/30 hover:border-orange-800/50",
    green: "border-green-900/30 hover:border-green-800/50",
    red: "border-red-900/30 hover:border-red-800/50",
    cyan: "border-cyan-900/30 hover:border-cyan-800/50",
    teal: "border-teal-900/30 hover:border-teal-800/50",
    indigo: "border-indigo-900/30 hover:border-indigo-800/50"
  };

  return (
    <div className={`bg-gray-900/60 backdrop-blur-sm rounded-lg p-2 border ${colorClasses[colorClass]} transition-all duration-300`}>
      <div className="flex items-center gap-1 mb-1">
        {icon}
        <h3 className="text-xs font-semibold text-white">{title}</h3>
      </div>
      {children}
    </div>
  );
};

const MissionControl: React.FC = () => {
  const { user } = useAuth();
  const { canAccessFeature } = useSubscriptionAccess();
  const { data: upcomingLaunches, isLoading: launchesLoading } = useUpcomingLaunches();
  const { data: currentLiveFeed, isLoading: liveFeedLoading } = useCurrentLiveFeed();
  
  const [missionState, setMissionState] = useState<MissionControlState>({
    currentMission: defaultMission,
    isLive: false,
    connectionStatus: 'connected',
    lastUpdate: new Date().toISOString(),
    adminMode: user?.role === 'admin'
  });

  const [editingMission, setEditingMission] = useState<MissionControlMission | null>(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [newUpdate, setNewUpdate] = useState('');
  const [viewMode, setViewMode] = useState<'mission-control' | 'dashboard'>('mission-control');
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [apodModalOpen, setApodModalOpen] = useState(false);
  const [videoFeedUrl, setVideoFeedUrl] = useState('');
  const [isSimulatingLive, setIsSimulatingLive] = useState(false);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [videoOverlay, setVideoOverlay] = useState<'none' | 'starting-soon' | 'technical-difficulties' | 'standby' | 'maintenance' | 'custom'>('none');
  const [customOverlayText, setCustomOverlayText] = useState('');
  const [issFeedEnabled, setIssFeedEnabled] = useState(true);

  // Track Mission Control page view for analytics
  useEffect(() => {
    analyticsTracker.trackPageView('/mission-control');
  }, []);

  // Reset simulation state on page load
  useEffect(() => {
    // Reset simulation state when page loads
    setIsSimulatingLive(false);
    setVideoFeedUrl('');
    console.log('🔄 Reset simulation state on page load');
  }, []);

  // Update admin mode when user data changes
  useEffect(() => {
    const isAdmin = user?.role === 'admin';
    console.log('User role:', user?.role, 'Is admin:', isAdmin);
    setMissionState(prev => ({
      ...prev,
      adminMode: isAdmin
    }));
  }, [user?.role]);

  // Load active mission session from database
  useEffect(() => {
    const loadActiveSession = async () => {
      try {
        const session = await missionControlAPI.getActiveSession();
        if (session) {
          // Convert database session to MissionControlMission format
          const mission: MissionControlMission = {
            id: session.mission_id || session.missionId,
            name: session.mission_name || session.missionName,
            agency: session.agency,
            launchDate: session.launch_date || session.launchDate,
            status: session.status as any,
            description: session.description || '',
            vehicle: session.vehicle || '',
            payload: session.payload || '',
            destination: session.destination || '',
            launchSite: session.launch_site || session.launchSite,
            liveStreamUrl: session.live_stream_url || session.liveStreamUrl,
            missionPatch: session.mission_patch_url || session.missionPatchUrl,
            crew: [],
            objectives: [],
            milestones: [],
            liveUpdates: [],
            weather: {
              temperature: 0,
              windSpeed: 0,
              windDirection: 'N/A',
              visibility: 0,
              humidity: 0,
              conditions: 'N/A',
              goNoGo: 'TBD'
            },
            countdown: {
              total: 0,
              days: 0,
              hours: 0,
              minutes: 0,
              seconds: 0
            }
          };

          console.log('🔍 Mission object created:', mission);

          const sessionId = session.sessionId || session.session_id;
          setMissionState(prev => ({
            ...prev,
            currentMission: mission,
            sessionId: sessionId,
            isLive: session.isLive
          }));

          console.log('✅ Mission loaded from database:', mission.name, 'Session:', session);

          // Set video URL if available
          if (mission.liveStreamUrl) {
            console.log('🎬 Setting video URL from loaded mission:', mission.liveStreamUrl);
            setVideoFeedUrl(mission.liveStreamUrl);
          }

          // Load mission data (updates, milestones, weather, etc.)
          console.log('🔄 Loading mission data for active session:', sessionId);
          await loadMissionData(sessionId);
        }
      } catch (error) {
        console.error('Error loading active session:', error);
      }
    };

    loadActiveSession();
  }, []);

  // Load mission data for all users when session changes
  useEffect(() => {
    if (missionState.sessionId) {
      console.log('🔄 Session ID changed, loading mission data:', missionState.sessionId);
      loadMissionData(missionState.sessionId);
    }
  }, [missionState.sessionId]);

  // Periodic refresh of mission data to ensure all users get updates
  useEffect(() => {
    if (!missionState.sessionId) return;

    const interval = setInterval(() => {
      console.log('🔄 Periodic refresh of mission data');
      loadMissionData(missionState.sessionId);
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [missionState.sessionId]);

  // Load mission data (updates, milestones, weather, etc.)
  const loadMissionData = async (sessionId: string) => {
    console.log('🔄 Loading mission data for session:', sessionId);
    try {
      const [updates, milestones, weather, overlay, objectives, session] = await Promise.all([
        missionControlAPI.getUpdates(sessionId),
        missionControlAPI.getMilestones(sessionId),
        missionControlAPI.getLatestWeather(sessionId),
        missionControlAPI.getVideoOverlay(sessionId),
        missionControlAPI.getObjectives(sessionId),
        missionControlAPI.getActiveSession()
      ]);

      console.log('📊 Loaded data:', { updates: updates.length, milestones: milestones.length, weather: !!weather, overlay: !!overlay, objectives: objectives.length });

      // Update mission with loaded data
      setMissionState(prev => {
        if (!prev.currentMission) return prev;

        const updatedMission = { ...prev.currentMission };
        
        // Update live updates
        updatedMission.liveUpdates = updates.map(update => ({
          id: update.id.toString(),
          timestamp: update.createdAt,
          message: update.content,
          type: update.updateType as any,
          author: update.author
        }));

        // Update milestones
        updatedMission.milestones = milestones.map(milestone => ({
          id: milestone.id.toString(),
          name: milestone.name,
          time: milestone.timeOffset,
          status: milestone.status as any,
          description: milestone.description || ''
        }));

        // Update weather
        if (weather) {
          updatedMission.weather = {
            temperature: weather.temperature || 0,
            windSpeed: weather.windSpeed || 0,
            windDirection: weather.windDirection || 'N/A',
            visibility: weather.visibility || 0,
            humidity: weather.humidity || 0,
            conditions: weather.conditions || 'N/A',
            goNoGo: weather.goNoGo as any || 'TBD'
          };
        }

        // Update objectives
        updatedMission.objectives = objectives.map(obj => obj.objective);

        return {
          ...prev,
          currentMission: updatedMission
        };
      });

      // Update video overlay
      console.log('🎬 Overlay data from database:', overlay);
      if (overlay && (overlay.overlayType || overlay.overlay_type)) {
        const overlayType = overlay.overlayType || overlay.overlay_type;
        const customText = overlay.customText || overlay.custom_text;
        console.log('🎬 Video overlay loaded from database:', { overlayType, customText });
        setVideoOverlay(overlayType as any);
        setCustomOverlayText(customText || '');
      } else {
        console.log('🎬 No video overlay in database, setting to none');
        setVideoOverlay('none');
        setCustomOverlayText('');
      }

      // Update video URL from session
      if (session && session.liveStreamUrl) {
        console.log('🎬 Video URL loaded from database:', session.liveStreamUrl);
        setVideoFeedUrl(session.liveStreamUrl);
      }

      // Update ISS feed setting from session
      if (session && typeof session.issFeedEnabled === 'boolean') {
        console.log('🛰️ ISS feed setting loaded from database:', session.issFeedEnabled);
        setIssFeedEnabled(session.issFeedEnabled);
      } else {
        console.log('🛰️ No ISS feed setting in database, using default (true)');
        setIssFeedEnabled(true);
      }
    } catch (error) {
      console.error('Error loading mission data:', error);
    }
  };

  // Save ISS feed setting to database
  const saveISSFeedSetting = async (enabled: boolean) => {
    if (!missionState.sessionId) {
      console.log('❌ Cannot save ISS feed setting - no session ID');
      return;
    }

    try {
      await axios.put('/api/mission-control/iss-feed-settings', {
        sessionId: missionState.sessionId,
        issFeedEnabled: enabled
      });
      console.log('✅ ISS feed setting saved:', enabled);
    } catch (error) {
      console.error('❌ Error saving ISS feed setting:', error);
    }
  };

  // Save mission session to database
  const saveMissionSession = async (mission: MissionControlMission) => {
    try {
      // Always create a new session to avoid duplicates
      // Clean up old sessions first
      if (missionState.sessionId) {
        console.log('🧹 Cleaning up old session:', missionState.sessionId);
        try {
          await missionControlAPI.deleteSession(missionState.sessionId);
        } catch (error) {
          console.warn('⚠️ Could not delete old session:', error);
        }
      }

      // Create new session
      console.log('💾 Creating new mission session for:', mission.name);
      console.log('💾 Mission data being saved:', {
        missionId: mission.id,
        missionName: mission.name,
        agency: mission.agency,
        launchDate: mission.launchDate,
        description: mission.description,
        vehicle: mission.vehicle,
        payload: mission.payload,
        destination: mission.destination,
        launchSite: mission.launchSite,
        liveStreamUrl: mission.liveStreamUrl,
        missionPatchUrl: mission.missionPatch
      });
      
      const session = await missionControlAPI.createSession({
        missionId: mission.id,
        missionName: mission.name,
        agency: mission.agency,
        launchDate: mission.launchDate,
        description: mission.description,
        vehicle: mission.vehicle,
        payload: mission.payload,
        destination: mission.destination,
        launchSite: mission.launchSite,
        liveStreamUrl: mission.liveStreamUrl,
        missionPatchUrl: mission.missionPatch,
        adminUserId: user?.id
      });
      console.log('✅ New mission session created:', session);
      console.log('🔍 Session ID field:', session.sessionId, 'Session ID field (alt):', session.session_id);

      return session;
    } catch (error) {
      console.error('❌ Error saving mission session:', error);
      return null;
    }
  };

  // Add mission update to database
  const addMissionUpdate = async (updateType: string, title: string, content: string) => {
    if (!missionState.sessionId) return;

    try {
      await missionControlAPI.addUpdate({
        sessionId: missionState.sessionId,
        updateType,
        title,
        content,
        author: user?.name || 'Mission Control',
        priority: 'normal',
        isPublic: true
      });

      // Reload mission data
      await loadMissionData(missionState.sessionId);
    } catch (error) {
      console.error('Error adding mission update:', error);
    }
  };

  // Add mission milestone to database
  const addMissionMilestone = async (name: string, timeOffset: string, description?: string) => {
    if (!missionState.sessionId) return;

    try {
      await missionControlAPI.addMilestone({
        sessionId: missionState.sessionId,
        name,
        timeOffset,
        description
      });

      // Reload mission data
      await loadMissionData(missionState.sessionId);
    } catch (error) {
      console.error('Error adding mission milestone:', error);
    }
  };

  // Update mission milestone status
  const updateMilestoneStatus = async (milestoneId: number, status: string) => {
    try {
      await missionControlAPI.updateMilestone(milestoneId, { status });
      
      // Reload mission data
      if (missionState.sessionId) {
        await loadMissionData(missionState.sessionId);
      }
    } catch (error) {
      console.error('Error updating milestone status:', error);
    }
  };

  // Save weather data to database
  const saveWeatherData = async (weather: MissionControlWeather) => {
    if (!missionState.sessionId) return;

    try {
      await missionControlAPI.addWeather({
        sessionId: missionState.sessionId,
        temperature: weather.temperature,
        windSpeed: weather.windSpeed,
        windDirection: weather.windDirection,
        visibility: weather.visibility,
        humidity: weather.humidity,
        conditions: weather.conditions,
        goNoGo: weather.goNoGo,
        weatherSource: 'Mission Control'
      });
    } catch (error) {
      console.error('Error saving weather data:', error);
    }
  };

  // Save video overlay to database
  const saveVideoOverlay = async (overlayType: string, customText?: string) => {
    if (!missionState.sessionId) return;

    try {
      await missionControlAPI.setVideoOverlay({
        sessionId: missionState.sessionId,
        overlayType,
        customText,
        isActive: true
      });
    } catch (error) {
      console.error('Error saving video overlay:', error);
    }
  };

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
        },
        () => {
          setUserLocation({ lat: 40.7128, lon: -74.0060 });
        }
      );
    } else {
      setUserLocation({ lat: 40.7128, lon: -74.0060 });
    }
  }, []);

  // Update current time for overlay
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Handle ESC key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isFullscreen) {
        exitFullscreen();
      }
    };

    if (isFullscreen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isFullscreen]);

  // API hooks for dashboard content
  const { data: previousLaunches, isLoading: previousLaunchesLoading, error: previousLaunchesError } = usePreviousLaunches();
  const { data: issLocation, isLoading: issLocationLoading, error: issLocationError } = useISSLocation();
  const { data: peopleInSpace, isLoading: peopleInSpaceLoading, error: peopleInSpaceError } = usePeopleInSpace();
  const { data: spaceEvents, isLoading: spaceEventsLoading, error: spaceEventsError } = useSpaceEvents();
  const { data: spaceNews, isLoading: spaceNewsLoading, error: spaceNewsError } = useSpaceNews();
  const { data: nasaAPOD, isLoading: nasaAPODLoading, error: nasaAPODError } = useNASAAPOD();
  const { data: spaceXCompany, isLoading: spaceXCompanyLoading, error: spaceXCompanyError } = useSpaceXCompany();
  const { data: spaceAgencies, isLoading: spaceAgenciesLoading, error: spaceAgenciesError } = useSpaceAgencies();
  const { data: marsWeather, isLoading: marsWeatherLoading, error: marsWeatherError } = useMarsWeather();
  const { data: moonPhase, isLoading: moonPhaseLoading, error: moonPhaseError } = useMoonPhase();
  const { data: issPassPredictions, isLoading: issPassLoading, error: issPassError } = useISSPassPredictions(userLocation?.lat, userLocation?.lon);
  const { data: satellites, isLoading: satellitesLoading, error: satellitesError } = useSatelliteTracking();
  const { data: exoplanets, isLoading: exoplanetsLoading, error: exoplanetsError } = useExoplanets();
  const { data: solarActivity, isLoading: solarActivityLoading, error: solarActivityError } = useSolarActivity();
  const { data: hubbleImages, isLoading: hubbleImagesLoading, error: hubbleImagesError } = useHubbleImages();
  const { data: earthquakeData, isLoading: earthquakeDataLoading, error: earthquakeDataError } = useEarthquakeData();
  const { data: advancedSpaceWeather, isLoading: advancedSpaceWeatherLoading, error: advancedSpaceWeatherError } = useAdvancedSpaceWeather();
  const { data: nearEarthObjects, isLoading: nearEarthObjectsLoading, error: nearEarthObjectsError } = useNearEarthObjects();

  // Debug logging for admin panel
  // Debug logging removed to prevent console spam

  // Countdown timer
  useEffect(() => {
    if (!missionState.currentMission) return;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const launchTime = new Date(missionState.currentMission!.launchDate).getTime();
      const timeLeft = launchTime - now;

      console.log('🕐 Countdown update:', {
        missionStatus: missionState.currentMission.status,
        launchTime: new Date(launchTime).toISOString(),
        timeLeft: timeLeft,
        isUpcoming: missionState.currentMission.status === 'upcoming' || missionState.currentMission.status === 'scheduled'
      });

      // Only update countdown for upcoming/scheduled missions
      if (missionState.currentMission.status === 'upcoming' || missionState.currentMission.status === 'scheduled') {
        if (timeLeft > 0) {
          const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
          const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

          setMissionState(prev => ({
            ...prev,
            currentMission: prev.currentMission ? {
              ...prev.currentMission,
              countdown: {
                total: timeLeft,
                days,
                hours,
                minutes,
                seconds
              }
            } : null
          }));
        } else {
          // Mission is now live (within 2 hours of launch)
          setMissionState(prev => ({
            ...prev,
            currentMission: prev.currentMission ? {
              ...prev.currentMission,
              status: 'live' as const,
              countdown: { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 }
            } : null
          }));
        }
      } else {
        // For completed, failed, cancelled, or delayed missions, set countdown to 0
        setMissionState(prev => ({
          ...prev,
          currentMission: prev.currentMission ? {
            ...prev.currentMission,
            countdown: { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 }
          } : null
        }));
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [missionState.currentMission?.launchDate, missionState.currentMission?.status]);

  const addLiveUpdate = async () => {
    if (!newUpdate.trim() || !missionState.currentMission) return;

    // Add to database
    await addMissionUpdate('info', 'Live Update', newUpdate);

    // Update local state
    const update: LiveUpdate = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      message: newUpdate,
      type: 'info',
      author: user?.name || 'Mission Control'
    };

    setMissionState(prev => ({
      ...prev,
      currentMission: prev.currentMission ? {
        ...prev.currentMission,
        liveUpdates: [update, ...prev.currentMission.liveUpdates]
      } : null
    }));

    setNewUpdate('');
  };

  const startVideoSimulation = () => {
    setIsSimulatingLive(true);
    setVideoFeedUrl('https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&mute=1&loop=1&playlist=dQw4w9WgXcQ');
    
    // Add some live updates for the simulation
    const simulationUpdates = [
      { id: 'sim1', timestamp: new Date().toISOString(), message: 'Live video feed activated', type: 'success' as const, author: 'Mission Control' },
      { id: 'sim2', timestamp: new Date().toISOString(), message: 'Camera systems online', type: 'info' as const, author: 'Technical Team' },
      { id: 'sim3', timestamp: new Date().toISOString(), message: 'Stream quality: HD', type: 'info' as const, author: 'Broadcast Team' }
    ];

    setMissionState(prev => ({
      ...prev,
      currentMission: prev.currentMission ? {
        ...prev.currentMission,
        liveUpdates: [...simulationUpdates, ...prev.currentMission.liveUpdates]
      } : null
    }));
  };

  const stopVideoSimulation = () => {
    setIsSimulatingLive(false);
    setVideoFeedUrl('');
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const exitFullscreen = () => {
    setIsFullscreen(false);
  };

  const getMissionStatus = (launch: any): 'scheduled' | 'live' | 'completed' | 'failed' | 'delayed' | 'upcoming' | 'cancelled' => {
    const now = new Date().getTime();
    const launchTime = new Date(launch.net).getTime();
    const timeDiff = launchTime - now;
    
    // Check official status first
    const officialStatus = launch.status?.name?.toLowerCase();
    
    // If mission is cancelled or failed according to official status
    if (officialStatus === 'cancelled' || officialStatus === 'failed') {
      return 'cancelled';
    }
    
    // If mission is completed according to official status
    if (officialStatus === 'success' || officialStatus === 'completed') {
      return 'completed';
    }
    
    // If mission is delayed according to official status
    if (officialStatus === 'delayed' || officialStatus === 'tbd') {
      return 'delayed';
    }
    
    // If mission is currently live (within 2 hours of launch time)
    if (timeDiff <= 0 && timeDiff >= -7200000) { // 2 hours in milliseconds
      return 'live';
    }
    
    // If mission is in the future
    if (timeDiff > 0) {
      return 'upcoming';
    }
    
    // If mission is in the past but no official status, assume completed
    return 'completed';
  };

  const selectMission = async (launch: any) => {
    console.log('🚀 Selecting mission:', launch.name);
    const missionStatus = getMissionStatus(launch);
    
    // Check if this is the ISS Live Feed
    const isISSFeed = launch.id === 'iss-live-feed';
    
    const mission: MissionControlMission = {
      id: launch.id,
      name: launch.name,
      agency: launch.launch_service_provider?.name || 'Unknown',
      launchDate: launch.net,
      status: missionStatus,
      description: launch.mission?.description || 'No description available',
      vehicle: launch.rocket?.configuration?.name || 'Unknown',
      payload: launch.mission?.name || 'Unknown',
      destination: launch.mission?.orbit?.name || 'Unknown',
      launchSite: launch.pad?.name || 'Unknown',
      liveStreamUrl: isISSFeed ? 'https://www.youtube.com/embed/iYmvCUonukw?autoplay=1&rel=0&modestbranding=1&showinfo=0&controls=1&disablekb=1&fs=1&cc_load_policy=0&iv_load_policy=3&start=0' : (launch.webcast_url || ''),
      missionPatch: launch.image || '',
      objectives: isISSFeed ? [
        'Monitor Earth observation activities',
        'Conduct scientific experiments',
        'Maintain station systems',
        'Support crew operations',
        'Document Earth changes from space'
      ] : [],
      milestones: isISSFeed ? [
        { name: 'ISS Orbit Established', timeOffset: 'T-0:00:00', status: 'completed', description: 'International Space Station in stable orbit' },
        { name: 'Live Feed Active', timeOffset: 'T+0:00:00', status: 'completed', description: '24/7 live video feed operational' },
        { name: 'Earth Observation', timeOffset: 'T+0:00:00', status: 'in-progress', description: 'Continuous Earth monitoring' },
        { name: 'Crew Activities', timeOffset: 'T+0:00:00', status: 'in-progress', description: 'Astronaut operations and experiments' }
      ] : [],
      liveUpdates: [],
      weather: isISSFeed ? {
        temperature: -270, // Space temperature
        windSpeed: 0,
        windDirection: 'N/A',
        visibility: 1000, // Clear view from space
        humidity: 0,
        conditions: 'Space Environment',
        goNoGo: 'GO'
      } : {
        temperature: 0,
        windSpeed: 0,
        windDirection: 'N/A',
        visibility: 0,
        humidity: 0,
        conditions: 'Unknown',
        goNoGo: 'CONDITIONAL'
      },
      countdown: { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 }
    };

    setMissionState(prev => ({
      ...prev,
      currentMission: mission
    }));

    // If this is ISS feed, also set the video feed URL
    if (isISSFeed) {
      setVideoFeedUrl(mission.liveStreamUrl);
      console.log('🛰️ ISS feed selected, video URL set to:', mission.liveStreamUrl);
      console.log('🛰️ Mission liveStreamUrl:', mission.liveStreamUrl);
      console.log('🛰️ Setting videoFeedUrl state to:', mission.liveStreamUrl);
    }

    // Save mission to database
    console.log('💾 Saving mission to database...');
    const session = await saveMissionSession(mission);
    console.log('✅ Mission session created:', session);
    
    // Update mission state with session ID
    if (session) {
      const sessionId = session.sessionId || session.session_id;
      setMissionState(prev => ({
        ...prev,
        sessionId: sessionId,
        isLive: session.isLive
      }));
      console.log('🔄 Updated mission state with session ID:', sessionId);
      
      // Ensure video URL is set for ISS missions
      if (isISSFeed && mission.liveStreamUrl) {
        setVideoFeedUrl(mission.liveStreamUrl);
        console.log('🛰️ ISS mission - setting video URL after session creation:', mission.liveStreamUrl);
      }
    }

    // Add initial mission update
    if (session?.sessionId || session?.session_id) {
      await addMissionUpdate(
        'status',
        'Mission Selected',
        `Mission ${mission.name} has been selected for mission control operations.`
      );

      // Add weather data (use mission weather or default)
      const weatherData = isISSFeed ? {
        temperature: -270, // Space temperature
        windSpeed: 0,
        visibility: 1000, // Clear view from space
        conditions: 'Space Environment',
        goNoGo: 'GO'
      } : {
        temperature: mission.weather.temperature || 0,
        windSpeed: mission.weather.windSpeed || 0,
        visibility: mission.weather.visibility || 0,
        conditions: mission.weather.conditions || 'N/A',
        goNoGo: mission.weather.goNoGo || 'TBD'
      };
      
      await saveWeatherData(weatherData);

      // Add objectives (use mission objectives or default)
      const sessionId = session.sessionId || session.session_id;
      const objectives = isISSFeed ? [
        'Monitor Earth observation activities',
        'Conduct scientific experiments',
        'Maintain station systems',
        'Support crew operations',
        'Document Earth changes from space'
      ] : (mission.objectives && mission.objectives.length > 0 ? mission.objectives : [
        'Complete final system checks',
        'Verify weather conditions', 
        'Execute launch sequence',
        'Monitor flight trajectory',
        'Ensure payload deployment'
      ]);

      for (const objective of objectives) {
        await missionControlAPI.addObjective(sessionId, objective);
      }

      // Reload mission data to display for all users
      await loadMissionData(sessionId);
    }

    // Add milestones (use mission milestones or default)
    if ((missionStatus === 'upcoming' || missionStatus === 'scheduled' || isISSFeed) && (session?.sessionId || session?.session_id)) {
      const milestones = isISSFeed ? [
        { name: 'ISS Orbit Established', timeOffset: 'T-0:00:00', description: 'International Space Station in stable orbit' },
        { name: 'Live Feed Active', timeOffset: 'T+0:00:00', description: '24/7 live video feed operational' },
        { name: 'Earth Observation', timeOffset: 'T+0:00:00', description: 'Continuous Earth monitoring' },
        { name: 'Crew Activities', timeOffset: 'T+0:00:00', description: 'Astronaut operations and experiments' },
        { name: 'Spacewalk Preparation', timeOffset: 'T+0:00:00', description: 'EVA suit checks and procedures' },
        { name: 'Scientific Experiments', timeOffset: 'T+0:00:00', description: 'Research and data collection' }
      ] : (mission.milestones && mission.milestones.length > 0 ? mission.milestones.map(m => ({
        name: m.name,
        timeOffset: m.time,
        description: m.description || ''
      })) : [
        { name: 'T-24h: Final Preparations', timeOffset: 'T-24:00:00', description: 'Rocket assembly and final checks' },
        { name: 'T-4h: Weather Briefing', timeOffset: 'T-04:00:00', description: 'Launch weather assessment' },
        { name: 'T-2h: Fueling Begins', timeOffset: 'T-02:00:00', description: 'Rocket propellant loading' },
        { name: 'T-30m: Final Go/No-Go', timeOffset: 'T-00:30:00', description: 'Final launch decision' },
        { name: 'T-10m: Terminal Count', timeOffset: 'T-00:10:00', description: 'Automated countdown sequence' },
        { name: 'T-0: Liftoff', timeOffset: 'T-00:00:00', description: 'Rocket launch' },
        { name: 'T+2m: Stage Separation', timeOffset: 'T+00:02:00', description: 'First stage separation' },
        { name: 'T+8m: Second Stage Ignition', timeOffset: 'T+00:08:00', description: 'Second stage engine start' }
      ]);

      for (const milestone of milestones) {
        await addMissionMilestone(milestone.name, milestone.timeOffset, milestone.description);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'text-blue-400';
      case 'upcoming': return 'text-cyan-400';
      case 'live': return 'text-green-400';
      case 'completed': return 'text-green-600';
      case 'failed': return 'text-red-400';
      case 'cancelled': return 'text-red-500';
      case 'delayed': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return <ClockIcon className="h-4 w-4" />;
      case 'upcoming': return <CalendarIcon className="h-4 w-4" />;
      case 'live': return <PlayIcon className="h-4 w-4" />;
      case 'completed': return <CheckCircleIcon className="h-4 w-4" />;
      case 'failed': return <XCircleIcon className="h-4 w-4" />;
      case 'cancelled': return <XIcon className="h-4 w-4" />;
      case 'delayed': return <AlertCircleIcon className="h-4 w-4" />;
      default: return <InfoIcon className="h-4 w-4" />;
    }
  };

  const getGoNoGoColor = (status: string) => {
    switch (status) {
      case 'GO': return 'text-green-400 bg-green-900/20 border-green-500';
      case 'NO-GO': return 'text-red-400 bg-red-900/20 border-red-500';
      case 'CONDITIONAL': return 'text-yellow-400 bg-yellow-900/20 border-yellow-500';
      default: return 'text-gray-400 bg-gray-900/20 border-gray-500';
    }
  };

  if (!missionState.currentMission) {
  return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Mission Control</h1>
          <div className="text-center py-16">
            <RocketIcon className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <p className="text-xl text-gray-400">No mission selected</p>
            <p className="text-gray-500 mt-2">Select a mission from the upcoming launches to begin</p>
      </div>
              </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-700 px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <RocketIcon className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400" />
              <div>
              <h1 className="text-xl sm:text-2xl font-bold">Mission Control</h1>
              <p className="text-xs sm:text-sm text-gray-400">
                {viewMode === 'mission-control' ? 'Real-time mission monitoring' : 'Space & STEM dashboard'}
              </p>
              </div>
            </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            {/* View Mode Toggle */}
            <div className="flex items-center space-x-1 sm:space-x-2 bg-gray-800 rounded-lg p-1">
                <button
                onClick={() => setViewMode('mission-control')}
                className={`px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                  viewMode === 'mission-control' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <span className="hidden sm:inline">Mission Control</span>
                <span className="sm:hidden">Mission</span>
                </button>
              <button
                onClick={() => setViewMode('dashboard')}
                className={`px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                  viewMode === 'dashboard' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Dashboard
              </button>
                </div>

            {viewMode === 'mission-control' && (
              <>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${missionState.connectionStatus === 'connected' ? 'bg-green-400' : 'bg-red-400'}`} />
                  <span className="text-sm text-gray-400">
                    {missionState.connectionStatus === 'connected' ? 'CONNECTED' : 'DISCONNECTED'}
                      </span>
                  </div>
                
                {missionState.adminMode && (
                  <button
                    onClick={() => {
                      console.log('Admin panel button clicked, current state:', showAdminPanel);
                      setShowAdminPanel(!showAdminPanel);
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    <SettingsIcon className="h-4 w-4 mr-2 inline" />
                    {showAdminPanel ? 'Hide Admin' : 'Admin Panel'}
                  </button>
                )}
              </>
                )}
              </div>
            </div>
          </div>

      {viewMode === 'mission-control' ? (
        <div className="flex flex-col lg:flex-row">
          {/* Main Mission Display */}
          <div className="flex-1 p-3 sm:p-6">
          {/* Mission Header */}
          <div className="bg-gray-900 rounded-lg p-3 sm:p-6 mb-4 sm:mb-6 border border-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between space-y-4 sm:space-y-0">
              <div className="flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0 sm:space-x-4">
                {missionState.currentMission.missionPatch && (
                  <img 
                    src={missionState.currentMission.missionPatch} 
                    alt="Mission Patch" 
                    className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg mx-auto sm:mx-0"
                  />
                )}
                <div className="text-center sm:text-left">
                  <h2 className="text-lg sm:text-2xl font-bold mb-2">{missionState.currentMission.name}</h2>
                  <p className="text-gray-400 mb-4 text-sm sm:text-base">{missionState.currentMission.description}</p>
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-6 text-xs sm:text-sm">
                    <div className="flex items-center justify-center sm:justify-start space-x-2">
                      <span className="text-gray-500">Agency:</span>
                      <span>{missionState.currentMission.agency}</span>
                      </div>
                    <div className="flex items-center justify-center sm:justify-start space-x-2">
                      <span className="text-gray-500">Vehicle:</span>
                      <span>{missionState.currentMission.vehicle}</span>
                      </div>
                    <div className="flex items-center justify-center sm:justify-start space-x-2">
                      <span className="text-gray-500">Launch Site:</span>
                      <span>{missionState.currentMission.launchSite}</span>
                    </div>
              </div>
        </div>
      </div>

              <div className="text-center sm:text-right">
                <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full border ${getStatusColor(missionState.currentMission.status)}`}>
                  {getStatusIcon(missionState.currentMission.status)}
                  <span className="font-medium text-xs sm:text-sm">{missionState.currentMission.status.toUpperCase()}</span>
                </div>
                </div>
                </div>
              </div>

          {/* Countdown Timer */}
          <div className="bg-gray-900 rounded-lg p-3 sm:p-6 mb-4 sm:mb-6 border border-gray-700 relative">
            <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 flex items-center justify-center sm:justify-start">
              <ClockIcon className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-blue-400" />
              Countdown
            </h3>
            
            {/* ISS Mission Blur Overlay */}
            {missionState.currentMission?.id === 'iss-live-feed' && (
              <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
                <div className="text-center p-6">
                  <div className="text-2xl sm:text-3xl font-bold text-blue-400 mb-2">No Live Mission Videos Currently</div>
                  <div className="text-lg text-gray-300">In the meantime, here is the ISS!</div>
                  <div className="text-sm text-gray-400 mt-2">Live from the International Space Station</div>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
              <div className="text-center">
                <div className="text-2xl sm:text-4xl font-bold text-blue-400">{missionState.currentMission.countdown.days}</div>
                <div className="text-xs sm:text-sm text-gray-400">DAYS</div>
              </div>
            <div className="text-center">
                <div className="text-2xl sm:text-4xl font-bold text-blue-400">{missionState.currentMission.countdown.hours}</div>
                <div className="text-xs sm:text-sm text-gray-400">HOURS</div>
            </div>
            <div className="text-center">
                <div className="text-2xl sm:text-4xl font-bold text-blue-400">{missionState.currentMission.countdown.minutes}</div>
                <div className="text-xs sm:text-sm text-gray-400">MINUTES</div>
            </div>
            <div className="text-center">
                <div className="text-2xl sm:text-4xl font-bold text-blue-400">{missionState.currentMission.countdown.seconds}</div>
                <div className="text-xs sm:text-sm text-gray-400">SECONDS</div>
            </div>
              </div>
              </div>

          {/* Live Video Feed */}
          <div className="bg-gray-900 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6 border border-gray-700 max-w-6xl mx-auto">
            <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center justify-between mb-4">
              <h3 className="text-lg sm:text-xl font-bold flex items-center justify-center sm:justify-start">
                <VideoIcon className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-red-400" />
                Live Video Feed
                {isFullscreen && (
                  <span className="ml-2 text-sm text-gray-400">(Fullscreen)</span>
                )}
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                {missionState.adminMode && (
                  <>
                <button
                      onClick={async () => {
                        startVideoSimulation();
                        // Auto-save video simulation start to database
                        if (missionState.sessionId) {
                          await addMissionUpdate(
                            'technical',
                            'Video Simulation Started',
                            'Live video simulation activated from main controls'
                          );
                        }
                      }}
                      disabled={isSimulatingLive}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        isSimulatingLive 
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                          : 'bg-red-600 hover:bg-red-700 text-white'
                      }`}
                    >
                      <PlayIcon className="h-3 w-3 mr-1 inline" />
                      Start Simulation
                </button>
              <button
                      onClick={async () => {
                        stopVideoSimulation();
                        // Auto-save video simulation stop to database
                        if (missionState.sessionId) {
                          await addMissionUpdate(
                            'technical',
                            'Video Simulation Stopped',
                            'Live video simulation deactivated from main controls'
                          );
                        }
                      }}
                      disabled={!isSimulatingLive}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        !isSimulatingLive 
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                          : 'bg-gray-600 hover:bg-gray-700 text-white'
                      }`}
                    >
                      <SquareIcon className="h-3 w-3 mr-1 inline" />
                      Stop
              </button>
                  </>
                )}
                <button
                  onClick={async () => {
                    setOverlayVisible(!overlayVisible);
                    // Auto-save overlay visibility to database
                    if (missionState.sessionId) {
                      await addMissionUpdate(
                        'technical',
                        'Overlay Visibility Changed',
                        `Video overlay ${!overlayVisible ? 'shown' : 'hidden'} from main controls`
                      );
                    }
                  }}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-medium transition-colors"
                >
                  {overlayVisible ? 'Hide' : 'Show'} Overlay
                </button>
                <button
                  onClick={async () => {
                    toggleFullscreen();
                    // Auto-save fullscreen toggle to database
                    if (missionState.sessionId) {
                      await addMissionUpdate(
                        'technical',
                        'Fullscreen Toggled',
                        `Video ${!isFullscreen ? 'entered' : 'exited'} fullscreen mode`
                      );
                    }
                  }}
                  className="px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-xs font-medium transition-colors"
                >
                  {isFullscreen ? (
                    <>
                      <XIcon className="h-3 w-3 mr-1 inline" />
                      Exit Fullscreen
                    </>
                  ) : (
                    <>
                      <ExternalLinkIcon className="h-3 w-3 mr-1 inline" />
                      Fullscreen
                    </>
                  )}
              </button>
            </div>
          </div>
            
            <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
              {/* Debug info - remove in production */}
              {missionState.adminMode && (
                <div className="absolute top-2 left-2 bg-black/80 text-white text-xs p-2 rounded z-20">
                  <div>Simulating: {isSimulatingLive ? 'Yes' : 'No'}</div>
                  <div>Video URL: {videoFeedUrl ? 'Set' : 'None'}</div>
                  <div>ISS Enabled: {issFeedEnabled ? 'Yes' : 'No'}</div>
                  <div>Live Feed: {currentLiveFeed?.feed ? 'Available' : 'None'}</div>
        </div>
              )}
              
              {(isSimulatingLive && videoFeedUrl) || (missionState.currentMission?.id === 'iss-live-feed' && videoFeedUrl) ? (
                <iframe
                  src={videoFeedUrl}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : currentLiveFeed?.feed && !liveFeedLoading && issFeedEnabled ? (
                <div className="w-full h-full">
                  <iframe
                    src={currentLiveFeed.feed.embedUrl}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={currentLiveFeed.feed.title}
                    referrerPolicy="no-referrer"
                    sandbox="allow-scripts allow-same-origin allow-presentation"
                  />
                  {currentLiveFeed.launchInfo && (
                    <div className="absolute top-4 left-4 bg-blue-600/90 text-white px-3 py-2 rounded-lg text-sm">
                      <div className="font-semibold">Next Launch: {currentLiveFeed.launchInfo.launchName}</div>
                      <div className="text-xs opacity-90">
                        Switching in {currentLiveFeed.launchInfo.timeUntilSwitch} minutes
        </div>
      </div>
                  )}
                  <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-2 rounded-lg text-sm">
                    <div className="font-semibold">{currentLiveFeed.feed.title}</div>
                    {currentLiveFeed.feed.description && (
                      <div className="text-xs opacity-90">{currentLiveFeed.feed.description}</div>
                    )}
                    </div>
                    </div>
              ) : liveFeedLoading ? (
                <div className="w-full h-full flex items-center justify-center bg-gray-800">
                  <div className="text-center">
                    <VideoIcon className="h-16 w-16 mx-auto mb-4 text-gray-400 animate-pulse" />
                    <p className="text-xl text-gray-400 mb-2">Loading Live Feed...</p>
                  </div>
              </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-800">
                  <div className="text-center">
                    <VideoIcon className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-xl text-gray-400 mb-2">No Live Feed Available</p>
                   <p className="text-sm text-gray-500">
                     {missionState.adminMode 
                       ? 'Click "Start Simulation" to begin live video feed' 
                       : 'Proxima Report is either not covering this launch live or there is no launch currently'
                   }
                    </p>
      </div>
                </div>
              )}
              
              {/* Video Overlay */}
              {overlayVisible && (isSimulatingLive || missionState.currentMission?.id === 'iss-live-feed') && (
                <div className="absolute inset-0 pointer-events-none">
                  {/* Main Overlay Container */}
                  <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-transparent to-black/30">
                    {/* Top Header Bar */}
                    <div className="absolute top-0 left-0 right-0 h-12 sm:h-16 bg-gradient-to-r from-black/80 via-black/60 to-black/80 backdrop-blur-sm border-b border-blue-500/30">
                      <div className="flex items-center justify-between h-full px-3 sm:px-6">
                        {/* Left Side - Logo and Mission Info */}
                        <div className="flex items-center space-x-2 sm:space-x-4">
                          <div className="flex items-center space-x-2 sm:space-x-3">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center shadow-lg overflow-hidden">
                           <img 
                             src="https://pbs.twimg.com/profile_images/1911607693585821696/D0v0kjf-_400x400.jpg" 
                             alt="Proxima Report" 
                             className="w-6 h-6 sm:w-8 sm:h-8 object-cover rounded"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.parentElement.innerHTML = '<div class="w-6 h-6 sm:w-8 sm:h-8 bg-white rounded flex items-center justify-center"><span class="text-blue-600 font-bold text-xs sm:text-sm">PR</span></div>';
                                }}
                              />
                            </div>
                            <div className="hidden sm:block">
                              <div className="text-white font-bold text-sm sm:text-lg tracking-wide">PROXIMA REPORT</div>
                              <div className="text-blue-300 text-xs font-medium">MISSION CONTROL CENTER</div>
                            </div>
                            <div className="block sm:hidden">
                              <div className="text-white font-bold text-xs tracking-wide">PROXIMA</div>
                              <div className="text-blue-300 text-xs font-medium">MISSION CONTROL</div>
        </div>
      </div>

                          {/* Mission Info - Hidden on mobile */}
                          <div className="hidden lg:flex items-center space-x-4">
                            <div className="h-8 w-px bg-blue-500/30"></div>
              <div className="space-y-1">
                              <div className="text-white text-sm font-medium">{missionState.currentMission.name}</div>
                              <div className="text-gray-300 text-xs">{missionState.currentMission.vehicle}</div>
                      </div>
                      </div>
                    </div>

                        {/* Right Side - Live Status and Time */}
                        <div className="flex items-center space-x-2 sm:space-x-6">
                          <div className="flex items-center space-x-1 sm:space-x-2">
                            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50"></div>
                            <span className="text-white font-bold text-xs sm:text-sm tracking-wider">LIVE</span>
              </div>
                          <div className="text-white text-xs sm:text-sm font-mono">
                            {currentTime.toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Status Bar */}
                    <div className="absolute bottom-0 left-0 right-0 h-16 sm:h-20 bg-gradient-to-r from-black/80 via-black/60 to-black/80 backdrop-blur-sm border-t border-blue-500/30">
                      <div className="flex items-center justify-between h-full px-3 sm:px-6">
                        {/* Mobile Layout */}
                        <div className="flex sm:hidden w-full justify-between items-center">
                          <div className="text-center">
                            <div className="text-white text-xs font-medium mb-1">COUNTDOWN</div>
                            <div className="flex items-center space-x-1">
                              <div className="text-center">
                                <div className="text-lg font-bold text-blue-400 font-mono">{missionState.currentMission.countdown.days}</div>
                                <div className="text-xs text-gray-400">D</div>
              </div>
                              <div className="text-blue-400 text-sm font-mono">:</div>
                              <div className="text-center">
                                <div className="text-lg font-bold text-blue-400 font-mono">{missionState.currentMission.countdown.hours}</div>
                                <div className="text-xs text-gray-400">H</div>
                      </div>
                              <div className="text-blue-400 text-sm font-mono">:</div>
                              <div className="text-center">
                                <div className="text-lg font-bold text-blue-400 font-mono">{missionState.currentMission.countdown.minutes}</div>
                                <div className="text-xs text-gray-400">M</div>
                      </div>
                              <div className="text-blue-400 text-sm font-mono">:</div>
                              <div className="text-center">
                                <div className="text-lg font-bold text-blue-400 font-mono">{missionState.currentMission.countdown.seconds}</div>
                                <div className="text-xs text-gray-400">S</div>
                      </div>
                    </div>
                  </div>
                          <div className="text-center">
                            <div className="text-white text-xs font-medium mb-1">STATUS</div>
                            <div className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(missionState.currentMission.status)}`}>
                              {missionState.currentMission.status.toUpperCase()}
              </div>
                          </div>
                        </div>

                        {/* Desktop Layout */}
                        <div className="hidden sm:flex items-center justify-between w-full">
                          {/* Left Side - Countdown */}
                          <div className="flex items-center space-x-6">
                            <div className="text-center">
                              <div className="text-white text-xs font-medium mb-1 tracking-wider">TIME TO LAUNCH</div>
                              <div className="flex items-center space-x-3">
                                <div className="text-center">
                                  <div className="text-3xl font-bold text-blue-400 font-mono">{missionState.currentMission.countdown.days}</div>
                                  <div className="text-xs text-gray-400 font-medium">DAYS</div>
                  </div>
                                <div className="text-blue-400 text-2xl font-mono">:</div>
                                <div className="text-center">
                                  <div className="text-3xl font-bold text-blue-400 font-mono">{missionState.currentMission.countdown.hours}</div>
                                  <div className="text-xs text-gray-400 font-medium">HRS</div>
                </div>
                                <div className="text-blue-400 text-2xl font-mono">:</div>
                                <div className="text-center">
                                  <div className="text-3xl font-bold text-blue-400 font-mono">{missionState.currentMission.countdown.minutes}</div>
                                  <div className="text-xs text-gray-400 font-medium">MIN</div>
                  </div>
                                <div className="text-blue-400 text-2xl font-mono">:</div>
                                <div className="text-center">
                                  <div className="text-3xl font-bold text-blue-400 font-mono">{missionState.currentMission.countdown.seconds}</div>
                                  <div className="text-xs text-gray-400 font-medium">SEC</div>
                </div>
              </div>
                  </div>
                </div>

                          {/* Center - Mission Status */}
                          <div className="flex items-center space-x-4">
                            <div className="text-center">
                              <div className="text-white text-xs font-medium mb-1 tracking-wider">MISSION STATUS</div>
                              <div className={`px-3 py-1 rounded-full text-sm font-bold ${getStatusColor(missionState.currentMission.status)}`}>
                                {missionState.currentMission.status.toUpperCase()}
                  </div>
                </div>
                            
                            <div className="h-12 w-px bg-blue-500/30"></div>
                            
                            <div className="text-center">
                              <div className="text-white text-xs font-medium mb-1 tracking-wider">WEATHER</div>
                              <div className={`px-3 py-1 rounded-full text-sm font-bold ${getGoNoGoColor(missionState.currentMission.weather.goNoGo)}`}>
                                {missionState.currentMission.weather.goNoGo}
              </div>
                            </div>
                          </div>

                          {/* Right Side - Additional Info */}
                          <div className="text-right">
                            <div className="text-white text-xs font-medium mb-1 tracking-wider">LAUNCH SITE</div>
                            <div className="text-gray-300 text-sm">{missionState.currentMission.launchSite}</div>
                          </div>
                        </div>
                      </div>
                    </div>


                    {/* Animated Grid Lines */}
                    <div className="absolute inset-0">
                      {/* Horizontal Lines */}
                      <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent animate-pulse"></div>
                      <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                      <div className="absolute top-3/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent animate-pulse" style={{ animationDelay: '1s' }}></div>
                      
                      {/* Vertical Lines */}
                      <div className="absolute left-1/4 top-0 w-px h-full bg-gradient-to-b from-transparent via-blue-500/20 to-transparent animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                      <div className="absolute left-1/2 top-0 w-px h-full bg-gradient-to-b from-transparent via-blue-500/30 to-transparent animate-pulse" style={{ animationDelay: '0.8s' }}></div>
                      <div className="absolute left-3/4 top-0 w-px h-full bg-gradient-to-b from-transparent via-blue-500/20 to-transparent animate-pulse" style={{ animationDelay: '1.3s' }}></div>
                      </div>

                    {/* Corner Brackets - Positioned to not overlap content */}
                    <div className="absolute top-16 left-4 w-8 h-8 border-t-2 border-l-2 border-blue-500/40 rounded-tl-lg"></div>
                    <div className="absolute top-16 right-4 w-8 h-8 border-t-2 border-r-2 border-blue-500/40 rounded-tr-lg"></div>
                    <div className="absolute bottom-20 left-4 w-8 h-8 border-b-2 border-l-2 border-blue-500/40 rounded-bl-lg"></div>
                    <div className="absolute bottom-20 right-4 w-8 h-8 border-b-2 border-r-2 border-blue-500/40 rounded-br-lg"></div>

                    {/* Data Stream Effects */}
                    <div className="absolute top-1/3 left-6 w-1 h-20 bg-gradient-to-b from-transparent via-cyan-400/60 to-transparent animate-pulse" style={{ animationDelay: '2s' }}></div>
                    <div className="absolute top-2/3 right-6 w-1 h-20 bg-gradient-to-b from-transparent via-purple-400/60 to-transparent animate-pulse" style={{ animationDelay: '2.5s' }}></div>
                      </div>
                    </div>
              )}

              {/* Video Status Overlay */}
              {videoOverlay !== 'none' && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-10">
                  <div className="text-center p-8">
                    {videoOverlay === 'starting-soon' && (
                      <>
                        <div className="w-24 h-24 mx-auto mb-6 bg-blue-600 rounded-full flex items-center justify-center animate-pulse">
                          <ClockIcon className="h-12 w-12 text-white" />
              </div>
                        <h2 className="text-4xl font-bold text-white mb-4">STARTING SOON</h2>
                        <p className="text-xl text-gray-300">Mission Control will begin shortly</p>
                        <div className="mt-6 flex items-center justify-center space-x-2">
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </>
                    )}

                    {videoOverlay === 'technical-difficulties' && (
                      <>
                        <div className="w-24 h-24 mx-auto mb-6 bg-red-600 rounded-full flex items-center justify-center animate-pulse">
                          <AlertCircleIcon className="h-12 w-12 text-white" />
                </div>
                        <h2 className="text-4xl font-bold text-red-400 mb-4">TECHNICAL DIFFICULTIES</h2>
                        <p className="text-xl text-gray-300 mb-2">We are experiencing technical issues</p>
                        <p className="text-lg text-gray-400">Please stand by while we resolve this</p>
                        <div className="mt-6 flex items-center justify-center space-x-2">
                          <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                          <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                          <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
                      </>
                    )}

                    {videoOverlay === 'standby' && (
                      <>
                        <div className="w-24 h-24 mx-auto mb-6 bg-yellow-600 rounded-full flex items-center justify-center animate-pulse">
                          <PauseCircleIcon className="h-12 w-12 text-white" />
                </div>
                        <h2 className="text-4xl font-bold text-yellow-400 mb-4">STANDBY</h2>
                        <p className="text-xl text-gray-300 mb-2">Mission Control is on standby</p>
                        <p className="text-lg text-gray-400">Waiting for next phase</p>
                        <div className="mt-6 flex items-center justify-center space-x-2">
                          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
                          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-ping" style={{ animationDelay: '0.3s' }}></div>
                          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-ping" style={{ animationDelay: '0.6s' }}></div>
                </div>
                      </>
                    )}

                    {videoOverlay === 'maintenance' && (
                      <>
                        <div className="w-24 h-24 mx-auto mb-6 bg-gray-600 rounded-full flex items-center justify-center animate-pulse">
                          <SettingsIcon className="h-12 w-12 text-white" />
              </div>
                        <h2 className="text-4xl font-bold text-gray-300 mb-4">MAINTENANCE</h2>
                        <p className="text-xl text-gray-300 mb-2">System maintenance in progress</p>
                        <p className="text-lg text-gray-400">We'll be back shortly</p>
                        <div className="mt-6 flex items-center justify-center space-x-2">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                      </>
                    )}

                    {videoOverlay === 'custom' && (
                      <>
                        <div className="w-24 h-24 mx-auto mb-6 bg-purple-600 rounded-full flex items-center justify-center animate-pulse">
                          <MessageSquareIcon className="h-12 w-12 text-white" />
                </div>
                        <h2 className="text-4xl font-bold text-purple-400 mb-4">ANNOUNCEMENT</h2>
                        <p className="text-xl text-gray-300 mb-2">{customOverlayText || 'Custom message'}</p>
                        <div className="mt-6 flex items-center justify-center space-x-2">
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                      </>
                    )}
                </div>
              </div>
              )}
            </div>
          </div>

          {/* Fullscreen Video Overlay */}
          {isFullscreen && (
            <div className="fixed inset-0 z-50 bg-black">
              <div className="relative w-full h-full">
                {(isSimulatingLive && videoFeedUrl) || (missionState.currentMission?.id === 'iss-live-feed' && videoFeedUrl) ? (
                  <iframe
                    src={videoFeedUrl}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : currentLiveFeed?.feed && !liveFeedLoading && issFeedEnabled ? (
                  <div className="w-full h-full">
                    <iframe
                      src={currentLiveFeed.feed.embedUrl}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={currentLiveFeed.feed.title}
                    />
                    {currentLiveFeed.launchInfo && (
                      <div className="absolute top-4 left-4 bg-blue-600/90 text-white px-3 py-2 rounded-lg text-sm">
                        <div className="font-semibold">Next Launch: {currentLiveFeed.launchInfo.launchName}</div>
                        <div className="text-xs opacity-90">
                          Switching in {currentLiveFeed.launchInfo.timeUntilSwitch} minutes
              </div>
                </div>
                    )}
                    <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-2 rounded-lg text-sm">
                      <div className="font-semibold">{currentLiveFeed.feed.title}</div>
                      {currentLiveFeed.feed.description && (
                        <div className="text-xs opacity-90">{currentLiveFeed.feed.description}</div>
                      )}
                </div>
              </div>
                ) : liveFeedLoading ? (
                  <div className="w-full h-full flex items-center justify-center bg-gray-800">
                    <div className="text-center">
                      <VideoIcon className="h-16 w-16 mx-auto mb-4 text-gray-400 animate-pulse" />
                      <p className="text-xl text-gray-400 mb-2">Loading Live Feed...</p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-800">
                    <div className="text-center">
                      <VideoIcon className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                      <p className="text-xl text-gray-400 mb-2">No Live Feed Available</p>
                   <p className="text-sm text-gray-500">
                     {missionState.adminMode 
                       ? 'Click "Start Simulation" to begin live video feed' 
                       : 'Proxima Report is either not covering this launch live or there is no launch currently'
                   }
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Fullscreen Overlay */}
                {overlayVisible && (isSimulatingLive || missionState.currentMission?.id === 'iss-live-feed') && (
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Main Overlay Container */}
                    <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-transparent to-black/30">
                      {/* Top Header Bar */}
                      <div className="absolute top-0 left-0 right-0 h-12 sm:h-16 bg-gradient-to-r from-black/80 via-black/60 to-black/80 backdrop-blur-sm border-b border-blue-500/30">
                        <div className="flex items-center justify-between h-full px-3 sm:px-6">
                          {/* Left Side - Logo and Mission Info */}
                          <div className="flex items-center space-x-2 sm:space-x-4">
                            <div className="flex items-center space-x-2 sm:space-x-3">
                              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center shadow-lg overflow-hidden">
                           <img 
                             src="https://pbs.twimg.com/profile_images/1911607693585821696/D0v0kjf-_400x400.jpg" 
                             alt="Proxima Report" 
                             className="w-6 h-6 sm:w-8 sm:h-8 object-cover rounded"
                      onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.parentElement.innerHTML = '<div class="w-6 h-6 sm:w-8 sm:h-8 bg-white rounded flex items-center justify-center"><span class="text-blue-600 font-bold text-xs sm:text-sm">PR</span></div>';
                      }}
                    />
                      </div>
                              <div className="hidden sm:block">
                                <div className="text-white font-bold text-sm sm:text-lg tracking-wide">PROXIMA REPORT</div>
                                <div className="text-blue-300 text-xs font-medium">MISSION CONTROL CENTER</div>
                    </div>
                              <div className="block sm:hidden">
                                <div className="text-white font-bold text-xs tracking-wide">PROXIMA</div>
                                <div className="text-blue-300 text-xs font-medium">MISSION CONTROL</div>
                  </div>
                </div>
                            
                            {/* Mission Info - Hidden on mobile */}
                            <div className="hidden lg:flex items-center space-x-4">
                              <div className="h-8 w-px bg-blue-500/30"></div>
              <div className="space-y-1">
                                <div className="text-white text-sm font-medium">{missionState.currentMission.name}</div>
                                <div className="text-gray-300 text-xs">{missionState.currentMission.vehicle}</div>
                      </div>
                    </div>
                  </div>

                          {/* Right Side - Live Status and Time */}
                          <div className="flex items-center space-x-2 sm:space-x-6">
                            <div className="flex items-center space-x-1 sm:space-x-2">
                              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50"></div>
                              <span className="text-white font-bold text-xs sm:text-sm tracking-wider">LIVE</span>
              </div>
                            <div className="text-white text-xs sm:text-sm font-mono">
                              {currentTime.toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Status Bar */}
                      <div className="absolute bottom-0 left-0 right-0 h-16 sm:h-20 bg-gradient-to-r from-black/80 via-black/60 to-black/80 backdrop-blur-sm border-t border-blue-500/30">
                        <div className="flex items-center justify-between h-full px-3 sm:px-6">
                          {/* Mobile Layout */}
                          <div className="flex sm:hidden w-full justify-between items-center">
            <div className="text-center">
                              <div className="text-white text-xs font-medium mb-1">COUNTDOWN</div>
                              <div className="flex items-center space-x-1">
                                <div className="text-center">
                                  <div className="text-lg font-bold text-blue-400 font-mono">{missionState.currentMission.countdown.days}</div>
                                  <div className="text-xs text-gray-400">D</div>
            </div>
                                <div className="text-blue-400 text-sm font-mono">:</div>
                                <div className="text-center">
                                  <div className="text-lg font-bold text-blue-400 font-mono">{missionState.currentMission.countdown.hours}</div>
                                  <div className="text-xs text-gray-400">H</div>
                                </div>
                                <div className="text-blue-400 text-sm font-mono">:</div>
                                <div className="text-center">
                                  <div className="text-lg font-bold text-blue-400 font-mono">{missionState.currentMission.countdown.minutes}</div>
                                  <div className="text-xs text-gray-400">M</div>
                                </div>
                                <div className="text-blue-400 text-sm font-mono">:</div>
                                <div className="text-center">
                                  <div className="text-lg font-bold text-blue-400 font-mono">{missionState.currentMission.countdown.seconds}</div>
                                  <div className="text-xs text-gray-400">S</div>
                                </div>
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-white text-xs font-medium mb-1">STATUS</div>
                              <div className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(missionState.currentMission.status)}`}>
                                {missionState.currentMission.status.toUpperCase()}
                              </div>
                            </div>
                          </div>

                          {/* Desktop Layout */}
                          <div className="hidden sm:flex items-center justify-between w-full">
                            {/* Left Side - Countdown */}
                            <div className="flex items-center space-x-6">
            <div className="text-center">
                                <div className="text-white text-xs font-medium mb-1 tracking-wider">TIME TO LAUNCH</div>
                                <div className="flex items-center space-x-3">
                                  <div className="text-center">
                                    <div className="text-3xl font-bold text-blue-400 font-mono">{missionState.currentMission.countdown.days}</div>
                                    <div className="text-xs text-gray-400 font-medium">DAYS</div>
            </div>
                                  <div className="text-blue-400 text-2xl font-mono">:</div>
                                  <div className="text-center">
                                    <div className="text-3xl font-bold text-blue-400 font-mono">{missionState.currentMission.countdown.hours}</div>
                                    <div className="text-xs text-gray-400 font-medium">HRS</div>
                                  </div>
                                  <div className="text-blue-400 text-2xl font-mono">:</div>
                                  <div className="text-center">
                                    <div className="text-3xl font-bold text-blue-400 font-mono">{missionState.currentMission.countdown.minutes}</div>
                                    <div className="text-xs text-gray-400 font-medium">MIN</div>
                                  </div>
                                  <div className="text-blue-400 text-2xl font-mono">:</div>
                                  <div className="text-center">
                                    <div className="text-3xl font-bold text-blue-400 font-mono">{missionState.currentMission.countdown.seconds}</div>
                                    <div className="text-xs text-gray-400 font-medium">SEC</div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Center - Mission Status */}
                            <div className="flex items-center space-x-4">
            <div className="text-center">
                                <div className="text-white text-xs font-medium mb-1 tracking-wider">MISSION STATUS</div>
                                <div className={`px-3 py-1 rounded-full text-sm font-bold ${getStatusColor(missionState.currentMission.status)}`}>
                                  {missionState.currentMission.status.toUpperCase()}
            </div>
                              </div>
                              
                              <div className="h-12 w-px bg-blue-500/30"></div>
                              
                              <div className="text-center">
                                <div className="text-white text-xs font-medium mb-1 tracking-wider">WEATHER</div>
                                <div className={`px-3 py-1 rounded-full text-sm font-bold ${getGoNoGoColor(missionState.currentMission.weather.goNoGo)}`}>
                                  {missionState.currentMission.weather.goNoGo}
              </div>
              </div>
              </div>

                            {/* Right Side - Additional Info */}
                            <div className="text-right">
                              <div className="text-white text-xs font-medium mb-1 tracking-wider">LAUNCH SITE</div>
                              <div className="text-gray-300 text-sm">{missionState.currentMission.launchSite}</div>
            </div>
                          </div>
                        </div>
                      </div>

                      {/* Animated Grid Lines */}
                      <div className="absolute inset-0">
                        {/* Horizontal Lines */}
                        <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent animate-pulse"></div>
                        <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                        <div className="absolute top-3/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent animate-pulse" style={{ animationDelay: '1s' }}></div>
                        
                        {/* Vertical Lines */}
                        <div className="absolute left-1/4 top-0 w-px h-full bg-gradient-to-b from-transparent via-blue-500/20 to-transparent animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                        <div className="absolute left-1/2 top-0 w-px h-full bg-gradient-to-b from-transparent via-blue-500/30 to-transparent animate-pulse" style={{ animationDelay: '0.8s' }}></div>
                        <div className="absolute left-3/4 top-0 w-px h-full bg-gradient-to-b from-transparent via-blue-500/20 to-transparent animate-pulse" style={{ animationDelay: '1.3s' }}></div>
              </div>

                      {/* Corner Brackets - Positioned to not overlap content */}
                      <div className="absolute top-16 left-4 w-8 h-8 border-t-2 border-l-2 border-blue-500/40 rounded-tl-lg"></div>
                      <div className="absolute top-16 right-4 w-8 h-8 border-t-2 border-r-2 border-blue-500/40 rounded-tr-lg"></div>
                      <div className="absolute bottom-20 left-4 w-8 h-8 border-b-2 border-l-2 border-blue-500/40 rounded-bl-lg"></div>
                      <div className="absolute bottom-20 right-4 w-8 h-8 border-b-2 border-r-2 border-blue-500/40 rounded-br-lg"></div>

                      {/* Data Stream Effects */}
                      <div className="absolute top-1/3 left-6 w-1 h-20 bg-gradient-to-b from-transparent via-cyan-400/60 to-transparent animate-pulse" style={{ animationDelay: '2s' }}></div>
                      <div className="absolute top-2/3 right-6 w-1 h-20 bg-gradient-to-b from-transparent via-purple-400/60 to-transparent animate-pulse" style={{ animationDelay: '2.5s' }}></div>
              </div>
              </div>
                )}

                {/* Fullscreen Video Status Overlay */}
                {videoOverlay !== 'none' && (
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-10">
                    <div className="text-center p-8">
                      {videoOverlay === 'starting-soon' && (
                        <>
                          <div className="w-24 h-24 mx-auto mb-6 bg-blue-600 rounded-full flex items-center justify-center animate-pulse">
                            <ClockIcon className="h-12 w-12 text-white" />
              </div>
                          <h2 className="text-4xl font-bold text-white mb-4">STARTING SOON</h2>
                          <p className="text-xl text-gray-300">Mission Control will begin shortly</p>
                          <div className="mt-6 flex items-center justify-center space-x-2">
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
                        </>
                      )}

                      {videoOverlay === 'technical-difficulties' && (
                        <>
                          <div className="w-24 h-24 mx-auto mb-6 bg-red-600 rounded-full flex items-center justify-center animate-pulse">
                            <AlertCircleIcon className="h-12 w-12 text-white" />
              </div>
                          <h2 className="text-4xl font-bold text-red-400 mb-4">TECHNICAL DIFFICULTIES</h2>
                          <p className="text-xl text-gray-300 mb-2">We are experiencing technical issues</p>
                          <p className="text-lg text-gray-400">Please stand by while we resolve this</p>
                          <div className="mt-6 flex items-center justify-center space-x-2">
                            <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                            <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
                        </>
                      )}

                      {videoOverlay === 'standby' && (
                        <>
                          <div className="w-24 h-24 mx-auto mb-6 bg-yellow-600 rounded-full flex items-center justify-center animate-pulse">
                            <PauseCircleIcon className="h-12 w-12 text-white" />
              </div>
                          <h2 className="text-4xl font-bold text-yellow-400 mb-4">STANDBY</h2>
                          <p className="text-xl text-gray-300 mb-2">Mission Control is on standby</p>
                          <p className="text-lg text-gray-400">Waiting for next phase</p>
                          <div className="mt-6 flex items-center justify-center space-x-2">
                            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
                            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-ping" style={{ animationDelay: '0.3s' }}></div>
                            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-ping" style={{ animationDelay: '0.6s' }}></div>
            </div>
                        </>
                      )}

                      {videoOverlay === 'maintenance' && (
                        <>
                          <div className="w-24 h-24 mx-auto mb-6 bg-gray-600 rounded-full flex items-center justify-center animate-pulse">
                            <SettingsIcon className="h-12 w-12 text-white" />
        </div>
                          <h2 className="text-4xl font-bold text-gray-300 mb-4">MAINTENANCE</h2>
                          <p className="text-xl text-gray-300 mb-2">System maintenance in progress</p>
                          <p className="text-lg text-gray-400">We'll be back shortly</p>
                          <div className="mt-6 flex items-center justify-center space-x-2">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                          </div>
                        </>
                      )}

                      {videoOverlay === 'custom' && (
                        <>
                          <div className="w-24 h-24 mx-auto mb-6 bg-purple-600 rounded-full flex items-center justify-center animate-pulse">
                            <MessageSquareIcon className="h-12 w-12 text-white" />
          </div>
                          <h2 className="text-4xl font-bold text-purple-400 mb-4">ANNOUNCEMENT</h2>
                          <p className="text-xl text-gray-300 mb-2">{customOverlayText || 'Custom message'}</p>
                          <div className="mt-6 flex items-center justify-center space-x-2">
                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mission Data Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
            {/* Weather Conditions */}
            <div className="bg-gray-900 rounded-lg p-4 sm:p-6 border border-gray-700">
              <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 flex items-center">
                <CloudIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-400" />
                Weather Conditions
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Temperature:</span>
                  <span>{missionState.currentMission.weather.temperature}°C</span>
              </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Wind Speed:</span>
                  <span>{missionState.currentMission.weather.windSpeed} km/h</span>
                      </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Visibility:</span>
                  <span>{missionState.currentMission.weather.visibility} km</span>
                      </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Conditions:</span>
                  <span>{missionState.currentMission.weather.conditions}</span>
              </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Go/No-Go:</span>
                  <span className={`px-3 py-1 rounded-full border text-sm font-medium ${getGoNoGoColor(missionState.currentMission.weather.goNoGo)}`}>
                    {missionState.currentMission.weather.goNoGo}
                      </span>
                    </div>
                    </div>
                  </div>

            {/* Mission Objectives */}
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-bold mb-4 flex items-center">
                <TargetIcon className="h-5 w-5 mr-2 text-blue-400" />
                Mission Objectives
              </h3>
              <ul className="space-y-2">
                {missionState.currentMission.objectives.map((objective, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-sm">{objective}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Mission Timeline */}
          <div className="bg-gray-900 rounded-lg p-6 mb-6 border border-gray-700">
            <h3 className="text-lg font-bold mb-4 flex items-center">
              <ActivityIcon className="h-5 w-5 mr-2 text-blue-400" />
              Mission Timeline
            </h3>
            <div className="space-y-3">
              {missionState.currentMission.milestones.map((milestone, index) => (
                <div key={milestone.id} className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${
                    milestone.status === 'completed' ? 'bg-green-400' :
                    milestone.status === 'current' ? 'bg-blue-400' :
                    milestone.status === 'failed' ? 'bg-red-400' :
                    'bg-gray-400'
                  }`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{milestone.name}</span>
                      <span className="text-sm text-gray-400">{milestone.time}</span>
                    </div>
                    <p className="text-sm text-gray-400">{milestone.description}</p>
                    </div>
                  </div>
              ))}
            </div>
          </div>

          {/* Live Updates */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-bold mb-4 flex items-center">
              <RadioIcon className="h-5 w-5 mr-2 text-blue-400" />
              Live Updates
            </h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {missionState.currentMission.liveUpdates.map((update) => (
                <div key={update.id} className="flex items-start space-x-3 p-3 bg-gray-800 rounded-lg">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    update.type === 'success' ? 'bg-green-400' :
                    update.type === 'warning' ? 'bg-yellow-400' :
                    update.type === 'error' ? 'bg-red-400' :
                    'bg-blue-400'
                  }`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{update.author}</span>
                      <span className="text-xs text-gray-400">
                        {new Date(update.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300">{update.message}</p>
                    </div>
                  </div>
              ))}
            </div>
            
            {missionState.adminMode && (
              <div className="mt-4 flex space-x-2">
                <input
                  type="text"
                  value={newUpdate}
                  onChange={(e) => setNewUpdate(e.target.value)}
                  placeholder="Add live update..."
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={addLiveUpdate}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
                >
                  Send
                </button>
          </div>
        )}
          </div>
        </div>

        {/* Admin Panel */}
        {showAdminPanel && missionState.adminMode && (
          <div className="w-full lg:w-80 bg-gray-900 border-t lg:border-t-0 lg:border-l border-gray-700 p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-bold mb-4">Admin Controls</h3>
            
            {/* Video Feed Controls */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-400 mb-2">Video Feed</h4>
              <div className="space-y-3">
              <div>
                  <label className="text-xs text-gray-400 mb-1 block">Custom Video URL</label>
                  <input
                    type="url"
                    value={videoFeedUrl}
                    onChange={async (e) => {
                      console.log('🎬 Video URL input changed:', e.target.value);
                      console.log('🧪 INPUT TEST - onChange handler is working!');
                      setVideoFeedUrl(e.target.value);
                      // Auto-save video URL to database
                      if (missionState.sessionId && e.target.value) {
                        console.log('💾 Auto-saving video URL:', e.target.value, 'Session ID:', missionState.sessionId);
                        try {
                          await missionControlAPI.updateSession(missionState.sessionId, {
                            liveStreamUrl: e.target.value
                          });
                          console.log('✅ Video URL auto-saved successfully');
                        } catch (error) {
                          console.error('❌ Error auto-saving video URL:', error);
                        }
                      } else {
                        console.log('❌ Cannot auto-save video URL - Session ID:', missionState.sessionId, 'Value:', e.target.value);
                      }
                    }}
                    placeholder="https://www.youtube.com/embed/VIDEO_ID"
                    className="w-full p-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm"
                  />
              </div>
                
                {/* Simulation Status */}
                {isSimulatingLive && (
                  <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-medium text-blue-400">Simulation Active</div>
                        <div className="text-xs text-blue-300">Custom video is playing</div>
                      </div>
                      <button
                        onClick={async () => {
                          stopVideoSimulation();
                          if (missionState.sessionId) {
                            await addMissionUpdate(
                              'technical',
                              'Video Simulation Stopped',
                              'Live video simulation deactivated'
                            );
                          }
                        }}
                        className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded"
                      >
                        Stop
                </button>
              </div>
            </div>
                )}

                {/* Force Reset Button */}
                <button
                  onClick={() => {
                    setIsSimulatingLive(false);
                    setVideoFeedUrl('');
                    console.log('🔄 Force reset simulation state');
                  }}
                  className="w-full px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-xs rounded-lg font-medium transition-colors"
                >
                  Force Reset Video State
              </button>
                
                <div className="flex space-x-2">
                  <button
                    onClick={async () => {
                      if (videoFeedUrl) {
                        setIsSimulatingLive(true);
                        // Auto-save video simulation start to database
                        if (missionState.sessionId) {
                          await addMissionUpdate(
                            'technical',
                            'Video Simulation Started',
                            'Live video simulation activated'
                          );
                        }
                      }
                    }}
                    disabled={!videoFeedUrl}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      !videoFeedUrl 
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    <PlayIcon className="h-3 w-3 mr-1 inline" />
                    Load Video
              </button>
                  <button
                    onClick={async () => {
                      stopVideoSimulation();
                      // Auto-save video simulation stop to database
                      if (missionState.sessionId) {
                        await addMissionUpdate(
                          'technical',
                          'Video Simulation Stopped',
                          'Live video simulation deactivated'
                        );
                      }
                    }}
                    disabled={!isSimulatingLive}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      !isSimulatingLive 
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                        : 'bg-red-600 hover:bg-red-700 text-white'
                    }`}
                  >
                    <SquareIcon className="h-3 w-3 mr-1 inline" />
                    Stop
              </button>
                </div>
              </div>
            </div>

            {/* Mission Selection */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-400 mb-2">Select Mission</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {/* ISS Live Feed Option */}
                <button
                  onClick={() => {
                    const issMission = {
                      id: 'iss-live-feed',
                      name: 'ISS Live Feed',
                      net: new Date().toISOString(),
                      status: { name: 'Live' },
                      launch_service_provider: { name: 'NASA' },
                      rocket: { configuration: { name: 'ISS' } },
                      mission: { 
                        name: 'International Space Station', 
                        description: 'Live views from the International Space Station orbiting Earth at 408 km altitude',
                        orbit: { name: 'Low Earth Orbit (408 km)' }
                      },
                      pad: { name: 'Low Earth Orbit' },
                      image: 'https://www.nasa.gov/sites/default/files/thumbnails/image/iss056e123456.jpg'
                    };
                    selectMission(issMission);
                  }}
                  className={`w-full text-left p-2 rounded-lg text-sm transition-colors ${
                    missionState.currentMission?.id === 'iss-live-feed'
                      ? 'bg-blue-900/50 border border-blue-400/50'
                      : 'bg-blue-900/30 hover:bg-blue-800/30 border border-blue-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-blue-300">ISS Live Feed</div>
                    <div className="flex items-center space-x-1 text-green-400">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-xs">LIVE</span>
                    </div>
                  </div>
                  <div className="text-xs text-blue-400">
                    NASA International Space Station - 24/7 Live Stream
                  </div>
              </button>
                
                {upcomingLaunches?.results?.slice(0, 10).map((launch) => {
                  const missionStatus = getMissionStatus(launch);
                  const statusColor = getStatusColor(missionStatus);
                  const statusIcon = getStatusIcon(missionStatus);
                  
                  return (
                    <button
                      key={launch.id}
                      onClick={() => selectMission(launch)}
                      className="w-full text-left p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
                    >
                    <div className="flex items-center justify-between">
                        <div className="font-medium">{launch.name}</div>
                        <div className={`flex items-center space-x-1 ${statusColor}`}>
                          {statusIcon}
                          <span className="text-xs">{missionStatus.toUpperCase()}</span>
                      </div>
                    </div>
                      <div className="text-xs text-gray-400">
                        {new Date(launch.net).toLocaleDateString()} at {new Date(launch.net).toLocaleTimeString()}
                      </div>
              </button>
                  );
                })}
              </div>
            </div>

            {/* Mission Status */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-400 mb-2">Mission Status</h4>
              <select 
                value={missionState.currentMission?.status || 'scheduled'}
                onChange={async (e) => {
                  console.log('📊 Mission status changed:', e.target.value);
                  if (missionState.currentMission) {
                    setMissionState(prev => ({
                      ...prev,
                      currentMission: {
                        ...prev.currentMission!,
                        status: e.target.value as any
                      }
                    }));
                    
                    // Auto-save mission status to database
                    if (missionState.sessionId) {
                      console.log('💾 Auto-saving mission status:', e.target.value, 'Session ID:', missionState.sessionId);
                      try {
                        await missionControlAPI.updateSession(missionState.sessionId, {
                          status: e.target.value
                        });
                        
                        // Add status update to mission updates
                        await addMissionUpdate(
                          'status',
                          'Mission Status Updated',
                          `Mission status changed to ${e.target.value.toUpperCase()}`
                        );
                        console.log('✅ Mission status auto-saved successfully');
                      } catch (error) {
                        console.error('❌ Error auto-saving mission status:', error);
                      }
                    } else {
                      console.log('❌ Cannot auto-save mission status - No session ID');
                    }
                  }
                }}
                className="w-full p-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
              >
                <option value="scheduled">Scheduled</option>
                <option value="upcoming">Upcoming</option>
                <option value="live">Live</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
                <option value="delayed">Delayed</option>
              </select>
                </div>

            {/* Weather Override */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-400 mb-2">Weather Override</h4>
              <select 
                value={missionState.currentMission?.weather.goNoGo || 'CONDITIONAL'}
                onChange={async (e) => {
                  if (missionState.currentMission) {
                    setMissionState(prev => ({
                      ...prev,
                      currentMission: {
                        ...prev.currentMission!,
                        weather: {
                          ...prev.currentMission!.weather,
                          goNoGo: e.target.value as any
                        }
                      }
                    }));
                    
                    // Auto-save weather data to database
                    if (missionState.sessionId) {
                      await saveWeatherData({
                        ...missionState.currentMission.weather,
                        goNoGo: e.target.value as any
                      });
                      
                      // Add weather update to mission updates
                      await addMissionUpdate(
                        'weather',
                        'Weather Status Updated',
                        `Weather status changed to ${e.target.value}`
                      );
                    }
                  }
                }}
                className="w-full p-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
              >
                <option value="GO">GO</option>
                <option value="NO-GO">NO-GO</option>
                <option value="CONDITIONAL">CONDITIONAL</option>
              </select>
                </div>

            {/* Overlay Controls */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-400 mb-2">Overlay Controls</h4>
                  <div className="space-y-2">
                <button
                  onClick={async () => {
                    setOverlayVisible(!overlayVisible);
                    // Auto-save overlay visibility to database
                    if (missionState.sessionId) {
                      await addMissionUpdate(
                        'technical',
                        'Overlay Visibility Changed',
                        `Video overlay ${!overlayVisible ? 'shown' : 'hidden'}`
                      );
                    }
                  }}
                  className={`w-full px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    overlayVisible 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-gray-600 hover:bg-gray-700 text-white'
                  }`}
                >
                  {overlayVisible ? 'Hide Overlay' : 'Show Overlay'}
                </button>
                <div className="text-xs text-gray-500">
                  Overlay shows mission info, countdown, and branding on video feed
                </div>
              </div>
                    </div>
                    

            {/* Video Status Overlay Controls */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-400 mb-2">Video Status Overlay</h4>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Status Type</label>
                  <select
                    value={videoOverlay}
                    onChange={async (e) => {
                      const newOverlay = e.target.value as any;
                      setVideoOverlay(newOverlay);
                      
                      // Always save to database, including 'none'
                      await saveVideoOverlay(newOverlay, newOverlay === 'custom' ? customOverlayText : undefined);
                      
                      // Add mission update to notify all users
                      if (missionState.sessionId) {
                        await addMissionUpdate(
                          'technical',
                          'Video Overlay Changed',
                          `Video status overlay changed to: ${newOverlay === 'none' ? 'None' : newOverlay.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}`
                        );
                      }
                    }}
                    className="w-full p-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-xs"
                  >
                    <option value="none">None</option>
                    <option value="starting-soon">Starting Soon</option>
                    <option value="technical-difficulties">Technical Difficulties</option>
                    <option value="standby">Standby</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="custom">Custom Message</option>
                  </select>
                    </div>

                {videoOverlay === 'custom' && (
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Custom Message</label>
                    <input
                      type="text"
                      value={customOverlayText}
                      onChange={async (e) => {
                        setCustomOverlayText(e.target.value);
                        // Auto-save custom overlay text to database
                        if (missionState.sessionId && videoOverlay === 'custom') {
                          await saveVideoOverlay('custom', e.target.value);
                          
                          // Add mission update to notify all users
                          await addMissionUpdate(
                            'technical',
                            'Custom Overlay Text Updated',
                            `Custom video overlay text updated: "${e.target.value}"`
                          );
                        }
                      }}
                      placeholder="Enter custom message..."
                      className="w-full p-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-xs"
                    />
                  </div>
                )}
                
                <div className="text-xs text-gray-500">
                  Overlay appears over the video player to show status messages
                    </div>
                  </div>
            </div>
          </div>
        )}
        </div>
      ) : (
        /* Dashboard Content */
        <div className="p-3 sm:p-6">
          <div className="max-w-7xl mx-auto">
            {/* Dashboard Header */}
            <div className="mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Space & STEM Dashboard</h2>
              <p className="text-gray-400 text-sm sm:text-base">Comprehensive overview of space missions, scientific data, and space exploration activities</p>
            </div>

            {/* Top Ad for Dashboard */}
            <div className="flex justify-center mb-8">
              <div className="w-full max-w-md">
                <BannerAd />
              </div>
            </div>

            {/* Dashboard Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
              {/* Upcoming Launches */}
              <CompactCard title="Upcoming Launches" icon={<RocketIcon className="h-4 w-4 text-blue-400" />} colorClass="blue">
                {launchesLoading ? (
                  <LoadingCard title="Loading launches..." />
                ) : upcomingLaunches?.error ? (
                  <ErrorCard title="Launches" error="Failed to load launches" />
                ) : (
                  <div className="space-y-2">
                    {upcomingLaunches?.results?.slice(0, 3).map((launch, index) => (
                      <div key={launch.id} className="text-xs">
                        <div className="font-medium text-white truncate">{launch.name}</div>
                        <div className="text-gray-400">
                          {new Date(launch.net).toLocaleDateString()}
                    </div>
                  </div>
              ))}
            </div>
                )}
            </CompactCard>

              {/* People in Space */}
              <CompactCard title="People in Space" icon={<UsersIcon className="h-4 w-4 text-green-400" />} colorClass="green">
                {peopleInSpaceLoading ? (
                  <LoadingCard title="Loading..." />
                ) : peopleInSpaceError ? (
                  <ErrorCard title="People in Space" error="Failed to load people in space data" />
                ) : (
                <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">{peopleInSpace?.number || 0}</div>
                    <div className="text-xs text-gray-400">Currently in space</div>
                </div>
                )}
              </CompactCard>
              
              {/* ISS Location */}
              <CompactCard title="ISS Location" icon={<GlobeIcon className="h-4 w-4 text-cyan-400" />} colorClass="cyan">
                {issLocationLoading ? (
                  <LoadingCard title="Loading..." />
                ) : issLocationError ? (
                  <ErrorCard title="ISS Location" error="Failed to load ISS location" />
                ) : (
                  <div className="text-xs">
                    <div className="text-white">
                      Lat: {issLocation?.iss_position?.latitude ? 
                        parseFloat(issLocation.iss_position.latitude).toFixed(2) : 
                        issLocation?.latitude ? issLocation.latitude.toFixed(2) : 'N/A'}°
                  </div>
                    <div className="text-white">
                      Lon: {issLocation?.iss_position?.longitude ? 
                        parseFloat(issLocation.iss_position.longitude).toFixed(2) : 
                        issLocation?.longitude ? issLocation.longitude.toFixed(2) : 'N/A'}°
                </div>
                    <div className="text-gray-400">
                      Altitude: {issLocation?.altitude ? issLocation.altitude.toFixed(0) : '~408'} km
                </div>
                    <div className="text-gray-400 mt-1">
                      Velocity: {issLocation?.velocity ? issLocation.velocity.toFixed(0) : '~27,600'} km/h
              </div>
                  </div>
                )}
              </CompactCard>
              
              {/* Mars Weather */}
              <CompactCard title="Mars Weather" icon={<ThermometerIcon className="h-4 w-4 text-orange-400" />} colorClass="orange">
                {marsWeatherLoading ? (
                  <LoadingCard title="Loading..." />
                ) : marsWeatherError ? (
                  <ErrorCard title="Mars Weather" error="Failed to load Mars weather" />
                ) : (
                  <div className="text-xs">
                    <div className="text-white">High: {marsWeather?.max_temp}°C</div>
                    <div className="text-white">Low: {marsWeather?.min_temp}°C</div>
                    <div className="text-gray-400">Sol: {marsWeather?.sol}</div>
                  </div>
                )}
              </CompactCard>
              
              {/* Moon Phase */}
              <CompactCard title="Moon Phase" icon={<MoonIcon className="h-4 w-4 text-purple-400" />} colorClass="purple">
          {moonPhaseLoading ? (
                  <LoadingCard title="Loading..." />
          ) : moonPhaseError ? (
                  <ErrorCard title="Moon Phase" error="Failed to load moon phase" />
                ) : (
                <div className="text-center">
                    <div className="text-lg font-bold text-purple-400">{moonPhase?.phase_name}</div>
                    <div className="text-xs text-gray-400">{moonPhase?.illumination}% illuminated</div>
                  </div>
                )}
              </CompactCard>

              {/* Solar Activity */}
              <CompactCard title="Solar Activity" icon={<SunIcon className="h-4 w-4 text-yellow-400" />} colorClass="orange">
                {solarActivityLoading ? (
                  <LoadingCard title="Loading..." />
                ) : solarActivityError ? (
                  <ErrorCard title="Solar Activity" error="Failed to load solar activity" />
                ) : (
                  <div className="text-xs">
                    <div className="text-white">Flux: {solarActivity?.solar_flux}</div>
                    <div className="text-white">Index: {solarActivity?.k_index}</div>
                    <div className="text-gray-400">Status: {solarActivity?.status}</div>
                </div>
        )}
              </CompactCard>
              
              {/* Near Earth Objects */}
              <CompactCard title="Near Earth Objects" icon={<TargetIcon className="h-4 w-4 text-red-400" />} colorClass="red">
                {nearEarthObjectsLoading ? (
                  <LoadingCard title="Loading..." />
                ) : nearEarthObjectsError ? (
                  <ErrorCard title="NEOs" error="Failed to load near earth objects" />
                ) : (
                <div className="text-center">
                    <div className="text-2xl font-bold text-red-400">
                      {nearEarthObjects?.near_earth_objects ? 
                        Object.keys(nearEarthObjects.near_earth_objects).length : 
                        nearEarthObjects?.element_count || 0}
                  </div>
                    <div className="text-xs text-gray-400">Objects today</div>
                    {nearEarthObjects?.near_earth_objects && Object.keys(nearEarthObjects.near_earth_objects).length > 0 && (
                      <div className="mt-2 text-xs text-gray-500">
                        {(() => {
                          const allObjects = Object.values(nearEarthObjects.near_earth_objects).flat();
                          const maxDiameter = Math.max(...allObjects.map(obj => 
                            obj.estimated_diameter?.meters?.estimated_diameter_max || 0
                          ));
                          return maxDiameter > 0 ? `Largest: ${maxDiameter.toFixed(0)}m` : '';
                        })()}
                </div>
                    )}
                  </div>
        )}
              </CompactCard>

              {/* Space News */}
              <CompactCard title="Latest News" icon={<BookOpenIcon className="h-4 w-4 text-indigo-400" />} colorClass="indigo">
                {spaceNewsLoading ? (
                  <LoadingCard title="Loading..." />
                ) : spaceNewsError ? (
                  <ErrorCard title="Space News" error="Failed to load space news" />
                ) : (
                  <div className="space-y-2">
                    {spaceNews?.articles?.slice(0, 2).map((article, index) => (
                      <div key={index} className="text-xs">
                        <div className="font-medium text-white truncate">{article.title}</div>
                        <div className="text-gray-400">{article.publishedAt}</div>
            </div>
                    ))}
          </div>
        )}
                </CompactCard>
            </div>

            {/* Middle Ad for Dashboard */}
            <div className="flex justify-center my-8">
              <div className="w-full max-w-lg">
                <InContentAd />
              </div>
            </div>

            {/* Additional Dashboard Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* NASA APOD */}
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-bold mb-4 flex items-center">
                  <CameraIcon className="h-5 w-5 mr-2 text-blue-400" />
                  NASA Astronomy Picture of the Day
                </h3>
          {nasaAPODLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-400/30 border-t-blue-400"></div>
                </div>
          ) : nasaAPODError ? (
                  <div className="text-red-400 text-center py-8">Failed to load APOD</div>
                ) : (
                  <div>
                    <img 
                      src={nasaAPOD?.url} 
                      alt={nasaAPOD?.title}
                      className="w-full h-48 object-cover rounded-lg mb-4 cursor-pointer"
                      onClick={() => setApodModalOpen(true)}
                    />
                    <h4 className="font-semibold text-white mb-2">{nasaAPOD?.title}</h4>
                    <p className="text-sm text-gray-400">{nasaAPOD?.explanation?.substring(0, 200)}...</p>
          </div>
        )}
                </div>

              {/* Space Events */}
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-bold mb-4 flex items-center">
                  <CalendarIcon className="h-5 w-5 mr-2 text-green-400" />
                  Upcoming Space Events
                </h3>
                {spaceEventsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-400/30 border-t-green-400"></div>
                    </div>
                ) : spaceEventsError ? (
                  <div className="text-red-400 text-center py-8">Failed to load events</div>
                ) : (
                  <div className="space-y-3">
                    {spaceEvents?.events?.slice(0, 5).map((event, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-gray-800 rounded-lg">
                        <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="font-medium text-white text-sm">{event.title}</div>
                          <div className="text-xs text-gray-400">{event.date}</div>
                          <div className="text-xs text-gray-500 mt-1">{event.description}</div>
                    </div>
                  </div>
              ))}
          </div>
        )}
              </div>
            </div>
            
            {/* Additional Dashboard Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Previous Launches */}
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-bold mb-4 flex items-center">
                  <RocketIcon className="h-5 w-5 mr-2 text-green-400" />
                  Recent Launches
                </h3>
                {previousLaunchesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-400/30 border-t-green-400"></div>
                </div>
                ) : previousLaunchesError ? (
                  <div className="text-red-400 text-center py-8">Failed to load recent launches</div>
                ) : (
                  <div className="space-y-3">
                    {previousLaunches?.results?.slice(0, 5).map((launch, index) => (
                      <div key={launch.id} className="flex items-start space-x-3 p-3 bg-gray-800 rounded-lg">
                        <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="font-medium text-white text-sm">{launch.name}</div>
                          <div className="text-xs text-gray-400">{new Date(launch.net).toLocaleDateString()}</div>
                          <div className="text-xs text-gray-500 mt-1">{launch.launch_service_provider?.name}</div>
                    </div>
                  </div>
                ))}
              </div>
                )}
            </div>

              {/* Space Agencies */}
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-bold mb-4 flex items-center">
                  <GlobeIcon className="h-5 w-5 mr-2 text-purple-400" />
                  Space Agencies
                </h3>
                {spaceAgenciesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-400/30 border-t-purple-400"></div>
                </div>
                ) : spaceAgenciesError ? (
                  <div className="text-red-400 text-center py-8">Failed to load agencies</div>
                ) : (
                  <div className="space-y-3">
                    {spaceAgencies?.results?.slice(0, 5).map((agency, index) => (
                      <div key={agency.id} className="flex items-center space-x-3 p-3 bg-gray-800 rounded-lg">
                        <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">{agency.name.charAt(0)}</span>
            </div>
                        <div className="flex-1">
                          <div className="font-medium text-white text-sm">{agency.name}</div>
                          <div className="text-xs text-gray-400">{agency.country_code}</div>
              </div>
              </div>
                    ))}
              </div>
                )}
            </div>

              {/* SpaceX Company Info */}
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-bold mb-4 flex items-center">
                  <RocketIcon className="h-5 w-5 mr-2 text-blue-400" />
                  SpaceX
                </h3>
                {spaceXCompanyLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-400/30 border-t-blue-400"></div>
                </div>
                ) : spaceXCompanyError ? (
                  <div className="text-red-400 text-center py-8">Failed to load SpaceX data</div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-sm">
                      <div className="text-white font-medium">{spaceXCompany?.name}</div>
                      <div className="text-gray-400 text-xs">{spaceXCompany?.founding_year}</div>
              </div>
                    <div className="text-xs text-gray-300">
                      {spaceXCompany?.description?.substring(0, 150)}...
              </div>
                    <div className="flex items-center space-x-4 text-xs">
                      <div>
                        <span className="text-gray-400">CEO:</span>
                        <span className="text-white ml-1">{spaceXCompany?.ceo}</span>
              </div>
            </div>
                  </div>
                )}
              </div>
            </div>

            {/* More Dashboard Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* ISS Pass Predictions */}
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-bold mb-4 flex items-center">
                  <SatelliteIcon className="h-5 w-5 mr-2 text-cyan-400" />
                  ISS Pass Predictions
                </h3>
                {issPassLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-cyan-400/30 border-t-cyan-400"></div>
                </div>
                ) : issPassError ? (
                  <div className="text-red-400 text-center py-8">Failed to load ISS passes</div>
                ) : (
                  <div className="space-y-3">
                    {issPassPredictions?.passes?.length > 0 ? (
                      issPassPredictions.passes.slice(0, 3).map((pass, index) => (
                        <div key={index} className="p-3 bg-gray-800 rounded-lg">
                          <div className="text-sm text-white font-medium">
                            {new Date(pass.risetime * 1000).toLocaleString()}
            </div>
                          <div className="text-xs text-gray-400">
                            Duration: {Math.floor(pass.duration / 60)} minutes
              </div>
            </div>
                      ))
                    ) : issPassPredictions?.response?.length > 0 ? (
                      issPassPredictions.response.slice(0, 3).map((pass, index) => (
                        <div key={index} className="p-3 bg-gray-800 rounded-lg">
                          <div className="text-sm text-white font-medium">
                            {new Date(pass.risetime * 1000).toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-400">
                            Duration: {Math.floor(pass.duration / 60)} minutes
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-gray-400">
                        <div className="text-sm">No ISS passes available</div>
                        <div className="text-xs">Check your location settings</div>
        </div>
        )}
          </div>
        )}
      </div>

              {/* Hubble Images */}
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-bold mb-4 flex items-center">
                  <TelescopeIcon className="h-5 w-5 mr-2 text-indigo-400" />
                  Hubble Images
                </h3>
                {hubbleImagesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-400/30 border-t-indigo-400"></div>
                    </div>
                ) : hubbleImagesError ? (
                  <div className="text-red-400 text-center py-8">Failed to load Hubble images</div>
                ) : (
                  <div className="space-y-3">
                    {Array.isArray(hubbleImages) && hubbleImages.length > 0 ? (
                      hubbleImages.slice(0, 3).map((image, index) => (
                        <div key={index} className="p-3 bg-gray-800 rounded-lg">
                          <div className="text-sm text-white font-medium truncate">
                            {image.name || image.title || 'Hubble Image'}
                    </div>
                          <div className="text-xs text-gray-400">
                            {image.date_created?.substring(0, 10) || 
                             image.collection || 
                             'Hubble Space Telescope'}
                  </div>
            </div>
                      ))
                    ) : hubbleImages?.collection?.items?.length > 0 ? (
                      hubbleImages.collection.items.slice(0, 3).map((image, index) => (
                        <div key={index} className="p-3 bg-gray-800 rounded-lg">
                          <div className="text-sm text-white font-medium truncate">
                            {image.data?.[0]?.title || image.title || 'Hubble Image'}
          </div>
                          <div className="text-xs text-gray-400">
                            {image.data?.[0]?.date_created?.substring(0, 10) || 
                             image.date_created?.substring(0, 10) || 
                             'Unknown date'}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-gray-400">
                        <div className="text-sm">No Hubble images available</div>
                        <div className="text-xs">Try refreshing the page</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* More Comprehensive Dashboard Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Exoplanets */}
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-bold mb-4 flex items-center">
                  <StarIcon className="h-5 w-5 mr-2 text-yellow-400" />
                  Exoplanets
                </h3>
                {exoplanetsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-yellow-400/30 border-t-yellow-400"></div>
                    </div>
                ) : exoplanetsError ? (
                  <div className="text-red-400 text-center py-8">Failed to load exoplanets</div>
                ) : (
                  <div className="space-y-3">
                    {Array.isArray(exoplanets) && exoplanets.length > 0 ? (
                      exoplanets.slice(0, 5).map((planet, index) => (
                        <div key={planet.pl_name || index} className="p-3 bg-gray-800 rounded-lg">
                          <div className="text-sm text-white font-medium">{planet.pl_name || 'Unknown Planet'}</div>
                          <div className="text-xs text-gray-400">
                            {planet.pl_orbper ? `${planet.pl_orbper.toFixed(1)} days` : 'Unknown period'} • 
                            {planet.pl_bmasse ? ` ${planet.pl_bmasse.toFixed(1)} Earth masses` : ' Unknown mass'}
                    </div>
                  </div>
                      ))
                    ) : exoplanets?.results?.length > 0 ? (
                      exoplanets.results.slice(0, 5).map((planet, index) => (
                        <div key={planet.id || index} className="p-3 bg-gray-800 rounded-lg">
                          <div className="text-sm text-white font-medium">{planet.name || 'Unknown Planet'}</div>
                          <div className="text-xs text-gray-400">
                            {planet.orbital_period ? `${planet.orbital_period} days` : 'Unknown period'} • 
                            {planet.mass ? ` ${planet.mass} Earth masses` : ' Unknown mass'}
            </div>
          </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-gray-400">
                        <div className="text-sm">No exoplanet data available</div>
                        <div className="text-xs">Try refreshing the page</div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Satellites */}
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-bold mb-4 flex items-center">
                  <SatelliteIcon className="h-5 w-5 mr-2 text-blue-400" />
                  Active Satellites
                </h3>
                {satellitesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-400/30 border-t-blue-400"></div>
                    </div>
                ) : satellitesError ? (
                  <div className="text-red-400 text-center py-8">Failed to load satellites</div>
                ) : (
                  <div className="space-y-3">
                    {Array.isArray(satellites) && satellites.length > 0 ? (
                      satellites.slice(0, 5).map((satellite, index) => (
                        <div key={satellite.satid || index} className="p-3 bg-gray-800 rounded-lg">
                          <div className="text-sm text-white font-medium">{satellite.satname || 'Unknown Satellite'}</div>
                          <div className="text-xs text-gray-400">
                            Altitude: {satellite.satalt ? `${satellite.satalt.toFixed(0)} km` : 'Unknown'}
                    </div>
                  </div>
                      ))
                    ) : satellites?.above?.length > 0 ? (
                      satellites.above.slice(0, 5).map((satellite, index) => (
                        <div key={index} className="p-3 bg-gray-800 rounded-lg">
                          <div className="text-sm text-white font-medium">{satellite.satname || 'Unknown Satellite'}</div>
                          <div className="text-xs text-gray-400">
                            Altitude: {satellite.satalt ? `${satellite.satalt} km` : 'Unknown'}
            </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-gray-400">
                        <div className="text-sm">No satellite data available</div>
                        <div className="text-xs">Try refreshing the page</div>
          </div>
        )}
              </div>
                )}
              </div>
            </div>

            {/* Earthquake Data */}
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-700 mb-8">
              <h3 className="text-lg font-bold mb-4 flex items-center">
                <WavesIcon className="h-5 w-5 mr-2 text-orange-400" />
                Recent Earthquakes
              </h3>
              {earthquakeDataLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-400/30 border-t-orange-400"></div>
            </div>
              ) : earthquakeDataError ? (
                <div className="text-red-400 text-center py-8">Failed to load earthquake data</div>
              ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {earthquakeData?.features?.slice(0, 6).map((earthquake, index) => (
                    <div key={index} className="p-3 bg-gray-800 rounded-lg">
                      <div className="text-sm text-white font-medium">
                        Magnitude {earthquake.properties.mag}
                    </div>
                      <div className="text-xs text-gray-400">
                        {earthquake.properties.place}
                    </div>
                      <div className="text-xs text-gray-500">
                        {new Date(earthquake.properties.time).toLocaleDateString()}
                    </div>
                  </div>
              ))}
            </div>
              )}
                </div>

            {/* Advanced Space Weather */}
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-700 mb-8">
              <h3 className="text-lg font-bold mb-4 flex items-center">
                <ZapIcon className="h-5 w-5 mr-2 text-purple-400" />
                Advanced Space Weather
              </h3>
              {advancedSpaceWeatherLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-400/30 border-t-purple-400"></div>
                  </div>
              ) : advancedSpaceWeatherError ? (
                <div className="text-red-400 text-center py-8">Failed to load space weather</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 bg-gray-800 rounded-lg text-center">
                    <div className="text-2xl font-bold text-purple-400">
                      {advancedSpaceWeather?.aurora_forecast?.kp_index || 
                       advancedSpaceWeather?.kp_index || 
                       advancedSpaceWeather?.kp || 
                       'N/A'}
                </div>
                    <div className="text-xs text-gray-400">Kp Index</div>
                  </div>
                  <div className="p-4 bg-gray-800 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-400">
                      {advancedSpaceWeather?.solar_wind?.speed || 
                       advancedSpaceWeather?.solar_wind_speed || 
                       advancedSpaceWeather?.wind_speed || 
                       'N/A'}
                </div>
                    <div className="text-xs text-gray-400">Solar Wind (km/s)</div>
                  </div>
                  <div className="p-4 bg-gray-800 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-400">
                      {advancedSpaceWeather?.solar_wind?.density || 
                       advancedSpaceWeather?.density || 
                       advancedSpaceWeather?.proton_density || 
                       'N/A'}
                </div>
                    <div className="text-xs text-gray-400">Density (p/cm³)</div>
            </div>
                  <div className="p-4 bg-gray-800 rounded-lg text-center">
                    <div className="text-2xl font-bold text-yellow-400">
                      {advancedSpaceWeather?.magnetic_field?.strength || 
                       advancedSpaceWeather?.bt || 
                       advancedSpaceWeather?.b_total || 
                       'N/A'}
          </div>
                    <div className="text-xs text-gray-400">B Total (nT)</div>
                  </div>
          </div>
        )}
            </div>

            {/* Debug Section - Remove in production */}
            {process.env.NODE_ENV === 'development' && (
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-700 mb-8">
                <h3 className="text-lg font-bold mb-4 text-yellow-400">Debug Info (Development Only)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <div className="text-white font-medium">ISS Pass Predictions:</div>
                    <div className="text-gray-400 break-all">
                      {issPassPredictions ? JSON.stringify(issPassPredictions, null, 2).substring(0, 200) + '...' : 'Loading...'}
                    </div>
                    </div>
                  <div>
                    <div className="text-white font-medium">Hubble Images:</div>
                    <div className="text-gray-400 break-all">
                      {hubbleImages ? JSON.stringify(hubbleImages, null, 2).substring(0, 200) + '...' : 'Loading...'}
                  </div>
            </div>
                  <div>
                    <div className="text-white font-medium">Exoplanets:</div>
                    <div className="text-gray-400 break-all">
                      {exoplanets ? JSON.stringify(exoplanets, null, 2).substring(0, 200) + '...' : 'Loading...'}
                </div>
                </div>
                  <div>
                    <div className="text-white font-medium">Satellites:</div>
                    <div className="text-gray-400 break-all">
                      {satellites ? JSON.stringify(satellites, null, 2).substring(0, 200) + '...' : 'Loading...'}
                </div>
                </div>
            </div>
          </div>
        )}

            {/* Bottom Ad for Dashboard */}
            <div className="flex justify-center mt-8">
              <div className="w-full max-w-md">
                <BannerAd />
      </div>
            </div>
          </div>
        </div>
      )}

      {/* APOD Modal */}
      {apodModalOpen && nasaAPOD && (
        <ImageModal
          isOpen={apodModalOpen}
          onClose={() => setApodModalOpen(false)}
          imageUrl={nasaAPOD.url}
          title={nasaAPOD.title}
          description={nasaAPOD.explanation}
        />
      )}
    </div>
  );
};

export default MissionControl;
