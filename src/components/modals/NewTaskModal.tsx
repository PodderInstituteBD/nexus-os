import React, { useState } from 'react';
import { X, Plus, Sparkles, AlertCircle } from 'lucide-react';
import { Project, TeamMember, TaskPriority, TaskStatus } from '../../types';
import { apiRequest } from '../../lib/api';

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  members: TeamMember[];
  currentProjectId?: string;
  onTaskCreated: () => void;
}

export const NewTaskModal: React.FC<NewTaskModalProps> = ({
  isOpen,
  onClose,
  projects,
  members,
  currentProjectId,
  onTaskCreated
}) => {
  const [projectId, setProjectId] = useState(currentProjectId || projects[0]?.id || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [status, setStatus] = useState<TaskStatus>('TODO');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);
  const [estimatedHours, setEstimatedHours] = useState('4');
  const [labelInput, setLabelInput] = useState('');
  const [labels, setLabels] = useState<string[]>(['backend']);
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [subtaskInput, setSubtaskInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDecomposing, setIsDecomposing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddLabel = () => {
    if (labelInput.trim() && !labels.includes(labelInput.trim().toLowerCase())) {
      setLabels([...labels, labelInput.trim().toLowerCase()]);
      setLabelInput('');
    }
  };

  const handleAddSubtask = () => {
    if (subtaskInput.trim()) {
      setSubtasks([...subtasks, subtaskInput.trim()]);
      setSubtaskInput('');
    }
  };

  // AI Task Decomposition right inside the creation modal!
  const handleAiDecompose = async () => {
    if (!title.trim()) {
      setError('Please provide a task title before asking AI to decompose.');
      return;
    }
    setIsDecomposing(true);
    setError(null);
    try {
      const res = await apiRequest<{
        summary: string;
        estimatedTotalHours: number;
        subtasks: Array<{ title: string; estimatedHours: number }>;
        technicalConsiderations: string[];
      }>('/ai/decompose-task', {
        method: 'POST',
        body: JSON.stringify({
          title,
          description,
          projectId
        })
      });

      if (res.subtasks && res.subtasks.length > 0) {
        setSubtasks(res.subtasks.map((st) => st.title));
      }
      if (res.estimatedTotalHours) {
        setEstimatedHours(String(res.estimatedTotalHours));
      }
      if (res.summary && !description) {
        setDescription(res.summary);
      }
    } catch (err: any) {
      setError(err.message || 'AI decomposition unavailable. Ensure GEMINI_API_KEY is configured.');
    } finally {
      setIsDecomposing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !projectId) {
      setError('Task title and target project are required.');
      return;
    }

    const selectedProject = projects.find((p) => p.id === projectId);
    if (!selectedProject) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await apiRequest('/tasks', {
        method: 'POST',
        body: JSON.stringify({
          projectId,
          teamId: selectedProject.teamId,
          title: title.trim(),
          description: description.trim(),
          priority,
          status,
          assigneeId: assigneeId || null,
          dueDate: new Date(dueDate).toISOString(),
          estimatedHours: Number(estimatedHours) || 0,
          labels,
          subtasks: subtasks.map((title) => ({ title, completed: false }))
        })
      });

      onTaskCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Create New Task</h2>
            <p className="text-xs text-slate-500">Define engineering specifications, estimates, and assignees.</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Project & Title */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Project *</label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Task Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="e.g. Implement distributed rate limiting"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Description & AI Decomposition Trigger */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">Description & Requirements</label>
              <button
                type="button"
                onClick={handleAiDecompose}
                disabled={isDecomposing}
                className="inline-flex items-center space-x-1 text-xs font-medium text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-2 py-0.5 rounded-md transition-colors"
                title="Use Gemini to generate subtasks & estimate hours"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span>{isDecomposing ? 'Decomposing...' : 'AI Decompose'}</span>
              </button>
            </div>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Technical specifications, acceptance criteria, or relevant constraints..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>

          {/* Status, Priority, Assignee */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="BACKLOG">Backlog</option>
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="BLOCKED">Blocked</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Assignee</label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.user?.fullName || m.userId} ({m.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dates & Hours */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Estimated Hours</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Subtasks checklist */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Subtasks Checklist</label>
            <div className="flex items-center space-x-2 mb-2">
              <input
                type="text"
                value={subtaskInput}
                onChange={(e) => setSubtaskInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
                placeholder="Add subtask item..."
                className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
              >
                Add
              </button>
            </div>

            {subtasks.length > 0 && (
              <div className="space-y-1 bg-slate-50 p-2 rounded-lg border border-slate-200">
                {subtasks.map((st, i) => (
                  <div key={i} className="flex items-center justify-between text-xs py-1 px-2 rounded bg-white border border-slate-100">
                    <span className="text-slate-800">{st}</span>
                    <button
                      type="button"
                      onClick={() => setSubtasks(subtasks.filter((_, idx) => idx !== i))}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Labels */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tags / Labels</label>
            <div className="flex items-center space-x-2 mb-2">
              <input
                type="text"
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddLabel();
                  }
                }}
                placeholder="e.g. redis, security"
                className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleAddLabel}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-1">
              {labels.map((lbl) => (
                <span
                  key={lbl}
                  className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-mono bg-blue-50 text-blue-700 border border-blue-200"
                >
                  <span>#{lbl}</span>
                  <button
                    type="button"
                    onClick={() => setLabels(labels.filter((l) => l !== lbl))}
                    className="hover:text-blue-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all"
            >
              {isSubmitting ? 'Creating Task...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
