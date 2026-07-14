// ============================================================
// BuildAI Studio — Project Store (Zustand)
// Central state management for all project data with undo/redo
// ============================================================

import { create } from 'zustand';
import { generateId, polygonArea, snapToGrid } from '@/lib/utils';
import type {
  Project,
  Wall,
  Room,
  Door,
  Window,
  FurnitureItem,
  Roof,
  AnySceneObject,
  Transform,
  MaterialDef,
  ChatMessage,
  ProjectMutation,
  ProjectSummary,
  Vector3,
} from '@/types/project';

// ============================================================
// Default factories
// ============================================================

function defaultTransform(overrides?: Partial<Transform>): Transform {
  const position = { x: 0, y: 0, z: 0 };
  const rotation = { x: 0, y: 0, z: 0 };
  const scale = { x: 1, y: 1, z: 1 };

  if (overrides) {
    if (overrides.position) {
      Object.assign(position, overrides.position);
    }
    if (overrides.rotation) {
      Object.assign(rotation, overrides.rotation);
    }
    if (overrides.scale) {
      Object.assign(scale, overrides.scale);
    }
  }

  return { position, rotation, scale };
}

function defaultMaterial(overrides?: Partial<MaterialDef>): MaterialDef {
  return {
    color: '#e0e0e0',
    roughness: 0.8,
    metalness: 0.1,
    opacity: 1,
    name: 'Default',
    ...overrides,
  };
}

export function createEmptyProject(name: string, userId: string): Project {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    name,
    description: '',
    createdAt: now,
    updatedAt: now,
    shareId: generateId(),
    userId,
    walls: [],
    rooms: [],
    doors: [],
    windows: [],
    furniture: [],
    roofs: [],
    cameras: [
      {
        id: 'default-cam',
        name: 'Default',
        position: { x: 10, y: 10, z: 10 },
        target: { x: 0, y: 0, z: 0 },
        fov: 50,
      },
    ],
    gridSize: 0.5,
    unit: 'meters',
    defaultFloorHeight: 0,
    defaultWallHeight: 2.8,
    defaultWallThickness: 0.15,
  };
}

// ============================================================
// History for undo/redo
// ============================================================

interface HistoryEntry {
  walls: Wall[];
  rooms: Room[];
  doors: Door[];
  windows: Window[];
  furniture: FurnitureItem[];
  roofs: Roof[];
}

function projectSnapshot(p: Project): HistoryEntry {
  return {
    walls: JSON.parse(JSON.stringify(p.walls)),
    rooms: JSON.parse(JSON.stringify(p.rooms)),
    doors: JSON.parse(JSON.stringify(p.doors)),
    windows: JSON.parse(JSON.stringify(p.windows)),
    furniture: JSON.parse(JSON.stringify(p.furniture)),
    roofs: JSON.parse(JSON.stringify(p.roofs)),
  };
}

// ============================================================
// Store interface
// ============================================================

interface ProjectState {
  // Current project
  project: Project | null;
  projects: ProjectSummary[];
  isDirty: boolean;

  // History
  undoStack: HistoryEntry[];
  redoStack: HistoryEntry[];
  maxHistory: number;

  // Chat
  chatMessages: ChatMessage[];

  // Clipboard
  clipboard: AnySceneObject[];

  // ─── Project lifecycle ───
  loadProject: (project: Project) => void;
  updateProjectMeta: (updates: Partial<Pick<Project, 'name' | 'description'>>) => void;
  setProjects: (projects: ProjectSummary[]) => void;
  getProjectSummary: () => ProjectSummary | null;

  // ─── History ───
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;

  // ─── Walls ───
  addWall: (wall: Partial<Wall>) => Wall;
  updateWall: (id: string, updates: Partial<Wall>) => void;
  deleteWall: (id: string) => void;

  // ─── Rooms ───
  addRoom: (room: Partial<Room>) => Room;
  updateRoom: (id: string, updates: Partial<Room>) => void;
  deleteRoom: (id: string) => void;

  // ─── Doors ───
  addDoor: (door: Partial<Door>) => Door;
  updateDoor: (id: string, updates: Partial<Door>) => void;
  deleteDoor: (id: string) => void;

  // ─── Windows ───
  addWindow: (win: Partial<Window>) => Window;
  updateWindow: (id: string, updates: Partial<Window>) => void;
  deleteWindow: (id: string) => void;

  // ─── Furniture ───
  addFurniture: (item: Partial<FurnitureItem>) => FurnitureItem;
  updateFurniture: (id: string, updates: Partial<FurnitureItem>) => void;
  deleteFurniture: (id: string) => void;

