"use client";

import { useEffect, useState, useMemo } from "react";
import { FolderGit2, Plus, Search, MoreVertical, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createProject, deleteProject } from "@/actions/project";
import type { ProjectItem } from "@/types/project";

export default function ProjectsList({
  initialProjects,
}: {
  initialProjects: ProjectItem[];
}) {
  const router = useRouter();
  const [projects, setProjects] = useState(initialProjects);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDueDate, setNewProjectDueDate] = useState("");

  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

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

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;

    // Call Server Action
    const res = await createProject(newProjectName, newProjectDueDate || null);

    if (res.success && res.project) {
      const newProject = {
        id: res.project.id,
        name: res.project.name,
        status: res.project.status,
        progress: 0,
        members: 1, // Simulated for now
        dueDate: res.project.dueDate ? new Date(res.project.dueDate).toISOString() : null,
      };
      setProjects([newProject, ...projects]);
    }

    setIsCreateModalOpen(false);
    setNewProjectName("");
    setNewProjectDueDate("");
  };

  const handleDeleteProject = async (id: string) => {
    if (confirm("คุณแน่ใจหรือไม่ที่จะลบโปรเจคนี้?")) {
       setProjects(projects.filter((p) => p.id !== id));
       await deleteProject(id);
    }
  };
  console.log("Rendering ProjectsList with projects:", projects);
  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">โปรเจคของฉัน</h1>
          <p className="text-sm text-gray-500 mt-1">
            จัดการและติดตามสถานะโปรเจคต่างๆ
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>สร้างโปรเจคใหม่</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center sticky -top-6 z-10">
        <div className="relative w-full sm:w-96">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหาโปรเจค..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setStatusFilter("All")}
            className={`px-4 py-2 ${statusFilter === "All" ? "bg-blue-50 text-blue-700" : "hover:bg-gray-100 text-gray-600"} rounded-lg text-sm font-medium whitespace-nowrap`}
          >
            ทั้งหมด
          </button>
          <button
            onClick={() => setStatusFilter("Active")}
            className={`px-4 py-2 ${statusFilter === "Active" ? "bg-blue-50 text-blue-700" : "hover:bg-gray-100 text-gray-600"} rounded-lg text-sm font-medium whitespace-nowrap`}
          >
            กำลังดำเนินการ (Active)
          </button>
          <button
            onClick={() => setStatusFilter("Done")}
            className={`px-4 py-2 ${statusFilter === "Done" ? "bg-blue-50 text-blue-700" : "hover:bg-gray-100 text-gray-600"} rounded-lg text-sm font-medium whitespace-nowrap`}
          >
            เสร็จสิ้น (Done)
          </button>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
            ไม่พบโปรเจคที่ตรงกับเงื่อนไข
          </div>
        ) : (
          filteredProjects.map((project) => (
            <Link
              href={`/projects/${project.id}`}
              key={project.id}
              className="relative bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-blue-200 transition-all block group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <FolderGit2 className="w-6 h-6" />
                </div>
                <div className="relative">
                  <button
                    className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100"
                    onClick={(e) => {
                      e.preventDefault();
                      setOpenDropdownId(
                        openDropdownId === project.id ? null : project.id,
                      );
                    }}
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                  {openDropdownId === project.id && (
                    <div
                      className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-10"
                      onClick={(e) => e.preventDefault()}
                    >
                      <button
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 rounded-lg"
                        onClick={(e) => {
                          e.preventDefault();
                          handleDeleteProject(project.id);
                        }}
                      >
                        ลบโปรเจค
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                {project.name}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                กำหนดส่ง:{" "}
                {project.dueDate
                  ? new Date(project.dueDate).toLocaleDateString("th-TH", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "ไม่ระบุ"}
              </p>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium text-gray-700">ความคืบหน้า</span>
                  <span className="text-gray-600">{project.progress}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full ${project.progress === 100 ? "bg-green-500" : "bg-blue-600"}`}
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-50 flex justify-between items-center">
                <div className="flex -space-x-2">
                  {[...Array(Math.min(project.members, 3))].map((_, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-xs font-medium text-blue-700"
                    >
                      U{i + 1}
                    </div>
                  ))}
                  {project.members > 3 && (
                    <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600">
                      +{project.members - 3}
                    </div>
                  )}
                </div>
                <span
                  className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                    project.status === "Done"
                      ? "bg-green-100 text-green-700"
                      : project.status === "Planning"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {project.status}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Create Project Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex mt-0 items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                สร้างโปรเจคใหม่
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อโปรเจค <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="เช่น Website Redesign"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  กำหนดส่ง
                </label>
                <input
                  type="date"
                  value={newProjectDueDate}
                  onChange={(e) => setNewProjectDueDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-6">
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleCreateProject}
                  disabled={!newProjectName.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  สร้างโปรเจค
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
