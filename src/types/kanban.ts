// ---------------------------------------------------------------------------
// Legacy types — used by sub-components (ViewTaskModal, TaskCard, etc.)
// ---------------------------------------------------------------------------

export interface TaskComment {
  id: number;
  text: string;
  author: string;
  timestamp: string;
}

export interface Task {
  id: string;
  title: string;
  status: string;
  type: string;
  assignee?: string;
  assignees?: TaskAssignee[];
  description: string;
  comments: number;
  commentList: TaskComment[];
}

export interface TaskAssignee {
  id: string;
  name: string;
  avatar: string;
  avatarUrl: string;
}

export interface Column {
  id: string;
  title: string;
  color: string;
}

export interface ColorOption {
  id: string;
  label: string;
  color: string;
}

// ---------------------------------------------------------------------------
// Board types — used by KanbanBoard and its data pipeline
// ---------------------------------------------------------------------------

export interface RawTeamMember {
  userId?: string;
  id?: string;
  role?: string;
  user?: {
    name?: string | null;
    avatar?: string | null;
    email?: string | null;
    empNo?: string | null;
  } | null;
}

export interface BoardProject {
  name: string;
  status: string;
  description?: string | null;
  teamId: string;
  team?: {
    members?: RawTeamMember[] | null;
  } | null;
}

export interface BoardColumn {
  id: string;
  title: string;
  color: string;
}

export interface BoardComment {
  id: string;
  text: string;
  author: string;
  timestamp: string;
  authorName?: string;
  avatarUrl?: string;
}

export interface BoardTask {
  id: string;
  status: string;
  type: string;
  title: string;
  assignee?: string;
  assignees?: TaskAssignee[];
  description?: string;
  comments?: number;
  commentList?: BoardComment[];
  creatorId?: string;
  creatorName?: string;
  creatorAvatarUrl?: string;
  [key: string]: unknown;
}

export interface BoardMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  avatarUrl: string;
  email?: string;
  empNo?: string;
}

export interface KanbanBoardProps {
  initialProject: BoardProject;
  initialSteps: BoardColumn[];
  initialTasks: BoardTask[];
  currentUserId: string;
}
