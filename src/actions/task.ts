"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { latin1Safe } from "@/utils/encoding";
import { publishRealtimeEvent } from "@/lib/realtime";
import { notifyTaskAssigned, notifyTaskStepChanged } from "@/lib/notification";
import { sendTaskAssignmentEmail, sendTaskUpdateEmail } from "@/lib/mail";
import { headers } from "next/headers";

async function buildInvitationLink(projectId: string, taskId?: string) {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") || headerStore.get("host");
  const proto =
    headerStore.get("x-forwarded-proto") ||
    (process.env.NODE_ENV === "production" ? "https" : "http");

  if (!host) return `/projects/${projectId}`;
  return `${proto}://${host}/projects/${projectId}?task=${taskId || ""}`;
}

function parseTaskDate(value?: string | null): Date | null | "invalid" {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(trimmed);
  const candidate = isDateOnly ? `${trimmed}T00:00:00.000Z` : trimmed;
  const parsed = new Date(candidate);

  if (Number.isNaN(parsed.getTime())) {
    return "invalid";
  }

  return parsed;
}

function dispatchEmailInBackground(
  jobs: Array<Promise<{ success: boolean; error?: string }>>,
  context: string,
) {
  if (!jobs.length) return;

  void Promise.allSettled(jobs).then((results) => {
    results.forEach((result) => {
      if (result.status === "rejected") {
        console.error(`[mail:${context}] rejected:`, result.reason);
        return;
      }
      if (!result.value.success) {
        console.error(`[mail:${context}] failed:`, result.value.error);
      }
    });
  });
}

export async function createTask(data: {
  title: string;
  type: string;
  content: string;
  projectId: string;
  stepId: string;
  assigneeIds: string[];
  creatorId: string;
  order: number;
  isUrgent?: boolean;
  startDate?: string | null;
  dueDate?: string | null;
}) {
  try {
    if (!data.assigneeIds || data.assigneeIds.length === 0) {
      return { success: false, error: "Task must have at least one assignee" };
    }

    const project = await prisma.project.findUnique({
      where: { id: data.projectId },
      select: {
        team: {
          select: {
            members: {
              select: { userId: true },
            },
          },
        },
      },
    });

    if (!project) {
      return { success: false, error: "Project not found" };
    }

    const teamMemberIdSet = new Set(
      project.team.members.map((member) => member.userId),
    );

    if (data.assigneeIds.some((userId) => !teamMemberIdSet.has(userId))) {
      return {
        success: false,
        error: "Assignees must be members of this team",
      };
    }

    const safeData = {
      ...data,
      title: latin1Safe(data.title, "Untitled Task"),
      type: latin1Safe(data.type, "General"),
      content: latin1Safe(data.content, ""),
    };

    const parsedStartDate = parseTaskDate(data.startDate);
    const parsedDueDate = parseTaskDate(data.dueDate);

    if (parsedStartDate === "invalid" || parsedDueDate === "invalid") {
      return {
        success: false,
        error: "Invalid date format",
      };
    }

    if (
      parsedStartDate &&
      parsedDueDate &&
      parsedStartDate.getTime() > parsedDueDate.getTime()
    ) {
      return {
        success: false,
        error: "Start date cannot be later than due date",
      };
    }

    const newTask = await prisma.task.create({
      data: {
        title: safeData.title,
        type: safeData.type,
        content: safeData.content,
        projectId: safeData.projectId,
        stepId: safeData.stepId,
        creatorId: safeData.creatorId,
        order: safeData.order,
        isUrgent: data.isUrgent || false,
        startDate: parsedStartDate,
        dueDate: parsedDueDate,
        assignees: {
          create: safeData.assigneeIds.map((userId) => ({ userId })),
        },
      },
      include: {
        assignees: {
          include: { user: true },
        },
      },
    });
    revalidatePath(`/projects/${data.projectId}`);
    await publishRealtimeEvent({
      type: "task.created",
      payload: { projectId: data.projectId, taskId: newTask.id },
    });

    // Notify assignees
    await notifyTaskAssigned({
      taskId: newTask.id,
      projectId: data.projectId,
      newAssigneeIds: safeData.assigneeIds,
      creatorId: safeData.creatorId,
    });

    // Send email to assignees
    const projectForEmail = await prisma.project.findUnique({
      where: { id: data.projectId },
      select: { name: true },
    });
    const creator = await prisma.user.findUnique({
      where: { id: safeData.creatorId },
      select: { name: true, email: true },
    });

    if (projectForEmail && creator) {
      const taskLink = await buildInvitationLink(data.projectId, newTask.id);
      const emailJobs = newTask.assignees
        .filter(
          (assignee) =>
            !!assignee.user?.email &&
            assignee.userId !== safeData.creatorId &&
            (assignee.user as any)?.emailNotifications !== false,
        )
        .map((assignee) =>
          sendTaskAssignmentEmail(
            assignee.user?.email || "",
            assignee.user?.name || "User",
            creator.name || "System",
            creator.email || undefined,
            projectForEmail.name,
            safeData.title,
            taskLink,
          ),
        );

      dispatchEmailInBackground(emailJobs, "createTask");
    }

    return { success: true, task: newTask };
  } catch (error) {
    console.error("Error creating task:", error);
    return { success: false, error: "Failed to create task" };
  }
}

