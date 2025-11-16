import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import uploadImage from '../middleware/imageUpload.middleware.js'; // Giả sử middleware multer của chị tên là 'upload'
import { analyzeReceiptFromBuffer } from '../utils/ocr.service.js'; // Import từ file service chị vừa tạo

const router = express.Router();

// Định nghĩa endpoint POST /receipt
// Khi có request đến /api/ocr/receipt, nó sẽ chạy qua hàm này
router.post('/receipt', authMiddleware, uploadImage.single('receiptImage'), async (req, res) => {
    // Check xem có file được gửi lên không
    if (!req.file) {
        return res.status(400).json({ error: 'Không tìm thấy file ảnh (receiptImage).' });
    }

    try {
        // Gọi hàm phân tích OCR từ file service
        const result = await analyzeReceiptFromBuffer(req.file.buffer);
        // Trả kết quả JSON về cho frontend
        res.json(result);
    } catch (error: any) {
        console.error("Lỗi tại ocr route:", error);
        res.status(500).json({ error: error.message || 'Lỗi xử lý hóa đơn phía server.' });
    }
});

export default router;