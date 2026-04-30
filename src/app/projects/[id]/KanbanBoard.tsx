"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Image from "next/image";
import {
  MoreHorizontal,
  Plus,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  X,
  Pencil,
  Trash2,
} from "lucide-react";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

const COLOR_OPTIONS = [
  { id: "blue", label: "สีฟ้า", color: "#3b82f6" },
  { id: "purple", label: "สีม่วง", color: "#8b5cf6" },
  { id: "pink", label: "สีชมพู", color: "#ec4899" },
  { id: "orange", label: "สีส้ม", color: "#f97316" },
  { id: "yellow", label: "สีเหลือง", color: "#eab308" },
  { id: "teal", label: "สีเขียวอมฟ้า", color: "#14b8a6" },
];

import { createStep, updateStep } from "@/actions/step";
import {
  createTask,
  updateTaskStatus,
  updateTaskDescription,
  updateTaskAssignees,
} from "@/actions/task";
import { addComment } from "@/actions/comment";
import { createInvitation } from "@/actions/invitation";
import AssigneeCombobox from "./components/AssigneeCombobox";
import type {
  BoardColumn,
  BoardComment,
  BoardTask,
  BoardMember,
  KanbanBoardProps,
} from "@/types/kanban";
import { useLanguage } from "@/contexts/LanguageContext";

