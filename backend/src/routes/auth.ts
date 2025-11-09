import express, { Request, Response } from 'express';
import crypto from 'crypto';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Session from '../models/Session.js';

const router = express.Router();

// Helper function to generate secure session token
function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Helper function to create a session
async function createSession(userId: string): Promise<string> {
  const token = generateSessionToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

  await Session.create({
    userId,
    token,
    expiresAt,
  });

  return token;
}

// Register new user
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, passwordHash } = req.body;

    if (!username || !passwordHash) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ username: username.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: 'Username already exists' });
    }

    // Hash the client-provided hash with SHA256
    const serverHash = crypto.createHash('sha256').update(passwordHash).digest('hex');

    // Create new user
    const user = new User({
      username: username.toLowerCase(),
      passwordHash: serverHash,
    });

    await user.save();

    // Generate secure session token
    const token = await createSession((user._id as mongoose.Types.ObjectId).toString());

    res.status(201).json({
      message: 'User registered successfully',
      token,
      username: user.username,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Error registering user', error });
  }
});

// Login user
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, passwordHash } = req.body;

    if (!username || !passwordHash) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Find user
    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Hash the client-provided hash with SHA256
    const serverHash = crypto.createHash('sha256').update(passwordHash).digest('hex');

    // Compare hashes
    if (serverHash !== user.passwordHash) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Generate secure session token
    const token = await createSession((user._id as mongoose.Types.ObjectId).toString());

    res.json({
      message: 'Login successful',
      token,
      username: user.username,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error logging in', error });
  }
});

// Verify token (for protected routes)
router.get('/verify', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // Find valid session
    const session = await Session.findOne({
      token,
      expiresAt: { $gt: new Date() },
    }).populate('userId');

    if (!session) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    // Get user from session
    const user = await User.findById(session.userId);
    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    res.json({
      valid: true,
      username: user.username,
    });
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

// Logout endpoint - invalidate session
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // Delete the session
    await Session.deleteOne({ token });

    res.json({
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Error logging out' });
  }
});

export default router;
