import express, { Request, Response } from 'express';
import SavingsPlan from '../models/SavingsPlan.js';
import { generateMockSavingsPlan, generateFinancialAdvice } from '../utils/mockAI.js';
import { inMemory } from '../utils/inMemoryStore.js';

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
      recommendations: aiResult.recommendations
    };
    
    // Save the generated plan to the database or in-memory store
    let savedPlan;
    if (inMemory.isConnected()) {
      const savingsPlan = new SavingsPlan(planData);
      savedPlan = await savingsPlan.save();
    } else {
      savedPlan = inMemory.create('savingsPlans', planData);
    }
    
    res.status(201).json(savedPlan);
  } catch (error) {
    res.status(500).json({ message: 'Error generating savings plan', error });
  }
});

// Get all savings plans
router.get('/', async (req: Request, res: Response) => {
  try {
    let plans;
    if (inMemory.isConnected()) {
      plans = await SavingsPlan.find().sort({ createdAt: -1 });
    } else {
      plans = inMemory.find('savingsPlans').sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
    res.json(plans);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching savings plans', error });
  }
});

// Get latest savings plan
router.get('/latest', async (req: Request, res: Response) => {
  try {
    let plan;
    if (inMemory.isConnected()) {
      plan = await SavingsPlan.findOne().sort({ createdAt: -1 });
    } else {
      const plans = inMemory.find('savingsPlans');
      plan = plans.sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0] || null;
    }
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
    let plan;
    if (inMemory.isConnected()) {
      plan = await SavingsPlan.findById(req.params.id);
    } else {
      plan = inMemory.findOne('savingsPlans', req.params.id);
    }
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
    let plan;
    if (inMemory.isConnected()) {
      plan = await SavingsPlan.findByIdAndDelete(req.params.id);
    } else {
      plan = inMemory.delete('savingsPlans', req.params.id);
    }
    if (!plan) {
      return res.status(404).json({ message: 'Savings plan not found' });
    }
    res.json({ message: 'Savings plan deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting savings plan', error });
  }
});

export default router;
