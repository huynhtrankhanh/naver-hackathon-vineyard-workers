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
  markdownAdvice: string;
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

// Generate markdown advice using Markov chain approach
function generateMarkdownAdvice(input: SavingsInput, recommendations: SavingsRecommendation[]): string {
  const { goal, savingsGoal, intensity, notes } = input;
  
  // Markov chain data structures for generating varied text
  const openings = [
    'Based on your financial goals and current spending patterns, here\'s a personalized savings strategy',
    'After analyzing your priorities and commitment level, I\'ve created a tailored plan',
    'Your dedication to achieving your goals is commendable. Here\'s how we can help you succeed',
    'Let\'s work together to make your financial dreams a reality'
  ];
  
  const goalPhrases: { [key: string]: string[] } = {
    'Build a safety net': [
      'Building an emergency fund is crucial for financial stability',
      'A safety net provides peace of mind during unexpected situations',
      'Creating a financial cushion protects you from life\'s uncertainties'
    ],
    'Big Purchase': [
      'Saving for a major purchase requires discipline and planning',
      'Major investments need careful financial preparation',
      'Reaching your big purchase goal is achievable with the right strategy'
    ],
    'Dream Vacation': [
      'Your dream vacation is within reach with consistent saving',
      'Travel experiences create lasting memories worth saving for',
      'Making your travel dreams come true starts with smart financial planning'
    ],
    'General Investing': [
      'Building wealth through investing is a smart long-term strategy',
      'Growing your investment portfolio requires patience and consistency',
      'Investing in your future starts with disciplined savings today'
    ]
  };
  
  const intensityPhrases: { [key: string]: string[] } = {
    'Just starting out': [
      'Since you\'re just beginning your savings journey, we\'ll focus on small, sustainable changes',
      'Starting with gentle adjustments helps build lasting habits',
      'Your comfort-focused approach ensures you\'ll stick with the plan'
    ],
    'Ideal target': [
      'With your balanced approach, we can optimize both savings and quality of life',
      'This balanced strategy maximizes savings while maintaining your lifestyle',
      'Your realistic target allows for effective progress without sacrifice'
    ],
    'Must achieve': [
      'Your strong commitment enables aggressive savings strategies',
      'With your determination, we can implement bold changes for maximum impact',
      'Your unwavering focus allows us to pursue ambitious savings targets'
    ]
  };
  
  const actionIntros = [
    'Here are the key actions to implement',
    'Focus on these strategic changes',
    'I recommend prioritizing these adjustments',
    'Let\'s break down the specific steps'
  ];
  
  const conclusions = [
    'Remember, consistency is key to reaching your financial goals',
    'Stay committed to these changes, and you\'ll see real progress',
    'Track your progress regularly and adjust as needed',
    'You\'re on the path to financial success - keep up the great work'
  ];
  
  // Select random phrases using Markov-like approach
  const opening = openings[Math.floor(Math.random() * openings.length)];
  const goalPhrase = (goalPhrases[goal] || goalPhrases['General Investing'])[Math.floor(Math.random() * (goalPhrases[goal]?.length || 3))];
  const intensityPhrase = (intensityPhrases[intensity] || intensityPhrases['Ideal target'])[Math.floor(Math.random() * 3)];
  const actionIntro = actionIntros[Math.floor(Math.random() * actionIntros.length)];
  const conclusion = conclusions[Math.floor(Math.random() * conclusions.length)];
  
  // Build the markdown content
  let markdown = `# ${opening}\n\n`;
  markdown += `## Your Goal: ${goal}\n\n`;
  markdown += `${goalPhrase}. ${intensityPhrase}.\n\n`;
  
  // Add context from notes if provided
  if (notes && notes.trim()) {
    const contextPhrases = [
      'I\'ve taken into account your specific situation',
      'Your additional context has been considered in this plan',
      'Based on what you\'ve shared'
    ];
    markdown += `### Personal Context\n\n`;
    markdown += `${contextPhrases[Math.floor(Math.random() * contextPhrases.length)]}: "${notes}"\n\n`;
  }
  
  // Add recommendations section
  markdown += `## ${actionIntro}\n\n`;
  
  recommendations.forEach((rec, index) => {
    markdown += `${index + 1}. **${rec.type === 'reduce' ? '🔻 Reduce' : '🛡️ Protect'} ${rec.category}**`;
    if (rec.percentage) {
      markdown += ` by ${rec.percentage}%`;
    }
    markdown += '\n';
    
    // Add explanatory text for each recommendation
    const explanations = rec.type === 'reduce' ? [
      `   - Small cuts in this category can add up to significant savings over time`,
      `   - Consider alternatives or finding better deals to reduce spending here`,
      `   - This is an area where you can likely find savings without major lifestyle impact`,
      `   - Look for subscriptions or recurring expenses you can eliminate`
    ] : [
      `   - This is an essential category that should remain stable`,
      `   - Maintain your current spending level here for quality of life`,
      `   - This category supports your well-being and shouldn't be cut`,
      `   - Keep this protected while optimizing other areas`
    ];
    markdown += explanations[Math.floor(Math.random() * explanations.length)] + '\n\n';
  });
  
  // Add progress tracking section
  markdown += `## Tracking Your Progress\n\n`;
  markdown += `To stay on track:\n\n`;
  markdown += `- Review your spending weekly to ensure you're meeting targets\n`;
  markdown += `- Celebrate small wins along the way\n`;
  markdown += `- Adjust the plan if circumstances change\n`;
  markdown += `- Use budgeting tools to automate tracking\n\n`;
  
  // Add conclusion
  markdown += `## Moving Forward\n\n`;
  markdown += `${conclusion}! `;
  
  // Add intensity-specific encouragement
  if (intensity === 'Must achieve') {
    markdown += `Your determination will pay off as you see your savings grow rapidly.`;
  } else if (intensity === 'Ideal target') {
    markdown += `Your balanced approach sets you up for sustainable long-term success.`;
  } else {
    markdown += `Building savings habits gradually ensures lasting change.`;
  }
  
  return markdown;
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
  
  // Generate markdown advice using Markov chain approach
  const markdownAdvice = generateMarkdownAdvice(input, recommendations);
  
  return {
    suggestedSavings,
    recommendations,
    markdownAdvice
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
