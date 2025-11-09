/**
 * Mock AI API using Markov chain and random number generation
 * This simulates AI behavior until the real AI API is ready
 */

interface SavingsInput {
  goal: string;
  savingsGoal?: number;
  intensity: string;
  notes?: string;
}

interface SavingsRecommendation {
  type: 'reduce' | 'protect';
  category: string;
  percentage?: number;
}

interface SavingsPlanResult {
  suggestedSavings: number;
  recommendations: SavingsRecommendation[];
}

// Markov chain for generating recommendation text
const categoryChains: { [key: string]: string[] } = {
  discretionary: ['Shopping', 'Entertainment', 'Dining Out', 'Subscriptions', 'Hobbies'],
  essential: ['Groceries', 'Transportation', 'Utilities', 'Healthcare'],
  flexible: ['Clothing', 'Personal Care', 'Gifts', 'Travel']
};

// Random selection from Markov chain
function selectFromChain(chainKey: keyof typeof categoryChains): string {
  const chain = categoryChains[chainKey];
  return chain[Math.floor(Math.random() * chain.length)];
}

// Generate savings recommendation based on intensity
function calculateSavingsAmount(intensity: string, savingsGoal?: number): number {
  // Use random number generation with intensity as seed modifier
  const baseAmount = savingsGoal || 200;
  
  let multiplier = 1;
  switch (intensity.toLowerCase()) {
    case 'just starting out':
      multiplier = 0.6 + Math.random() * 0.3; // 60-90%
      break;
    case 'ideal target':
      multiplier = 0.9 + Math.random() * 0.2; // 90-110%
      break;
    case 'must achieve':
      multiplier = 1.1 + Math.random() * 0.3; // 110-140%
      break;
    default:
      multiplier = 1;
  }
  
  return Math.round(baseAmount * multiplier);
}

// Generate recommendations using Markov chain approach
function generateRecommendations(intensity: string, goal: string): SavingsRecommendation[] {
  const recommendations: SavingsRecommendation[] = [];
  
  // Based on intensity, generate different numbers of recommendations
  const numRecommendations = intensity.toLowerCase() === 'must achieve' ? 3 : 2;
  
  // Use Markov-like logic to pick categories
  const usedCategories = new Set<string>();
  
  for (let i = 0; i < numRecommendations; i++) {
    let category: string;
    let type: 'reduce' | 'protect';
    
    // Random walk through category chains
    if (i === 0 || Math.random() > 0.5) {
      // Reduce spending in discretionary or flexible categories
      const chainType = Math.random() > 0.5 ? 'discretionary' : 'flexible';
      category = selectFromChain(chainType);
      type = 'reduce';
      
      // Avoid duplicates
      let attempts = 0;
      while (usedCategories.has(category) && attempts < 5) {
        category = selectFromChain(chainType);
        attempts++;
      }
      
      usedCategories.add(category);
      
      const percentage = intensity.toLowerCase() === 'must achieve' 
        ? 20 + Math.floor(Math.random() * 15)  // 20-35%
        : 10 + Math.floor(Math.random() * 10); // 10-20%
      
      recommendations.push({ type, category, percentage });
    } else {
      // Protect essential spending
      category = selectFromChain('essential');
      type = 'protect';
      
      let attempts = 0;
      while (usedCategories.has(category) && attempts < 5) {
        category = selectFromChain('essential');
        attempts++;
      }
      
      usedCategories.add(category);
      recommendations.push({ type, category });
    }
  }
  
  return recommendations;
}

// Main mock AI function
export function generateMockSavingsPlan(input: SavingsInput): SavingsPlanResult {
  const { goal, savingsGoal, intensity, notes } = input;
  
  // Calculate suggested savings using random generation influenced by intensity
  const suggestedSavings = calculateSavingsAmount(intensity, savingsGoal);
  
  // Generate recommendations using Markov chain approach
  const recommendations = generateRecommendations(intensity, goal);
  
  // If notes contain specific keywords, adjust recommendations
  if (notes) {
    const notesLower = notes.toLowerCase();
    if (notesLower.includes('wedding') || notesLower.includes('travel')) {
      // Add more aggressive savings for time-sensitive goals
      recommendations.unshift({
        type: 'reduce',
        category: 'Entertainment',
        percentage: 15
      });
    }
  }
  
  return {
    suggestedSavings,
    recommendations
  };
}

// Generate random financial advice using Markov-style text generation
export function generateFinancialAdvice(context: string): string {
  const adviceFragments = [
    ['Consider', 'Try', 'Start by', 'Think about'],
    ['reducing', 'cutting back on', 'limiting', 'monitoring'],
    ['unnecessary', 'discretionary', 'impulse', 'non-essential'],
    ['spending', 'purchases', 'expenses', 'costs'],
    ['to reach', 'to achieve', 'to meet', 'to accomplish'],
    ['your goals', 'your targets', 'your objectives', 'financial freedom']
  ];
  
  // Build sentence using random selection from each fragment group (Markov-like)
  let sentence = '';
  for (const fragments of adviceFragments) {
    const selected = fragments[Math.floor(Math.random() * fragments.length)];
    sentence += selected + ' ';
  }
  
  return sentence.trim() + '.';
}
