"use server";

import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { latin1Safe } from "@/utils/encoding";

export async function syncUserToDatabase(empData: any) {
  try {
    const safeName       = latin1Safe(empData.empName, empData.empUserName);
    const safePosition   = latin1Safe(empData.empPositionName, empData.empPositionShortName);
    const safeDepartment = latin1Safe(empData.empDeptName, empData.empDeptShortName);

    const user = await prisma.user.upsert({
      where: {
        username: empData.empUserName,
      },
      update: {
        empNo: empData.empNo,
        name: safeName,
        email: empData.empEmail,
        position: safePosition,
        department: safeDepartment,
        avatar: empData.empImg || null,
      },
      create: {
        username: empData.empUserName,
        empNo: empData.empNo,
        name: safeName,
        email: empData.empEmail,
        position: safePosition,
        department: safeDepartment,
        avatar: empData.empImg || null,
      },
    });

    // Store user ID in a secure httpOnly cookie so server actions can identify the caller
    const cookieStore = await cookies();
    cookieStore.set("user_id", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return { status: "success", user };
  } catch (error) {
    console.error("Error syncing user to DB:", error);

    // Fallback: if sync fails (e.g., DB encoding issue), try finding existing user
    // by username and still issue auth cookie so protected actions can proceed.
    try {
      const username = empData?.empUserName;
      if (username) {
        const existingUser = await prisma.user.findUnique({
          where: { username },
        });

        if (existingUser) {
          const cookieStore = await cookies();
          cookieStore.set("user_id", existingUser.id, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 7,
          });

          return { status: "success", user: existingUser };
        }
      }
    } catch (fallbackError) {
      console.error("Fallback user lookup failed:", fallbackError);
    }

    return { status: "error", message: "Failed to sync user data" };
  }
}
