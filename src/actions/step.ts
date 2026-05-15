"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { notifyStepUpdated } from "@/lib/notification";

export async function createStep(
  projectId: string,
  title: string,
  color: string,
  order: number,
) {
  try {
    const newStep = await prisma.step.create({
      data: {
        title,
        color,
        order,
        projectId,
      },
    });
    revalidatePath(`/projects/${projectId}`);
    return { success: true, step: newStep };
  } catch (error) {
    console.error("Error creating step:", error);
    return { success: false, error: "Failed to create step" };
  }
}
export async function updateStep(
  id: string,
  title: string,
  color: string,
  order: number,
  actorId: string,
) {
  try {
    const existingStep = await prisma.step.findUnique({
      where: { id },
      select: { title: true, color: true, projectId: true },
    });

    if (!existingStep) {
      return { success: false, error: "Step not found" };
    }

    const updatedStep = await prisma.step.update({
      where: { id },
      data: { title, color, order },
    });

    revalidatePath(`/projects/${updatedStep.projectId}`);

    // Determine what changed
    const changes = [];
    if (existingStep.title !== title) changes.push(`title changed to "${title}"`);
    if (existingStep.color !== color) changes.push(`color changed to "${color}"`);

    if (changes.length > 0) {
      await notifyStepUpdated({
        stepId: id,
        actorId,
        projectId: updatedStep.projectId,
        changeDetails: changes.join(", "),
      });
    }

    return { success: true, step: updatedStep };
  } catch (error) {
    console.error("Error updating step:", error);
    return { success: false, error: "Failed to update step" };
  }
}

export async function deleteStep(id: string) {
  try {
    const step = await prisma.step.findUnique({
      where: { id },
      select: {
        id: true,
        projectId: true,
        tasks: {
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!step) {
      return { success: false, error: "Column not found" };
    }

    if (step.tasks.length > 0) {
      return {
        success: false,
        error: "Cannot delete this column because it still has tasks",
      };
    }

    const remainingSteps = await prisma.$transaction(async (tx) => {
      await tx.step.delete({ where: { id: step.id } });

      const steps = await tx.step.findMany({
        where: { projectId: step.projectId },
        orderBy: { order: "asc" },
      });

      await Promise.all(
        steps.map((s, index) => {
          if (s.order === index) return Promise.resolve();
          return tx.step.update({
            where: { id: s.id },
            data: { order: index },
          });
        }),
      );

      return steps.map((s, index) => ({ ...s, order: index }));
    });

    revalidatePath(`/projects/${step.projectId}`);
    return { success: true, steps: remainingSteps };
  } catch (error) {
    console.error("Error deleting step:", error);
    return { success: false, error: "Failed to delete step" };
  }
}
