'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { publishRealtimeEvent } from '@/lib/realtime';

export async function addComment(taskId: string, content: string, userId: string, projectId: string) {
  try {
    const comment = await prisma.comment.create({
      data: {
        content,
        taskId,
        userId
      },
      include: {
        user: true
      }
    });
    revalidatePath(`/projects/${projectId}`);
    await publishRealtimeEvent({
      type: 'comment.created',
      payload: { projectId, taskId, commentId: comment.id },
    });
    return { success: true, comment };
  } catch (error) {
    console.error("Error adding comment:", error);
    return { success: false };
  }
}