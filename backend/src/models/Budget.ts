import mongoose, { Schema, Document } from 'mongoose';

export interface IBudget extends Document {
  category: string;
  limit: number;
  spent: number;
  userId?: string;
  month: string;
}

const BudgetSchema: Schema = new Schema({
  category: { type: String, required: true },
  limit: { type: Number, required: true },
  spent: { type: Number, default: 0 },
  userId: { type: String, default: 'default' },
  month: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model<IBudget>('Budget', BudgetSchema);
