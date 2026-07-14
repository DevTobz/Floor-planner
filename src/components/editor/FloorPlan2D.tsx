"use client";

import { useRef, useMemo, useEffect, useState, useCallback } from "react";
import { useProjectStore } from "@/store/project-store";
import { useUIStore } from "@/store/ui-store";
import { distance2D, polygonCenter, formatMeasurement, snapToGrid } from "@/lib/utils";
import { Minus, Plus } from "lucide-react";

interface FloorPlan2DProps {
  readOnly?: boolean;
}

export default function FloorPlan2D({ readOnly = false }: FloorPlan2DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const project = useProjectStore((s) => s.project);
  
  const {
    canvasZoom, canvasOffset, setCanvasZoom, setCanvasOffset,
    showGrid, snapToGrid: shouldSnap, selectedObjects, selectObject,
    clearSelection, activeTool, hoveredObject, setHoveredObject,
    gridSize,
  } = useUIStore();

  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragObjInfo, setDragObjInfo] = useState<{ type: string; id: string } | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const ppm = canvasZoom; // pixels per meter

  const worldToScreen = useCallback(
    (wx: number, wy: number) => ({
      x: wx * ppm + canvasOffset.x,
      y: wy * ppm + canvasOffset.y,
    }),
    [ppm, canvasOffset]
  );

  const screenToWorld = useCallback(
    (sx: number, sy: number) => ({
      x: (sx - canvasOffset.x) / ppm,
      y: (sy - canvasOffset.y) / ppm,
    }),
    [ppm, canvasOffset]
  );

  // Geometry helper: Point in polygon test
  const pointInPolygon = (px: number, py: number, polygon: { x: number; y: number }[]) => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x, yi = polygon[i].y;
      const xj = polygon[j].x, yj = polygon[j].y;
      if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
        inside = !inside;
      }
    }
    return inside;
  };

  // Geometry helper: Point to segment distance
  const pointToSegmentDistance = (px: number, py: number, a: { x: number; y: number }, b: { x: number; y: number }) => {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.sqrt((px - a.x) ** 2 + (py - a.y) ** 2);
    let t = ((px - a.x) * dx + (py - a.y) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    const closestX = a.x + t * dx;
    const closestY = a.y + t * dy;
    return Math.sqrt((px - closestX) ** 2 + (py - closestY) ** 2);
  };

  const hitTest = useCallback((wx: number, wy: number): { id: string; type: string } | null => {
    if (!project || readOnly) return null;

    // Hit test furniture first (top layer)
    for (const item of [...project.furniture].reverse()) {
      if (!item.visible || item.locked) continue;
      const cx = item.transform.position.x;
      const cz = item.transform.position.z;
      const hw = item.width / 2;
      const hd = item.depth / 2;
      if (wx >= cx - hw && wx <= cx + hw && wy >= cz - hd && wy <= cz + hd) {
        return { id: item.id, type: "furniture" };
      }
    }

    // Hit test rooms
    for (const room of project.rooms) {
      if (!room.visible || room.locked) continue;
      if (pointInPolygon(wx, wy, room.corners)) {
        return { id: room.id, type: "room" };
      }
    }

    // Hit test walls
    for (const wall of project.walls) {
      if (!wall.visible || wall.locked) continue;
      const dist = pointToSegmentDistance(wx, wy, wall.start, wall.end);
      if (dist < wall.thickness + 0.3) {
        return { id: wall.id, type: "wall" };
      }
    }

    return null;
  }, [project, readOnly]);

  // Draw loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !project) return;

    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext("2d")!;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Background
    ctx.fillStyle = "#0d0d11";
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Grid
    if (showGrid) {
      const gridPx = gridSize * ppm;
      if (gridPx > 8) {
        ctx.strokeStyle = "rgba(63, 63, 70, 0.3)";
        ctx.lineWidth = 0.5;
        const startX = canvasOffset.x % gridPx;
        const startY = canvasOffset.y % gridPx;
        for (let x = startX; x < rect.width; x += gridPx) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, rect.height);
          ctx.stroke();
        }
        for (let y = startY; y < rect.height; y += gridPx) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(rect.width, y);
          ctx.stroke();
        }

        // Major grid lines
        const majorGridPx = gridSize * 5 * ppm;
        if (majorGridPx > 20) {
          ctx.strokeStyle = "rgba(63, 63, 70, 0.5)";
          ctx.lineWidth = 1;
          const majorStartX = canvasOffset.x % majorGridPx;
          const majorStartY = canvasOffset.y % majorGridPx;
          for (let x = majorStartX; x < rect.width; x += majorGridPx) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, rect.height);
            ctx.stroke();
          }
          for (let y = majorStartY; y < rect.height; y += majorGridPx) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(rect.width, y);
            ctx.stroke();
          }
        }
      }
    }

    // Origin marker
    const origin = worldToScreen(0, 0);
    ctx.strokeStyle = "rgba(99, 102, 241, 0.4)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(origin.x - 10, origin.y);
    ctx.lineTo(origin.x + 10, origin.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(origin.x, origin.y - 10);
    ctx.lineTo(origin.x, origin.y + 10);
    ctx.stroke();

    // Draw rooms
    for (const room of project.rooms) {
      if (!room.visible) continue;
      if (room.corners.length < 3) continue;

      const isSelected = !readOnly && selectedObjects.some((o) => o.id === room.id);
      const isHovered = !readOnly && hoveredObject?.id === room.id;

      ctx.beginPath();
      const first = worldToScreen(room.corners[0].x, room.corners[0].y);
      ctx.moveTo(first.x, first.y);
      for (let i = 1; i < room.corners.length; i++) {
        const p = worldToScreen(room.corners[i].x, room.corners[i].y);
        ctx.lineTo(p.x, p.y);
      }
      ctx.closePath();

      // Fill
      ctx.fillStyle = isSelected
        ? "rgba(99, 102, 241, 0.15)"
        : isHovered
        ? "rgba(99, 102, 241, 0.08)"
        : `${room.material.color}22`;
      ctx.fill();

      // Border
      ctx.strokeStyle = isSelected ? "#6366f1" : isHovered ? "#6366f180" : "rgba(100, 100, 100, 0.3)";
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.stroke();

      // Room label
      const center = polygonCenter(room.corners);
      const centerScreen = worldToScreen(center.x, center.y);
      ctx.fillStyle = isSelected ? "#a5b4fc" : "#a1a1aa";
      ctx.font = `${Math.max(10, ppm * 0.3)}px var(--font-sans, sans-serif)`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(room.label || room.name, centerScreen.x, centerScreen.y);

      // Area
      if (room.area) {
        ctx.fillStyle = "#71717a";
        ctx.font = `${Math.max(8, ppm * 0.2)}px var(--font-sans, sans-serif)`;
        ctx.fillText(`${room.area.toFixed(1)} m²`, centerScreen.x, centerScreen.y + ppm * 0.4);
      }
    }

    // Draw walls
    for (const wall of project.walls) {
      if (!wall.visible) continue;
      const s = worldToScreen(wall.start.x, wall.start.y);
      const e = worldToScreen(wall.end.x, wall.end.y);
      const isSelected = !readOnly && selectedObjects.some((o) => o.id === wall.id);
      const isHovered = !readOnly && hoveredObject?.id === wall.id;

      ctx.strokeStyle = isSelected ? "#8b5cf6" : isHovered ? "#a78bfa" : "#e4e4e7";
      ctx.lineWidth = Math.max(2, wall.thickness * ppm);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(e.x, e.y);
      ctx.stroke();

      // Dimension label
      const length = distance2D(wall.start, wall.end);
      const mid = worldToScreen(
        (wall.start.x + wall.end.x) / 2,
        (wall.start.y + wall.end.y) / 2
      );
      ctx.fillStyle = "#818cf8";
      ctx.font = `${Math.max(8, ppm * 0.18)}px var(--font-mono, monospace)`;
      ctx.textAlign = "center";
      ctx.fillText(formatMeasurement(length), mid.x, mid.y - 6);
    }

    // Draw doors
    for (const door of project.doors) {
      if (!door.visible) continue;
      const wall = project.walls.find((w) => w.id === door.wallId);
      if (!wall) continue;
      const wallLen = distance2D(wall.start, wall.end);
      if (wallLen === 0) continue;
      const t = door.offsetAlongWall / wallLen;
      const dx = wall.end.x - wall.start.x;
      const dy = wall.end.y - wall.start.y;
      const px = wall.start.x + dx * t;
      const py = wall.start.y + dy * t;
      const p = worldToScreen(px, py);
      const doorEnd = Math.min(1, (door.offsetAlongWall + door.width) / wallLen);
      const endPx = wall.start.x + dx * doorEnd;
      const endPy = wall.start.y + dy * doorEnd;
      const pe = worldToScreen(endPx, endPy);

      // Door gap
      ctx.strokeStyle = door.material?.color || "#ef4444";
      ctx.lineWidth = Math.max(3, wall.thickness * ppm + 2);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(pe.x, pe.y);
      ctx.stroke();

      // Door arc
      const isSelected = !readOnly && selectedObjects.some((o) => o.id === door.id);
      ctx.strokeStyle = isSelected ? "#f59e0b" : (door.material?.color || "#ef4444");
      ctx.lineWidth = 2;
      const radius = door.width * ppm;
      const angle = Math.atan2(dy, dx);
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, angle - Math.PI / 2, angle, door.openDirection === "left");
      ctx.stroke();
    }

    // Draw windows
    for (const win of project.windows) {
      if (!win.visible) continue;
      const wall = project.walls.find((w) => w.id === win.wallId);
      if (!wall) continue;
      const wallLen = distance2D(wall.start, wall.end);
      if (wallLen === 0) continue;
      const t = win.offsetAlongWall / wallLen;
      const dx = wall.end.x - wall.start.x;
      const dy = wall.end.y - wall.start.y;
      const px = wall.start.x + dx * t;
      const py = wall.start.y + dy * t;
      const p = worldToScreen(px, py);
      const winEnd = Math.min(1, (win.offsetAlongWall + win.width) / wallLen);
      const endPx = wall.start.x + dx * winEnd;
      const endPy = wall.start.y + dy * winEnd;
      const pe = worldToScreen(endPx, endPy);

      const isSelected = !readOnly && selectedObjects.some((o) => o.id === win.id);
      ctx.strokeStyle = isSelected ? "#38bdf8" : (win.material?.color || "#06b6d4");
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(pe.x, pe.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw furniture
    for (const item of project.furniture) {
      if (!item.visible) continue;
      const cx = item.transform.position.x;
      const cz = item.transform.position.z;
      const hw = item.width / 2;
      const hd = item.depth / 2;
      const tl = worldToScreen(cx - hw, cz - hd);
      const w = item.width * ppm;
      const h = item.depth * ppm;

      const isSelected = !readOnly && selectedObjects.some((o) => o.id === item.id);
      const isHovered = !readOnly && hoveredObject?.id === item.id;

      ctx.fillStyle = isSelected
        ? "rgba(139, 92, 246, 0.25)"
        : isHovered
        ? "rgba(139, 92, 246, 0.12)"
        : `${item.material.color}40`;
      ctx.strokeStyle = isSelected ? "#8b5cf6" : isHovered ? "#a78bfa" : `${item.material.color}80`;
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.fillRect(tl.x, tl.y, w, h);
      ctx.strokeRect(tl.x, tl.y, w, h);

      // Label
      ctx.fillStyle = isSelected ? "#c4b5fd" : "#a1a1aa";
      ctx.font = `${Math.max(7, ppm * 0.13)}px var(--font-sans, sans-serif)`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const name = item.name.length > 12 ? item.name.substring(0, 10) + "…" : item.name;
      ctx.fillText(name, tl.x + w / 2, tl.y + h / 2);
    }
  }, [project, canvasZoom, canvasOffset, showGrid, selectedObjects, hoveredObject, worldToScreen, gridSize, ppm, readOnly]);

  // Handle window resizing
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Mouse handlers
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(5, Math.min(200, canvasZoom * delta));
    const rect = canvasRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const wx = (mx - canvasOffset.x) / canvasZoom;
    const wy = (my - canvasOffset.y) / canvasZoom;
    setCanvasZoom(newZoom);
    setCanvasOffset({
      x: mx - wx * newZoom,
      y: my - wy * newZoom,
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && activeTool === "pan") || e.shiftKey || readOnly) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - canvasOffset.x, y: e.clientY - canvasOffset.y });
      return;
    }

    if (e.button === 0 && activeTool === "select") {
      const rect = canvasRef.current!.getBoundingClientRect();
      const world = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
      const hit = hitTest(world.x, world.y);
      if (hit) {
        selectObject(hit);
        setIsDragging(true);
        setDragObjInfo(hit);
        setDragStart(world);
      } else {
        clearSelection();
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setCanvasOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    if (isDragging && dragObjInfo && !readOnly) {
      const rect = canvasRef.current!.getBoundingClientRect();
      const world = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
      let dx = world.x - dragStart.x;
      let dy = world.y - dragStart.y;
      
      if (shouldSnap) {
        dx = snapToGrid(dx, gridSize);
        dy = snapToGrid(dy, gridSize);
      }

      if (dragObjInfo.type === "furniture") {
        const item = project?.furniture.find((f) => f.id === dragObjInfo.id);
        if (item) {
          useProjectStore.getState().updateFurniture(dragObjInfo.id, {
            transform: {
              ...item.transform,
              position: {
                x: item.transform.position.x + dx,
                y: item.transform.position.y,
                z: item.transform.position.z + dy,
              },
            },
          });
          setDragStart(world);
        }
      }
      return;
    }

    if (!readOnly) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const world = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
      const hit = hitTest(world.x, world.y);
      setHoveredObject(hit);
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setIsDragging(false);
    setDragObjInfo(null);
  };

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full relative overflow-hidden" 
      style={{ cursor: isPanning ? "grabbing" : (activeTool === "pan" || readOnly) ? "grab" : "default" }}
    >
      <canvas
        ref={canvasRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="absolute inset-0"
      />
      {/* Zoom indicator */}
      <div className="absolute bottom-3 left-3 flex items-center gap-2 px-2 py-1 rounded-md bg-[var(--bg-secondary)] border border-[var(--border-default)] text-xs text-[var(--text-tertiary)] z-10">
        <button onClick={() => setCanvasZoom(Math.max(5, canvasZoom * 0.8))} className="btn-icon" style={{ width: 20, height: 20 }}>
          <Minus className="w-3 h-3" />
        </button>
        <span className="w-12 text-center">{Math.round(canvasZoom / 0.4)}%</span>
        <button onClick={() => setCanvasZoom(Math.min(200, canvasZoom * 1.25))} className="btn-icon" style={{ width: 20, height: 20 }}>
          <Plus className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
