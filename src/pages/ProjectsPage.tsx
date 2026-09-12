import React, { useState, useEffect } from 'react';
import {
  FolderGit2,
  Plus,
  Search,
  Github,
  Calendar,
  ShieldCheck,
  ArrowRight,
  Filter
} from 'lucide-react';
import { Project, Task, ProjectStatus, TaskPriority } from '../types';
import { apiRequest } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { FloatingContainer } from '../components/layout/FloatingContainer';

interface ProjectsPageProps {
  onOpenNewProject: () => void;
  onSelectProject: (projectId: string) => void;
}

export const ProjectsPage: React.FC<ProjectsPageProps> = ({
  onOpenNewProject,
  onSelectProject
}) => {
  const { activeTeam } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');

  useEffect(() => {
    loadData();
  }, [activeTeam]);

  const loadData = async () => {
    if (!activeTeam) return;
    try {
      const [projRes, taskRes] = await Promise.all([
        apiRequest<{ projects: Project[] }>(`/projects?teamId=${activeTeam.id}`),
        apiRequest<{ tasks: Task[] }>(`/tasks?teamId=${activeTeam.id}`)
      ]);
      setProjects(projRes.projects);
      setTasks(taskRes.tasks);
    } catch (err) {
      console.error('Failed to load projects', err);
    }
  };

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || p.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 relative perspective-1000">
      {/* Header wrapped in FloatingContainer */}
      <FloatingContainer
        id="projects-header-container"
        floatDistance={3}
        floatDuration={5.8}
        hoverElevation={true}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-slate-900 flex items-center space-x-2">
              <FolderGit2 className="w-5 h-5 text-blue-600" />
              <span>Engineering Projects</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage microservices, API gateways, inference pipelines, and frontend applications.
            </p>
          </div>

          <button
            onClick={onOpenNewProject}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
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
            placeholder="Search projects by name, description, or stack..."
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
            <option value="ACTIVE">Active</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="ON_HOLD">On Hold</option>
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

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredProjects.map((p) => {
          const projectTasks = tasks.filter((t) => t.projectId === p.id);
          const completedCount = projectTasks.filter((t) => t.status === 'COMPLETED').length;
          const completionRate =
            projectTasks.length > 0 ? Math.round((completedCount / projectTasks.length) * 100) : 100;

          return (
            <div
              key={p.id}
              onClick={() => onSelectProject(p.id)}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-blue-400 transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-base text-slate-900 group-hover:text-blue-600 transition-colors">
                        {p.name}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          p.priority === 'URGENT'
                            ? 'bg-red-100 text-red-700'
                            : p.priority === 'HIGH'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {p.priority}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                      {p.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="flex flex-col items-end shrink-0 ml-3">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs font-black text-slate-900">{p.healthScore}</span>
                      <span className="text-[10px] text-slate-400">/100</span>
                      <div
                        className={`w-2.5 h-2.5 rounded-full ${
                          p.healthScore >= 80
                            ? 'bg-emerald-500'
                            : p.healthScore >= 60
                            ? 'bg-amber-500'
                            : 'bg-red-500'
                        }`}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400">Health Index</span>
                  </div>
                </div>

                {/* Progress */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
                    <span>Task Progress</span>
                    <span className="font-semibold text-slate-700">
                      {completedCount} / {projectTasks.length} tasks ({completionRate}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-300"
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Card Bottom Info */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{new Date(p.targetDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  {p.repoUrl && (
                    <div className="flex items-center space-x-1 font-mono text-slate-600">
                      <Github className="w-3.5 h-3.5" />
                      <span className="truncate max-w-[120px]">{p.repoUrl.replace('https://github.com/', '')}</span>
                    </div>
                  )}
                </div>

                <span className="font-semibold text-blue-600 flex items-center space-x-1 group-hover:translate-x-1 transition-transform">
                  <span>Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
