import multer from "multer";

// Cấu hình Multer để lưu file vào bộ nhớ (RAM)
// Cách này nhanh vì chúng ta chỉ chuyển tiếp file đi
const storage = multer.memoryStorage();

// Lọc file, chỉ chấp nhận file âm thanh
const fileFilter = (
  req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Naver STT hỗ trợ mp3, aac, wav, flac
  if (file.mimetype.startsWith("audio/")) {
    cb(null, true);
  } else {
    cb(new Error("Not an audio file!"));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    // Giới hạn file 5MB (Naver STT giới hạn 60s)
    fileSize: 1024 * 1024 * 5,
  },
});

export default upload;
