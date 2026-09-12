import { Router, Response } from 'express';
import { db } from '../db.js';
import { authenticate, requireRole, AuthenticatedRequest } from '../auth.js';

const router = Router();

router.get('/', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const { projectId, teamId, status, priority, assigneeId } = req.query as Record<string, string>;
  const tasks = db.getTasks({ projectId, teamId, status, priority, assigneeId });
  res.json({ tasks });
});

router.get('/:id', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const task = db.getTaskById(req.params.id);
  if (!task) {
    res.status(404).json({ error: 'Task not found.' });
    return;
  }
  const comments = db.getComments(task.id);
  res.json({ task, comments });
});

router.post('/', authenticate, requireRole(['OWNER', 'ADMIN', 'DEVELOPER', 'DESIGNER', 'MEMBER']), (req: AuthenticatedRequest, res: Response): void => {
  const { projectId, teamId, title, description, status, priority, assigneeId, dueDate, estimatedHours, labels, subtasks } = req.body;
  if (!projectId || !teamId || !title) {
    res.status(400).json({ error: 'projectId, teamId, and title are required.' });
    return;
  }

  const task = db.createTask({
    projectId,
    teamId,
    title,
    description: description || '',
    status: status || 'TODO',
    priority: priority || 'MEDIUM',
    assigneeId: assigneeId || null,
    creatorId: req.user!.id,
    dueDate: dueDate || new Date(Date.now() + 7 * 86400000).toISOString(),
    estimatedHours: Number(estimatedHours) || 0,
    actualHours: 0,
    labels: Array.isArray(labels) ? labels : [],
    subtasks: Array.isArray(subtasks) ? subtasks : []
  });

  if (assigneeId && assigneeId !== req.user!.id) {
    db.addNotification({
      userId: assigneeId,
      title: 'New Task Assigned',
      message: `${req.user!.fullName} assigned you task: "${task.title}"`,
      type: 'TASK_ASSIGNED',
      read: false,
      link: '/tasks'
    });
  }

  res.status(201).json({ task });
});

router.patch('/:id', authenticate, requireRole(['OWNER', 'ADMIN', 'DEVELOPER', 'DESIGNER', 'MEMBER']), (req: AuthenticatedRequest, res: Response): void => {
  const { title, description, status, priority, assigneeId, dueDate, estimatedHours, actualHours, labels } = req.body;
  const existing = db.getTaskById(req.params.id);
  if (!existing) {
    res.status(404).json({ error: 'Task not found.' });
    return;
  }

  const updated = db.updateTask(req.params.id, {
    ...(title ? { title } : {}),
    ...(description !== undefined ? { description } : {}),
    ...(status ? { status } : {}),
    ...(priority ? { priority } : {}),
    ...(assigneeId !== undefined ? { assigneeId } : {}),
    ...(dueDate ? { dueDate } : {}),
    ...(estimatedHours !== undefined ? { estimatedHours: Number(estimatedHours) } : {}),
    ...(actualHours !== undefined ? { actualHours: Number(actualHours) } : {}),
    ...(labels ? { labels } : {})
  });

  if (assigneeId && assigneeId !== existing.assigneeId && assigneeId !== req.user!.id) {
    db.addNotification({
      userId: assigneeId,
      title: 'Task Assigned',
      message: `${req.user!.fullName} reassigned task "${updated?.title}" to you`,
      type: 'TASK_ASSIGNED',
      read: false,
      link: '/tasks'
    });
  }

  res.json({ task: updated });
});

router.delete('/:id', authenticate, requireRole(['OWNER', 'ADMIN', 'DEVELOPER']), (req: AuthenticatedRequest, res: Response): void => {
  const deleted = db.deleteTask(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: 'Task not found.' });
    return;
  }
  res.json({ success: true });
});

// --- Subtasks ---
router.post('/:id/subtasks', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const { title } = req.body;
  if (!title) {
    res.status(400).json({ error: 'Subtask title is required.' });
    return;
  }
  const subtask = db.addSubtask(req.params.id, title);
  if (!subtask) {
    res.status(404).json({ error: 'Task not found.' });
    return;
  }
  res.status(201).json({ subtask });
});

router.patch('/:id/subtasks/:subtaskId', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const { completed } = req.body;
  const subtask = db.updateSubtask(req.params.id, req.params.subtaskId, !!completed);
  if (!subtask) {
    res.status(404).json({ error: 'Subtask not found.' });
    return;
  }
  res.json({ subtask });
});

router.delete('/:id/subtasks/:subtaskId', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const deleted = db.deleteSubtask(req.params.id, req.params.subtaskId);
  if (!deleted) {
    res.status(404).json({ error: 'Subtask not found.' });
    return;
  }
  res.json({ success: true });
});

// --- Comments ---
router.get('/:id/comments', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const comments = db.getComments(req.params.id);
  res.json({ comments });
});

router.post('/:id/comments', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const { content } = req.body;
  if (!content || !content.trim()) {
    res.status(400).json({ error: 'Comment content cannot be empty.' });
    return;
  }
  const task = db.getTaskById(req.params.id);
  if (!task) {
    res.status(404).json({ error: 'Task not found.' });
    return;
  }

  const comment = db.addComment({
    taskId: task.id,
    userId: req.user!.id,
    authorName: req.user!.fullName,
    authorRole: req.user!.role,
    content: content.trim()
  });

  if (task.assigneeId && task.assigneeId !== req.user!.id) {
    db.addNotification({
      userId: task.assigneeId,
      title: 'New Comment on Task',
      message: `${req.user!.fullName} commented on "${task.title}"`,
      type: 'MENTION',
      read: false,
      link: '/tasks'
    });
  }

  res.status(201).json({ comment });
});

export default router;
