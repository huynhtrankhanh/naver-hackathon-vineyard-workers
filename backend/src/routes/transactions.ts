import express, { Request, Response } from 'express';
import Transaction from '../models/Transaction.js';
import { inMemory } from '../utils/inMemoryStore.js';

const router = express.Router();

// Get all transactions
router.get('/', async (req: Request, res: Response) => {
  try {
    let transactions;
    if (inMemory.isConnected()) {
      transactions = await Transaction.find().sort({ date: -1 }).limit(50);
    } else {
      transactions = inMemory.find('transactions').sort((a: any, b: any) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      ).slice(0, 50);
    }
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching transactions', error });
  }
});

// Get transaction by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    let transaction;
    if (inMemory.isConnected()) {
      transaction = await Transaction.findById(req.params.id);
    } else {
      transaction = inMemory.findOne('transactions', req.params.id);
    }
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching transaction', error });
  }
});

// Create new transaction
router.post('/', async (req: Request, res: Response) => {
  try {
    let savedTransaction;
    if (inMemory.isConnected()) {
      const transaction = new Transaction(req.body);
      savedTransaction = await transaction.save();
    } else {
      savedTransaction = inMemory.create('transactions', req.body);
    }
    res.status(201).json(savedTransaction);
  } catch (error) {
    res.status(400).json({ message: 'Error creating transaction', error });
  }
});

// Update transaction
router.put('/:id', async (req: Request, res: Response) => {
  try {
    let transaction;
    if (inMemory.isConnected()) {
      transaction = await Transaction.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );
    } else {
      transaction = inMemory.update('transactions', req.params.id, req.body);
    }
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    res.json(transaction);
  } catch (error) {
    res.status(400).json({ message: 'Error updating transaction', error });
  }
});

// Delete transaction
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    let transaction;
    if (inMemory.isConnected()) {
      transaction = await Transaction.findByIdAndDelete(req.params.id);
    } else {
      transaction = inMemory.delete('transactions', req.params.id);
    }
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting transaction', error });
  }
});

// Get summary statistics
router.get('/stats/summary', async (req: Request, res: Response) => {
  try {
    let totalIncome = 0;
    let totalExpenses = 0;
    
    if (inMemory.isConnected()) {
      const income = await Transaction.aggregate([
        { $match: { type: 'income' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      
      const expenses = await Transaction.aggregate([
        { $match: { type: 'expense' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      
      totalIncome = income[0]?.total || 0;
      totalExpenses = Math.abs(expenses[0]?.total || 0);
    } else {
      const transactions = inMemory.find('transactions');
      totalIncome = transactions
        .filter((t: any) => t.type === 'income')
        .reduce((sum: number, t: any) => sum + t.amount, 0);
      totalExpenses = Math.abs(transactions
        .filter((t: any) => t.type === 'expense')
        .reduce((sum: number, t: any) => sum + t.amount, 0));
    }
    
    res.json({
      income: totalIncome,
      expenses: totalExpenses,
      savings: totalIncome - totalExpenses
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching summary', error });
  }
});

export default router;
