import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export interface UserRecord {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string;
  title: string;
  role: 'OWNER' | 'ADMIN' | 'DEVELOPER' | 'DESIGNER' | 'MEMBER' | 'VIEWER';
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeamRecord {
  id: string;
  name: string;
  slug: string;
  description: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMemberRecord {
  id: string;
  teamId: string;
  userId: string;
  role: 'OWNER' | 'ADMIN' | 'DEVELOPER' | 'DESIGNER' | 'MEMBER' | 'VIEWER';
  joinedAt: string;
}

export interface ProjectRecord {
  id: string;
  teamId: string;
  name: string;
  slug: string;
  description: string;
  status: 'ACTIVE' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'ARCHIVED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  repoUrl: string;
  healthScore: number;
  targetDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubtaskRecord {
  id: string;
  taskId: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

export interface TaskRecord {
  id: string;
  projectId: string;
  teamId: string;
  title: string;
  description: string;
  status: 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'BLOCKED' | 'COMPLETED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assigneeId: string | null;
  creatorId: string;
  dueDate: string;
  estimatedHours: number;
  actualHours: number;
  labels: string[];
  subtasks: SubtaskRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface CommentRecord {
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
  sizeBytes: number;
  storedPath: string;
  uploadedBy: string;
  uploadedAt: string;
  analysisSummary?: any;
}

export interface NotificationRecord {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'TASK_ASSIGNED' | 'MENTION' | 'STATUS_CHANGED' | 'AI_READY' | 'SYSTEM';
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface ActivityLogRecord {
  id: string;
  teamId: string;
  projectId?: string;
  userId?: string;
  userName: string;
  action: string;
  details: string;
  timestamp: string;
}

interface DatabaseSchema {
  users: UserRecord[];
  teams: TeamRecord[];
  teamMembers: TeamMemberRecord[];
  projects: ProjectRecord[];
  tasks: TaskRecord[];
  comments: CommentRecord[];
  files: FileRecord[];
  notifications: NotificationRecord[];
  activityLogs: ActivityLogRecord[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'nexus_os.json');

class DatabaseService {
  private data: DatabaseSchema;
  private sseClients: Set<(data: any) => void> = new Set();

  constructor() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
      } catch {
        this.data = this.createInitialSeed();
        this.save();
      }
    } else {
      this.data = this.createInitialSeed();
      this.save();
    }
  }

  private save() {
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(this.data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  }

  private createInitialSeed(): DatabaseSchema {
    const defaultPasswordHash = bcrypt.hashSync('nexus123!', 10);
    const now = new Date().toISOString();
    const daysAgo = (days: number) => new Date(Date.now() - days * 86400000).toISOString();
    const daysFuture = (days: number) => new Date(Date.now() + days * 86400000).toISOString();

    const users: UserRecord[] = [
      {
        id: 'usr-owner-1',
        email: 'alex.vance@nexus.io',
        fullName: 'Alex Vance',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        title: 'VP of Engineering / Principal Architect',
        role: 'OWNER',
        passwordHash: defaultPasswordHash,
        createdAt: daysAgo(60),
        updatedAt: daysAgo(5)
      },
      {
        id: 'usr-admin-1',
        email: 'sarah.connor@nexus.io',
        fullName: 'Sarah Connor',
        avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
        title: 'Lead Systems Engineer & DevOps',
        role: 'ADMIN',
        passwordHash: defaultPasswordHash,
        createdAt: daysAgo(55),
        updatedAt: daysAgo(10)
      },
      {
        id: 'usr-dev-1',
        email: 'marcus.chen@nexus.io',
        fullName: 'Marcus Chen',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        title: 'Senior Full-Stack Engineer',
        role: 'DEVELOPER',
        passwordHash: defaultPasswordHash,
        createdAt: daysAgo(45),
        updatedAt: daysAgo(2)
      },
      {
        id: 'usr-designer-1',
        email: 'elena.rostova@nexus.io',
        fullName: 'Elena Rostova',
        avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
        title: 'Principal Product & UX Designer',
        role: 'DESIGNER',
        passwordHash: defaultPasswordHash,
        createdAt: daysAgo(40),
        updatedAt: daysAgo(1)
      },
      {
        id: 'usr-member-1',
        email: 'david.kim@nexus.io',
        fullName: 'David Kim',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        title: 'Backend & Data Engineer',
        role: 'MEMBER',
        passwordHash: defaultPasswordHash,
        createdAt: daysAgo(30),
        updatedAt: daysAgo(4)
      }
    ];

    const teamId = 'team-nexus-core';
    const teams: TeamRecord[] = [
      {
        id: teamId,
        name: 'Nexus Core Platform',
        slug: 'nexus-core-platform',
        description: 'Core developer ecosystem, microservices mesh, real-time messaging, and AI orchestration.',
        ownerId: 'usr-owner-1',
        createdAt: daysAgo(60),
        updatedAt: daysAgo(1)
      }
    ];

    const teamMembers: TeamMemberRecord[] = users.map(u => ({
      id: `tm-${u.id}`,
      teamId,
      userId: u.id,
      role: u.role,
      joinedAt: u.createdAt
    }));

    const proj1Id = 'proj-gateway-v2';
    const proj2Id = 'proj-ai-inference';
    const projects: ProjectRecord[] = [
      {
        id: proj1Id,
        teamId,
        name: 'Distributed API Gateway v2',
        slug: 'api-gateway-v2',
        description: 'High-throughput edge reverse proxy with rate limiting, JWT validation, and gRPC downstream routing.',
        status: 'ACTIVE',
        priority: 'HIGH',
        repoUrl: 'https://github.com/expressjs/express',
        healthScore: 92,
        targetDate: daysFuture(14),
        createdAt: daysAgo(25),
        updatedAt: daysAgo(1)
      },
      {
        id: proj2Id,
        teamId,
        name: 'Nexus AI Intelligence Pipeline',
        slug: 'ai-intelligence-pipeline',
        description: 'Gemini-powered task decomposition, automated code reviews, sprint health audits, and anomaly detection.',
        status: 'IN_PROGRESS',
        priority: 'URGENT',
        repoUrl: 'https://github.com/pallets/flask',
        healthScore: 84,
        targetDate: daysFuture(21),
        createdAt: daysAgo(20),
        updatedAt: now
      }
    ];

    const tasks: TaskRecord[] = [
      {
        id: 'tsk-101',
        projectId: proj1Id,
        teamId,
        title: 'Implement sliding window rate limiting via Redis token bucket',
        description: 'Prevent client resource exhaustion with a distributed 100 req/min sliding window algorithm. Return standard RFC 6585 headers (Retry-After, X-RateLimit-Remaining).',
        status: 'COMPLETED',
        priority: 'HIGH',
        assigneeId: 'usr-dev-1',
        creatorId: 'usr-owner-1',
        dueDate: daysAgo(2),
        estimatedHours: 12,
        actualHours: 10.5,
        labels: ['backend', 'security', 'redis'],
        subtasks: [
          { id: 'sub-1', taskId: 'tsk-101', title: 'Write Redis Lua script for atomic sliding window', completed: true, createdAt: daysAgo(5) },
          { id: 'sub-2', taskId: 'tsk-101', title: 'Add express rate-limit middleware with IP & User ID keying', completed: true, createdAt: daysAgo(4) },
          { id: 'sub-3', taskId: 'tsk-101', title: 'Load test with autocannon under 2000 concurrent conns', completed: true, createdAt: daysAgo(3) }
        ],
        createdAt: daysAgo(6),
        updatedAt: daysAgo(2)
      },
      {
        id: 'tsk-102',
        projectId: proj1Id,
        teamId,
        title: 'Audit and harden JWT refresh token revocation table',
        description: 'Ensure compromised refresh tokens can be immediately blacklisted in PostgreSQL with cryptographic fingerprinting.',
        status: 'IN_PROGRESS',
        priority: 'URGENT',
        assigneeId: 'usr-admin-1',
        creatorId: 'usr-owner-1',
        dueDate: daysFuture(3),
        estimatedHours: 8,
        actualHours: 4.5,
        labels: ['security', 'auth', 'database'],
        subtasks: [
          { id: 'sub-4', taskId: 'tsk-102', title: 'Design revoked_tokens schema with auto-expiring TTL index', completed: true, createdAt: daysAgo(2) },
          { id: 'sub-5', taskId: 'tsk-102', title: 'Implement constant-time hash comparison for tokens', completed: false, createdAt: daysAgo(2) }
        ],
        createdAt: daysAgo(3),
        updatedAt: now
      },
      {
        id: 'tsk-103',
        projectId: proj2Id,
        teamId,
        title: 'Connect Gemini 3.8 Flash model for automated PR code reviews',
        description: 'Hook into GitHub webhook payloads to trigger server-side Gemini code summaries, spotting OWASP vulnerabilities and edge cases.',
        status: 'IN_REVIEW',
        priority: 'HIGH',
        assigneeId: 'usr-dev-1',
        creatorId: 'usr-owner-1',
        dueDate: daysFuture(5),
        estimatedHours: 16,
        actualHours: 14,
        labels: ['ai', 'gemini', 'github'],
        subtasks: [
          { id: 'sub-6', taskId: 'tsk-103', title: 'Construct strict developer system instruction prompt', completed: true, createdAt: daysAgo(3) },
          { id: 'sub-7', taskId: 'tsk-103', title: 'Handle multi-file diff chunking within token budget', completed: true, createdAt: daysAgo(2) },
          { id: 'sub-8', taskId: 'tsk-103', title: 'Format review suggestions into actionable Markdown checklist', completed: false, createdAt: daysAgo(1) }
        ],
        createdAt: daysAgo(5),
        updatedAt: daysAgo(1)
      },
      {
        id: 'tsk-104',
        projectId: proj2Id,
        teamId,
        title: 'Build automated CSV statistical analysis & correlation matrix',
        description: 'Integrate Python processor script to extract mean, variance, quartiles, and correlation coefficient across sprint metrics.',
        status: 'COMPLETED',
        priority: 'MEDIUM',
        assigneeId: 'usr-member-1',
        creatorId: 'usr-admin-1',
        dueDate: daysAgo(1),
        estimatedHours: 10,
        actualHours: 9,
        labels: ['python', 'analytics', 'data'],
        subtasks: [
          { id: 'sub-9', taskId: 'tsk-104', title: 'Write standard library statistical calculations', completed: true, createdAt: daysAgo(4) },
          { id: 'sub-10', taskId: 'tsk-104', title: 'Create interactive Recharts visualization in UI', completed: true, createdAt: daysAgo(2) }
        ],
        createdAt: daysAgo(5),
        updatedAt: daysAgo(1)
      },
      {
        id: 'tsk-105',
        projectId: proj1Id,
        teamId,
        title: 'Design high-density Kanban board with touch & keyboard accessibility',
        description: 'Implement intuitive status column transitions, priority badges, keyboard shortcuts, and instant state synchronization.',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        assigneeId: 'usr-designer-1',
        creatorId: 'usr-owner-1',
        dueDate: daysFuture(7),
        estimatedHours: 14,
        actualHours: 8,
        labels: ['frontend', 'ui/ux', 'accessibility'],
        subtasks: [
          { id: 'sub-11', taskId: 'tsk-105', title: 'Ensure WCAG AA contrast for status chips', completed: true, createdAt: daysAgo(2) },
          { id: 'sub-12', taskId: 'tsk-105', title: 'Add quick-action task creation modal', completed: true, createdAt: daysAgo(1) },
          { id: 'sub-13', taskId: 'tsk-105', title: 'Test responsive tablet and mobile collapse view', completed: false, createdAt: now }
        ],
        createdAt: daysAgo(4),
        updatedAt: now
      },
      {
        id: 'tsk-106',
        projectId: proj2Id,
        teamId,
        title: 'Implement DevLab cryptographic hash generator and JWT debugger',
        description: 'Provide developer utility tools running safely in client and gateway without leaking payloads to external services.',
        status: 'COMPLETED',
        priority: 'LOW',
        assigneeId: 'usr-dev-1',
        creatorId: 'usr-admin-1',
        dueDate: daysAgo(3),
        estimatedHours: 6,
        actualHours: 5,
        labels: ['devlab', 'tools'],
        subtasks: [
          { id: 'sub-14', taskId: 'tsk-106', title: 'Implement JWT signature header/claims decoder', completed: true, createdAt: daysAgo(4) },
          { id: 'sub-15', taskId: 'tsk-106', title: 'Add SHA-256 and MD5 hash calculator with copy action', completed: true, createdAt: daysAgo(3) }
        ],
        createdAt: daysAgo(5),
        updatedAt: daysAgo(3)
      }
    ];

    const comments: CommentRecord[] = [
      {
        id: 'cmt-1',
        taskId: 'tsk-102',
        userId: 'usr-owner-1',
        authorName: 'Alex Vance',
        authorRole: 'OWNER',
        content: 'Please verify that token revocation hits the Redis cache first before touching the PostgreSQL read replica.',
        createdAt: daysAgo(2)
      },
      {
        id: 'cmt-2',
        taskId: 'tsk-102',
        userId: 'usr-admin-1',
        authorName: 'Sarah Connor',
        authorRole: 'ADMIN',
        content: 'Confirmed. Added an in-memory Bloom filter backed by Redis SET with a 7-day TTL.',
        createdAt: daysAgo(1)
      },
      {
        id: 'cmt-3',
        taskId: 'tsk-103',
        userId: 'usr-dev-1',
        authorName: 'Marcus Chen',
        authorRole: 'DEVELOPER',
        content: 'Gemini 3.8 Flash latency is averaging ~380ms for a 200-line diff. Working smoothly!',
        createdAt: daysAgo(1)
      }
    ];

    const notifications: NotificationRecord[] = [
      {
        id: 'notif-1',
        userId: 'usr-owner-1',
        title: 'Task Assigned',
        message: 'Sarah Connor tagged you on JWT refresh token revocation table.',
        type: 'MENTION',
        read: false,
        link: '/tasks',
        createdAt: daysAgo(1)
      },
      {
        id: 'notif-2',
        userId: 'usr-owner-1',
        title: 'Project Health Update',
        message: 'Distributed API Gateway v2 health score increased to 92/100.',
        type: 'SYSTEM',
        read: true,
        link: '/projects',
        createdAt: daysAgo(2)
      },
      {
        id: 'notif-3',
        userId: 'usr-owner-1',
        title: 'AI Analysis Complete',
        message: 'Sprint risk report for Nexus AI Intelligence Pipeline is ready for review.',
        type: 'AI_READY',
        read: false,
        link: '/ai-assistant',
        createdAt: now
      }
    ];

    const activityLogs: ActivityLogRecord[] = [
      {
        id: 'act-1',
        teamId,
        projectId: proj1Id,
        userId: 'usr-dev-1',
        userName: 'Marcus Chen',
        action: 'TASK_COMPLETED',
        details: 'Marked "Implement sliding window rate limiting via Redis" as COMPLETED',
        timestamp: daysAgo(2)
      },
      {
        id: 'act-2',
        teamId,
        projectId: proj2Id,
        userId: 'usr-member-1',
        userName: 'David Kim',
        action: 'CSV_ANALYSIS',
        details: 'Analyzed sprint_metrics.csv with Python statistical engine',
        timestamp: daysAgo(1)
      },
      {
        id: 'act-3',
        teamId,
        projectId: proj1Id,
        userId: 'usr-admin-1',
        userName: 'Sarah Connor',
        action: 'SECURITY_UPDATE',
        details: 'Updated JWT revocation blacklist table schema',
        timestamp: now
      }
    ];

    return {
      users,
      teams,
      teamMembers,
      projects,
      tasks,
      comments,
      files: [],
      notifications,
      activityLogs
    };
  }

  // --- SSE Realtime Emitter ---
  public subscribeSSE(client: (data: any) => void) {
    this.sseClients.add(client);
  }

  public unsubscribeSSE(client: (data: any) => void) {
    this.sseClients.delete(client);
  }

  public broadcast(event: string, payload: any) {
    const message = { event, data: payload, timestamp: new Date().toISOString() };
    for (const client of this.sseClients) {
      try {
        client(message);
      } catch {
        this.sseClients.delete(client);
      }
    }
  }

  // --- Users ---
  public getUsers() {
    return this.data.users;
  }

  public getUserById(id: string) {
    return this.data.users.find(u => u.id === id);
  }

  public getUserByEmail(email: string) {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public createUser(user: Omit<UserRecord, 'id' | 'createdAt' | 'updatedAt'>) {
    const newUser: UserRecord = {
      ...user,
      id: `usr-${crypto.randomUUID()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.users.push(newUser);
    this.save();
    return newUser;
  }

  public updateUser(id: string, updates: Partial<Omit<UserRecord, 'id' | 'createdAt'>>) {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx === -1) return null;
    this.data.users[idx] = {
      ...this.data.users[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.save();
    return this.data.users[idx];
  }

  // --- Teams ---
  public getTeams() {
    return this.data.teams;
  }

  public getTeamById(id: string) {
    return this.data.teams.find(t => t.id === id);
  }

  public getTeamMembers(teamId: string) {
    return this.data.teamMembers
      .filter(tm => tm.teamId === teamId)
      .map(tm => {
        const user = this.getUserById(tm.userId);
        return {
          ...tm,
          user: user ? {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            avatarUrl: user.avatarUrl,
            title: user.title,
            role: tm.role
          } : null
        };
      });
  }

  public addTeamMember(teamId: string, userId: string, role: TeamMemberRecord['role'] = 'MEMBER') {
    const existing = this.data.teamMembers.find(tm => tm.teamId === teamId && tm.userId === userId);
    if (existing) {
      existing.role = role;
      this.save();
      return existing;
    }
    const newMember: TeamMemberRecord = {
      id: `tm-${crypto.randomUUID()}`,
      teamId,
      userId,
      role,
      joinedAt: new Date().toISOString()
    };
    this.data.teamMembers.push(newMember);
    this.save();
    return newMember;
  }

  public updateTeamMemberRole(teamId: string, userId: string, role: TeamMemberRecord['role']) {
    const member = this.data.teamMembers.find(tm => tm.teamId === teamId && tm.userId === userId);
    if (!member) return null;
    member.role = role;
    this.save();
    return member;
  }

  public removeTeamMember(teamId: string, userId: string) {
    const idx = this.data.teamMembers.findIndex(tm => tm.teamId === teamId && tm.userId === userId);
    if (idx === -1) return false;
    this.data.teamMembers.splice(idx, 1);
    this.save();
    return true;
  }

  // --- Projects ---
  public getProjects(teamId?: string) {
    if (teamId) {
      return this.data.projects.filter(p => p.teamId === teamId);
    }
    return this.data.projects;
  }

  public getProjectById(id: string) {
    return this.data.projects.find(p => p.id === id);
  }

  public createProject(project: Omit<ProjectRecord, 'id' | 'healthScore' | 'createdAt' | 'updatedAt'>) {
    const newProject: ProjectRecord = {
      ...project,
      id: `proj-${crypto.randomUUID()}`,
      healthScore: 100,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.projects.push(newProject);
    this.logActivity(newProject.teamId, newProject.id, project.name, 'PROJECT_CREATED', `Created new project "${project.name}"`);
    this.save();
    this.broadcast('project_created', newProject);
    return newProject;
  }

  public updateProject(id: string, updates: Partial<Omit<ProjectRecord, 'id' | 'createdAt'>>) {
    const idx = this.data.projects.findIndex(p => p.id === id);
    if (idx === -1) return null;
    this.data.projects[idx] = {
      ...this.data.projects[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.save();
    this.broadcast('project_updated', this.data.projects[idx]);
    return this.data.projects[idx];
  }

  public deleteProject(id: string) {
    const idx = this.data.projects.findIndex(p => p.id === id);
    if (idx === -1) return false;
    const proj = this.data.projects[idx];
    this.data.projects.splice(idx, 1);
    // Delete associated tasks
    this.data.tasks = this.data.tasks.filter(t => t.projectId !== id);
    this.save();
    this.broadcast('project_deleted', { id });
    return true;
  }

  // --- Tasks ---
  public getTasks(filters?: { projectId?: string; teamId?: string; status?: string; priority?: string; assigneeId?: string }) {
    let result = this.data.tasks;
    if (filters?.projectId) result = result.filter(t => t.projectId === filters.projectId);
    if (filters?.teamId) result = result.filter(t => t.teamId === filters.teamId);
    if (filters?.status) result = result.filter(t => t.status === filters.status);
    if (filters?.priority) result = result.filter(t => t.priority === filters.priority);
    if (filters?.assigneeId) result = result.filter(t => t.assigneeId === filters.assigneeId);
    return result;
  }

  public getTaskById(id: string) {
    return this.data.tasks.find(t => t.id === id);
  }

  public createTask(task: Omit<TaskRecord, 'id' | 'subtasks' | 'createdAt' | 'updatedAt'> & { subtasks?: Array<{ title: string; completed?: boolean }> }) {
    const taskId = `tsk-${crypto.randomUUID()}`;
    const subtaskRecords: SubtaskRecord[] = (task.subtasks || []).map(st => ({
      id: `sub-${crypto.randomUUID()}`,
      taskId,
      title: st.title,
      completed: !!st.completed,
      createdAt: new Date().toISOString()
    }));

    const newTask: TaskRecord = {
      ...task,
      id: taskId,
      subtasks: subtaskRecords,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.tasks.push(newTask);
    this.logActivity(newTask.teamId, newTask.projectId, 'Task Engine', 'TASK_CREATED', `Created task "${newTask.title}"`);
    this.recalculateProjectHealth(newTask.projectId);
    this.save();
    this.broadcast('task_created', newTask);
    return newTask;
  }

  public updateTask(id: string, updates: Partial<Omit<TaskRecord, 'id' | 'createdAt'>>) {
    const idx = this.data.tasks.findIndex(t => t.id === id);
    if (idx === -1) return null;
    const prevStatus = this.data.tasks[idx].status;
    this.data.tasks[idx] = {
      ...this.data.tasks[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    const updated = this.data.tasks[idx];
    if (updates.status && updates.status !== prevStatus) {
      this.logActivity(updated.teamId, updated.projectId, 'Task Engine', 'TASK_STATUS_CHANGED', `Task "${updated.title}" status changed from ${prevStatus} to ${updates.status}`);
      this.recalculateProjectHealth(updated.projectId);
    }
    this.save();
    this.broadcast('task_updated', updated);
    return updated;
  }

  public deleteTask(id: string) {
    const idx = this.data.tasks.findIndex(t => t.id === id);
    if (idx === -1) return false;
    const task = this.data.tasks[idx];
    this.data.tasks.splice(idx, 1);
    this.data.comments = this.data.comments.filter(c => c.taskId !== id);
    this.recalculateProjectHealth(task.projectId);
    this.save();
    this.broadcast('task_deleted', { id, projectId: task.projectId });
    return true;
  }

  public addSubtask(taskId: string, title: string) {
    const task = this.getTaskById(taskId);
    if (!task) return null;
    const subtask: SubtaskRecord = {
      id: `sub-${crypto.randomUUID()}`,
      taskId,
      title,
      completed: false,
      createdAt: new Date().toISOString()
    };
    task.subtasks.push(subtask);
    task.updatedAt = new Date().toISOString();
    this.save();
    this.broadcast('task_updated', task);
    return subtask;
  }

  public updateSubtask(taskId: string, subtaskId: string, completed: boolean) {
    const task = this.getTaskById(taskId);
    if (!task) return null;
    const subtask = task.subtasks.find(st => st.id === subtaskId);
    if (!subtask) return null;
    subtask.completed = completed;
    task.updatedAt = new Date().toISOString();
    this.save();
    this.broadcast('task_updated', task);
    return subtask;
  }

  public deleteSubtask(taskId: string, subtaskId: string) {
    const task = this.getTaskById(taskId);
    if (!task) return false;
    const idx = task.subtasks.findIndex(st => st.id === subtaskId);
    if (idx === -1) return false;
    task.subtasks.splice(idx, 1);
    task.updatedAt = new Date().toISOString();
    this.save();
    this.broadcast('task_updated', task);
    return true;
  }

  // --- Comments ---
  public getComments(taskId: string) {
    return this.data.comments.filter(c => c.taskId === taskId).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  public addComment(comment: Omit<CommentRecord, 'id' | 'createdAt'>) {
    const newComment: CommentRecord = {
      ...comment,
      id: `cmt-${crypto.randomUUID()}`,
      createdAt: new Date().toISOString()
    };
    this.data.comments.push(newComment);
    this.save();
    this.broadcast('comment_added', newComment);
    return newComment;
  }

  // --- Notifications ---
  public getNotifications(userId: string) {
    return this.data.notifications.filter(n => n.userId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public addNotification(notif: Omit<NotificationRecord, 'id' | 'createdAt'>) {
    const newNotif: NotificationRecord = {
      ...notif,
      id: `notif-${crypto.randomUUID()}`,
      createdAt: new Date().toISOString()
    };
    this.data.notifications.unshift(newNotif);
    this.save();
    this.broadcast('notification_received', newNotif);
    return newNotif;
  }

  public markNotificationRead(id: string, userId: string) {
    const n = this.data.notifications.find(item => item.id === id && item.userId === userId);
    if (!n) return false;
    n.read = true;
    this.save();
    return true;
  }

  public markAllNotificationsRead(userId: string) {
    let count = 0;
    for (const n of this.data.notifications) {
      if (n.userId === userId && !n.read) {
        n.read = true;
        count++;
      }
    }
    this.save();
    return count;
  }

  // --- Activity Logs ---
  public getActivityLogs(teamId?: string, projectId?: string, limit = 50) {
    let logs = this.data.activityLogs;
    if (teamId) logs = logs.filter(l => l.teamId === teamId);
    if (projectId) logs = logs.filter(l => l.projectId === projectId);
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, limit);
  }

  public logActivity(teamId: string, projectId: string | undefined, userName: string, action: string, details: string) {
    const record: ActivityLogRecord = {
      id: `act-${crypto.randomUUID()}`,
      teamId,
      projectId,
      userName,
      action,
      details,
      timestamp: new Date().toISOString()
    };
    this.data.activityLogs.unshift(record);
    if (this.data.activityLogs.length > 500) {
      this.data.activityLogs = this.data.activityLogs.slice(0, 500);
    }
    this.save();
    this.broadcast('activity_logged', record);
  }

  // --- Files ---
  public getFiles(teamId?: string, projectId?: string) {
    let files = this.data.files;
    if (teamId) files = files.filter(f => f.teamId === teamId);
    if (projectId) files = files.filter(f => f.projectId === projectId);
    return files.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  }

  public addFile(file: Omit<FileRecord, 'id' | 'uploadedAt'>) {
    const newFile: FileRecord = {
      ...file,
      id: `file-${crypto.randomUUID()}`,
      uploadedAt: new Date().toISOString()
    };
    this.data.files.unshift(newFile);
    this.save();
    return newFile;
  }

  public deleteFile(id: string) {
    const idx = this.data.files.findIndex(f => f.id === id);
    if (idx === -1) return false;
    const file = this.data.files[idx];
    if (fs.existsSync(file.storedPath)) {
      try {
        fs.unlinkSync(file.storedPath);
      } catch {}
    }
    this.data.files.splice(idx, 1);
    this.save();
    return true;
  }

  // --- Project Health Deterministic Calculation ---
  public recalculateProjectHealth(projectId: string): number {
    const project = this.getProjectById(projectId);
    if (!project) return 100;
    const tasks = this.getTasks({ projectId });
    if (tasks.length === 0) {
      project.healthScore = 100;
      this.save();
      return 100;
    }

    let score = 100;
    const now = Date.now();
    let overdueCount = 0;
    let blockedCount = 0;
    let completedCount = 0;

    for (const t of tasks) {
      if (t.status === 'COMPLETED') {
        completedCount++;
      } else {
        if (t.status === 'BLOCKED') blockedCount++;
        if (t.dueDate && new Date(t.dueDate).getTime() < now) overdueCount++;
      }
    }

    const overdueRatio = overdueCount / tasks.length;
    if (overdueRatio > 0.3) score -= 35;
    else if (overdueRatio > 0.1) score -= 15;

    if (blockedCount > 0) {
      score -= Math.min(25, blockedCount * 10);
    }

    const completionRate = completedCount / tasks.length;
    if (completionRate > 0.6) {
      score = Math.min(100, score + 10);
    }

    project.healthScore = Math.max(10, Math.min(100, score));
    this.save();
    return project.healthScore;
  }
}

export const db = new DatabaseService();
