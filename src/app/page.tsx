"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FolderGit2,
  CalendarDays,
  MoreHorizontal,
  CheckCircle,
} from "lucide-react";
import {
  Button,
  Card,
  Col,
  Dropdown,
  Progress,
  Row,
  Space,
  Statistic,
  Tag,
  Typography,
} from "antd";
import { getProjects } from "@/actions/project";
import type { DashboardProject } from "@/types/project";
import { useLanguage } from "@/contexts/LanguageContext";

export default function DashboardPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [projects, setProjects] = useState<DashboardProject[]>([]);

  useEffect(() => {
    let isMounted = true;

    const loadProjects = async () => {
      const { projects: dbProjects } = await getProjects();

      if (!isMounted) return;

      const mappedProjects: DashboardProject[] = dbProjects.map((project) => {
        const totalTasks = project._count.tasks;
        const doneTasks = project.tasks.length;
        const progress =
          totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

        return {
          id: project.id,
          name: project.name,
          status: project.status,
          progress,
          totalTasks,
          doneTasks,
        };
      });

      setProjects(mappedProjects);
    };

    loadProjects();

    const intervalId = window.setInterval(() => {
      void loadProjects();
    }, 10000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void loadProjects();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const totalProjects = projects.length;
  const totalTodoTasks = projects.reduce((sum, project) => {
    return sum + Math.max(project.totalTasks - project.doneTasks, 0);
  }, 0);
  const totalDoneTasks = projects.reduce((sum, project) => {
    return sum + project.doneTasks;
  }, 0);

  return (
    <Space orientation="vertical" size={20} style={{ width: "100%" }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title={t.dashboard.totalProjects}
              value={totalProjects}
              prefix={<FolderGit2 size={18} />}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title={t.dashboard.todoTasks}
              value={totalTodoTasks}
              prefix={<CalendarDays size={18} />}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title={t.dashboard.doneTasks}
              value={totalDoneTasks}
              prefix={<CheckCircle size={18} />}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={t.dashboard.recentProjects}
        extra={<Button type="link">{t.dashboard.viewAll}</Button>}
      >
        <Space orientation="vertical" size={10} style={{ width: "100%" }}>
          {projects.map((project) => (
            <Card
              key={project.id}
              size="small"
              hoverable
              style={{ borderRadius: 10 }}
              styles={{ body: { padding: 12 } }}
              onClick={() => router.push(`/projects/${project.id}`)}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Typography.Text strong>{project.name}</Typography.Text>
                  <Space
                    orientation="vertical"
                    size={8}
                    style={{ width: "100%", marginTop: 8 }}
                  >
                    <Tag color={project.progress === 100 ? "green" : "blue"}>
                      {project.status}
                    </Tag>
                    <Progress percent={project.progress} size="small" />
                  </Space>
                </div>

                <Dropdown
                  trigger={["click"]}
                  menu={{
                    items: [
                      {
                        key: "open",
                        label: t.dashboard.openProject,
                        onClick: () => router.push(`/projects/${project.id}`),
                      },
                      {
                        key: "copy",
                        label: t.dashboard.copyProjectId,
                        onClick: async () => {
                          try {
                            await navigator.clipboard.writeText(project.id);
                          } catch {
                            // Ignore clipboard errors in unsupported contexts.
                          }
                        },
                      },
                    ],
                  }}
                >
                  <Button
                    type="text"
                    icon={<MoreHorizontal size={18} />}
                    onClick={(e) => e.stopPropagation()}
                  />
                </Dropdown>
              </div>
            </Card>
          ))}
        </Space>
      </Card>
    </Space>
  );
}
