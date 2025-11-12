# SmartMoney - Naver Hackathon Vineyard Workers

A comprehensive money tracking and AI-powered savings recommendation app built with React (Ionic), Express, and MongoDB.

## 🎯 Features

### Completed ✅
- **Username/Password Authentication** - Secure authentication with argon2id client-side hashing and SHA256 server-side hashing
- **Protected API Endpoints** - All backend routes require authentication
- **AI-Powered Savings Wizard** - Interactive 3-step onboarding to create personalized savings plans
- **Mock AI Backend** - Sophisticated mock AI using Markov chains and random number generation
- **Full-Stack Architecture** - React frontend with Express + MongoDB backend
- **RESTful API** - Complete CRUD operations for transactions, goals, and budgets
- **Beautiful UI** - Modern, mobile-first design with Ionic components

## 📸 Application Screenshots

### Authentication Pages

**Splash Screen**

![Splash Screen](https://github.com/user-attachments/assets/3edd34ac-ade4-466b-90ab-c387d4c3df37)

**Sign Up Page**

![Sign Up](https://github.com/user-attachments/assets/af90beda-f601-4e94-b0cd-58f207b4b3a1)

**Sign In Page**

![Sign In](https://github.com/user-attachments/assets/63c1e9e5-35c2-4492-ab73-144cb8c8b7e3)

### Main Application Pages

**Dashboard**

![Dashboard](https://github.com/user-attachments/assets/3917409c-b796-4616-a95c-c07521cd670e)

**Saving Goals**

![Goals](https://github.com/user-attachments/assets/a09b3344-b0a5-4bf7-882f-fe2a0cab93e3)

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
- `POST /ai/generate` - Generate savings plan (protected)
  ```json
  {
    "goal": "Build a safety net",
    "savingsGoal": 300,
    "intensity": "Ideal target",
    "notes": "I have a wedding in June"
  }
  ```
- `GET /ai/latest` - Get latest savings plan (protected)
- `POST /ai/advice` - Get financial advice (protected)

**Authentication**
- `POST /auth/register` - Register new user
  ```json
  {
    "username": "john_doe",
    "passwordHash": "argon2id_hash_from_client"
  }
  ```
- `POST /auth/login` - Login user
  ```json
  {
    "username": "john_doe",
    "passwordHash": "argon2id_hash_from_client"
  }
  ```
- `GET /auth/verify` - Verify authentication token

## 🔔 Notification Triggers

The application automatically monitors your financial activity and sends notifications when certain conditions are met to help you stay on track with your budget:

### Conditions That Trigger Notifications

1. **High Spending Alert (Income Ratio Warning)**
   - **Trigger**: When your total expenses reach **80% or more** of your income for the current month
   - **Requirement**: Only triggered when you have recorded income (income > 0)
   - **Example**: If your monthly income is $3,000 and expenses reach $2,400 (80%), you'll receive a notification
   - **Message Format**: "You've spent X% of your income this month. Please review your spending."
   - **Purpose**: Helps prevent overspending and encourages budget review before exceeding income

2. **Budget Limit Warning**
   - **Trigger**: When spending in any budget category reaches **80% or more** of its allocated limit
   - **Requirement**: Applies to any budget with a defined limit (limit > 0)
   - **Example**: If you set a $500 dining budget and spend $400 (80%), you'll be notified
   - **Message Format**: 'Budget "[Category]" has used X% (spent / limit).'
   - **Purpose**: Provides early warning before exceeding budget limits in specific categories

### How Notifications Work

- Notifications are checked automatically when you visit the Dashboard
- Each notification is only shown once per session to avoid spam
- Notifications are stored in the database and can be viewed in the Notifications page
- You can mark notifications as read or mark all as read at once
- The system tracks notification history with timestamps for future reference

## 🔐 Authentication & Security

### Password Hashing Strategy ("Server Relief")
The application implements a two-layer password hashing approach:

1. **Client-Side (argon2id via libsodium)**:
   - Password is hashed using argon2id algorithm
   - Salt is derived from username + fixed site-specific salt
   - Fixed site salt prevents cross-site password database comparison
   - Memory: 19MB, Iterations: 2, Parallelism: 1
   - Output: 64-character hex string

2. **Server-Side (SHA256)**:
   - Server receives the argon2id hash from client
   - Applies SHA256 to the received hash
   - Stores the SHA256 hash in database

This approach provides:
- **Client-side protection**: Heavy computation (argon2id) runs on client, reducing server load
- **Rainbow table resistance**: Username-derived salt makes pre-computed tables ineffective
- **Cross-site protection**: Fixed site salt ensures leaked passwords can't be compared across sites
- **Server verification**: SHA256 allows quick verification without storing the argon2id hash directly

## 🛠️ Technology Stack

### Frontend
- **React 18** - UI library
- **Ionic Framework 8** - Mobile UI components
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **libsodium-wrappers** - Argon2id password hashing

### Backend
- **Express** - Web framework
- **MongoDB + Mongoose** - Database
- **TypeScript** - Type safety
- **CORS** - Cross-origin support
- **dotenv** - Environment configuration
- **crypto (Node.js)** - SHA256 password hashing

## 🔐 Security Notes

- ✅ **Authentication implemented** - Username/password authentication with argon2id + SHA256
- ✅ **Protected API endpoints** - All data routes require valid authentication token
- ✅ **Two-layer password hashing** - Argon2id on client, SHA256 on server
- ✅ **Site-specific salt** - Prevents cross-site password database comparison
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

### Global Balance State (Desync Fix)
- Balance is now managed globally via a React context provider `BalanceProvider` (`src/services/BalanceContext.tsx`).
- It polls the backend summary endpoint every 5 seconds (only when the page is visible) using the shared state invalidation service.
- Any backend mutation should call `useInvalidateOnMutation()` and optionally `useBalance().refresh()` to immediately reflect changes in balance.
- Pages that display the balance (Dashboard, Budgets, Goals, Add Transaction) now read from `useBalance()` and no longer fetch the summary individually. This eliminates desync across screens.

## 🎨 UI/UX Features

- **Mobile-First Design** - Optimized for mobile devices
- **Responsive Layout** - Works on desktop and mobile
- **Smooth Animations** - Polished transitions between steps
- **Progress Indicators** - Visual feedback throughout the wizard
- **Loading States** - AI processing simulation with status updates
- **Dark/Light Themes** - Result screen uses dark theme for emphasis

## 🚧 Future Enhancements

- [ ] Real AI API integration (replace mock)
- [x] User authentication (completed)
- [ ] Transaction history visualization
- [ ] Budget tracking dashboard
- [ ] Spending analytics
- [ ] Goal progress tracking
- [ ] Push notifications
- [ ] Export data (CSV/PDF)
- [ ] Password reset functionality
- [ ] Two-factor authentication

## 📄 License

MIT License - See LICENSE file for details

## 👥 Contributors

- Nguyễn Đỗ Chiến Thắng
- Nguyễn Hà Nam Trân
- Huỳnh Trần Khanh
- GitHub Copilot
- ChatGPT
- Gemini 2.5 Pro

## 🙏 Acknowledgments

- Naver Hackathon for the opportunity
- Ionic Framework for the mobile UI components
- MongoDB for the database
- Express.js for the backend framework
