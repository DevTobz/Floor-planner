import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { v4 as uuidv4 } from 'uuid';
import type { Vector2 } from '@/types/project';

/** Merge Tailwind classes with conflict resolution */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Generate a UUID v4 */
export function generateId(): string {
  return uuidv4();
}

/** Snap a value to the nearest grid unit */
export function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}

/** Clamp a number between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Linear interpolation */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Calculate distance between two 2D points */
export function distance2D(a: Vector2, b: Vector2): number {
  return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
}

/** Calculate angle between two 2D points in radians */
export function angle2D(a: Vector2, b: Vector2): number {
  return Math.atan2(b.y - a.y, b.x - a.x);
}

/** Calculate the area of a polygon given its vertices */
export function polygonArea(vertices: Vector2[]): number {
  let area = 0;
  const n = vertices.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += vertices[i].x * vertices[j].y;
    area -= vertices[j].x * vertices[i].y;
  }
  return Math.abs(area / 2);
}

/** Degrees to radians */
export function degToRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/** Radians to degrees */
export function radToDeg(radians: number): number {
  return radians * (180 / Math.PI);
}

/** Format meters for display */
export function formatMeasurement(meters: number, unit: 'meters' | 'feet' = 'meters'): string {
  if (unit === 'feet') {
    const feet = meters * 3.28084;
    return `${feet.toFixed(1)} ft`;
  }
  return `${meters.toFixed(2)} m`;
}

/** Get the center point of a polygon */
export function polygonCenter(vertices: Vector2[]): Vector2 {
  const n = vertices.length;
  const sum = vertices.reduce(
    (acc, v) => ({ x: acc.x + v.x, y: acc.y + v.y }),
    { x: 0, y: 0 }
  );
  return { x: sum.x / n, y: sum.y / n };
}

/** Calculate wall midpoint */
export function wallMidpoint(start: Vector2, end: Vector2): Vector2 {
  return {
    x: (start.x + end.x) / 2,
    y: (start.y + end.y) / 2,
  };
}
