import mongoose, { Schema, Document } from 'mongoose';

export interface ISavingsPlan extends Document {
  goal: string;
  savingsGoal?: number;
  intensity: string;
  notes?: string;
  userId?: string;
  suggestedSavings: number;
  recommendations: Array<{
    type: 'reduce' | 'protect';
    category: string;
    percentage?: number;
  }>;
}

const SavingsPlanSchema: Schema = new Schema({
  goal: { type: String, required: true },
  savingsGoal: { type: Number },
  intensity: { type: String, required: true },
  notes: { type: String },
  userId: { type: String, default: 'default' },
  suggestedSavings: { type: Number, required: true },
  recommendations: [{
    type: { type: String, enum: ['reduce', 'protect'], required: true },
    category: { type: String, required: true },
    percentage: { type: Number }
  }]
}, { timestamps: true });

export default mongoose.model<ISavingsPlan>('SavingsPlan', SavingsPlanSchema);
