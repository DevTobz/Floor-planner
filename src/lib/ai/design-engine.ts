// ============================================================
// BuildAI Studio — AI Design Engine (Mock)
// Parses natural language commands and applies project mutations
// ============================================================

import { generateId } from '@/lib/utils';
import { templateMap } from './templates';
import { furnitureCatalog, getCatalogItem } from '@/lib/furniture/catalog';
import type { Project, ProjectMutation, ChatMessage, FurnitureCategory } from '@/types/project';

// The store type we'll interact with
interface StoreActions {
  addWall: (w: Record<string, unknown>) => { id: string; name: string };
  addRoom: (r: Record<string, unknown>) => { id: string; name: string };
  addDoor: (d: Record<string, unknown>) => { id: string; name: string };
  addWindow: (w: Record<string, unknown>) => { id: string; name: string };
  addFurniture: (f: Record<string, unknown>) => { id: string; name: string };
  addRoof: (r: Record<string, unknown>) => { id: string; name: string };
  deleteFurniture: (id: string) => void;
  deleteRoom: (id: string) => void;
  deleteWall: (id: string) => void;
  project: Project | null;
}

export interface AIResponse {
  message: string;
  mutations: ProjectMutation[];
}

import { useProjectStore } from '@/store/project-store';

/**
 * Process a user's natural language command and apply changes to the project.
 */
export async function processCommand(input: string, store: StoreActions): Promise<AIResponse> {
  const project = store.project;

  try {
    const res = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: input, project })
    });

    if (res.ok) {
      const data = await res.json();
      const appliedMutations: ProjectMutation[] = [];

      if (data.mutations && Array.isArray(data.mutations)) {
        for (const m of data.mutations) {
          if (m.action === "add") {
            if (m.type === "room") {
              const added = store.addRoom(m.data);
              appliedMutations.push({ action: "add", objectType: "room", objectId: added.id, objectName: added.name });
            } else if (m.type === "wall") {
              const added = store.addWall(m.data);
              appliedMutations.push({ action: "add", objectType: "wall", objectId: added.id, objectName: added.name });
            } else if (m.type === "door") {
              const added = store.addDoor(m.data);
              appliedMutations.push({ action: "add", objectType: "door", objectId: added.id, objectName: added.name });
            } else if (m.type === "window") {
              const added = store.addWindow(m.data);
              appliedMutations.push({ action: "add", objectType: "window", objectId: added.id, objectName: added.name });
            } else if (m.type === "furniture") {
              const added = store.addFurniture(m.data);
              appliedMutations.push({ action: "add", objectType: "furniture", objectId: added.id, objectName: added.name });
            }
          } else if (m.action === "delete" && m.id) {
            if (m.type === "furniture") {
              store.deleteFurniture(m.id);
            } else if (m.type === "room") {
              store.deleteRoom(m.id);
            } else if (m.type === "wall") {
              store.deleteWall(m.id);
            }
            appliedMutations.push({ action: "delete", objectType: m.type, objectId: m.id, objectName: m.type });
          } else if (m.action === "update" && m.id) {
            if (m.type === "furniture") {
              useProjectStore.getState().updateFurniture(m.id, m.data);
            } else if (m.type === "room") {
              useProjectStore.getState().updateRoom(m.id, m.data);
            } else if (m.type === "wall") {
              useProjectStore.getState().updateWall(m.id, m.data);
            }
            appliedMutations.push({ action: "update", objectType: m.type, objectId: m.id, objectName: m.type });
          }
        }
      }

      return {
        message: data.message || "Done!",
        mutations: appliedMutations
      };
    }
  } catch (e) {
    // Ignore and fallback to mock parser
  }

  return processMockCommand(input, store);
}