export default function KanbanBoard({
  initialProject,
  initialSteps,
  initialTasks,
  currentUserId,
}: KanbanBoardProps) {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const { t } = useLanguage();

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

  const teamMemberIds = members.map((member) => member.id).filter(Boolean);

  // Initialize with DB actual items directly
  const [columns, setColumns] = useState<BoardColumn[]>(initialSteps);
  const [tasks, setTasks] = useState<BoardTask[]>(initialTasks);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

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

  // Modal State (Invite Member)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteIdentifier, setInviteIdentifier] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");

  // Modal State (View Task)
  const [viewTask, setViewTask] = useState<BoardTask | null>(null);
  const [newComment, setNewComment] = useState("");
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editDescriptionContent, setEditDescriptionContent] = useState("");

  // Member popup
  const [memberPopupId, setMemberPopupId] = useState<string | null>(null);
  const [showAllMembersPopup, setShowAllMembersPopup] = useState(false);

  // Status dropdown in view task modal
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  // Column context menu
  const [openColMenuId, setOpenColMenuId] = useState<string | null>(null);
  const [renamingCol, setRenamingCol] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [renameValue, setRenameValue] = useState("");

  useEffect(() => {
    const syncTimer = window.setTimeout(() => {
      setColumns(initialSteps);
      setTasks(initialTasks);
    }, 0);

    return () => {
      window.clearTimeout(syncTimer);
    };
  }, [initialSteps, initialTasks]);

  // Close column dropdown when clicking outside
  useEffect(() => {
    if (!openColMenuId) return;
    const handler = () => setOpenColMenuId(null);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [openColMenuId]);

  // Close member popup when clicking outside
  useEffect(() => {
    if (!memberPopupId) return;
    const handler = () => setMemberPopupId(null);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [memberPopupId]);

  // Close all-members popup when clicking outside
  useEffect(() => {
    if (!showAllMembersPopup) return;
    const handler = () => setShowAllMembersPopup(false);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [showAllMembersPopup]);

  // Close status dropdown when clicking outside
  useEffect(() => {
    if (!statusDropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(e.target as Node)
      ) {
        setStatusDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [statusDropdownOpen]);

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

  const handleSaveDescription = async () => {
    if (!viewTask) return;
    const updatedTask = { ...viewTask, description: editDescriptionContent };

    // Optimistic UI updates
    setTasks(tasks.map((t) => (t.id === viewTask.id ? updatedTask : t)));
    setViewTask(updatedTask);
    setIsEditingDescription(false);

    // Save to DB
    await updateTaskDescription(viewTask.id, editDescriptionContent, projectId);
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !viewTask) return;
    if (!currentUserId) {
      alert(t.kanban.pleaseLogin);
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
        timestamp: new Date(res.comment.createdAt).toLocaleTimeString("th-TH", {
          hour: "2-digit",
          minute: "2-digit",
        }),
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
      alert(t.kanban.minOneAssignee);
      return;
    }
    if (!currentUserId) {
      alert(t.kanban.pleaseLogin);
      return;
    }

    // Use the first column as default step
    const defaultStepId = columns.length > 0 ? columns[0].id : "todo";

    // Server Action Create Task
    const res = await createTask({
      title: newTaskTitle,
      type: newTaskType,
      content: newTaskDescription,
      projectId,
      stepId: defaultStepId,
      assigneeIds: newTaskAssigneeIds,
      creatorId: currentUserId,
      order: tasks.length,
    });

    if (res.success && res.task) {
      const newTask: BoardTask = {
        ...res.task,
        status: res.task.stepId, // Map stepId to status for UI
        assignees: (res.task.assignees || []).map((a) => ({
          id: a.userId,
          name: a.user?.name || "Unknown User",
          avatar: a.user?.name?.[0] || "U",
          avatarUrl: a.user?.avatar || "",
        })),
        description: res.task.content ?? undefined,
        comments: 0,
        commentList: [],
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
  };

  const handleAddColumnSubmit = async () => {
    if (!newColTitle.trim()) return;

    setIsAddModalOpen(false);

    const insertIndex = columns.findIndex((c) => c.id === insertAfterId);

    // กำหนดตำแหน่งที่จะแทรก: อยู่หลังช่องที่เลือก หรือถ้าไม่เจอให้แทรกก่อนช่องสุดท้ายเสมอ
    // (มั่นใจได้ว่า Done/เสร็จสิ้น จะถูกผลักลงไปอยู่ด้านหลังสุด)
    const targetIndex =
      insertIndex !== -1 ? insertIndex + 1 : Math.max(0, columns.length - 1);

    // Call server action เพื่อสร้างคอลัมน์ใหม่
    const res = await createStep(
      projectId,
      newColTitle,
      newColColor,
      targetIndex,
    );

    if (res.success && res.step) {
      const newColumns = [...columns];
      newColumns.splice(targetIndex, 0, res.step);

      // อัปเดต State ให้ UI แสดงผลทันที
      setColumns(newColumns);

      // *** อัปเดตลำดับ order ของคอลัมน์ที่ถูกผลักไปด้านหลังทั้งหมดใน Database (รวมถึงอันสุดท้าย) ***
      const updatePromises = [];
      for (let i = targetIndex + 1; i < newColumns.length; i++) {
        const col = newColumns[i];
        updatePromises.push(updateStep(col.id, col.title, col.color, i));
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
    // ป้องกันการสลับ todo หรือ done
    if (index === 0 || index === columns.length - 1) return;

    const newIndex = direction === "left" ? index - 1 : index + 1;

    // ห้ามให้คอลัมน์อื่นไปสลับที่กับ todo (0) หรือ done (last item)
    if (newIndex === 0 || newIndex === columns.length - 1) return;

    const newColumns = [...columns];
    const temp = newColumns[index];
    newColumns[index] = newColumns[newIndex];
    newColumns[newIndex] = temp;

    // Update local state first for fast response

    setColumns(newColumns);
    // Update backend tracking their new index as order
    const col1 = newColumns[index];
    const col2 = newColumns[newIndex];

    await Promise.all([
      updateStep(col1.id, col1.title, col1.color, index),
      updateStep(col2.id, col2.title, col2.color, newIndex),
    ]);
  };

  const handleDeleteColumn = (id: string) => {
    const hasTasks = tasks.some((t) => t.status === id);
    if (hasTasks) {
      alert(t.kanban.cannotDeleteColumn);
      return;
    }
    setColumns(columns.filter((col) => col.id !== id));
  };

  const handleRenameColumn = async () => {
    if (!renamingCol || !renameValue.trim()) return;
    const col = columns.find((c) => c.id === renamingCol.id);
    if (!col) return;
    const updatedCol = { ...col, title: renameValue.trim() };
    setColumns(columns.map((c) => (c.id === col.id ? updatedCol : c)));
    setRenamingCol(null);
    await updateStep(
      col.id,
      renameValue.trim(),
      col.color,
      columns.indexOf(col),
    );
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedTaskId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, status: string) => {
    e.preventDefault();
    if (!draggedTaskId) return;

    // Optimistic update
    setTasks(
      tasks.map((task) =>
        task.id === draggedTaskId ? { ...task, status } : task,
      ),
    );

    // Server update
    await updateTaskStatus(draggedTaskId, status, projectId);

    setDraggedTaskId(null);
  };

  const handleInviteMember = async () => {
    const input = inviteIdentifier.trim();
    if (!input) return;

    setInviteError("");
    setInviteSuccess("");

    const res = await createInvitation(initialProject.teamId, projectId, input);
    if (!res.success) {
      setInviteError(res.error || t.kanban.inviteFailed);
      return;
    }

    setInviteSuccess(t.kanban.inviteSuccess);
    setInviteIdentifier("");
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
      alert(t.kanban.assigneeTeamOnly);
      return;
    }

    const current = getTaskAssignees(task);
    if (current.some((a) => a.id === userId)) return;

    const nextIds = [...current.map((a) => a.id), userId];
    const res = await updateTaskAssignees(taskId, nextIds, projectId);
    if (!res.success) {
      alert(res.error || t.kanban.addAssigneeFailed);
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
      alert(t.kanban.minOneAssignee);
      return;
    }

    const nextIds = current.map((a) => a.id).filter((id) => id !== userId);
    const res = await updateTaskAssignees(taskId, nextIds, projectId);
    if (!res.success) {
      alert(res.error || t.kanban.removeAssigneeFailed);
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

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Project Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900">
              {initialProject.name}
            </h1>
            <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
              {initialProject.status}
            </span>
          </div>
          <p className="text-sm text-gray-500">{initialProject.description}</p>
        </div>

        {/* Members & Actions (Less prominent than tabs) */}
        <div className="flex items-center gap-4">
          <div className="flex items-center">
            <div className="flex -space-x-2 mr-3 relative">
              {members.slice(0, 3).map((member) => (
                <div key={member.id} className="relative">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMemberPopupId((prev) =>
                        prev === member.id ? null : member.id,
                      );
                    }}
                    className="w-8 h-8 rounded-full border-2 border-white shadow-sm cursor-pointer hover:-translate-y-1 transition-transform overflow-hidden bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold focus:outline-none"
                    title={member.name}
                  >
                    {member.avatarUrl ? (
                      <Image
                        src={member.avatarUrl}
                        alt={member.name}
                        width={32}
                        height={32}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    ) : (
                      member.avatar
                    )}
                  </button>
                  {memberPopupId === member.id && (
                    <div
                      className="absolute left-0 top-10 z-30 bg-white border border-gray-200 rounded-xl shadow-xl p-4 w-56"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg overflow-hidden shrink-0">
                          {member.avatarUrl ? (
                            <Image
                              src={member.avatarUrl}
                              alt={member.name}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover"
                              unoptimized
                            />
                          ) : (
                            member.avatar
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-gray-900 truncate">
                            {member.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {member.role}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1.5 text-xs text-gray-600">
                        {member.email && (
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="text-gray-400 shrink-0">✉</span>
                            <span className="truncate">{member.email}</span>
                          </div>
                        )}
                        {member.empNo && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-gray-400 shrink-0">#</span>
                            <span>{member.empNo}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {members.length > 3 && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMemberPopupId(null);
                      setShowAllMembersPopup((prev) => !prev);
                    }}
                    className="w-8 h-8 rounded-full border-2 border-white shadow-sm bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600 cursor-pointer transition-colors focus:outline-none"
                  >
                    +{members.length - 3}
                  </button>
                  {showAllMembersPopup && (
                    <div
                      className="absolute right-0 top-10 z-30 bg-white border border-gray-200 rounded-xl shadow-xl w-72 max-h-96 overflow-y-auto"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                        <span className="text-sm font-semibold text-gray-800">
                          {t.kanban.allMembers} ({members.length} {t.kanban.people})
                        </span>
                        <button
                          onClick={() => setShowAllMembersPopup(false)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="divide-y divide-gray-50">
                        {members.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                          >
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm overflow-hidden shrink-0">
                              {member.avatarUrl ? (
                                <Image
                                  src={member.avatarUrl}
                                  alt={member.name}
                                  width={40}
                                  height={40}
                                  className="w-full h-full object-cover"
                                  unoptimized
                                />
                              ) : (
                                member.avatar
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium text-gray-900 truncate">
                                {member.name}
                              </div>
                              <div className="text-xs text-gray-500 flex items-center gap-2 flex-wrap">
                                <span className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px]">
                                  {member.role}
                                </span>
                                {member.empNo && <span># {member.empNo}</span>}
                                {member.email && (
                                  <span className="truncate">
                                    {member.email}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={() => setIsInviteModalOpen(true)}
              title={t.kanban.addMember}
              className="w-8 h-8 rounded-full border border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-400 transition-colors bg-white shadow-sm"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            {t.projects.addStep}
          </button>

          <button
            onClick={() => setIsTaskModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            {t.projects.createTask}
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 flex gap-6 overflow-x-auto pb-4 items-start">
        {columns.map((col, index) => {
          const columnTasks = tasks.filter((t) => t.status === col.id);
          return (
            <div
              key={col.id}
              className="shrink-0 w-80 rounded-xl p-4 flex flex-col max-h-full border border-gray-100 min-h-full"
              style={{
                backgroundColor: `${col.color}1A`,
              }} /* 1A is 10% opacity in hex */
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              <div className="flex justify-between items-center mb-4 px-1">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full shadow-[0_0_2px_rgba(0,0,0,0.2)]"
                    style={{ backgroundColor: col.color }}
                  ></div>
                  <h3 className="font-semibold text-gray-700 text-sm">
                    {col.title}
                  </h3>
                  <span className="text-xs font-medium bg-white text-gray-500 px-2 py-0.5 rounded-full shadow-sm">
                    {columnTasks.length}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {/* ปุ่มขยับคอลัมน์ (แสดงเฉพาะเมื่อไม่ใช่ todo และไม่ใช่อันก่อน done ที่จะขยับไป right) */}
                  {index > 1 && index < columns.length - 1 && (
                    <button
                      className="text-gray-400 hover:text-blue-600 transition-colors p-1"
                      onClick={() => handleMoveColumn(index, "left")}
                      title={t.kanban.moveLeft}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  )}
                  {index > 0 && index < columns.length - 2 && (
                    <button
                      className="text-gray-400 hover:text-blue-600 transition-colors p-1"
                      onClick={() => handleMoveColumn(index, "right")}
                      title={t.kanban.moveRight}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                  {index !== 0 && index !== columns.length - 1 && (
                    <div className="relative">
                      <button
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1 ml-1 rounded hover:bg-white/60"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenColMenuId((prev) =>
                            prev === col.id ? null : col.id,
                          );
                        }}
                        title={t.kanban.columnOptions}
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                      {openColMenuId === col.id && (
                        <div
                          className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            onClick={() => {
                              setRenamingCol({ id: col.id, title: col.title });
                              setRenameValue(col.title);
                              setOpenColMenuId(null);
                            }}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            {t.projects.renameColumn}
                          </button>
                          <div className="mx-2 my-1 border-t border-gray-100" />
                          <button
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                            onClick={() => {
                              setOpenColMenuId(null);
                              handleDeleteColumn(col.id);
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            {t.projects.deleteColumn}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 min-h-37.5">
                {columnTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onClick={() => setViewTask(task)}
                    className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-grab active:cursor-grabbing hover:shadow-md hover:border-blue-300 transition-all group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                        {task.type}
                      </span>
                      {/* <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm("คุณแน่ใจหรือไม่ที่จะลบงานนี้?")) {
                            setTasks(tasks.filter((t) => t.id !== task.id));
                          }
                        }}
                        className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="ลบงานนี้"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button> */}
                    </div>

                    <p className="text-sm font-medium text-gray-800 mb-4">
                      {task.title}
                    </p>

                    <div className="flex justify-between items-end mt-auto">
                      <div className="flex items-center gap-2 text-gray-400">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span className="text-xs">{task.comments || 0}</span>
                      </div>
                      {(() => {
                        const assignees = getTaskAssignees(task);
                        const primary = assignees[0];
                        return (
                          <div className="flex items-center gap-1">
                            <div
                              title={assignees.map((a) => a.name).join(", ")}
                              className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-700 border border-white shadow-sm ring-1 ring-gray-100"
                            >
                              {primary?.avatar || "U"}
                            </div>
                            {assignees.length > 1 && (
                              <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-full">
                                +{assignees.length - 1}
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                ))}

                {/* Empty State visual drop target */}
                {columnTasks.length === 0 && (
                  <div className="h-full min-h-25 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 text-sm">
                    {t.kanban.dropHere}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Rename Column Modal */}
      {renamingCol && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-xs overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">
                {t.projects.renameColumn}
              </h2>
              <button
                onClick={() => setRenamingCol(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <input
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRenameColumn();
                  if (e.key === "Escape") setRenamingCol(null);
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setRenamingCol(null)}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  {t.common.cancel}
                </button>
                <button
                  onClick={handleRenameColumn}
                  className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  {t.common.save}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invite Member Modal Popup */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden relative">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">{t.kanban.inviteMember}</h2>
              <button
                onClick={() => {
                  setIsInviteModalOpen(false);
                  setInviteIdentifier("");
                  setInviteError("");
                  setInviteSuccess("");
                }}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-500">
                {t.kanban.inviteHint}
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t.kanban.inviteeInfo}
                </label>
                <input
                  type="text"
                  value={inviteIdentifier}
                  onChange={(e) => setInviteIdentifier(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && inviteIdentifier.trim()) {
                      void handleInviteMember();
                    }
                  }}
                  placeholder={t.kanban.invitePlaceholder}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                {inviteError && (
                  <p className="mt-2 text-xs text-red-600">{inviteError}</p>
                )}
                {inviteSuccess && (
                  <p className="mt-2 text-xs text-green-600">{inviteSuccess}</p>
                )}
              </div>
            </div>

            <div className="p-5 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
              <button
                onClick={() => {
                  setIsInviteModalOpen(false);
                  setInviteIdentifier("");
                  setInviteError("");
                  setInviteSuccess("");
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              >
                {t.common.cancel}
              </button>
              <button
                onClick={() => void handleInviteMember()}
                disabled={!inviteIdentifier.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                {t.kanban.invite}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Column Modal Popup */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden relative">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                {t.projects.addStep}
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t.projects.columnName}
                </label>
                <input
                  type="text"
                  value={newColTitle}
                  onChange={(e) => setNewColTitle(e.target.value)}
                  placeholder="เช่น ตรวจสอบโค้ด, รออนุมัติ..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.kanban.colorPickerLabel}
                </label>
                <div className="flex gap-3 items-center flex-wrap">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color.id}
                      onClick={() => setNewColColor(color.color)}
                      className={`w-8 h-8 rounded-full ring-offset-2 transition-all ${newColColor === color.color ? "ring-2 ring-gray-400 scale-110 shadow-md" : "hover:scale-105 shadow-sm"}`}
                      style={{ backgroundColor: color.color }}
                      title={color.label}
                    />
                  ))}
                  <div className="w-px h-8 bg-gray-200 mx-1 border-none"></div>
                  <div className="flex items-center gap-2">
                    <div className="relative w-8 h-8 rounded-full overflow-hidden border border-gray-300 shadow-sm cursor-pointer hover:scale-105 transition-all focus-within:ring-2 focus-within:ring-gray-400 focus-within:ring-offset-2">
                      <input
                        type="color"
                        value={newColColor}
                        onChange={(e) => setNewColColor(e.target.value)}
                        className="absolute -top-3 -left-3 w-14 h-14 cursor-pointer border-0 p-0"
                        title={t.kanban.customColor}
                      />
                    </div>
                    <span className="text-xs text-gray-500 font-medium">
                      {t.kanban.currentColor}:{" "}
                      <span className="uppercase">{newColColor}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t.kanban.positionLabel}
                </label>
                <select
                  value={insertAfterId}
                  onChange={(e) => setInsertAfterId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {columns.slice(0, -1).map((col) => (
                    <option key={col.id} value={col.id}>
                      {col.title}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-2">
                  {t.kanban.positionNote}
                </p>
              </div>
            </div>

            <div className="p-5 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              >
                {t.common.cancel}
              </button>
              <button
                onClick={handleAddColumnSubmit}
                disabled={!newColTitle.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                {t.kanban.ok}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Task Modal Popup */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl overflow-hidden relative flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 shrink-0">
              <h2 className="text-lg font-bold text-gray-900">{t.kanban.createNewTask}</h2>
              <button
                onClick={() => setIsTaskModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t.kanban.taskTitleLabel} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder={t.kanban.taskTitlePlaceholder}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t.kanban.taskTypeLabel}
                  </label>
                  <select
                    value={newTaskType}
                    onChange={(e) => setNewTaskType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="Frontend">Frontend</option>
                    <option value="Backend">Backend</option>
                    <option value="Design">Design</option>
                    <option value="QA">QA</option>
                    <option value="General">{t.kanban.taskTypeGeneral}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t.kanban.assigneeLabel}
                  </label>
                  <AssigneeCombobox
                    selectedAssignees={newTaskAssigneeIds.map((id) => {
                      const member = members.find((m) => m.id === id);
                      return {
                        id,
                        name: member?.name || id,
                        avatar: member?.avatar || id[0]?.toUpperCase() || "U",
                        avatarUrl: member?.avatarUrl || "",
                      };
                    })}
                    onAdd={(user) =>
                      setNewTaskAssigneeIds((prev) =>
                        prev.includes(user.id) ||
                        !teamMemberIds.includes(user.id)
                          ? prev
                          : [...prev, user.id],
                      )
                    }
                    onRemove={(userId) => {
                      if (newTaskAssigneeIds.length <= 1) {
                        alert(t.kanban.minOneAssignee);
                        return;
                      }
                      setNewTaskAssigneeIds((prev) =>
                        prev.filter((id) => id !== userId),
                      );
                    }}
                    minOne
                    allowedUserIds={teamMemberIds}
                  />
                </div>
              </div>

              <div className="flex-1 flex flex-col min-h-62.5">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t.kanban.descriptionLabel}
                </label>
                <div className="flex-1 border border-gray-300 rounded-lg overflow-hidden [&_.quill]:h-50 [&_.ql-container]:border-none [&_.ql-toolbar]:border-none [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-gray-300">
                  <ReactQuill
                    theme="snow"
                    value={newTaskDescription}
                    onChange={setNewTaskDescription}
                    placeholder={t.kanban.descriptionPlaceholder}
                    modules={{
                      toolbar: [
                        [{ header: [1, 2, 3, false] }],
                        ["bold", "italic", "underline", "strike"],
                        [{ list: "ordered" }, { list: "bullet" }],
                        ["link", "image"],
                        ["clean"],
                      ],
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 shrink-0">
              <button
                onClick={() => setIsTaskModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              >
                {t.common.cancel}
              </button>
              <button
                onClick={handleAddTaskSubmit}
                disabled={
                  !newTaskTitle.trim() || newTaskAssigneeIds.length === 0
                }
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                สร้างงาน
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Task Modal Popup */}
      {viewTask && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl overflow-hidden relative flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded">
                  {viewTask.type}
                </span>
                <span className="text-gray-500 text-sm">ID: {viewTask.id}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (confirm(t.kanban.deleteTaskConfirm)) {
                      setTasks(tasks.filter((t) => t.id !== viewTask.id));
                      setViewTask(null);
                      setIsEditingDescription(false);
                    }
                  }}
                  className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
                >
                  {t.kanban.deleteTask}
                </button>
                <button
                  onClick={() => {
                    setViewTask(null);
                    setIsEditingDescription(false);
                  }}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              <h2 className="text-2xl font-bold text-gray-900">
                {viewTask.title}
              </h2>

              <div className="grid grid-cols-2 gap-4 border border-gray-100 bg-gray-50 rounded-xl p-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">{t.kanban.currentStatus}</p>
                  <div ref={statusDropdownRef} className="relative">
                    {/* Trigger button */}
                    <button
                      type="button"
                      onClick={() => setStatusDropdownOpen((v) => !v)}
                      className="w-full flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-900 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    >
                      {(() => {
                        const col = columns.find(
                          (c) => c.id === viewTask.status,
                        );
                        return (
                          <>
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{
                                backgroundColor: col?.color ?? "#94a3b8",
                              }}
                            />
                            <span className="flex-1 text-left truncate">
                              {col?.title ?? viewTask.status}
                            </span>
                            <svg
                              className="w-4 h-4 text-gray-400 shrink-0"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </>
                        );
                      })()}
                    </button>

                    {/* Dropdown */}
                    {statusDropdownOpen && (
                      <div className="absolute z-40 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                        {columns.map((col) => {
                          const isActive = col.id === viewTask.status;
                          return (
                            <button
                              key={col.id}
                              type="button"
                              onClick={async () => {
                                if (isActive) {
                                  setStatusDropdownOpen(false);
                                  return;
                                }
                                const updated = { ...viewTask, status: col.id };
                                setViewTask(updated);
                                setTasks((prev) =>
                                  prev.map((t) =>
                                    t.id === viewTask.id
                                      ? { ...t, status: col.id }
                                      : t,
                                  ),
                                );
                                setStatusDropdownOpen(false);
                                await updateTaskStatus(
                                  viewTask.id,
                                  col.id,
                                  projectId,
                                );
                              }}
                              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left transition-colors ${
                                isActive
                                  ? "bg-blue-50 font-semibold"
                                  : "hover:bg-gray-50"
                              }`}
                            >
                              <span
                                className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                                style={{ backgroundColor: col.color }}
                              />
                              <span className="flex-1 truncate text-gray-800">
                                {col.title}
                              </span>
                              {isActive && (
                                <svg
                                  className="w-4 h-4 text-blue-500 shrink-0"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2.5}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">{t.kanban.assignee}</p>
                  <AssigneeCombobox
                    selectedAssignees={getTaskAssignees(viewTask).map((a) => ({
                      id: a.id,
                      name: a.name,
                      avatar: a.avatar,
                      avatarUrl: a.avatarUrl,
                    }))}
                    onAdd={(user) =>
                      void handleAddAssigneeToTask(viewTask.id, user.id)
                    }
                    onRemove={(userId) =>
                      void handleRemoveAssigneeFromTask(viewTask.id, userId)
                    }
                    minOne
                    allowedUserIds={teamMemberIds}
                  />
                </div>

                {/* Creator — read-only, spans full width */}
                <div className="col-span-2 pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-1.5">{t.kanban.createdBy}</p>
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-[11px] font-bold text-purple-700 shrink-0 overflow-hidden">
                      {viewTask.creatorAvatarUrl ? (
                        <Image
                          src={viewTask.creatorAvatarUrl as string}
                          alt={viewTask.creatorName as string}
                          width={28}
                          height={28}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                      ) : (
                        ((viewTask.creatorName as string)?.[0]?.toUpperCase() ??
                        "?")
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-800">
                      {(viewTask.creatorName as string) || t.kanban.unknown}
                    </span>
                    <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                      {t.kanban.creator}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-semibold text-gray-800">
                    {t.kanban.descriptionSection}
                  </h3>
                  {!isEditingDescription && (
                    <button
                      onClick={() => {
                        setIsEditingDescription(true);
                        setEditDescriptionContent(viewTask.description || "");
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium px-2 py-1 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                    >
                      {t.kanban.editDescription}
                    </button>
                  )}
                </div>

                {isEditingDescription ? (
                  <div className="border border-gray-300 rounded-lg overflow-hidden [&_.quill]:h-[57vh] [&_.ql-container]:border-none [&_.ql-toolbar]:border-none [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-gray-300 flex flex-col mb-4">
                    <ReactQuill
                      theme="snow"
                      value={editDescriptionContent}
                      onChange={setEditDescriptionContent}
                      placeholder={t.kanban.descriptionPlaceholder}
                      modules={{
                        toolbar: [
                          [{ header: [1, 2, 3, false] }],
                          ["bold", "italic", "underline", "strike"],
                          [{ list: "ordered" }, { list: "bullet" }],
                          ["link", "image"],
                          ["clean"],
                        ],
                      }}
                    />
                    <div className="flex justify-end gap-2 p-3 bg-gray-50 border-t border-gray-200 mt-10">
                      <button
                        onClick={() => setIsEditingDescription(false)}
                        className="px-4 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        {t.common.cancel}
                      </button>
                      <button
                        onClick={handleSaveDescription}
                        className="px-4 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                      >
                        {t.common.save}
                      </button>
                    </div>
                  </div>
                ) : viewTask.description &&
                  viewTask.description !== "<p><br></p>" ? (
                  <div
                    className="text-gray-700 bg-white border border-gray-100 rounded-lg p-4 [&>p]:mb-3 [&>h1]:text-2xl [&>h1]:font-bold [&>h2]:text-xl [&>h2]:font-bold [&>h3]:text-lg [&>h3]:font-bold [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:mb-3 [&>ul]:mb-3 [&_img]:max-w-full [&_img]:rounded-md [&_a]:text-blue-600 [&_a]:underline"
                    dangerouslySetInnerHTML={{ __html: viewTask.description }}
                  />
                ) : (
                  <div className="text-gray-400 italic text-sm bg-gray-50 border border-dashed border-gray-200 p-4 rounded-lg text-center">
                    {t.kanban.noDescription}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">
                  {t.kanban.comments} ({viewTask.comments || 0})
                </h3>
                <div className="space-y-3 mb-4">
                  {(viewTask.commentList || []).map((comment: BoardComment) => (
                    <div key={comment.id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700 shrink-0 border border-white shadow-sm ring-1 ring-gray-100">
                        {comment.avatarUrl ? (
                          <Image
                            src={comment.avatarUrl}
                            alt={comment.authorName || "Commenter"}
                            className="w-full h-full object-cover rounded-full"
                            width={32}
                            height={32}
                            unoptimized
                          />
                        ) : (
                          comment.author
                        )}
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 w-full border border-gray-100">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-xs font-bold text-gray-800">
                            {comment.authorName ||
                              members.find((m) => m.avatar === comment.author)
                                ?.name ||
                              comment.author}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {comment.timestamp}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{comment.text}</p>
                      </div>
                    </div>
                  ))}
                  {(!viewTask.commentList ||
                    viewTask.commentList.length === 0) && (
                    <div className="text-center text-sm text-gray-400 py-4 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                      {t.kanban.noComments}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 items-start mt-4">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700 shrink-0 border border-white shadow-sm ring-1 ring-gray-100">
                    {currentUser.avatarUrl ? (
                      <Image
                        src={currentUser.avatarUrl}
                        alt={currentUser.name}
                        className="w-full h-full object-cover rounded-full"
                        width={32}
                        height={32}
                        unoptimized
                      />
                    ) : (
                      currentUser.avatar
                    )}
                  </div>
                  <div className="flex-1 flex gap-2">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                      placeholder={t.kanban.commentPlaceholder}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={handleAddComment}
                      disabled={!newComment.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {t.kanban.send}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 shrink-0">
              <button
                onClick={() => {
                  setViewTask(null);
                  setIsEditingDescription(false);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors rounded-lg"
              >
                {t.kanban.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
