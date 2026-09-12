import React, { useState, useEffect } from 'react';
import {
  Kanban,
  Plus,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  Calendar
} from 'lucide-react';
import { Task, Project, TeamMember, TaskStatus, TaskPriority } from '../types';
import { apiRequest } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { FloatingContainer } from '../components/layout/FloatingContainer';

interface KanbanPageProps {
  onSelectTask: (task: Task) => void;
  onOpenNewTask: (projectId?: string) => void;
}

const COLUMNS: Array<{ id: TaskStatus; label: string; color: string; border: string }> = [
  { id: 'BACKLOG', label: 'Backlog', color: 'bg-slate-100 text-slate-700', border: 'border-slate-300' },
  { id: 'TODO', label: 'To Do', color: 'bg-amber-100 text-amber-800', border: 'border-amber-300' },
  { id: 'IN_PROGRESS', label: 'In Progress', color: 'bg-blue-100 text-blue-800', border: 'border-blue-300' },
  { id: 'IN_REVIEW', label: 'In Review', color: 'bg-purple-100 text-purple-800', border: 'border-purple-300' },
  { id: 'BLOCKED', label: 'Blocked', color: 'bg-red-100 text-red-800', border: 'border-red-300' },
  { id: 'COMPLETED', label: 'Completed', color: 'bg-emerald-100 text-emerald-800', border: 'border-emerald-300' }
];

export const KanbanPage: React.FC<KanbanPageProps> = ({ onSelectTask, onOpenNewTask }) => {
  const { activeTeam } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('ALL');

  useEffect(() => {
    loadData();
  }, [activeTeam]);

  const loadData = async () => {
    if (!activeTeam) return;
    try {
      const [taskRes, projRes, memRes] = await Promise.all([
        apiRequest<{ tasks: Task[] }>(`/tasks?teamId=${activeTeam.id}`),
        apiRequest<{ projects: Project[] }>(`/projects?teamId=${activeTeam.id}`),
        apiRequest<{ members: TeamMember[] }>(`/teams/${activeTeam.id}/members`)
      ]);
      setTasks(taskRes.tasks);
      setProjects(projRes.projects);
      setMembers(memRes.members || []);
    } catch (err) {
      console.error('Failed to load kanban data', err);
    }
  };

  const handleMoveStatus = async (task: Task, direction: 'prev' | 'next', e: React.MouseEvent) => {
    e.stopPropagation();
    const order: TaskStatus[] = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'BLOCKED', 'COMPLETED'];
    const currentIndex = order.indexOf(task.status);
    let nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex < 0 || nextIndex >= order.length) return;

    const newStatus = order[nextIndex];
    try {
      await apiRequest(`/tasks/${task.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
      );
    } catch (err) {
      console.error('Failed to move task status', err);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (selectedProjectId !== 'ALL' && t.projectId !== selectedProjectId) return false;
    if (selectedPriority !== 'ALL' && t.priority !== selectedPriority) return false;
    if (selectedAssignee !== 'ALL' && t.assigneeId !== selectedAssignee) return false;
    return true;
  });

  return (
    <div className="p-6 max-w-full space-y-6 relative perspective-1000">
      {/* Header wrapped in FloatingContainer */}
      <FloatingContainer
        id="kanban-header-container"
        floatDistance={3}
        floatDuration={5.6}
        hoverElevation={true}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-slate-900 flex items-center space-x-2">
              <Kanban className="w-5 h-5 text-blue-600" />
              <span>Kanban Board</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time status columns, priority flags, and sprint progression.
            </p>
          </div>

          <button
            onClick={() => onOpenNewTask()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </button>
        </div>
      </FloatingContainer>

      {/* Filter Bar with Ambient Float */}
      <div className="bg-white/95 backdrop-blur-sm p-3 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-3 ambient-float-slow card-depth-3d">
        <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-semibold">
          <Filter className="w-3.5 h-3.5" />
          <span>Filters:</span>
        </div>

        <select
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="ALL">All Projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <select
          value={selectedPriority}
          onChange={(e) => setSelectedPriority(e.target.value)}
          className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="ALL">All Priorities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
        </select>

        <select
          value={selectedAssignee}
          onChange={(e) => setSelectedAssignee(e.target.value)}
          className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="ALL">All Assignees</option>
          {members.map((m) => (
            <option key={m.userId} value={m.userId}>
              {m.user?.fullName || m.userId}
            </option>
          ))}
        </select>

        <span className="text-xs text-slate-400 ml-auto">
          Showing {filteredTasks.length} of {tasks.length} tasks
        </span>
      </div>

      {/* 6 Kanban Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => {
          const colTasks = filteredTasks.filter((t) => t.status === col.id);

          return (
            <div
              key={col.id}
              className="bg-slate-50/70 rounded-2xl border border-slate-200/80 p-3 flex flex-col min-h-[580px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${col.color}`}>
                    {col.label}
                  </span>
                  <span className="text-xs font-bold text-slate-400">{colTasks.length}</span>
                </div>

                <button
                  onClick={() => onOpenNewTask()}
                  className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-md transition-colors"
                  title="Add Task to this column"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Tasks in Column */}
              <div className="space-y-3 flex-1 overflow-y-auto pr-0.5">
                {colTasks.length === 0 ? (
                  <div className="h-28 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-[11px] text-slate-400">
                    No tasks
                  </div>
                ) : (
                  colTasks.map((task) => {
                    const assignee = members.find((m) => m.userId === task.assigneeId);
                    const subtasksCompleted = task.subtasks.filter((s) => s.completed).length;

                    return (
                      <div
                        key={task.id}
                        onClick={() => onSelectTask(task)}
                        className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs hover:shadow-md hover:border-blue-400 transition-all cursor-pointer group space-y-2.5"
                      >
                        {/* Priority & Move Actions */}
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                              task.priority === 'URGENT'
                                ? 'bg-red-100 text-red-700'
                                : task.priority === 'HIGH'
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {task.priority}
                          </span>

                          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => handleMoveStatus(task, 'prev', e)}
                              className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                              title="Move Left"
                            >
                              <ArrowLeft className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => handleMoveStatus(task, 'next', e)}
                              className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                              title="Move Right"
                            >
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Title */}
                        <h4 className="text-xs font-semibold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                          {task.title}
                        </h4>

                        {/* Labels */}
                        {task.labels?.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {task.labels.slice(0, 3).map((l) => (
                              <span
                                key={l}
                                className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600"
                              >
                                #{l}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Card Footer: Subtasks, Due Date, Assignee */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                          <div className="flex items-center space-x-2">
                            {task.subtasks.length > 0 && (
                              <span className="flex items-center space-x-0.5">
                                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                <span>
                                  {subtasksCompleted}/{task.subtasks.length}
                                </span>
                              </span>
                            )}
                            {task.estimatedHours > 0 && (
                              <span className="flex items-center space-x-0.5">
                                <Clock className="w-3 h-3" />
                                <span>{task.estimatedHours}h</span>
                              </span>
                            )}
                          </div>

                          {assignee?.user ? (
                            <img
                              src={assignee.user.avatarUrl}
                              alt={assignee.user.fullName}
                              title={assignee.user.fullName}
                              className="w-5 h-5 rounded-full border border-slate-200 object-cover"
                            />
                          ) : (
                            <span className="text-[10px] italic text-slate-300">Unassigned</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
