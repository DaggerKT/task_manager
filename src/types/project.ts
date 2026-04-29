/** Project row shown on the dashboard */
export interface DashboardProject {
  id: string;
  name: string;
  status: string;
  progress: number;
  totalTasks: number;
  doneTasks: number;
}

/** Project row shown in the projects list */
export interface ProjectItem {
  id: string;
  name: string;
  status: string;
  progress: number;
  members: number;
  dueDate: string | null;
}

/** A member of a project team */
export interface ProjectMember {
  id: number;
  name: string;
  role: string;
  avatar: string;
}

/** Project metadata used in the Kanban page header */
export interface ProjectInfo {
  id: string;
  name: string;
  description: string;
  status: string;
  dueDate: string;
}
