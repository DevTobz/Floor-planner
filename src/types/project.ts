// ============================================================
// BuildAI Studio — Core Project Data Model
// Every design is stored as structured data, never as images.
// ============================================================

export interface Vector2 {
  x: number;
  y: number;
}

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Transform {
  position: Vector3;
  rotation: Vector3; // Euler angles in degrees
  scale: Vector3;
}

export interface MaterialDef {
  color: string;       // hex color
  roughness: number;   // 0–1
  metalness: number;   // 0–1
  opacity: number;     // 0–1
  name: string;
}

// Base interface for all scene objects
export interface SceneObject {
  id: string;
  name: string;
  type: SceneObjectType;
  transform: Transform;
  material: MaterialDef;
  locked: boolean;
  visible: boolean;
  layer: number;
  parentId?: string;  // for grouping
}

export type SceneObjectType =
  | 'wall'
  | 'room'
  | 'door'
  | 'window'
  | 'furniture'
  | 'roof'
  | 'group';

// Wall: defined by start/end points and thickness/height
export interface Wall extends SceneObject {
  type: 'wall';
  start: Vector2;
  end: Vector2;
  thickness: number; // in meters
  height: number;    // in meters
}

// Room: defined by corner points (polygon)
export interface Room extends SceneObject {
  type: 'room';
  corners: Vector2[];  // ordered polygon vertices
  height: number;      // ceiling height in meters
  label: string;       // "Kitchen", "Bedroom", etc.
  area?: number;       // auto-calculated in m²
}

// Door: attached to a wall
export interface Door extends SceneObject {
  type: 'door';
  wallId: string;
  width: number;      // in meters
  height: number;     // in meters
  offsetAlongWall: number; // distance from wall start
  openDirection: 'left' | 'right' | 'double';
  style: 'hinged' | 'sliding' | 'pocket';
}

// Window: attached to a wall
export interface Window extends SceneObject {
  type: 'window';
  wallId: string;
  width: number;
  height: number;
  sillHeight: number;  // height from floor
  offsetAlongWall: number;
  style: 'single' | 'double' | 'sliding' | 'casement';
}

// Furniture item placed in the scene
export interface FurnitureItem extends SceneObject {
  type: 'furniture';
  category: FurnitureCategory;
  catalogId: string;   // reference to furniture catalog
  width: number;       // in meters
  height: number;
  depth: number;
  roomId?: string;     // optional room association
}

export type FurnitureCategory =
  | 'living-room'
  | 'bedroom'
  | 'kitchen'
  | 'bathroom'
  | 'office'
  | 'outdoor';

// Roof definition
export interface Roof extends SceneObject {
  type: 'roof';
  style: 'flat' | 'gable' | 'hip' | 'shed';
  pitch: number;       // angle in degrees
  overhang: number;    // in meters
  ridgeHeight: number; // in meters
}

// Camera preset
export interface CameraPreset {
  id: string;
  name: string;
  position: Vector3;
  target: Vector3;
  fov: number;
}

// The complete project model
export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;  // ISO date
  updatedAt: string;
  shareId: string;
  userId: string;

  // Scene data
  walls: Wall[];
  rooms: Room[];
  doors: Door[];
  windows: Window[];
  furniture: FurnitureItem[];
  roofs: Roof[];
  cameras: CameraPreset[];

  // Scene settings
  gridSize: number;       // grid cell size in meters
  unit: 'meters' | 'feet';
  defaultFloorHeight: number;
  defaultWallHeight: number;
  defaultWallThickness: number;
}

// Union type for any scene object
export type AnySceneObject = Wall | Room | Door | Window | FurnitureItem | Roof;

// ============================================================
// AI Chat types
// ============================================================

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  mutations?: ProjectMutation[];
}

export interface ProjectMutation {
  action: 'add' | 'update' | 'delete';
  objectType: SceneObjectType;
  objectId: string;
  objectName: string;
  details?: string;
}

// ============================================================
// Dashboard types
// ============================================================

export interface ProjectSummary {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  thumbnail?: string; // base64 data URL
  roomCount: number;
  furnitureCount: number;
}
