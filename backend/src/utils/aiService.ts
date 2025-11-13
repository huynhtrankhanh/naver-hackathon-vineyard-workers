/**
 * AI Service for generating saving plans using Clova Studio API
 * Handles streaming, tool execution, and state management
 */

import { streamClovaAPI, ClovaMessage, ClovaStreamChunk } from './clovaClient.js';
import { getToolDefinitions, executeToolCall } from './aiTools.js';
import SavingsPlan, { ISavingsPlan } from '../models/SavingsPlan.js';
import mongoose from 'mongoose';
import { EventEmitter } from 'events';

export interface SavingPlanInput {
  goal: string;
  savingsGoal?: number;
  intensity: string;
  notes?: string;
  userId: mongoose.Types.ObjectId;
}

export interface GenerationProgress {
  status: 'pending' | 'streaming' | 'completed' | 'failed';
  message?: string;
  partialContent?: string;
  savingsPlanId?: mongoose.Types.ObjectId;
}

/**
 * Generation session that can be reconnected to
 */
class GenerationSession extends EventEmitter {
  public planId: mongoose.Types.ObjectId;
  public status: 'pending' | 'streaming' | 'completed' | 'failed' = 'pending';
  public messages: string[] = [];
  public error?: string;
  public proposedGoal?: any;
  public proposedBudgetLimits?: any[];
  public suggestedSavings?: number;
  public markdownAdvice?: string;
  
  constructor(planId: mongoose.Types.ObjectId) {
    super();
    this.planId = planId;
  }
  
  addMessage(message: string) {
    this.messages.push(message);
    this.emit('message', message);
  }
  
  complete(data: any) {
    this.status = 'completed';
    this.proposedGoal = data.proposedGoal;
    this.proposedBudgetLimits = data.proposedBudgetLimits;
    this.suggestedSavings = data.suggestedSavings;
    this.markdownAdvice = data.markdownAdvice;
    this.emit('complete', data);
  }
  
  fail(error: string) {
    this.status = 'failed';
    this.error = error;
    this.emit('error', error);
  }
}

// Store active generation sessions
const activeSessions = new Map<string, GenerationSession>();

/**
 * Get or create a generation session
 */
export function getGenerationSession(planId: mongoose.Types.ObjectId): GenerationSession | undefined {
  return activeSessions.get(planId.toString());
}

/**
 * Generate a saving plan using Clova Studio API with streaming
 */
export async function generateSavingPlan(input: SavingPlanInput): Promise<mongoose.Types.ObjectId> {
  const { goal, savingsGoal, intensity, notes, userId } = input;
  
  // Create a new saving plan document
  const plan = new SavingsPlan({
    goal,
    savingsGoal,
    intensity,
    notes,
    userId,
    suggestedSavings: 0, // Will be updated later
    recommendations: [],
    streamingStatus: 'pending',
    generationProgress: 'Starting AI generation...'
  });
  
  await plan.save();
  
  const planId = plan._id as mongoose.Types.ObjectId;
  
  // Create generation session
  const session = new GenerationSession(planId);
  activeSessions.set(planId.toString(), session);
  
  // Start generation asynchronously
  generatePlanAsync(planId, input, session).catch((error) => {
    console.error('Generation failed:', error);
    session.fail(error.message);
  });
  
  return planId;
}

/**
 * Asynchronous plan generation with tool execution
 */
