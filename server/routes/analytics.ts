import { Router, Response } from 'express';
import { db } from '../db.js';
import { authenticate, AuthenticatedRequest } from '../auth.js';

const router = Router();

router.get('/', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const teamId = req.query.teamId as string | undefined;
  const projects = db.getProjects(teamId);
  const tasks = db.getTasks(teamId ? { teamId } : undefined);
  const members = teamId ? db.getTeamMembers(teamId) : [];

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
  const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS').length;
  const blockedTasks = tasks.filter(t => t.status === 'BLOCKED').length;
  const inReviewTasks = tasks.filter(t => t.status === 'IN_REVIEW').length;
  const todoTasks = tasks.filter(t => t.status === 'TODO').length;
  const backlogTasks = tasks.filter(t => t.status === 'BACKLOG').length;

  const now = Date.now();
  const overdueTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate).getTime() < now && t.status !== 'COMPLETED').length;

  // Status breakdown
  const statusBreakdown = [
    { status: 'Completed', count: completedTasks, color: '#10B981' },
    { status: 'In Progress', count: inProgressTasks, color: '#3B82F6' },
    { status: 'In Review', count: inReviewTasks, color: '#8B5CF6' },
    { status: 'Blocked', count: blockedTasks, color: '#EF4444' },
    { status: 'Todo', count: todoTasks, color: '#F59E0B' },
    { status: 'Backlog', count: backlogTasks, color: '#6B7280' }
  ];

  // Priority breakdown
  const priorityBreakdown = [
    { priority: 'Urgent', count: tasks.filter(t => t.priority === 'URGENT').length, color: '#DC2626' },
    { priority: 'High', count: tasks.filter(t => t.priority === 'HIGH').length, color: '#F97316' },
    { priority: 'Medium', count: tasks.filter(t => t.priority === 'MEDIUM').length, color: '#3B82F6' },
    { priority: 'Low', count: tasks.filter(t => t.priority === 'LOW').length, color: '#10B981' }
  ];

  // Member workload breakdown
  const memberWorkload = members.map(m => {
    const assignedTasks = tasks.filter(t => t.assigneeId === m.userId);
    const completed = assignedTasks.filter(t => t.status === 'COMPLETED').length;
    return {
      userId: m.userId,
      name: m.user?.fullName || 'Unknown',
      role: m.role,
      assignedCount: assignedTasks.length,
      completedCount: completed,
      openCount: assignedTasks.length - completed
    };
  });

  // Project health summary
  const projectHealthList = projects.map(p => {
    const projTasks = tasks.filter(t => t.projectId === p.id);
    const score = db.recalculateProjectHealth(p.id);
    return {
      id: p.id,
      name: p.name,
      status: p.status,
      healthScore: score,
      totalTasks: projTasks.length,
      completedTasks: projTasks.filter(t => t.status === 'COMPLETED').length
    };
  });

  const totalHoursEstimated = tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
  const totalHoursActual = tasks.reduce((sum, t) => sum + (t.actualHours || 0), 0);
  const activityLogs = db.getActivityLogs(teamId);

  res.json({
    metrics: {
      totalProjects: projects.length,
      totalTasks,
      completedTasks,
      inProgressTasks,
      blockedTasks,
      overdueTasks,
      overallCompletionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100,
      totalHoursEstimated,
      totalHoursActual
    },
    statusBreakdown,
    priorityBreakdown,
    memberWorkload,
    projectHealthList,
    activityLogs
  });
});

router.get('/activity-logs', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const teamId = req.query.teamId as string | undefined;
  const projectId = req.query.projectId as string | undefined;
  const logs = db.getActivityLogs(teamId, projectId);
  res.json({ activityLogs: logs });
});

export default router;
