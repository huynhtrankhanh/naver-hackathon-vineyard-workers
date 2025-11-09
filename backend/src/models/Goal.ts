import mongoose, { Schema, Document } from 'mongoose';

export interface IGoal extends Document {
  name: string;
  target: number;
  current: number;
  priority: string;
  userId?: string;
}

const GoalSchema: Schema = new Schema({
  name: { type: String, required: true },
  target: { type: Number, required: true },
  current: { type: Number, default: 0 },
  priority: { type: String, default: 'medium' },
  userId: { type: String, default: 'default' }
}, { timestamps: true });

export default mongoose.model<IGoal>('Goal', GoalSchema);
