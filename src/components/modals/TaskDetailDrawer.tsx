import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  Circle,
  MessageSquare,
  Clock,
  Calendar,
  User,
  Trash2,
  Plus,
  Send,
  AlertTriangle
} from 'lucide-react';
import { Task, Comment, TeamMember, TaskPriority, TaskStatus } from '../../types';
import { apiRequest } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

interface TaskDetailDrawerProps {
  task: Task | null;
  onClose: () => void;
  members: TeamMember[];
  onTaskUpdated: () => void;
  onTaskDeleted: () => void;
}

export const TaskDetailDrawer: React.FC<TaskDetailDrawerProps> = ({
  task,
  onClose,
  members,
  onTaskUpdated,
  onTaskDeleted
}) => {
  const { user } = useAuth();
  const [currentTask, setCurrentTask] = useState<Task | null>(task);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [subtaskTitle, setSubtaskTitle] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setCurrentTask(task);
    if (task) {
      loadTaskAndComments(task.id);
    }
  }, [task]);

  const loadTaskAndComments = async (id: string) => {
    try {
      const data = await apiRequest<{ task: Task; comments: Comment[] }>(`/tasks/${id}`);
      setCurrentTask(data.task);
      setComments(data.comments);
    } catch (err) {
      console.error('Failed to load task details', err);
    }
  };

  if (!currentTask) return null;

  const handleUpdateField = async (updates: Partial<Task>) => {
    try {
      const res = await apiRequest<{ task: Task }>(`/tasks/${currentTask.id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });
      setCurrentTask(res.task);
      onTaskUpdated();
    } catch (err) {
      console.error('Failed to update task', err);
    }
  };

  const handleToggleSubtask = async (subtaskId: string, completed: boolean) => {
    try {
      await apiRequest(`/tasks/${currentTask.id}/subtasks/${subtaskId}`, {
        method: 'PATCH',
        body: JSON.stringify({ completed: !completed })
      });
      loadTaskAndComments(currentTask.id);
      onTaskUpdated();
    } catch (err) {
      console.error('Failed to toggle subtask', err);
    }
  };

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subtaskTitle.trim()) return;
    try {
      await apiRequest(`/tasks/${currentTask.id}/subtasks`, {
        method: 'POST',
        body: JSON.stringify({ title: subtaskTitle.trim() })
      });
      setSubtaskTitle('');
      loadTaskAndComments(currentTask.id);
      onTaskUpdated();
    } catch (err) {
      console.error('Failed to add subtask', err);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isPostingComment) return;
    setIsPostingComment(true);
    try {
      const res = await apiRequest<{ comment: Comment }>(`/tasks/${currentTask.id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: newComment.trim() })
      });
      setComments((prev) => [...prev, res.comment]);
      setNewComment('');
    } catch (err) {
      console.error('Failed to post comment', err);
    } finally {
      setIsPostingComment(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!window.confirm(`Are you sure you want to delete "${currentTask.title}"?`)) return;
    setIsDeleting(true);
    try {
      await apiRequest(`/tasks/${currentTask.id}`, { method: 'DELETE' });
      onTaskDeleted();
      onClose();
    } catch (err) {
      console.error('Failed to delete task', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-xs font-bold text-slate-500">{currentTask.id}</span>
            <span className="text-slate-300">|</span>
            <select
              value={currentTask.status}
              onChange={(e) => handleUpdateField({ status: e.target.value as TaskStatus })}
              className="px-2.5 py-1 text-xs font-semibold rounded-md bg-white border border-slate-300 shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="BACKLOG">Backlog</option>
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="BLOCKED">Blocked</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleDeleteTask}
              disabled={isDeleting}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Delete Task"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Title */}
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-snug">{currentTask.title}</h1>
            <p className="text-xs text-slate-600 mt-2 font-mono whitespace-pre-wrap bg-slate-50 p-3 rounded-lg border border-slate-200/80">
              {currentTask.description || 'No detailed description provided.'}
            </p>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-xs">
            <div>
              <span className="text-slate-400 flex items-center space-x-1 mb-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Priority</span>
              </span>
              <select
                value={currentTask.priority}
                onChange={(e) => handleUpdateField({ priority: e.target.value as TaskPriority })}
                className="w-full font-semibold px-2 py-1 rounded bg-white border border-slate-300"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <div>
              <span className="text-slate-400 flex items-center space-x-1 mb-1">
                <User className="w-3.5 h-3.5" />
                <span>Assignee</span>
              </span>
              <select
                value={currentTask.assigneeId || ''}
                onChange={(e) => handleUpdateField({ assigneeId: e.target.value || null })}
                className="w-full font-medium px-2 py-1 rounded bg-white border border-slate-300"
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.user?.fullName || m.userId}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="text-slate-400 flex items-center space-x-1 mb-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Due Date</span>
              </span>
              <input
                type="date"
                value={currentTask.dueDate ? currentTask.dueDate.split('T')[0] : ''}
                onChange={(e) => handleUpdateField({ dueDate: new Date(e.target.value).toISOString() })}
                className="w-full px-2 py-1 rounded bg-white border border-slate-300"
              />
            </div>

            <div>
              <span className="text-slate-400 flex items-center space-x-1 mb-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Hours (Est / Actual)</span>
              </span>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  step="0.5"
                  value={currentTask.estimatedHours}
                  onChange={(e) => handleUpdateField({ estimatedHours: Number(e.target.value) })}
                  className="w-16 px-1.5 py-1 rounded bg-white border border-slate-300"
                />
                <span className="text-slate-400">/</span>
                <input
                  type="number"
                  step="0.5"
                  value={currentTask.actualHours}
                  onChange={(e) => handleUpdateField({ actualHours: Number(e.target.value) })}
                  className="w-16 px-1.5 py-1 rounded bg-white border border-slate-300"
                />
              </div>
            </div>
          </div>

          {/* Subtasks Checklist */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Subtasks ({currentTask.subtasks.filter((s) => s.completed).length}/{currentTask.subtasks.length})
              </span>
            </div>

            <div className="space-y-1.5">
              {currentTask.subtasks.map((st) => (
                <div
                  key={st.id}
                  onClick={() => handleToggleSubtask(st.id, st.completed)}
                  className="flex items-center space-x-2.5 p-2 rounded-lg hover:bg-slate-50 border border-slate-100 cursor-pointer transition-colors"
                >
                  {st.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-300 shrink-0" />
                  )}
                  <span
                    className={`text-xs ${
                      st.completed ? 'line-through text-slate-400' : 'text-slate-800 font-medium'
                    }`}
                  >
                    {st.title}
                  </span>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddSubtask} className="flex items-center space-x-2 mt-2">
              <input
                type="text"
                value={subtaskTitle}
                onChange={(e) => setSubtaskTitle(e.target.value)}
                placeholder="Add subtask..."
                className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </form>
          </div>

          {/* Comments Discussion Thread */}
          <div className="pt-4 border-t border-slate-200">
            <div className="flex items-center space-x-2 mb-3">
              <MessageSquare className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Activity & Discussion ({comments.length})
              </span>
            </div>

            <div className="space-y-3 mb-4">
              {comments.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-2">No comments yet. Start the discussion below.</p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-bold text-slate-800">
                        {c.authorName} <span className="font-mono text-slate-400 font-normal">({c.authorRole})</span>
                      </span>
                      <span className="text-slate-400">
                        {new Date(c.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 whitespace-pre-wrap">{c.content}</p>
                  </div>
                ))
              )}
            </div>

            {/* Post Comment Input */}
            <form onSubmit={handlePostComment} className="flex items-end space-x-2">
              <textarea
                rows={2}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={`Leave a comment as ${user?.fullName}...`}
                className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
              <button
                type="submit"
                disabled={isPostingComment || !newComment.trim()}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50 flex items-center space-x-1"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
