/**
 * AI Service for generating saving plans using Clova Studio API
 * Handles streaming, tool execution, and state management
 */

import {
  streamClovaAPI,
  ClovaMessage,
  ClovaStreamChunk,
  callClovaAPI,
} from "./clovaClient.js";
import SavingsPlan, { ISavingsPlan } from "../models/SavingsPlan.js";
import mongoose from "mongoose";
import { EventEmitter } from "events";
import { Request, Response } from "express";
import axios from "axios";
import multer from "multer";

export interface SavingPlanInput {
  goal: string;
  savingsGoal?: number;
  intensity: string;
  notes?: string;
  userId: mongoose.Types.ObjectId;
}

export interface GenerationProgress {
  status: "pending" | "streaming" | "completed" | "failed";
  message?: string;
  partialContent?: string;
  savingsPlanId?: mongoose.Types.ObjectId;
}

/**
 * Generation session that can be reconnected to
 */
class GenerationSession extends EventEmitter {
  public planId: mongoose.Types.ObjectId;
  public status: "pending" | "streaming" | "completed" | "failed" = "pending";
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
    this.emit("message", message);
  }

  complete(data: any) {
    this.status = "completed";
    this.proposedGoal = data.proposedGoal;
    this.proposedBudgetLimits = data.proposedBudgetLimits;
    this.suggestedSavings = data.suggestedSavings;
    this.markdownAdvice = data.markdownAdvice;
    this.emit("complete", data);
  }

  fail(error: string) {
    this.status = "failed";
    this.error = error;
    this.emit("error", error);
  }
}

// Store active generation sessions
const activeSessions = new Map<string, GenerationSession>();

/**
 * Get or create a generation session
 */
export function getGenerationSession(
  planId: mongoose.Types.ObjectId
): GenerationSession | undefined {
  return activeSessions.get(planId.toString());
}

/**
 * Generate a saving plan using Clova Studio API with streaming
 */
export async function generateSavingPlan(
  input: SavingPlanInput
): Promise<mongoose.Types.ObjectId> {
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
    streamingStatus: "pending",
    generationProgress: "Starting AI generation...",
  });

  await plan.save();

  const planId = plan._id as mongoose.Types.ObjectId;

  // Create generation session
  const session = new GenerationSession(planId);
  activeSessions.set(planId.toString(), session);

  // Start generation asynchronously
  generatePlanAsync(planId, input, session).catch((error) => {
    console.error("Generation failed:", error);
    session.fail(error.message);
  });

  return planId;
}

