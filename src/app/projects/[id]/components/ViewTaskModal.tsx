"use client";

import type { Dispatch, SetStateAction } from "react";
import {
  Avatar,
  Button,
  Checkbox,
  DatePicker,
  Dropdown,
  Input,
  message,
  Modal,
  Tag,
  Typography,
  Card,
} from "antd";
import {
  MoreOutlined,
  ShareAltOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import "react-quill-new/dist/quill.snow.css";
import type { Translations } from "@/lib/i18n";
import type {
  BoardColumn,
  BoardComment,
  BoardMember,
  BoardTask,
} from "@/types/kanban";
import dayjs from "dayjs";
import AssigneeCombobox from "./AssigneeCombobox";
import { toDateInputValue } from "@/utils/kanban";
import TinyEditor from "@/components/TinyEditor";
import { useParams } from "next/navigation";

const { RangePicker } = DatePicker;

type Setter<T> = Dispatch<SetStateAction<T>>;

interface ViewTaskModalProps {
  viewTask: BoardTask | null;
  onClose: () => void;
  t: Translations;
  columns: BoardColumn[];
  members: BoardMember[];
  currentUser: BoardMember;
  teamMemberIds: string[];
  isEditingTitle: boolean;
  setIsEditingTitle: Setter<boolean>;
  editTitleContent: string;
  setEditTitleContent: Setter<string>;
  handleSaveTitle: () => void | Promise<void>;
  getTaskAssignees: (task: BoardTask) => BoardTask["assignees"];
  handleAddAssigneeToTask: (taskId: string, userId: string) => Promise<void>;
  handleRemoveAssigneeFromTask: (
    taskId: string,
    userId: string,
  ) => Promise<void>;
  handleTaskDatesChange: (
    startDate: string | null,
    dueDate: string | null,
  ) => Promise<void>;
  handleTaskStatusChange: (statusId: string) => Promise<void>;
  handleToggleUrgent: () => Promise<void>;
  isEditingDescription: boolean;
  setIsEditingDescription: Setter<boolean>;
  editDescriptionContent: string;
  setEditDescriptionContent: Setter<string>;
  handleSaveDescription: () => void | Promise<void>;
  newComment: string;
  setNewComment: Setter<string>;
  handleAddComment: () => void | Promise<void>;
  handleDeleteCurrentTask: () => void | Promise<void>;
}

export default function ViewTaskModal({
  viewTask,
  onClose,
  t,
  columns,
  members,
  currentUser,
  teamMemberIds,
  isEditingTitle,
  setIsEditingTitle,
  editTitleContent,
  setEditTitleContent,
  handleSaveTitle,
  getTaskAssignees,
  handleAddAssigneeToTask,
  handleRemoveAssigneeFromTask,
  handleTaskDatesChange,
  handleTaskStatusChange,
  handleToggleUrgent,
  isEditingDescription,
  setIsEditingDescription,
  editDescriptionContent,
  setEditDescriptionContent,
  handleSaveDescription,
  newComment,
  setNewComment,
  handleAddComment,
  handleDeleteCurrentTask,
}: ViewTaskModalProps) {
  const { id: projectId } = useParams();

  const handleCopyInviteLink = () => {
    const inviteLink = `${window.location.origin}/projects/${projectId}?task=${viewTask?.id}`;
    navigator.clipboard.writeText(inviteLink).then(() => {
      message.success(t.kanban.inviteLinkCopied, 1);
    });
  };

  return (
    <Modal
      open={!!viewTask}
      onCancel={onClose}
      footer={[
        <Button
          key="close"
          type="primary"
          onClick={onClose}
          className="rounded-lg"
        >
          {t.kanban.close}
        </Button>,
      ]}
      width="90%"
      centered
      title={
        <div className="flex items-center gap-3 pr-8 w-full justify-between">
          <div className="flex items-center gap-2">
            <Tag color="default" className="font-semibold m-0">
              {viewTask?.type}
            </Tag>
            <span className="text-gray-400 text-sm font-normal">
              ID: {viewTask?.id}
            </span>
          </div>
          <div className="flex">
            <Button
              type="text"
              className="text-gray-400 hover:text-gray-600 transition-colors px-2 py-1 rounded-md"
              icon={<ShareAltOutlined style={{ fontSize: "16px" }} />}
              onClick={handleCopyInviteLink}
            />
            <Dropdown
              trigger={["click"]}
              menu={{
                items: [
                  {
                    key: "delete",
                    label: (
                      <span className="text-red-600">
                        {t.kanban.deleteTask}
                      </span>
                    ),
                  },
                ],
                onClick: ({ key }) => {
                  if (key === "delete") {
                    void handleDeleteCurrentTask();
                  }
                },
              }}
            >
              <Button
                type="text"
                className="text-gray-400 hover:text-gray-600 transition-colors px-2 py-1 rounded-md"
              >
                <MoreOutlined style={{ fontSize: "16px" }} />
              </Button>
            </Dropdown>
          </div>
        </div>
      }
    >
      {viewTask && (
        <div className="space-y-5 max-h-[80vh] overflow-y-auto pr-1">
          {isEditingTitle ? (
            <div className="flex gap-3 justify-between items-center">
              <Input
                value={editTitleContent}
                onChange={(e) => setEditTitleContent(e.target.value)}
                onPressEnter={handleSaveTitle}
                className="w-full text-2xl! font-bold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => setIsEditingTitle(false)}
                  className="rounded-lg"
                >
                  {t.common.cancel}
                </Button>
                <Button
                  onClick={handleSaveTitle}
                  disabled={!editTitleContent.trim()}
                  type="primary"
                  className="rounded-lg"
                >
                  {t.common.save}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 justify-between group">
              <Typography.Title level={2} className="m-0">
                {viewTask.title}
              </Typography.Title>
              <Button
                onClick={() => {
                  setIsEditingTitle(true);
                  setEditTitleContent(viewTask.title);
                }}
                className="text-xs px-2.5 py-1.5 rounded-md transition-colors flex items-center gap-1 shrink-0"
              >
                {t.kanban.editTitle}
              </Button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 border border-gray-100 bg-gray-50 rounded-xl p-4">
            <div>
              <Typography.Text type="secondary" className="text-xs">
                {t.kanban.currentStatus}
              </Typography.Text>
              <Dropdown
                trigger={["click"]}
                menu={{
                  onClick: ({ key }) => {
                    if (!viewTask || key === viewTask.status) return;
                    void handleTaskStatusChange(String(key));
                  },
                  selectable: true,
                  selectedKeys: [viewTask.status],
                  items: columns.map((col) => ({
                    key: col.id,
                    label: (
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: col.color ?? "#94a3b8" }}
                        />
                        <span>{col.title}</span>
                      </div>
                    ),
                  })),
                }}
              >
                <Button className="mt-1 w-full justify-between!">
                  <span className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{
                        backgroundColor:
                          columns.find((c) => c.id === viewTask.status)
                            ?.color ?? "#94a3b8",
                      }}
                    />
                    <span>
                      {columns.find((c) => c.id === viewTask.status)?.title ??
                        viewTask.status}
                    </span>
                  </span>
                </Button>
              </Dropdown>
            </div>
            <div>
              <Typography.Text type="secondary" className="text-xs">
                {t.kanban.assignee}
              </Typography.Text>
              <AssigneeCombobox
                selectedAssignees={(getTaskAssignees(viewTask) || []).map(
                  (a) => ({
                    id: a.id,
                    name: a.name,
                    avatar: a.avatar,
                    avatarUrl: a.avatarUrl,
                  }),
                )}
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

            <div>
              <Typography.Text type="secondary" className="text-xs">
                {t.kanban.startDateLabel} / {t.kanban.dueDateLabel}
              </Typography.Text>
              <RangePicker
                value={[
                  viewTask?.startDate
                    ? dayjs(toDateInputValue(viewTask.startDate))
                    : null,
                  viewTask?.dueDate
                    ? dayjs(toDateInputValue(viewTask.dueDate))
                    : null,
                ]}
                onChange={(dates) =>
                  void handleTaskDatesChange(
                    dates?.[0] ? dates[0].format("YYYY-MM-DD") : null,
                    dates?.[1] ? dates[1].format("YYYY-MM-DD") : null,
                  )
                }
                className="w-full mt-1"
                placeholder={[t.kanban.startDateLabel, t.kanban.dueDateLabel]}
                allowEmpty={[true, true]}
                format="DD/MM/YYYY"
              />
            </div>

            <div className="flex flex-col items-start justify-center pt-6">
              <Checkbox
                checked={viewTask.isUrgent}
                onChange={() => void handleToggleUrgent()}
              >
                <Typography.Text type="secondary" className="text-xs">
                  {t.kanban.urgent}
                </Typography.Text>
              </Checkbox>
            </div>

            <div className="col-span-2 pt-2 border-t border-gray-100">
              <Typography.Text type="secondary" className="text-xs">
                {t.kanban.createdBy}
              </Typography.Text>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  {viewTask.creatorAvatarUrl ? (
                    <Avatar
                      src={viewTask.creatorAvatarUrl}
                      className="w-7 h-7 rounded-full"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-[11px] font-bold text-purple-700 shrink-0 overflow-hidden">
                      {(viewTask.creatorName as string)?.[0]?.toUpperCase() ??
                        "?"}
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-800">
                    {(viewTask.creatorName as string) || t.kanban.unknown}
                  </span>
                  <Typography.Text
                    type="secondary"
                    className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded"
                  >
                    {t.kanban.creator}
                  </Typography.Text>
                </div>
                {/* <Button
                  onClick={() => void handleToggleUrgent()}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 ${
                    viewTask.isUrgent
                      ? "bg-red-100! text-red-700! hover:bg-red-200!"
                      : "bg-gray-100! text-gray-700! hover:bg-gray-200!"
                  }`}
                >
                  <ThunderboltOutlined />
                  {viewTask.isUrgent ? t.kanban.urgent : t.kanban.notUrgent}
                </Button> */}
              </div>
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex justify-between items-center mb-3">
              <Typography.Text type="secondary" className="text-sm">
                {t.kanban.descriptionSection}
              </Typography.Text>
              {!isEditingDescription ? (
                <Button
                  onClick={() => {
                    setIsEditingDescription(true);
                    setEditDescriptionContent(viewTask.description || "");
                  }}
                  className="text-xs px-2 py-1 rounded-md transition-colors"
                >
                  {t.kanban.editDescription}
                </Button>
              ) : (
                <div className="flex justify-end gap-2">
                  <Button
                    onClick={() => setIsEditingDescription(false)}
                    className="px-4 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    {t.common.cancel}
                  </Button>
                  <Button
                    onClick={handleSaveDescription}
                    disabled={!editDescriptionContent.trim()}
                    type="primary"
                    className="px-4 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                  >
                    {t.common.save}
                  </Button>
                </div>
              )}
            </div>

            {isEditingDescription ? (
              <div className="border border-gray-300 rounded-lg overflow-hidden [&_.quill]:h-[50vh] [&_.ql-container]:border-none [&_.ql-toolbar]:border-none [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-gray-300 flex flex-col mb-4">
                <TinyEditor
                  newDescription={editDescriptionContent}
                  setNewDescription={setEditDescriptionContent}
                />
              </div>
            ) : viewTask.description &&
              viewTask.description !== "<p><br></p>" ? (
              <div className="border border-gray-200 rounded-lg p-2 mb-1 max-h-[60vh] overflow-y-auto">
                <div
                  className="[&>p]:mb-3 [&>h1]:text-2xl [&>h1]:font-bold [&>h2]:text-xl [&>h2]:font-bold [&>h3]:text-lg [&>h3]:font-bold [&>ul]:mb-3 [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:mb-3 [&>ol]:list-decimal [&>ol]:pl-5 [&_img]:max-w-full [&_img]:rounded-md [&_a]:text-blue-600 [&_a]:underline [&_a]:hover:text-blue-800"
                  dangerouslySetInnerHTML={{ __html: viewTask.description }}
                />
              </div>
            ) : (
              <Typography.Text
                type="secondary"
                className="text-gray-400 italic text-sm bg-gray-50 border border-dashed border-gray-200 p-4 rounded-lg text-center"
              >
                {t.kanban.noDescription}
              </Typography.Text>
            )}
          </div>

          <div className="pt-4 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">
              {t.kanban.comments} ({viewTask.comments || 0})
            </h3>
            <div className="space-y-3 mb-4">
              {(viewTask.commentList || []).map((comment: BoardComment) => (
                <div key={comment.id} className="flex gap-3">
                  {comment.avatarUrl ? (
                    <Avatar
                      src={comment.avatarUrl}
                      className="w-8 h-8 rounded-full border border-white shadow-sm ring-1 ring-gray-100"
                    />
                  ) : (
                    <div className="w-8 h-8 mt-1 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700 shrink-0 border border-white shadow-sm ring-1 ring-gray-100">
                      {comment.authorName
                        ? comment.authorName[0].toUpperCase()
                        : members
                            .find((m) => m.avatar === comment.author)
                            ?.name?.[0]?.toUpperCase() || "?"}
                    </div>
                  )}
                  <div className="bg-gray-50 rounded-lg p-3 w-full border border-gray-100 relative">
                    <div
                      style={{
                        position: "absolute",
                        top: 12,
                        left: -8,
                        borderWidth: "6px 8px 6px 0",
                        borderColor:
                          "transparent #f9fafb transparent transparent",
                        borderStyle: "solid",
                        width: 0,
                        height: 0,
                      }}
                    ></div>
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
              {/* {(!viewTask.commentList || viewTask.commentList.length === 0) && (
                <Typography.Text
                  type="secondary"
                  className="text-center text-sm text-gray-400 py-4 bg-gray-50 rounded-lg border border-dashed border-gray-200"
                >
                  {t.kanban.noComments}
                </Typography.Text>
              )} */}
            </div>

            <div className="flex gap-3 items-start mt-4 mb-3">
              {currentUser.avatarUrl ? (
                <Avatar
                  className="w-8 h-8 border border-white shadow-sm ring-1 ring-gray-100 shrink-0"
                  src={currentUser.avatarUrl}
                />
              ) : (
                <Typography.Text
                  type="secondary"
                  className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700 shrink-0 border border-white shadow-sm ring-1 ring-gray-100"
                >
                  {currentUser.name ? currentUser.name[0].toUpperCase() : "?"}
                </Typography.Text>
              )}
              <div className="flex-1 flex gap-2">
                <Input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onPressEnter={handleAddComment}
                  placeholder={t.kanban.commentPlaceholder}
                  className="flex-1 bg-gray-50"
                />
                <Button
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  type="primary"
                  className="rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t.kanban.send}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
