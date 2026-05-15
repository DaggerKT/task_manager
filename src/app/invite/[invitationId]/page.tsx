import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

interface InvitePageProps {
  params: Promise<{ invitationId: string }>;
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { invitationId } = await params;

  const invitation = await prisma.invitation.findUnique({
    where: { id: invitationId },
    select: {
      id: true,
      teamId: true,
      status: true,
      projectId: true,
      inviteeUserId: true,
      inviteeUsername: true,
      inviteeEmpNo: true,
      inviteeEmail: true,
    },
  });

  if (!invitation || invitation.status !== "PENDING") {
    redirect("/notifications");
  }

  const cookieStore = await cookies();
  const userId = cookieStore.get("user_id")?.value;

  if (!userId) {
    redirect(`/login?next=${encodeURIComponent(`/invite/${invitationId}`)}`);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true, empNo: true, email: true },
  });

  if (!user) {
    redirect("/login");
  }

  const existingMember = await prisma.teamMember.findFirst({
    where: {
      teamId: invitation.teamId,
      userId: user.id,
    },
    select: { id: true },
  });

  if (existingMember) {
    if (invitation.projectId) {
      redirect(`/projects/${invitation.projectId}`);
    }
    redirect("/projects");
  }

  const matchedByIdentifier =
    (invitation.inviteeUsername &&
      user.username &&
      invitation.inviteeUsername === user.username.toLowerCase()) ||
    (invitation.inviteeEmpNo && user.empNo && invitation.inviteeEmpNo === user.empNo) ||
    (invitation.inviteeEmail &&
      user.email &&
      invitation.inviteeEmail === user.email.toLowerCase());

  const hasExplicitTarget =
    !!invitation.inviteeUserId ||
    !!invitation.inviteeUsername ||
    !!invitation.inviteeEmpNo ||
    !!invitation.inviteeEmail;

  const canClaim =
    !hasExplicitTarget ||
    invitation.inviteeUserId === user.id ||
    !!matchedByIdentifier;

  if (!canClaim) {
    redirect("/notifications");
  }

  if (!invitation.inviteeUserId || invitation.inviteeUserId !== user.id) {
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: {
        inviteeUserId: user.id,
      },
    });
  }

  redirect(`/notifications?invitation=${invitationId}`);
}
