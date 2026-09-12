import React, { useState, useEffect } from 'react';
import {
  FolderGit2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  TrendingUp,
  Bot,
  Plus,
  Github,
  ShieldCheck,
  Activity,
  Sparkles
} from 'lucide-react';
import { motion } from 'motion/react';
import { FloatingContainer } from '../components/layout/FloatingContainer';
import { Project, Task, ActivityLog, TeamMember } from '../types';
import { apiRequest } from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface DashboardPageProps {
  onNavigate: (view: string, contextId?: string) => void;
  onOpenNewTask: () => void;
  onOpenNewProject: () => void;
  onSelectTask: (task: Task) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
  onOpenNewTask,
  onOpenNewProject,
  onSelectTask
}) => {
  const { activeTeam, user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [activeTeam]);

  const loadDashboardData = async () => {
    if (!activeTeam) return;
    setIsLoading(false);
    try {
      const [projRes, taskRes, actRes, memRes] = await Promise.all([
        apiRequest<{ projects: Project[] }>(`/projects?teamId=${activeTeam.id}`),
        apiRequest<{ tasks: Task[] }>(`/tasks?teamId=${activeTeam.id}`),
        apiRequest<{ activityLogs?: ActivityLog[] } | ActivityLog[]>(`/analytics?teamId=${activeTeam.id}`),
        apiRequest<{ members: TeamMember[] }>(`/teams/${activeTeam.id}/members`)
      ]);
      setProjects(projRes.projects || []);
      setTasks(taskRes.tasks || []);
      const logs = Array.isArray(actRes)
        ? actRes
        : Array.isArray(actRes?.activityLogs)
          ? actRes.activityLogs
          : [];
      setActivityLogs(logs);
      setMembers(memRes.members || []);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
      setActivityLogs([]);
    }
  };

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const blockedTasks = tasks.filter((t) => t.status === 'BLOCKED').length;
  const overdueTasks = tasks.filter(
    (t) => t.dueDate && new Date(t.dueDate).getTime() < Date.now() && t.status !== 'COMPLETED'
  ).length;

  const urgentTasks = tasks
    .filter((t) => (t.priority === 'URGENT' || t.priority === 'HIGH') && t.status !== 'COMPLETED')
    .slice(0, 5);

  const averageHealth =
    projects.length > 0
      ? Math.round(projects.reduce((acc, p) => acc + (p.healthScore || 100), 0) / projects.length)
      : 100;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 relative perspective-1000">
      {/* Welcome Banner & Quick Actions wrapped in FloatingContainer */}
      <FloatingContainer
        id="dashboard-header-container"
        floatDistance={3}
        floatDuration={6}
        hoverElevation={true}
        withGlow={true}
      >
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4 card-depth-3d">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase rounded-md bg-blue-100 text-blue-700 font-mono">
                ENGINEERING CONTROL CENTER
              </span>
              <span className="text-xs text-slate-400">|</span>
              <span className="text-xs font-semibold text-slate-600">{activeTeam?.name}</span>
            </div>
            <h1 className="text-xl font-black text-slate-900 mt-1">
              Welcome back, {user?.fullName?.split(' ')[0]}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {urgentTasks.length > 0
                ? `You have ${urgentTasks.length} urgent/high priority tasks needing engineering review.`
                : 'All systems operational. No critical sprint blockers detected.'}
            </p>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => onNavigate('gemini-chat')}
              className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-md shadow-purple-500/20 transition-all cursor-pointer transform hover:-translate-y-0.5"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Gemini 3D Copilot</span>
            </button>
            <button
              onClick={() => onNavigate('ai-assistant')}
              className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors border border-purple-200"
            >
              <Bot className="w-4 h-4 text-purple-600" />
              <span>AI Sprint Audit</span>
            </button>
            <button
              onClick={onOpenNewProject}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors"
            >
              <FolderGit2 className="w-4 h-4 text-slate-600" />
              <span>New Project</span>
            </button>
            <button
              onClick={onOpenNewTask}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Task</span>
            </button>
          </div>
        </div>
      </FloatingContainer>

      {/* Metrics Row with 3D Depth Card Stacks and Ambient Float */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 perspective-1000 ambient-float-slow">
        <motion.div
          whileHover={{ y: -4, rotateX: 2, scale: 1.01 }}
          transition={{ duration: 0.2 }}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm card-depth-3d"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Active Projects</span>
            <FolderGit2 className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900">{projects.length}</span>
            <span className="text-[11px] text-slate-400">tracked</span>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -4, rotateX: 2, scale: 1.01 }}
          transition={{ duration: 0.2 }}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm card-depth-3d"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Avg Health Index</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900">{averageHealth}%</span>
            <span className="text-[11px] font-semibold text-emerald-600 flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" />
              Healthy
            </span>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -4, rotateX: 2, scale: 1.01 }}
          transition={{ duration: 0.2 }}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm card-depth-3d"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Tasks In Progress</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900">{inProgressTasks}</span>
            <span className="text-[11px] text-slate-400">of {totalTasks}</span>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -4, rotateX: 2, scale: 1.01 }}
          transition={{ duration: 0.2 }}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm card-depth-3d"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Blockers & Overdue</span>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900">{blockedTasks + overdueTasks}</span>
            <span className="text-[11px] text-red-600 font-semibold">
              {blockedTasks} blocked, {overdueTasks} overdue
            </span>
          </div>
        </motion.div>
      </div>

      {/* Main Grid: Projects & Urgent Workload with Asymmetric Ambient Float */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Active Projects */}
        <div className="lg:col-span-2 space-y-4 ambient-float-gentle">
          <FloatingContainer floatDistance={2} floatDuration={5.5}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                <FolderGit2 className="w-4 h-4 text-blue-600" />
                <span>Active Projects & Health</span>
              </h2>
              <button
                onClick={() => onNavigate('projects')}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center space-x-1 cursor-pointer"
              >
                <span>View All</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </FloatingContainer>

          <div className="space-y-3">
            {projects.map((project) => {
              const projectTasks = tasks.filter((t) => t.projectId === project.id);
              const completedCount = projectTasks.filter((t) => t.status === 'COMPLETED').length;
              const percent =
                projectTasks.length > 0 ? Math.round((completedCount / projectTasks.length) * 100) : 100;

              return (
                <div
                  key={project.id}
                  onClick={() => onNavigate('projects', project.id)}
                  className="p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                          {project.name}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            project.priority === 'URGENT'
                              ? 'bg-red-100 text-red-700'
                              : project.priority === 'HIGH'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {project.priority}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-1">{project.description}</p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <div className="text-right">
                        <div className="text-xs font-bold text-slate-900">{project.healthScore}/100</div>
                        <div className="text-[10px] text-slate-400">Health Index</div>
                      </div>
                      <div
                        className={`w-3 h-3 rounded-full ${
                          project.healthScore >= 80
                            ? 'bg-emerald-500'
                            : project.healthScore >= 60
                            ? 'bg-amber-500'
                            : 'bg-red-500'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                      <span>Task Completion</span>
                      <span className="font-semibold">{completedCount} of {projectTasks.length} ({percent}%)</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  {project.repoUrl && (
                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <div className="flex items-center space-x-1.5 font-mono">
                        <Github className="w-3.5 h-3.5 text-slate-600" />
                        <span className="truncate max-w-xs">{project.repoUrl.replace('https://github.com/', '')}</span>
                      </div>
                      <span className="text-blue-600 group-hover:underline">Open Repository &rarr;</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: High Priority Tasks & Fast Tools */}
        <div className="space-y-6 ambient-float-reverse">
          {/* Urgent Tasks */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <FloatingContainer floatDistance={2} floatDuration={6} delay={0.2}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-1.5">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  <span>Priority Backlog</span>
                </h3>
                <button
                  onClick={() => onNavigate('kanban')}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                >
                  Board &rarr;
                </button>
              </div>
            </FloatingContainer>

            <div className="space-y-2">
              {urgentTasks.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-2">No urgent tasks at this time.</p>
              ) : (
                urgentTasks.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => onSelectTask(t)}
                    className="p-2.5 rounded-lg border border-slate-100 hover:border-slate-300 hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                          t.priority === 'URGENT' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                        }`}
                      >
                        {t.priority}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{t.status}</span>
                    </div>
                    <div className="text-xs font-semibold text-slate-800 mt-1 line-clamp-1">{t.title}</div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5">
                      <span>{t.subtasks.filter((s) => s.completed).length}/{t.subtasks.length} subtasks</span>
                      <span>{t.estimatedHours}h est</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Dev Tools Launcher Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-2xl shadow-md space-y-3">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-blue-500 rounded-lg text-white">
                <Activity className="w-4 h-4" />
              </div>
              <span className="font-bold text-sm">DevLab Sandboxes</span>
            </div>
            <p className="text-xs text-slate-300">
              10 real-time engineer utilities: JWT inspector, Regex engine, SHA-256 Hashes, and SSRF-safe REST proxy.
            </p>
            <button
              onClick={() => onNavigate('devlab')}
              className="w-full py-2 bg-white text-slate-900 hover:bg-slate-100 text-xs font-bold rounded-lg transition-colors shadow-xs"
            >
              Launch DevLab Utilities
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
