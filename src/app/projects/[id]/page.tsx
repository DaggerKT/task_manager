import KanbanBoard from "@/components/project/KanbanBoard";
import { getProjectData } from "@/actions/project";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { UserProvider } from "@/contexts/UserContext";
import dayjs from "dayjs";

const relativeTime = require("dayjs/plugin/relativeTime");
dayjs.extend(relativeTime);

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { project, steps, tasks } = await getProjectData(id);

  if (!project) return notFound();

  const cookieStore = await cookies();
  const currentUserId = cookieStore.get("user_id")?.value || "";

  const formattedTasks = tasks.map((t) => ({
    id: t.id,
    taskNo: t.taskNo,
    order: t.order,
    title: t.title,
    status: t.stepId,
    type: t.type,
    assignees: (t.assignees || []).map((a) => ({
      id: a.userId,
      name: a.user?.name || "Unknown User",
      avatar: a.user?.name?.[0] || "U",
      avatarUrl: a.user?.avatar || "",
    })),
    creatorId: t.creatorId,
    creatorName: t.creator?.name || "Unknown",
    creatorAvatarUrl: t.creator?.avatar || "",
    description: t.content || "",
    comments: t.comments.length,
    commentList: t.comments.map((c) => ({
      id: c.id,
      text: c.content,
      authorName: c.user?.name || "Unknown User",
      author: c.user?.name?.[0] || "U",
      avatarUrl: c.user?.avatar || "",
      timestamp: dayjs(c.createdAt).locale("th").fromNow(),
    })),
    isUrgent: t.isUrgent || false,
    startDate: t.startDate ? t.startDate.toISOString() : null,
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
  }));

  return (
    <UserProvider currentUserId={currentUserId}>
      <KanbanBoard
        initialProject={project}
        initialSteps={steps}
        initialTasks={formattedTasks}
        currentUserId={currentUserId}
      />
    </UserProvider>
  );
}
