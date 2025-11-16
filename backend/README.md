# MoneyTrack Backend

Express + MongoDB backend server for the MoneyTrack application with mock AI capabilities.

## Features

- **RESTful API** for transactions, goals, budgets, and savings plans
- **Mock AI API** using Markov chain and random number generation for savings recommendations
- **MongoDB Integration** with in-memory fallback when MongoDB is not available
- **CORS enabled** for frontend integration
- **TypeScript** for type safety

## Getting Started

### Prerequisites

- Node.js (v20 or later)
- MongoDB (optional - runs with in-memory store if not available)

### Installation

```bash
npm install
```

### Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Environment variables:

- `PORT` - Server port (default: 3001)
- `MONGODB_URI` - MongoDB connection string (default: mongodb://localhost:27017/moneytrack)
- `NODE_ENV` - Environment (development/production)

### Running the Server

Development mode with auto-reload:

```bash
npm run dev
```

Build for production:

```bash
npm run build
npm start
```

## API Endpoints

### Health Check

- `GET /api/health` - Check server status

### Transactions

- `GET /api/transactions` - Get all transactions
- `GET /api/transactions/:id` - Get transaction by ID
- `POST /api/transactions` - Create new transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction
- `GET /api/transactions/stats/summary` - Get income/expense summary

### Goals

- `GET /api/goals` - Get all goals
- `GET /api/goals/:id` - Get goal by ID
- `POST /api/goals` - Create new goal
- `PUT /api/goals/:id` - Update goal
- `DELETE /api/goals/:id` - Delete goal

### Budgets

- `GET /api/budgets` - Get all budgets
- `GET /api/budgets/month/:month` - Get budgets for specific month
- `POST /api/budgets` - Create new budget
- `PUT /api/budgets/:id` - Update budget
- `DELETE /api/budgets/:id` - Delete budget

### AI (Mock API)

- `POST /api/ai/generate` - Generate savings plan using mock AI
  - Request body: `{ goal, savingsGoal?, intensity, notes? }`
  - Returns: Savings plan with suggested amount and recommendations
- `GET /api/ai/latest` - Get latest savings plan
- `GET /api/ai` - Get all savings plans
- `POST /api/ai/advice` - Get AI-generated financial advice
- `POST /api/ai/speech-to-text` - AI change speech to text'
- `POST /api/ai/parse-text` - get AI generated transaction from text'

## Mock AI Implementation

The mock AI uses:

- **Markov Chain** for selecting spending categories to reduce or protect
- **Random Number Generation** influenced by intensity level for calculating savings amounts
- **Pattern Matching** on user notes to adjust recommendations

This provides realistic-looking AI behavior until the real AI API is ready.

## Architecture

```
backend/
├── src/
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API route handlers
│   ├── utils/           # Utilities (mock AI, in-memory store)
│   └── server.ts        # Main server file
├── package.json
└── tsconfig.json
```

## Notes

- The server runs without MongoDB by using an in-memory data store
- Mock data is pre-populated for demonstration purposes
- All API endpoints support CORS for frontend integration
