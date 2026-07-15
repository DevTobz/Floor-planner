// ============================================================
// BuildAI Studio — AI Building Templates
// Pre-built building layouts for the mock AI engine
// ============================================================

import type { Wall, Room, Door, Window as WindowType, FurnitureItem } from '@/types/project';
import { generateId } from '@/lib/utils';

interface BuildingTemplate {
  name: string;
  description: string;
  walls: Partial<Wall>[];
  rooms: Partial<Room>[];
  doors: Partial<Door>[];
  windows: Partial<WindowType>[];
  furniture: Partial<FurnitureItem>[];
}

function wallId() { return generateId(); }

export function getTwoBedBungalow(): BuildingTemplate {
  const w1 = wallId(), w2 = wallId(), w3 = wallId(), w4 = wallId();
  const w5 = wallId(), w6 = wallId(), w7 = wallId(), w8 = wallId();
  const w9 = wallId(), w10 = wallId(), w11 = wallId();

  return {
    name: 'Two-Bedroom Bungalow',
    description: 'A modern two-bedroom bungalow with living room, kitchen, and bathroom.',
    walls: [
      // Outer walls
      { id: w1, name: 'North Wall', start: { x: 0, y: 0 }, end: { x: 12, y: 0 } },
      { id: w2, name: 'East Wall', start: { x: 12, y: 0 }, end: { x: 12, y: 9 } },
      { id: w3, name: 'South Wall', start: { x: 12, y: 9 }, end: { x: 0, y: 9 } },
      { id: w4, name: 'West Wall', start: { x: 0, y: 9 }, end: { x: 0, y: 0 } },
      // Inner walls
      { id: w5, name: 'Living-Kitchen Divider', start: { x: 7, y: 0 }, end: { x: 7, y: 5 } },
      { id: w6, name: 'Kitchen-Bath Divider', start: { x: 7, y: 5 }, end: { x: 12, y: 5 } },
      { id: w7, name: 'Hallway South', start: { x: 0, y: 5 }, end: { x: 7, y: 5 } },
      { id: w8, name: 'Bedroom Divider', start: { x: 5, y: 5 }, end: { x: 5, y: 9 } },
      { id: w9, name: 'Bath South Wall', start: { x: 9, y: 5 }, end: { x: 9, y: 9 } },
    ],
    rooms: [
      { name: 'Living Room', label: 'Living Room', corners: [{ x: 0, y: 0 }, { x: 7, y: 0 }, { x: 7, y: 5 }, { x: 0, y: 5 }], material: { color: '#fef3c7', roughness: 0.9, metalness: 0, opacity: 1, name: 'Wood Floor' } },
      { name: 'Kitchen', label: 'Kitchen', corners: [{ x: 7, y: 0 }, { x: 12, y: 0 }, { x: 12, y: 5 }, { x: 7, y: 5 }], material: { color: '#ecfdf5', roughness: 0.7, metalness: 0, opacity: 1, name: 'Tile' } },
      { name: 'Bedroom 1', label: 'Bedroom 1', corners: [{ x: 0, y: 5 }, { x: 5, y: 5 }, { x: 5, y: 9 }, { x: 0, y: 9 }], material: { color: '#ede9fe', roughness: 0.9, metalness: 0, opacity: 1, name: 'Carpet' } },
      { name: 'Bedroom 2', label: 'Bedroom 2', corners: [{ x: 5, y: 5 }, { x: 9, y: 5 }, { x: 9, y: 9 }, { x: 5, y: 9 }], material: { color: '#dbeafe', roughness: 0.9, metalness: 0, opacity: 1, name: 'Carpet' } },
      { name: 'Bathroom', label: 'Bathroom', corners: [{ x: 9, y: 5 }, { x: 12, y: 5 }, { x: 12, y: 9 }, { x: 9, y: 9 }], material: { color: '#f0fdfa', roughness: 0.5, metalness: 0, opacity: 1, name: 'Tile' } },
    ],
    doors: [
      { name: 'Front Door', wallId: w1, width: 1.0, height: 2.1, offsetAlongWall: 3, openDirection: 'right', style: 'hinged' },
      { name: 'Kitchen Door', wallId: w5, width: 0.9, height: 2.1, offsetAlongWall: 1.5, openDirection: 'left', style: 'hinged' },
      { name: 'Bedroom 1 Door', wallId: w7, width: 0.8, height: 2.1, offsetAlongWall: 1.5, openDirection: 'right', style: 'hinged' },
      { name: 'Bedroom 2 Door', wallId: w7, width: 0.8, height: 2.1, offsetAlongWall: 4, openDirection: 'left', style: 'hinged' },
      { name: 'Bathroom Door', wallId: w6, width: 0.7, height: 2.1, offsetAlongWall: 3.5, openDirection: 'right', style: 'hinged' },
    ],
    windows: [
      { name: 'Living Room Window', wallId: w4, width: 1.5, height: 1.2, sillHeight: 0.9, offsetAlongWall: 1.5, style: 'double' },
      { name: 'Kitchen Window', wallId: w2, width: 1.2, height: 1.0, sillHeight: 0.9, offsetAlongWall: 1.5, style: 'sliding' },
      { name: 'Bedroom 1 Window', wallId: w3, width: 1.2, height: 1.0, sillHeight: 0.9, offsetAlongWall: 1.5, style: 'casement' },
      { name: 'Bedroom 2 Window', wallId: w3, width: 1.0, height: 1.0, sillHeight: 0.9, offsetAlongWall: 6, style: 'casement' },
      { name: 'Bathroom Window', wallId: w2, width: 0.6, height: 0.6, sillHeight: 1.4, offsetAlongWall: 6.5, style: 'casement' },
    ],
    furniture: [
      // Living Room
      { name: '3-Seat Sofa', catalogId: 'sofa-3seat', category: 'living-room', width: 2.2, height: 0.85, depth: 0.9, transform: { position: { x: 1.5, y: 0, z: 3.5 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } }, material: { color: '#6366f1', roughness: 0.8, metalness: 0, opacity: 1, name: 'Fabric' } },
      { name: 'Coffee Table', catalogId: 'coffee-table', category: 'living-room', width: 1.2, height: 0.45, depth: 0.6, transform: { position: { x: 3.5, y: 0, z: 2.5 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } }, material: { color: '#92400e', roughness: 0.6, metalness: 0.1, opacity: 1, name: 'Wood' } },
      { name: 'TV Stand', catalogId: 'tv-stand', category: 'living-room', width: 1.5, height: 0.5, depth: 0.4, transform: { position: { x: 3.5, y: 0, z: 0.5 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } }, material: { color: '#44403c', roughness: 0.7, metalness: 0.1, opacity: 1, name: 'Dark Wood' } },
      // Kitchen
      { name: 'Kitchen Counter', catalogId: 'kitchen-counter', category: 'kitchen', width: 2.0, height: 0.9, depth: 0.6, transform: { position: { x: 9.5, y: 0, z: 0.5 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } }, material: { color: '#d6d3d1', roughness: 0.4, metalness: 0.2, opacity: 1, name: 'Granite' } },
      { name: 'Refrigerator', catalogId: 'fridge', category: 'kitchen', width: 0.7, height: 1.8, depth: 0.7, transform: { position: { x: 11.3, y: 0, z: 0.5 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } }, material: { color: '#d4d4d8', roughness: 0.3, metalness: 0.5, opacity: 1, name: 'Stainless' } },
      // Bedroom 1
      { name: 'Queen Bed', catalogId: 'bed-queen', category: 'bedroom', width: 1.6, height: 0.55, depth: 2.0, transform: { position: { x: 2.5, y: 0, z: 7 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } }, material: { color: '#7c3aed', roughness: 0.9, metalness: 0, opacity: 1, name: 'Fabric' } },
      { name: 'Nightstand', catalogId: 'nightstand', category: 'bedroom', width: 0.5, height: 0.55, depth: 0.4, transform: { position: { x: 0.5, y: 0, z: 6.5 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } }, material: { color: '#78716c', roughness: 0.7, metalness: 0.1, opacity: 1, name: 'Wood' } },
      // Bedroom 2
      { name: 'Single Bed', catalogId: 'bed-single', category: 'bedroom', width: 1.0, height: 0.55, depth: 2.0, transform: { position: { x: 7, y: 0, z: 7 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } }, material: { color: '#7c3aed', roughness: 0.9, metalness: 0, opacity: 1, name: 'Fabric' } },
      // Bathroom
      { name: 'Toilet', catalogId: 'toilet', category: 'bathroom', width: 0.4, height: 0.45, depth: 0.7, transform: { position: { x: 10, y: 0, z: 8 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } }, material: { color: '#fafaf9', roughness: 0.3, metalness: 0.1, opacity: 1, name: 'Ceramic' } },
      { name: 'Bathroom Sink', catalogId: 'sink-bath', category: 'bathroom', width: 0.6, height: 0.85, depth: 0.45, transform: { position: { x: 10, y: 0, z: 5.5 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } }, material: { color: '#fafaf9', roughness: 0.3, metalness: 0.1, opacity: 1, name: 'Ceramic' } },
    ],
  };
}

