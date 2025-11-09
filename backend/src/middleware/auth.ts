import { Request, Response, NextFunction } from 'express';
import User from '../models/User.js';

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

    // Decode token to get username
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [username] = decoded.split(':');

    // Verify user exists
    const user = await User.findOne({ username });
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
