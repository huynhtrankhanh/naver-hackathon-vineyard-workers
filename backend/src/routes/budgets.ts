import express, { Request, Response } from 'express';
import Budget from '../models/Budget.js';

const router = express.Router();

// Get all budgets
router.get('/', async (req: Request, res: Response) => {
  try {
    const budgets = await Budget.find().sort({ month: -1 });
    res.json(budgets);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching budgets', error });
  }
});

// Get budget by month
router.get('/month/:month', async (req: Request, res: Response) => {
  try {
    const budgets = await Budget.find({ month: req.params.month });
    res.json(budgets);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching budgets', error });
  }
});

// Create new budget
router.post('/', async (req: Request, res: Response) => {
  try {
    const budget = new Budget(req.body);
    const savedBudget = await budget.save();
    res.status(201).json(savedBudget);
  } catch (error) {
    res.status(400).json({ message: 'Error creating budget', error });
  }
});

// Update budget
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const budget = await Budget.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }
    res.json(budget);
  } catch (error) {
    res.status(400).json({ message: 'Error updating budget', error });
  }
});

// Delete budget
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const budget = await Budget.findByIdAndDelete(req.params.id);
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }
    res.json({ message: 'Budget deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting budget', error });
  }
});

export default router;