export function processMockCommand(input: string, store: StoreActions): AIResponse {
  const lower = input.toLowerCase().trim();
  const mutations: ProjectMutation[] = [];

  // ─── Template generation ───
  if (lower.includes('build') || lower.includes('create') || lower.includes('generate') || lower.includes('design')) {
    for (const [keyword, getTemplate] of Object.entries(templateMap)) {
      if (lower.includes(keyword)) {
        const template = getTemplate();
        
        // Add walls
        for (const w of template.walls) {
          const wall = store.addWall(w as Record<string, unknown>);
          mutations.push({ action: 'add', objectType: 'wall', objectId: wall.id, objectName: wall.name });
        }
        // Add rooms
        for (const r of template.rooms) {
          const room = store.addRoom(r as Record<string, unknown>);
          mutations.push({ action: 'add', objectType: 'room', objectId: room.id, objectName: room.name });
        }
        // Add doors
        for (const d of template.doors) {
          const door = store.addDoor(d as Record<string, unknown>);
          mutations.push({ action: 'add', objectType: 'door', objectId: door.id, objectName: door.name });
        }
        // Add windows
        for (const w of template.windows) {
          const win = store.addWindow(w as Record<string, unknown>);
          mutations.push({ action: 'add', objectType: 'window', objectId: win.id, objectName: win.name });
        }
        // Add furniture
        for (const f of template.furniture) {
          const item = store.addFurniture(f as Record<string, unknown>);
          mutations.push({ action: 'add', objectType: 'furniture', objectId: item.id, objectName: item.name });
        }

        return {
          message: `I've generated a **${template.name}** layout for you! It includes ${template.rooms.length} rooms, ${template.walls.length} walls, ${template.furniture.length} furniture items, ${template.doors.length} doors, and ${template.windows.length} windows. Feel free to edit anything.`,
          mutations,
        };
      }
    }
  }

  // ─── Add a room ───
  if (lower.includes('add') && (lower.includes('room') || lower.includes('bedroom') || lower.includes('kitchen') || lower.includes('bathroom') || lower.includes('living') || lower.includes('office') || lower.includes('garage') || lower.includes('dining'))) {
    const roomType = extractRoomType(lower);
    const project = store.project;
    const existingRooms = project?.rooms.length || 0;
    
    // Place new room offset from existing ones
    const offsetX = (existingRooms % 3) * 5;
    const offsetY = Math.floor(existingRooms / 3) * 4;
    
    // Check for custom dimensions in command (e.g., 6x5, 6 by 5, 6m x 5m)
    const dimMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:x|by|[*])\s*(\d+(?:\.\d+)?)/);
    let size = getRoomSize(roomType);
    if (dimMatch) {
      size = { w: parseFloat(dimMatch[1]), h: parseFloat(dimMatch[2]) };
    }
    
    const room = store.addRoom({
      name: roomType,
      label: roomType,
      corners: [
        { x: offsetX, y: offsetY },
        { x: offsetX + size.w, y: offsetY },
        { x: offsetX + size.w, y: offsetY + size.h },
        { x: offsetX, y: offsetY + size.h },
      ],
      material: getRoomMaterial(roomType),
    });
    
    // Add surrounding walls
    const w1 = store.addWall({ start: { x: offsetX, y: offsetY }, end: { x: offsetX + size.w, y: offsetY } });
    const w2 = store.addWall({ start: { x: offsetX + size.w, y: offsetY }, end: { x: offsetX + size.w, y: offsetY + size.h } });
    const w3 = store.addWall({ start: { x: offsetX + size.w, y: offsetY + size.h }, end: { x: offsetX, y: offsetY + size.h } });
    const w4 = store.addWall({ start: { x: offsetX, y: offsetY + size.h }, end: { x: offsetX, y: offsetY } });

    mutations.push(
      { action: 'add', objectType: 'room', objectId: room.id, objectName: roomType },
      { action: 'add', objectType: 'wall', objectId: w1.id, objectName: w1.name },
      { action: 'add', objectType: 'wall', objectId: w2.id, objectName: w2.name },
      { action: 'add', objectType: 'wall', objectId: w3.id, objectName: w3.name },
      { action: 'add', objectType: 'wall', objectId: w4.id, objectName: w4.name },
    );

    return {
      message: `I've added a **${roomType}** (${size.w}m × ${size.h}m) with walls. You can drag it to reposition or resize using the inspector.`,
      mutations,
    };
  }

  // ─── Add furniture ───
  if (lower.includes('add') || lower.includes('place') || lower.includes('put')) {
    const catalogItem = findFurnitureMatch(lower);
    if (catalogItem) {
      const project = store.project;
      // Try to place in a relevant room
      let posX = 5, posZ = 5;
      if (project && project.rooms.length > 0) {
        const targetRoom = findTargetRoom(lower, project.rooms);
        if (targetRoom) {
          const center = {
            x: targetRoom.corners.reduce((s, c) => s + c.x, 0) / targetRoom.corners.length,
            y: targetRoom.corners.reduce((s, c) => s + c.y, 0) / targetRoom.corners.length,
          };
          posX = center.x;
          posZ = center.y;
        }
      }
      
      const item = store.addFurniture({
        name: catalogItem.name,
        catalogId: catalogItem.id,
        category: catalogItem.category,
        width: catalogItem.width,
        height: catalogItem.height,
        depth: catalogItem.depth,
        transform: { position: { x: posX, y: 0, z: posZ }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
        material: { color: catalogItem.color, roughness: 0.7, metalness: 0.1, opacity: 1, name: 'Default' },
      });

      mutations.push({ action: 'add', objectType: 'furniture', objectId: item.id, objectName: catalogItem.name });

      return {
        message: `I've placed a **${catalogItem.name}** in the scene. You can drag it to the exact position you want.`,
        mutations,
      };
    }
  }

  // ─── Delete furniture ───
  if (lower.includes('delete') || lower.includes('remove')) {
    const project = store.project;
    if (project) {
      const matchedFurniture = project.furniture.find((f) =>
        lower.includes(f.name.toLowerCase())
      );
      if (matchedFurniture) {
        store.deleteFurniture(matchedFurniture.id);
        mutations.push({ action: 'delete', objectType: 'furniture', objectId: matchedFurniture.id, objectName: matchedFurniture.name });
        return {
          message: `Removed the **${matchedFurniture.name}** from the scene.`,
          mutations,
        };
      }
    }
  }

  // ─── Make room larger/smaller ───
  if (lower.includes('larger') || lower.includes('bigger') || lower.includes('expand') || lower.includes('smaller') || lower.includes('shrink')) {
    const isLarger = lower.includes('larger') || lower.includes('bigger') || lower.includes('expand');
    const roomType = extractRoomType(lower);
    const project = store.project;
    if (project) {
      const room = project.rooms.find((r) =>
        r.label.toLowerCase().includes(roomType.toLowerCase()) || r.name.toLowerCase().includes(roomType.toLowerCase())
      );
      if (room) {
        return {
          message: `To ${isLarger ? 'enlarge' : 'shrink'} the **${room.label}**, select it and drag the corners, or use the inspector panel to adjust dimensions.`,
          mutations: [],
        };
      }
    }
  }

  // ─── Add a door ───
  if (lower.includes('door')) {
    const door = store.addDoor({ name: 'New Door', width: 0.9, height: 2.1 });
    mutations.push({ action: 'add', objectType: 'door', objectId: door.id, objectName: 'New Door' });
    return {
      message: `I've added a **door**. Select it to position it along a wall.`,
      mutations,
    };
  }

  // ─── Add a window ───
  if (lower.includes('window')) {
    const win = store.addWindow({ name: 'New Window', width: 1.2, height: 1.0 });
    mutations.push({ action: 'add', objectType: 'window', objectId: win.id, objectName: 'New Window' });
    return {
      message: `I've added a **window**. Select it to position it along a wall.`,
      mutations,
    };
  }

  // ─── Fallback ───
  return {
    message: `I understand you want to: "${input}". Try commands like:\n- "Build a two-bedroom bungalow"\n- "Add a kitchen"\n- "Add a sofa"\n- "Delete the coffee table"\n- "Add a door"\n- "Add a window"`,
    mutations: [],
  };
}

