import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { generateToken, authenticate, AuthenticatedRequest } from '../auth.js';

const router = Router();

router.post('/register', async (req, res): Promise<void> => {
  try {
    const { email, password, fullName, title, role } = req.body;
    if (!email || !password || !fullName) {
      res.status(400).json({ error: 'Missing required fields: email, password, fullName.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters.' });
      return;
    }

    const existing = db.getUserByEmail(email);
    if (existing) {
      res.status(409).json({ error: 'A user with this email address already exists.' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const assignedRole = (['OWNER', 'ADMIN', 'DEVELOPER', 'DESIGNER', 'MEMBER', 'VIEWER'].includes(role) ? role : 'MEMBER');

    const newUser = db.createUser({
      email,
      fullName,
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`,
      title: title || 'Software Engineer',
      role: assignedRole,
      passwordHash
    });

    const teams = db.getTeams();
    if (teams.length > 0) {
      db.addTeamMember(teams[0].id, newUser.id, assignedRole);
    }

    const token = generateToken(newUser);
    const { passwordHash: _, ...safeUser } = newUser;

    res.status(201).json({
      user: safeUser,
      token
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Registration failed.' });
  }
});

router.post('/login', async (req, res): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const user = db.getUserByEmail(email);
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials. User not found.' });
      return;
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      res.status(401).json({ error: 'Invalid credentials. Incorrect password.' });
      return;
    }

    const token = generateToken(user);
    const { passwordHash: _, ...safeUser } = user;

    res.json({
      user: safeUser,
      token
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Login failed.' });
  }
});

router.post('/firebase-sync', async (req, res): Promise<void> => {
  try {
    const { email, fullName, avatarUrl, firebaseUid } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Email is required.' });
      return;
    }

    let user = db.getUserByEmail(email);
    if (!user) {
      const dummyHash = await bcrypt.hash(firebaseUid || 'google-firebase-user', 10);
      user = db.createUser({
        email,
        fullName: fullName || email.split('@')[0],
        avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`,
        title: 'Cloud Engineer',
        role: 'ADMIN',
        passwordHash: dummyHash
      });

      const teams = db.getTeams();
      if (teams.length > 0) {
        db.addTeamMember(teams[0].id, user.id, 'ADMIN');
      }
    } else {
      user = db.updateUser(user.id, {
        ...(fullName ? { fullName } : {}),
        ...(avatarUrl ? { avatarUrl } : {})
      }) || user;
    }

    const token = generateToken(user);
    const { passwordHash: _, ...safeUser } = user;

    res.json({
      user: safeUser,
      token
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Firebase login sync failed.' });
  }
});

router.get('/me', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized.' });
    return;
  }
  const { passwordHash: _, ...safeUser } = req.user;
  res.json({ user: safeUser });
});

router.patch('/profile', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized.' });
    return;
  }
  const { fullName, title, avatarUrl } = req.body;
  const updated = db.updateUser(req.user.id, {
    ...(fullName ? { fullName } : {}),
    ...(title ? { title } : {}),
    ...(avatarUrl ? { avatarUrl } : {})
  });
  if (!updated) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }
  const { passwordHash: _, ...safeUser } = updated;
  res.json({ user: safeUser });
});

router.get('/seed-accounts', (req, res) => {
  const users = db.getUsers().map(u => ({
    id: u.id,
    email: u.email,
    fullName: u.fullName,
    role: u.role,
    title: u.title,
    avatarUrl: u.avatarUrl
  }));
  res.json({
    accounts: users,
    defaultPassword: 'nexus123!'
  });
});

export default router;
