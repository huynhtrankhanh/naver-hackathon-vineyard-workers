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
import { getToolDefinitions, executeToolCall } from "./aiTools.js";
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
      streamingStatus: "streaming",
      generationProgress: "Preparing AI prompt...",
    });

    session.status = "streaming";
    session.addMessage("Preparing AI prompt...");

    // Build system prompt
    const systemPrompt = `You are a financial advisor AI helping users create personalized saving plans.

Your task is to:
1. Analyze the user's financial data using the provided tools
2. Propose a realistic monthly saving goal (use propose_saving_goal tool)
3. Suggest budget limit adjustments to help achieve the goal (use propose_budget_limits tool)
4. Provide detailed advice in Markdown format

User's request:
- Goal: ${goal}
${
  savingsGoal
    ? `- Target monthly saving: $${savingsGoal}`
    : "- No specific target (suggest one)"
}
- Intensity: ${intensity}
${notes ? `- Additional notes: ${notes}` : ""}

Guidelines:
- Use the tools to read user data first
- Be realistic and considerate of their intensity level
- "Just starting out" = gentle changes
- "Ideal target" = balanced approach
- "Must achieve" = aggressive but achievable changes
- Provide actionable, specific advice`;

    const messages: ClovaMessage[] = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content:
          "Please analyze my financial situation and create a personalized saving plan for me.",
      },
    ];

    // Temporarily disable tools to test API
    // const tools = getToolDefinitions();
    const tools: any[] = [];

    // Execute with tool calling loop
    let toolCallIteration = 0;
    const maxToolIterations = 10;
    let fullResponse = "";
    let proposedGoal: any = null;
    let proposedBudgetLimits: any[] = [];

    while (toolCallIteration < maxToolIterations) {
      session.addMessage(
        `Processing with AI (iteration ${toolCallIteration + 1})...`
      );

      await SavingsPlan.findByIdAndUpdate(planId, {
        generationProgress: `AI thinking... (iteration ${
          toolCallIteration + 1
        })`,
      });

      // Stream the response
      const stream = await streamClovaAPI(messages, tools);

      let currentContent = "";
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
              if (
                toolCall.index !== undefined &&
                toolCall.index !== toolCallIndex
              ) {
                toolCallIndex = toolCall.index;
                currentToolCalls[toolCallIndex] = {
                  id: toolCall.id || `call_${Date.now()}_${toolCallIndex}`,
                  type: "function",
                  function: {
                    name: toolCall.function?.name || "",
                    arguments: toolCall.function?.arguments || "",
                  },
                };
              } else if (toolCallIndex >= 0 && toolCall.function?.arguments) {
                currentToolCalls[toolCallIndex].function.arguments +=
                  toolCall.function.arguments;
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
          role: "assistant",
          content: currentContent || "",
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
            generationProgress: `Executing tool: ${toolName}`,
          });

          // Execute the tool
          const result = await executeToolCall(toolName, toolArgs, userId);

          // Handle special tool results
          if (result.data?.type === "goal_proposal") {
            proposedGoal = result.data.proposal;
          } else if (result.data?.type === "budget_proposals") {
            proposedBudgetLimits = result.data.proposals;
          }

          // Add tool result to messages
          messages.push({
            role: "tool",
            content: JSON.stringify(result),
            tool_call_id: toolCall.id,
            name: toolName,
          });
        }

        toolCallIteration++;
        continue; // Continue the loop for next AI response
      }

      // No more tool calls, we're done
      break;
    }

    // Extract suggested savings from response or calculate
    const suggestedSavings =
      savingsGoal || extractSuggestedSavings(fullResponse) || 300;

    // Update the plan with final results
    await SavingsPlan.findByIdAndUpdate(planId, {
      streamingStatus: "completed",
      generationProgress: "Plan generation completed!",
      suggestedSavings,
      markdownAdvice: fullResponse,
      proposedGoal,
      proposedBudgetLimits,
    });

    session.complete({
      suggestedSavings,
      markdownAdvice: fullResponse,
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
    /target \$(\d+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return parseInt(match[1]);
    }
  }

  return null;
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
