"use client";

import { useEffect, useState } from "react";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Checkbox,
  Dropdown,
  Modal,
  Popover,
  Select,
  Space,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import {
  ClockCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  LeftOutlined,
  MessageOutlined,
  MoreOutlined,
  PlusOutlined,
  RightOutlined,
  ThunderboltFilled,
} from "@ant-design/icons";
import "react-quill-new/dist/quill.snow.css";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/th";
import { createStep, deleteStep, updateStep } from "@/actions/step";
import { removeTeamMember } from "@/actions/project";
import {
  createTask,
  deleteTask,
  updateTaskAssignees,
  updateTaskDates,
  updateTaskDescription,
  updateTaskOrders,
  updateTaskStatus,
  updateTaskTitle,
  updateTaskUrgent,
} from "@/actions/task";
import { addComment } from "@/actions/comment";
import type {
  BoardColumn,
  BoardMember,
  BoardTask,
  KanbanBoardProps,
} from "@/types/kanban";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  formatTaskDueDate,
  isDoneColumnTitle,
  isProtectedColumnTitle,
  isTodoColumnTitle,
  toDateInputValue,
} from "@/utils/kanban";
import AddColumnModal from "@/components/project/AddColumnModal";
import AddTaskModal from "@/components/project/AddTaskModal";
import InviteMemberModal from "@/components/project/InviteMemberModal";
import RenameColumnModal from "@/components/project/RenameColumnModal";
import ViewTaskModal from "@/components/project/ViewTaskModal";

dayjs.extend(relativeTime);
const { Text } = Typography;

