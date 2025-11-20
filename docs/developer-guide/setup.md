# Developer Setup Guide

This guide will help you set up SmartMoney for local development.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

### Required
- **Node.js**: v20 or later ([Download](https://nodejs.org/))
- **npm**: v10 or later (comes with Node.js)
- **Git**: For version control ([Download](https://git-scm.com/))

### Optional but Recommended
- **MongoDB**: v7.0 or later ([Download](https://www.mongodb.com/try/download/community))
  - Not required - app runs with MongoDB Memory Server by default
- **Docker & Docker Compose**: For containerized deployment ([Download](https://www.docker.com/))
- **VS Code**: Recommended editor with TypeScript support ([Download](https://code.visualstudio.com/))

## 🚀 Quick Start (5 minutes)

```bash
# 1. Clone the repository
git clone https://github.com/huynhtrankhanh/naver-hackathon-vineyard-workers.git
cd naver-hackathon-vineyard-workers

# 2. Install backend dependencies
cd backend
npm install

# 3. Create backend environment file
cp .env.example .env

# 4. Install frontend dependencies
cd ../Frontend-MoneyTrack
npm install

# 5. Start backend (Terminal 1)
cd ../backend
npm run dev
# Backend runs on http://localhost:3001

# 6. Start frontend (Terminal 2)
cd ../Frontend-MoneyTrack
npm run dev
# Frontend runs on http://localhost:5173
```

That's it! Open http://localhost:5173 in your browser.

## 📁 Project Structure

```
naver-hackathon-vineyard-workers/
├── backend/                      # Express + MongoDB backend
│   ├── src/
│   │   ├── models/              # Mongoose schemas
│   │   │   ├── User.ts
│   │   │   ├── Transaction.ts
│   │   │   ├── Goal.ts
│   │   │   ├── Budget.ts
│   │   │   ├── SavingsPlan.ts
│   │   │   ├── Notification.ts
│   │   │   └── Session.ts
│   │   ├── routes/              # API endpoints
│   │   │   ├── auth.ts
│   │   │   ├── transactions.ts
│   │   │   ├── goals.ts
│   │   │   ├── budgets.ts
│   │   │   ├── ai.ts
│   │   │   ├── ocr.ts
│   │   │   └── notifications.ts
│   │   ├── middleware/          # Express middleware
│   │   │   ├── auth.middleware.ts
│   │   │   └── multer.middleware.ts
│   │   ├── services/            # Business logic
│   │   │   └── clovaOcr.service.ts
│   │   ├── utils/               # Utilities
│   │   │   ├── aiService.ts     # Clova AI client
│   │   │   ├── aiTools.ts       # AI function tools
│   │   │   ├── clovaClient.ts   # Clova API client
│   │   │   ├── clovaX.service.ts # STT service
│   │   │   ├── ocr.service.ts   # OCR processing
│   │   │   └── pythonSandbox.ts # Firejail sandbox
│   │   └── server.ts            # Main server
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── Frontend-MoneyTrack/         # React + Ionic frontend
│   ├── src/
│   │   ├── pages/              # Page components
│   │   │   ├── splash.tsx
│   │   │   ├── SignIn.tsx
│   │   │   ├── SignUp.tsx
│   │   │   ├── SavingsOnboarding.tsx
│   │   │   └── dashboard/      # Main app pages
│   │   │       ├── Dashboard.tsx
│   │   │       ├── AddTransaction.tsx
│   │   │       ├── AddReceipt.tsx
│   │   │       ├── AddTransactionVoice.tsx
│   │   │       ├── EditTransaction.tsx
│   │   │       ├── Expenses.tsx
│   │   │       ├── Income.tsx
│   │   │       ├── Budget.tsx
│   │   │       ├── Goals.tsx
│   │   │       ├── GoalsAll.tsx
│   │   │       ├── SavingPlansAll.tsx
│   │   │       ├── SavingPlanDetail.tsx
│   │   │       ├── Notification.tsx
│   │   │       └── Profile.tsx
│   │   ├── components/         # Reusable components
│   │   ├── services/          # API & state management
│   │   │   ├── api.ts         # API client
│   │   │   ├── BalanceContext.tsx
│   │   │   ├── stateInvalidation.ts
│   │   │   └── useStateInvalidation.ts
│   │   ├── utils/             # Helper functions
│   │   └── App.tsx            # Root component
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── docs/                       # Documentation
├── screenshots/                # App screenshots
├── foundational documents/     # Project planning docs
├── docker-compose.yml
├── Dockerfile
└── README.md
```

## 🔧 Detailed Setup

### Backend Setup

#### 1. Environment Variables

Create `backend/.env` with the following variables:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database (Optional - uses MongoDB Memory Server if not set)
MONGODB_URI=mongodb://localhost:27017/moneytrack

# Naver Clova Studio API (Required for AI features)
CLOVA_API_KEY=your-api-key-here
CLOVA_API_URL=https://clovastudio.stream.ntruss.com/v1/openai/chat/completions

# Naver Clova OCR API (Required for receipt scanning)
CLOVA_OCR_API_URL=your-ocr-api-url
CLOVA_OCR_SECRET_KEY=your-ocr-secret-key

# Naver Clova X API (Required for voice input)
NAVER_CLIENT_ID=your-client-id
NAVER_CLIENT_SECRET=your-client-secret
```

**Notes:**
- Without API keys, AI features will not work but app still runs
- MongoDB Memory Server is used by default if `MONGODB_URI` is not set
- API keys should never be committed to Git (`.env` is gitignored)

#### 2. Install Dependencies

```bash
cd backend
npm install
```

Key dependencies:
- `express`: Web framework
- `mongoose`: MongoDB ODM
- `mongodb-memory-server`: In-memory MongoDB for dev/test
- `axios`: HTTP client for AI APIs
- `openai`: OpenAI-compatible client for Clova Studio
- `multer`: File upload handling
- `uuid`: Session ID generation
- `puppeteer`: Web scraping for docs

#### 3. Development Mode

```bash
npm run dev
```

This starts the server with:
- Hot reload on file changes (via `tsx watch`)
- Environment variables loaded from `.env`
- MongoDB Memory Server initialization
- Server running on `http://localhost:3001`

#### 4. Build for Production

```bash
npm run build  # Compile TypeScript to JavaScript
npm start      # Run compiled code
```

### Frontend Setup

#### 1. Environment Variables (Optional)

Create `Frontend-MoneyTrack/.env`:

```env
VITE_API_URL=http://localhost:3001/api
```

If not set, defaults to `http://localhost:3001/api`.

#### 2. Install Dependencies

```bash
cd Frontend-MoneyTrack
npm install
```

Key dependencies:
- `react` & `react-dom`: UI library
- `@ionic/react`: Mobile UI components
- `react-router-dom`: Routing
- `lucide-react`: Icons
- `libsodium-wrappers-sumo`: Cryptography (argon2id)
- `react-markdown`: Markdown rendering
- `tailwindcss`: Utility-first CSS

#### 3. Development Mode

```bash
npm run dev
```

This starts Vite dev server with:
- Hot Module Replacement (HMR)
- Fast refresh
- TypeScript type checking
- Server running on `http://localhost:5173`

#### 4. Build for Production

```bash
npm run build    # TypeScript compile + Vite build
npm run preview  # Preview production build
```

## 🐳 Docker Setup (Alternative)

### Prerequisites
- Docker & Docker Compose installed

### Quick Start

```bash
# Start all services (MongoDB + App)
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down
```

The application will be available at:
- **Frontend & Backend**: http://localhost:3001
- **MongoDB**: localhost:27017

### Docker Architecture

The setup includes two services:

1. **mongodb**: MongoDB 7.0 with persistent volumes
2. **app**: Combined frontend + backend server

Persistent data:
- `mongodb_data`: Database files
- `mongodb_config`: MongoDB configuration

To remove all data:
```bash
docker compose down -v  # ⚠️ Deletes all database data!
```

See [Docker Guide](../deployment/docker.md) for more details.

## 🔍 Verification

After setup, verify everything works:

### Backend Health Check
```bash
curl http://localhost:3001/api/health
# Should return: {"status":"ok","message":"Backend server is running"}
```

### Frontend Access
1. Open http://localhost:5173
2. You should see the splash screen
3. Click "Sign Up" to create an account

### Database Check (if using MongoDB)
```bash
mongosh moneytrack
> show collections
> db.users.find()
```

### Test AI Integration (if API keys configured)
1. Sign in to the app
2. Go to "Saving" tab
3. Click "Create Saving Plan with AI"
4. Complete the wizard
5. Check if AI generates a plan

## 🛠️ Development Tools

### Recommended VS Code Extensions

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "styled-components.vscode-styled-components",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

### Useful Commands

#### Backend
```bash
npm run dev      # Start with hot reload
npm run build    # Compile TypeScript
npm start        # Run production build
```

#### Frontend
```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run preview  # Preview build
npm run lint     # Run ESLint
npm run test.unit    # Run unit tests
npm run test.e2e     # Run Cypress tests
```

### Debugging

#### Backend Debugging
Add to VS Code `launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Backend",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["run", "dev"],
  "cwd": "${workspaceFolder}/backend",
  "console": "integratedTerminal"
}
```

#### Frontend Debugging
Use Chrome DevTools:
1. Open http://localhost:5173
2. Press F12
3. Set breakpoints in Sources tab
4. React DevTools extension recommended

## 🧪 Testing

### Unit Tests
```bash
# Frontend
cd Frontend-MoneyTrack
npm run test.unit
```

### E2E Tests
```bash
# Frontend
cd Frontend-MoneyTrack
npm run test.e2e
```

## 📚 Next Steps

- [Architecture Overview](architecture.md) - Understand system design
- [Contributing Guidelines](contributing.md) - Learn development workflow
- [API Reference](../api-reference/endpoints.md) - Explore API endpoints
- [Testing Guide](testing.md) - Write tests for your changes

## 🐛 Troubleshooting

### Common Issues

#### "Cannot connect to MongoDB"
- **Solution**: App uses MongoDB Memory Server by default, no action needed
- If using real MongoDB, ensure it's running: `mongod --dbpath /data/db`

#### "Port 3001 already in use"
- **Solution**: Kill existing process or change PORT in `.env`
```bash
lsof -ti:3001 | xargs kill -9  # Unix/Mac
netstat -ano | findstr :3001   # Windows
```

#### "CLOVA_API_KEY not configured"
- **Solution**: AI features require API keys. Add to `.env` or features won't work
- App still functions without AI features

#### "Frontend shows blank page"
- **Solution**: Check browser console for errors
- Ensure backend is running on port 3001
- Check `VITE_API_URL` in `.env`

#### "TypeScript errors"
- **Solution**: Ensure all dependencies installed
```bash
cd backend && npm install
cd ../Frontend-MoneyTrack && npm install
```

#### "Cannot scan receipts"
- **Solution**: OCR requires `CLOVA_OCR_API_URL` and `CLOVA_OCR_SECRET_KEY`
- Configure in `backend/.env`

## 💡 Development Tips

1. **Use separate terminals** for backend and frontend
2. **Enable auto-save** in your editor for hot reload
3. **Check console logs** frequently during development
4. **Test in mobile viewport** (Cmd+Shift+M in Chrome)
5. **Clear browser cache** if seeing stale data
6. **Use React DevTools** for component inspection
7. **Monitor network tab** for API calls
8. **Keep dependencies updated**: `npm outdated`

## 🤝 Getting Help

If you encounter issues:
1. Check this guide and [Troubleshooting](troubleshooting.md)
2. Search [GitHub Issues](https://github.com/huynhtrankhanh/naver-hackathon-vineyard-workers/issues)
3. Create a new issue with:
   - Steps to reproduce
   - Error messages
   - Environment details (OS, Node version, etc.)
