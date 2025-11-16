//import dotenv from 'dotenv';
// Load environment variables
//dotenv.config();
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
<<<<<<< Updated upstream

=======
//import dotenv from 'dotenv';
>>>>>>> Stashed changes
import { MongoMemoryServer } from 'mongodb-memory-server';
import transactionsRouter from './routes/transactions.js';
import goalsRouter from './routes/goals.js';
import budgetsRouter from './routes/budgets.js';
import notificationRouter from './routes/notifications.js';
import aiRouter from './routes/ai.js';
import authRouter from './routes/auth.js';
import { authMiddleware } from './middleware/auth.js';
<<<<<<< Updated upstream
import multer from 'multer';
import { analyzeReceiptFromBuffer } from './services/clovaOcr.service.js';

=======
//dotenv.config();
import ocrRouter from './routes/ocr.js';
// Load environment variables
>>>>>>> Stashed changes


const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Cấu hình Multer để nhận file và lưu trong bộ nhớ
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // Giới hạn 10MB
});
// Public routes (no auth required)
app.use('/api/auth', authRouter);

// Protected routes (auth required)
app.use('/api/transactions', authMiddleware, transactionsRouter);
app.use('/api/goals', authMiddleware, goalsRouter);
app.use('/api/budgets', authMiddleware, budgetsRouter);
app.use('/api/ai', authMiddleware, aiRouter);
app.use('/api/notifications', authMiddleware, notificationRouter);
<<<<<<< Updated upstream
app.post('/api/ocr/receipt', authMiddleware, upload.single('receiptImage'), async (req, res) => {
  console.log("Đã nhận được yêu cầu upload hóa đơn...");

  if (!req.file) {
    return res.status(400).json({ error: 'Không tìm thấy file ảnh. Hãy chắc chắn bạn gửi file với key là "receiptImage".' });
  }

  try {
    const imageBuffer = req.file.buffer;
    const result = await analyzeReceiptFromBuffer(imageBuffer);
    res.status(200).json(result);
  } catch (error: any) {
    console.error("Có lỗi trong quá trình xử lý OCR:", error.message);
    res.status(500).json({ error: error.message });
  }
});
=======
app.use('/api/ocr', ocrRouter);
>>>>>>> Stashed changes
// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend server is running' });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'MoneyTrack Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      transactions: '/api/transactions (protected)',
      goals: '/api/goals (protected)',
      budgets: '/api/budgets (protected)',
      ai: '/api/ai (protected)'
    }
  });
});

// MongoDB connection - use real MongoDB (memory server for testing)
async function connectDB() {
  try {
    let mongoUri = process.env.MONGODB_URI;
    
    // If no MongoDB URI provided or connection fails, use MongoMemoryServer
    if (!mongoUri) {
      console.log('🔄 Starting MongoDB Memory Server...');
      const mongoServer = await MongoMemoryServer.create();
      mongoUri = mongoServer.getUri();
      console.log('✅ MongoDB Memory Server started');
    }
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    console.log('📊 Database ready for operations');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
}

// Start server
async function startServer() {
  await connectDB();
  
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 API endpoints available at http://localhost:${PORT}/api`);
  });
}

startServer();

export default app;