// ─── Helpers ───

function extractRoomType(input: string): string {
  const types = [
    'bedroom', 'kitchen', 'bathroom', 'living room', 'dining room',
    'office', 'garage', 'laundry', 'hallway', 'closet', 'pantry',
    'study', 'guest room', 'master bedroom',
  ];
  for (const type of types) {
    if (input.includes(type)) return type.charAt(0).toUpperCase() + type.slice(1);
  }
  return 'Room';
}

function getRoomSize(type: string): { w: number; h: number } {
  const sizes: Record<string, { w: number; h: number }> = {
    'Kitchen': { w: 4, h: 3.5 },
    'Bathroom': { w: 2.5, h: 3 },
    'Bedroom': { w: 4, h: 4 },
    'Master bedroom': { w: 5, h: 4.5 },
    'Living room': { w: 5, h: 4 },
    'Dining room': { w: 4, h: 3.5 },
    'Office': { w: 3.5, h: 3 },
    'Garage': { w: 6, h: 3.5 },
    'Laundry': { w: 2, h: 2.5 },
    'Guest room': { w: 3.5, h: 3.5 },
    'Study': { w: 3, h: 3 },
  };
  return sizes[type] || { w: 4, h: 3 };
}

function getRoomMaterial(type: string) {
  const materials: Record<string, { color: string; roughness: number; metalness: number; opacity: number; name: string }> = {
    'Kitchen': { color: '#ecfdf5', roughness: 0.5, metalness: 0, opacity: 1, name: 'Tile' },
    'Bathroom': { color: '#f0fdfa', roughness: 0.5, metalness: 0, opacity: 1, name: 'Tile' },
    'Bedroom': { color: '#ede9fe', roughness: 0.9, metalness: 0, opacity: 1, name: 'Carpet' },
    'Master bedroom': { color: '#fdf2f8', roughness: 0.9, metalness: 0, opacity: 1, name: 'Carpet' },
    'Living room': { color: '#fef3c7', roughness: 0.9, metalness: 0, opacity: 1, name: 'Wood Floor' },
    'Office': { color: '#f5f5f4', roughness: 0.7, metalness: 0, opacity: 1, name: 'Carpet Tile' },
    'Garage': { color: '#d6d3d1', roughness: 0.4, metalness: 0.1, opacity: 1, name: 'Concrete' },
  };
  return materials[type] || { color: '#f5f5f4', roughness: 0.8, metalness: 0, opacity: 1, name: 'Floor' };
}

