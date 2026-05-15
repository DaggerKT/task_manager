"use client";

import { useEffect, useState, useMemo } from "react";
import {
  FolderGit2,
  Plus,
  Search,
  MoreVertical,
  LayoutGrid,
  List as ListIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import {
  Avatar,
  Button,
  Card,
  DatePicker,
  Dropdown,
  Empty,
  Input,
  Modal,
  Progress,
  Segmented,
  Select,
  Space,
  Tag,
  Typography,
  message,
} from "antd";
import {
  ClockCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  IssuesCloseOutlined,
} from "@ant-design/icons";
import { createProject, deleteProject, updateProject } from "@/actions/project";
import type { ProjectItem } from "@/types/project";
import { useLanguage } from "@/contexts/LanguageContext";

export default function ProjectsList({
  initialProjects,
}: {
  initialProjects: ProjectItem[];
}) {
  const router = useRouter();
  const { t, locale } = useLanguage();
  const [messageApi, contextHolder] = message.useMessage();
  const [projects, setProjects] = useState(initialProjects);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [viewMode, setViewMode] = useState<"card" | "list">("card");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDueDate, setNewProjectDueDate] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editProjectName, setEditProjectName] = useState("");
  const [editProjectDueDate, setEditProjectDueDate] = useState("");

  useEffect(() => {
    setProjects(initialProjects);
  }, [initialProjects]);

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

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchSearch = p.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      if (statusFilter === "All") return matchSearch;
      return matchSearch && p.status === statusFilter;
    });
  }, [projects, searchQuery, statusFilter]);

  const dateLocale = locale === "th" ? "th-TH" : "en-US";

  const formatDate = (value: string | null) => {
    if (!value) return t.projects.noDueDate;
    return new Date(value).toLocaleDateString(dateLocale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;

    const res = await createProject(newProjectName, newProjectDueDate || null);

    if (res.success && res.project) {
      const newProject = {
        id: res.project.id,
        name: res.project.name,
        status: res.project.status,
        progress: 0,
        members: 1,
        memberAvatars: [],
        dueDate: res.project.dueDate
          ? new Date(res.project.dueDate).toISOString()
          : null,
        canDelete: true,
      };
      setProjects([newProject, ...projects]);
      messageApi.success(t.projects.modal.submit);
    } else {
      messageApi.error(res.error || "ไม่สามารถสร้างโปรเจคได้");
    }

    setIsCreateModalOpen(false);
    setNewProjectName("");
    setNewProjectDueDate("");
  };

  const handleDeleteProject = async (id: string) => {
    Modal.confirm({
      title: t.projects.deleteConfirm,
      okText: t.projects.deleteProject,
      cancelText: t.common.cancel,
      okButtonProps: { danger: true },
      onOk: async () => {
        const res = await deleteProject(id);
        if (res.success) {
          setProjects((prev) => prev.filter((p) => p.id !== id));
          messageApi.success(t.projects.deleteProject);
        } else {
          messageApi.error(res.error || "ไม่สามารถลบโปรเจคได้");
        }
      },
    });
  };

  const handleOpenEditModal = (project: ProjectItem) => {
    if (!project.canDelete) return;
    setEditingProjectId(project.id);
    setEditProjectName(project.name);
    setEditProjectDueDate(project.dueDate ? project.dueDate.slice(0, 10) : "");
    setIsEditModalOpen(true);
  };

  const handleUpdateProject = async () => {
    if (!editingProjectId || !editProjectName.trim()) return;

    const res = await updateProject(
      editingProjectId,
      editProjectName,
      editProjectDueDate || null,
    );

    if (res.success && res.project) {
      setProjects((prev) =>
        prev.map((p) =>
          p.id === editingProjectId
            ? {
                ...p,
                name: res.project.name,
                dueDate: res.project.dueDate
                  ? new Date(res.project.dueDate).toISOString()
                  : null,
              }
            : p,
        ),
      );
      setIsEditModalOpen(false);
      setEditingProjectId(null);
      setEditProjectName("");
      setEditProjectDueDate("");
      messageApi.success(t.projects.editModal.submit);
    } else {
      messageApi.error(res.error || "ไม่สามารถแก้ไขโปรเจคได้");
    }
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingProjectId(null);
    setEditProjectName("");
    setEditProjectDueDate("");
  };

  const statusColor = (status: string) => {
    if (status === "Done") return "green";
    if (status === "Planning") return "gold";
    return "blue";
  };

  return (
    <Space
      orientation="vertical"
      size={20}
      style={{ width: "100%", paddingBottom: 24 }}
    >
      {contextHolder}

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <Space orientation="vertical" size={2}>
          <Typography.Title level={3} style={{ margin: 0 }}>
            {t.projects.title}
          </Typography.Title>
          <Typography.Text type="secondary">
            {t.projects.subtitle}
          </Typography.Text>
        </Space>

        <Button
          type="primary"
          icon={<Plus size={16} />}
          onClick={() => setIsCreateModalOpen(true)}
        >
          {t.projects.createNew}
        </Button>
      </div>

      <Card style={{ position: "sticky", top: 0, zIndex: 5 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            prefix={<Search size={16} />}
            placeholder={t.projects.searchPlaceholder}
            style={{ width: 360, maxWidth: "100%" }}
          />

          <Space wrap align="center">
            <Segmented
              value={viewMode}
              onChange={(value) => setViewMode(value as "card" | "list")}
              options={[
                {
                  value: "card",
                  icon: <LayoutGrid size={16} className="mt-1.5" />,
                },
                {
                  value: "list",
                  icon: <ListIcon size={16} className="mt-1.5" />,
                },
              ]}
            />

            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ minWidth: 171 }}
              options={[
                { value: "All", label: t.projects.filterAll },
                { value: "Active", label: t.projects.filterActive },
                { value: "Done", label: t.projects.filterDone },
              ]}
            />
          </Space>
        </div>
      </Card>

      {filteredProjects.length === 0 ? (
        <Card>
          <Empty description={t.projects.noResults} />
        </Card>
      ) : viewMode === "card" ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 16,
          }}
        >
          {filteredProjects.map((project) => (
            <Card
              key={project.id}
              hoverable
              onClick={() => router.push(`/projects/${project.id}`)}
              styles={{ body: { padding: 16 } }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: "#eff6ff",
                    color: "#2563eb",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <FolderGit2 size={20} />
                </div>

                <Dropdown
                  trigger={["click"]}
                  menu={{
                    items: [
                      {
                        key: "viewTasks",
                        label: (
                          <span>
                            <IssuesCloseOutlined style={{ marginRight: 4 }} />
                            {t.projects.viewTasks}
                          </span>
                        ),
                        onClick: ({ domEvent }) => {
                          domEvent.stopPropagation();
                          router.push(`/projects/${project.id}`);
                        },
                      },
                      {
                        key: "viewTimeline",
                        label: (
                          <span>
                            <ClockCircleOutlined style={{ marginRight: 4 }} />
                            {t.projects.viewTimeline}
                          </span>
                        ),
                        onClick: ({ domEvent }) => {
                          domEvent.stopPropagation();
                          router.push(`/projects/${project.id}/timeline`);
                        },
                      },
                      ...(project.canDelete
                        ? [
                            {
                              key: "edit",
                              label: (
                                <span>
                                  <EditOutlined style={{ marginRight: 4 }} />
                                  {t.projects.editProject}
                                </span>
                              ),
                              onClick: ({ domEvent }: any) => {
                                domEvent.stopPropagation();
                                handleOpenEditModal(project);
                              },
                            },
                            {
                              key: "delete",
                              label: (
                                <span>
                                  <DeleteOutlined style={{ marginRight: 4 }} />
                                  {t.projects.deleteProject}
                                </span>
                              ),
                              danger: true,
                              onClick: ({ domEvent }: any) => {
                                domEvent.stopPropagation();
                                void handleDeleteProject(project.id);
                              },
                            },
                          ]
                        : []),
                    ],
                  }}
                >
                  <Button
                    type="text"
                    icon={<MoreVertical size={16} />}
                    onClick={(e) => e.stopPropagation()}
                  />
                </Dropdown>
              </div>

              <Typography.Title level={5} style={{ marginBottom: 4 }}>
                {project.name}
              </Typography.Title>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {t.projects.dueDate}: {formatDate(project.dueDate)}
              </Typography.Text>

              <div style={{ marginTop: 12 }}>
                <Typography.Text style={{ fontSize: 12 }}>
                  {t.projects.progress}: {project.progress}%
                </Typography.Text>
                <Progress
                  percent={project.progress}
                  size="small"
                  showInfo={false}
                  strokeColor={project.progress === 100 ? "#22c55e" : "#2563eb"}
                />
              </div>

              <div
                style={{
                  marginTop: 14,
                  paddingTop: 10,
                  borderTop: "1px solid #f1f5f9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Avatar.Group size="small" max={{ count: 3 }}>
                  {project.memberAvatars.map((member) => (
                    <Avatar key={member.id} src={member.avatar || undefined}>
                      {member.name?.[0]?.toUpperCase() ?? "U"}
                    </Avatar>
                  ))}
                </Avatar.Group>

                <Tag color={statusColor(project.status)}>{project.status}</Tag>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Space orientation="vertical" size={10} style={{ width: "100%" }}>
          {filteredProjects.map((project) => (
            <Card
              key={project.id}
              hoverable
              onClick={() => router.push(`/projects/${project.id}`)}
              styles={{ body: { padding: 14 } }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ flex: 1, minWidth: 220 }}>
                  <Space align="start" size={10}>
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 8,
                        background: "#eff6ff",
                        color: "#2563eb",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <FolderGit2 size={18} />
                    </div>
                    <Space orientation="vertical" size={2}>
                      <Typography.Text strong>{project.name}</Typography.Text>
                      <Typography.Text
                        type="secondary"
                        style={{ fontSize: 12 }}
                      >
                        {t.projects.dueDate}: {formatDate(project.dueDate)}
                      </Typography.Text>
                    </Space>
                  </Space>

                  <div style={{ marginTop: 10 }}>
                    <Progress
                      percent={project.progress}
                      size="small"
                      strokeColor={
                        project.progress === 100 ? "#22c55e" : "#2563eb"
                      }
                    />
                  </div>
                </div>

                <Space>
                  <Tag color={statusColor(project.status)}>
                    {project.status}
                  </Tag>
                  <Dropdown
                    trigger={["click"]}
                    menu={{
                      items: [
                        {
                          key: "viewTasks",
                          label: t.projects.viewTasks,
                          onClick: ({ domEvent }) => {
                            domEvent.stopPropagation();
                            router.push(`/projects/${project.id}`);
                          },
                        },
                        {
                          key: "viewTimeline",
                          label: t.projects.viewTimeline,
                          onClick: ({ domEvent }) => {
                            domEvent.stopPropagation();
                            router.push(`/projects/${project.id}/timeline`);
                          },
                        },
                        ...(project.canDelete
                          ? [
                              {
                                key: "edit",
                                label: t.projects.editProject,
                                onClick: ({ domEvent }: any) => {
                                  domEvent.stopPropagation();
                                  handleOpenEditModal(project);
                                },
                              },
                              {
                                key: "delete",
                                label: t.projects.deleteProject,
                                danger: true,
                                onClick: ({ domEvent }: any) => {
                                  domEvent.stopPropagation();
                                  void handleDeleteProject(project.id);
                                },
                              },
                            ]
                          : []),
                      ],
                    }}
                  >
                    <Button
                      type="text"
                      icon={<MoreVertical size={16} />}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Dropdown>
                </Space>
              </div>
            </Card>
          ))}
        </Space>
      )}

      <Modal
        open={isCreateModalOpen}
        title={t.projects.modal.title}
        okText={t.projects.modal.submit}
        cancelText={t.common.cancel}
        onCancel={() => setIsCreateModalOpen(false)}
        onOk={() => void handleCreateProject()}
        okButtonProps={{ disabled: !newProjectName.trim() }}
      >
        <Space
          orientation="vertical"
          size={12}
          style={{ width: "100%", marginTop: 8 }}
        >
          <Space orientation="vertical" size={4} style={{ width: "100%" }}>
            <Typography.Text>{t.projects.modal.nameLabel}</Typography.Text>
            <Input
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder={t.projects.modal.namePlaceholder}
            />
          </Space>

          <Space orientation="vertical" size={4} style={{ width: "100%" }}>
            <Typography.Text>{t.projects.modal.dueDateLabel}</Typography.Text>
            <DatePicker
              style={{ width: "100%" }}
              value={newProjectDueDate ? dayjs(newProjectDueDate) : null}
              allowClear
              onChange={(value) =>
                setNewProjectDueDate(value ? value.format("YYYY-MM-DD") : "")
              }
            />
          </Space>
        </Space>
      </Modal>

      <Modal
        open={isEditModalOpen}
        title={t.projects.editModal.title}
        okText={t.projects.editModal.submit}
        cancelText={t.common.cancel}
        onCancel={closeEditModal}
        onOk={() => void handleUpdateProject()}
        okButtonProps={{ disabled: !editProjectName.trim() }}
      >
        <Space
          orientation="vertical"
          size={12}
          style={{ width: "100%", marginTop: 8 }}
        >
          <Space orientation="vertical" size={4} style={{ width: "100%" }}>
            <Typography.Text>{t.projects.modal.nameLabel}</Typography.Text>
            <Input
              value={editProjectName}
              onChange={(e) => setEditProjectName(e.target.value)}
              placeholder={t.projects.modal.namePlaceholder}
            />
          </Space>

          <Space orientation="vertical" size={4} style={{ width: "100%" }}>
            <Typography.Text>{t.projects.modal.dueDateLabel}</Typography.Text>
            <DatePicker
              style={{ width: "100%" }}
              value={editProjectDueDate ? dayjs(editProjectDueDate) : null}
              onChange={(value) =>
                setEditProjectDueDate(value ? value.format("YYYY-MM-DD") : "")
              }
            />
          </Space>
        </Space>
      </Modal>
    </Space>
  );
}
