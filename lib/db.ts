import mongoose from 'mongoose'

let cached = (global as any).mongoose

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null }
}

async function connectDB() {
  //Kiểm tra kết nối có sẵn
  if (cached.conn) {
    return cached.conn
  }
  //Xử lý nhiều người gọi cùng lúc
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    }

    cached.promise = mongoose
      .connect(process.env.MONGODB_URI!, opts)
      .then((mongoose) => {
        return mongoose
      })
  }
  //Hoàn thành và Lưu kết nối
  try {
    cached.conn = await cached.promise
  } catch (e) {
    cached.promise = null
    throw e
  }

  return cached.conn
}

export default connectDB
