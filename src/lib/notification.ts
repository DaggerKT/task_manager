"use server";

import prisma from "@/lib/prisma";
import { publishRealtimeEvent } from "@/lib/realtime";

type NotificationType = "TASK_STEP_CHANGED" | "TASK_ASSIGNED" | "STEP_UPDATED";

export async function createNotification(data: {
  type: NotificationType;
  recipientId: string;
  actorId?: string;
  taskId?: string;
  stepId?: string;
  projectId: string;
  title: string;
  message: string;
}) {
  try {
    const notification = await prisma.notification.create({
      data,
      include: {
        recipient: true,
        actor: true,
      },
    });

    // Publish realtime event so recipient gets notified in real-time
    // but respect recipient push notification preference. Fetch preference
    // explicitly to avoid relying on included user shape.
    const recipientPrefs = await prisma.user.findUnique({
      where: { id: data.recipientId },
      select: { pushNotifications: true },
    });

    if (recipientPrefs?.pushNotifications) {
      await publishRealtimeEvent({
        type: "notification.created",
        payload: {
          userId: data.recipientId,
          notification: {
            id: notification.id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            taskId: notification.taskId,
            projectId: notification.projectId,
          },
        },
      });
    }

    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
}

/**
 * แจ้งให้ creator of task ทราบว่า step ถูกเปลี่ยน
 * - ถ้า creator คือคนที่ทำการเปลี่ยน ไม่ต้องแจ้ง
 */
export async function notifyTaskStepChanged(data: {
  taskId: string;
  actorId: string;
  newStepId: string;
  projectId: string;
}) {
  try {
    const task = await prisma.task.findUnique({
      where: { id: data.taskId },
      select: {
        id: true,
        title: true,
        creatorId: true,
        step: {
          select: { title: true },
        },
      },
    });

    if (!task) return;

    // ถ้า creator คือคนที่ทำการเปลี่ยน ไม่ต้องแจ้ง
    if (task.creatorId === data.actorId) return;

    const newStep = await prisma.step.findUnique({
      where: { id: data.newStepId },
      select: { title: true },
    });

    if (!newStep) return;

    const actor = await prisma.user.findUnique({
      where: { id: data.actorId },
      select: { name: true },
    });

    const title = `Task "${task.title}" step has been changed`;
    const message = `${actor?.name || "Someone"} changed the step from "${task.step.title}" to "${newStep.title}"`;

    await createNotification({
      type: "TASK_STEP_CHANGED",
      recipientId: task.creatorId,
      actorId: data.actorId,
      taskId: data.taskId,
      stepId: data.newStepId,
      projectId: data.projectId,
      title,
      message,
    });
  } catch (error) {
    console.error("Error notifying task step change:", error);
  }
}

/**
 * แจ้งให้ assignee ทราบว่ามีงาน/task ใหม่ที่ได้รับมอบหมาย
 */
export async function notifyTaskAssigned(data: {
  taskId: string;
  projectId: string;
  newAssigneeIds: string[];
  previousAssigneeIds?: string[];
  creatorId: string;
}) {
  try {
    console.log("[DEBUG] notifyTaskAssigned data:", data);
    const task = await prisma.task.findUnique({
      where: { id: data.taskId },
      select: {
        id: true,
        title: true,
      },
    });

    console.log("[DEBUG] notifyTaskAssigned task:", task);

    if (!task) return;

    const creator = await prisma.user.findUnique({
      where: { id: data.creatorId },
      select: { name: true },
    });

    console.log("[DEBUG] notifyTaskAssigned creator:", creator);

    // หา assignee ที่ใหม่เพิ่มมา
    const previousSet = new Set(data.previousAssigneeIds || []);
    console.log("[DEBUG] notifyTaskAssigned previousSet:", previousSet);
    const newAssigneeIds = data.newAssigneeIds.filter(
      (id) => !previousSet.has(id),
    );
    console.log("[DEBUG] notifyTaskAssigned newAssigneeIds:", newAssigneeIds);

    // แจ้งให้ assignee ที่ใหม่เท่านั้น
    for (const assigneeId of newAssigneeIds) {
      if (assigneeId === data.creatorId) continue;
      await createNotification({
        type: "TASK_ASSIGNED",
        recipientId: assigneeId,
        actorId: data.creatorId,
        taskId: data.taskId,
        projectId: data.projectId,
        title: `New task assigned to you`,
        message: `${creator?.name || "Someone"} assigned you a new task: "${task.title}"`,
      });
    }
  } catch (error) {
    console.error("Error notifying task assigned:", error);
  }
}

/**
 * แจ้งให้ creator of tasks in step ทราบว่า step ถูกแก้ไข
 * - ถ้า creator คือคนที่ทำการแก้ไข ไม่ต้องแจ้ง
 */
export async function notifyStepUpdated(data: {
  stepId: string;
  actorId: string;
  projectId: string;
  changeDetails: string; // e.g. "title changed to 'In Progress'"
}) {
  try {
    const step = await prisma.step.findUnique({
      where: { id: data.stepId },
      select: { id: true, title: true, projectId: true },
    });

    if (!step) return;

    // หา creators ของ task ทั้งหมดใน step นี้
    const taskCreators = await prisma.task.findMany({
      where: { stepId: data.stepId },
      select: { creatorId: true },
      distinct: ["creatorId"],
    });

    const actor = await prisma.user.findUnique({
      where: { id: data.actorId },
      select: { name: true },
    });

    // ส่ง notification ให้ creators แต่ละคน (ยกเว้นคนที่ทำการแก้ไข)
    for (const { creatorId } of taskCreators) {
      if (creatorId === data.actorId) continue; // skip actor

      await createNotification({
        type: "STEP_UPDATED",
        recipientId: creatorId,
        actorId: data.actorId,
        stepId: data.stepId,
        projectId: data.projectId,
        title: `Step "${step.title}" has been updated`,
        message: `${actor?.name || "Someone"} updated: ${data.changeDetails}`,
      });
    }
  } catch (error) {
    console.error("Error notifying step update:", error);
  }
}

/**
 * Get unread notifications for a user
 */
export async function getUnreadNotifications(userId: string) {
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        recipientId: userId,
        read: false,
      },
      include: {
        actor: true,
        task: {
          select: { id: true, title: true, projectId: true },
        },
        project: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return notifications;
  } catch (error) {
    console.error("Error getting unread notifications:", error);
    return [];
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
  try {
    return await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
  }
}
