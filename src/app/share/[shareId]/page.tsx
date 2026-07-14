"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getProjectByShareId } from "@/lib/storage/persistence";
import { useProjectStore } from "@/store/project-store";
import { useUIStore } from "@/store/ui-store";
import { Building2, Layers, Armchair, Eye, Box } from "lucide-react";
import type { Project } from "@/types/project";
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

import FloorPlan2D from "@/components/editor/FloorPlan2D";

export default function SharePage() {
  const params = useParams();
  const shareId = params.shareId as string;
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [viewMode, setViewMode] = useState<"3d" | "2d">("3d");

  const loadProjectToStore = useProjectStore((s) => s.loadProject);

  useEffect(() => {
    if (!shareId) return;
    const fetchShared = async () => {
      const p = await getProjectByShareId(shareId);
      if (p) {
        setProject(p);
        loadProjectToStore(p);
      } else {
        setNotFound(true);
      }
      setLoading(false);
    };
    fetchShared();
  }, [shareId, loadProjectToStore]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: "var(--bg-primary)" }}>
        <div className="w-8 h-8 border-2 border-[var(--accent-mid)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !project) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4" style={{ background: "var(--bg-primary)" }}>
        <Building2 className="w-12 h-12 text-[var(--text-muted)]" />
        <h1 className="text-xl font-semibold">Project Not Found</h1>
        <p className="text-sm text-[var(--text-tertiary)]">
          This share link may have expired or the project was deleted.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen" style={{ background: "var(--bg-primary)" }}>
      {/* Header */}
      <header className="flex items-center justify-between px-4 h-12 border-b border-[var(--border-default)] bg-[var(--bg-secondary)] flex-shrink-0">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-lg"
            style={{
              background: "linear-gradient(135deg, var(--accent-start), var(--accent-end))",
            }}
          >
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="text-sm font-medium">{project.name}</span>
            <span className="flex items-center gap-1 text-xs text-[var(--text-tertiary)] ml-2">
              <Eye className="w-3 h-3" />
              View only
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)]">
            <Layers className="w-3 h-3" />
            {project.rooms.length} rooms
          </span>
          <span className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)]">
            <Armchair className="w-3 h-3" />
            {project.furniture.length} items
          </span>
          <div className="divider" />
          <div className="flex items-center rounded-lg bg-[var(--bg-primary)] border border-[var(--border-default)] overflow-hidden">
            <button
              onClick={() => setViewMode("3d")}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === "3d" ? "bg-[rgba(99,102,241,0.15)] text-[var(--accent-mid)]" : "text-[var(--text-secondary)]"}`}
            >
              3D
            </button>
            <button
              onClick={() => setViewMode("2d")}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === "2d" ? "bg-[rgba(99,102,241,0.15)] text-[var(--accent-mid)]" : "text-[var(--text-secondary)]"}`}
            >
              2D
            </button>
          </div>
        </div>
      </header>

      {/* View */}
      <div className="flex-1 overflow-hidden">
        {viewMode === "3d" ? (
          <Scene3DCanvas />
        ) : (
          <FloorPlan2D readOnly />
        )}
      </div>
    </div>
  );
}
