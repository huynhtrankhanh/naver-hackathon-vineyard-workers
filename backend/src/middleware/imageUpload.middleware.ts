import multer from "multer";

// Cấu hình Multer để lưu file vào bộ nhớ (RAM)
const storage = multer.memoryStorage();

// Lọc file mới: Chỉ chấp nhận file ảnh
const imageFileFilter = (
  req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    // Tạo một lỗi có message rõ ràng để frontend có thể bắt
    const error = new Error("File tải lên không phải là ảnh!");
    (error as any).status = 400; // Bad Request
    cb(error);
  }
};

const uploadImage = multer({
  storage: storage,
  fileFilter: imageFileFilter,
  limits: {
    // Giới hạn file ảnh 10MB
    fileSize: 1024 * 1024 * 10,
  },
});

export default uploadImage;