/** Project row shown on the dashboard */
export interface DashboardProject {
  id: string;
  name: string;
  status: string;
  progress: number;
  totalTasks: number;
  doneTasks: number;
}

/** A compact member avatar for project cards */
export interface ProjectMemberAvatar {
  id: string;
  name: string | null;
  avatar: string | null;
}

/** Project row shown in the projects list */
export interface ProjectItem {
  id: string;
  sortOrder: number;
  name: string;
  status: string;
  progress: number;
  members: number;
  memberAvatars: ProjectMemberAvatar[];
  dueDate: string | null;
  canDelete: boolean;
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