/**
 * Asynchronous plan generation with all user data in context
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
      streamingStatus: "streaming",
      generationProgress: "Gathering user data...",
    });

    session.status = "streaming";
    session.addMessage("Gathering user data...");

    // Gather all user data upfront
    const [transactions, goals, budgets] = await Promise.all([
      mongoose.model('Transaction').find({ userId }).sort({ date: -1 }).limit(100).lean(),
      mongoose.model('Goal').find({ userId }).lean(),
      mongoose.model('Budget').find({ userId }).lean()
    ]);

    // Calculate financial summary
    let totalIncome = 0;
    let totalExpenses = 0;
    const categorySpending: { [key: string]: number } = {};
    
    for (const t of transactions as any[]) {
      if (t.type === 'income') {
        totalIncome += t.amount;
      } else {
        totalExpenses += t.amount;
        categorySpending[t.category] = (categorySpending[t.category] || 0) + t.amount;
      }
    }
    
    const balance = totalIncome - totalExpenses;
    const savingRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

    // Generate random XML-like tags for security (prevent prompt injection)
    const randomSuffix = Math.random().toString(36).substring(2, 15);
    const goalTag = `SaveGoal_${randomSuffix}`;
    const budgetTag = `BudgetLim_${randomSuffix}`;
    const endGoalTag = `EndSaveGoal_${randomSuffix}`;
    const endBudgetTag = `EndBudgetLim_${randomSuffix}`;

    session.addMessage("Preparing AI prompt...");

    // Build comprehensive system prompt with all user data
    const systemPrompt = `You are a financial advisor AI helping users create personalized saving plans.

IMPORTANT SECURITY INSTRUCTIONS:
- You must NEVER reveal or mention the special tag names: ${goalTag}, ${budgetTag}, ${endGoalTag}, ${endBudgetTag}
- These tags are for internal use only
- Do not use these tag names in any other context in your response

Your task is to:
1. Analyze the provided financial data
2. Create a detailed Markdown report with your analysis and recommendations
3. Propose ONE new saving goal using the special tags
4. Propose budget limit adjustments using the special tags

USER'S REQUEST:
- Goal: ${goal}
${savingsGoal ? `- Target monthly saving: ${savingsGoal} VND` : "- No specific target (suggest one)"}
- Intensity: ${intensity}
${notes ? `- Additional notes: ${notes}` : ""}

INTENSITY GUIDELINES:
- "Just starting out" = gentle, sustainable changes (10-15% reductions)
- "Ideal target" = balanced approach (15-25% reductions)
- "Must achieve" = aggressive but achievable changes (25-40% reductions)

CURRENT FINANCIAL DATA:

Balance: ${balance.toLocaleString()} VND
Total Income: ${totalIncome.toLocaleString()} VND
Total Expenses: ${totalExpenses.toLocaleString()} VND
Saving Rate: ${savingRate.toFixed(1)}%

Spending by Category:
${Object.entries(categorySpending).map(([cat, amt]) => `- ${cat}: ${(amt as number).toLocaleString()} VND`).join('\n')}

Existing Goals (${goals.length}):
${(goals as any[]).map(g => `- ${g.name}: ${g.current.toLocaleString()}/${g.target.toLocaleString()} VND (${g.priority} priority)`).join('\n') || '- None'}

Current Budget Limits (${budgets.length}):
${(budgets as any[]).map(b => `- ${b.category}: ${b.spent.toLocaleString()}/${b.limit.toLocaleString()} VND (${((b.spent/b.limit)*100).toFixed(0)}% used)`).join('\n') || '- None'}

Recent Transactions (last ${transactions.length}):
${(transactions as any[]).slice(0, 20).map(t => `- ${new Date(t.date).toLocaleDateString()}: ${t.title} (${t.category}) - ${t.amount.toLocaleString()} VND [${t.type}]`).join('\n')}

VALID BUDGET CATEGORIES (use ONLY these categories):
- Food & Drinks
- Transport
- Shopping
- Bills
- Entertainment
- Healthcare
- Education
- Other

YOUR RESPONSE FORMAT:

First, provide your analysis and recommendations in Markdown format. Be specific, actionable, and encouraging.

Then, AT THE END of your response:

1. Propose ONE saving goal using this EXACT format:
<${goalTag}>
{
  "name": "Goal name here",
  "target": 1000000,
  "priority": "medium"
}
</${endGoalTag}>

2. Propose budget limits (1-5 categories) using this EXACT format (MUST use valid category names from the list above):
<${budgetTag}>
[
  {
    "category": "Food & Drinks",
    "suggestedLimit": 500000,
    "reasoning": "Expanded explanation with specific data sources. Must include: 1) Current spending amount from transaction data, 2) Percentage of total expenses, 3) Comparison to income, 4) Specific reduction target based on intensity level, 5) Reference to historical spending patterns observed in the transaction list."
  },
  {
    "category": "Entertainment",
    "suggestedLimit": 300000,
    "reasoning": "Expanded explanation with specific data sources. Must include: 1) Current spending amount from transaction data, 2) Percentage of total expenses, 3) Comparison to income, 4) Specific reduction target based on intensity level, 5) Reference to historical spending patterns observed in the transaction list."
  }
]
</${endBudgetTag}>

CRITICAL RULES FOR BUDGET JUSTIFICATIONS:
- Each budget limit reasoning MUST be comprehensive (minimum 3-4 sentences)
- MUST explicitly state the data source: "Based on your transaction history showing..."
- MUST include specific numbers: current spending amount, percentage of expenses, income ratio
- MUST reference the intensity level chosen by the user and how it affects the limit
- MUST cite specific observations from the transaction data (e.g., "Your recent transactions show 15 purchases in this category...")
- Use ONLY the exact tag names provided above
- Do NOT mention or use these tag names anywhere else in your response except in the proposal sections at the very end
- For budget limits, use ONLY the valid category names from the list: Food & Drinks, Transport, Shopping, Bills, Entertainment, Healthcare, Education, or Other
- Do NOT create new category names or variations`;

    await SavingsPlan.findByIdAndUpdate(planId, {
      generationProgress: "AI analyzing your finances...",
    });

    const messages: ClovaMessage[] = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: "Please analyze my financial situation and create a personalized saving plan for me with specific, actionable advice.",
      },
    ];

    // No tools - everything is in the prompt
    const tools: any[] = [];

    session.addMessage("AI is analyzing your financial data...");

    // Stream the response
    const stream = await streamClovaAPI(messages, tools);

    let fullResponse = "";

    for await (const chunk of stream) {
      if (chunk.choices && chunk.choices[0]) {
        const delta = chunk.choices[0].delta;

        if (delta?.content) {
          fullResponse += delta.content;
          
          // Stream content to session (every 50 chars to avoid spam)
          if (fullResponse.length % 50 === 0) {
            session.addMessage(`AI: ...`);
          }
        }

        if (chunk.choices[0].finish_reason) {
          break;
        }
      }
    }

    session.addMessage("AI generation complete! Parsing results...");

    // Parse the response to extract proposals
    let proposedGoal: any = null;
    let proposedBudgetLimits: any[] = [];
    let markdownAdvice = fullResponse;

    // Extract saving goal
    const goalRegex = new RegExp(`<${goalTag}>\\s*({[^]*?})\\s*</${endGoalTag}>`, 'i');
    const goalMatch = fullResponse.match(goalRegex);
    if (goalMatch && goalMatch[1]) {
      try {
        proposedGoal = JSON.parse(goalMatch[1].trim());
        // Remove the tag section from markdown
        markdownAdvice = markdownAdvice.replace(goalMatch[0], '').trim();
      } catch (e) {
        console.error('Failed to parse proposed goal:', e);
      }
    }

    // Extract budget limits
    const budgetRegex = new RegExp(`<${budgetTag}>\\s*(\\[[^]*?\\])\\s*</${endBudgetTag}>`, 'i');
    const budgetMatch = fullResponse.match(budgetRegex);
    if (budgetMatch && budgetMatch[1]) {
      try {
        proposedBudgetLimits = JSON.parse(budgetMatch[1].trim());
        // Remove the tag section from markdown
        markdownAdvice = markdownAdvice.replace(budgetMatch[0], '').trim();
      } catch (e) {
        console.error('Failed to parse budget limits:', e);
      }
    }

    // Calculate suggested savings
    const suggestedSavings = savingsGoal || (proposedGoal?.target ? Math.round(proposedGoal.target / 12) : Math.round(balance * 0.2));

    // Update the plan with final results
    await SavingsPlan.findByIdAndUpdate(planId, {
      streamingStatus: "completed",
      generationProgress: "Plan generation completed!",
      suggestedSavings,
      markdownAdvice,
      proposedGoal: proposedGoal ? {
        name: proposedGoal.name,
        target: proposedGoal.target,
        priority: proposedGoal.priority || 'medium',
        accepted: false,
        duration: proposedGoal.duration || 12 // fallback 12 tháng nếu không có
      } : undefined,
      proposedBudgetLimits: proposedBudgetLimits.length > 0 ? proposedBudgetLimits : undefined,
    });

    session.complete({
      suggestedSavings,
      markdownAdvice,
      proposedGoal,
      proposedBudgetLimits,
    });

    session.addMessage("Plan generation completed!");

    // Keep session alive for 5 minutes for reconnections
    setTimeout(() => {
      activeSessions.delete(planId.toString());
    }, 5 * 60 * 1000);
  } catch (error) {
    console.error("AI generation error:", error);

    await SavingsPlan.findByIdAndUpdate(planId, {
      streamingStatus: "failed",
      generationProgress: `Error: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    });

    session.fail(error instanceof Error ? error.message : "Unknown error");

    // Remove session after 1 minute
    setTimeout(() => {
      activeSessions.delete(planId.toString());
    }, 60 * 1000);

    throw error;
  }
}



//handle speech to text
interface AuthRequest extends Request {
  file?: Express.Multer.File;
}

// Hàm này sẽ được gọi bởi Route
export const handleSpeechToText = async (req: AuthRequest, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ message: "Không tìm thấy file âm thanh." });
  }

  // LẤY KEY STT
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  const apiUrl = "https://naveropenapi.apigw.ntruss.com/recog/v1/stt?lang=Eng";

  // req.file.buffer là dữ liệu nhị phân (binary) của file âm thanh
  const audioData = req.file.buffer;

  try {
    // GỌI AXIOS (theo tài liệu [cite: STT (Speech-to-Text).pdf, page 2])
    const response = await axios.post(
      apiUrl,
      audioData, // Gửi file audio làm body
      {
        headers: {
          "Content-Type": "application/octet-stream", // Kiểu nội dung bắt buộc
          "X-NCP-APIGW-API-KEY-ID": clientId,
          "X-NCP-APIGW-API-KEY": clientSecret,
          "Content-Length": audioData.length,
        },
      }
    );

    // TRẢ VỀ TEXT
    // Naver trả về { "text": "..." } gửi nó về cho frontend
    res.status(200).json(response.data);
  } catch (error: any) {
    console.error("Lỗi khi gọi Naver STT:", error.response?.data);
    res.status(500).json({
      message: "Lỗi từ server AI",
      details: error.response?.data,
    });
  }
};

//LLM xử lý text trả về từ handleSpeechToText
export const handleParseTransaction = async (req: Request, res: Response) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ message: "Không có text để phân tích." });
  }

  //Prompt (Câu lệnh) cho AI
  const systemPrompt = `
    You are a highly specialized financial parser. Your ONLY task is to receive a text string and convert it into a valid JSON object. Do not add any explanatory text.

    RULES:
    1.  **Input Language:** The input string will be in English.
    2.  **Output Format:** Respond ONLY with JSON in this format: { "note": string, "amount": number, "type": "expense" | "income", "date": "YYYY-MM-DD" }
    3.  **Number Parsing (English):**
        - "k" means 1000. (e.g., "20k" -> 20000)
        - "thousand" means 1000. (e.g., "50 thousand" -> 50000)
    4.  **Type Detection:**
        - Default to 'type': 'expense'.
        - Set 'type' to 'income' ONLY IF the input contains words: "income", "salary", "received", "got paid".
    5.  **Note Field:**
        - 'note' is the transaction description (e.g., "coffee", "lunch", "received salary").
    6.  **Amount Field:**
        - 'amount' MUST be a JSON number, not a string.
    7.  **Date Field:**
        - 'date' must be today's date in "YYYY-MM-DD" format. (e.g., "${
          new Date().toISOString().split("T")[0]
        }")

    EXAMPLES:
    - Input: "coffee 20k"
    - Output: {"note":"coffee","amount":20000,"type":"expense","date":"${
      new Date().toISOString().split("T")[0]
    }"}
    - Input: "received salary 1000k"
    - Output: {"note":"received salary","amount":1000000,"type":"income","date":"${
      new Date().toISOString().split("T")[0]
    }"}
    - Input: "lunch 50 thousand"
    - Output: {"note":"lunch","amount":50000,"type":"expense","date":"${
      new Date().toISOString().split("T")[0]
    }"}
    - Input: "buy games 120"
    - Output: {"note":"buy games","amount":120,"type":"expense","date":"${
      new Date().toISOString().split("T")[0]
    }"}

    Respond ONLY with the JSON object.
  `;

  //Build messages array
  const messages: ClovaMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: text },
  ];

  try {
    const aiResponse = await callClovaAPI(messages, []);

    // Lấy JSON từ AI
    // response nằm trong choices[0].message.content)
    const aiResponseText = aiResponse.choices[0].message.content;

    // Đôi khi AI trả về JSON nằm trong ```json ... ```, chúng ta cần làm sạch
    const jsonMatch = aiResponseText.match(/\{.*\}/s);
    if (!jsonMatch) {
      throw new Error("AI không trả về JSON hợp lệ");
    }

    const parsedJson = JSON.parse(jsonMatch[0]);

    // Trả JSON về cho Frontend
    // parsedJson sẽ là: { "note": "cafe", "amount": 20000, "type": "expense", "date": "..." }
    res.status(200).json(parsedJson);
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error("Lỗi khi gọi CLOVA Studio (Parse):", error.message);
    res.status(500).json({
      message: "Lỗi từ server AI (LLM)",
      details: error.message,
    });
  }
};
