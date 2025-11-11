import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import Budget from '../models/Budget.js';
import Transaction from '../models/Transaction.js';

const router = express.Router();

// Helper function to calculate spent amount for budgets
async function calculateBudgetSpent(budgets: any[]) {
  const enrichedBudgets = await Promise.all(
    budgets.map(async (budget) => {
      // Calculate spent from transactions for this category and month
      const spent = await Transaction.aggregate([
        {
          $match: {
            type: 'expense',
            category: budget.category,
            userId: budget.userId,
            date: {
              $gte: new Date(`${budget.month}-01`),
              $lt: new Date(new Date(`${budget.month}-01`).setMonth(new Date(`${budget.month}-01`).getMonth() + 1))
            }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: { $abs: '$amount' } }
          }
        }
      ]);

      return {
        _id: budget._id,
        category: budget.category,
        limit: budget.limit,
        spent: spent[0]?.total || 0,
        userId: budget.userId,
        month: budget.month,
        createdAt: budget.createdAt,
        updatedAt: budget.updatedAt
      };
    })
  );
  return enrichedBudgets;
}

// Get all budgets
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user!.id);
    const budgets = await Budget.find({ userId }).sort({ month: -1 });
    const enrichedBudgets = await calculateBudgetSpent(budgets);
    res.json(enrichedBudgets);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching budgets', error });
  }
});

// Get budget by month
router.get('/month/:month', async (req: Request, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user!.id);
    const budgets = await Budget.find({ month: req.params.month, userId });
    const enrichedBudgets = await calculateBudgetSpent(budgets);
    res.json(enrichedBudgets);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching budgets', error });
  }
});

// Create new budget
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user!.id);
    // Check if budget for this category and month already exists
    const existingBudget = await Budget.findOne({
      category: req.body.category,
      month: req.body.month,
      userId
    });

    if (existingBudget) {
      // Update existing budget limit instead of creating a new one
      existingBudget.limit = req.body.limit;
      const updatedBudget = await existingBudget.save();
      const enriched = await calculateBudgetSpent([updatedBudget]);
      return res.status(200).json(enriched[0]);
    }

    // Create new budget if none exists
    const budget = new Budget({ ...req.body, userId });
    const savedBudget = await budget.save();
    const enriched = await calculateBudgetSpent([savedBudget]);
    res.status(201).json(enriched[0]);
  } catch (error) {
    res.status(400).json({ message: 'Error creating budget', error });
  }
});

// Update budget
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user!.id);
    const budget = await Budget.findOneAndUpdate(
      { _id: req.params.id, userId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }
    const enriched = await calculateBudgetSpent([budget]);
    res.json(enriched[0]);
  } catch (error) {
    res.status(400).json({ message: 'Error updating budget', error });
  }
});

// Delete budget
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user!.id);
    const budget = await Budget.findOneAndDelete({ _id: req.params.id, userId });
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }
    res.json({ message: 'Budget deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting budget', error });
  }
});

export default router;
