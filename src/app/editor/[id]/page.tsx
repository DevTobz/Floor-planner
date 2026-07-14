"use client";

import { useEffect, useState, useRef } from "react";
import * as THREE from "three";
import { useParams, useRouter } from "next/navigation";
import { useProjectStore } from "@/store/project-store";
import { useUIStore } from "@/store/ui-store";
import { useAuthStore } from "@/store/auth-store";
import { loadProject, saveProject } from "@/lib/storage/persistence";
import { generatePDF } from "@/lib/export/pdf-generator";
import { processCommand, createAIChatMessage, createUserChatMessage } from "@/lib/ai/design-engine";
import { getSpeechRecognition } from "@/lib/voice/speech-recognition";
import { furnitureCatalog, categories, getCategoryItems, searchCatalog, type CatalogItem } from "@/lib/furniture/catalog";
import { distance2D } from "@/lib/utils";
import type { FurnitureCategory } from "@/types/project";
import {
  Building2, Mouse, Undo2, Redo2, Trash2, Copy, Eye, EyeOff, Lock, Unlock,
  Download, Share2, Layers, X, Search,
  Move, Maximize2, Box, Armchair, Plus,
  Minus, Sparkles, SlidersHorizontal, Grid3x3,
  ArrowLeft, Mic, MicOff, Send
} from "lucide-react";
import FloorPlan2D from "@/components/editor/FloorPlan2D";

// ============================================================
// 3D SCENE (dynamically imported to avoid SSR issues)
// ============================================================

import dynamic from "next/dynamic";

const Scene3DCanvas = dynamic(() => import("@/components/editor/Scene3D"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-[#09090b]">
      <div className="flex flex-col items-center gap-3">
        <Box className="w-8 h-8 text-[var(--text-muted)] animate-pulse" />
        <p className="text-sm text-[var(--text-tertiary)]">Loading 3D engine...</p>
      </div>
    </div>
  ),
});

