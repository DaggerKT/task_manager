import KanbanBoard from "./KanbanBoard";
import { getProjectData } from "@/actions/project";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { project, steps, tasks } = await getProjectData(id);

  if (!project) return notFound();

  const cookieStore = await cookies();
  const currentUserId = cookieStore.get("user_id")?.value || "";

  const formattedTasks = tasks.map(t => ({
    id: t.id,
    title: t.title,
    status: t.stepId,
    type: t.type,
    assignees: (t.assignees || []).map((a) => ({
      id: a.userId,
      name: a.user?.name || "Unknown User",
      avatar: a.user?.name?.[0] || "U",
      avatarUrl: a.user?.avatar || "",
    })),
    description: t.content || "",
    comments: t.comments.length,
    commentList: t.comments.map(c => ({
      id: c.id,
      text: c.content,
      authorName: c.user?.name || 'Unknown User',
      author: c.user?.name?.[0] || 'U',
      avatarUrl: c.user?.avatar || '',
      timestamp: new Date(c.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
    }))
  }));

  return (
    <KanbanBoard 
      initialProject={project} 
      initialSteps={steps} 
      initialTasks={formattedTasks}
      currentUserId={currentUserId}
    />
  );
}
