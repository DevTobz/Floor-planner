"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { useProjectStore, createEmptyProject } from "@/store/project-store";
import {
  listProjects,
  deleteProject as deleteProjectFromStorage,
  saveProject,
  loadProject,
} from "@/lib/storage/persistence";
import type { ProjectSummary } from "@/types/project";
import {
  Building2,
  Plus,
  Search,
  Trash2,
  Copy,
  LogOut,
  MoreVertical,
  Clock,
  Layers,
  Armchair,
  FolderOpen,
  Sparkles,
  X,
} from "lucide-react";
import { generateId } from "@/lib/utils";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, checkSession, logout } = useAuthStore();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  const refreshProjects = useCallback(async () => {
    const list = await listProjects();
    setProjects(list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      refreshProjects();
    }
  }, [isAuthenticated, refreshProjects]);

  const handleCreateProject = async () => {
    if (!newProjectName.trim() || !user) return;
    const project = createEmptyProject(newProjectName.trim(), user.id);
    await saveProject(project);
    setNewProjectName("");
    setShowCreate(false);
    refreshProjects();
    router.push(`/editor/${project.id}`);
  };

  const handleDeleteProject = async (id: string) => {
    await deleteProjectFromStorage(id);
    refreshProjects();
    setMenuOpen(null);
  };

  const handleDuplicateProject = async (id: string) => {
    const original = await loadProject(id);
    if (!original) return;
    const dup = {
      ...original,
      id: generateId(),
      name: `${original.name} (copy)`,
      shareId: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: user?.id || original.userId,
    };
    await saveProject(dup);
    refreshProjects();
    setMenuOpen(null);
  };

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  const filtered = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-2 border-[var(--accent-mid)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-primary)" }}>
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-default)]">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-9 h-9 rounded-lg"
            style={{
              background: "linear-gradient(135deg, var(--accent-start), var(--accent-end))",
            }}
          >
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">BuildAI Studio</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-default)]">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[var(--accent-start)] to-[var(--accent-end)] flex items-center justify-center text-white text-xs font-bold">
              {user?.name?.charAt(0) || "D"}
            </div>
            <span className="text-sm text-[var(--text-secondary)]">{user?.name}</span>
          </div>
          <button
            onClick={handleLogout}
            className="btn-icon"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-6 max-w-7xl mx-auto w-full">
        {/* Title & Actions */}
        <div className="flex items-center justify-between mb-6 animate-fade-in-up">
          <div>
            <h1 className="text-2xl font-bold">Projects</h1>
            <p className="text-sm text-[var(--text-tertiary)] mt-1">
              {projects.length} project{projects.length !== 1 ? "s" : ""}
            </p>
          </div>

          <button
            onClick={() => setShowCreate(true)}
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4" />
            New Project
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-6 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
            placeholder="Search projects..."
          />
        </div>

        {/* Projects Grid */}
        {filtered.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-20 animate-fade-in-up"
            style={{ animationDelay: "200ms" }}
          >
            <div className="w-16 h-16 rounded-2xl bg-[var(--bg-tertiary)] flex items-center justify-center mb-4">
              <FolderOpen className="w-8 h-8 text-[var(--text-muted)]" />
            </div>
            <p className="text-[var(--text-secondary)] font-medium">
              {search ? "No matching projects" : "No projects yet"}
            </p>
            <p className="text-sm text-[var(--text-tertiary)] mt-1">
              {search
                ? "Try a different search term"
                : "Create your first project to get started"}
            </p>
            {!search && (
              <button
                onClick={() => setShowCreate(true)}
                className="btn btn-primary mt-4"
              >
                <Sparkles className="w-4 h-4" />
                Create Project
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((project, i) => (
              <div
                key={project.id}
                className="group glass-card-sm p-4 cursor-pointer transition-all duration-200 hover:border-[var(--accent-mid)] hover:shadow-lg hover:shadow-[rgba(99,102,241,0.1)] animate-fade-in-up"
                style={{ animationDelay: `${(i + 1) * 80}ms` }}
                onClick={() => router.push(`/editor/${project.id}`)}
              >
                {/* Thumbnail placeholder */}
                <div className="w-full h-32 rounded-lg bg-[var(--bg-primary)] mb-3 flex items-center justify-center overflow-hidden border border-[var(--border-default)]">
                  <div className="flex flex-col items-center gap-1">
                    <Building2 className="w-8 h-8 text-[var(--text-muted)] group-hover:text-[var(--accent-mid)] transition-colors" />
                    <span className="text-xs text-[var(--text-muted)]">Floor Plan</span>
                  </div>
                </div>

                {/* Info */}
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate group-hover:text-[var(--accent-mid)] transition-colors">
                      {project.name}
                    </h3>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="flex items-center gap-1 text-xs text-[var(--text-tertiary)]">
                        <Layers className="w-3 h-3" />
                        {project.roomCount} rooms
                      </span>
                      <span className="flex items-center gap-1 text-xs text-[var(--text-tertiary)]">
                        <Armchair className="w-3 h-3" />
                        {project.furnitureCount} items
                      </span>
                    </div>
                    <span className="flex items-center gap-1 text-xs text-[var(--text-muted)] mt-1">
                      <Clock className="w-3 h-3" />
                      {new Date(project.updatedAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Actions menu */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(menuOpen === project.id ? null : project.id);
                      }}
                      className="btn-icon opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ width: 28, height: 28 }}
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>

                    {menuOpen === project.id && (
                      <div
                        className="absolute right-0 top-8 z-50 w-40 py-1 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-default)] shadow-xl animate-fade-in-scale"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => handleDuplicateProject(project.id)}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          Duplicate
                        </button>
                        <button
                          onClick={() => handleDeleteProject(project.id)}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[var(--error)] hover:bg-[rgba(239,68,68,0.1)] transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Project Dialog */}
      {showCreate && (
        <div className="dialog-overlay" onClick={() => setShowCreate(false)}>
          <div
            className="dialog-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">New Project</h2>
              <button
                onClick={() => setShowCreate(false)}
                className="btn-icon"
                style={{ width: 28, height: 28 }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCreateProject();
              }}
            >
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                Project Name
              </label>
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="input mb-4"
                placeholder="My Dream House"
                autoFocus
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!newProjectName.trim()}
                >
                  <Sparkles className="w-4 h-4" />
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Close menu on click outside */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setMenuOpen(null)}
        />
      )}
    </div>
  );
}
