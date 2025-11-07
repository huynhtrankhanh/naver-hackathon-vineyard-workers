// pages/api/transactions/[id].ts
import type { NextApiRequest, NextApiResponse } from 'next'
import connectDB from '@/lib/db'
import Transaction from '@/models/Transaction.model'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import mongoose from 'mongoose'
import User from '@/models/User.model'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query

  if (!id || typeof id !== 'string' || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'ID chi tiêu không hợp lệ' })
  }

  const session = await getServerSession(req, res, authOptions)
  if (!session || !session.user || !session.user.email) {
    return res.status(401).json({ message: 'Chưa xác thực' })
  }

  await connectDB()

  //LẤY USER ID
  let user
  try {
    user = await User.findOne({ email: session.user.email }).select('_id')
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy user' })
    }
  } catch (e) {
    return res.status(500).json({ message: 'Lỗi tìm user' })
  }

  // Phân luồng
  switch (req.method) {
    case 'PUT':
      try {
        const body = req.body
        const updatedTransaction = await Transaction.findOneAndUpdate(
          { _id: id, user: user._id },
          body,
          { new: true, runValidators: true }
        )

        if (!updatedTransaction) {
          return res
            .status(404)
            .json({
              message: 'Không tìm thấy chi tiêu hoặc bạn không có quyền',
            })
        }

        return res.status(200).json(updatedTransaction)
      } catch (error) {
        return res
          .status(500)
          .json({ message: 'Lỗi khi cập nhật chi tiêu', error })
      }

    case 'DELETE':
      try {
        const deletedTransaction = await Transaction.findOneAndDelete({
          _id: id,
          user: user._id,
        })

        if (!deletedTransaction) {
          return res
            .status(404)
            .json({
              message: 'Không tìm thấy chi tiêu hoặc bạn không có quyền',
            })
        }

        return res.status(200).json({ message: 'Xóa thành công' })
      } catch (error) {
        return res.status(500).json({ message: 'Lỗi khi xóa chi tiêu', error })
      }

    default:
      res.setHeader('Allow', ['PUT', 'DELETE'])
      return res
        .status(405)
        .json({ message: `Method ${req.method} Not Allowed` })
  }
}
