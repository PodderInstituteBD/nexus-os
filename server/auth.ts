import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db, UserRecord } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'nexus_super_secret_jwt_key_development_32chars_min';
const TOKEN_EXPIRY = '7d';

export interface AuthPayload {
  userId: string;
  email: string;
  role: UserRecord['role'];
}

export interface AuthenticatedRequest extends Request {
  user?: UserRecord;
}

export function generateToken(user: UserRecord): string {
  const payload: AuthPayload = {
    userId: user.id,
    email: user.email,
    role: user.role
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyToken(token: string): AuthPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthPayload;
  } catch {
    return null;
  }
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required. No bearer token provided.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);
  if (!decoded) {
    res.status(401).json({ error: 'Invalid or expired token.' });
    return;
  }

  const user = db.getUserById(decoded.userId);
  if (!user) {
    res.status(401).json({ error: 'User account no longer exists.' });
    return;
  }

  req.user = user;
  next();
}

export function optionalAuthenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (decoded) {
      const user = db.getUserById(decoded.userId);
      if (user) req.user = user;
    }
  }
  next();
}

export function requireRole(allowedRoles: Array<UserRecord['role']>) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: `Forbidden. Role '${req.user.role}' lacks permissions for this operation. Required: [${allowedRoles.join(', ')}]`
      });
      return;
    }
    next();
  };
}