async function generatePlanAsync(
  planId: mongoose.Types.ObjectId,
  input: SavingPlanInput,
  session: GenerationSession
) {
  const { goal, savingsGoal, intensity, notes, userId } = input;
  
  try {
    // Update status
    await SavingsPlan.findByIdAndUpdate(planId, {
      streamingStatus: 'streaming',
      generationProgress: 'Preparing AI prompt...'
    });
    
    session.status = 'streaming';
    session.addMessage('Preparing AI prompt...');
    
    // Build system prompt
    const systemPrompt = `You are a financial advisor AI helping users create personalized saving plans.

Your task is to:
1. Analyze the user's financial data using the provided tools
2. Propose a realistic monthly saving goal (use propose_saving_goal tool)
3. Suggest budget limit adjustments to help achieve the goal (use propose_budget_limits tool)
4. Provide detailed advice in Markdown format

User's request:
- Goal: ${goal}
${savingsGoal ? `- Target monthly saving: $${savingsGoal}` : '- No specific target (suggest one)'}
- Intensity: ${intensity}
${notes ? `- Additional notes: ${notes}` : ''}

Guidelines:
- Use the tools to read user data first
- Be realistic and considerate of their intensity level
- "Just starting out" = gentle changes
- "Ideal target" = balanced approach
- "Must achieve" = aggressive but achievable changes
- Provide actionable, specific advice`;

    const messages: ClovaMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: 'Please analyze my financial situation and create a personalized saving plan for me.' }
    ];
    
    // Temporarily disable tools to test API
    // const tools = getToolDefinitions();
    const tools: any[] = [];
    
    // Execute with tool calling loop
    let toolCallIteration = 0;
    const maxToolIterations = 10;
    let fullResponse = '';
    let proposedGoal: any = null;
    let proposedBudgetLimits: any[] = [];
    
    while (toolCallIteration < maxToolIterations) {
      session.addMessage(`Processing with AI (iteration ${toolCallIteration + 1})...`);
      
      await SavingsPlan.findByIdAndUpdate(planId, {
        generationProgress: `AI thinking... (iteration ${toolCallIteration + 1})`
      });
      
      // Stream the response
      const stream = await streamClovaAPI(messages, tools);
      
      let currentContent = '';
      let currentToolCalls: any[] = [];
      let toolCallIndex = -1;
      
      for await (const chunk of stream) {
        if (chunk.choices && chunk.choices[0]) {
          const delta = chunk.choices[0].delta;
          
          if (delta?.content) {
            currentContent += delta.content;
            fullResponse += delta.content;
            
            // Emit progress
            session.addMessage(`AI: ${delta.content}`);
          }
          
          if (delta?.tool_calls) {
            for (const toolCall of delta.tool_calls) {
              if (toolCall.index !== undefined && toolCall.index !== toolCallIndex) {
                toolCallIndex = toolCall.index;
                currentToolCalls[toolCallIndex] = {
                  id: toolCall.id || `call_${Date.now()}_${toolCallIndex}`,
                  type: 'function',
                  function: {
                    name: toolCall.function?.name || '',
                    arguments: toolCall.function?.arguments || ''
                  }
                };
              } else if (toolCallIndex >= 0 && toolCall.function?.arguments) {
                currentToolCalls[toolCallIndex].function.arguments += toolCall.function.arguments;
              }
            }
          }
          
          if (chunk.choices[0].finish_reason) {
            break;
          }
        }
      }
      
      // Add assistant response to messages
      if (currentContent || currentToolCalls.length > 0) {
        const assistantMessage: ClovaMessage = {
          role: 'assistant',
          content: currentContent || ''
        };
        
        if (currentToolCalls.length > 0) {
          assistantMessage.tool_calls = currentToolCalls;
        }
        
        messages.push(assistantMessage);
      }
      
      // Execute tool calls
      if (currentToolCalls.length > 0) {
        session.addMessage(`Executing ${currentToolCalls.length} tool(s)...`);
        
        for (const toolCall of currentToolCalls) {
          const toolName = toolCall.function.name;
          const toolArgs = JSON.parse(toolCall.function.arguments);
          
          session.addMessage(`Tool: ${toolName}`);
          
          await SavingsPlan.findByIdAndUpdate(planId, {
            generationProgress: `Executing tool: ${toolName}`
          });
          
          // Execute the tool
          const result = await executeToolCall(toolName, toolArgs, userId);
          
          // Handle special tool results
          if (result.data?.type === 'goal_proposal') {
            proposedGoal = result.data.proposal;
          } else if (result.data?.type === 'budget_proposals') {
            proposedBudgetLimits = result.data.proposals;
          }
          
          // Add tool result to messages
          messages.push({
            role: 'tool',
            content: JSON.stringify(result),
            tool_call_id: toolCall.id,
            name: toolName
          });
        }
        
        toolCallIteration++;
        continue; // Continue the loop for next AI response
      }
      
      // No more tool calls, we're done
      break;
    }
    
    // Extract suggested savings from response or calculate
    const suggestedSavings = savingsGoal || extractSuggestedSavings(fullResponse) || 300;
    
    // Update the plan with final results
    await SavingsPlan.findByIdAndUpdate(planId, {
      streamingStatus: 'completed',
      generationProgress: 'Plan generation completed!',
      suggestedSavings,
      markdownAdvice: fullResponse,
      proposedGoal,
      proposedBudgetLimits
    });
    
    session.complete({
      suggestedSavings,
      markdownAdvice: fullResponse,
      proposedGoal,
      proposedBudgetLimits
    });
    
    session.addMessage('Plan generation completed!');
    
    // Keep session alive for 5 minutes for reconnections
    setTimeout(() => {
      activeSessions.delete(planId.toString());
    }, 5 * 60 * 1000);
    
  } catch (error) {
    console.error('AI generation error:', error);
    
    await SavingsPlan.findByIdAndUpdate(planId, {
      streamingStatus: 'failed',
      generationProgress: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
    
    session.fail(error instanceof Error ? error.message : 'Unknown error');
    
    // Remove session after 1 minute
    setTimeout(() => {
      activeSessions.delete(planId.toString());
    }, 60 * 1000);
    
    throw error;
  }
}

/**
 * Extract suggested savings amount from AI response
 */
function extractSuggestedSavings(text: string): number | null {
  // Look for patterns like $300, $300/mo, etc.
  const patterns = [
    /\$(\d+)(?:\/mo|\/month|per month)/i,
    /save \$(\d+)/i,
    /saving \$(\d+)/i,
    /goal of \$(\d+)/i,
    /target \$(\d+)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return parseInt(match[1]);
    }
  }
  
  return null;
}
