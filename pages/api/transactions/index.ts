// pages/api/transactions.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import connectDB from '@/lib/db'
import Transaction from '@/models/Transaction.model'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import User from '@/models/User.model'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  //BẢO VỆ API: Lấy thông tin user từ session (JWT)
  const session = await getServerSession(req, res, authOptions)
  if (!session || !session.user?.email) {
    return res.status(401).json({ message: 'Chưa xác thực' })
  }

  // Kết nối DB
  await connectDB()

  //TÌM USER ID: Lấy ID của user từ email trong session
  let user
  try {
    user = await User.findOne({ email: session.user.email }).select('_id')
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy user' })
    }
  } catch (e) {
    return res.status(500).json({ message: 'Lỗi tìm user' })
  }

  //Phân luồng theo phương thức (GET hoặc POST)
  switch (req.method) {
    // ### XỬ LÝ GET (LẤY DỮ LIỆU) ###
    case 'GET':
      try {
        // Tìm tất cả chi tiêu CỦA user này, sắp xếp mới nhất lên đầu
        const transactions = await Transaction.find({ user: user._id }).sort({
          date: -1,
        })
        return res.status(200).json(transactions)
      } catch (error) {
        return res.status(500).json({ message: 'Lỗi khi lấy chi tiêu', error })
      }

    // ### XỬ LÝ POST (TẠO MỚI) ###
    case 'POST':
      try {
        const { amount, category, date, note, type } = req.body

        if (!amount || !category || !date || !type) {
          return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' })
        }

        // Tạo chi tiêu mới và gán 'user._id' vào
        const newTransaction = await Transaction.create({
          ...req.body,
          user: user._id, // Gán ID của user đã đăng nhập
        })

        return res.status(201).json(newTransaction)
      } catch (error) {
        return res.status(500).json({ message: 'Lỗi khi tạo chi tiêu', error })
      }

    // ### CÁC PHƯƠNG THỨC KHÁC ###
    default:
      res.setHeader('Allow', ['GET', 'POST'])
      return res
        .status(405)
        .json({ message: `Method ${req.method} Not Allowed` })
  }
}
