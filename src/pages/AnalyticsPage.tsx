import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Calendar,
  Layers
} from 'lucide-react';
import { Task, Project, ActivityLog } from '../types';
import { apiRequest } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { FloatingContainer } from '../components/layout/FloatingContainer';

export const AnalyticsPage: React.FC = () => {
  const { activeTeam } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  useEffect(() => {
    loadData();
  }, [activeTeam]);

  const loadData = async () => {
    if (!activeTeam) return;
    try {
      const [taskRes, projRes, actRes] = await Promise.all([
        apiRequest<{ tasks: Task[] }>(`/tasks?teamId=${activeTeam.id}`),
        apiRequest<{ projects: Project[] }>(`/projects?teamId=${activeTeam.id}`),
        apiRequest<{ activityLogs?: ActivityLog[] } | ActivityLog[]>(`/analytics?teamId=${activeTeam.id}`)
      ]);
      setTasks(taskRes.tasks || []);
      setProjects(projRes.projects || []);
      const logs = Array.isArray(actRes)
        ? actRes
        : Array.isArray(actRes?.activityLogs)
          ? actRes.activityLogs
          : [];
      setActivityLogs(logs);
    } catch (err) {
      console.error('Failed to load analytics', err);
      setActivityLogs([]);
    }
  };

  const totalEstimated = tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
  const totalActual = tasks.reduce((sum, t) => sum + (t.actualHours || 0), 0);
  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const blockedTasks = tasks.filter((t) => t.status === 'BLOCKED').length;

  const urgentCount = tasks.filter((t) => t.priority === 'URGENT').length;
  const highCount = tasks.filter((t) => t.priority === 'HIGH').length;
  const medCount = tasks.filter((t) => t.priority === 'MEDIUM').length;
  const lowCount = tasks.filter((t) => t.priority === 'LOW').length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 relative perspective-1000">
      {/* Header wrapped in FloatingContainer */}
      <FloatingContainer
        id="analytics-header-container"
        floatDistance={3}
        floatDuration={5.6}
        hoverElevation={true}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-slate-900 flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <span>Sprint Velocity & Engineering Analytics</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Operational telemetry, estimated vs. actual engineering effort, and audit event streams.
            </p>
          </div>
        </div>
      </FloatingContainer>

      {/* KPI Cards with 3D Depth & Ambient Float */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 perspective-1000 ambient-float-slow">
        <div className="bg-white/95 backdrop-blur-sm p-4 rounded-xl border border-slate-200 shadow-sm card-depth-3d">
          <span className="text-xs font-semibold text-slate-500">Estimated Effort</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalEstimated} hrs</div>
          <span className="text-[11px] text-slate-400">Total planned sprint load</span>
        </div>

        <div className="bg-white/95 backdrop-blur-sm p-4 rounded-xl border border-slate-200 shadow-sm card-depth-3d">
          <span className="text-xs font-semibold text-slate-500">Actual Logged Effort</span>
          <div className="text-2xl font-black text-blue-600 mt-1">{totalActual} hrs</div>
          <span className="text-[11px] text-slate-400">
            {totalEstimated > 0 ? `${Math.round((totalActual / totalEstimated) * 100)}% of estimate` : 'No estimates'}
          </span>
        </div>

        <div className="bg-white/95 backdrop-blur-sm p-4 rounded-xl border border-slate-200 shadow-sm card-depth-3d">
          <span className="text-xs font-semibold text-slate-500">Completion Velocity</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {tasks.length > 0 ? `${Math.round((completedTasks / tasks.length) * 100)}%` : '100%'}
          </div>
          <span className="text-[11px] text-slate-400">{completedTasks} of {tasks.length} closed</span>
        </div>

        <div className="bg-white/95 backdrop-blur-sm p-4 rounded-xl border border-slate-200 shadow-sm card-depth-3d">
          <span className="text-xs font-semibold text-slate-500">Blocked Tasks</span>
          <div className="text-2xl font-black text-red-600 mt-1">{blockedTasks}</div>
          <span className="text-[11px] text-slate-400">Active dependencies</span>
        </div>
      </div>

      {/* Breakdown Grids with Dual Ambient Floating Layers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="bg-white/95 backdrop-blur-sm p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 ambient-float-gentle card-depth-3d">
          <h3 className="text-sm font-bold text-slate-900">Task Status Distribution</h3>

          <div className="space-y-3">
            {[
              { label: 'Completed', count: completedTasks, color: 'bg-emerald-500' },
              { label: 'In Progress', count: inProgressTasks, color: 'bg-blue-500' },
              { label: 'Blocked', count: blockedTasks, color: 'bg-red-500' },
              { label: 'Backlog & Todo', count: tasks.length - completedTasks - inProgressTasks - blockedTasks, color: 'bg-slate-400' }
            ].map((item) => {
              const pct = tasks.length > 0 ? Math.round((item.count / tasks.length) * 100) : 0;
              return (
                <div key={item.label}>
                  <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                    <span>{item.label}</span>
                    <span className="font-mono">{item.count} ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Priority Distribution */}
        <div className="bg-white/95 backdrop-blur-sm p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 ambient-float-reverse card-depth-3d">
          <h3 className="text-sm font-bold text-slate-900">Priority Breakdown</h3>

          <div className="space-y-3">
            {[
              { label: 'Urgent', count: urgentCount, color: 'bg-red-500' },
              { label: 'High', count: highCount, color: 'bg-orange-500' },
              { label: 'Medium', count: medCount, color: 'bg-blue-500' },
              { label: 'Low', count: lowCount, color: 'bg-slate-400' }
            ].map((item) => {
              const pct = tasks.length > 0 ? Math.round((item.count / tasks.length) * 100) : 0;
              return (
                <div key={item.label}>
                  <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                    <span>{item.label}</span>
                    <span className="font-mono">{item.count} ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Activity Logs Stream */}
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 ambient-float-slow card-depth-3d">
        <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
          <Activity className="w-4 h-4 text-blue-600" />
          <span>Audit Log Stream</span>
        </h3>

        <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto pr-1">
          {!Array.isArray(activityLogs) || activityLogs.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 italic">No activity recorded yet.</p>
          ) : (
            activityLogs.map((log) => {
              const timeStr = log.timestamp || (log as any).createdAt;
              const dateDisplay = timeStr
                ? new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : 'Just now';
              const entity = (log as any).entityType || log.details || 'Task';
              return (
                <div key={log.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-3">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="font-bold text-slate-800">{log.userName}</span>
                    <span className="text-slate-600">{log.action}</span>
                    <span className="font-mono text-[11px] text-slate-400">({entity})</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {dateDisplay}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