export function getStudioApartment(): BuildingTemplate {
  return {
    name: 'Studio Apartment',
    description: 'A compact studio apartment with open-plan living and kitchen.',
    walls: [
      { name: 'North Wall', start: { x: 0, y: 0 }, end: { x: 8, y: 0 } },
      { name: 'East Wall', start: { x: 8, y: 0 }, end: { x: 8, y: 6 } },
      { name: 'South Wall', start: { x: 8, y: 6 }, end: { x: 0, y: 6 } },
      { name: 'West Wall', start: { x: 0, y: 6 }, end: { x: 0, y: 0 } },
      { name: 'Bathroom Wall 1', start: { x: 6, y: 4 }, end: { x: 8, y: 4 } },
      { name: 'Bathroom Wall 2', start: { x: 6, y: 4 }, end: { x: 6, y: 6 } },
    ],
    rooms: [
      { name: 'Living/Bedroom', label: 'Living Area', corners: [{ x: 0, y: 0 }, { x: 8, y: 0 }, { x: 8, y: 4 }, { x: 6, y: 4 }, { x: 6, y: 6 }, { x: 0, y: 6 }], material: { color: '#fef3c7', roughness: 0.9, metalness: 0, opacity: 1, name: 'Wood Floor' } },
      { name: 'Bathroom', label: 'Bathroom', corners: [{ x: 6, y: 4 }, { x: 8, y: 4 }, { x: 8, y: 6 }, { x: 6, y: 6 }], material: { color: '#f0fdfa', roughness: 0.5, metalness: 0, opacity: 1, name: 'Tile' } },
    ],
    doors: [
      { name: 'Front Door', wallId: '', width: 0.9, height: 2.1, offsetAlongWall: 2, openDirection: 'right', style: 'hinged' },
      { name: 'Bathroom Door', wallId: '', width: 0.7, height: 2.1, offsetAlongWall: 0.5, openDirection: 'left', style: 'hinged' },
    ],
    windows: [
      { name: 'Main Window', wallId: '', width: 2.0, height: 1.5, sillHeight: 0.8, offsetAlongWall: 3, style: 'sliding' },
    ],
    furniture: [
      { name: 'Single Bed', catalogId: 'bed-single', category: 'bedroom', width: 1.0, height: 0.55, depth: 2.0, transform: { position: { x: 1, y: 0, z: 5 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } }, material: { color: '#7c3aed', roughness: 0.9, metalness: 0, opacity: 1, name: 'Fabric' } },
      { name: '2-Seat Sofa', catalogId: 'sofa-2seat', category: 'living-room', width: 1.5, height: 0.85, depth: 0.9, transform: { position: { x: 4, y: 0, z: 2 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } }, material: { color: '#6366f1', roughness: 0.8, metalness: 0, opacity: 1, name: 'Fabric' } },
    ],
  };
}