export async function updateTaskStatus(
  taskId: string,
  stepId: string,
  projectId: string,
  actorId: string,
) {
  try {
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
      select: { stepId: true },
    });

    await prisma.task.update({
      where: { id: taskId },
      data: { stepId },
    });

    revalidatePath(`/projects/${projectId}`);
    await publishRealtimeEvent({
      type: "task.status.updated",
      payload: { projectId, taskId, stepId },
    });

    // Notify creator if step changed (but not if creator is the actor)
    if (existingTask && existingTask.stepId !== stepId) {
      await notifyTaskStepChanged({
        taskId,
        actorId,
        newStepId: stepId,
        projectId,
      });
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignees: {
          include: { user: true },
        },
      },
    });

    if (task) {
      const projectForEmail = await prisma.project.findUnique({
        where: { id: projectId },
        select: { name: true },
      });
      const updater = await prisma.user.findUnique({
        where: { id: actorId },
        select: { name: true, email: true },
      });

      if (projectForEmail && updater) {
        const taskLink = await buildInvitationLink(projectId, taskId);
        const emailJobs = task.assignees
          .filter(
            (assignee) =>
              assignee.user?.email &&
              assignee.userId !== actorId &&
              (assignee.user as any)?.emailNotifications !== false,
          )
          .map((assignee) =>
            sendTaskUpdateEmail(
              assignee.user?.email || "",
              assignee.user?.name || "User",
              updater.name || "System",
              updater.email || undefined,
              projectForEmail.name,
              task.title,
              "status",
              stepId,
              taskLink,
            ),
          );

        dispatchEmailInBackground(emailJobs, "updateTaskStatus");
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating task:", error);
    return { success: false };
  }
}

export async function updateTaskOrders(
  projectId: string,
  updates: Array<{ taskId: string; order: number }>,
) {
  try {
    if (!updates.length) {
      return { success: true };
    }

    await prisma.$transaction(
      updates.map((item) =>
        prisma.task.update({
          where: { id: item.taskId },
          data: { order: item.order },
        }),
      ),
    );

    revalidatePath(`/projects/${projectId}`);
    await publishRealtimeEvent({
      type: "task.order.updated",
      payload: { projectId, taskIds: updates.map((item) => item.taskId) },
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating task orders:", error);
    return { success: false, error: "Failed to update task orders" };
  }
}

export async function updateTaskDescription(
  taskId: string,
  content: string,
  projectId: string,
) {
  try {
    await prisma.task.update({
      where: { id: taskId },
      data: { content: latin1Safe(content, "") },
    });
    revalidatePath(`/projects/${projectId}`);
    await publishRealtimeEvent({
      type: "task.description.updated",
      payload: { projectId, taskId },
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating task description:", error);
    return { success: false };
  }
}

export async function updateTaskAssignees(
  taskId: string,
  assigneeIds: string[],
  projectId: string,
  actorId: string,
) {
  try {
    const uniqueAssigneeIds = [...new Set(assigneeIds)];
    if (uniqueAssigneeIds.length === 0) {
      return { success: false, error: "Task must have at least one assignee" };
    }

    const taskScope = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        creatorId: true,
        project: {
          select: {
            team: {
              select: {
                members: {
                  select: { userId: true },
                },
              },
            },
          },
        },
        assignees: {
          select: { userId: true },
        },
      },
    });

    if (!taskScope) {
      return { success: false, error: "Task not found" };
    }

    const teamMemberIdSet = new Set(
      taskScope.project.team.members.map((member) => member.userId),
    );

    if (uniqueAssigneeIds.some((userId) => !teamMemberIdSet.has(userId))) {
      return {
        success: false,
        error: "Assignees must be members of this team",
      };
    }

    const previousAssigneeIds = taskScope.assignees.map((a) => a.userId);
    const newlyAddedIds = uniqueAssigneeIds.filter(
      (id) => !previousAssigneeIds.includes(id),
    );

    await prisma.$transaction([
      prisma.taskAssignee.deleteMany({ where: { taskId } }),
      prisma.taskAssignee.createMany({
        data: uniqueAssigneeIds.map((userId) => ({ taskId, userId })),
      }),
    ]);

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignees: {
          include: { user: true },
        },
      },
    });

    revalidatePath(`/projects/${projectId}`);
    await publishRealtimeEvent({
      type: "task.assignees.updated",
      payload: { projectId, taskId, assigneeIds: uniqueAssigneeIds },
    });

    // Notify newly added assignees
    await notifyTaskAssigned({
      taskId,
      projectId,
      newAssigneeIds: uniqueAssigneeIds,
      previousAssigneeIds,
      creatorId: actorId,
    });

    // Send email to newly added assignees
    if (newlyAddedIds.length > 0 && task) {
      const actor = await prisma.user.findUnique({
        where: { id: actorId },
        select: { name: true, email: true },
      });

      const projectData = await prisma.project.findUnique({
        where: { id: projectId },
        select: { name: true },
      });

      if (actor && projectData) {
        const taskLink = await buildInvitationLink(projectId, taskId);
        const emailJobs = task.assignees
          .filter(
            (assignee) =>
              newlyAddedIds.includes(assignee.userId) &&
              !!assignee.user?.email &&
              assignee.userId !== taskScope.creatorId &&
              (assignee.user as any)?.emailNotifications !== false,
          )
          .map((assignee) =>
            sendTaskAssignmentEmail(
              assignee.user?.email || "",
              assignee.user?.name || "User",
              actor.name || "System",
              actor.email || undefined,
              projectData.name,
              task.title,
              taskLink,
            ),
          );

        dispatchEmailInBackground(emailJobs, "updateTaskAssignees");
      }
    }

    return { success: true, task };
  } catch (error) {
    console.error("Error updating task assignees:", error);
    return { success: false, error: "Failed to update task assignees" };
  }
}

