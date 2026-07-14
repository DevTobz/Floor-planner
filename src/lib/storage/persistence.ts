// ============================================================
// BuildAI Studio — Supabase Persistence
// Save/load projects directly to the Supabase database
// ============================================================

import { supabase } from '@/lib/supabase';
import type { Project, ProjectSummary } from '@/types/project';

export async function saveProject(project: Project): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .upsert({
      id: project.id,
      user_id: project.userId,
      name: project.name,
      description: project.description,
      data: project,
      share_id: project.shareId,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    console.error('Error saving project to Supabase:', error);
    throw new Error(`Failed to save project: ${error.message}`);
  }
}

export async function loadProject(id: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from('projects')
    .select('data')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Error loading project from Supabase:', error);
    return null;
  }
  return data?.data ? (data.data as Project) : null;
}

export async function deleteProject(id: string): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting project from Supabase:', error);
    throw new Error(`Failed to delete project: ${error.message}`);
  }
}

export async function listProjects(): Promise<ProjectSummary[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('id, name, description, created_at, updated_at, data')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error listing projects from Supabase:', error);
    return [];
  }

  return (data || []).map((row: any) => {
    const pData = row.data as Project;
    return {
      id: row.id,
      name: row.name,
      description: row.description || '',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      roomCount: pData?.rooms?.length || 0,
      furnitureCount: pData?.furniture?.length || 0,
    };
  });
}

export async function getProjectByShareId(shareId: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from('projects')
    .select('data')
    .eq('share_id', shareId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching shared project from Supabase:', error);
    return null;
  }
  return data?.data ? (data.data as Project) : null;
}
