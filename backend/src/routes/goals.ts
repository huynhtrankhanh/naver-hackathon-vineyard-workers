import express, { Request, Response } from 'express';
import Goal from '../models/Goal.js';
import { inMemory } from '../utils/inMemoryStore.js';

const router = express.Router();

// Get all goals
router.get('/', async (req: Request, res: Response) => {
  try {
    let goals;
    if (inMemory.isConnected()) {
      goals = await Goal.find().sort({ createdAt: -1 });
    } else {
      goals = inMemory.find('goals').sort((a: any, b: any) => 
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
    }
    res.json(goals);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching goals', error });
  }
});

// Get goal by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    let goal;
    if (inMemory.isConnected()) {
      goal = await Goal.findById(req.params.id);
    } else {
      goal = inMemory.findOne('goals', req.params.id);
    }
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
    let savedGoal;
    if (inMemory.isConnected()) {
      const goal = new Goal(req.body);
      savedGoal = await goal.save();
    } else {
      savedGoal = inMemory.create('goals', req.body);
    }
    res.status(201).json(savedGoal);
  } catch (error) {
    res.status(400).json({ message: 'Error creating goal', error });
  }
});

// Update goal
router.put('/:id', async (req: Request, res: Response) => {
  try {
    let goal;
    if (inMemory.isConnected()) {
      goal = await Goal.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );
    } else {
      goal = inMemory.update('goals', req.params.id, req.body);
    }
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
    let goal;
    if (inMemory.isConnected()) {
      goal = await Goal.findByIdAndDelete(req.params.id);
    } else {
      goal = inMemory.delete('goals', req.params.id);
    }
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }
    res.json({ message: 'Goal deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting goal', error });
  }
});

export default router;
