import { Request, Response, NextFunction } from 'express';
import User from '../models/User.js';
import Session from '../models/Session.js';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        username: string;
      };
    }
  }
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Find valid session
    const session = await Session.findOne({
      token,
      expiresAt: { $gt: new Date() },
    });

    if (!session) {
      return res.status(401).json({ message: 'Invalid or expired session' });
    }

    // Verify user exists
    const user = await User.findById(session.userId);
    if (!user) {
      return res.status(401).json({ message: 'Invalid authentication token' });
    }

    // Add user to request
    req.user = { username: user.username };
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid authentication token' });
  }
}
