"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  Empty,
  Input,
  Modal,
  Select,
  Segmented,
  Statistic,
  Tag,
  Typography,
  message,
  Card,
} from "antd";
import {
  CalendarOutlined,
  FlagOutlined,
  SearchOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import { useLanguage } from "@/contexts/LanguageContext";
import { getProjectData } from "@/actions/project";
import {
  deleteTask,
  updateTaskAssignees,
  updateTaskDates,
  updateTaskDescription,
  updateTaskStatus,
  updateTaskTitle,
  updateTaskUrgent,
} from "@/actions/task";
import { addComment } from "@/actions/comment";
import { Gantt, ViewMode } from "gantt-task-react";
import "gantt-task-react/dist/index.css";
import ViewTaskModal from "../components/ViewTaskModal";
import type { BoardColumn, BoardMember, BoardTask } from "@/types/kanban";

export default function TimelinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { t } = useLanguage();
  const [boardTasks, setBoardTasks] = useState<BoardTask[]>([]);
  const [columns, setColumns] = useState<BoardColumn[]>([]);
  const [members, setMembers] = useState<BoardMember[]>([]);
  const [projectId, setProjectId] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [viewTask, setViewTask] = useState<BoardTask | null>(null);
  const [newComment, setNewComment] = useState("");
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editDescriptionContent, setEditDescriptionContent] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleContent, setEditTitleContent] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>(["all"]);
  const [assigneeFilter, setAssigneeFilter] = useState<string[]>(["all"]);
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [project, setProject] = useState<any>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Month);
  const [messageApi, contextHolder] = message.useMessage();
  const reloadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  type RealtimeMessage = {
    type?: string;
    payload?: {
      projectId?: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };

  const patchTask = (taskId: string, patch: Partial<BoardTask>) => {
    setBoardTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, ...patch } : task)),
    );
    setViewTask((prev) =>
      prev && prev.id === taskId ? { ...prev, ...patch } : prev,
    );
  };

  const loadProjectData = async () => {
    setIsLoading(true);
    const { id } = await params;
    setProjectId(id);

    const { tasks, project, steps, currentUserId } = await getProjectData(id);
    setProject(project);
    setCurrentUserId(currentUserId || "");

    const mappedColumns: BoardColumn[] = (steps || []).map((step: any) => ({
      id: step.id,
      title: step.title,
      color: step.color || "#94a3b8",
    }));
    setColumns(mappedColumns);

    const mappedMembers: BoardMember[] =
      project?.team?.members?.map((member: any) => ({
        id: member.userId ?? member.id ?? "",
        name: member.user?.name || "Unknown User",
        role: member.role || "Member",
        avatar: member.user?.name?.[0] || "U",
        avatarUrl: member.user?.avatar || "",
        email: member.user?.email || "",
        empNo: member.user?.empNo || "",
      })) || [];
    setMembers(mappedMembers);

    const mappedBoardTasks: BoardTask[] = tasks.map((task: any) => ({
      id: task.id,
      status: task.stepId,
      type: task.type || "Task",
      title: task.title,
      description: task.content || "",
      assignees:
        task.assignees?.map((assignee: any) => ({
          id: assignee.userId,
          name: assignee.user?.name || "Unknown",
          avatar: assignee.user?.name?.[0] || "U",
          avatarUrl: assignee.user?.avatar || "",
        })) || [],
      comments: task.comments?.length || 0,
      commentList:
        task.comments?.map((comment: any) => ({
          id: comment.id,
          text: comment.content,
          author: comment.userId,
          timestamp: new Date(comment.createdAt).toLocaleString(),
          authorName: comment.user?.name || "Unknown",
          avatarUrl: comment.user?.avatar || "",
        })) || [],
      creatorId: task.creatorId,
      creatorName: task.creator?.name || "Unknown",
      creatorAvatarUrl: task.creator?.avatar || "",
      isUrgent: !!task.isUrgent,
      startDate: task.startDate ? new Date(task.startDate).toISOString() : null,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString() : null,
    }));
    setBoardTasks(mappedBoardTasks);

    setIsLoading(false);
  };

  function handleTaskClick(task: any) {
    const selected = boardTasks.find((boardTask) => boardTask.id === task.id);
    if (!selected) return;

    setViewTask(selected);
    setEditTitleContent(selected.title);
    setEditDescriptionContent(selected.description || "");
    setIsEditingTitle(false);
    setIsEditingDescription(false);
    setNewComment("");
  }

  useEffect(() => {
    void loadProjectData();
  }, []);

  useEffect(() => {
    if (!projectId) return;

    const relevantEventPrefixes = ["task.", "comment.", "step."];
    const relevantEvents = new Set([
      "project.updated",
      "team.member.removed",
      "notification.created",
    ]);

    const handleRealtimeEvent = (event: Event) => {
      const customEvent = event as CustomEvent<RealtimeMessage>;
      const message = customEvent.detail;
      if (!message?.type) return;

      const isRelevantType =
        relevantEventPrefixes.some((prefix) =>
          message.type!.startsWith(prefix),
        ) || relevantEvents.has(message.type);
      if (!isRelevantType) return;

      const messageProjectId = message.payload?.projectId;
      if (messageProjectId && messageProjectId !== projectId) return;

      if (reloadTimerRef.current) {
        clearTimeout(reloadTimerRef.current);
      }

      reloadTimerRef.current = setTimeout(() => {
        void loadProjectData();
      }, 300);
    };

    window.addEventListener(
      "realtime:event",
      handleRealtimeEvent as EventListener,
    );

    return () => {
      if (reloadTimerRef.current) {
        clearTimeout(reloadTimerRef.current);
      }
      window.removeEventListener(
        "realtime:event",
        handleRealtimeEvent as EventListener,
      );
    };
  }, [projectId]);

  useEffect(() => {
    if (!viewTask) return;
    const synced = boardTasks.find((task) => task.id === viewTask.id);
    if (!synced) return;
    setViewTask(synced);
  }, [boardTasks, viewTask?.id]);

  const filteredTasks = useMemo(
    () =>
      boardTasks.filter((task) => {
        const titleMatch = task.title
          .toLowerCase()
          .includes(searchTerm.toLowerCase().trim());
        const statusMatch =
          statusFilter.includes("all") || statusFilter.includes(task.status);
        const assigneeMatch =
          assigneeFilter.includes("all") ||
          (task.assignees || []).some((assignee) =>
            assigneeFilter.includes(assignee.id),
          );
        const urgentMatch = !urgentOnly || !!task.isUrgent;
        return titleMatch && statusMatch && assigneeMatch && urgentMatch;
      }),
    [boardTasks, searchTerm, statusFilter, assigneeFilter, urgentOnly],
  );

  const ganttTasks = useMemo(
    () =>
      filteredTasks
        .filter((task) => task.startDate && task.dueDate)
        .map((task) => ({
          id: task.id,
          name: task.title,
          start: new Date(task.startDate as string),
          end: new Date(task.dueDate as string),
          type: "task" as const,
          progress: 0,
          isDisabled: false,
          styles: task.isUrgent
            ? {
                backgroundColor: "#dc2626",
                backgroundSelectedColor: "#b91c1c",
                progressColor: "#fca5a5",
                progressSelectedColor: "#ef4444",
              }
            : {
                backgroundColor:
                  columns.find((col) => col.id === task.status)?.color ||
                  "#94a3b8",
                backgroundSelectedColor:
                  columns.find((col) => col.id === task.status)?.color ||
                  "#94a3b8",
                progressColor: "#60a5fa",
                progressSelectedColor: "#3b82f6",
              },
        })),
    [filteredTasks],
  );

  const doneStatusIds = useMemo(
    () =>
      columns
        .filter((column) => column.title.toLowerCase().includes("done"))
        .map((column) => column.id),
    [columns],
  );

  const statScheduled = boardTasks.filter(
    (task) => task.startDate && task.dueDate,
  ).length;
  const statUrgent = boardTasks.filter((task) => !!task.isUrgent).length;
  const statDone = boardTasks.filter((task) =>
    doneStatusIds.includes(task.status),
  ).length;

  const currentUser: BoardMember = members[0] || {
    id: "",
    name: "Current User",
    role: "Member",
    avatar: "U",
    avatarUrl: "",
  };
  const teamMemberIds = members.map((member) => member.id).filter(Boolean);
  const actorId = currentUserId || viewTask?.creatorId || currentUser.id;

  const getTaskAssignees = (task: BoardTask) => task.assignees || [];

  const applyTaskAssigneesToState = (
    taskId: string,
    assignees: BoardTask["assignees"],
  ) => {
    patchTask(taskId, { assignees });
  };

  const handleSaveTitle = async () => {
    if (!viewTask || !editTitleContent.trim() || !projectId) return;
    const title = editTitleContent.trim();

    patchTask(viewTask.id, { title });
    setIsEditingTitle(false);

    const res = await updateTaskTitle(viewTask.id, title, projectId);
    if (!res.success) {
      messageApi.error("Failed to update title");
      await loadProjectData();
    }
  };

  const handleTaskDatesChange = async (
    startDate: string | null,
    dueDate: string | null,
  ) => {
    if (!viewTask || !projectId) return;
    if ((!startDate && dueDate) || (startDate && !dueDate)) {
      messageApi.warning("Please select both start and due date");
      return;
    }
    if (startDate && dueDate && startDate > dueDate) {
      messageApi.warning("Start date cannot be later than due date");
      return;
    }

    patchTask(viewTask.id, { startDate, dueDate });

    const res = await updateTaskDates(
      viewTask.id,
      startDate,
      dueDate,
      projectId,
    );
    if (!res.success) {
      messageApi.error(res.error || "Failed to update dates");
      await loadProjectData();
    }
  };

  const handleTaskStatusChange = async (statusId: string) => {
    if (!viewTask || !projectId || viewTask.status === statusId) return;
    patchTask(viewTask.id, { status: statusId });

    const res = await updateTaskStatus(
      viewTask.id,
      statusId,
      projectId,
      actorId,
    );
    if (!res.success) {
      messageApi.error("Failed to update status");
      await loadProjectData();
    }
  };

  const handleToggleUrgent = async () => {
    if (!viewTask || !projectId) return;
    const nextUrgent = !viewTask.isUrgent;
    patchTask(viewTask.id, { isUrgent: nextUrgent });

    const res = await updateTaskUrgent(viewTask.id, nextUrgent, projectId);
    if (!res.success) {
      messageApi.error("Failed to update urgent status");
      await loadProjectData();
    }
  };

  const handleSaveDescription = async () => {
    if (!viewTask || !projectId) return;
    patchTask(viewTask.id, { description: editDescriptionContent });
    setIsEditingDescription(false);

    const res = await updateTaskDescription(
      viewTask.id,
      editDescriptionContent,
      projectId,
    );
    if (!res.success) {
      messageApi.error("Failed to update description");
      await loadProjectData();
    }
  };

  const handleAddComment = async () => {
    if (!viewTask || !newComment.trim() || !projectId) return;
    if (!currentUserId) {
      messageApi.warning(t.kanban.pleaseLogin);
      return;
    }

    const res = await addComment(
      viewTask.id,
      newComment.trim(),
      currentUserId,
      projectId,
    );
    if (!res.success || !res.comment) {
      messageApi.error("Failed to add comment");
      return;
    }

    const nextComment = {
      id: res.comment.id,
      text: res.comment.content,
      author: res.comment.userId,
      timestamp: new Date(res.comment.createdAt).toLocaleTimeString("th-TH", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      authorName: res.comment.user?.name || currentUser.name,
      avatarUrl: res.comment.user?.avatar || currentUser.avatarUrl,
    };

    const nextCommentList = [...(viewTask.commentList || []), nextComment];
    patchTask(viewTask.id, {
      commentList: nextCommentList,
      comments: nextCommentList.length,
    });
    setNewComment("");
  };

  const handleAddAssigneeToTask = async (taskId: string, userId: string) => {
    if (!projectId) return;

    const task = boardTasks.find((item) => item.id === taskId);
    if (!task) return;
    if (!teamMemberIds.includes(userId)) {
      messageApi.warning(t.kanban.assigneeTeamOnly);
      return;
    }

    const current = getTaskAssignees(task);
    if (current.some((assignee) => assignee.id === userId)) return;

    const nextIds = [...current.map((assignee) => assignee.id), userId];
    const res = await updateTaskAssignees(taskId, nextIds, projectId, actorId);
    if (!res.success) {
      messageApi.error(res.error || t.kanban.addAssigneeFailed);
      return;
    }

    const nextAssignees = (res.task?.assignees || []).map((assignee) => ({
      id: assignee.userId,
      name: assignee.user?.name || "Unknown User",
      avatar: assignee.user?.name?.[0] || "U",
      avatarUrl: assignee.user?.avatar || "",
    }));
    applyTaskAssigneesToState(taskId, nextAssignees);
  };

  const handleRemoveAssigneeFromTask = async (
    taskId: string,
    userId: string,
  ) => {
    if (!projectId) return;

    const task = boardTasks.find((item) => item.id === taskId);
    if (!task) return;

    const current = getTaskAssignees(task);
    if (current.length <= 1) {
      messageApi.warning(t.kanban.minOneAssignee);
      return;
    }

    const nextIds = current
      .map((assignee) => assignee.id)
      .filter((id) => id !== userId);
    const res = await updateTaskAssignees(taskId, nextIds, projectId, actorId);
    if (!res.success) {
      messageApi.error(res.error || t.kanban.removeAssigneeFailed);
      return;
    }

    const nextAssignees = (res.task?.assignees || []).map((assignee) => ({
      id: assignee.userId,
      name: assignee.user?.name || "Unknown User",
      avatar: assignee.user?.name?.[0] || "U",
      avatarUrl: assignee.user?.avatar || "",
    }));
    applyTaskAssigneesToState(taskId, nextAssignees);
  };

  const handleDeleteCurrentTask = async () => {
    if (!viewTask || !projectId) return;

    const taskId = viewTask.id;
    Modal.confirm({
      title: t.kanban.deleteTask,
      content: t.kanban.deleteTaskConfirm,
      okText: t.kanban.deleteTask,
      cancelText: t.common.cancel,
      okButtonProps: { danger: true },
      async onOk() {
        const res = await deleteTask(taskId, projectId);
        if (!res.success) {
          messageApi.error(res.error || "Failed to delete task");
          return;
        }

        setBoardTasks((prev) => prev.filter((task) => task.id !== taskId));
        setViewTask(null);
        setIsEditingDescription(false);
        setIsEditingTitle(false);
      },
    });
  };

  return (
    <>
      {contextHolder}
      <div className="min-h-full flex flex-col gap-4">
        <Card>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <Typography.Title level={2} className="mb-1!">
              {t.timeline.title}: {project?.name || "Project"}
            </Typography.Title>
            <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 lg:w-auto lg:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                <Statistic
                  title={t.timeline.allTasks}
                  value={boardTasks.length}
                  prefix={<UnorderedListOutlined />}
                />
              </div>
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                <Statistic
                  title={t.timeline.scheduled}
                  value={statScheduled}
                  prefix={<CalendarOutlined />}
                />
              </div>
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2">
                <Statistic
                  title={t.timeline.urgent}
                  value={statUrgent}
                  prefix={<FlagOutlined />}
                  styles={{ content: { color: "#b91c1c" } }}
                />
              </div>
            </div>
          </div>
          <div>
            <div className="mt-4 grid grid-cols-1 gap-2 lg:grid-cols-12">
              <Input
                allowClear
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={t.timeline.searchTaskTitle}
                prefix={<SearchOutlined className="text-slate-400" />}
                className="lg:col-span-4"
              />
              <Select
                value={statusFilter}
                onChange={(value) => {
                  let selected = Array.isArray(value) ? value : [value];

                  if (selected.length === 0) selected = ["all"];

                  if (selected.includes("all") && selected.length > 1) {
                    selected =
                      selected[selected.length - 1] === "all"
                        ? ["all"]
                        : selected.filter((v) => v !== "all");
                  }

                  setStatusFilter(selected);
                }}
                mode="multiple"
                className="w-full lg:col-span-3"
                allowClear
                options={[
                  { value: "all", label: t.timeline.allTasks },
                  ...columns.map((column) => ({
                    value: column.id,
                    label: column.title,
                  })),
                ]}
              />
              <Select
                value={assigneeFilter}
                onChange={(value) => {
                  let selected = Array.isArray(value) ? value : [value];

                  if (selected.length === 0) selected = ["all"];

                  if (selected.includes("all") && selected.length > 1) {
                    selected =
                      selected[selected.length - 1] === "all"
                        ? ["all"]
                        : selected.filter((v) => v !== "all");
                  }

                  setAssigneeFilter(selected);
                }}
                allowClear
                mode="multiple"
                className="w-full lg:col-span-3"
                options={[
                  { value: "all", label: t.timeline.allAssignees },
                  ...members.map((member) => ({
                    value: member.id,
                    label: member.name,
                  })),
                ]}
              />
              <Button
                className="lg:col-span-2"
                type={urgentOnly ? "primary" : "default"}
                danger={urgentOnly}
                onClick={() => setUrgentOnly((prev) => !prev)}
              >
                {urgentOnly ? t.timeline.urgent : t.timeline.allTasks}
              </Button>
            </div>
          </div>
        </Card>

        <Card>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1">
            <Segmented
              value={viewMode}
              onChange={(value) => setViewMode(value as ViewMode)}
              options={[ViewMode.Day, ViewMode.Week, ViewMode.Month]}
            />
            <Typography.Text className="text-xs text-slate-500">
              {t.timeline.done}: {statDone}• {t.timeline.showing}:{" "}
              {filteredTasks.length}• {t.timeline.hidden}({t.timeline.noDates}):{" "}
              {Math.max(filteredTasks.length - ganttTasks.length, 0)}
            </Typography.Text>
          </div>

          {isLoading ? (
            <div className="flex h-105 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50">
              <Typography.Text className="text-slate-500">
                Loading timeline...
              </Typography.Text>
            </div>
          ) : ganttTasks.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <Gantt
                tasks={ganttTasks}
                viewMode={viewMode}
                locale="en"
                listCellWidth="150px"
                rowHeight={36}
                headerHeight={40}
                fontSize="12px"
                columnWidth={viewMode === ViewMode.Month ? 250 : 64}
                barCornerRadius={8}
                barFill={72}
                todayColor="rgba(59, 130, 246, 0.16)"
                fontFamily="ui-rounded, system-ui, sans-serif"
                onClick={(task) => {
                  const clicked = boardTasks.find((t) => t.id === task.id);
                  if (clicked) {
                    handleTaskClick(clicked);
                  }
                }}
              />
            </div>
          ) : (
            <div className="flex h-105 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50">
              <Empty description="No timeline tasks match current filters" />
            </div>
          )}
        </Card>

        {/* แสดง list ที่ยังไม่ได้ใส่วันที่ */}
        {filteredTasks.length > ganttTasks.length && (
          <Card>
            <Typography.Title level={4}>
              {/* Tasks without dates */}
              {t.timeline.tasksWithoutDates}
            </Typography.Title>
            <div className="mt-3 flex flex-col gap-3 max-h-[calc(100vh-190px)] overflow-y-auto">
              {filteredTasks
                .filter((task) => !task.startDate || !task.dueDate)
                .map((task) => (
                  <div
                    key={task.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-2 hover:bg-slate-50"
                    onClick={() => {
                      handleTaskClick(task);
                    }}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-sm text-slate-600">
                      {task.title[0]?.toUpperCase() || "T"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <Typography.Text className="block truncate font-medium">
                        {task.title}
                      </Typography.Text>
                      <Typography.Text className="block truncate text-sm text-slate-500">
                        {task.assignees?.map((a) => a.name).join(", ") ||
                          "No assignees"}
                      </Typography.Text>
                    </div>
                    <Tag
                      color={
                        columns.find((col) => col.id === task.status)?.color ||
                        "default"
                      }
                    >
                      {columns.find((col) => col.id === task.status)?.title ||
                        "No status"}
                    </Tag>
                  </div>
                ))}
            </div>
          </Card>
        )}
      </div>

      <ViewTaskModal
        viewTask={viewTask}
        onClose={() => {
          setViewTask(null);
          setIsEditingDescription(false);
          setIsEditingTitle(false);
        }}
        t={t}
        columns={columns}
        members={members}
        currentUser={currentUser}
        teamMemberIds={teamMemberIds}
        isEditingTitle={isEditingTitle}
        setIsEditingTitle={setIsEditingTitle}
        editTitleContent={editTitleContent}
        setEditTitleContent={setEditTitleContent}
        handleSaveTitle={handleSaveTitle}
        getTaskAssignees={getTaskAssignees}
        handleAddAssigneeToTask={handleAddAssigneeToTask}
        handleRemoveAssigneeFromTask={handleRemoveAssigneeFromTask}
        handleTaskDatesChange={handleTaskDatesChange}
        handleTaskStatusChange={handleTaskStatusChange}
        handleToggleUrgent={handleToggleUrgent}
        isEditingDescription={isEditingDescription}
        setIsEditingDescription={setIsEditingDescription}
        editDescriptionContent={editDescriptionContent}
        setEditDescriptionContent={setEditDescriptionContent}
        handleSaveDescription={handleSaveDescription}
        newComment={newComment}
        setNewComment={setNewComment}
        handleAddComment={handleAddComment}
        handleDeleteCurrentTask={handleDeleteCurrentTask}
      />
    </>
  );
}
