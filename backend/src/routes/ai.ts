import express, { Request, Response } from "express";
import mongoose from "mongoose";
import SavingsPlan from "../models/SavingsPlan.js";
import Goal from "../models/Goal.js";
import {
  generateMockSavingsPlan,
  generateFinancialAdvice,
} from "../utils/mockAI.js";
import {
  generateSavingPlan,
  getGenerationSession,
} from "../utils/aiService.js";
import upload from "../middleware/multer.middleware.js";
import {
  handleSpeechToText,
  handleParseTransaction,
} from "../utils/aiService.js";

const router = express.Router();

// Generate AI saving plan with real AI (with streaming support)
router.post("/generate", async (req: Request, res: Response) => {
  try {
    const { goal, savingsGoal, intensity, notes, useMock } = req.body;

    // Validate required fields
    if (!goal || !intensity) {
      return res.status(400).json({
        message: "Missing required fields: goal and intensity are required",
      });
    }

    const userId = new mongoose.Types.ObjectId(req.user!.id);

    // Use mock AI if requested or if Clova API key is not set
    if (useMock || !process.env.CLOVA_API_KEY) {
      console.log("Using mock AI generation...");

      // Use mock AI to generate the plan
      const aiResult = generateMockSavingsPlan({
        goal,
        savingsGoal,
        intensity,
        notes,
      });

      const planData = {
        goal,
        savingsGoal,
        intensity,
        notes,
        userId,
        suggestedSavings: aiResult.suggestedSavings,
        recommendations: aiResult.recommendations,
        markdownAdvice: aiResult.markdownAdvice,
      };

      // Save the generated plan to the database
      const savingsPlan = new SavingsPlan(planData);
      const savedPlan = await savingsPlan.save();

      return res.status(201).json(savedPlan);
    }

    // Use real AI with Clova Studio
    console.log("Using Clova Studio AI generation...");

    const planId = await generateSavingPlan({
      goal,
      savingsGoal,
      intensity,
      notes,
      userId,
    });

    // Return the plan ID immediately - client can stream progress
    res.status(202).json({
      planId,
      message: "AI generation started. Use /ai/stream/:planId to get progress.",
      streamUrl: `/api/ai/stream/${planId}`,
    });
  } catch (error) {
    console.error("Error generating saving plan:", error);
    res.status(500).json({ message: "Error generating saving plan", error });
  }
});

// Stream AI generation progress (SSE endpoint)
router.get("/stream/:planId", async (req: Request, res: Response) => {
  try {
    const planId = new mongoose.Types.ObjectId(req.params.planId);
    const userId = new mongoose.Types.ObjectId(req.user!.id);

    // Verify plan belongs to user
    const plan = await SavingsPlan.findOne({ _id: planId, userId });
    if (!plan) {
      return res.status(404).json({ message: "Saving plan not found" });
    }

    // Set up SSE
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    // Get session if exists
    const session = getGenerationSession(planId);

    if (!session) {
      // No active session - send current plan status
      res.write(
        `data: ${JSON.stringify({
          type: "status",
          status: plan.streamingStatus,
          message: plan.generationProgress,
        })}\n\n`
      );

      if (
        plan.streamingStatus === "completed" ||
        plan.streamingStatus === "failed"
      ) {
        res.write(
          `data: ${JSON.stringify({
            type: "complete",
            plan: plan,
          })}\n\n`
        );
        res.end();
      } else {
        // Poll for updates
        const pollInterval = setInterval(async () => {
          const updatedPlan = await SavingsPlan.findById(planId);
          if (updatedPlan) {
            res.write(
              `data: ${JSON.stringify({
                type: "status",
                status: updatedPlan.streamingStatus,
                message: updatedPlan.generationProgress,
              })}\n\n`
            );

            if (
              updatedPlan.streamingStatus === "completed" ||
              updatedPlan.streamingStatus === "failed"
            ) {
              res.write(
                `data: ${JSON.stringify({
                  type: "complete",
                  plan: updatedPlan,
                })}\n\n`
              );
              clearInterval(pollInterval);
              res.end();
            }
          }
        }, 1000);

        // Cleanup on client disconnect
        req.on("close", () => {
          clearInterval(pollInterval);
        });
      }
      return;
    }

    // Send existing messages
    for (const message of session.messages) {
      res.write(
        `data: ${JSON.stringify({
          type: "message",
          message,
        })}\n\n`
      );
    }

    // Listen for new messages
    const messageHandler = (message: string) => {
      res.write(
        `data: ${JSON.stringify({
          type: "message",
          message,
        })}\n\n`
      );
    };

    const completeHandler = (data: any) => {
      res.write(
        `data: ${JSON.stringify({
          type: "complete",
          data,
        })}\n\n`
      );
      cleanup();
      res.end();
    };

    const errorHandler = (error: string) => {
      res.write(
        `data: ${JSON.stringify({
          type: "error",
          error,
        })}\n\n`
      );
      cleanup();
      res.end();
    };

    const cleanup = () => {
      session.removeListener("message", messageHandler);
      session.removeListener("complete", completeHandler);
      session.removeListener("error", errorHandler);
    };

    session.on("message", messageHandler);
    session.on("complete", completeHandler);
    session.on("error", errorHandler);

    // Cleanup on client disconnect
    req.on("close", cleanup);
  } catch (error) {
    console.error("Error streaming progress:", error);
    res.status(500).json({ message: "Error streaming progress", error });
  }
});