// ============================================================
// MAIN EDITOR PAGE
// ============================================================

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const { project, loadProject: loadProjectToStore, isDirty, markClean, undo, redo, addChatMessage, chatMessages, deleteFurniture, deleteRoom, deleteWall } = useProjectStore();
  const {
    viewMode, setViewMode, activeTool, setActiveTool,
    showGrid, toggleGrid, snapToGrid: snap, toggleSnapToGrid,
    selectedObjects, clearSelection,
    showInspector, toggleInspector,
    showFurniturePanel, toggleFurniturePanel,
    showAIChat, toggleAIChat,
  } = useUIStore();

  const { checkSession, isAuthenticated, isLoading: authLoading } = useAuthStore();

  const [chatInput, setChatInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [furnitureSearch, setFurnitureSearch] = useState("");
  const [furnitureCategory, setFurnitureCategory] = useState<FurnitureCategory | "all">("all");
  const [shareModal, setShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auth check
  useEffect(() => {
    checkSession();
  }, [checkSession]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, authLoading, router]);

  // Load project
  useEffect(() => {
    if (!projectId) return;
    const initProject = async () => {
      const p = await loadProject(projectId);
      if (p) {
        loadProjectToStore(p);
      } else {
        router.replace("/dashboard");
      }
    };
    initProject();
  }, [projectId, loadProjectToStore, router]);

  // Auto-save every 10 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      const current = useProjectStore.getState();
      if (current.project && current.isDirty) {
        const projectToSave = current.project;
        current.markClean();
        await saveProject(projectToSave);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Save on unmount (fire and forget)
  useEffect(() => {
    return () => {
      const current = useProjectStore.getState();
      if (current.project && current.isDirty) {
        saveProject(current.project);
      }
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        const sel = useUIStore.getState().selectedObjects;
        for (const obj of sel) {
          useProjectStore.getState().deleteObject(obj.type, obj.id);
        }
        clearSelection();
      }
      if (e.key === "g") toggleGrid();
      if (e.key === "v") setActiveTool("select");
      if (e.key === "s" && !e.metaKey) toggleSnapToGrid();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo, clearSelection, toggleGrid, setActiveTool, toggleSnapToGrid]);

  // Chat scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // AI Chat handlers
  const handleSendMessage = async () => {
    if (!chatInput.trim() || !project) return;
    const userMsg = createUserChatMessage(chatInput.trim());
    addChatMessage(userMsg);
    
    const store = useProjectStore.getState();
    const response = await processCommand(chatInput.trim(), store as unknown as Parameters<typeof processCommand>[1]);
    const aiMsg = createAIChatMessage(response);
    addChatMessage(aiMsg);
    setChatInput("");
  };

  // Voice input
  const handleVoiceToggle = () => {
    const sr = getSpeechRecognition();
    if (!sr.isAvailable) return;

    if (isListening) {
      sr.stop();
      setIsListening(false);
    } else {
      sr.onResult((result) => {
        if (result.isFinal) {
          setChatInput(result.transcript);
          setIsListening(false);
        }
      });
      sr.onEnd(() => setIsListening(false));
      sr.start();
      setIsListening(true);
    }
  };

  // PDF Export — captures 4 camera angles of the 3D scene
  const handleExportPDF = async () => {
    if (!project) return;
    try {
      // Dynamically import the scene3dRef (avoid SSR issues with static import)
      const { scene3dRef } = await import("@/components/editor/Scene3D");
      const three = scene3dRef.current;
      const snapshots: string[] = [];

      if (three) {
        const { camera, gl, scene, controls } = three;
        const perspCam = camera as THREE.PerspectiveCamera;

        // Make the 3D container visible if hidden (user may be in 2D mode)
        const container3d = document.getElementById("scene-3d-canvas");
        const parent = container3d?.closest(".pointer-events-none") as HTMLElement | null;
        const wasHidden = parent && parent.classList.contains("invisible");
        if (wasHidden && parent) {
          parent.classList.remove("opacity-0", "invisible", "pointer-events-none");
          await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        }

        // Save original camera state
        const origPos = perspCam.position.clone();
        const origTarget = controls?.target?.clone?.() || new THREE.Vector3(6, 0, 4);

        // Define 4 camera angles with labels
        const angles = [
          { pos: [15, 12, 15], target: [6, 0, 4], label: "Perspective View" },
          { pos: [6, 8, 20],   target: [6, 1, 4], label: "Front View" },
          { pos: [20, 8, 4],   target: [6, 1, 4], label: "Side View" },
          { pos: [6, 22, 4],   target: [6, 0, 4], label: "Bird's Eye View" },
        ];

        for (const angle of angles) {
          perspCam.position.set(angle.pos[0], angle.pos[1], angle.pos[2]);
          perspCam.lookAt(angle.target[0], angle.target[1], angle.target[2]);
          if (controls) {
            controls.target.set(angle.target[0], angle.target[1], angle.target[2]);
            controls.update();
          }
          perspCam.updateMatrixWorld();
          gl.render(scene, perspCam);

          try {
            const dataUrl = gl.domElement.toDataURL("image/jpeg", 0.92);
            snapshots.push(dataUrl);
          } catch (e) {
            console.warn("Could not capture angle:", angle.label, e);
          }
        }

        // Restore original camera position
        perspCam.position.copy(origPos);
        if (controls) {
          controls.target.copy(origTarget);
          controls.update();
        }
        perspCam.updateMatrixWorld();
        gl.render(scene, perspCam);

        // Restore hidden state
        if (wasHidden && parent) {
          parent.classList.add("opacity-0", "invisible", "pointer-events-none");
        }
      }

      generatePDF(project, snapshots.length > 0 ? snapshots : undefined);
    } catch (error) {
      console.error("Failed to capture 3D canvas render for PDF:", error);
      generatePDF(project);
    }
  };

  // Share
  const handleShare = () => {
    if (!project) return;
    setShareModal(true);
  };

  const copyShareLink = () => {
    if (!project) return;
    const link = `${window.location.origin}/share/${project.shareId}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Delete selected
  const handleDelete = () => {
    for (const obj of selectedObjects) {
      useProjectStore.getState().deleteObject(obj.type, obj.id);
    }
    clearSelection();
  };

  // Furniture drop handler
  const handleFurnitureDrop = (item: CatalogItem) => {
    const store = useProjectStore.getState();
    store.addFurniture({
      name: item.name,
      catalogId: item.id,
      category: item.category,
      width: item.width,
      height: item.height,
      depth: item.depth,
      transform: {
        position: { x: 5, y: 0, z: 5 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      },
      material: {
        color: item.color,
        roughness: 0.7,
        metalness: 0.1,
        opacity: 1,
        name: "Default",
      },
    });
  };

  // Filtered furniture
  const filteredFurniture = furnitureSearch
    ? searchCatalog(furnitureSearch)
    : furnitureCategory === "all"
    ? furnitureCatalog
    : getCategoryItems(furnitureCategory);

  // Get selected object info
  const selectedObj = selectedObjects[0];
  const selectedDetails = selectedObj ? getObjectDetails(project, selectedObj) : null;

  if (!project) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-2 border-[var(--accent-mid)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen" style={{ background: "var(--bg-primary)" }}>
      {/* Top Toolbar */}
      <header className="flex items-center justify-between px-3 h-12 border-b border-[var(--border-default)] bg-[var(--bg-secondary)]  flex-shrink-0 z-50">
        {/* Left: Back + Project Name */}
        <div className="flex items-center gap-2">
          <button onClick={async () => {
            const current = useProjectStore.getState();
            if (current.project && current.isDirty) {
              await saveProject(current.project);
            }
            router.push("/dashboard");
          }} className="btn-icon" title="Back to dashboard">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="divider" />
          <span className="text-sm font-medium truncate max-w-[200px]">{project.name}</span>
          {isDirty && <span className="w-2 h-2 rounded-full bg-[var(--warning)]" title="Unsaved changes" />}
        </div>

        {/* Center: Tools */}
        <div className="flex items-center gap-0.5 px-2 py-1 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-default)]">
          <button onClick={() => setActiveTool("select")} className={`btn-icon ${activeTool === "select" ? "active" : ""}`} title="Select (V)" data-tooltip="Select">
            <Mouse className="w-4 h-4" />
          </button>
          <button onClick={() => setActiveTool("pan")} className={`btn-icon ${activeTool === "pan" ? "active" : ""}`} title="Pan">
            <Move className="w-4 h-4" />
          </button>
          <div className="divider" />
          <button onClick={undo} className="btn-icon" title="Undo (Cmd+Z)">
            <Undo2 className="w-4 h-4" />
          </button>
          <button onClick={redo} className="btn-icon" title="Redo (Cmd+Shift+Z)">
            <Redo2 className="w-4 h-4" />
          </button>
          <div className="divider" />
          <button onClick={handleDelete} className="btn-icon" title="Delete" disabled={selectedObjects.length === 0}>
            <Trash2 className="w-4 h-4" />
          </button>
          <div className="divider" />
          <button onClick={toggleGrid} className={`btn-icon ${showGrid ? "active" : ""}`} title="Grid (G)">
            <Grid3x3 className="w-4 h-4" />
          </button>
          <button onClick={toggleSnapToGrid} className={`btn-icon ${snap ? "active" : ""}`} title="Snap (S)">
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* Right: View Mode + Actions */}
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center rounded-lg bg-[var(--bg-primary)] border border-[var(--border-default)] overflow-hidden">
            <button
              onClick={() => setViewMode("2d")}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === "2d" ? "bg-[rgba(99,102,241,0.15)] text-[var(--accent-mid)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}
            >
              2D
            </button>
            <button
              onClick={() => setViewMode("3d")}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === "3d" ? "bg-[rgba(99,102,241,0.15)] text-[var(--accent-mid)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}
            >
              3D
            </button>
          </div>

          <div className="divider" />

          <button onClick={toggleFurniturePanel} className={`btn-icon ${showFurniturePanel ? "active" : ""}`} title="Furniture Library">
            <Armchair className="w-4 h-4" />
          </button>
          <button onClick={toggleAIChat} className={`btn-icon ${showAIChat ? "active" : ""}`} title="AI Assistant">
            <Sparkles className="w-4 h-4" />
          </button>
          <button onClick={toggleInspector} className={`btn-icon ${showInspector ? "active" : ""}`} title="Inspector">
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          <div className="divider" />

          <button onClick={handleExportPDF} className="btn btn-ghost btn-sm" title="Export PDF">
            <Download className="w-3.5 h-3.5" />
            <span className="hidden md:inline">PDF</span>
          </button>
          <button onClick={handleShare} className="btn btn-primary btn-sm">
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Share</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Furniture Panel (Left sidebar) */}
        {showFurniturePanel && (
          <div className="w-64 panel border-r animate-slide-in-left flex-shrink-0">
            <div className="panel-header">
              <span>Furniture Library</span>
              <button onClick={toggleFurniturePanel} className="btn-icon" style={{ width: 24, height: 24 }}>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="p-2">
              <div className="relative mb-2">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]" />
                <input
                  type="text"
                  value={furnitureSearch}
                  onChange={(e) => setFurnitureSearch(e.target.value)}
                  className="input pl-7 text-xs"
                  placeholder="Search furniture..."
                  style={{ height: 32 }}
                />
              </div>
              {/* Category pills */}
              <div className="flex flex-wrap gap-1 mb-2">
                <button
                  onClick={() => setFurnitureCategory("all")}
                  className={`px-2 py-0.5 rounded-full text-xs transition-colors ${furnitureCategory === "all" ? "bg-[rgba(99,102,241,0.15)] text-[var(--accent-mid)]" : "text-[var(--text-tertiary)] hover:bg-[var(--bg-tertiary)]"}`}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setFurnitureCategory(cat.id)}
                    className={`px-2 py-0.5 rounded-full text-xs transition-colors ${furnitureCategory === cat.id ? "bg-[rgba(99,102,241,0.15)] text-[var(--accent-mid)]" : "text-[var(--text-tertiary)] hover:bg-[var(--bg-tertiary)]"}`}
                  >
                    {cat.icon} {cat.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="panel-body overflow-y-auto" style={{ maxHeight: "calc(100vh - 180px)" }}>
              <div className="grid grid-cols-2 gap-1.5">
                {filteredFurniture.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleFurnitureDrop(item)}
                    className="flex flex-col items-center gap-1 p-2 rounded-lg border border-[var(--border-default)] hover:border-[var(--accent-mid)] hover:bg-[rgba(99,102,241,0.05)] transition-all text-center group"
                  >
                    <span className="text-xl group-hover:scale-110 transition-transform">{item.icon}</span>
                    <span className="text-[10px] text-[var(--text-secondary)] leading-tight">{item.name}</span>
                    <span className="text-[9px] text-[var(--text-muted)]">
                      {item.width}×{item.depth}m
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Canvas Area */}
        <div className="flex-1 relative overflow-hidden">
          <div className="w-full h-full relative">
            <div className={`w-full h-full ${viewMode === "2d" ? "" : "absolute top-0 left-0 pointer-events-none opacity-0 invisible"}`}>
              <FloorPlan2D />
            </div>
            <div className={`w-full h-full ${viewMode === "3d" ? "" : "absolute top-0 left-0 pointer-events-none opacity-0 invisible"}`}>
              <Scene3DCanvas />
            </div>
          </div>
        </div>

        {/* Right side panels */}
        <div className="flex flex-shrink-0">
          {/* AI Chat Panel */}
          {showAIChat && (
            <div className="w-80 panel border-l animate-slide-in-right flex flex-col">
              <div className="panel-header">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[var(--accent-start)]" />
                  AI Assistant
                </span>
                <button onClick={toggleAIChat} className="btn-icon" style={{ width: 24, height: 24 }}>
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {chatMessages.length === 0 && (
                  <div className="text-center py-8">
                    <Sparkles className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-3" />
                    <p className="text-sm text-[var(--text-secondary)] font-medium">AI Design Assistant</p>
                    <p className="text-xs text-[var(--text-tertiary)] mt-1">Try saying:</p>
                    <div className="mt-3 space-y-1.5">
                      {["Build a two-bedroom bungalow", "Add a kitchen", "Add a sofa", "Delete the coffee table"].map((cmd) => (
                        <button
                          key={cmd}
                          onClick={() => { setChatInput(cmd); }}
                          className="block w-full text-left px-3 py-1.5 rounded-md text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                        >
                          &ldquo;{cmd}&rdquo;
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] px-3 py-2 rounded-lg text-xs leading-relaxed ${
                        msg.role === "user"
                          ? "bg-[var(--accent-mid)] text-white"
                          : "bg-[var(--bg-tertiary)] text-[var(--text-primary)]"
                      }`}
                    >
                      {msg.content}
                      {msg.mutations && msg.mutations.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-[rgba(255,255,255,0.1)]">
                          {msg.mutations.map((m, i) => (
                            <div key={i} className="flex items-center gap-1.5 text-[10px] opacity-70">
                              <span className={m.action === "add" ? "text-green-400" : m.action === "delete" ? "text-red-400" : "text-yellow-400"}>
                                {m.action === "add" ? "+" : m.action === "delete" ? "−" : "~"}
                              </span>
                              <span>{m.objectName}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <div className="p-3 border-t border-[var(--border-default)]">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleVoiceToggle}
                    className={`btn-icon flex-shrink-0 ${isListening ? "active" : ""}`}
                    title={isListening ? "Stop listening" : "Voice input"}
                    style={{ width: 32, height: 32 }}
                  >
                    {isListening ? <MicOff className="w-3.5 h-3.5 text-[var(--error)]" /> : <Mic className="w-3.5 h-3.5" />}
                  </button>
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSendMessage(); }}
                    className="input text-xs flex-1"
                    placeholder={isListening ? "Listening..." : "Describe changes..."}
                    style={{ height: 32 }}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!chatInput.trim()}
                    className="btn-icon btn-primary flex-shrink-0"
                    style={{ width: 32, height: 32, borderRadius: 8 }}
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Inspector Panel */}
          {showInspector && (
            <div className="w-64 panel border-l animate-slide-in-right">
              <div className="panel-header">
                <span>Inspector</span>
                <button onClick={toggleInspector} className="btn-icon" style={{ width: 24, height: 24 }}>
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="panel-body">
                {!selectedDetails ? (
                  <div className="text-center py-8">
                    <Mouse className="w-6 h-6 text-[var(--text-muted)] mx-auto mb-2" />
                    <p className="text-xs text-[var(--text-tertiary)]">Select an object to inspect</p>
                  </div>
                ) : (
                  <InspectorContent details={selectedDetails} />
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Share Modal */}
      {shareModal && project && (
        <div className="dialog-overlay" onClick={() => setShareModal(false)}>
          <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Share Project</h2>
              <button onClick={() => setShareModal(false)} className="btn-icon" style={{ width: 28, height: 28 }}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mb-3">Share this link for view-only access:</p>
            <div className="flex items-center gap-2 mb-4">
              <input
                type="text"
                readOnly
                value={`${typeof window !== "undefined" ? window.location.origin : ""}/share/${project.shareId}`}
                className="input text-xs font-mono"
              />
              <button onClick={copyShareLink} className="btn btn-primary btn-sm flex-shrink-0">
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <p className="text-xs text-[var(--text-muted)]">Anyone with this link can view the project (read-only).</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// INSPECTOR CONTENT
// ============================================================

interface InspectorDetails {
  type: string;
  name: string;
  id: string;
  position?: { x: number; y: number; z: number };
  rotation?: { x: number; y: number; z: number };
  scale?: { x: number; y: number; z: number };
  width?: number;
  height?: number;
  depth?: number;
  color?: string;
  locked?: boolean;
  visible?: boolean;
}

function InspectorContent({ details }: { details: InspectorDetails }) {
  return (
    <div className="space-y-3 text-xs">
      {/* Object info */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="badge">{details.type}</span>
          <span className="text-[var(--text-muted)] font-mono text-[10px]">ID: {details.id.substring(0, 8)}</span>
        </div>
        <div className="mb-2">
          <label className="text-[var(--text-tertiary)] uppercase text-[10px] font-semibold tracking-wider mb-1 block">Name</label>
          <input
            type="text"
            value={details.name}
            onChange={(e) => {
              useProjectStore.getState().updateObjectName(details.type, details.id, e.target.value);
            }}
            className="input text-xs"
            style={{ height: 28 }}
          />
        </div>
      </div>

      <hr className="border-[var(--border-default)]" />

      {/* Transform */}
      {details.position && (
        <div>
          <label className="text-[var(--text-tertiary)] uppercase text-[10px] font-semibold tracking-wider mb-1.5 block">Position</label>
          <div className="grid grid-cols-3 gap-1">
            {(["x", "y", "z"] as const).map((axis) => (
              <div key={axis} className="flex items-center gap-1">
                <span className="text-[var(--text-muted)] w-3 text-right uppercase">{axis}</span>
                <input
                  type="number"
                  value={details.position![axis].toFixed(2)}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    const newPos = { ...details.position!, [axis]: val };
                    useProjectStore.getState().moveObject(details.type, details.id, newPos);
                  }}
                  className="input text-[10px] px-1 text-center"
                  style={{ height: 24 }}
                  step="0.1"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {details.rotation && (
        <div>
          <label className="text-[var(--text-tertiary)] uppercase text-[10px] font-semibold tracking-wider mb-1.5 block">Rotation</label>
          <div className="grid grid-cols-3 gap-1">
            {(["x", "y", "z"] as const).map((axis) => (
              <div key={axis} className="flex items-center gap-1">
                <span className="text-[var(--text-muted)] w-3 text-right uppercase">{axis}</span>
                <input
                  type="number"
                  value={details.rotation![axis].toFixed(0)}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    const newRot = { ...details.rotation!, [axis]: val };
                    useProjectStore.getState().rotateObject(details.type, details.id, newRot);
                  }}
                  className="input text-[10px] px-1 text-center"
                  style={{ height: 24 }}
                  step="15"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dimensions */}
      {(details.width || details.height || details.depth) && (
        <>
          <hr className="border-[var(--border-default)]" />
          <div>
            <label className="text-[var(--text-tertiary)] uppercase text-[10px] font-semibold tracking-wider mb-1.5 block">Dimensions</label>
            <div className="space-y-1">
              {details.width && (
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-muted)]">Width</span>
                  <span className="text-[var(--text-secondary)] font-mono">{details.width.toFixed(2)} m</span>
                </div>
              )}
              {details.height && (
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-muted)]">Height</span>
                  <span className="text-[var(--text-secondary)] font-mono">{details.height.toFixed(2)} m</span>
                </div>
              )}
              {details.depth && (
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-muted)]">Depth</span>
                  <span className="text-[var(--text-secondary)] font-mono">{details.depth.toFixed(2)} m</span>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Material */}
      {details.color && (
        <>
          <hr className="border-[var(--border-default)]" />
          <div>
            <label className="text-[var(--text-tertiary)] uppercase text-[10px] font-semibold tracking-wider mb-1.5 block">Material</label>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded border border-[var(--border-default)]" style={{ background: details.color }} />
              <span className="text-[var(--text-secondary)] font-mono text-[10px]">{details.color}</span>
            </div>
          </div>
        </>
      )}

      {/* Actions */}
      <hr className="border-[var(--border-default)]" />
      <div className="flex items-center gap-1">
        <button
          onClick={() => useProjectStore.getState().toggleLock(details.type, details.id)}
          className="btn-icon"
          title={details.locked ? "Unlock" : "Lock"}
          style={{ width: 28, height: 28 }}
        >
          {details.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={() => useProjectStore.getState().toggleVisibility(details.type, details.id)}
          className="btn-icon"
          title={details.visible ? "Hide" : "Show"}
          style={{ width: 28, height: 28 }}
        >
          {details.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={() => useProjectStore.getState().duplicateObject(details.type, details.id)}
          className="btn-icon"
          title="Duplicate"
          style={{ width: 28, height: 28 }}
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => {
            useProjectStore.getState().deleteObject(details.type, details.id);
            useUIStore.getState().clearSelection();
          }}
          className="btn-icon"
          title="Delete"
          style={{ width: 28, height: 28 }}
        >
          <Trash2 className="w-3.5 h-3.5 text-[var(--error)]" />
        </button>
      </div>
    </div>
  );
}

// ============================================================
// HELPERS
// ============================================================

function getObjectDetails(project: ReturnType<typeof useProjectStore.getState>["project"], sel: { id: string; type: string }): InspectorDetails | null {
  if (!project) return null;
  
  if (sel.type === "furniture") {
    const obj = project.furniture.find((f) => f.id === sel.id);
    if (!obj) return null;
    return {
      type: "furniture", name: obj.name, id: obj.id,
      position: obj.transform.position, rotation: obj.transform.rotation, scale: obj.transform.scale,
      width: obj.width, height: obj.height, depth: obj.depth,
      color: obj.material.color, locked: obj.locked, visible: obj.visible,
    };
  }
  if (sel.type === "wall") {
    const obj = project.walls.find((w) => w.id === sel.id);
    if (!obj) return null;
    return {
      type: "wall", name: obj.name, id: obj.id,
      position: obj.transform.position, rotation: obj.transform.rotation,
      width: distance2D(obj.start, obj.end), height: obj.height,
      color: obj.material.color, locked: obj.locked, visible: obj.visible,
    };
  }
  if (sel.type === "room") {
    const obj = project.rooms.find((r) => r.id === sel.id);
    if (!obj) return null;
    return {
      type: "room", name: obj.label, id: obj.id,
      position: obj.transform.position,
      height: obj.height,
      color: obj.material.color, locked: obj.locked, visible: obj.visible,
    };
  }
  if (sel.type === "door") {
    const obj = project.doors.find((d) => d.id === sel.id);
    if (!obj) return null;
    return {
      type: "door", name: obj.name, id: obj.id,
      width: obj.width, height: obj.height,
      color: obj.material.color, locked: obj.locked, visible: obj.visible,
    };
  }
  if (sel.type === "window") {
    const obj = project.windows.find((w) => w.id === sel.id);
    if (!obj) return null;
    return {
      type: "window", name: obj.name, id: obj.id,
      width: obj.width, height: obj.height,
      color: obj.material.color, locked: obj.locked, visible: obj.visible,
    };
  }
  return null;
}