export function getOfficeLayout(): BuildingTemplate {
  return {
    name: 'Small Office',
    description: 'A small office with reception, meeting room, and two workspaces.',
    walls: [
      { name: 'North Wall', start: { x: 0, y: 0 }, end: { x: 10, y: 0 } },
      { name: 'East Wall', start: { x: 10, y: 0 }, end: { x: 10, y: 8 } },
      { name: 'South Wall', start: { x: 10, y: 8 }, end: { x: 0, y: 8 } },
      { name: 'West Wall', start: { x: 0, y: 8 }, end: { x: 0, y: 0 } },
      { name: 'Meeting Room Wall 1', start: { x: 5, y: 0 }, end: { x: 5, y: 4 } },
      { name: 'Meeting Room Wall 2', start: { x: 5, y: 4 }, end: { x: 10, y: 4 } },
    ],
    rooms: [
      { name: 'Open Workspace', label: 'Workspace', corners: [{ x: 0, y: 0 }, { x: 5, y: 0 }, { x: 5, y: 4 }, { x: 10, y: 4 }, { x: 10, y: 8 }, { x: 0, y: 8 }], material: { color: '#f5f5f4', roughness: 0.7, metalness: 0, opacity: 1, name: 'Carpet Tile' } },
      { name: 'Meeting Room', label: 'Meeting Room', corners: [{ x: 5, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 4 }, { x: 5, y: 4 }], material: { color: '#ede9fe', roughness: 0.7, metalness: 0, opacity: 1, name: 'Carpet' } },
    ],
    doors: [
      { name: 'Entrance', wallId: '', width: 1.2, height: 2.1, offsetAlongWall: 1, openDirection: 'double', style: 'hinged' },
      { name: 'Meeting Room Door', wallId: '', width: 0.9, height: 2.1, offsetAlongWall: 1.5, openDirection: 'left', style: 'hinged' },
    ],
    windows: [
      { name: 'Front Window', wallId: '', width: 2.0, height: 1.5, sillHeight: 0.8, offsetAlongWall: 4, style: 'double' },
    ],
    furniture: [
      { name: 'Office Desk 1', catalogId: 'office-desk', category: 'office', width: 1.6, height: 0.75, depth: 0.8, transform: { position: { x: 2, y: 0, z: 6 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } }, material: { color: '#78716c', roughness: 0.6, metalness: 0.1, opacity: 1, name: 'Laminate' } },
      { name: 'Office Desk 2', catalogId: 'office-desk', category: 'office', width: 1.6, height: 0.75, depth: 0.8, transform: { position: { x: 5, y: 0, z: 6 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } }, material: { color: '#78716c', roughness: 0.6, metalness: 0.1, opacity: 1, name: 'Laminate' } },
      { name: 'Conference Table', catalogId: 'conference-table', category: 'office', width: 2.4, height: 0.75, depth: 1.2, transform: { position: { x: 7.5, y: 0, z: 2 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } }, material: { color: '#57534e', roughness: 0.5, metalness: 0.1, opacity: 1, name: 'Walnut' } },
    ],
  };
}

