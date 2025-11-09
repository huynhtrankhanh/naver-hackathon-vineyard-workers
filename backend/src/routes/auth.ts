import express, { Request, Response } from 'express';
import crypto from 'crypto';
import User from '../models/User.js';

const router = express.Router();

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

    // Generate a simple token (username:timestamp)
    const token = Buffer.from(`${user.username}:${Date.now()}`).toString('base64');

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

    // Generate a simple token
    const token = Buffer.from(`${user.username}:${Date.now()}`).toString('base64');

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

    // Decode token to get username
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [username] = decoded.split(':');

    // Verify user exists
    const user = await User.findOne({ username });
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

export default router;