  // ─── Roofs ───
  addRoof: (roof: Partial<Roof>) => Roof;
  updateRoof: (id: string, updates: Partial<Roof>) => void;
  deleteRoof: (id: string) => void;

  // ─── Generic object operations ───
  moveObject: (type: string, id: string, position: Vector3) => void;
  rotateObject: (type: string, id: string, rotation: Vector3) => void;
  scaleObject: (type: string, id: string, scale: Vector3) => void;
  deleteObject: (type: string, id: string) => void;
  duplicateObject: (type: string, id: string) => string | null;
  toggleLock: (type: string, id: string) => void;
  toggleVisibility: (type: string, id: string) => void;
  updateObjectName: (type: string, id: string, name: string) => void;

  // ─── Clipboard ───
  copyObjects: (objects: AnySceneObject[]) => void;
  pasteObjects: () => void;

  // ─── Chat ───
  addChatMessage: (message: ChatMessage) => void;
  clearChat: () => void;

  // ─── Persistence helpers ───
  markClean: () => void;
  getSerializedProject: () => string | null;
}

// ============================================================
// Helper to get/set a typed array from project
// ============================================================

function getCollection(project: Project, type: string): AnySceneObject[] {
  switch (type) {
    case 'wall': return project.walls;
    case 'room': return project.rooms;
    case 'door': return project.doors;
    case 'window': return project.windows;
    case 'furniture': return project.furniture;
    case 'roof': return project.roofs;
    default: return [];
  }
}

function setCollection(project: Project, type: string, items: AnySceneObject[]): void {
  switch (type) {
    case 'wall': project.walls = items as Wall[]; break;
    case 'room': project.rooms = items as Room[]; break;
    case 'door': project.doors = items as Door[]; break;
    case 'window': project.windows = items as Window[]; break;
    case 'furniture': project.furniture = items as FurnitureItem[]; break;
    case 'roof': project.roofs = items as Roof[]; break;
  }
}

// ============================================================
// Create the store
// ============================================================

