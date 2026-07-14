"use client";

import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Grid, Sky, ContactShadows, Environment, TransformControls, Html } from "@react-three/drei";
import * as THREE from "three";
import { useProjectStore } from "@/store/project-store";
import { useUIStore } from "@/store/ui-store";
import { distance2D, degToRad, polygonCenter } from "@/lib/utils";
import type { Wall, Room, FurnitureItem, Door, Window as WindowType } from "@/types/project";

// Global ref to expose Three.js internals for PDF multi-angle capture
export const scene3dRef: { current: { camera: THREE.Camera; gl: THREE.WebGLRenderer; scene: THREE.Scene; controls: any } | null } = { current: null };

/** Small component that lives inside <Canvas> and populates scene3dRef */
function ExposeThreeInternals() {
  const { camera, gl, scene } = useThree();
  const controls = useThree((s) => (s as any).controls);
  useEffect(() => {
    scene3dRef.current = { camera, gl, scene, controls };
    return () => { scene3dRef.current = null; };
  }, [camera, gl, scene, controls]);
  return null;
}

// ============================================================
// WALL 3D
// ============================================================

function Wall3D({ wall }: { wall: Wall }) {
  const selectedObjects = useUIStore((s) => s.selectedObjects);
  const selectObject = useUIStore((s) => s.selectObject);
  const isSelected = selectedObjects.some((o) => o.id === wall.id);

  const length = distance2D(wall.start, wall.end);
  const midX = (wall.start.x + wall.end.x) / 2;
  const midZ = (wall.start.y + wall.end.y) / 2;
  const angle = Math.atan2(wall.end.y - wall.start.y, wall.end.x - wall.start.x);

  if (length === 0) return null;

  return (
    <group position={[midX, wall.height / 2, midZ]} rotation={[0, -angle, 0]}>
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          selectObject({ id: wall.id, type: "wall" });
        }}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[length, wall.height, wall.thickness]} />
        <meshStandardMaterial
          color={isSelected ? "#8b5cf6" : wall.material.color}
          roughness={wall.material.roughness}
          metalness={wall.material.metalness}
        />
      </mesh>
      <Html distanceFactor={8} position={[0, wall.height / 2 + 0.15, 0]} center>
        <div className="px-1 py-0.5 rounded bg-[#18181b]/90 border border-zinc-700 text-[8px] text-zinc-300 font-medium whitespace-nowrap pointer-events-none select-none shadow">
          {wall.name}
        </div>
      </Html>
    </group>
  );
}

// ============================================================
// ROOM FLOOR 3D
// ============================================================

function Room3D({ room }: { room: Room }) {
  const selectedObjects = useUIStore((s) => s.selectedObjects);
  const selectObject = useUIStore((s) => s.selectObject);
  const isSelected = selectedObjects.some((o) => o.id === room.id);

  const shape = useMemo(() => {
    const s = new THREE.Shape();
    if (room.corners.length < 3) return s;
    s.moveTo(room.corners[0].x, room.corners[0].y);
    for (let i = 1; i < room.corners.length; i++) {
      s.lineTo(room.corners[i].x, room.corners[i].y);
    }
    s.closePath();
    return s;
  }, [room.corners]);

  const center = useMemo(() => polygonCenter(room.corners), [room.corners]);

  return (
    <group>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.01, 0]}
        onClick={(e) => {
          e.stopPropagation();
          selectObject({ id: room.id, type: "room" });
        }}
        receiveShadow
      >
        <shapeGeometry args={[shape]} />
        <meshStandardMaterial
          color={isSelected ? "#6366f1" : room.material.color}
          roughness={room.material.roughness}
          side={THREE.DoubleSide}
          opacity={0.9}
          transparent
        />
      </mesh>
      <Html distanceFactor={8} position={[center.x, 0.05, center.y]} center>
        <div className="px-1 py-0.5 rounded bg-[#18181b]/90 border border-zinc-700 text-[8px] text-zinc-300 font-medium whitespace-nowrap pointer-events-none select-none shadow">
          {room.label || room.name}
        </div>
      </Html>
    </group>
  );
}

// ============================================================
// FURNITURE 3D
// ============================================================

