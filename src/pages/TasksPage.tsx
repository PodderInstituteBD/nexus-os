import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { Task, Project, TeamMember, TaskStatus, TaskPriority } from '../types';
import { apiRequest } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { FloatingContainer } from '../components/layout/FloatingContainer';

interface TasksPageProps {
  onSelectTask: (task: Task) => void;
  onOpenNewTask: () => void;
}

export const TasksPage: React.FC<TasksPageProps> = ({ onSelectTask, onOpenNewTask }) => {
  const { activeTeam } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');

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
      console.error('Failed to load tasks', err);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 relative perspective-1000">
      {/* Header wrapped in FloatingContainer */}
      <FloatingContainer
        id="tasks-header-container"
        floatDistance={3}
        floatDuration={5.5}
        hoverElevation={true}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-slate-900 flex items-center space-x-2">
              <CheckSquare className="w-5 h-5 text-blue-600" />
              <span>Tasks & Workload Roster</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Full-density task catalog across all active repositories and microservices.
            </p>
          </div>

          <button
            onClick={onOpenNewTask}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </button>
        </div>
      </FloatingContainer>

      {/* Filter & Search Bar with Ambient Float */}
      <div className="bg-white/95 backdrop-blur-sm p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-3 ambient-float-slow card-depth-3d">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks by title, description, or id..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="BACKLOG">Backlog</option>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="BLOCKED">Blocked</option>
            <option value="COMPLETED">Completed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>
      </div>

      {/* High Density Table with Subtle Ambient Float */}
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-sm overflow-hidden ambient-float-gentle card-depth-3d">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Task ID & Title</th>
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Assignee</th>
                <th className="py-3 px-4">Subtasks</th>
                <th className="py-3 px-4">Est / Actual</th>
                <th className="py-3 px-4">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    No matching tasks found.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => {
                  const project = projects.find((p) => p.id === task.projectId);
                  const assignee = members.find((m) => m.userId === task.assigneeId);
                  const subtasksCompleted = task.subtasks.filter((s) => s.completed).length;

                  return (
                    <tr
                      key={task.id}
                      onClick={() => onSelectTask(task)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                    >
                      <td className="py-3 px-4">
                        <div className="font-mono text-[10px] text-slate-400">{task.id}</div>
                        <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {task.title}
                        </div>
                      </td>

                      <td className="py-3 px-4 font-medium text-slate-700">
                        {project?.name || 'Unknown'}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                            task.status === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : task.status === 'BLOCKED'
                              ? 'bg-red-100 text-red-800'
                              : task.status === 'IN_PROGRESS'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {task.status}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            task.priority === 'URGENT'
                              ? 'bg-red-100 text-red-700'
                              : task.priority === 'HIGH'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {task.priority}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        {assignee?.user ? (
                          <div className="flex items-center space-x-2">
                            <img
                              src={assignee.user.avatarUrl}
                              alt={assignee.user.fullName}
                              className="w-5 h-5 rounded-full border border-slate-200 object-cover"
                            />
                            <span className="text-slate-800 font-medium truncate max-w-[100px]">
                              {assignee.user.fullName}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-300 italic text-[11px]">Unassigned</span>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px]">
                        {task.subtasks.length > 0 ? (
                          <span>
                            {subtasksCompleted}/{task.subtasks.length}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px]">
                        <span>{task.estimatedHours}h</span>
                        <span className="text-slate-400"> / </span>
                        <span className="text-slate-500">{task.actualHours}h</span>
                      </td>

                      <td className="py-3 px-4 text-[11px] text-slate-500">
                        {task.dueDate
                          ? new Date(task.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })
                          : '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
