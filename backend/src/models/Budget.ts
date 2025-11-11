import mongoose, { Schema, Document } from 'mongoose';

export interface IBudget extends Document {
  category: string;
  limit: number;
  spent: number;
  userId: mongoose.Types.ObjectId;
  month: string;
}

const BudgetSchema: Schema = new Schema({
  category: { type: String, required: true },
  limit: { type: Number, required: true },
  spent: { type: Number, default: 0 },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  month: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model<IBudget>('Budget', BudgetSchema);
