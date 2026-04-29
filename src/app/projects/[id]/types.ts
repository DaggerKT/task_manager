export interface ProjectMember {
  id: number;
  name: string;
  role: string;
  avatar: string;
}

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
  assignee: string;
  description: string;
  comments: number;
  commentList: TaskComment[];
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

export interface ProjectInfo {
  id: string;
  name: string;
  description: string;
  status: string;
  dueDate: string;
}