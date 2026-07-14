// ============================================================
// BuildAI Studio — UI State Store
// Manages editor UI state separate from project data
// ============================================================

import { create } from 'zustand';

export type EditorTool =
  | 'select'
  | 'wall'
  | 'room'
  | 'door'
  | 'window'
  | 'furniture'
  | 'measure'
  | 'pan';

export type ViewMode = '2d' | '3d' | 'split';
export type CameraMode = 'orbit' | 'walk';

interface SelectedObject {
  id: string;
  type: string;
}

interface UIState {
  // View
  viewMode: ViewMode;
  cameraMode: CameraMode;
  showGrid: boolean;
  gridSize: number;
  snapToGrid: boolean;
  snapToWall: boolean;

  // Tool
  activeTool: EditorTool;

  // Selection
  selectedObjects: SelectedObject[];
  hoveredObject: SelectedObject | null;

  // Panels
  showInspector: boolean;
  showFurniturePanel: boolean;
  showAIChat: boolean;
  showLayerPanel: boolean;

  // 2D Canvas state
  canvasZoom: number;
  canvasOffset: { x: number; y: number };

  // Drawing state (for wall/room tool)
  isDrawing: boolean;
  drawingPoints: { x: number; y: number }[];

  // Actions
  setViewMode: (mode: ViewMode) => void;
  setCameraMode: (mode: CameraMode) => void;
  setActiveTool: (tool: EditorTool) => void;
  toggleGrid: () => void;
  toggleSnapToGrid: () => void;
  toggleSnapToWall: () => void;
  setGridSize: (size: number) => void;

  selectObject: (obj: SelectedObject) => void;
  addToSelection: (obj: SelectedObject) => void;
  removeFromSelection: (id: string) => void;
  clearSelection: () => void;
  setHoveredObject: (obj: SelectedObject | null) => void;

  toggleInspector: () => void;
  toggleFurniturePanel: () => void;
  toggleAIChat: () => void;
  toggleLayerPanel: () => void;

  setCanvasZoom: (zoom: number) => void;
  setCanvasOffset: (offset: { x: number; y: number }) => void;

  setIsDrawing: (drawing: boolean) => void;
  addDrawingPoint: (point: { x: number; y: number }) => void;
  clearDrawingPoints: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  viewMode: '2d',
  cameraMode: 'orbit',
  showGrid: true,
  gridSize: 0.5,
  snapToGrid: true,
  snapToWall: true,
  activeTool: 'select',
  selectedObjects: [],
  hoveredObject: null,
  showInspector: true,
  showFurniturePanel: false,
  showAIChat: false,
  showLayerPanel: false,
  canvasZoom: 40, // pixels per meter
  canvasOffset: { x: 0, y: 0 },
  isDrawing: false,
  drawingPoints: [],

  setViewMode: (mode) => set({ viewMode: mode }),
  setCameraMode: (mode) => set({ cameraMode: mode }),
  setActiveTool: (tool) => set({ activeTool: tool, isDrawing: false, drawingPoints: [] }),
  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
  toggleSnapToGrid: () => set((s) => ({ snapToGrid: !s.snapToGrid })),
  toggleSnapToWall: () => set((s) => ({ snapToWall: !s.snapToWall })),
  setGridSize: (size) => set({ gridSize: size }),

  selectObject: (obj) => set({ selectedObjects: [obj] }),
  addToSelection: (obj) =>
    set((s) => ({
      selectedObjects: s.selectedObjects.some((o) => o.id === obj.id)
        ? s.selectedObjects
        : [...s.selectedObjects, obj],
    })),
  removeFromSelection: (id) =>
    set((s) => ({
      selectedObjects: s.selectedObjects.filter((o) => o.id !== id),
    })),
  clearSelection: () => set({ selectedObjects: [] }),
  setHoveredObject: (obj) => set({ hoveredObject: obj }),

  toggleInspector: () => set((s) => ({ showInspector: !s.showInspector })),
  toggleFurniturePanel: () => set((s) => ({ showFurniturePanel: !s.showFurniturePanel })),
  toggleAIChat: () => set((s) => ({ showAIChat: !s.showAIChat })),
  toggleLayerPanel: () => set((s) => ({ showLayerPanel: !s.showLayerPanel })),

  setCanvasZoom: (zoom) => set({ canvasZoom: zoom }),
  setCanvasOffset: (offset) => set({ canvasOffset: offset }),

  setIsDrawing: (drawing) => set({ isDrawing: drawing }),
  addDrawingPoint: (point) => set((s) => ({ drawingPoints: [...s.drawingPoints, point] })),
  clearDrawingPoints: () => set({ drawingPoints: [] }),
}));
