'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { latin1Safe } from '@/utils/encoding';

export async function createTask(data: {
  title: string;
  type: string;
  content: string;
  projectId: string;
  stepId: string;
  assigneeId?: string;
  creatorId: string;
  order: number;
}) {
  try {
    const safeData = {
      ...data,
      title: latin1Safe(data.title, 'Untitled Task'),
      type: latin1Safe(data.type, 'General'),
      content: latin1Safe(data.content, ''),
    };

    const newTask = await prisma.task.create({
      data: safeData
    });
    revalidatePath(`/projects/${data.projectId}`);
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
    return { success: true };
  } catch (error) {
    console.error("Error updating task description:", error);
    return { success: false };
  }
}