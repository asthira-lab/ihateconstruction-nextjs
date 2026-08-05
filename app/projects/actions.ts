"use server";

// Server Actions for the Projects API. Thin wrappers around service + error normalizer.

import { normalizeCalcError } from "@/features/calculators/errors";
import { PROJECT_CATALOG } from "@/features/projects";
import type {
  DeleteProjectActionResult,
  ListProjectsActionResult,
  Project,
  ProjectActionResult,
} from "@/features/projects";
import {
  archiveProject,
  createProject,
  deleteProject,
  getProject,
  listProjects,
  patchProject,
  unarchiveProject,
} from "@/features/projects/service";

export async function createProjectAction(
  raw: unknown,
  idempotencyKey?: string,
): Promise<ProjectActionResult> {
  try {
    const data = await createProject(raw, idempotencyKey);
    return { ok: true, data };
  } catch (e) {
    return normalizeCalcError(e, PROJECT_CATALOG) as ProjectActionResult;
  }
}

export async function getProjectAction(id: string): Promise<ProjectActionResult> {
  try {
    const data = await getProject(id);
    return { ok: true, data };
  } catch (e) {
    return normalizeCalcError(e, PROJECT_CATALOG) as ProjectActionResult;
  }
}

export async function listProjectsAction(rawQuery: unknown): Promise<ListProjectsActionResult> {
  try {
    const data = await listProjects(rawQuery);
    return { ok: true, data };
  } catch (e) {
    return normalizeCalcError(e, PROJECT_CATALOG) as ListProjectsActionResult;
  }
}

export async function patchProjectAction(id: string, raw: unknown): Promise<ProjectActionResult> {
  try {
    const data = await patchProject(id, raw);
    return { ok: true, data };
  } catch (e) {
    return normalizeCalcError(e, PROJECT_CATALOG) as ProjectActionResult;
  }
}

export async function archiveProjectAction(id: string): Promise<ProjectActionResult> {
  try {
    const data = await archiveProject(id);
    return { ok: true, data };
  } catch (e) {
    return normalizeCalcError(e, PROJECT_CATALOG) as ProjectActionResult;
  }
}

export async function unarchiveProjectAction(id: string): Promise<ProjectActionResult> {
  try {
    const data = await unarchiveProject(id);
    return { ok: true, data };
  } catch (e) {
    return normalizeCalcError(e, PROJECT_CATALOG) as ProjectActionResult;
  }
}

export async function deleteProjectAction(id: string): Promise<DeleteProjectActionResult> {
  try {
    await deleteProject(id);
    return { ok: true };
  } catch (e) {
    return normalizeCalcError(e, PROJECT_CATALOG) as DeleteProjectActionResult;
  }
}

export type { Project };
