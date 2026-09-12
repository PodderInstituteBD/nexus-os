import { Router, Response } from 'express';
import { db } from '../db.js';
import { authenticate, requireRole, AuthenticatedRequest } from '../auth.js';

const router = Router();

router.get('/', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const teamId = req.query.teamId as string | undefined;
  const projects = db.getProjects(teamId);
  res.json({ projects });
});

router.get('/:id', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const project = db.getProjectById(req.params.id);
  if (!project) {
    res.status(404).json({ error: 'Project not found.' });
    return;
  }
  const tasks = db.getTasks({ projectId: project.id });
  const health = db.recalculateProjectHealth(project.id);
  res.json({ project, tasks, health });
});

router.post('/', authenticate, requireRole(['OWNER', 'ADMIN', 'DEVELOPER', 'DESIGNER']), (req: AuthenticatedRequest, res: Response): void => {
  const { name, teamId, description, priority, repoUrl, targetDate } = req.body;
  if (!name || !teamId) {
    res.status(400).json({ error: 'Project name and teamId are required.' });
    return;
  }
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  const project = db.createProject({
    teamId,
    name,
    slug,
    description: description || '',
    status: 'ACTIVE',
    priority: priority || 'MEDIUM',
    repoUrl: repoUrl || '',
    targetDate: targetDate || new Date(Date.now() + 30 * 86400000).toISOString()
  });

  res.status(201).json({ project });
});

router.patch('/:id', authenticate, requireRole(['OWNER', 'ADMIN', 'DEVELOPER', 'DESIGNER']), (req: AuthenticatedRequest, res: Response): void => {
  const { name, description, status, priority, repoUrl, targetDate } = req.body;
  const updated = db.updateProject(req.params.id, {
    ...(name ? { name } : {}),
    ...(description !== undefined ? { description } : {}),
    ...(status ? { status } : {}),
    ...(priority ? { priority } : {}),
    ...(repoUrl !== undefined ? { repoUrl } : {}),
    ...(targetDate ? { targetDate } : {})
  });
  if (!updated) {
    res.status(404).json({ error: 'Project not found.' });
    return;
  }
  res.json({ project: updated });
});

router.delete('/:id', authenticate, requireRole(['OWNER', 'ADMIN']), (req: AuthenticatedRequest, res: Response): void => {
  const deleted = db.deleteProject(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: 'Project not found.' });
    return;
  }
  res.json({ success: true });
});

router.get('/:id/health', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const project = db.getProjectById(req.params.id);
  if (!project) {
    res.status(404).json({ error: 'Project not found.' });
    return;
  }
  const tasks = db.getTasks({ projectId: project.id });
  const score = db.recalculateProjectHealth(project.id);
  const total = tasks.length;
  const completed = tasks.filter(t => t.status === 'COMPLETED').length;
  const blocked = tasks.filter(t => t.status === 'BLOCKED').length;
  const overdue = tasks.filter(t => t.dueDate && new Date(t.dueDate).getTime() < Date.now() && t.status !== 'COMPLETED').length;

  res.json({
    healthScore: score,
    totalTasks: total,
    completedTasks: completed,
    blockedTasks: blocked,
    overdueTasks: overdue,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 100,
    status: score >= 80 ? 'HEALTHY' : (score >= 60 ? 'NEEDS_ATTENTION' : 'CRITICAL')
  });
});

export default router;