export async function updateTaskTitle(
  taskId: string,
  title: string,
  projectId: string,
) {
  try {
    await prisma.task.update({
      where: { id: taskId },
      data: { title: latin1Safe(title, "Untitled Task") },
    });
    revalidatePath(`/projects/${projectId}`);
    await publishRealtimeEvent({
      type: "task.title.updated",
      payload: { projectId, taskId, title },
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating task title:", error);
    return { success: false };
  }
}

export async function updateTaskUrgent(
  taskId: string,
  isUrgent: boolean,
  projectId: string,
) {
  try {
    await prisma.task.update({
      where: { id: taskId },
      data: { isUrgent },
    });
    revalidatePath(`/projects/${projectId}`);
    await publishRealtimeEvent({
      type: "task.urgent.updated",
      payload: { projectId, taskId, isUrgent },
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating task urgent status:", error);
    return { success: false };
  }
}

export async function updateTaskDates(
  taskId: string,
  startDate: string | null,
  dueDate: string | null,
  projectId: string,
) {
  try {
    const parsedStartDate = parseTaskDate(startDate);
    const parsedDueDate = parseTaskDate(dueDate);

    if (parsedStartDate === "invalid" || parsedDueDate === "invalid") {
      return {
        success: false,
        error: "Invalid date format",
      };
    }

    if (
      parsedStartDate &&
      parsedDueDate &&
      parsedStartDate.getTime() > parsedDueDate.getTime()
    ) {
      return {
        success: false,
        error: "Start date cannot be later than due date",
      };
    }

    await prisma.task.update({
      where: { id: taskId },
      data: {
        startDate: parsedStartDate,
        dueDate: parsedDueDate,
      },
    });

    revalidatePath(`/projects/${projectId}`);
    await publishRealtimeEvent({
      type: "task.dates.updated",
      payload: { projectId, taskId, startDate, dueDate },
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating task dates:", error);
    return { success: false, error: "Failed to update task dates" };
  }
}

export async function deleteTask(taskId: string, projectId: string) {
  try {
    await prisma.$transaction(async (tx) => {
      // Detach child tasks first to avoid FK errors on self-reference.
      await tx.task.updateMany({
        where: { parentId: taskId },
        data: { parentId: null },
      });

      await tx.task.delete({ where: { id: taskId } });
    });

    revalidatePath(`/projects/${projectId}`);
    await publishRealtimeEvent({
      type: "task.deleted",
      payload: { projectId, taskId },
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting task:", error);
    return { success: false, error: "Failed to delete task" };
  }
}
