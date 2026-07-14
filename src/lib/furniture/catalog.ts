// ============================================================
// BuildAI Studio — Furniture Catalog
// Complete catalog of furniture items with dimensions
// ============================================================

import type { FurnitureCategory } from '@/types/project';

export interface CatalogItem {
  id: string;
  name: string;
  category: FurnitureCategory;
  width: number;    // meters
  height: number;   // meters
  depth: number;    // meters
  color: string;    // hex
  icon: string;     // emoji for 2D
  primitiveType: '3d-box' | '3d-cylinder' | '3d-composite';
}

export const furnitureCatalog: CatalogItem[] = [
  // ─── Living Room ───
  { id: 'sofa-3seat', name: '3-Seat Sofa', category: 'living-room', width: 2.2, height: 0.85, depth: 0.9, color: '#6366f1', icon: '🛋️', primitiveType: '3d-composite' },
  { id: 'sofa-2seat', name: '2-Seat Sofa', category: 'living-room', width: 1.5, height: 0.85, depth: 0.9, color: '#6366f1', icon: '🛋️', primitiveType: '3d-composite' },
  { id: 'armchair', name: 'Armchair', category: 'living-room', width: 0.85, height: 0.85, depth: 0.85, color: '#8b5cf6', icon: '💺', primitiveType: '3d-box' },
  { id: 'coffee-table', name: 'Coffee Table', category: 'living-room', width: 1.2, height: 0.45, depth: 0.6, color: '#92400e', icon: '☕', primitiveType: '3d-box' },
  { id: 'tv-stand', name: 'TV Stand', category: 'living-room', width: 1.5, height: 0.5, depth: 0.4, color: '#44403c', icon: '📺', primitiveType: '3d-box' },
  { id: 'bookshelf', name: 'Bookshelf', category: 'living-room', width: 0.8, height: 1.8, depth: 0.35, color: '#78716c', icon: '📚', primitiveType: '3d-box' },
  { id: 'floor-lamp', name: 'Floor Lamp', category: 'living-room', width: 0.3, height: 1.6, depth: 0.3, color: '#fbbf24', icon: '💡', primitiveType: '3d-cylinder' },
  { id: 'rug-rect', name: 'Area Rug', category: 'living-room', width: 2.0, height: 0.02, depth: 1.4, color: '#b91c1c', icon: '🟫', primitiveType: '3d-box' },
  { id: 'dining-table', name: 'Dining Table', category: 'living-room', width: 1.6, height: 0.75, depth: 0.9, color: '#92400e', icon: '🍽️', primitiveType: '3d-box' },
  { id: 'dining-chair', name: 'Dining Chair', category: 'living-room', width: 0.45, height: 0.9, depth: 0.45, color: '#78716c', icon: '🪑', primitiveType: '3d-box' },

  // ─── Bedroom ───
  { id: 'bed-king', name: 'King Bed', category: 'bedroom', width: 2.0, height: 0.55, depth: 2.1, color: '#7c3aed', icon: '🛏️', primitiveType: '3d-composite' },
  { id: 'bed-queen', name: 'Queen Bed', category: 'bedroom', width: 1.6, height: 0.55, depth: 2.0, color: '#7c3aed', icon: '🛏️', primitiveType: '3d-composite' },
  { id: 'bed-single', name: 'Single Bed', category: 'bedroom', width: 1.0, height: 0.55, depth: 2.0, color: '#7c3aed', icon: '🛏️', primitiveType: '3d-composite' },
  { id: 'nightstand', name: 'Nightstand', category: 'bedroom', width: 0.5, height: 0.55, depth: 0.4, color: '#78716c', icon: '🗄️', primitiveType: '3d-box' },
  { id: 'wardrobe', name: 'Wardrobe', category: 'bedroom', width: 1.2, height: 2.0, depth: 0.6, color: '#57534e', icon: '🗄️', primitiveType: '3d-box' },
  { id: 'dresser', name: 'Dresser', category: 'bedroom', width: 1.0, height: 0.9, depth: 0.5, color: '#78716c', icon: '🗄️', primitiveType: '3d-box' },
  { id: 'desk', name: 'Desk', category: 'bedroom', width: 1.2, height: 0.75, depth: 0.6, color: '#92400e', icon: '🖥️', primitiveType: '3d-box' },

  // ─── Kitchen ───
  { id: 'kitchen-counter', name: 'Kitchen Counter', category: 'kitchen', width: 2.0, height: 0.9, depth: 0.6, color: '#d6d3d1', icon: '🔲', primitiveType: '3d-box' },
  { id: 'kitchen-island', name: 'Kitchen Island', category: 'kitchen', width: 1.5, height: 0.9, depth: 0.8, color: '#e7e5e4', icon: '🔲', primitiveType: '3d-box' },
  { id: 'fridge', name: 'Refrigerator', category: 'kitchen', width: 0.7, height: 1.8, depth: 0.7, color: '#d4d4d8', icon: '🧊', primitiveType: '3d-box' },
  { id: 'stove', name: 'Stove/Oven', category: 'kitchen', width: 0.6, height: 0.9, depth: 0.6, color: '#52525b', icon: '🍳', primitiveType: '3d-box' },
  { id: 'sink-kitchen', name: 'Kitchen Sink', category: 'kitchen', width: 0.6, height: 0.9, depth: 0.6, color: '#a8a29e', icon: '🚰', primitiveType: '3d-box' },
  { id: 'dishwasher', name: 'Dishwasher', category: 'kitchen', width: 0.6, height: 0.85, depth: 0.6, color: '#d4d4d8', icon: '🫧', primitiveType: '3d-box' },

  // ─── Bathroom ───
  { id: 'toilet', name: 'Toilet', category: 'bathroom', width: 0.4, height: 0.45, depth: 0.7, color: '#fafaf9', icon: '🚽', primitiveType: '3d-composite' },
  { id: 'bathtub', name: 'Bathtub', category: 'bathroom', width: 0.8, height: 0.55, depth: 1.7, color: '#fafaf9', icon: '🛁', primitiveType: '3d-box' },
  { id: 'shower', name: 'Shower', category: 'bathroom', width: 0.9, height: 2.1, depth: 0.9, color: '#e7e5e4', icon: '🚿', primitiveType: '3d-box' },
  { id: 'sink-bath', name: 'Bathroom Sink', category: 'bathroom', width: 0.6, height: 0.85, depth: 0.45, color: '#fafaf9', icon: '🪥', primitiveType: '3d-box' },
  { id: 'mirror', name: 'Wall Mirror', category: 'bathroom', width: 0.6, height: 0.8, depth: 0.05, color: '#bae6fd', icon: '🪞', primitiveType: '3d-box' },

  // ─── Office ───
  { id: 'office-desk', name: 'Office Desk', category: 'office', width: 1.6, height: 0.75, depth: 0.8, color: '#78716c', icon: '🖥️', primitiveType: '3d-box' },
  { id: 'office-chair', name: 'Office Chair', category: 'office', width: 0.6, height: 1.1, depth: 0.6, color: '#27272a', icon: '💺', primitiveType: '3d-cylinder' },
  { id: 'filing-cabinet', name: 'Filing Cabinet', category: 'office', width: 0.4, height: 1.2, depth: 0.6, color: '#71717a', icon: '🗄️', primitiveType: '3d-box' },
  { id: 'conference-table', name: 'Conference Table', category: 'office', width: 2.4, height: 0.75, depth: 1.2, color: '#57534e', icon: '🍽️', primitiveType: '3d-box' },
  { id: 'whiteboard', name: 'Whiteboard', category: 'office', width: 1.2, height: 0.9, depth: 0.05, color: '#fafaf9', icon: '📋', primitiveType: '3d-box' },

  // ─── Outdoor ───
  { id: 'patio-table', name: 'Patio Table', category: 'outdoor', width: 1.0, height: 0.75, depth: 1.0, color: '#78716c', icon: '🏖️', primitiveType: '3d-cylinder' },
  { id: 'patio-chair', name: 'Patio Chair', category: 'outdoor', width: 0.6, height: 0.85, depth: 0.6, color: '#a16207', icon: '🪑', primitiveType: '3d-box' },
  { id: 'planter', name: 'Planter', category: 'outdoor', width: 0.4, height: 0.4, depth: 0.4, color: '#854d0e', icon: '🌱', primitiveType: '3d-cylinder' },
  { id: 'grill', name: 'BBQ Grill', category: 'outdoor', width: 0.6, height: 1.0, depth: 0.5, color: '#27272a', icon: '🔥', primitiveType: '3d-box' },
];

export const categories: { id: FurnitureCategory; label: string; icon: string }[] = [
  { id: 'living-room', label: 'Living Room', icon: '🛋️' },
  { id: 'bedroom', label: 'Bedroom', icon: '🛏️' },
  { id: 'kitchen', label: 'Kitchen', icon: '🍳' },
  { id: 'bathroom', label: 'Bathroom', icon: '🚿' },
  { id: 'office', label: 'Office', icon: '🖥️' },
  { id: 'outdoor', label: 'Outdoor', icon: '🌿' },
];

export function getCatalogItem(id: string): CatalogItem | undefined {
  return furnitureCatalog.find((item) => item.id === id);
}

export function getCategoryItems(category: FurnitureCategory): CatalogItem[] {
  return furnitureCatalog.filter((item) => item.category === category);
}

export function searchCatalog(query: string): CatalogItem[] {
  const lower = query.toLowerCase();
  return furnitureCatalog.filter(
    (item) =>
      item.name.toLowerCase().includes(lower) ||
      item.category.toLowerCase().includes(lower)
  );
}
