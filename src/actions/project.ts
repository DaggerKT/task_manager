"use server";

import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { latin1Safe } from "@/utils/encoding";
import { publishRealtimeEvent } from "@/lib/realtime";

import { revalidatePath } from "next/cache";

async function getCurrentUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("user_id")?.value ?? null;
}

export async function getProjects() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return [];
    }

    const projects = await prisma.project.findMany({
      where: {
        team: {
          members: {
            some: { userId },
          },
        },
      },
      include: {
        team: {
          include: {
            _count: {
              select: { members: true },
            },
          },
        },
        _count: {
          select: { tasks: true },
        },
        tasks: {
          where: { step: { title: "Done" } },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return projects;
  } catch (error) {
    console.error("Error fetching projects:", error);
    return [];
  }
}

export async function createProject(name: string, dueDate: string | null) {
  try {
    console.log("Creating project with name:", name, "and dueDate:", dueDate);
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Unauthorized. Please login again." };
    }

    const safeProjectName = latin1Safe(name, "Untitled Project");
    const safeTeamName = latin1Safe(`${name} Team`, `${safeProjectName} Team`);
    const safeTeamDescription = latin1Safe(
      `Team for project: ${name}`,
      `Team for project: ${safeProjectName}`,
    );

    // Create a dedicated team for this project
    const team = await prisma.team.create({
      data: {
        name: safeTeamName,
        description: safeTeamDescription,
      },
    });

    // Add creator as ADMIN member of the new team
    await prisma.teamMember.create({
      data: {
        userId,
        teamId: team.id,
        role: "ADMIN",
      },
    });

    const newProject = await prisma.project.create({
      data: {
        name: safeProjectName,
        dueDate: dueDate ? new Date(dueDate) : null,
        teamId: team.id,
        status: "Active",
      },
    });

    // Create default steps for the new project
    await prisma.step.createMany({
      data: [
        {
          title: "To Do",
          color: "#9ca3af",
          order: 1,
          projectId: newProject.id,
        },
        {
          title: "In Progress",
          color: "#3b82f6",
          order: 2,
          projectId: newProject.id,
        },
        { title: "Done", color: "#22c55e", order: 3, projectId: newProject.id },
      ],
    });

    revalidatePath("/projects");
    await publishRealtimeEvent({
      type: "project.created",
      payload: { projectId: newProject.id, teamId: team.id },
    });
    return { success: true, project: newProject };
  } catch (error) {
    console.error("Error creating project:", error);
    return { success: false, error: "Failed to create project" };
  }
}

export async function deleteProject(id: string) {
  try {
    await prisma.project.delete({
      where: { id },
    });
    revalidatePath("/projects");
    await publishRealtimeEvent({
      type: "project.deleted",
      payload: { projectId: id },
    });
    return { success: true };
  } catch (error) {
    console.error("Error deleting project:", error);
    return { success: false, error: "Failed to delete project" };
  }
}

export async function getProjectData(projectId: string) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { project: null, steps: [], tasks: [] };
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        team: {
          members: {
            some: { userId },
          },
        },
      },
      include: {
        team: {
          include: {
            members: {
              include: { user: true },
            },
          },
        },
      },
    });

    const steps = await prisma.step.findMany({
      where: { projectId },
      orderBy: { order: "asc" },
    });

    const tasks = await prisma.task.findMany({
      where: { projectId },
      include: {
        assignee: true,
        comments: {
          include: { user: true },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return { project, steps, tasks };
  } catch (error) {
    console.error("Error fetching project data:", error);
    return { project: null, steps: [], tasks: [] };
  }
}
