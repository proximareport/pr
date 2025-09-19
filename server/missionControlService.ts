import { pool } from './db';
import { v4 as uuidv4 } from 'uuid';

// Types for Mission Control
export interface MissionSession {
  id: number;
  sessionId: string;
  missionId: string;
  missionName: string;
  agency: string;
  launchDate: Date;
  status: string;
  description?: string;
  vehicle?: string;
  payload?: string;
  destination?: string;
  launchSite?: string;
  liveStreamUrl?: string;
  missionPatchUrl?: string;
  isLive: boolean;
  issFeedEnabled?: boolean;
  adminUserId?: number;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
}

export interface MissionUpdate {
  id: number;
  sessionId: string;
  updateType: string;
  title: string;
  content: string;
  author: string;
  priority: string;
  isPublic: boolean;
  createdAt: Date;
}

export interface MissionMilestone {
  id: number;
  sessionId: string;
  name: string;
  timeOffset: string;
  status: string;
  description?: string;
  sortOrder: number;
  createdAt: Date;
}

export interface MissionWeather {
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
  recordedAt: Date;
}

export interface VideoOverlay {
  id: number;
  sessionId: string;
  overlayType: string;
  customText?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MissionObjective {
  id: number;
  sessionId: string;
  objective: string;
  isCompleted: boolean;
  sortOrder: number;
  createdAt: Date;
}

export interface MissionCrew {
  id: number;
  sessionId: string;
  name: string;
  role: string;
  agency?: string;
  isCommander: boolean;
  sortOrder: number;
  createdAt: Date;
}

// Create a new mission session
export async function createMissionSession(data: {
  missionId: string;
  missionName: string;
  agency: string;
  launchDate: Date;
  description?: string;
  vehicle?: string;
  payload?: string;
  destination?: string;
  launchSite?: string;
  liveStreamUrl?: string;
  missionPatchUrl?: string;
  adminUserId?: number;
}): Promise<MissionSession> {
  const sessionId = uuidv4();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

  const query = `
    INSERT INTO mission_control_sessions (
      session_id, mission_id, mission_name, agency, launch_date, status, 
      description, vehicle, payload, destination, launch_site, 
      live_stream_url, mission_patch_url, admin_user_id, expires_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    RETURNING *
  `;

  const values = [
    sessionId,
    data.missionId,
    data.missionName,
    data.agency,
    data.launchDate,
    'standby',
    data.description || null,
    data.vehicle || null,
    data.payload || null,
    data.destination || null,
    data.launchSite || null,
    data.liveStreamUrl || null,
    data.missionPatchUrl || null,
    data.adminUserId || null,
    expiresAt
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
}

// Get the active mission session
export async function getActiveMissionSession(): Promise<MissionSession | null> {
  const query = `
    SELECT * FROM mission_control_sessions 
    WHERE expires_at > CURRENT_TIMESTAMP 
    ORDER BY created_at DESC 
    LIMIT 1
  `;

  const result = await pool.query(query);
  return result.rows[0] || null;
}

// Update mission session
export async function updateMissionSession(sessionId: string, updates: Partial<MissionSession>): Promise<MissionSession> {
  const allowedFields = [
    'mission_name', 'agency', 'launch_date', 'status', 'description', 
    'vehicle', 'payload', 'destination', 'launch_site', 'live_stream_url', 
    'mission_patch_url', 'is_live'
  ];

  // Map camelCase to snake_case
  const fieldMapping: { [key: string]: string } = {
    'missionName': 'mission_name',
    'liveStreamUrl': 'live_stream_url',
    'missionPatchUrl': 'mission_patch_url',
    'launchDate': 'launch_date',
    'launchSite': 'launch_site'
  };

  // Convert camelCase fields to snake_case
  const convertedUpdates: any = {};
  for (const [key, value] of Object.entries(updates)) {
    const dbField = fieldMapping[key] || key;
    if (allowedFields.includes(dbField)) {
      convertedUpdates[dbField] = value;
    }
  }

  const updateFields = Object.keys(convertedUpdates);
  
  if (updateFields.length === 0) {
    throw new Error('No valid fields to update');
  }

  const setClause = updateFields.map((field, index) => `${field} = $${index + 2}`).join(', ');
  const values = [sessionId, ...updateFields.map(field => convertedUpdates[field])];

  const query = `
    UPDATE mission_control_sessions 
    SET ${setClause}, updated_at = CURRENT_TIMESTAMP
    WHERE session_id = $1
    RETURNING *
  `;

  const result = await pool.query(query, values);
  
  if (result.rows.length === 0) {
    throw new Error('Mission session not found');
  }

  return result.rows[0];
}

// Delete mission session
export async function deleteMissionSession(sessionId: string): Promise<void> {
  const query = 'DELETE FROM mission_control_sessions WHERE session_id = $1';
  await pool.query(query, [sessionId]);
}

// Add mission update
export async function addMissionUpdate(data: {
  sessionId: string;
  updateType: string;
  title: string;
  content: string;
  author: string;
  priority?: string;
  isPublic?: boolean;
}): Promise<MissionUpdate> {
  const query = `
    INSERT INTO mission_updates (
      session_id, update_type, title, content, author, priority, is_public
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `;

  const values = [
    data.sessionId,
    data.updateType,
    data.title,
    data.content,
    data.author,
    data.priority || 'normal',
    data.isPublic !== false
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
}

// Get mission updates
export async function getMissionUpdates(sessionId: string): Promise<MissionUpdate[]> {
  const query = `
    SELECT * FROM mission_updates 
    WHERE session_id = $1 
    ORDER BY created_at DESC
  `;

  const result = await pool.query(query, [sessionId]);
  return result.rows;
}

// Add mission milestone
export async function addMissionMilestone(data: {
  sessionId: string;
  name: string;
  timeOffset: string;
  description?: string;
  sortOrder?: number;
}): Promise<MissionMilestone> {
  const query = `
    INSERT INTO mission_milestones (
      session_id, name, time_offset, description, sort_order
    ) VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;

  const values = [
    data.sessionId,
    data.name,
    data.timeOffset,
    data.description || null,
    data.sortOrder || 0
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
}

// Get mission milestones
export async function getMissionMilestones(sessionId: string): Promise<MissionMilestone[]> {
  const query = `
    SELECT * FROM mission_milestones 
    WHERE session_id = $1 
    ORDER BY sort_order ASC, created_at ASC
  `;

  const result = await pool.query(query, [sessionId]);
  return result.rows;
}

// Update mission milestone
export async function updateMissionMilestone(milestoneId: number, updates: Partial<MissionMilestone>): Promise<MissionMilestone> {
  const allowedFields = ['name', 'time_offset', 'status', 'description', 'sort_order'];
  const updateFields = Object.keys(updates).filter(key => allowedFields.includes(key));
  
  if (updateFields.length === 0) {
    throw new Error('No valid fields to update');
  }

  const setClause = updateFields.map((field, index) => `${field} = $${index + 2}`).join(', ');
  const values = [milestoneId, ...updateFields.map(field => updates[field as keyof MissionMilestone])];

  const query = `
    UPDATE mission_milestones 
    SET ${setClause}
    WHERE id = $1
    RETURNING *
  `;

  const result = await pool.query(query, values);
  
  if (result.rows.length === 0) {
    throw new Error('Mission milestone not found');
  }

  return result.rows[0];
}

// Add mission weather
export async function addMissionWeather(data: {
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
  const query = `
    INSERT INTO mission_weather (
      session_id, temperature, wind_speed, wind_direction, visibility, 
      humidity, conditions, go_no_go, weather_source
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `;

  const values = [
    data.sessionId,
    data.temperature || null,
    data.windSpeed || null,
    data.windDirection || null,
    data.visibility || null,
    data.humidity || null,
    data.conditions || null,
    data.goNoGo || 'TBD',
    data.weatherSource || null
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
}

// Get latest mission weather
export async function getLatestMissionWeather(sessionId: string): Promise<MissionWeather | null> {
  const query = `
    SELECT * FROM mission_weather 
    WHERE session_id = $1 
    ORDER BY recorded_at DESC 
    LIMIT 1
  `;

  const result = await pool.query(query, [sessionId]);
  return result.rows[0] || null;
}

// Set video overlay
export async function setVideoOverlay(data: {
  sessionId: string;
  overlayType: string;
  customText?: string;
  isActive?: boolean;
}): Promise<VideoOverlay> {
  // First, deactivate any existing overlays for this session
  await pool.query(
    'UPDATE mission_video_overlays SET is_active = false WHERE session_id = $1',
    [data.sessionId]
  );

  // Create new overlay
  const query = `
    INSERT INTO mission_video_overlays (
      session_id, overlay_type, custom_text, is_active
    ) VALUES ($1, $2, $3, $4)
    RETURNING *
  `;

  const values = [
    data.sessionId,
    data.overlayType,
    data.customText || null,
    data.isActive !== false
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
}

// Get video overlay
export async function getVideoOverlay(sessionId: string): Promise<VideoOverlay | null> {
  const query = `
    SELECT * FROM mission_video_overlays 
    WHERE session_id = $1 AND is_active = true
    ORDER BY created_at DESC 
    LIMIT 1
  `;

  const result = await pool.query(query, [sessionId]);
  return result.rows[0] || null;
}

// Add mission objective
export async function addMissionObjective(data: {
  sessionId: string;
  objective: string;
  sortOrder?: number;
}): Promise<MissionObjective> {
  const query = `
    INSERT INTO mission_objectives (
      session_id, objective, sort_order
    ) VALUES ($1, $2, $3)
    RETURNING *
  `;

  const values = [
    data.sessionId,
    data.objective,
    data.sortOrder || 0
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
}

// Get mission objectives
export async function getMissionObjectives(sessionId: string): Promise<MissionObjective[]> {
  const query = `
    SELECT * FROM mission_objectives 
    WHERE session_id = $1 
    ORDER BY sort_order ASC, created_at ASC
  `;

  const result = await pool.query(query, [sessionId]);
  return result.rows;
}

// Update mission objective
export async function updateMissionObjective(objectiveId: number, updates: Partial<MissionObjective>): Promise<MissionObjective> {
  const allowedFields = ['objective', 'is_completed', 'sort_order'];
  const updateFields = Object.keys(updates).filter(key => allowedFields.includes(key));
  
  if (updateFields.length === 0) {
    throw new Error('No valid fields to update');
  }

  const setClause = updateFields.map((field, index) => `${field} = $${index + 2}`).join(', ');
  const values = [objectiveId, ...updateFields.map(field => updates[field as keyof MissionObjective])];

  const query = `
    UPDATE mission_objectives 
    SET ${setClause}
    WHERE id = $1
    RETURNING *
  `;

  const result = await pool.query(query, values);
  
  if (result.rows.length === 0) {
    throw new Error('Mission objective not found');
  }

  return result.rows[0];
}

// Add mission crew
export async function addMissionCrew(data: {
  sessionId: string;
  name: string;
  role: string;
  agency?: string;
  isCommander?: boolean;
  sortOrder?: number;
}): Promise<MissionCrew> {
  const query = `
    INSERT INTO mission_crew (
      session_id, name, role, agency, is_commander, sort_order
    ) VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;

  const values = [
    data.sessionId,
    data.name,
    data.role,
    data.agency || null,
    data.isCommander || false,
    data.sortOrder || 0
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
}

// Get mission crew
export async function getMissionCrew(sessionId: string): Promise<MissionCrew[]> {
  const query = `
    SELECT * FROM mission_crew 
    WHERE session_id = $1 
    ORDER BY sort_order ASC, created_at ASC
  `;

  const result = await pool.query(query, [sessionId]);
  return result.rows;
}

// Cleanup expired sessions
export async function cleanupExpiredSessions(): Promise<number> {
  const query = 'DELETE FROM mission_control_sessions WHERE expires_at < CURRENT_TIMESTAMP';
  const result = await pool.query(query);
  return result.rowCount || 0;
}

// Update ISS feed settings
export async function updateISSFeedSettings(sessionId: string, issFeedEnabled: boolean): Promise<void> {
  const query = `
    UPDATE mission_control_sessions 
    SET iss_feed_enabled = $1, updated_at = CURRENT_TIMESTAMP 
    WHERE session_id = $2
  `;
  await pool.query(query, [issFeedEnabled, sessionId]);
}