export function getFruitShopLayout(): BuildingTemplate {
  const w1 = wallId(), w2 = wallId(), w3 = wallId(), w4 = wallId(), w5 = wallId();

  return {
    name: 'Fruit Shop',
    description: 'A modern fruit shop layout optimized for 17 ft x 9 ft dimensions.',
    walls: [
      // Outer walls (17ft x 9ft => 5.2m x 2.7m)
      { id: w1, name: 'North Wall', start: { x: 0, y: 0 }, end: { x: 5.2, y: 0 } },
      { id: w2, name: 'East Wall (Rear)', start: { x: 5.2, y: 0 }, end: { x: 5.2, y: 2.7 } },
      { id: w3, name: 'South Wall', start: { x: 5.2, y: 2.7 }, end: { x: 0, y: 2.7 } },
      { id: w4, name: 'West Wall (Front Entrance)', start: { x: 0, y: 2.7 }, end: { x: 0, y: 0 } },
      // Inner divider between Customer Zone and Staff Prep Area
      { id: w5, name: 'Staff Divider Counter', start: { x: 3.8, y: 0 }, end: { x: 3.8, y: 2.7 } },
    ],
    rooms: [
      { 
        name: 'Customer Zone', 
        label: 'Customer Zone', 
        corners: [{ x: 0, y: 0 }, { x: 3.8, y: 0 }, { x: 3.8, y: 2.7 }, { x: 0, y: 2.7 }], 
        material: { color: '#f0fdf4', roughness: 0.8, metalness: 0, opacity: 1, name: 'Warm Oak Tile' } 
      },
      { 
        name: 'Staff Prep Area', 
        label: 'Staff Prep Area', 
        corners: [{ x: 3.8, y: 0 }, { x: 5.2, y: 0 }, { x: 5.2, y: 2.7 }, { x: 3.8, y: 2.7 }], 
        material: { color: '#ffffff', roughness: 0.6, metalness: 0, opacity: 1, name: 'Hygienic Vinyl' } 
      },
    ],
    doors: [
      // Main Entrance on the 9-foot (West) side
      { name: 'Entrance', wallId: w4, width: 1.2, height: 2.1, offsetAlongWall: 0.75, openDirection: 'double', style: 'hinged' },
      // Staff door through partition
      { name: 'Staff Access Door', wallId: w5, width: 0.8, height: 2.1, offsetAlongWall: 1.9, openDirection: 'right', style: 'hinged' },
    ],
    windows: [
      // Large storefront display windows on the front (West) wall next to entrance
      { name: 'Storefront Window', wallId: w4, width: 0.8, height: 1.8, sillHeight: 0.3, offsetAlongWall: 0.1, style: 'single' },
    ],
    furniture: [
      // --- Customer Zone ---
      // Display shelf along North Wall
      { name: 'Fruit Rack (North)', catalogId: 'bookshelf', category: 'living-room', width: 1.5, height: 1.8, depth: 0.35, transform: { position: { x: 1.2, y: 0, z: 0.2 }, rotation: { x: 0, y: 180, z: 0 }, scale: { x: 1, y: 1, z: 1 } }, material: { color: '#16a34a', roughness: 0.8, metalness: 0, opacity: 1, name: 'Green Steel Frame' } },
      // Display shelf along South Wall
      { name: 'Fruit Rack (South)', catalogId: 'bookshelf', category: 'living-room', width: 1.5, height: 1.8, depth: 0.35, transform: { position: { x: 1.2, y: 0, z: 2.5 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } }, material: { color: '#16a34a', roughness: 0.8, metalness: 0, opacity: 1, name: 'Green Steel Frame' } },
      // Central Display Island
      { name: 'Seasonal Fruit Island', catalogId: 'coffee-table', category: 'living-room', width: 1.2, height: 0.6, depth: 0.6, transform: { position: { x: 2.3, y: 0, z: 1.35 }, rotation: { x: 0, y: 90, z: 0 }, scale: { x: 1, y: 1, z: 1 } }, material: { color: '#b45309', roughness: 0.5, metalness: 0, opacity: 1, name: 'Warm Bamboo' } },
      // Flower Display near entrance
      { name: 'Flower Display Planter', catalogId: 'planter', category: 'outdoor', width: 0.5, height: 0.6, depth: 0.5, transform: { position: { x: 0.4, y: 0, z: 2.3 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } }, material: { color: '#22c55e', roughness: 0.9, metalness: 0, opacity: 1, name: 'Eco Plastic' } },
      // Chiller for customers
      { name: 'Juice Chiller Fridge', catalogId: 'fridge', category: 'kitchen', width: 0.7, height: 1.8, depth: 0.7, transform: { position: { x: 3.3, y: 0, z: 0.45 }, rotation: { x: 0, y: 180, z: 0 }, scale: { x: 1, y: 1, z: 1 } }, material: { color: '#ffffff', roughness: 0.2, metalness: 0.8, opacity: 1, name: 'Glass Chiller' } },
      // Seating Area: Table and chairs
      { name: 'Customer Table', catalogId: 'patio-table', category: 'outdoor', width: 0.8, height: 0.75, depth: 0.8, transform: { position: { x: 3.1, y: 0, z: 2.2 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } }, material: { color: '#d97706', roughness: 0.6, metalness: 0, opacity: 1, name: 'Teak Wood' } },
      { name: 'Customer Chair 1', catalogId: 'patio-chair', category: 'outdoor', width: 0.5, height: 0.8, depth: 0.5, transform: { position: { x: 2.6, y: 0, z: 2.2 }, rotation: { x: 0, y: 90, z: 0 }, scale: { x: 1, y: 1, z: 1 } }, material: { color: '#ffffff', roughness: 0.7, metalness: 0.1, opacity: 1, name: 'White Rattan' } },
      { name: 'Customer Chair 2', catalogId: 'patio-chair', category: 'outdoor', width: 0.5, height: 0.8, depth: 0.5, transform: { position: { x: 3.1, y: 0, z: 1.6 }, rotation: { x: 0, y: 180, z: 0 }, scale: { x: 1, y: 1, z: 1 } }, material: { color: '#ffffff', roughness: 0.7, metalness: 0.1, opacity: 1, name: 'White Rattan' } },
      
      // Service Counter (customer-facing) — placed along the staff divider wall
      { name: 'Service Counter', catalogId: 'service-counter', category: 'kitchen', width: 2.0, height: 1.0, depth: 0.5, transform: { position: { x: 3.55, y: 0, z: 1.0 }, rotation: { x: 0, y: 270, z: 0 }, scale: { x: 1, y: 1, z: 1 } }, material: { color: '#b45309', roughness: 0.5, metalness: 0.1, opacity: 1, name: 'Warm Walnut Counter' } },

      // --- Staff Preparation Area ---
      // Preparation Counter and sink
      { name: 'Fruit Prep Counter', catalogId: 'kitchen-counter', category: 'kitchen', width: 1.8, height: 0.9, depth: 0.6, transform: { position: { x: 4.8, y: 0, z: 0.5 }, rotation: { x: 0, y: 180, z: 0 }, scale: { x: 1, y: 1, z: 1 } }, material: { color: '#f8fafc', roughness: 0.3, metalness: 0.6, opacity: 1, name: 'Stainless Steel Counter' } },
      // Storage fridge within staff area
      { name: 'Staff Storage Fridge', catalogId: 'fridge', category: 'kitchen', width: 0.7, height: 1.8, depth: 0.7, transform: { position: { x: 4.8, y: 0, z: 2.2 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } }, material: { color: '#e2e8f0', roughness: 0.3, metalness: 0.5, opacity: 1, name: 'Stainless Fridge' } },
      // Packaging desk
      { name: 'Packaging Station', catalogId: 'desk', category: 'bedroom', width: 1.0, height: 0.75, depth: 0.6, transform: { position: { x: 4.1, y: 0, z: 1.35 }, rotation: { x: 0, y: 270, z: 0 }, scale: { x: 1, y: 1, z: 1 } }, material: { color: '#475569', roughness: 0.7, metalness: 0.1, opacity: 1, name: 'Slate Countertop' } },
    ]
  };
}

export const templateMap: Record<string, () => BuildingTemplate> = {
  'bungalow': getTwoBedBungalow,
  'two-bedroom': getTwoBedBungalow,
  'house': getTwoBedBungalow,
  'home': getTwoBedBungalow,
  'studio': getStudioApartment,
  'apartment': getStudioApartment,
  'flat': getStudioApartment,
  'office': getOfficeLayout,
  'workspace': getOfficeLayout,
  'shop': getFruitShopLayout,
  'fruit': getFruitShopLayout,
  'store': getFruitShopLayout,
  'grocer': getFruitShopLayout,
  'retail': getFruitShopLayout,
};
