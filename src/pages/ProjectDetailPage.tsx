import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Calendar,
  Github,
  Plus,
  Trash2,
  Bot,
  Activity,
  AlertCircle,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { Project, Task, TeamMember } from '../types';
import { apiRequest } from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface ProjectDetailPageProps {
  projectId: string;
  onBack: () => void;
  onOpenNewTask: (projectId: string) => void;
  onSelectTask: (task: Task) => void;
  onNavigateToRepo: (repoUrl: string) => void;
}

export const ProjectDetailPage: React.FC<ProjectDetailPageProps> = ({
  projectId,
  onBack,
  onOpenNewTask,
  onSelectTask,
  onNavigateToRepo
}) => {
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [healthData, setHealthData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'tasks' | 'health' | 'ai-audit'>('tasks');
  const [aiAuditResult, setAiAuditResult] = useState<any>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);

  useEffect(() => {
    loadProjectDetails();
  }, [projectId]);

  const loadProjectDetails = async () => {
    try {
      const [projRes, healthRes] = await Promise.all([
        apiRequest<{ project: Project; tasks: Task[] }>(`/projects/${projectId}`),
        apiRequest<any>(`/projects/${projectId}/health`)
      ]);
      setProject(projRes.project);
      setTasks(projRes.tasks);
      setHealthData(healthRes);
    } catch (err) {
      console.error('Failed to load project details', err);
    }
  };

  const handleRunAiAudit = async () => {
    setIsAuditing(true);
    setAuditError(null);
    try {
      const res = await apiRequest('/ai/analyze-project', {
        method: 'POST',
        body: JSON.stringify({ projectId })
      });
      setAiAuditResult(res);
      setActiveTab('ai-audit');
    } catch (err: any) {
      setAuditError(err.message || 'AI audit failed.');
    } finally {
      setIsAuditing(false);
    }
  };

  if (!project) {
    return (
      <div className="p-12 text-center text-slate-400 text-xs">
        Loading project specifications...
      </div>
    );
  }

  const completedCount = tasks.filter((t) => t.status === 'COMPLETED').length;
  const completionRate = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 100;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Breadcrumb & Action */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white px-3 py-1.5 rounded-lg border border-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Projects</span>
        </button>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleRunAiAudit}
            disabled={isAuditing}
            className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors"
          >
            <Bot className="w-4 h-4 text-purple-600" />
            <span>{isAuditing ? 'Auditing with Gemini...' : 'Run AI Sprint Audit'}</span>
          </button>

          <button
            onClick={() => onOpenNewTask(project.id)}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Project Overview Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold">
                {project.slug}
              </span>
              <span className="text-slate-300">|</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  project.priority === 'URGENT'
                    ? 'bg-red-100 text-red-700'
                    : project.priority === 'HIGH'
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-blue-100 text-blue-700'
                }`}
              >
                {project.priority} PRIORITY
              </span>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                {project.status}
              </span>
            </div>
            <h1 className="text-xl font-black text-slate-900 mt-2">{project.name}</h1>
            <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">
              {project.description || 'No description provided.'}
            </p>
          </div>

          <div className="flex items-center space-x-4 bg-slate-50 p-4 rounded-xl border border-slate-100 shrink-0">
            <div className="text-center">
              <div className="text-2xl font-black text-slate-900">{project.healthScore}</div>
              <div className="text-[10px] text-slate-400 font-semibold">HEALTH SCORE</div>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div className="text-center">
              <div className="text-2xl font-black text-blue-600">{completionRate}%</div>
              <div className="text-[10px] text-slate-400 font-semibold">COMPLETION</div>
            </div>
          </div>
        </div>

        {/* Metadata Footer */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs text-slate-500">
          <div className="flex items-center space-x-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Target Deadline: {new Date(project.targetDate).toLocaleDateString()}</span>
          </div>

          {project.repoUrl && (
            <div className="flex items-center space-x-1.5 font-mono">
              <Github className="w-3.5 h-3.5 text-slate-700" />
              <button
                onClick={() => onNavigateToRepo(project.repoUrl)}
                className="text-blue-600 hover:underline flex items-center space-x-1"
              >
                <span>{project.repoUrl.replace('https://github.com/', '')}</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200 flex space-x-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'tasks'
              ? 'border-blue-600 text-blue-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Tasks & Workload ({tasks.length})
        </button>

        <button
          onClick={() => setActiveTab('health')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'health'
              ? 'border-blue-600 text-blue-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Health Breakdown
        </button>

        <button
          onClick={() => setActiveTab('ai-audit')}
          className={`pb-3 border-b-2 transition-colors flex items-center space-x-1 ${
            activeTab === 'ai-audit'
              ? 'border-purple-600 text-purple-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Bot className="w-3.5 h-3.5" />
          <span>AI Sprint Audit {aiAuditResult && '✓'}</span>
        </button>
      </div>

      {/* Tab 1: Tasks List */}
      {activeTab === 'tasks' && (
        <div className="space-y-3">
          {tasks.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-400">
              No tasks created yet for this project. Click "+ Add Task" to begin.
            </div>
          ) : (
            tasks.map((t) => (
              <div
                key={t.id}
                onClick={() => onSelectTask(t)}
                className="p-3.5 bg-white rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-xs transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center space-x-3 truncate mr-4">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      t.status === 'COMPLETED'
                        ? 'bg-emerald-500'
                        : t.status === 'BLOCKED'
                        ? 'bg-red-500'
                        : t.status === 'IN_PROGRESS'
                        ? 'bg-blue-500'
                        : 'bg-slate-300'
                    }`}
                  />
                  <span className="font-mono text-[11px] text-slate-400 shrink-0">{t.id}</span>
                  <span className="font-semibold text-xs text-slate-800 truncate group-hover:text-blue-600">
                    {t.title}
                  </span>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      t.priority === 'URGENT'
                        ? 'bg-red-100 text-red-700'
                        : t.priority === 'HIGH'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {t.priority}
                  </span>
                  <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                    {t.status}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {t.subtasks.filter((s) => s.completed).length}/{t.subtasks.length} subtasks
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Health Breakdown */}
      {activeTab === 'health' && healthData && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-xs text-slate-500">Total Tasks</span>
              <div className="text-xl font-black text-slate-900 mt-1">{healthData.totalTasks}</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-xs text-slate-500">Completed</span>
              <div className="text-xl font-black text-emerald-600 mt-1">{healthData.completedTasks}</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-xs text-slate-500">Blocked Tasks</span>
              <div className="text-xl font-black text-red-600 mt-1">{healthData.blockedTasks}</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-xs text-slate-500">Overdue Tasks</span>
              <div className="text-xl font-black text-orange-600 mt-1">{healthData.overdueTasks}</div>
            </div>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 leading-relaxed">
            <strong>Health Score Algorithm:</strong> Calculated using task completion rates, blocked dependencies penalty (-10 per blocker), and overdue deadlines penalty (-15 to -35). Currently evaluated as{' '}
            <strong className="uppercase">{healthData.status}</strong> with a score of {healthData.healthScore}/100.
          </div>
        </div>
      )}

      {/* Tab 3: AI Sprint Audit */}
      {activeTab === 'ai-audit' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          {auditError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span>{auditError}</span>
            </div>
          )}

          {!aiAuditResult && !auditError && (
            <div className="text-center py-8 space-y-3">
              <Bot className="w-10 h-10 text-purple-500 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">No AI Audit Generated Yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Trigger Gemini to evaluate open bottlenecks, technical debt, and tactical action items for this sprint.
              </p>
              <button
                onClick={handleRunAiAudit}
                disabled={isAuditing}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-sm"
              >
                {isAuditing ? 'Auditing...' : 'Run Gemini Project Audit'}
              </button>
            </div>
          )}

          {aiAuditResult && (
            <div className="space-y-5 animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Project Grade:</span>
                  <span className="px-2.5 py-0.5 rounded-md bg-purple-100 text-purple-800 font-black text-sm">
                    {aiAuditResult.projectHealthGrade || 'A'}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">Analyzed by Gemini 3.8 Flash</span>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5">Executive Summary</h4>
                <p className="text-xs text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-200/70 leading-relaxed font-mono">
                  {aiAuditResult.executiveSummary}
                </p>
              </div>

              {aiAuditResult.bottlenecks?.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-red-700 mb-1.5 flex items-center space-x-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                    <span>Identified Risks & Bottlenecks</span>
                  </h4>
                  <ul className="list-disc list-inside text-xs text-slate-700 space-y-1 bg-red-50/50 p-3 rounded-xl border border-red-200">
                    {aiAuditResult.bottlenecks.map((item: string, i: number) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {aiAuditResult.recommendedActions?.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-1.5">
                    Recommended Engineering Actions
                  </h4>
                  <ul className="list-disc list-inside text-xs text-slate-700 space-y-1 bg-emerald-50/50 p-3 rounded-xl border border-emerald-200">
                    {aiAuditResult.recommendedActions.map((item: string, i: number) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {aiAuditResult.technicalDebtAssessment && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5">
                    Technical Debt Assessment
                  </h4>
                  <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    {aiAuditResult.technicalDebtAssessment}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
