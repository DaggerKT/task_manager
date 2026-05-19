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

export async function getProjects(): Promise<{
  projects: Awaited<ReturnType<typeof prisma.project.findMany<{
    include: {
      team: {
        include: {
          members: { include: { user: { select: { id: true; name: true; avatar: true } } } };
          _count: { select: { members: true } };
        };
      };
      _count: { select: { tasks: true } };
      tasks: { where: { step: { title: string } } };
    };
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }];
  }>>>;
  currentUserId: string | null;
}> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { projects: [], currentUserId: null };
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
            members: {
              include: {
                user: {
                  select: { id: true, name: true, avatar: true },
                },
              },
            },
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
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
    return { projects, currentUserId: userId };
  } catch (error) {
    console.error("Error fetching projects:", error);
    return { projects: [] as never[], currentUserId: null };
  }
}

export async function createProject(name: string, dueDate: string | null) {
  try {
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
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Unauthorized. Please login again." };
    }

    const project = await prisma.project.findFirst({
      where: {
        id,
        team: {
          members: {
            some: {
              userId,
              role: "ADMIN",
            },
          },
        },
      },
      select: { id: true },
    });

    if (!project) {
      return {
        success: false,
        error: "Forbidden. Only project owners/admins can delete this project.",
      };
    }

    await prisma.project.delete({
      where: { id: project.id },
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

export async function updateProject(
  id: string,
  name: string,
  dueDate: string | null,
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Unauthorized. Please login again." };
    }

    const project = await prisma.project.findFirst({
      where: {
        id,
        team: {
          members: {
            some: {
              userId,
              role: "ADMIN",
            },
          },
        },
      },
      select: { id: true },
    });

    if (!project) {
      return {
        success: false,
        error: "Forbidden. Only project owners/admins can edit this project.",
      };
    }

    const safeProjectName = latin1Safe(name, "Untitled Project");

    const updatedProject = await prisma.project.update({
      where: { id: project.id },
      data: {
        name: safeProjectName,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });

    revalidatePath("/projects");
    revalidatePath(`/projects/${id}`);
    await publishRealtimeEvent({
      type: "project.updated",
      payload: { projectId: id },
    });

    return { success: true, project: updatedProject };
  } catch (error) {
    console.error("Error updating project:", error);
    return { success: false, error: "Failed to update project" };
  }
}

export async function updateProjectOrders(
  updates: Array<{ projectId: string; sortOrder: number }>,
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Unauthorized. Please login again." };
    }

    if (!updates.length) {
      return { success: true };
    }

    const projectIds = updates.map((item) => item.projectId);
    const accessibleProjects = await prisma.project.findMany({
      where: {
        id: { in: projectIds },
        team: {
          members: {
            some: { userId },
          },
        },
      },
      select: { id: true },
    });

    if (accessibleProjects.length !== projectIds.length) {
      return {
        success: false,
        error: "Forbidden. Unable to reorder one or more projects.",
      };
    }

    const maxSortOrderResult = await prisma.project.aggregate({
      _max: { sortOrder: true },
    });
    const temporaryOffset =
      (maxSortOrderResult._max.sortOrder ?? 0) + updates.length + 1;

    await prisma.$transaction(async (tx) => {
      await Promise.all(
        updates.map((item) =>
          tx.project.update({
            where: { id: item.projectId },
            data: { sortOrder: item.sortOrder + temporaryOffset },
          }),
        ),
      );

      await Promise.all(
        updates.map((item) =>
          tx.project.update({
            where: { id: item.projectId },
            data: { sortOrder: item.sortOrder },
          }),
        ),
      );
    });

    revalidatePath("/projects");
    await publishRealtimeEvent({
      type: "project.order.updated",
      payload: { projectIds },
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating project orders:", error);
    return { success: false, error: "Failed to update project orders" };
  }
}

export async function getProjectData(projectId: string) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { project: null, steps: [], tasks: [], currentUserId: null };
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
      orderBy: [
        { stepId: 'asc' },
        { order: 'asc' },
        { createdAt: 'asc' },
      ],
      include: {
        assignees: {
          include: { user: true },
        },
        comments: {
          include: { user: true },
          orderBy: { createdAt: "asc" },
        },
        creator: true,
      },
    });

    return { project, steps, tasks, currentUserId: userId };
  } catch (error) {
    console.error("Error fetching project data:", error);
    return { project: null, steps: [], tasks: [], currentUserId: null };
  }
}

export async function removeTeamMember(projectId: string, targetUserId: string) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Unauthorized. Please login again." };
    }

    if (userId === targetUserId) {
      return { success: false, error: "You cannot remove yourself." };
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, teamId: true },
    });
    if (!project) {
      return { success: false, error: "Project not found." };
    }

    const requesterMember = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId,
          teamId: project.teamId,
        },
      },
      select: { role: true },
    });

    if (!requesterMember || requesterMember.role !== "ADMIN") {
      return {
        success: false,
        error: "Forbidden. Only team admins can remove members.",
      };
    }

    const targetMember = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId: targetUserId,
          teamId: project.teamId,
        },
      },
      select: { userId: true, role: true },
    });

    if (!targetMember) {
      return { success: false, error: "Team member not found." };
    }

    if (targetMember.role === "ADMIN") {
      const adminCount = await prisma.teamMember.count({
        where: {
          teamId: project.teamId,
          role: "ADMIN",
        },
      });

      if (adminCount <= 1) {
        return {
          success: false,
          error: "Cannot remove the last admin from the team.",
        };
      }
    }

    await prisma.$transaction([
      prisma.taskAssignee.deleteMany({
        where: {
          userId: targetUserId,
          task: { projectId },
        },
      }),
      prisma.teamMember.delete({
        where: {
          userId_teamId: {
            userId: targetUserId,
            teamId: project.teamId,
          },
        },
      }),
    ]);

    revalidatePath("/projects");
    revalidatePath(`/projects/${projectId}`);
    await publishRealtimeEvent({
      type: "team.member.removed",
      payload: { projectId, teamId: project.teamId, removedUserId: targetUserId },
    });

    return { success: true };
  } catch (error) {
    console.error("Error removing team member:", error);
    return { success: false, error: "Failed to remove team member" };
  }
}