export default function KanbanBoard({
  initialProject,
  initialSteps,
  initialTasks,
  currentUserId,
}: KanbanBoardProps) {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const projectId = params.id as string;
  const { t } = useLanguage();
  const [messageApi, contextHolder] = message.useMessage();

  const members: BoardMember[] =
    initialProject?.team?.members?.map((m) => ({
      id: m.userId ?? m.id ?? "",
      name: m.user?.name || "Unknown User",
      role: m.role || "Member",
      avatar: m.user?.name?.[0] || "U",
      avatarUrl: m.user?.avatar || "",
      email: m.user?.email || "",
      empNo: m.user?.empNo || "",
    })) || [];

  const currentUser: BoardMember = members.find(
    (member) => member.id === currentUserId,
  ) || {
    id: currentUserId,
    name: "Current User",
    role: "Member",
    avatar: "U",
    avatarUrl: "",
  };
  const isCurrentUserAdmin = currentUser.role === "ADMIN";

  const teamMemberIds = members.map((member) => member.id).filter(Boolean);

  // Initialize with DB actual items directly
  const [columns, setColumns] = useState<BoardColumn[]>(initialSteps);
  const [tasks, setTasks] = useState<BoardTask[]>(initialTasks);
  const [draggedTask, setDraggedTask] = useState<{
    id: string;
    fromStatus: string;
  } | null>(null);
  const [dropPreview, setDropPreview] = useState<{
    status: string;
    index: number;
  } | null>(null);

  // Modal State (Column)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newColTitle, setNewColTitle] = useState("");
  const [newColColor, setNewColColor] = useState("#3b82f6");
  const [insertAfterId, setInsertAfterId] = useState("todo");

  // Modal State (Task)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskType, setNewTaskType] = useState("General");
  const [newTaskAssigneeIds, setNewTaskAssigneeIds] = useState<string[]>(
    currentUserId ? [currentUserId] : members[0] ? [members[0].id] : [],
  );
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskIsUrgent, setNewTaskIsUrgent] = useState(false);
  const [newTaskStartDate, setNewTaskStartDate] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [newTaskStepId, setNewTaskStepId] = useState("");

  // Modal State (Invite Member)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  // Modal State (View Task)
  const [viewTask, setViewTask] = useState<BoardTask | null>(null);
  const [newComment, setNewComment] = useState("");
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editDescriptionContent, setEditDescriptionContent] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleContent, setEditTitleContent] = useState("");

  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [renamingCol, setRenamingCol] = useState<{
    id: string;
    title: string;
    color: string;
  } | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renameColor, setRenameColor] = useState("#3b82f6");

  const [showOnlyMyTasks, setShowOnlyMyTasks] = useState(false);

  const [filteredMembers, setFilteredMembers] = useState<string[]>(["all"]);

  useEffect(() => {
    const syncTimer = window.setTimeout(() => {
      setColumns(initialSteps);
      setTasks(initialTasks);
    }, 0);

    return () => {
      window.clearTimeout(syncTimer);
    };
  }, [initialSteps, initialTasks]);

  useEffect(() => {
    if (!viewTask) return;
    const synced = initialTasks.find((t) => t.id === viewTask.id);
    if (!synced) return;
    setViewTask((prev) => {
      if (!prev) return prev;
      if (
        prev.comments === synced.comments &&
        prev.commentList?.length === synced.commentList?.length &&
        prev.status === synced.status &&
        prev.assignees?.length === synced.assignees?.length
      ) {
        return prev;
      }
      return { ...synced };
    });
  }, [initialTasks]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      router.refresh();
    }, 12000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        router.refresh();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [router]);

  useEffect(() => {
    if (columns.length <= 1) return;

    const todoIndex = columns.findIndex((col) => isTodoColumnTitle(col.title));
    if (todoIndex <= 0) return;

    const reorderedColumns = [
      columns[todoIndex],
      ...columns.slice(0, todoIndex),
      ...columns.slice(todoIndex + 1),
    ];

    setColumns(reorderedColumns);

    void Promise.all(
      reorderedColumns.map((col, order) =>
        updateStep(col.id, col.title, col.color, order, currentUserId),
      ),
    );
  }, [columns]);

  const handleSaveDescription = async () => {
    if (!viewTask) return;
    const updatedTask = { ...viewTask, description: editDescriptionContent };

    setTasks(tasks.map((t) => (t.id === viewTask.id ? updatedTask : t)));
    setViewTask(updatedTask);
    setIsEditingDescription(false);

    await updateTaskDescription(viewTask.id, editDescriptionContent, projectId);
  };

  const handleSaveTitle = async () => {
    if (!viewTask || !editTitleContent.trim()) return;
    const updatedTask = { ...viewTask, title: editTitleContent.trim() };

    setTasks(tasks.map((t) => (t.id === viewTask.id ? updatedTask : t)));
    setViewTask(updatedTask);
    setIsEditingTitle(false);

    await updateTaskTitle(viewTask.id, editTitleContent.trim(), projectId);
  };

  const handleTaskDatesChange = async (
    startDate: string | null,
    dueDate: string | null,
  ) => {
    if (!viewTask) return;
    if ((!startDate && dueDate) || (startDate && !dueDate)) return;

    if (startDate && dueDate && startDate > dueDate) {
      messageApi.warning("Start date cannot be later than due date");
      return;
    }

    const updatedTask = {
      ...viewTask,
      startDate: toDateInputValue(startDate),
      dueDate: toDateInputValue(dueDate),
    };
    setViewTask(updatedTask);
    setTasks((prev) =>
      prev.map((t) =>
        t.id === viewTask.id
          ? {
              ...t,
              startDate: toDateInputValue(startDate),
              dueDate: toDateInputValue(dueDate),
            }
          : t,
      ),
    );

    const res = await updateTaskDates(
      viewTask.id,
      startDate,
      dueDate,
      projectId,
    );
    if (!res.success) {
      messageApi.error(res.error || "Failed to update task dates");
      router.refresh();
    }
  };

  const handleViewTaskStatusChange = async (statusId: string) => {
    if (!viewTask || viewTask.status === statusId) return;

    const sourceStatus = viewTask.status;
    const destinationCount = tasks.filter(
      (task) => task.status === statusId,
    ).length;

    const nextTasks = tasks
      .map((task) =>
        task.id === viewTask.id
          ? { ...task, status: statusId, order: destinationCount }
          : { ...task },
      )
      .map((task) => ({ ...task }));

    nextTasks
      .filter((task) => task.status === sourceStatus)
      .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0))
      .forEach((task, index) => {
        task.order = index;
      });

    nextTasks
      .filter((task) => task.status === statusId)
      .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0))
      .forEach((task, index) => {
        task.order = index;
      });

    const updatedTask = nextTasks.find((task) => task.id === viewTask.id);
    if (updatedTask) {
      setViewTask(updatedTask);
    }
    setTasks(nextTasks);

    const statusRes = await updateTaskStatus(
      viewTask.id,
      statusId,
      projectId,
      currentUserId,
    );
    if (!statusRes.success) {
      messageApi.error("Failed to move task");
      router.refresh();
      return;
    }

    const orderUpdates = nextTasks
      .filter(
        (task) => task.status === sourceStatus || task.status === statusId,
      )
      .sort((a, b) => {
        if (a.status === b.status) {
          return (Number(a.order) || 0) - (Number(b.order) || 0);
        }
        return a.status.localeCompare(b.status);
      })
      .map((task) => ({ taskId: task.id, order: Number(task.order) || 0 }));

    void updateTaskOrders(projectId, orderUpdates);
  };

  const handleToggleViewTaskUrgent = async () => {
    if (!viewTask) return;
    const newUrgentStatus = !viewTask.isUrgent;
    const updated = {
      ...viewTask,
      isUrgent: newUrgentStatus,
    };

    setViewTask(updated);
    setTasks((prev) =>
      prev.map((task) =>
        task.id === viewTask.id ? { ...task, isUrgent: newUrgentStatus } : task,
      ),
    );

    await updateTaskUrgent(viewTask.id, newUrgentStatus, projectId);
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !viewTask) return;
    if (!currentUserId) {
      messageApi.warning(t.kanban.pleaseLogin);
      return;
    }

    const res = await addComment(
      viewTask.id,
      newComment,
      currentUserId,
      projectId,
    );

    if (res.success && res.comment) {
      const newCommentObj = {
        id: res.comment.id,
        text: res.comment.content,
        authorName: res.comment.user?.name || "Unknown User",
        author: res.comment.user?.name?.[0] || "U",
        avatarUrl: res.comment.user?.avatar || "",
        timestamp: dayjs(res.comment.createdAt).locale("th").fromNow(),
      };

      const updatedTask = {
        ...viewTask,
        comments: (viewTask.comments || 0) + 1,
        commentList: [...(viewTask.commentList || []), newCommentObj],
      };

      setTasks(tasks.map((t) => (t.id === viewTask.id ? updatedTask : t)));
      setViewTask(updatedTask);
    }
    setNewComment("");
  };

  const handleAddTaskSubmit = async () => {
    if (!newTaskTitle.trim()) return;
    if (newTaskAssigneeIds.length === 0) {
      messageApi.warning(t.kanban.minOneAssignee);
      return;
    }
    if (!currentUserId) {
      messageApi.warning(t.kanban.pleaseLogin);
      return;
    }

    const defaultStepId =
      newTaskStepId || (columns.length > 0 ? columns[0].id : "todo");

    const res = await createTask({
      title: newTaskTitle,
      type: newTaskType,
      content: newTaskDescription,
      projectId,
      stepId: defaultStepId,
      assigneeIds: newTaskAssigneeIds,
      creatorId: currentUserId,
      order: tasks.filter((task) => task.status === defaultStepId).length,
      isUrgent: newTaskIsUrgent,
      startDate: newTaskStartDate || null,
      dueDate: newTaskDueDate || null,
    });

    if (res.success && res.task) {
      const createdTask = res.task as typeof res.task & {
        startDate?: Date | null;
        dueDate?: Date | null;
      };

      const newTask: BoardTask = {
        ...createdTask,
        status: createdTask.stepId,
        assignees: (createdTask.assignees || []).map((a) => ({
          id: a.userId,
          name: a.user?.name || "Unknown User",
          avatar: a.user?.name?.[0] || "U",
          avatarUrl: a.user?.avatar || "",
        })),
        description: createdTask.content ?? undefined,
        comments: 0,
        commentList: [],
        isUrgent: createdTask.isUrgent,
        startDate: createdTask.startDate
          ? createdTask.startDate.toISOString()
          : null,
        dueDate: createdTask.dueDate ? createdTask.dueDate.toISOString() : null,
      };
      setTasks([...tasks, newTask]);
    }

    setIsTaskModalOpen(false);
    setNewTaskTitle("");
    setNewTaskType("General");
    setNewTaskAssigneeIds(
      currentUserId ? [currentUserId] : members[0] ? [members[0].id] : [],
    );
    setNewTaskDescription("");
    setNewTaskIsUrgent(false);
    setNewTaskStartDate("");
    setNewTaskDueDate("");
    setNewTaskStepId("");
  };

  const handleOpenAddTaskModal = (stepId?: string) => {
    setNewTaskStepId(stepId || (columns.length > 0 ? columns[0].id : "todo"));
    setNewTaskIsUrgent(false);
    setIsTaskModalOpen(true);
  };

  const handleAddColumnSubmit = async () => {
    if (!newColTitle.trim()) return;

    setIsAddModalOpen(false);

    const insertIndex = columns.findIndex((c) => c.id === insertAfterId);

    const targetIndex =
      insertIndex !== -1 ? insertIndex + 1 : Math.max(0, columns.length - 1);

    const res = await createStep(
      projectId,
      newColTitle,
      newColColor,
      targetIndex,
    );

    if (res.success && res.step) {
      const newColumns = [...columns];
      newColumns.splice(targetIndex, 0, res.step);

      setColumns(newColumns);

      const updatePromises = [];
      for (let i = targetIndex + 1; i < newColumns.length; i++) {
        const col = newColumns[i];
        updatePromises.push(
          updateStep(col.id, col.title, col.color, i, currentUserId),
        );
      }

      if (updatePromises.length > 0) {
        await Promise.all(updatePromises);
      }
    }

    setNewColTitle("");
    setNewColColor("#3b82f6");
  };

  const handleMoveColumn = async (
    index: number,
    direction: "left" | "right",
  ) => {
    if (index === 0 || index === columns.length - 1) return;

    const newIndex = direction === "left" ? index - 1 : index + 1;

    if (newIndex === 0 || newIndex === columns.length - 1) return;
    if (newIndex === 0 || newIndex === columns.length - 1) return;

    const newColumns = [...columns];
    const temp = newColumns[index];
    newColumns[index] = newColumns[newIndex];
    newColumns[newIndex] = temp;

    setColumns(newColumns);
    const col1 = newColumns[index];
    const col2 = newColumns[newIndex];

    await Promise.all([
      updateStep(col1.id, col1.title, col1.color, index, currentUserId),
      updateStep(col2.id, col2.title, col2.color, newIndex, currentUserId),
    ]);
  };

  const handleDeleteColumn = async (id: string) => {
    const hasTasks = tasks.some((t) => t.status === id);
    if (hasTasks) {
      messageApi.warning(t.kanban.cannotDeleteColumn);
      return;
    }

    const res = await deleteStep(id);
    if (!res.success) {
      messageApi.error(res.error || t.kanban.cannotDeleteColumn);
      return;
    }

    if (res.steps) {
      setColumns(res.steps);
      return;
    }

    setColumns((prev) => prev.filter((col) => col.id !== id));
  };

  const handleDeleteCurrentTask = () => {
    if (!viewTask) return;
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
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
        setViewTask((prev) => (prev?.id === taskId ? null : prev));
        setIsEditingDescription(false);
        setIsEditingTitle(false);
      },
    });
  };

  const handleRenameColumn = async () => {
    if (!renamingCol || !renameValue.trim()) return;
    if (isProtectedColumnTitle(renamingCol.title)) return;
    const col = columns.find((c) => c.id === renamingCol.id);
    if (!col) return;
    const nextTitle = renameValue.trim();
    const updatedCol = { ...col, title: nextTitle, color: renameColor };
    setColumns(columns.map((c) => (c.id === col.id ? updatedCol : c)));
    setRenamingCol(null);
    await updateStep(
      col.id,
      nextTitle,
      renameColor,
      columns.indexOf(col),
      currentUserId,
    );
  };

  const handleDragStart = (
    e: React.DragEvent,
    id: string,
    currentStatus: string,
    currentIndex: number,
  ) => {
    setDraggedTask({ id, fromStatus: currentStatus });
    setDropPreview({ status: currentStatus, index: currentIndex });
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (
    e: React.DragEvent,
    status: string,
    fallbackIndex: number,
  ) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    const container = e.currentTarget as HTMLDivElement;
    const cards = Array.from(
      container.querySelectorAll<HTMLDivElement>("[data-task-card='true']"),
    );

    let index = fallbackIndex;
    for (let i = 0; i < cards.length; i++) {
      const rect = cards[i].getBoundingClientRect();
      const middleY = rect.top + rect.height / 2;
      if (e.clientY < middleY) {
        index = i;
        break;
      }
      index = i + 1;
    }

    setDropPreview((prev) => {
      if (prev && prev.status === status && prev.index === index) return prev;
      return { status, index };
    });
  };

  const handleDrop = async (e: React.DragEvent, status: string) => {
    e.preventDefault();
    if (!draggedTask) return;

    const movingTask = tasks.find((task) => task.id === draggedTask.id);
    if (!movingTask) return;

    const sourceStatus = draggedTask.fromStatus;
    const targetStatus = status;

    const sourceTasks = tasks
      .filter(
        (task) => task.status === sourceStatus && task.id !== movingTask.id,
      )
      .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));

    const destinationBase =
      sourceStatus === targetStatus
        ? sourceTasks
        : tasks
            .filter((task) => task.status === targetStatus)
            .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));

    const targetIndex = Math.max(
      0,
      Math.min(
        dropPreview?.status === targetStatus
          ? dropPreview.index
          : destinationBase.length,
        destinationBase.length,
      ),
    );

    const destinationTasks = [...destinationBase];
    destinationTasks.splice(targetIndex, 0, {
      ...movingTask,
      status: targetStatus,
    });

    destinationTasks.forEach((task, index) => {
      task.order = index;
    });

    if (sourceStatus !== targetStatus) {
      sourceTasks.forEach((task, index) => {
        task.order = index;
      });
    }

    const nextTasks = tasks
      .filter(
        (task) => task.status !== sourceStatus && task.status !== targetStatus,
      )
      .concat(sourceStatus === targetStatus ? [] : sourceTasks)
      .concat(destinationTasks)
      .map((task) => ({ ...task }));

    setTasks(nextTasks);

    const affectedStatuses = new Set([sourceStatus, targetStatus]);
    const orderUpdates = nextTasks
      .filter((task) => affectedStatuses.has(task.status))
      .sort((a, b) => {
        if (a.status === b.status) {
          return (Number(a.order) || 0) - (Number(b.order) || 0);
        }
        return a.status.localeCompare(b.status);
      })
      .map((task) => ({ taskId: task.id, order: Number(task.order) || 0 }));

    if (sourceStatus !== targetStatus) {
      const statusRes = await updateTaskStatus(
        movingTask.id,
        targetStatus,
        projectId,
        currentUserId,
      );
      if (!statusRes.success) {
        messageApi.error("Failed to move task");
        router.refresh();
      }
    }

    const orderRes = await updateTaskOrders(projectId, orderUpdates);
    if (!orderRes.success) {
      messageApi.error(orderRes.error || "Failed to reorder tasks");
      router.refresh();
    }

    setDraggedTask(null);
    setDropPreview(null);
  };

  const handleRemoveMember = async (member: BoardMember) => {
    if (!isCurrentUserAdmin) return;
    if (!member.id || member.id === currentUserId) {
      messageApi.warning(t.kanban.cannotRemoveSelf);
      return;
    }

    const confirmMessage = t.kanban.removeMemberConfirm.replace(
      "{name}",
      member.name,
    );
    Modal.confirm({
      title: t.kanban.removeMember,
      content: confirmMessage,
      okText: t.kanban.removeMember,
      cancelText: t.common.cancel,
      okButtonProps: { danger: true },
      async onOk() {
        setRemovingMemberId(member.id);
        const res = await removeTeamMember(projectId, member.id);
        setRemovingMemberId(null);

        if (!res.success) {
          if (
            res.error === "You cannot remove yourself." ||
            res.error === "Cannot remove the last admin from the team."
          ) {
            messageApi.error(
              res.error === "You cannot remove yourself."
                ? t.kanban.cannotRemoveSelf
                : t.kanban.cannotRemoveLastAdmin,
            );
          } else {
            messageApi.error(res.error || t.kanban.removeMemberFailed);
          }
          return;
        }

        messageApi.success(t.kanban.removeMemberSuccess);
        router.refresh();
      },
    });
  };

  const getTaskAssignees = (task: BoardTask) => task.assignees || [];

  const applyTaskAssigneesToState = (
    taskId: string,
    assignees: BoardTask["assignees"],
  ) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, assignees } : task)),
    );
    setViewTask((prev) =>
      prev && prev.id === taskId ? { ...prev, assignees } : prev,
    );
  };

  const handleAddAssigneeToTask = async (taskId: string, userId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    if (!teamMemberIds.includes(userId)) {
      messageApi.warning(t.kanban.assigneeTeamOnly);
      return;
    }

    const current = getTaskAssignees(task);
    if (current.some((a) => a.id === userId)) return;

    const nextIds = [...current.map((a) => a.id), userId];
    const res = await updateTaskAssignees(
      taskId,
      nextIds,
      projectId,
      currentUserId,
    );
    if (!res.success) {
      messageApi.error(res.error || t.kanban.addAssigneeFailed);
      return;
    }

    const nextAssignees = (res.task?.assignees || []).map((a) => ({
      id: a.userId,
      name: a.user?.name || "Unknown User",
      avatar: a.user?.name?.[0] || "U",
      avatarUrl: a.user?.avatar || "",
    }));
    applyTaskAssigneesToState(taskId, nextAssignees);
  };

  const handleRemoveAssigneeFromTask = async (
    taskId: string,
    userId: string,
  ) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const current = getTaskAssignees(task);
    if (current.length <= 1) {
      messageApi.warning(t.kanban.minOneAssignee);
      return;
    }

    const nextIds = current.map((a) => a.id).filter((id) => id !== userId);
    const res = await updateTaskAssignees(
      taskId,
      nextIds,
      projectId,
      currentUserId,
    );
    if (!res.success) {
      messageApi.error(res.error || t.kanban.removeAssigneeFailed);
      return;
    }

    const nextAssignees = (res.task?.assignees || []).map((a) => ({
      id: a.userId,
      name: a.user?.name || "Unknown User",
      avatar: a.user?.name?.[0] || "U",
      avatarUrl: a.user?.avatar || "",
    }));
    applyTaskAssigneesToState(taskId, nextAssignees);
  };

  const renderMemberPopoverContent = (member: BoardMember) => (
    <div className="w-56" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center gap-3 mb-3">
        <Avatar src={member.avatarUrl || undefined} size={48}>
          {member.avatar}
        </Avatar>
        <div className="min-w-0">
          <Typography.Text strong className="block truncate">
            {member.name}
          </Typography.Text>
          <Typography.Text type="secondary" className="text-xs">
            {member.role}
          </Typography.Text>
        </div>
      </div>
      <div className="space-y-1 text-xs text-gray-600">
        {member.email && (
          <Typography.Text type="secondary" className="block truncate">
            {member.email}
          </Typography.Text>
        )}
        {member.empNo && (
          <Typography.Text type="secondary" className="block">
            #{member.empNo}
          </Typography.Text>
        )}
      </div>
      {isCurrentUserAdmin && member.id !== currentUserId && (
        <Button
          danger
          block
          size="small"
          className="mt-3"
          loading={removingMemberId === member.id}
          onClick={() => void handleRemoveMember(member)}
        >
          {removingMemberId === member.id
            ? t.kanban.removingMember
            : t.kanban.removeMember}
        </Button>
      )}
    </div>
  );

  const renderAllMembersPopoverContent = () => (
    <div
      className="w-72 max-h-96 overflow-y-auto"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mb-2">
        <Typography.Text strong>
          {t.kanban.allMembers} ({members.length} {t.kanban.people})
        </Typography.Text>
      </div>
      <div className="space-y-2">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center gap-2 rounded-md px-1.5 py-1.5 hover:bg-gray-50"
          >
            <Avatar src={member.avatarUrl || undefined} size={34}>
              {member.avatar}
            </Avatar>
            <div className="min-w-0 flex-1">
              <Typography.Text strong className="block text-sm truncate">
                {member.name}
              </Typography.Text>
              <Typography.Text
                type="secondary"
                className="text-xs truncate block"
              >
                {member.role}
                {member.empNo ? ` · #${member.empNo}` : ""}
              </Typography.Text>
              <Typography.Text>
                {member.email && (
                  <span className="text-xs text-gray-500 truncate block">
                    {member.email}
                  </span>
                )}
              </Typography.Text>
            </div>
            {isCurrentUserAdmin && member.id !== currentUserId && (
              <Button
                danger
                size="small"
                loading={removingMemberId === member.id}
                onClick={() => void handleRemoveMember(member)}
              >
                {t.kanban.removeMember}
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  useEffect(() => {
    const taskId = searchParams.get("task");

    if (taskId) {
      const task = tasks.find((t) => t.id === taskId);
      if (task) {
        setViewTask(task);

        const params = new URLSearchParams(searchParams.toString());
        params.delete("task");

        const queryString = params.toString();
        const newUrl = queryString ? `${pathname}?${queryString}` : pathname;

        router.replace(newUrl, { scroll: false });
      }
    }
  }, [searchParams, pathname, router, tasks]);

  return (
    <>
      {contextHolder}
      <div className="h-full flex flex-col space-y-6">
        {/* Project Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-0">
              <Typography.Title
                level={2}
                className="mb-0! text-nowrap overflow-hidden text-ellipsis max-w-[calc(100vw-1025px)]"
              >
                {initialProject.name}
              </Typography.Title>
              <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                {initialProject.status}
              </span>
              <Button
                color="pink"
                variant="solid"
                onClick={() => router.push(`/projects/${projectId}/timeline`)}
              >
                <ClockCircleOutlined className="mr-1" />
                {t.kanban.viewTimeline}
              </Button>
            </div>
            <p className="text-sm text-gray-500">
              {initialProject.description}
            </p>
          </div>

          {/* Members & Actions (Less prominent than tabs) */}
          <div className="flex items-center gap-2 -mt-3">
            <div className="flex items-center">
              <div
                onClick={(e) => e.stopPropagation()}
                className="mr-2 flex items-center cursor-pointer select-none border border-gray-300 rounded-md px-2 py-1 hover:bg-gray-50 transition-colors"
              >
                <Checkbox
                  checked={showOnlyMyTasks}
                  onChange={(e) => setShowOnlyMyTasks(e.target.checked)}
                >
                  <Typography.Text className="text-sm!" type="secondary">
                    {t.kanban.myTasks}
                    {showOnlyMyTasks && (
                      <span className="ml-1 text-xs text-gray-400">
                        (
                        {
                          tasks.filter((t) =>
                            t.assignees?.some((a) => a.id === currentUserId),
                          ).length
                        }
                        )
                      </span>
                    )}
                  </Typography.Text>
                </Checkbox>
              </div>
              <Select
                placeholder={t.kanban.filterByMember}
                className="w-auto min-w-40 max-w-44 mr-1!"
                value={filteredMembers}
                onChange={(value) => {
                  let selected = Array.isArray(value) ? value : [value];
                  if (selected.length === 0) selected = ["all"];
                  if (selected.includes("all") && selected.length > 1) {
                    selected =
                      selected[selected.length - 1] === "all"
                        ? ["all"]
                        : selected.filter((v) => v !== "all");
                  }
                  setFilteredMembers(selected);
                }}
                options={[
                  {
                    value: "all",
                    label: <Space>{t.timeline.allAssignees}</Space>,
                  },
                  ...members.map((member) => ({
                    value: member.id,
                    label: (
                      <Space>
                        <Avatar src={member.avatarUrl || undefined} size={20}>
                          {member.avatar}
                        </Avatar>
                        {member.name}
                      </Space>
                    ),
                  })),
                ]}
                mode="multiple"
                allowClear
              />
              {filteredMembers.length > 0 &&
                !filteredMembers.includes("all") && (
                  <Typography.Text className="text-sm! mr-1" type="secondary">
                    (
                    {
                      tasks.filter((t) =>
                        t.assignees?.some((a) =>
                          filteredMembers.includes(a.id),
                        ),
                      ).length
                    }
                    )
                  </Typography.Text>
                )}
              <div className="flex -space-x-2 mr-3 relative">
                {members.slice(0, 3).map((member) => (
                  <div key={member.id} className="relative">
                    <Popover
                      trigger="click"
                      placement="bottomLeft"
                      content={renderMemberPopoverContent(member)}
                    >
                      <button
                        type="button"
                        onClick={(e) => e.stopPropagation()}
                        className="w-8 h-8 cursor-pointer hover:-translate-y-1 transition-transform overflow-hidden flex items-center justify-center text-blue-700 text-xs font-bold focus:outline-none"
                        title={member.name}
                      >
                        <Avatar
                          src={member.avatarUrl || undefined}
                          size={32}
                          className="w-full h-full object-cover border-2 border-white rounded-full shadow-sm"
                        >
                          {member.avatar}
                        </Avatar>
                      </button>
                    </Popover>
                  </div>
                ))}
                {members.length > 3 && (
                  <div className="relative">
                    <Popover
                      trigger="click"
                      placement="bottomRight"
                      content={renderAllMembersPopoverContent()}
                    >
                      <Button
                        size="small"
                        className="w-8! h-8! rounded-full! border-2 border-white shadow-sm bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600 cursor-pointer transition-colors focus:outline-none"
                      >
                        +{members.length - 3}
                      </Button>
                    </Popover>
                  </div>
                )}
              </div>
              <Button
                onClick={() => setIsInviteModalOpen(true)}
                title={t.kanban.addMember}
                shape="circle"
                size="small"
                className="w-8! h-8! rounded-full border border-dashed! border-gray-300 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-400 transition-colors bg-white shadow-sm"
                icon={<PlusOutlined className="w-3 h-3" />}
              />
            </div>
            <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>
            <Button
              onClick={() => setIsAddModalOpen(true)}
              title={t.projects.addStep}
              className="flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
              icon={<PlusOutlined className="w-3 h-3" />}
            >
              {t.projects.addStep}
            </Button>
            <Button
              onClick={() => handleOpenAddTaskModal()}
              title={t.projects.createTask}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
              icon={<PlusOutlined className="w-3 h-3" />}
              type="primary"
            >
              {t.projects.createTask}
            </Button>
          </div>
        </div>

        {/* Kanban Board */}
        <div
          className="flex-1 flex gap-6 overflow-x-auto pb-4 items-start thin-scrollbar"
          style={{ minHeight: "calc(100vh - 200px)" }}
        >
          {columns.map((col, index) => {
            const canEditColumn = !isProtectedColumnTitle(col.title);
            let columnTasks = tasks
              .filter((t) => t.status === col.id)
              .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));

            if (showOnlyMyTasks) {
              columnTasks = columnTasks.filter((task) =>
                task.assignees?.some((a) => a.id === currentUserId),
              );
            }

            return (
              <div
                key={col.id}
                className="shrink-0 w-80 rounded-xl flex flex-col transition-all"
                style={{
                  backgroundColor: `${col.color.slice(0, 7)}10`, // 10% opacity
                  border: `1px solid ${col.color.slice(0, 7)}30`,
                  padding: "16px",
                  minHeight: "100%",
                  maxHeight: "76vh",
                }}
                onDragOver={(e) =>
                  handleDragOver(e, col.id, columnTasks.length)
                }
                onDrop={(e) => handleDrop(e, col.id)}
                onDragLeave={(e) => {
                  const nextTarget = e.relatedTarget as Node | null;
                  if (!nextTarget || !e.currentTarget.contains(nextTarget)) {
                    setDropPreview((prev) =>
                      prev?.status === col.id ? null : prev,
                    );
                  }
                }}
              >
                {/* Column Header */}
                <div className="flex justify-between items-center mb-4">
                  <Space size="middle">
                    <Badge color={col.color} />
                    <Text strong style={{ color: "#434343" }}>
                      {col.title}
                    </Text>
                    <Badge
                      count={columnTasks.length}
                      style={{
                        backgroundColor: "#fff",
                        color: "#999",
                        boxShadow: "0 0 0 1px #d9d9d9 inset",
                      }}
                    />
                  </Space>

                  <Space size={4}>
                    {/* Move Buttons */}
                    {index > 1 && index < columns.length - 1 && (
                      <Button
                        size="small"
                        type="text"
                        icon={<LeftOutlined />}
                        onClick={() => handleMoveColumn(index, "left")}
                      />
                    )}
                    {index > 0 && index < columns.length - 2 && (
                      <Button
                        size="small"
                        type="text"
                        icon={<RightOutlined />}
                        onClick={() => handleMoveColumn(index, "right")}
                      />
                    )}

                    {/* Settings Dropdown */}
                    {canEditColumn && (
                      <Dropdown
                        trigger={["click"]}
                        menu={{
                          items: [
                            {
                              key: "rename",
                              icon: <EditOutlined />,
                              label: t.projects.renameColumn,
                            },
                            { type: "divider" },
                            {
                              key: "delete",
                              icon: <DeleteOutlined />,
                              label: t.projects.deleteColumn,
                              danger: true,
                            },
                          ],
                          onClick: ({ key }) => {
                            if (key === "rename") {
                              setRenamingCol(col);
                              setRenameValue(col.title);
                              setRenameColor(col.color);
                            } else if (key === "delete") {
                              handleDeleteColumn(col.id);
                            }
                          },
                        }}
                      >
                        <Button
                          size="small"
                          type="text"
                          icon={<MoreOutlined />}
                        />
                      </Dropdown>
                    )}
                  </Space>
                </div>

                {/* Tasks Area */}
                <div
                  className="flex flex-col flex-1 overflow-y-auto thin-scrollbar gap-3"
                  style={{ minHeight: "150px" }}
                >
                  {/* Add Task / Drop Target */}
                  {col.title !== "Done" && (
                    <div
                      className="rounded-lg border-2 text-gray-500 border-dashed border-gray-300 bg-transparent cursor-pointer flex items-center justify-center hover:border-blue-400 transition-colors hover:text-blue-600"
                      style={{
                        minHeight: "80px",
                        borderRadius: "8px",
                      }}
                      onClick={() => handleOpenAddTaskModal(col.id)}
                    >
                      <PlusOutlined className="w-4 h-4" />
                      <span className="ml-1 text-sm">
                        {t.projects.createTask}
                      </span>
                    </div>
                  )}
                  {columnTasks.map((task, taskIndex) => {
                    const assignees = getTaskAssignees(task);
                    const isDone = isDoneColumnTitle(col.title);

                    // Logic คำนวณวันคงเหลือ (ย้ายมาอยู่นอก JSX เพื่อความสะอาด)
                    const dueIso = toDateInputValue(task.dueDate);
                    const daysUntilDue = dueIso
                      ? Math.ceil(
                          (new Date(dueIso).getTime() -
                            new Date().setHours(0, 0, 0, 0)) /
                            86400000,
                        )
                      : null;
                    const shouldHighlightDue =
                      daysUntilDue !== null && daysUntilDue <= 3 && !isDone;

                    if (
                      filteredMembers.length > 0 &&
                      filteredMembers[0] !== "all"
                    ) {
                      const assignedIds = assignees.map((a) => a.id);
                      if (
                        !filteredMembers.some((id) => assignedIds.includes(id))
                      ) {
                        return null;
                      }
                    }

                    return (
                      <div
                        key={task.id}
                        data-task-card="true"
                        draggable
                        onDragStart={(e) => {
                          handleDragStart(e, task.id, col.id, taskIndex);
                        }}
                        onDragEnd={() => {
                          setDraggedTask(null);
                          setDropPreview(null);
                        }}
                        onClick={() => setViewTask(task)}
                        className="select-none"
                        style={{ cursor: "grab" }}
                      >
                        {dropPreview?.status === col.id &&
                          dropPreview.index === taskIndex &&
                          draggedTask?.id !== task.id && (
                            <div
                              className="rounded-lg border-2 border-dashed border-blue-400 bg-blue-50/60 mb-2"
                              style={{ height: "76px" }}
                            />
                          )}

                        <Card
                          size="small"
                          className={`cursor-grab active:cursor-grabbing transition-all shadow-sm
                          hover:shadow-lg ${isDone ? "bg-gray-50" : "bg-white"}
                          ${task.isUrgent ? "border-red-400" : ""}
                          ${draggedTask?.id === task.id ? "opacity-45" : ""}`}
                          style={{
                            borderRadius: "10px",
                            backgroundColor: task.isUrgent ? "#fff1f0" : "#fff",
                          }}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <Space.Compact
                              size="small"
                              className="shadow-sm rounded-md"
                            >
                              {task.isUrgent && (
                                <ThunderboltFilled
                                  style={{ color: "#f5222d", fontSize: "16px" }}
                                />
                              )}
                              {/* ฝั่งซ้าย: แสดงประเภทงาน */}
                              <Tag className="mr-0! bg-gray-100! text-gray-600! text-[10px]! font-medium! rounded-l-md! rounded-r-none!">
                                {task.type}
                              </Tag>

                              {/* ฝั่งขวา: แสดงรหัสงาน (แสดงเมื่อมีข้อมูล) */}
                              {task.taskNo && (
                                <Tag
                                  style={{
                                    backgroundColor: `${col.color.slice(0, 7)}40`,
                                  }}
                                  className="mr-0! text-gray-600! text-[10px]! font-medium! rounded-r-md! rounded-l-none!"
                                >
                                  #{task.taskNo}
                                </Tag>
                              )}
                            </Space.Compact>

                            {task.dueDate && (
                              <Tag
                                color={shouldHighlightDue ? "error" : "warning"}
                                className={`shadow-sm ${shouldHighlightDue ? "animate-pulse" : ""}`}
                                style={{
                                  borderRadius: "10px",
                                  fontSize: "10px",
                                }}
                              >
                                {formatTaskDueDate(task.dueDate)}
                              </Tag>
                            )}
                          </div>

                          <Text
                            strong
                            style={{
                              display: "block",
                              marginBottom: "12px",
                              fontSize: "13px",
                            }}
                          >
                            {task.title}
                          </Text>

                          <div className="flex justify-between items-center">
                            <Space className="text-gray-400">
                              <MessageOutlined style={{ fontSize: "12px" }} />
                              <span className="text-xs">
                                {task.comments || 0}
                              </span>
                            </Space>

                            <div className="flex -space-x-2">
                              {assignees.map((a) => (
                                <Tooltip title={a.name} key={a.id}>
                                  {a.avatarUrl ? (
                                    <img
                                      src={a.avatarUrl}
                                      alt={a.name}
                                      className="w-5 h-5 rounded-full object-cover ring-1 ring-white shadow-sm"
                                      loading="lazy"
                                      decoding="async"
                                    />
                                  ) : (
                                    <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-semibold flex items-center justify-center ring-1 ring-white shadow-sm">
                                      {(a.avatar || "U")
                                        .slice(0, 1)
                                        .toUpperCase()}
                                    </div>
                                  )}
                                </Tooltip>
                              ))}
                            </div>
                          </div>
                        </Card>
                      </div>
                    );
                  })}

                  {dropPreview?.status === col.id &&
                    dropPreview.index === columnTasks.length && (
                      <div
                        className="rounded-lg border-2 border-dashed border-blue-400 bg-blue-50/60"
                        style={{ height: "76px" }}
                      />
                    )}
                </div>
              </div>
            );
          })}
        </div>

        <RenameColumnModal
          open={!!renamingCol}
          value={renameValue}
          color={renameColor}
          onChangeValue={setRenameValue}
          onChangeColor={setRenameColor}
          onCancel={() => setRenamingCol(null)}
          onSubmit={handleRenameColumn}
        />

        <InviteMemberModal
          open={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          teamId={initialProject.teamId}
          projectId={projectId}
        />

        {/* Add Column Modal Popup */}
        <AddColumnModal
          isOpen={isAddModalOpen}
          setIsAddModalOpen={setIsAddModalOpen}
          columns={columns}
          handleSubmit={handleAddColumnSubmit}
          newColTitle={newColTitle}
          setNewColTitle={setNewColTitle}
          newColColor={newColColor}
          setNewColColor={setNewColColor}
          insertAfterId={insertAfterId}
          setInsertAfterId={setInsertAfterId}
        />

        {/* Add Task Modal Popup */}
        <AddTaskModal
          isTaskModalOpen={isTaskModalOpen}
          setIsTaskModalOpen={setIsTaskModalOpen}
          newTaskTitle={newTaskTitle}
          setNewTaskTitle={setNewTaskTitle}
          newTaskDescription={newTaskDescription}
          setNewTaskDescription={setNewTaskDescription}
          newTaskType={newTaskType}
          setNewTaskType={setNewTaskType}
          newTaskAssigneeIds={newTaskAssigneeIds}
          setNewTaskAssigneeIds={setNewTaskAssigneeIds}
          newTaskStartDate={newTaskStartDate}
          setNewTaskStartDate={setNewTaskStartDate}
          newTaskDueDate={newTaskDueDate}
          setNewTaskDueDate={setNewTaskDueDate}
          newTaskIsUrgent={newTaskIsUrgent}
          setNewTaskIsUrgent={setNewTaskIsUrgent}
          handleAddTaskSubmit={handleAddTaskSubmit}
          members={members}
          teamMemberIds={teamMemberIds}
          setNewTaskStepId={setNewTaskStepId}
        />

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
          handleTaskStatusChange={handleViewTaskStatusChange}
          handleToggleUrgent={handleToggleViewTaskUrgent}
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
      </div>
    </>
  );
}