function findFurnitureMatch(input: string) {
  const keywords = input.toLowerCase().split(/\s+/);
  // Try exact name match first
  for (const item of furnitureCatalog) {
    const itemWords = item.name.toLowerCase().split(/\s+/);
    if (itemWords.every((w) => keywords.includes(w))) return item;
  }
  // Fuzzy match
  const matchScores = furnitureCatalog.map((item) => {
    const nameWords = item.name.toLowerCase().split(/[\s-]+/);
    const score = nameWords.filter((w) => keywords.some((k) => k.includes(w) || w.includes(k))).length;
    return { item, score };
  });
  const best = matchScores.sort((a, b) => b.score - a.score)[0];
  return best && best.score > 0 ? best.item : null;
}

function findTargetRoom(
  input: string,
  rooms: { id: string; name: string; label: string; corners: { x: number; y: number }[] }[]
) {
  for (const room of rooms) {
    if (
      input.includes(room.label.toLowerCase()) ||
      input.includes(room.name.toLowerCase())
    ) {
      return room;
    }
  }
  return rooms[0]; // default to first room
}

/**
 * Create a chat message from the AI response.
 */
export function createAIChatMessage(response: AIResponse): ChatMessage {
  return {
    id: generateId(),
    role: 'assistant',
    content: response.message,
    timestamp: new Date().toISOString(),
    mutations: response.mutations,
  };
}

export function createUserChatMessage(content: string): ChatMessage {
  return {
    id: generateId(),
    role: 'user',
    content,
    timestamp: new Date().toISOString(),
  };
}
