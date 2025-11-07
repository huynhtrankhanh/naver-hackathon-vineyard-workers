import mongoose, { Schema, models } from 'mongoose'

const UserSchema = new Schema(
  {
    email: {
      type: String,
      required: [true, 'Vui lòng cung cấp email'],
      unique: true, // Đảm bảo không ai đăng ký trùng email
    },
    password: {
      type: String,
      required: [true, 'Vui lòng cung cấp mật khẩu'],
    },
  },
  { timestamps: true } // Tự động thêm createdAt và updatedAt
)

// Kiểm tra xem model 'User' đã tồn tại chưa, nếu chưa thì tạo mới.
// Việc này để tránh lỗi "OverwriteModelError" khi code được re-run (tính năng của Next.js)
const User = models.User || mongoose.model('User', UserSchema)

export default User
