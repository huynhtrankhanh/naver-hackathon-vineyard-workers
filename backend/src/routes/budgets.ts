import express, { Request, Response } from 'express';
import Budget from '../models/Budget.js';
import { inMemory } from '../utils/inMemoryStore.js';

const router = express.Router();

// Get all budgets
router.get('/', async (req: Request, res: Response) => {
  try {
    let budgets;
    if (inMemory.isConnected()) {
      budgets = await Budget.find().sort({ month: -1 });
    } else {
      budgets = inMemory.find('budgets').sort((a: any, b: any) => 
        (b.month || '').localeCompare(a.month || '')
      );
    }
    res.json(budgets);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching budgets', error });
  }
});

// Get budget by month
router.get('/month/:month', async (req: Request, res: Response) => {
  try {
    let budgets;
    if (inMemory.isConnected()) {
      budgets = await Budget.find({ month: req.params.month });
    } else {
      budgets = inMemory.find('budgets').filter((b: any) => b.month === req.params.month);
    }
    res.json(budgets);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching budgets', error });
  }
});

// Create new budget
router.post('/', async (req: Request, res: Response) => {
  try {
    let savedBudget;
    if (inMemory.isConnected()) {
      const budget = new Budget(req.body);
      savedBudget = await budget.save();
    } else {
      savedBudget = inMemory.create('budgets', req.body);
    }
    res.status(201).json(savedBudget);
  } catch (error) {
    res.status(400).json({ message: 'Error creating budget', error });
  }
});

// Update budget
router.put('/:id', async (req: Request, res: Response) => {
  try {
    let budget;
    if (inMemory.isConnected()) {
      budget = await Budget.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );
    } else {
      budget = inMemory.update('budgets', req.params.id, req.body);
    }
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
    let budget;
    if (inMemory.isConnected()) {
      budget = await Budget.findByIdAndDelete(req.params.id);
    } else {
      budget = inMemory.delete('budgets', req.params.id);
    }
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }
    res.json({ message: 'Budget deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting budget', error });
  }
});

export default router;
