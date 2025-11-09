import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import transactionsRouter from './routes/transactions.js';
import goalsRouter from './routes/goals.js';
import budgetsRouter from './routes/budgets.js';
import aiRouter from './routes/ai.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/moneytrack';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/transactions', transactionsRouter);
app.use('/api/goals', goalsRouter);
app.use('/api/budgets', budgetsRouter);
app.use('/api/ai', aiRouter);

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
      transactions: '/api/transactions',
      goals: '/api/goals',
      budgets: '/api/budgets',
      ai: '/api/ai'
    }
  });
});

// MongoDB connection - optional for demonstration
async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 2000 });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.warn('⚠️  MongoDB not available. API will work with mock data.');
    console.warn('   Install and run MongoDB for persistent storage: mongod');
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