export const useProjectStore = create<ProjectState>((set, get) => ({
  project: null,
  projects: [],
  isDirty: false,
  undoStack: [],
  redoStack: [],
  maxHistory: 50,
  chatMessages: [],
  clipboard: [],

  // ─── Project lifecycle ───

  loadProject: (project) => {
    set({
      project: JSON.parse(JSON.stringify(project)),
      isDirty: false,
      undoStack: [],
      redoStack: [],
      chatMessages: [],
    });
  },

  updateProjectMeta: (updates) => {
    const { project } = get();
    if (!project) return;
    set({
      project: { ...project, ...updates, updatedAt: new Date().toISOString() },
      isDirty: true,
    });
  },

  setProjects: (projects) => set({ projects }),

  getProjectSummary: () => {
    const { project } = get();
    if (!project) return null;
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      roomCount: project.rooms.length,
      furnitureCount: project.furniture.length,
    };
  },

  // ─── History ───

  pushHistory: () => {
    const { project, undoStack, maxHistory } = get();
    if (!project) return;
    const snapshot = projectSnapshot(project);
    const newStack = [...undoStack, snapshot].slice(-maxHistory);
    set({ undoStack: newStack, redoStack: [] });
  },

  undo: () => {
    const { project, undoStack, redoStack } = get();
    if (!project || undoStack.length === 0) return;
    const current = projectSnapshot(project);
    const prev = undoStack[undoStack.length - 1];
    set({
      project: { ...project, ...prev, updatedAt: new Date().toISOString() },
      undoStack: undoStack.slice(0, -1),
      redoStack: [...redoStack, current],
      isDirty: true,
    });
  },

  redo: () => {
    const { project, undoStack, redoStack } = get();
    if (!project || redoStack.length === 0) return;
    const current = projectSnapshot(project);
    const next = redoStack[redoStack.length - 1];
    set({
      project: { ...project, ...next, updatedAt: new Date().toISOString() },
      undoStack: [...undoStack, current],
      redoStack: redoStack.slice(0, -1),
      isDirty: true,
    });
  },

  // ─── Walls ───

  addWall: (partial) => {
    const { project } = get();
    if (!project) throw new Error('No project loaded');
    get().pushHistory();
    const wall: Wall = {
      id: generateId(),
      name: partial.name || `Wall ${project.walls.length + 1}`,
      type: 'wall',
      transform: defaultTransform(partial.transform),
      material: defaultMaterial(partial.material || { color: '#d4d4d8', name: 'Wall' }),
      locked: false,
      visible: true,
      layer: 0,
      start: partial.start || { x: 0, y: 0 },
      end: partial.end || { x: 3, y: 0 },
      thickness: partial.thickness || project.defaultWallThickness,
      height: partial.height || project.defaultWallHeight,
    };
    set({
      project: { ...project, walls: [...project.walls, wall], updatedAt: new Date().toISOString() },
      isDirty: true,
    });
    return wall;
  },

  updateWall: (id, updates) => {
    const { project } = get();
    if (!project) return;
    get().pushHistory();
    set({
      project: {
        ...project,
        walls: project.walls.map((w) => (w.id === id ? { ...w, ...updates } : w)),
        updatedAt: new Date().toISOString(),
      },
      isDirty: true,
    });
  },

  deleteWall: (id) => {
    const { project } = get();
    if (!project) return;
    get().pushHistory();
    set({
      project: {
        ...project,
        walls: project.walls.filter((w) => w.id !== id),
        doors: project.doors.filter((d) => d.wallId !== id),
        windows: project.windows.filter((w) => w.wallId !== id),
        updatedAt: new Date().toISOString(),
      },
      isDirty: true,
    });
  },

  // ─── Rooms ───

  addRoom: (partial) => {
    const { project } = get();
    if (!project) throw new Error('No project loaded');
    get().pushHistory();
    const corners = partial.corners || [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 4, y: 3 },
      { x: 0, y: 3 },
    ];
    const room: Room = {
      id: generateId(),
      name: partial.name || `Room ${project.rooms.length + 1}`,
      type: 'room',
      transform: defaultTransform(partial.transform),
      material: defaultMaterial(partial.material || { color: '#f5f5f4', name: 'Floor' }),
      locked: false,
      visible: true,
      layer: 0,
      corners,
      height: partial.height || project.defaultWallHeight,
      label: partial.label || partial.name || `Room ${project.rooms.length + 1}`,
      area: polygonArea(corners),
    };
    set({
      project: { ...project, rooms: [...project.rooms, room], updatedAt: new Date().toISOString() },
      isDirty: true,
    });
    return room;
  },

  updateRoom: (id, updates) => {
    const { project } = get();
    if (!project) return;
    get().pushHistory();
    set({
      project: {
        ...project,
        rooms: project.rooms.map((r) => {
          if (r.id !== id) return r;
          const updated = { ...r, ...updates };
          if (updates.corners) {
            updated.area = polygonArea(updates.corners);
          }
          return updated;
        }),
        updatedAt: new Date().toISOString(),
      },
      isDirty: true,
    });
  },

  deleteRoom: (id) => {
    const { project } = get();
    if (!project) return;
    get().pushHistory();
    set({
      project: {
        ...project,
        rooms: project.rooms.filter((r) => r.id !== id),
        updatedAt: new Date().toISOString(),
      },
      isDirty: true,
    });
  },

  // ─── Doors ───

  addDoor: (partial) => {
    const { project } = get();
    if (!project) throw new Error('No project loaded');
    get().pushHistory();
    const door: Door = {
      id: generateId(),
      name: partial.name || `Door ${project.doors.length + 1}`,
      type: 'door',
      transform: defaultTransform(partial.transform),
      material: defaultMaterial(partial.material || { color: '#92400e', name: 'Wood' }),
      locked: false,
      visible: true,
      layer: 0,
      wallId: partial.wallId || '',
      width: partial.width || 0.9,
      height: partial.height || 2.1,
      offsetAlongWall: partial.offsetAlongWall || 0.5,
      openDirection: partial.openDirection || 'left',
      style: partial.style || 'hinged',
    };
    set({
      project: { ...project, doors: [...project.doors, door], updatedAt: new Date().toISOString() },
      isDirty: true,
    });
    return door;
  },

  updateDoor: (id, updates) => {
    const { project } = get();
    if (!project) return;
    get().pushHistory();
    set({
      project: {
        ...project,
        doors: project.doors.map((d) => (d.id === id ? { ...d, ...updates } : d)),
        updatedAt: new Date().toISOString(),
      },
      isDirty: true,
    });
  },

  deleteDoor: (id) => {
    const { project } = get();
    if (!project) return;
    get().pushHistory();
    set({
      project: {
        ...project,
        doors: project.doors.filter((d) => d.id !== id),
        updatedAt: new Date().toISOString(),
      },
      isDirty: true,
    });
  },

  // ─── Windows ───

  addWindow: (partial) => {
    const { project } = get();
    if (!project) throw new Error('No project loaded');
    get().pushHistory();
    const win: Window = {
      id: generateId(),
      name: partial.name || `Window ${project.windows.length + 1}`,
      type: 'window',
      transform: defaultTransform(partial.transform),
      material: defaultMaterial(partial.material || { color: '#bae6fd', name: 'Glass', opacity: 0.5 }),
      locked: false,
      visible: true,
      layer: 0,
      wallId: partial.wallId || '',
      width: partial.width || 1.2,
      height: partial.height || 1.0,
      sillHeight: partial.sillHeight || 0.9,
      offsetAlongWall: partial.offsetAlongWall || 1,
      style: partial.style || 'double',
    };
    set({
      project: { ...project, windows: [...project.windows, win], updatedAt: new Date().toISOString() },
      isDirty: true,
    });
    return win;
  },

  updateWindow: (id, updates) => {
    const { project } = get();
    if (!project) return;
    get().pushHistory();
    set({
      project: {
        ...project,
        windows: project.windows.map((w) => (w.id === id ? { ...w, ...updates } : w)),
        updatedAt: new Date().toISOString(),
      },
      isDirty: true,
    });
  },

  deleteWindow: (id) => {
    const { project } = get();
    if (!project) return;
    get().pushHistory();
    set({
      project: {
        ...project,
        windows: project.windows.filter((w) => w.id !== id),
        updatedAt: new Date().toISOString(),
      },
      isDirty: true,
    });
  },

  // ─── Furniture ───

  addFurniture: (partial) => {
    const { project } = get();
    if (!project) throw new Error('No project loaded');
    get().pushHistory();
    const item: FurnitureItem = {
      id: generateId(),
      name: partial.name || `Furniture ${project.furniture.length + 1}`,
      type: 'furniture',
      transform: defaultTransform(partial.transform),
      material: defaultMaterial(partial.material),
      locked: false,
      visible: true,
      layer: 1,
      category: partial.category || 'living-room',
      catalogId: partial.catalogId || 'generic',
      width: partial.width || 1,
      height: partial.height || 0.5,
      depth: partial.depth || 1,
      roomId: partial.roomId,
    };
    set({
      project: { ...project, furniture: [...project.furniture, item], updatedAt: new Date().toISOString() },
      isDirty: true,
    });
    return item;
  },

  updateFurniture: (id, updates) => {
    const { project } = get();
    if (!project) return;
    get().pushHistory();
    set({
      project: {
        ...project,
        furniture: project.furniture.map((f) => (f.id === id ? { ...f, ...updates } : f)),
        updatedAt: new Date().toISOString(),
      },
      isDirty: true,
    });
  },

  deleteFurniture: (id) => {
    const { project } = get();
    if (!project) return;
    get().pushHistory();
    set({
      project: {
        ...project,
        furniture: project.furniture.filter((f) => f.id !== id),
        updatedAt: new Date().toISOString(),
      },
      isDirty: true,
    });
  },

  // ─── Roofs ───

  addRoof: (partial) => {
    const { project } = get();
    if (!project) throw new Error('No project loaded');
    get().pushHistory();
    const roof: Roof = {
      id: generateId(),
      name: partial.name || 'Roof',
      type: 'roof',
      transform: defaultTransform(partial.transform),
      material: defaultMaterial(partial.material || { color: '#78716c', name: 'Roof Tile' }),
      locked: false,
      visible: true,
      layer: 2,
      style: partial.style || 'gable',
      pitch: partial.pitch || 30,
      overhang: partial.overhang || 0.3,
      ridgeHeight: partial.ridgeHeight || 1.5,
    };
    set({
      project: { ...project, roofs: [...project.roofs, roof], updatedAt: new Date().toISOString() },
      isDirty: true,
    });
    return roof;
  },

  updateRoof: (id, updates) => {
    const { project } = get();
    if (!project) return;
    get().pushHistory();
    set({
      project: {
        ...project,
        roofs: project.roofs.map((r) => (r.id === id ? { ...r, ...updates } : r)),
        updatedAt: new Date().toISOString(),
      },
      isDirty: true,
    });
  },

  deleteRoof: (id) => {
    const { project } = get();
    if (!project) return;
    get().pushHistory();
    set({
      project: {
        ...project,
        roofs: project.roofs.filter((r) => r.id !== id),
        updatedAt: new Date().toISOString(),
      },
      isDirty: true,
    });
  },

  // ─── Generic object operations ───

  moveObject: (type, id, position) => {
    const { project } = get();
    if (!project) return;
    get().pushHistory();
    const items = getCollection(project, type);
    const updated = items.map((obj) =>
      obj.id === id ? { ...obj, transform: { ...obj.transform, position } } : obj
    );
    const newProject = { ...project, updatedAt: new Date().toISOString() };
    setCollection(newProject, type, updated);
    set({ project: newProject, isDirty: true });
  },

  rotateObject: (type, id, rotation) => {
    const { project } = get();
    if (!project) return;
    get().pushHistory();
    const items = getCollection(project, type);
    const updated = items.map((obj) =>
      obj.id === id ? { ...obj, transform: { ...obj.transform, rotation } } : obj
    );
    const newProject = { ...project, updatedAt: new Date().toISOString() };
    setCollection(newProject, type, updated);
    set({ project: newProject, isDirty: true });
  },

  scaleObject: (type, id, scale) => {
    const { project } = get();
    if (!project) return;
    get().pushHistory();
    const items = getCollection(project, type);
    const updated = items.map((obj) =>
      obj.id === id ? { ...obj, transform: { ...obj.transform, scale } } : obj
    );
    const newProject = { ...project, updatedAt: new Date().toISOString() };
    setCollection(newProject, type, updated);
    set({ project: newProject, isDirty: true });
  },

  deleteObject: (type, id) => {
    switch (type) {
      case 'wall': get().deleteWall(id); break;
      case 'room': get().deleteRoom(id); break;
      case 'door': get().deleteDoor(id); break;
      case 'window': get().deleteWindow(id); break;
      case 'furniture': get().deleteFurniture(id); break;
      case 'roof': get().deleteRoof(id); break;
    }
  },

  duplicateObject: (type, id) => {
    const { project } = get();
    if (!project) return null;
    const items = getCollection(project, type);
    const obj = items.find((o) => o.id === id);
    if (!obj) return null;
    const clone = {
      ...JSON.parse(JSON.stringify(obj)),
      id: generateId(),
      name: `${obj.name} (copy)`,
      transform: {
        ...obj.transform,
        position: {
          x: obj.transform.position.x + 0.5,
          y: obj.transform.position.y,
          z: obj.transform.position.z + 0.5,
        },
      },
    };
    get().pushHistory();
    const newProject = { ...project, updatedAt: new Date().toISOString() };
    setCollection(newProject, type, [...items, clone]);
    set({ project: newProject, isDirty: true });
    return clone.id;
  },

  toggleLock: (type, id) => {
    const { project } = get();
    if (!project) return;
    const items = getCollection(project, type);
    const updated = items.map((obj) =>
      obj.id === id ? { ...obj, locked: !obj.locked } : obj
    );
    const newProject = { ...project, updatedAt: new Date().toISOString() };
    setCollection(newProject, type, updated);
    set({ project: newProject });
  },

  toggleVisibility: (type, id) => {
    const { project } = get();
    if (!project) return;
    const items = getCollection(project, type);
    const updated = items.map((obj) =>
      obj.id === id ? { ...obj, visible: !obj.visible } : obj
    );
    const newProject = { ...project, updatedAt: new Date().toISOString() };
    setCollection(newProject, type, updated);
    set({ project: newProject });
  },

  updateObjectName: (type, id, name) => {
    const { project } = get();
    if (!project) return;
    get().pushHistory();
    const items = getCollection(project, type);
    const updated = items.map((obj) => {
      if (obj.id === id) {
        if (type === 'room') {
          return { ...obj, name, label: name };
        }
        return { ...obj, name };
      }
      return obj;
    });
    const newProject = { ...project, updatedAt: new Date().toISOString() };
    setCollection(newProject, type, updated);
    set({ project: newProject, isDirty: true });
  },

  // ─── Clipboard ───

  copyObjects: (objects) => {
    set({ clipboard: JSON.parse(JSON.stringify(objects)) });
  },

  pasteObjects: () => {
    const { clipboard, project } = get();
    if (!project || clipboard.length === 0) return;
    get().pushHistory();
    let newProject = { ...project, updatedAt: new Date().toISOString() };
    for (const obj of clipboard) {
      const clone = {
        ...JSON.parse(JSON.stringify(obj)),
        id: generateId(),
        name: `${obj.name} (pasted)`,
        transform: {
          ...obj.transform,
          position: {
            x: obj.transform.position.x + 1,
            y: obj.transform.position.y,
            z: obj.transform.position.z + 1,
          },
        },
      };
      const items = getCollection(newProject, obj.type);
      setCollection(newProject, obj.type, [...items, clone]);
    }
    set({ project: newProject, isDirty: true });
  },

  // ─── Chat ───

  addChatMessage: (message) => {
    set((state) => ({ chatMessages: [...state.chatMessages, message] }));
  },

  clearChat: () => set({ chatMessages: [] }),

  // ─── Persistence ───

  markClean: () => set({ isDirty: false }),

  getSerializedProject: () => {
    const { project } = get();
    if (!project) return null;
    return JSON.stringify(project);
  },
}));
