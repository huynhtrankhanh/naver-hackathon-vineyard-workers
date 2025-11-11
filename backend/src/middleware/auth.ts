import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Session from '../models/Session.js';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
      };
    }
  }
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length).trim()
      : undefined;

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
    const user = await User.findById(session.userId as mongoose.Types.ObjectId);
    if (!user) {
      return res.status(401).json({ message: 'Invalid authentication token' });
    }

    // Add user to request
    req.user = { id: (user._id as mongoose.Types.ObjectId).toString(), username: user.username };
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid authentication token' });
  }
}
