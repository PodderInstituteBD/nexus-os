import { Router, Response } from 'express';
import { db } from '../db.js';
import { authenticate, requireRole, AuthenticatedRequest } from '../auth.js';

const router = Router();

router.get('/', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const teams = db.getTeams();
  res.json({ teams });
});

router.get('/:id', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const team = db.getTeamById(req.params.id);
  if (!team) {
    res.status(404).json({ error: 'Team not found.' });
    return;
  }
  const members = db.getTeamMembers(team.id);
  res.json({ team, members });
});

router.post('/', authenticate, requireRole(['OWNER', 'ADMIN']), (req: AuthenticatedRequest, res: Response): void => {
  const { name, description } = req.body;
  if (!name) {
    res.status(400).json({ error: 'Team name is required.' });
    return;
  }
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  const newTeam = {
    id: `team-${Date.now()}`,
    name,
    slug,
    description: description || '',
    ownerId: req.user!.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  const teams = db.getTeams();
  teams.push(newTeam);
  db.addTeamMember(newTeam.id, req.user!.id, 'OWNER');
  res.status(201).json({ team: newTeam });
});

router.get('/:id/members', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const members = db.getTeamMembers(req.params.id);
  res.json({ members });
});

router.post('/:id/members', authenticate, requireRole(['OWNER', 'ADMIN']), (req: AuthenticatedRequest, res: Response): void => {
  const { email, role } = req.body;
  if (!email) {
    res.status(400).json({ error: 'User email is required.' });
    return;
  }
  const user = db.getUserByEmail(email);
  if (!user) {
    res.status(404).json({ error: 'No user registered with that email address.' });
    return;
  }
  const member = db.addTeamMember(req.params.id, user.id, role || 'MEMBER');
  db.logActivity(req.params.id, undefined, req.user!.fullName, 'MEMBER_ADDED', `Added ${user.fullName} (${user.email}) with role ${role || 'MEMBER'}`);
  res.status(201).json({ member });
});

router.patch('/:id/members/:userId', authenticate, requireRole(['OWNER', 'ADMIN']), (req: AuthenticatedRequest, res: Response): void => {
  const { role } = req.body;
  if (!role) {
    res.status(400).json({ error: 'Role is required.' });
    return;
  }
  const updated = db.updateTeamMemberRole(req.params.id, req.params.userId, role);
  if (!updated) {
    res.status(404).json({ error: 'Team member not found.' });
    return;
  }
  res.json({ member: updated });
});

router.delete('/:id/members/:userId', authenticate, requireRole(['OWNER', 'ADMIN']), (req: AuthenticatedRequest, res: Response): void => {
  if (req.user!.id === req.params.userId) {
    res.status(400).json({ error: 'Cannot remove yourself from the team.' });
    return;
  }
  const removed = db.removeTeamMember(req.params.id, req.params.userId);
  if (!removed) {
    res.status(404).json({ error: 'Member not found.' });
    return;
  }
  res.json({ success: true });
});

export default router;
