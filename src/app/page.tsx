"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FolderGit2,
  CalendarDays,
  MoreHorizontal,
  CheckCircle,
} from "lucide-react";
import { getProjects } from "@/actions/project";

type DashboardProject = {
  id: string;
  name: string;
  status: string;
  progress: number;
  totalTasks: number;
  doneTasks: number;
};

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<DashboardProject[]>([]);
  const [openMenuProjectId, setOpenMenuProjectId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    let isMounted = true;

    const loadProjects = async () => {
      const dbProjects = await getProjects();

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

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest("[data-project-menu]")) {
        setOpenMenuProjectId(null);
      }
    };

    document.addEventListener("click", handleDocumentClick);

    return () => {
      document.removeEventListener("click", handleDocumentClick);
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
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stats Cards */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">โครงการทั้งหมด</p>
            <h3 className="text-3xl font-bold text-gray-800 mt-1">
              {totalProjects}
            </h3>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <FolderGit2 className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">
              งานที่ต้องทำ (TODO)
            </p>
            <h3 className="text-3xl font-bold text-gray-800 mt-1">
              {totalTodoTasks}
            </h3>
          </div>
          <div className="p-3 bg-orange-50 text-orange-600 rounded-lg">
            <CalendarDays className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">งานเสร็จแล้ว</p>
            <h3 className="text-3xl font-bold text-gray-800 mt-1">
              {totalDoneTasks}
            </h3>
          </div>
          <div className="p-3 bg-emerald-50 text-green-600 rounded-lg">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Projects List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-visible">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-lg text-gray-800">โปรเจคล่าสุด</h3>
          <button className="text-sm text-blue-600 hover:underline font-medium">
            ดูทั้งหมด
          </button>
        </div>

        <div className="divide-y divide-gray-100">
          {projects.map((project) => (
            <div
              key={project.id}
              className="p-6 hover:bg-gray-50 transition-colors flex items-center justify-between"
              onClick={() => router.push(`/projects/${project.id}`)}
            >
              <div className="flex-1">
                <h4 className="text-gray-900 font-medium">{project.name}</h4>
                <div className="flex items-center justify-end w-48 mt-2 md:mt-0 md:justify-start">
                  <span
                    className={`px-2.5 py-1 text-xs font-medium rounded-full mr-4 ${project.progress === 100 ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}
                  >
                    {project.status}
                  </span>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${project.progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              <div className="relative z-50" data-project-menu>
                <button
                  className="p-2 hover:bg-gray-200 rounded-md text-gray-500 transition-colors cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenuProjectId((prev) =>
                      prev === project.id ? null : project.id,
                    );
                  }}
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>
                {openMenuProjectId === project.id && (
                  <div
                    data-project-menu
                    className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1"
                  >
                    <button
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuProjectId(null);
                        router.push(`/projects/${project.id}`);
                      }}
                    >
                      เปิดโปรเจกต์
                    </button>
                    <button
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          await navigator.clipboard.writeText(project.id);
                        } catch {
                          // Ignore clipboard errors in unsupported contexts.
                        }
                        setOpenMenuProjectId(null);
                      }}
                    >
                      คัดลอก Project ID
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
