"use server";

import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { latin1Safe } from "@/utils/encoding";
import { publishRealtimeEvent } from "@/lib/realtime";
import type { Prisma } from "@/generated/prisma";

type IdentifierKind = "email" | "empNo" | "username";

function parseIdentifier(raw: string): {
  kind: IdentifierKind;
  value: string;
  email?: string;
  empNo?: string;
  username?: string;
} {
  const value = raw.trim();
  if (value.includes("@")) {
    const email = value.toLowerCase();
    return { kind: "email", value: email, email };
  }

  if (/^\d+$/.test(value)) {
    return { kind: "empNo", value, empNo: value };
  }

  const username = value.toLowerCase();
  return { kind: "username", value: username, username };
}

async function getCurrentUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("user_id")?.value ?? null;
}

async function getCurrentUser() {
  const userId = await getCurrentUserId();
  if (!userId) return null;
  return prisma.user.findUnique({ where: { id: userId } });
}

export async function createInvitation(
  teamId: string,
  projectId: string,
  identifierInput: string,
) {
  try {
    const inviter = await getCurrentUser();
    if (!inviter) {
      return { success: false, error: "Unauthorized" };
    }

    const member = await prisma.teamMember.findFirst({
      where: { teamId, userId: inviter.id },
    });
    if (!member) {
      return { success: false, error: "You are not a member of this team" };
    }

    const project = await prisma.project.findFirst({
      where: { id: projectId, teamId },
      select: { id: true },
    });
    if (!project) {
      return { success: false, error: "Project/team mismatch" };
    }

    const parsed = parseIdentifier(identifierInput);
    const safeIdentifier = latin1Safe(parsed.value);
    if (!safeIdentifier) {
      return { success: false, error: "Invalid identifier" };
    }

    const safeEmail = parsed.email
      ? latin1Safe(parsed.email).toLowerCase()
      : undefined;
    const safeEmpNo = parsed.empNo ? latin1Safe(parsed.empNo) : undefined;
    const safeUsername = parsed.username
      ? latin1Safe(parsed.username).toLowerCase()
      : undefined;

    const userMatchOr: Prisma.UserWhereInput[] = [];
    if (safeEmail) userMatchOr.push({ email: safeEmail });
    if (safeEmpNo) userMatchOr.push({ empNo: safeEmpNo });
    if (safeUsername) userMatchOr.push({ username: safeUsername });

    const targetUser = await prisma.user.findFirst({
      where: {
        OR: userMatchOr,
      },
    });

    if (targetUser) {
      const existingMember = await prisma.teamMember.findFirst({
        where: { teamId, userId: targetUser.id },
      });
      if (existingMember) {
        return { success: false, error: "User is already in this team" };
      }
    }

    const duplicateOr: Prisma.InvitationWhereInput[] = [];
    if (targetUser) duplicateOr.push({ inviteeUserId: targetUser.id });
    if (safeEmail) duplicateOr.push({ inviteeEmail: safeEmail });
    if (safeEmpNo) duplicateOr.push({ inviteeEmpNo: safeEmpNo });
    if (safeUsername) duplicateOr.push({ inviteeUsername: safeUsername });

    const duplicate = await prisma.invitation.findFirst({
      where: {
        teamId,
        status: "PENDING",
        OR: duplicateOr,
      },
    });
    if (duplicate) {
      return { success: false, error: "Invitation already pending" };
    }

    const invitation = await prisma.invitation.create({
      data: {
        teamId,
        projectId,
        inviterUserId: inviter.id,
        inviteeUserId: targetUser?.id,
        inviteeEmail: safeEmail,
        inviteeEmpNo: safeEmpNo,
        inviteeUsername: safeUsername,
      },
    });

    revalidatePath("/notifications");
    revalidatePath(`/projects/${projectId}`);
    await publishRealtimeEvent({
      type: "invitation.created",
      payload: { projectId, teamId, invitationId: invitation.id },
    });
    return { success: true, invitation };
  } catch (error) {
    console.error("Error creating invitation:", error);
    return { success: false, error: "Failed to create invitation" };
  }
}

export async function getMyInvitations() {
  try {
    const user = await getCurrentUser();
    if (!user) return [];

    const invitationMatchOr: Prisma.InvitationWhereInput[] = [
      { inviteeUserId: user.id },
    ];
    if (user.username) {
      invitationMatchOr.push({ inviteeUsername: user.username.toLowerCase() });
    }
    if (user.empNo) {
      invitationMatchOr.push({ inviteeEmpNo: user.empNo });
    }
    if (user.email) {
      invitationMatchOr.push({ inviteeEmail: user.email.toLowerCase() });
    }

    const invitations = await prisma.invitation.findMany({
      where: {
        status: "PENDING",
        OR: invitationMatchOr,
      },
      include: {
        team: true,
        project: true,
        inviter: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Backfill inviteeUserId when identifier matches a now-existing user account.
    const unresolvedIds = invitations
      .filter((inv) => !inv.inviteeUserId)
      .map((inv) => inv.id);
    if (unresolvedIds.length > 0) {
      await prisma.invitation.updateMany({
        where: { id: { in: unresolvedIds } },
        data: { inviteeUserId: user.id },
      });
    }

    return invitations;
  } catch (error) {
    console.error("Error fetching invitations:", error);
    return [];
  }
}

export async function getPendingInvitationCount() {
  const invitations = await getMyInvitations();
  return invitations.length;
}

export async function respondToInvitation(
  invitationId: string,
  decision: "accept" | "decline",
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const invitationMatchOr: Prisma.InvitationWhereInput[] = [
      { inviteeUserId: user.id },
    ];
    if (user.username) {
      invitationMatchOr.push({ inviteeUsername: user.username.toLowerCase() });
    }
    if (user.empNo) {
      invitationMatchOr.push({ inviteeEmpNo: user.empNo });
    }
    if (user.email) {
      invitationMatchOr.push({ inviteeEmail: user.email.toLowerCase() });
    }

    const invitation = await prisma.invitation.findFirst({
      where: {
        id: invitationId,
        status: "PENDING",
        OR: invitationMatchOr,
      },
    });

    if (!invitation) {
      return { success: false, error: "Invitation not found" };
    }

    if (decision === "accept") {
      await prisma.$transaction([
        prisma.teamMember.upsert({
          where: {
            userId_teamId: {
              userId: user.id,
              teamId: invitation.teamId,
            },
          },
          create: {
            userId: user.id,
            teamId: invitation.teamId,
            role: "MEMBER",
          },
          update: {},
        }),
        prisma.invitation.update({
          where: { id: invitation.id },
          data: {
            status: "ACCEPTED",
            inviteeUserId: user.id,
            respondedAt: new Date(),
          },
        }),
      ]);
    } else {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: {
          status: "DECLINED",
          inviteeUserId: user.id,
          respondedAt: new Date(),
        },
      });
    }

    revalidatePath("/notifications");
    revalidatePath("/projects");
    await publishRealtimeEvent({
      type: "invitation.responded",
      payload: { invitationId, decision, teamId: invitation.teamId },
    });
    return { success: true };
  } catch (error) {
    console.error("Error responding to invitation:", error);
    return { success: false, error: "Failed to respond invitation" };
  }
}
