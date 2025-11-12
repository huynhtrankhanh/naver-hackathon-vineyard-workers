import express, { Request, Response } from 'express';
import Notification from '../models/Notification';
import { authMiddleware} from '../middleware/auth.js';

const router = express.Router();

// Create a new notification
router.post('/', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = (req.user as any)?.id || (req.user as any)?.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized: Invalid token' });
        }

        const { type, message, meta } = req.body;
        if (!type || !message) {
            return res.status(400).json({ message: 'Missing type or message' });
        }

        const notification = new Notification({ userId, type, message, meta });
        const saved = await notification.save();
        res.status(201).json(saved);
    } catch (error) {
        console.error('Error creating notification:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get notifications for the logged-in user
router.get('/', authMiddleware, async (req: Request, res: Response) => {
    try {
        // Linh hoạt lấy userId từ nhiều vị trí
        const userId = 
            (req.user as any)?.id || 
            (req.user as any)?.user?.id || 
            (req.user as any)?._id;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized: Invalid token payload' });
        }

        const items = await Notification.find({ userId }).sort({ createdAt: -1 }).limit(100);
        res.json(items);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Mark a notification as read
router.put('/:id/read', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.user?.id || (req.user as any)?.id;
    const id = req.params.id;

    console.log("Marking read - userId:", userId, "notificationId:", id); // DEBUG

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      console.log("Not found - possible userId mismatch");
      return res.status(404).json({ message: 'Notification not found or not owned by user' });
    }

    res.json(notification);
  } catch (error: any) {
    console.error('Error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;