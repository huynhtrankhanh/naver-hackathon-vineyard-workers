import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import Goal from '../models/Goal.js';

const router = express.Router();

// Get all goals
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user!.id);
    const goals = await Goal.find({ userId }).sort({ createdAt: -1 });
    res.json(goals);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching goals', error });
  }
});

// Get goal by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user!.id);
    const goal = await Goal.findOne({ _id: req.params.id, userId });
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }
    res.json(goal);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching goal', error });
  }
});

// Create new goal
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user!.id);
    const goal = new Goal({ ...req.body, userId });
    const savedGoal = await goal.save();
    res.status(201).json(savedGoal);
  } catch (error) {
    res.status(400).json({ message: 'Error creating goal', error });
  }
});

// Update goal
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user!.id);
    const goal = await Goal.findOneAndUpdate(
      { _id: req.params.id, userId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }
    res.json(goal);
  } catch (error) {
    res.status(400).json({ message: 'Error updating goal', error });
  }
});

// Delete goal
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user!.id);
    const goal = await Goal.findOneAndDelete({ _id: req.params.id, userId });
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }
    res.json({ message: 'Goal deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting goal', error });
  }
});

// Contribute to goal
router.post('/:id/contribute', async (req: Request, res: Response) => {
  try {
    const { amount } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid contribution amount' });
    }

    const userId = new mongoose.Types.ObjectId(req.user!.id);
    const goal = await Goal.findOne({ _id: req.params.id, userId });
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    // Add contribution to current amount
    goal.current += amount;
    const updatedGoal = await goal.save();
    
    res.json(updatedGoal);
  } catch (error) {
    res.status(400).json({ message: 'Error contributing to goal', error });
  }
});

export default router;
