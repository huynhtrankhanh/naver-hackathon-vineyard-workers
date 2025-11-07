import mongoose, { Schema, models, Document } from 'mongoose'

export interface ITransaction extends Document {
  amount: number
  category: string
  date: Date
  note?: string // '?' nghĩa là trường này không bắt buộc
  type: 'expense' | 'income' // Chỉ chấp nhận 1 trong 2 giá trị này
  user: Schema.Types.ObjectId // Liên kết với ID của User
}

const TransactionSchema = new Schema(
  {
    amount: { type: Number, required: true },
    category: { type: String, required: true },
    date: { type: Date, required: true },
    note: { type: String },
    type: { type: String, enum: ['expense', 'income'], required: true },

    // Liên kết với Model 'User'
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true } // Tự động thêm createdAt và updatedAt
)

const Transaction =
  models.Transaction ||
  mongoose.model<ITransaction>('Transaction', TransactionSchema)

export default Transaction