// Get all savings plans
router.get("/", async (req: Request, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user!.id);
    const plans = await SavingsPlan.find({ userId }).sort({ createdAt: -1 });
    res.json(plans);
  } catch (error) {
    res.status(500).json({ message: "Error fetching savings plans", error });
  }
});

// Get latest savings plan
router.get("/latest", async (req: Request, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user!.id);
    const plan = await SavingsPlan.findOne({ userId }).sort({ createdAt: -1 });
    if (!plan) {
      return res.status(404).json({ message: "No savings plan found" });
    }
    res.json(plan);
  } catch (error) {
    res.status(500).json({ message: "Error fetching savings plan", error });
  }
});

// Get savings plan by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user!.id);
    const plan = await SavingsPlan.findOne({ _id: req.params.id, userId });
    if (!plan) {
      return res.status(404).json({ message: "Savings plan not found" });
    }
    res.json(plan);
  } catch (error) {
    res.status(500).json({ message: "Error fetching savings plan", error });
  }
});

// Get AI-generated financial advice (Mock AI endpoint)
router.post("/advice", async (req: Request, res: Response) => {
  try {
    const { context } = req.body;
    const advice = generateFinancialAdvice(context || "general");
    res.json({ advice });
  } catch (error) {
    res.status(500).json({ message: "Error generating advice", error });
  }
});

// Accept proposed saving goal from a plan
router.post("/:id/accept-goal", async (req: Request, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user!.id);
    const planId = new mongoose.Types.ObjectId(req.params.id);

    const plan = await SavingsPlan.findOne({ _id: planId, userId });
    if (!plan) {
      return res.status(404).json({ message: "Saving plan not found" });
    }

    if (!plan.proposedGoal) {
      return res.status(400).json({ message: "No proposed goal in this plan" });
    }

    if (plan.proposedGoal.accepted) {
      return res.status(400).json({ message: "Goal already accepted" });
    }

    // Create the goal
    const goal = new Goal({
      name: plan.proposedGoal.name,
      target: plan.proposedGoal.target,
      priority: plan.proposedGoal.priority,
      current: 0,
      userId,
      savingPlanId: planId,
    });

    await goal.save();

    // Update plan to mark goal as accepted
    plan.proposedGoal.accepted = true;
    plan.proposedGoal.linkedGoalId = goal._id as mongoose.Types.ObjectId;
    await plan.save();

    res.status(201).json({
      message: "Goal accepted and created successfully",
      goal,
    });
  } catch (error) {
    console.error("Error accepting goal:", error);
    res.status(500).json({ message: "Error accepting goal", error });
  }
});

// Delete savings plan
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user!.id);
    const plan = await SavingsPlan.findOneAndDelete({
      _id: req.params.id,
      userId,
    });
    if (!plan) {
      return res.status(404).json({ message: "Savings plan not found" });
    }
    res.json({ message: "Savings plan deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting savings plan", error });
  }
});

router.post(
  "/speech-to-text",
  upload.single("audio"), // Nhận 1 file tên là 'audio' từ FormData
  handleSpeechToText // Ủy quyền cho Service xử lý
);

router.post("/parse-text", handleParseTransaction);

export default router;
