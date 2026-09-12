export type UserRole = 'OWNER' | 'ADMIN' | 'DEVELOPER' | 'DESIGNER' | 'MEMBER' | 'VIEWER';
export type Role = UserRole;

export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string;
  title: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface Team {
  id: string;
  name: string;
  slug: string;
  description: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: UserRole;
  joinedAt: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    avatarUrl: string;
    title: string;
    role: UserRole;
  } | null;
}

export type ProjectStatus = 'ACTIVE' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'ARCHIVED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TaskStatus = 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'BLOCKED' | 'COMPLETED';

export interface Project {
  id: string;
  teamId: string;
  name: string;
  slug: string;
  description: string;
  status: ProjectStatus;
  priority: TaskPriority;
  repoUrl: string;
  healthScore: number;
  targetDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  teamId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string | null;
  creatorId: string;
  dueDate: string;
  estimatedHours: number;
  actualHours: number;
  labels: string[];
  subtasks: Subtask[];
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  authorName: string;
  authorRole: string;
  content: string;
  createdAt: string;
}

export interface FileRecord {
  id: string;
  teamId: string;
  projectId?: string;
  originalName: string;
  mimeType: string;
  size: number;
  sizeBytes?: number;
  storedPath?: string;
  uploadedBy: string;
  createdAt: string;
  uploadedAt?: string;
  csvAnalysis?: {
    rowCount: number;
    columnCount: number;
    columns: string[];
    sampleRows: Array<Record<string, any>>;
  } | null;
  analysisSummary?: any;
}

export interface FileItem {
  id: string;
  teamId: string;
  projectId?: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  storedPath: string;
  uploadedBy: string;
  uploadedAt: string;
  analysisSummary?: {
    status?: string;
    file_name?: string;
    total_rows?: number;
    total_columns?: number;
    headers?: string[];
    columns?: Array<{
      name: string;
      total_values: number;
      non_empty: number;
      type: 'numeric' | 'text';
      unique_count: number;
      stats?: {
        count: number;
        mean: number;
        std: number;
        median: number;
        min: number;
        max: number;
        q1: number;
        q3: number;
        skewness: number;
      };
      top_categories?: Array<{ value: string; count: number }>;
    }>;
    correlation_matrix?: Record<string, Record<string, number>>;
    preview?: Array<Record<string, string>>;
    error?: string;
  };
}

export type NotificationType = 'TASK_ASSIGNED' | 'MENTION' | 'STATUS_CHANGED' | 'AI_READY' | 'SYSTEM';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  teamId: string;
  projectId?: string;
  userId?: string;
  userName: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface GitHubRepoData {
  repository: {
    id: number;
    name: string;
    fullName: string;
    description: string;
    htmlUrl: string;
    stars: number;
    forks: number;
    openIssuesCount: number;
    watchersCount: number;
    language: string;
    license?: string;
    defaultBranch: string;
    updatedAt: string;
    pushedAt: string;
  };
  recentCommits: Array<{
    sha: string;
    fullSha: string;
    message: string;
    author: string;
    avatarUrl?: string;
    date: string;
    url: string;
  }>;
  openPullRequests: Array<{
    number: number;
    title: string;
    user: string;
    avatarUrl?: string;
    createdAt: string;
    url: string;
  }>;
  openIssues: Array<{
    number: number;
    title: string;
    user: string;
    avatarUrl?: string;
    createdAt: string;
    commentsCount: number;
    url: string;
  }>;
  contributors: Array<{
    login: string;
    avatarUrl: string;
    contributions: number;
    url: string;
  }>;
  _cached?: boolean;
}

export interface AnalyticsData {
  metrics: {
    totalProjects: number;
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    blockedTasks: number;
    overdueTasks: number;
    overallCompletionRate: number;
    totalHoursEstimated: number;
    totalHoursActual: number;
  };
  statusBreakdown: Array<{ status: string; count: number; color: string }>;
  priorityBreakdown: Array<{ priority: string; count: number; color: string }>;
  memberWorkload: Array<{
    userId: string;
    name: string;
    role: string;
    assignedCount: number;
    completedCount: number;
    openCount: number;
  }>;
  projectHealthList: Array<{
    id: string;
    name: string;
    status: string;
    healthScore: number;
    totalTasks: number;
    completedTasks: number;
  }>;
}
