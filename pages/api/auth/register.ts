import type { NextApiRequest, NextApiResponse } from 'next'
import connectDB from '@/lib/db'
import User from '@/models/User.model'
import bcrypt from 'bcrypt'

// Định nghĩa kiểu cho message trả về
type Data = {
  message: string
  error?: any // Thêm 'error' để gửi chi tiết lỗi
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  //Chỉ cho phép phương thức POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' })
  }
  try {
    //Lấy body
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Thiếu email hoặc mật khẩu' })
    }

    await connectDB()

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(409).json({ message: 'Email đã tồn tại' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    await User.create({ email, password: hashedPassword })

    return res.status(201).json({ message: 'Tạo tài khoản thành công' })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('LỖI API ĐĂNG KÝ:', error)
    return res.status(500).json({ message: 'Lỗi server nội bộ', error })
  }
}