function Furniture3D({ item }: { item: FurnitureItem }) {
  const selectedObjects = useUIStore((s) => s.selectedObjects);
  const selectObject = useUIStore((s) => s.selectObject);
  const isSelected = selectedObjects.some((o) => o.id === item.id);

  const pos = item.transform?.position || { x: 0, y: 0, z: 0 };
  const rot = item.transform?.rotation || { x: 0, y: 0, z: 0 };

  const px = pos.x ?? 0;
  const py = pos.y ?? 0;
  const pz = pos.z ?? 0;

  const rx = rot.x ?? 0;
  const ry = rot.y ?? 0;
  const rz = rot.z ?? 0;

  const w = item.width ?? 1;
  const h = item.height ?? 0.5;
  const d = item.depth ?? 1;

  const baseColor = isSelected ? "#a78bfa" : item.material?.color || "#d4d4d8";
  const roughness = item.material?.roughness ?? 0.7;
  const metalness = item.material?.metalness ?? 0.1;
  const opacity = item.material?.opacity ?? 1;

  const materialProps = {
    color: baseColor,
    roughness,
    metalness,
    opacity,
    transparent: opacity < 1,
  };

  const handleClick = (e: any) => {
    e.stopPropagation();
    selectObject({ id: item.id, type: "furniture" });
  };

  const renderGeometry = () => {
    const id = item.catalogId || "";

    if (id.startsWith("bed-")) {
      // BED PROCEDURAL MODEL
      return (
        <group>
          {/* Mattress/Frame */}
          <mesh castShadow receiveShadow position={[0, -h * 0.15, 0]}>
            <boxGeometry args={[w, h * 0.7, d]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
          {/* Bed Sheet/Cover */}
          <mesh castShadow receiveShadow position={[0, -h * 0.15 + h * 0.35 + 0.005, d * 0.1]}>
            <boxGeometry args={[w * 0.98, 0.02, d * 0.8]} />
            <meshStandardMaterial color="#3b82f6" roughness={0.9} />
          </mesh>
          {/* Pillows */}
          <group position={[0, -h * 0.15 + h * 0.35 + 0.01, -d * 0.35]}>
            {w > 1.2 ? (
              <>
                <mesh castShadow position={[-w * 0.25, 0.02, 0]}>
                  <boxGeometry args={[w * 0.35, 0.08, d * 0.15]} />
                  <meshStandardMaterial color="#ffffff" roughness={0.9} />
                </mesh>
                <mesh castShadow position={[w * 0.25, 0.02, 0]}>
                  <boxGeometry args={[w * 0.35, 0.08, d * 0.15]} />
                  <meshStandardMaterial color="#ffffff" roughness={0.9} />
                </mesh>
              </>
            ) : (
              <mesh castShadow position={[0, 0.02, 0]}>
                <boxGeometry args={[w * 0.6, 0.08, d * 0.15]} />
                <meshStandardMaterial color="#ffffff" roughness={0.9} />
              </mesh>
            )}
          </group>
          {/* Headboard */}
          <mesh castShadow position={[0, h * 0.15, -d / 2 + 0.025]}>
            <boxGeometry args={[w, h * 1.3, 0.05]} />
            <meshStandardMaterial color="#b45309" roughness={0.8} />
          </mesh>
        </group>
      );
    }

    if (id.startsWith("sofa-") || id === "armchair") {
      // SOFA / ARMCHAIR PROCEDURAL MODEL
      const armWidth = w * 0.08;
      const backDepth = d * 0.15;
      
      return (
        <group>
          {/* Base Seat Frame */}
          <mesh castShadow position={[0, -h * 0.25, 0]}>
            <boxGeometry args={[w, h * 0.4, d]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
          {/* Backrest */}
          <mesh castShadow position={[0, h * 0.15, -d / 2 + backDepth / 2]}>
            <boxGeometry args={[w, h * 0.7, backDepth]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
          {/* Left Armrest */}
          <mesh castShadow position={[-w / 2 + armWidth / 2, h * 0.05, 0]}>
            <boxGeometry args={[armWidth, h * 0.6, d * 0.95]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
          {/* Right Armrest */}
          <mesh castShadow position={[w / 2 - armWidth / 2, h * 0.05, 0]}>
            <boxGeometry args={[armWidth, h * 0.6, d * 0.95]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
          {/* Seat Cushions */}
          <mesh castShadow position={[0, -h * 0.05, backDepth / 2]}>
            <boxGeometry args={[w - armWidth * 2 - 0.02, h * 0.15, d - backDepth - 0.02]} />
            <meshStandardMaterial color={materialProps.color} roughness={0.9} />
          </mesh>
        </group>
      );
    }

    if (id.includes("table") || id === "desk" || id === "office-desk" || id.includes("counter") || id.includes("island")) {
      // TABLE / DESK / COUNTER PROCEDURAL MODEL
      const legThickness = Math.min(w, d) * 0.08;
      const topThickness = 0.04;
      const isRound = id === "patio-table";
      
      return (
        <group>
          {/* Table Top */}
          <mesh castShadow position={[0, h / 2 - topThickness / 2, 0]}>
            {isRound ? (
              <cylinderGeometry args={[w / 2, w / 2, topThickness, 32]} />
            ) : (
              <boxGeometry args={[w, topThickness, d]} />
            )}
            <meshStandardMaterial {...materialProps} />
          </mesh>
          
          {isRound ? (
            <mesh castShadow position={[0, -topThickness / 2, 0]}>
              <cylinderGeometry args={[legThickness * 1.5, legThickness * 1.5, h - topThickness, 16]} />
              <meshStandardMaterial color="#44403c" metalness={0.5} />
            </mesh>
          ) : (
            <group position={[0, -topThickness / 2, 0]}>
              <mesh castShadow position={[-w / 2 + legThickness, -h / 2 + topThickness / 2, -d / 2 + legThickness]}>
                <boxGeometry args={[legThickness, h - topThickness, legThickness]} />
                <meshStandardMaterial color="#44403c" />
              </mesh>
              <mesh castShadow position={[w / 2 - legThickness, -h / 2 + topThickness / 2, -d / 2 + legThickness]}>
                <boxGeometry args={[legThickness, h - topThickness, legThickness]} />
                <meshStandardMaterial color="#44403c" />
              </mesh>
              <mesh castShadow position={[-w / 2 + legThickness, -h / 2 + topThickness / 2, d / 2 - legThickness]}>
                <boxGeometry args={[legThickness, h - topThickness, legThickness]} />
                <meshStandardMaterial color="#44403c" />
              </mesh>
              <mesh castShadow position={[w / 2 - legThickness, -h / 2 + topThickness / 2, d / 2 - legThickness]}>
                <boxGeometry args={[legThickness, h - topThickness, legThickness]} />
                <meshStandardMaterial color="#44403c" />
              </mesh>
            </group>
          )}
        </group>
      );
    }

    if (id.includes("chair")) {
      // CHAIR PROCEDURAL MODEL
      const legThickness = w * 0.08;
      const seatThickness = 0.04;
      
      return (
        <group position={[0, -h * 0.1, 0]}>
          {/* Seat */}
          <mesh castShadow position={[0, 0, 0]}>
            <boxGeometry args={[w, seatThickness, d]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
          {/* Backrest */}
          <mesh castShadow position={[0, h * 0.35, -d / 2 + seatThickness / 2]}>
            <boxGeometry args={[w, h * 0.7, seatThickness]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
          {/* Legs */}
          <mesh castShadow position={[-w / 2 + legThickness, -h * 0.25, -d / 2 + legThickness]}>
            <boxGeometry args={[legThickness, h * 0.5, legThickness]} />
            <meshStandardMaterial color="#3f3f46" />
          </mesh>
          <mesh castShadow position={[w / 2 - legThickness, -h * 0.25, -d / 2 + legThickness]}>
            <boxGeometry args={[legThickness, h * 0.5, legThickness]} />
            <meshStandardMaterial color="#3f3f46" />
          </mesh>
          <mesh castShadow position={[-w / 2 + legThickness, -h * 0.25, d / 2 - legThickness]}>
            <boxGeometry args={[legThickness, h * 0.5, legThickness]} />
            <meshStandardMaterial color="#3f3f46" />
          </mesh>
          <mesh castShadow position={[w / 2 - legThickness, -h * 0.25, d / 2 - legThickness]}>
            <boxGeometry args={[legThickness, h * 0.5, legThickness]} />
            <meshStandardMaterial color="#3f3f46" />
          </mesh>
        </group>
      );
    }

    if (id === "tv-stand") {
      // TV STAND & TV PROCEDURAL MODEL
      return (
        <group>
          {/* Cabinet */}
          <mesh castShadow receiveShadow position={[0, -h * 0.2, 0]}>
            <boxGeometry args={[w, h * 0.6, d]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
          {/* TV base */}
          <mesh castShadow position={[0, h * 0.12, 0]}>
            <boxGeometry args={[w * 0.3, 0.02, d * 0.5]} />
            <meshStandardMaterial color="#18181b" roughness={0.2} metalness={0.8} />
          </mesh>
          {/* TV neck */}
          <mesh castShadow position={[0, h * 0.22, 0]}>
            <boxGeometry args={[w * 0.05, 0.2, 0.03]} />
            <meshStandardMaterial color="#18181b" roughness={0.2} metalness={0.8} />
          </mesh>
          {/* TV screen */}
          <mesh castShadow position={[0, h * 0.55, 0]}>
            <boxGeometry args={[w * 0.85, h * 0.8, 0.05]} />
            <meshStandardMaterial color="#09090b" roughness={0.1} metalness={0.9} />
          </mesh>
        </group>
      );
    }

    if (id === "fridge") {
      // REFRIGERATOR PROCEDURAL MODEL
      return (
        <group>
          {/* Main Fridge Body */}
          <mesh castShadow position={[0, 0, 0]}>
            <boxGeometry args={[w, h, d]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
          {/* Freezer Door (Top) */}
          <mesh castShadow position={[0, h * 0.25, d / 2 - 0.01]}>
            <boxGeometry args={[w * 0.98, h * 0.45, 0.03]} />
            <meshStandardMaterial color={materialProps.color} roughness={0.3} metalness={0.6} />
          </mesh>
          {/* Fridge Door (Bottom) */}
          <mesh castShadow position={[0, -h * 0.22, d / 2 - 0.01]}>
            <boxGeometry args={[w * 0.98, h * 0.52, 0.03]} />
            <meshStandardMaterial color={materialProps.color} roughness={0.3} metalness={0.6} />
          </mesh>
          {/* Door divider */}
          <mesh position={[0, h * 0.025, d / 2 + 0.005]}>
            <boxGeometry args={[w, 0.01, 0.01]} />
            <meshStandardMaterial color="#18181b" />
          </mesh>
          {/* Handles */}
          <mesh castShadow position={[-w * 0.38, h * 0.15, d / 2 + 0.015]}>
            <boxGeometry args={[0.03, h * 0.15, 0.02]} />
            <meshStandardMaterial color="#d4d4d8" metalness={0.9} roughness={0.1} />
          </mesh>
          <mesh castShadow position={[-w * 0.38, -h * 0.1, d / 2 + 0.015]}>
            <boxGeometry args={[0.03, h * 0.25, 0.02]} />
            <meshStandardMaterial color="#d4d4d8" metalness={0.9} roughness={0.1} />
          </mesh>
        </group>
      );
    }

    if (id === "toilet") {
      // TOILET PROCEDURAL MODEL
      return (
        <group>
          {/* Toilet Bowl */}
          <mesh castShadow position={[0, -h * 0.15, d * 0.1]}>
            <cylinderGeometry args={[w * 0.4, w * 0.3, h * 0.7, 16]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
          {/* Toilet Seat */}
          <mesh castShadow position={[0, h * 0.2, d * 0.1]}>
            <boxGeometry args={[w * 0.85, 0.04, d * 0.85]} />
            <meshStandardMaterial color="#ffffff" roughness={0.1} />
          </mesh>
          {/* Water Tank */}
          <mesh castShadow position={[0, h * 0.25, -d * 0.32]}>
            <boxGeometry args={[w * 0.95, h * 0.9, d * 0.34]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
          {/* Lever */}
          <mesh position={[w * 0.35, h * 0.6, -d * 0.15]}>
            <boxGeometry args={[0.08, 0.02, 0.02]} />
            <meshStandardMaterial color="#d4d4d8" metalness={0.9} roughness={0.1} />
          </mesh>
        </group>
      );
    }

    if (id === "bathtub") {
      // BATHTUB PROCEDURAL MODEL
      return (
        <group>
          {/* Outer Tub */}
          <mesh castShadow position={[0, 0, 0]}>
            <boxGeometry args={[w, h, d]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
          {/* Water */}
          <mesh position={[0, h * 0.1, 0]}>
            <boxGeometry args={[w * 0.85, 0.02, d * 0.85]} />
            <meshStandardMaterial color="#60a5fa" opacity={0.6} transparent roughness={0.1} />
          </mesh>
        </group>
      );
    }

    if (id === "shower") {
      // SHOWER PROCEDURAL MODEL
      return (
        <group>
          {/* Base */}
          <mesh castShadow receiveShadow position={[0, -h / 2 + 0.05, 0]}>
            <boxGeometry args={[w, 0.1, d]} />
            <meshStandardMaterial color="#e4e4e7" roughness={0.2} />
          </mesh>
          {/* Glass panels */}
          <mesh position={[w / 2 - 0.01, 0.05, 0]}>
            <boxGeometry args={[0.02, h * 0.9, d]} />
            <meshStandardMaterial color="#93c5fd" opacity={0.25} transparent roughness={0.1} />
          </mesh>
          <mesh position={[0, 0.05, d / 2 - 0.01]}>
            <boxGeometry args={[w, h * 0.9, 0.02]} />
            <meshStandardMaterial color="#93c5fd" opacity={0.25} transparent roughness={0.1} />
          </mesh>
          {/* Faucet/Line */}
          <mesh position={[-w / 2 + 0.04, h * 0.1, -d / 2 + 0.04]}>
            <cylinderGeometry args={[0.02, 0.02, h, 8]} />
            <meshStandardMaterial color="#d4d4d8" metalness={0.9} roughness={0.1} />
          </mesh>
        </group>
      );
    }

    if (id === "planter") {
      // PLANTER PROCEDURAL MODEL
      return (
        <group>
          {/* Pot */}
          <mesh castShadow position={[0, -h * 0.2, 0]}>
            <cylinderGeometry args={[w * 0.45, w * 0.35, h * 0.6, 16]} />
            <meshStandardMaterial color="#c2410c" roughness={0.8} />
          </mesh>
          {/* Green foliage */}
          <group position={[0, h * 0.25, 0]}>
            <mesh castShadow position={[0, 0, 0]}>
              <sphereGeometry args={[w * 0.42, 16, 16]} />
              <meshStandardMaterial color="#15803d" roughness={0.9} />
            </mesh>
            <mesh castShadow position={[0, w * 0.2, 0]}>
              <sphereGeometry args={[w * 0.32, 16, 16]} />
              <meshStandardMaterial color="#166534" roughness={0.9} />
            </mesh>
            <mesh castShadow position={[w * 0.1, -w * 0.05, w * 0.1]}>
              <sphereGeometry args={[w * 0.35, 16, 16]} />
              <meshStandardMaterial color="#14532d" roughness={0.9} />
            </mesh>
          </group>
        </group>
      );
    }

    if (id === "bookshelf") {
      // BOOKSHELF PROCEDURAL MODEL
      return (
        <group>
          {/* Outer Case */}
          <mesh castShadow position={[0, 0, 0]}>
            <boxGeometry args={[w, h, d]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
          {/* Shelves */}
          <group position={[0, 0, d * 0.05]}>
            <mesh castShadow position={[0, -h * 0.2, 0]}>
              <boxGeometry args={[w * 0.95, 0.03, d * 0.9]} />
              <meshStandardMaterial color="#44403c" />
            </mesh>
            <mesh castShadow position={[0, 0.05, 0]}>
              <boxGeometry args={[w * 0.95, 0.03, d * 0.9]} />
              <meshStandardMaterial color="#44403c" />
            </mesh>
            <mesh castShadow position={[0, h * 0.25, 0]}>
              <boxGeometry args={[w * 0.95, 0.03, d * 0.9]} />
              <meshStandardMaterial color="#44403c" />
            </mesh>
          </group>
          {/* Shelf books */}
          <group position={[0, 0, d * 0.15]}>
            <mesh castShadow position={[-w * 0.25, -h * 0.1, 0]}>
              <boxGeometry args={[0.06, 0.16, 0.15]} />
              <meshStandardMaterial color="#b91c1c" />
            </mesh>
            <mesh castShadow position={[-w * 0.18, -h * 0.1, 0]}>
              <boxGeometry args={[0.05, 0.18, 0.15]} />
              <meshStandardMaterial color="#1d4ed8" />
            </mesh>
            <mesh castShadow position={[w * 0.15, 0.14, 0]}>
              <boxGeometry args={[0.07, 0.15, 0.15]} />
              <meshStandardMaterial color="#15803d" />
            </mesh>
            <mesh castShadow position={[w * 0.23, 0.13, 0]} rotation={[0, 0, -0.15]}>
              <boxGeometry args={[0.06, 0.15, 0.15]} />
              <meshStandardMaterial color="#ea580c" />
            </mesh>
          </group>
        </group>
      );
    }

    if (id === "mirror") {
      // MIRROR PROCEDURAL MODEL
      return (
        <group>
          {/* Frame */}
          <mesh castShadow position={[0, 0, 0]}>
            <boxGeometry args={[w, h, d]} />
            <meshStandardMaterial color="#7c2d12" roughness={0.7} />
          </mesh>
          {/* Reflective Glass */}
          <mesh position={[0, 0, d / 2 + 0.005]}>
            <boxGeometry args={[w * 0.88, h * 0.88, 0.01]} />
            <meshStandardMaterial color="#e0f2fe" roughness={0.05} metalness={0.95} />
          </mesh>
        </group>
      );
    }

    if (id === "floor-lamp") {
      // FLOOR LAMP PROCEDURAL MODEL
      return (
        <group>
          {/* Base */}
          <mesh castShadow position={[0, -h / 2 + 0.02, 0]}>
            <cylinderGeometry args={[w / 2, w / 2, 0.04, 16]} />
            <meshStandardMaterial color="#18181b" metalness={0.8} />
          </mesh>
          {/* Stem */}
          <mesh castShadow position={[0, 0.1, 0]}>
            <cylinderGeometry args={[w * 0.1, w * 0.1, h * 0.8, 8]} />
            <meshStandardMaterial color="#18181b" metalness={0.8} />
          </mesh>
          {/* Shade */}
          <mesh castShadow position={[0, h / 2 - 0.15, 0]}>
            <cylinderGeometry args={[w * 0.6, w * 0.85, 0.3, 16, 1, true]} />
            <meshStandardMaterial color="#fef08a" roughness={0.9} side={THREE.DoubleSide} />
          </mesh>
          {/* Light bulb */}
          <mesh position={[0, h / 2 - 0.15, 0]}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </group>
      );
    }

    if (id === "sink-kitchen" || id === "sink-bath") {
      // SINK PROCEDURAL MODEL
      return (
        <group>
          {/* Base cabinet or stand */}
          <mesh castShadow position={[0, 0, 0]}>
            <boxGeometry args={[w, h, d]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
          {/* Sink Basin */}
          <mesh position={[0, h / 2 - 0.01, 0]}>
            <boxGeometry args={[w * 0.8, 0.03, d * 0.7]} />
            <meshStandardMaterial color="#fafaf9" roughness={0.1} />
          </mesh>
          <mesh position={[0, h / 2 + 0.01, 0]}>
            <boxGeometry args={[w * 0.65, 0.02, d * 0.55]} />
            <meshStandardMaterial color="#a8a29e" roughness={0.5} />
          </mesh>
          {/* Faucet */}
          <mesh castShadow position={[0, h / 2 + 0.07, -d * 0.28]}>
            <cylinderGeometry args={[0.015, 0.015, 0.1, 8]} />
            <meshStandardMaterial color="#d4d4d8" metalness={0.9} roughness={0.1} />
          </mesh>
        </group>
      );
    }

    // Default Fallback Box
    return (
      <mesh onClick={handleClick} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial {...materialProps} />
      </mesh>
    );
  };

  return (
    <group
      position={[px, py + h / 2, pz]}
      rotation={[degToRad(rx), degToRad(ry), degToRad(rz)]}
      onClick={handleClick}
    >
      {renderGeometry()}
      {/* Selection outline */}
      {isSelected && (
        <mesh>
          <boxGeometry args={[w + 0.05, h + 0.05, d + 0.05]} />
          <meshBasicMaterial color="#8b5cf6" wireframe />
        </mesh>
      )}
      <Html distanceFactor={8} position={[0, h / 2 + 0.15, 0]} center>
        <div className="px-1 py-0.5 rounded bg-[#18181b]/90 border border-zinc-700 text-[8px] text-zinc-300 font-medium whitespace-nowrap pointer-events-none select-none shadow">
          {item.name}
        </div>
      </Html>
    </group>
  );
}

// ============================================================
// DOOR 3D
// ============================================================

function Door3D({ door, walls }: { door: Door; walls: Wall[] }) {
  const wall = walls.find((w) => w.id === door.wallId);
  if (!wall) return null;

  const wallLen = distance2D(wall.start, wall.end);
  if (wallLen === 0) return null;

  const t = (door.offsetAlongWall + door.width / 2) / wallLen;
  const px = wall.start.x + (wall.end.x - wall.start.x) * t;
  const pz = wall.start.y + (wall.end.y - wall.start.y) * t;
  const angle = Math.atan2(wall.end.y - wall.start.y, wall.end.x - wall.start.x);

  const doorColor = door.material?.color || "#ef4444";
  const frameThickness = 0.06;
  // Offset the door in front of the wall so it doesn't z-fight
  const wallOffset = wall.thickness / 2 + 0.02;

  return (
    <group position={[px, 0, pz]} rotation={[0, -angle, 0]}>
      {/* Door frame — 4 beams around the door opening */}
      {/* Left frame post */}
      <mesh position={[-door.width / 2 - frameThickness / 2, door.height / 2, wallOffset]} castShadow>
        <boxGeometry args={[frameThickness, door.height, wall.thickness + 0.04]} />
        <meshStandardMaterial color="#78716c" roughness={0.5} />
      </mesh>
      {/* Right frame post */}
      <mesh position={[door.width / 2 + frameThickness / 2, door.height / 2, wallOffset]} castShadow>
        <boxGeometry args={[frameThickness, door.height, wall.thickness + 0.04]} />
        <meshStandardMaterial color="#78716c" roughness={0.5} />
      </mesh>
      {/* Top frame beam */}
      <mesh position={[0, door.height + frameThickness / 2, wallOffset]} castShadow>
        <boxGeometry args={[door.width + frameThickness * 2, frameThickness, wall.thickness + 0.04]} />
        <meshStandardMaterial color="#78716c" roughness={0.5} />
      </mesh>

      {/* Door panel — offset forward so it sits in front of the wall */}
      <mesh position={[0, door.height / 2, wallOffset]} castShadow>
        <boxGeometry args={[door.width, door.height, 0.06]} />
        <meshStandardMaterial
          color={doorColor}
          roughness={door.material?.roughness ?? 0.5}
          metalness={door.material?.metalness ?? 0.05}
        />
      </mesh>

      {/* Door handle */}
      <mesh position={[door.width / 2 - 0.12, door.height * 0.45, wallOffset + 0.05]}>
        <sphereGeometry args={[0.04, 12, 12]} />
        <meshStandardMaterial color="#d4d4d8" metalness={0.9} roughness={0.15} />
      </mesh>

      {/* Label */}
      <Html distanceFactor={8} position={[0, door.height + 0.3, wallOffset]} center>
        <div className="px-1 py-0.5 rounded bg-[#18181b]/90 border border-zinc-700 text-[8px] text-zinc-300 font-medium whitespace-nowrap pointer-events-none select-none shadow">
          {door.name}
        </div>
      </Html>
    </group>
  );
}

// ============================================================
// WINDOW 3D
// ============================================================

function Window3D({ win, walls }: { win: WindowType; walls: Wall[] }) {
  const wall = walls.find((w) => w.id === win.wallId);
  if (!wall) return null;

  const wallLen = distance2D(wall.start, wall.end);
  if (wallLen === 0) return null;

  const t = (win.offsetAlongWall + win.width / 2) / wallLen;
  const px = wall.start.x + (wall.end.x - wall.start.x) * t;
  const pz = wall.start.y + (wall.end.y - wall.start.y) * t;
  const angle = Math.atan2(wall.end.y - wall.start.y, wall.end.x - wall.start.x);

  const frameThickness = 0.05;
  const wallOffset = wall.thickness / 2 + 0.02;
  const glassColor = win.material?.color || "#7dd3fc";

  return (
    <group position={[px, 0, pz]} rotation={[0, -angle, 0]}>
      {/* Window frame — 4 beams */}
      {/* Left post */}
      <mesh position={[-win.width / 2 - frameThickness / 2, win.sillHeight + win.height / 2, wallOffset]}>
        <boxGeometry args={[frameThickness, win.height + frameThickness * 2, wall.thickness + 0.04]} />
        <meshStandardMaterial color="#a8a29e" roughness={0.4} metalness={0.3} />
      </mesh>
      {/* Right post */}
      <mesh position={[win.width / 2 + frameThickness / 2, win.sillHeight + win.height / 2, wallOffset]}>
        <boxGeometry args={[frameThickness, win.height + frameThickness * 2, wall.thickness + 0.04]} />
        <meshStandardMaterial color="#a8a29e" roughness={0.4} metalness={0.3} />
      </mesh>
      {/* Top beam */}
      <mesh position={[0, win.sillHeight + win.height + frameThickness / 2, wallOffset]}>
        <boxGeometry args={[win.width + frameThickness * 2, frameThickness, wall.thickness + 0.04]} />
        <meshStandardMaterial color="#a8a29e" roughness={0.4} metalness={0.3} />
      </mesh>
      {/* Bottom sill */}
      <mesh position={[0, win.sillHeight - frameThickness / 2, wallOffset]}>
        <boxGeometry args={[win.width + frameThickness * 2, frameThickness, wall.thickness + 0.06]} />
        <meshStandardMaterial color="#a8a29e" roughness={0.4} metalness={0.3} />
      </mesh>

      {/* Glass pane — offset forward */}
      <mesh position={[0, win.sillHeight + win.height / 2, wallOffset]}>
        <boxGeometry args={[win.width, win.height, 0.02]} />
        <meshStandardMaterial
          color={glassColor}
          roughness={win.material?.roughness ?? 0.05}
          metalness={win.material?.metalness ?? 0.3}
          opacity={win.material?.opacity ?? 0.35}
          transparent
        />
      </mesh>

      {/* Center divider (cross bar) */}
      <mesh position={[0, win.sillHeight + win.height / 2, wallOffset + 0.015]}>
        <boxGeometry args={[win.width, 0.03, 0.03]} />
        <meshStandardMaterial color="#a8a29e" roughness={0.4} metalness={0.3} />
      </mesh>

      {/* Label */}
      <Html distanceFactor={8} position={[0, win.sillHeight + win.height + 0.3, wallOffset]} center>
        <div className="px-1 py-0.5 rounded bg-[#18181b]/90 border border-zinc-700 text-[8px] text-zinc-300 font-medium whitespace-nowrap pointer-events-none select-none shadow">
          {win.name}
        </div>
      </Html>
    </group>
  );
}

// ============================================================
// SCENE CONTENT
// ============================================================

function SceneContent() {
  const project = useProjectStore((s) => s.project);
  const clearSelection = useUIStore((s) => s.clearSelection);

  if (!project) return null;

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[15, 20, 10]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      <directionalLight position={[-10, 10, -5]} intensity={0.3} />

      {/* Environment */}
      <Sky sunPosition={[100, 50, 100]} />
      
      {/* Ground */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.01, 0]}
        receiveShadow
        onClick={(e) => {
          clearSelection();
        }}
      >
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#1a1a1a" roughness={1} />
      </mesh>

      {/* Grid */}
      <Grid
        position={[0, 0, 0]}
        args={[50, 50]}
        cellSize={0.5}
        cellThickness={0.5}
        cellColor="#333"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#444"
        fadeDistance={30}
        infiniteGrid
      />

      {/* Contact shadows */}
      <ContactShadows
        position={[0, 0, 0]}
        opacity={0.4}
        scale={40}
        blur={2}
        far={4}
      />

      {/* Render scene objects */}
      {project.rooms.filter(r => r.visible).map((room) => (
        <Room3D key={room.id} room={room} />
      ))}
      {project.walls.filter(w => w.visible).map((wall) => (
        <Wall3D key={wall.id} wall={wall} />
      ))}
      {project.doors.filter(d => d.visible).map((door) => (
        <Door3D key={door.id} door={door} walls={project.walls} />
      ))}
      {project.windows.filter(w => w.visible).map((win) => (
        <Window3D key={win.id} win={win} walls={project.walls} />
      ))}
      {project.furniture.filter(f => f.visible).map((item) => (
        <Furniture3D key={item.id} item={item} />
      ))}

      {/* Camera controls */}
      <OrbitControls
        makeDefault
        maxPolarAngle={Math.PI / 2.1}
        minDistance={2}
        maxDistance={50}
        target={[6, 0, 4]}
      />
    </>
  );
}

// ============================================================
// EXPORTED COMPONENT
// ============================================================

export default function Scene3D() {
  return (
    <div className="w-full h-full">
      <Canvas
        id="scene-3d-canvas"
        shadows
        camera={{ position: [15, 12, 15], fov: 50 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, preserveDrawingBuffer: true }}
        style={{ background: "#0a0a0f" }}
      >
        <ExposeThreeInternals />
        <SceneContent />
      </Canvas>
    </div>
  );
}
