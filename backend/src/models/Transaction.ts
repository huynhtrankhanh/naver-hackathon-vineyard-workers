import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  title: string;
  category: string;
  amount: number;
  date: Date;
  userId: mongoose.Types.ObjectId;
  type: 'income' | 'expense';
}

const TransactionSchema: Schema = new Schema({
  title: { type: String, required: true },
  category: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['income', 'expense'], required: true }
}, { timestamps: true });

export default mongoose.model<ITransaction>('Transaction', TransactionSchema);
