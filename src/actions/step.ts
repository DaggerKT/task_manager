"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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
) {
  try {
    const updatedStep = await prisma.step.update({
      where: { id },
      data: { title, color, order },
    });
    revalidatePath(`/projects/${updatedStep.projectId}`);
    return { success: true, step: updatedStep };
  } catch (error) {
    console.error("Error updating step:", error);
    return { success: false, error: "Failed to update step" };
  }
}
