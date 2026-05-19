export const dynamic = "force-dynamic";

import ProjectsList from "@/components/project/List";
import { getProjects } from "@/actions/project";
import type { ProjectMemberAvatar } from "@/types/project";

export default async function Page() {
  const { projects: rawProjects, currentUserId } = await getProjects();

  const formattedProjects = rawProjects.map((p) => {
    const totalTasks = p._count?.tasks || 0;
    const doneTasks = p.tasks?.length || 0;
    const progress =
      totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);

    const allMembers: ProjectMemberAvatar[] =
      p.team?.members?.map((m) => ({
        id: m.user.id,
        name: m.user.name ?? null,
        avatar: m.user.avatar ?? null,
      })) ?? [];

    const canDelete =
      p.team?.members?.some(
        (m) => m.user.id === currentUserId && m.role === "ADMIN",
      ) ?? false;

    return {
      id: p.id,
      sortOrder: p.sortOrder,
      name: p.name,
      status: p.status,
      progress,
      members: allMembers.length || 1,
      memberAvatars: allMembers,
      dueDate: p.dueDate ? p.dueDate.toISOString() : null,
      canDelete,
    };
  });

  return <ProjectsList initialProjects={formattedProjects} />;
}
