import mongoose, { Schema, Document } from 'mongoose';

export interface ISavingsPlan extends Document {
  goal: string;
  savingsGoal?: number;
  intensity: string;
  notes?: string;
  userId: mongoose.Types.ObjectId;
  suggestedSavings: number;
  recommendations: Array<{
    type: 'reduce' | 'protect';
    category: string;
    percentage?: number;
  }>;
  markdownAdvice?: string;
  // New fields for proposals
  proposedGoal?: {
    name: string;
    target: number;
    priority: string;
    accepted: boolean;
    linkedGoalId?: mongoose.Types.ObjectId;
    duration?: number;
  };
  proposedBudgetLimits?: Array<{
    category: string;
    suggestedLimit: number;
    currentLimit?: number;
    reasoning?: string;
  }>;
  // AI generation tracking
  streamingStatus?: 'pending' | 'streaming' | 'completed' | 'failed';
  generationProgress?: string;
}

const SavingsPlanSchema: Schema = new Schema({
  goal: { type: String, required: true },
  savingsGoal: { type: Number },
  intensity: { type: String, required: true },
  notes: { type: String },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  suggestedSavings: { type: Number, required: true },
  recommendations: [{
    type: { type: String, enum: ['reduce', 'protect'], required: true },
    category: { type: String, required: true },
    percentage: { type: Number }
  }],
  markdownAdvice: { type: String },
  // New fields for proposals
  proposedGoal: {
    name: { type: String },
    target: { type: Number },
    priority: { type: String },
    accepted: { type: Boolean, default: false },
    linkedGoalId: { type: Schema.Types.ObjectId, ref: 'Goal' },
    duration: { type: Number }
  },
  proposedBudgetLimits: [{
    category: { type: String, required: true },
    suggestedLimit: { type: Number, required: true },
    currentLimit: { type: Number },
    reasoning: { type: String }
  }],
  // AI generation tracking
  streamingStatus: { type: String, enum: ['pending', 'streaming', 'completed', 'failed'], default: 'completed' },
  generationProgress: { type: String }
}, { timestamps: true });

export default mongoose.model<ISavingsPlan>('SavingsPlan', SavingsPlanSchema);
