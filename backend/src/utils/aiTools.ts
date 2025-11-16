/**
 * AI Tools for Clova Studio API
 * These tools allow the AI to read user data and propose saving plans
 */

import Transaction from '../models/Transaction.js';
import Goal from '../models/Goal.js';
import Budget from '../models/Budget.js';
import { executePythonSandbox } from './pythonSandbox.js';
import mongoose from 'mongoose';

export interface AIToolResult {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Tool: Read all user transactions
 */
export async function readTransactions(userId: mongoose.Types.ObjectId): Promise<AIToolResult> {
  try {
    const transactions = await Transaction.find({ userId }).sort({ date: -1 }).limit(100);
    return {
      success: true,
      data: transactions.map(t => ({
        id: t._id,
        amount: t.amount,
        category: t.category,
        type: t.type,
        title: t.title,
        date: t.date
      }))
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to read transactions: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Tool: Read all user goals
 */
export async function readGoals(userId: mongoose.Types.ObjectId): Promise<AIToolResult> {
  try {
    const goals = await Goal.find({ userId });
    return {
      success: true,
      data: goals.map(g => ({
        id: g._id,
        name: g.name,
        target: g.target,
        current: g.current,
        priority: g.priority,
        progress: g.target > 0 ? (g.current / g.target) * 100 : 0
      }))
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to read goals: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Tool: Read all user budgets
 */
export async function readBudgets(userId: mongoose.Types.ObjectId): Promise<AIToolResult> {
  try {
    const budgets = await Budget.find({ userId });
    return {
      success: true,
      data: budgets.map(b => ({
        id: b._id,
        category: b.category,
        limit: b.limit,
        spent: b.spent,
        month: b.month,
        utilization: b.limit > 0 ? (b.spent / b.limit) * 100 : 0
      }))
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to read budgets: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Tool: Get financial summary
 */
export async function getFinancialSummary(userId: mongoose.Types.ObjectId): Promise<AIToolResult> {
  try {
    const transactions = await Transaction.find({ userId });
    
    let totalIncome = 0;
    let totalExpenses = 0;
    const categorySpending: { [key: string]: number } = {};
    
    for (const t of transactions) {
      if (t.type === 'income') {
        totalIncome += t.amount;
      } else {
        totalExpenses += t.amount;
        categorySpending[t.category] = (categorySpending[t.category] || 0) + t.amount;
      }
    }
    
    const balance = totalIncome - totalExpenses;
    const goals = await Goal.find({ userId });
    const budgets = await Budget.find({ userId });
    
    return {
      success: true,
      data: {
        balance,
        totalIncome,
        totalExpenses,
        categorySpending,
        goals: goals.length,
        budgets: budgets.length,
        savingRate: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0
      }
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to get financial summary: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Tool: Execute Python code in sandbox
 */
export async function executePython(code: string): Promise<AIToolResult> {
  try {
    const result = await executePythonSandbox(code);
    
    if (result.success) {
      return {
        success: true,
        data: { output: result.output }
      };
    } else {
      return {
        success: false,
        error: result.error,
        data: {
          timedOut: result.timedOut,
          memoryExceeded: result.memoryExceeded,
          output: result.output
        }
      };
    }
  } catch (error) {
    return {
      success: false,
      error: `Python execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Get tool definitions for Clova Studio API
 */
export function getToolDefinitions() {
  return [
    {
      type: 'function',
      function: {
        name: 'read_transactions',
        description: 'Read all user transactions including income and expenses. Returns up to 100 most recent transactions.',
        parameters: {
          type: 'object',
          properties: {},
          required: []
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'read_goals',
        description: 'Read all user saving goals including their targets, current progress, and priority.',
        parameters: {
          type: 'object',
          properties: {},
          required: []
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'read_budgets',
        description: 'Read all user budget limits by category, including how much has been spent.',
        parameters: {
          type: 'object',
          properties: {},
          required: []
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'get_financial_summary',
        description: 'Get a comprehensive financial summary including balance, income, expenses, saving rate, and spending by category.',
        parameters: {
          type: 'object',
          properties: {},
          required: []
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'execute_python',
        description: 'Execute Python code in a restricted sandbox (6s timeout, 256MB RAM, no internet). Use for calculations or data analysis. Available libraries: math, statistics, json, datetime.',
        parameters: {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              description: 'Python code to execute'
            }
          },
          required: ['code']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'propose_saving_goal',
        description: 'Propose a new saving goal for the user. This will be shown to the user for acceptance.',
        parameters: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Name of the saving goal'
            },
            target: {
              type: 'number',
              description: 'Target amount for the saving goal'
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
              description: 'Priority level of the goal'
            }
          },
          required: ['name', 'target', 'priority']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'propose_budget_limits',
        description: 'Propose new budget limits for one or more categories. These will be shown to the user for review.',
        parameters: {
          type: 'object',
          properties: {
            limits: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  category: {
                    type: 'string',
                    description: 'Budget category name'
                  },
                  suggestedLimit: {
                    type: 'number',
                    description: 'Suggested monthly limit for this category'
                  },
                  reasoning: {
                    type: 'string',
                    description: 'Brief explanation for this limit'
                  }
                },
                required: ['category', 'suggestedLimit']
              },
              description: 'Array of budget limit proposals'
            }
          },
          required: ['limits']
        }
      }
    }
  ];
}

/**
 * Execute a tool call from the AI
 */
export async function executeToolCall(
  toolName: string,
  args: any,
  userId: mongoose.Types.ObjectId
): Promise<AIToolResult> {
  switch (toolName) {
    case 'read_transactions':
      return await readTransactions(userId);
    
    case 'read_goals':
      return await readGoals(userId);
    
    case 'read_budgets':
      return await readBudgets(userId);
    
    case 'get_financial_summary':
      return await getFinancialSummary(userId);
    
    case 'execute_python':
      return await executePython(args.code);
    
    case 'propose_saving_goal':
      // Store proposal (will be handled in the main AI generation flow)
      return {
        success: true,
        data: {
          type: 'goal_proposal',
          proposal: args
        }
      };
    
    case 'propose_budget_limits':
      // Store proposals (will be handled in the main AI generation flow)
      return {
        success: true,
        data: {
          type: 'budget_proposals',
          proposals: args.limits
        }
      };
    
    default:
      return {
        success: false,
        error: `Unknown tool: ${toolName}`
      };
  }
}
