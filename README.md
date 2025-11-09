# MoneyTrack - Naver Hackathon Vineyard Workers

A comprehensive money tracking and AI-powered savings recommendation app built with React (Ionic), Express, and MongoDB.

## 🎯 Features

### Completed ✅
- **AI-Powered Savings Wizard** - Interactive 3-step onboarding to create personalized savings plans
- **Mock AI Backend** - Sophisticated mock AI using Markov chains and random number generation
- **Full-Stack Architecture** - React frontend with Express + MongoDB backend
- **RESTful API** - Complete CRUD operations for transactions, goals, and budgets
- **Beautiful UI** - Modern, mobile-first design with Ionic components

### Demo Screens
The app includes a complete savings onboarding flow:
1. Welcome screen with AI introduction
2. Three-step wizard (Priority, Savings Goal, Intensity)
3. AI-generated personalized savings plan with recommendations

## 🚀 Getting Started

### Prerequisites
- Node.js v20+
- npm or yarn
- MongoDB (optional - runs with in-memory fallback)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/huynhtrankhanh/naver-hackathon-vineyard-workers.git
cd naver-hackathon-vineyard-workers
```

2. **Install Backend Dependencies**
```bash
cd backend
npm install
cp .env.example .env
```

3. **Install Frontend Dependencies**
```bash
cd ../Frontend-MoneyTrack
npm install
```

### Running the Application

**Option 1: Run Backend and Frontend Separately**

Terminal 1 - Backend:
```bash
cd backend
npm run dev
# Backend runs on http://localhost:3001
```

Terminal 2 - Frontend:
```bash
cd Frontend-MoneyTrack
npm run dev
# Frontend runs on http://localhost:5173 (or 5174)
```

**Option 2: Production Build**
```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd Frontend-MoneyTrack
npm run build
npm run preview
```

### Access the App
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001/api
- Savings Onboarding: http://localhost:5173/savings-onboarding

## 📁 Project Structure

```
naver-hackathon-vineyard-workers/
├── Frontend-MoneyTrack/          # React + Ionic Frontend
│   ├── src/
│   │   ├── pages/                # Page components
│   │   │   ├── SavingsOnboarding.tsx   # NEW: AI savings wizard
│   │   │   └── dashboard/        # Dashboard pages
│   │   ├── services/             # NEW: API service layer
│   │   │   └── api.ts            # Backend API integration
│   │   └── components/           # Reusable components
│   └── package.json
│
└── backend/                      # NEW: Express + MongoDB Backend
    ├── src/
    │   ├── models/               # MongoDB schemas
    │   │   ├── Transaction.ts
    │   │   ├── Goal.ts
    │   │   ├── Budget.ts
    │   │   └── SavingsPlan.ts
    │   ├── routes/               # API routes
    │   │   ├── transactions.ts
    │   │   ├── goals.ts
    │   │   ├── budgets.ts
    │   │   └── ai.ts             # Mock AI endpoint
    │   ├── utils/
    │   │   ├── mockAI.ts         # Markov chain AI logic
    │   │   └── inMemoryStore.ts  # Fallback data store
    │   └── server.ts             # Main server file
    └── package.json
```

## 🤖 Mock AI Implementation

The mock AI uses sophisticated algorithms to generate realistic savings recommendations:

### Markov Chain Selection
- Categories are selected using Markov-like random walks through spending category chains
- Categories are grouped into: discretionary, essential, and flexible
- The algorithm avoids duplicate categories across recommendations

### Random Number Generation
- Savings amounts are calculated with intensity-based multipliers:
  - **Just starting out**: 60-90% of goal
  - **Ideal target**: 90-110% of goal
  - **Must achieve**: 110-140% of goal
- Reduction percentages vary by intensity (10-35%)

### Context-Aware
- Analyzes user notes for keywords (wedding, travel, etc.)
- Adjusts recommendations based on detected context
- Provides 2-3 actionable recommendations per plan

## 🔧 API Endpoints

### Backend API (http://localhost:3001/api)

**Transactions**
- `GET /transactions` - List all transactions
- `POST /transactions` - Create transaction
- `GET /transactions/stats/summary` - Get income/expense summary

**Goals**
- `GET /goals` - List all goals
- `POST /goals` - Create goal

**Budgets**
- `GET /budgets` - List all budgets
- `GET /budgets/month/:month` - Get budgets by month

**AI (Mock)**
- `POST /ai/generate` - Generate savings plan
  ```json
  {
    "goal": "Build a safety net",
    "savingsGoal": 300,
    "intensity": "Ideal target",
    "notes": "I have a wedding in June"
  }
  ```
- `GET /ai/latest` - Get latest savings plan
- `POST /ai/advice` - Get financial advice

## 🛠️ Technology Stack

### Frontend
- **React 18** - UI library
- **Ionic Framework 8** - Mobile UI components
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

### Backend
- **Express** - Web framework
- **MongoDB + Mongoose** - Database
- **TypeScript** - Type safety
- **CORS** - Cross-origin support
- **dotenv** - Environment configuration

## 🔐 Security Notes

- No authentication implemented yet (demo/development mode)
- CORS is enabled for local development
- Environment variables used for configuration
- Input validation on backend routes
- No sensitive data exposed in API responses

## 📝 Development Notes

### MongoDB Not Required
The backend works without MongoDB by using an in-memory data store. This allows:
- Quick setup for development/demos
- Pre-populated mock data
- Full API functionality without database

### Environment Variables
Create a `.env` file in the backend directory:
```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/moneytrack
NODE_ENV=development
```

Frontend environment (optional, in `Frontend-MoneyTrack/.env`):
```env
VITE_API_URL=http://localhost:3001/api
```

## 🎨 UI/UX Features

- **Mobile-First Design** - Optimized for mobile devices
- **Responsive Layout** - Works on desktop and mobile
- **Smooth Animations** - Polished transitions between steps
- **Progress Indicators** - Visual feedback throughout the wizard
- **Loading States** - AI processing simulation with status updates
- **Dark/Light Themes** - Result screen uses dark theme for emphasis

## 🚧 Future Enhancements

- [ ] Real AI API integration (replace mock)
- [ ] User authentication
- [ ] Transaction history visualization
- [ ] Budget tracking dashboard
- [ ] Spending analytics
- [ ] Goal progress tracking
- [ ] Push notifications
- [ ] Export data (CSV/PDF)

## 📄 License

MIT License - See LICENSE file for details

## 👥 Contributors

- Huynh Tran Khanh
- GitHub Copilot

## 🙏 Acknowledgments

- Naver Hackathon for the opportunity
- Ionic Framework for the mobile UI components
- MongoDB for the database
- Express.js for the backend framework
