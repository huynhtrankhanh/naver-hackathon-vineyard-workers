import express, { Request, Response } from 'express';
import SavingsPlan from '../models/SavingsPlan.js';
import { generateMockSavingsPlan, generateFinancialAdvice } from '../utils/mockAI.js';

const router = express.Router();

// Generate AI savings plan (Mock AI endpoint)
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { goal, savingsGoal, intensity, notes } = req.body;
    
    // Validate required fields
    if (!goal || !intensity) {
      return res.status(400).json({ 
        message: 'Missing required fields: goal and intensity are required' 
      });
    }
    
    // Use mock AI to generate the plan
    const aiResult = generateMockSavingsPlan({
      goal,
      savingsGoal,
      intensity,
      notes
    });
    
    const planData = {
      goal,
      savingsGoal,
      intensity,
      notes,
      suggestedSavings: aiResult.suggestedSavings,
      recommendations: aiResult.recommendations,
      markdownAdvice: aiResult.markdownAdvice
    };
    
    // Save the generated plan to the database
    const savingsPlan = new SavingsPlan(planData);
    const savedPlan = await savingsPlan.save();
    
    res.status(201).json(savedPlan);
  } catch (error) {
    res.status(500).json({ message: 'Error generating savings plan', error });
  }
});

// Get all savings plans
router.get('/', async (req: Request, res: Response) => {
  try {
    const plans = await SavingsPlan.find().sort({ createdAt: -1 });
    res.json(plans);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching savings plans', error });
  }
});

// Get latest savings plan
router.get('/latest', async (req: Request, res: Response) => {
  try {
    const plan = await SavingsPlan.findOne().sort({ createdAt: -1 });
    if (!plan) {
      return res.status(404).json({ message: 'No savings plan found' });
    }
    res.json(plan);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching savings plan', error });
  }
});

// Get savings plan by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const plan = await SavingsPlan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ message: 'Savings plan not found' });
    }
    res.json(plan);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching savings plan', error });
  }
});

// Get AI-generated financial advice (Mock AI endpoint)
router.post('/advice', async (req: Request, res: Response) => {
  try {
    const { context } = req.body;
    const advice = generateFinancialAdvice(context || 'general');
    res.json({ advice });
  } catch (error) {
    res.status(500).json({ message: 'Error generating advice', error });
  }
});

// Delete savings plan
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const plan = await SavingsPlan.findByIdAndDelete(req.params.id);
    if (!plan) {
      return res.status(404).json({ message: 'Savings plan not found' });
    }
    res.json({ message: 'Savings plan deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting savings plan', error });
  }
});

export default router;
