'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { latin1Safe } from '@/utils/encoding';
import { publishRealtimeEvent } from '@/lib/realtime';

export async function createTask(data: {
  title: string;
  type: string;
  content: string;
  projectId: string;
  stepId: string;
  assigneeIds: string[];
  creatorId: string;
  order: number;
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
      title: latin1Safe(data.title, 'Untitled Task'),
      type: latin1Safe(data.type, 'General'),
      content: latin1Safe(data.content, ''),
    };

    const newTask = await prisma.task.create({
      data: {
        title: safeData.title,
        type: safeData.type,
        content: safeData.content,
        projectId: safeData.projectId,
        stepId: safeData.stepId,
        creatorId: safeData.creatorId,
        order: safeData.order,
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
      type: 'task.created',
      payload: { projectId: data.projectId, taskId: newTask.id },
    });
    return { success: true, task: newTask };
  } catch (error) {
    console.error("Error creating task:", error);
    return { success: false, error: "Failed to create task" };
  }
}

export async function updateTaskStatus(taskId: string, stepId: string, projectId: string) {
  try {
    await prisma.task.update({
      where: { id: taskId },
      data: { stepId }
    });
    revalidatePath(`/projects/${projectId}`);
    await publishRealtimeEvent({
      type: 'task.status.updated',
      payload: { projectId, taskId, stepId },
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating task:", error);
    return { success: false };
  }
}

export async function updateTaskDescription(taskId: string, content: string, projectId: string) {
  try {
    await prisma.task.update({
      where: { id: taskId },
      data: { content: latin1Safe(content, '') }
    });
    revalidatePath(`/projects/${projectId}`);
    await publishRealtimeEvent({
      type: 'task.description.updated',
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
) {
  try {
    const uniqueAssigneeIds = [...new Set(assigneeIds)];
    if (uniqueAssigneeIds.length === 0) {
      return { success: false, error: "Task must have at least one assignee" };
    }

    const taskScope = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
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
      type: 'task.assignees.updated',
      payload: { projectId, taskId, assigneeIds: uniqueAssigneeIds },
    });

    return { success: true, task };
  } catch (error) {
    console.error("Error updating task assignees:", error);
    return { success: false, error: "Failed to update task assignees" };
  }
}