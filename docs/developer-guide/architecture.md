# Architecture Overview

SmartMoney is built with a modern full-stack architecture optimized for mobile-first personal finance management.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  React + Ionic App (Frontend-MoneyTrack)              │  │
│  │  • SPA with React Router                              │  │
│  │  • Ionic components for mobile UX                     │  │
│  │  • State management with Context API                  │  │
│  │  • Client-side password hashing (argon2id)            │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS/REST API
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                      API Gateway Layer                       │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Express.js Server (backend/src/server.ts)            │  │
│  │  • CORS middleware                                    │  │
│  │  • Authentication middleware                          │  │
│  │  • File upload middleware (multer)                    │  │
│  │  • Route handlers                                     │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────────┘
                       │
         ┌─────────────┼─────────────┐
         │             │             │
         ▼             ▼             ▼
┌────────────┐  ┌──────────┐  ┌──────────────┐
│  Auth      │  │  Data    │  │  AI Services │
│  Services  │  │  Layer   │  │  Layer       │
└────────────┘  └──────────┘  └──────────────┘
                      │
                      ▼
            ┌──────────────────┐
            │  MongoDB         │
            │  • Users         │
            │  • Transactions  │
            │  • Goals         │
            │  • Budgets       │
            │  • SavingsPlans  │
            │  • Notifications │
            │  • Sessions      │
            └──────────────────┘
```

## Technology Stack

### Frontend

**Core Framework**
- **React 18**: Component-based UI library with hooks
- **TypeScript**: Static typing for safer code
- **Vite**: Lightning-fast build tool and dev server

**UI/UX**
- **Ionic Framework 8**: Mobile-optimized components
- **Tailwind CSS**: Utility-first styling
- **Lucide React**: Modern icon library
- **React Router Dom**: Client-side routing

**State Management**
- **React Context API**: Global balance state
- **Local State**: Component-level with useState/useReducer
- **Custom Hooks**: Reusable state logic

**Security**
- **libsodium-wrappers-sumo**: Client-side argon2id hashing
- **Secure token storage**: localStorage with precautions

**Rendering**
- **React Markdown**: Display AI-generated reports
- **Conditional Rendering**: Show/hide based on state

### Backend

**Core Framework**
- **Express.js 4**: Web application framework
- **TypeScript**: Type-safe server code
- **Node.js 20+**: JavaScript runtime

**Database**
- **MongoDB 7+**: NoSQL document database
- **Mongoose**: ODM (Object Document Mapper)
- **MongoDB Memory Server**: In-memory DB for dev/test

**Authentication**
- **Token-based auth**: Custom implementation
- **SHA256 hashing**: Server-side password verification
- **Middleware**: Protected route enforcement

**AI Integration**
- **Naver Clova Studio**: HCX-007 model with reasoning
- **OpenAI-compatible client**: For Clova API
- **Server-Sent Events (SSE)**: Streaming AI responses
- **Tool calling**: Function execution during AI generation

**OCR & STT**
- **Naver Clova OCR**: Receipt scanning
- **Naver Clova X STT**: Speech-to-text conversion
- **Image processing**: multer for file uploads

**Security & Isolation**
- **Firejail**: Python sandbox for AI code execution
- **Resource limits**: 6s timeout, 256MB RAM
- **Input validation**: Mongoose schemas

### DevOps

**Development**
- **tsx**: TypeScript execution and watch mode
- **nodemon**: Auto-restart on changes
- **Hot Module Replacement**: Instant UI updates

**Testing**
- **Vitest**: Unit testing framework
- **Cypress**: End-to-end testing
- **Jest DOM**: DOM testing utilities

**Containerization**
- **Docker**: Container runtime
- **Docker Compose**: Multi-container orchestration
- **Multi-stage builds**: Optimized image size

**Code Quality**
- **ESLint**: Code linting
- **TypeScript**: Compile-time checks
- **Prettier**: Code formatting (recommended)

## Data Flow

### 1. User Authentication Flow

```
┌─────────┐                                      ┌─────────┐
│ Client  │                                      │ Backend │
└────┬────┘                                      └────┬────┘
     │                                                 │
     │ 1. User enters username + password              │
     │                                                 │
     │ 2. Client hashes password with argon2id         │
     │    (salt = username + site-salt)                │
     │                                                 │
     │ 3. POST /auth/login                            │
     │    { username, passwordHash }                   │
     ├────────────────────────────────────────────────>│
     │                                                 │
     │                                    4. Hash with │
     │                                       SHA256    │
     │                                                 │
     │                                    5. Compare   │
     │                                       with DB   │
     │                                                 │
     │                                    6. Generate  │
     │                                       token     │
     │                                                 │
     │ 7. Return { token, username }                  │
     │<────────────────────────────────────────────────┤
     │                                                 │
     │ 8. Store token in localStorage                  │
     │                                                 │
     │ 9. Include in Authorization header              │
     │    for subsequent requests                      │
     │                                                 │
```

### 2. Transaction Creation Flow

```
User → AddTransaction Page
         ↓
     Choose Method
    /      |      \
Manual  Receipt  Voice
   ↓       ↓       ↓
 Form    OCR     STT
   ↓       ↓       ↓
   └───────┴───────┘
           ↓
    Review & Edit
           ↓
    POST /transactions
           ↓
    MongoDB Insert
           ↓
   State Invalidation
           ↓
  UI Updates (all pages)
```

### 3. AI Saving Plan Generation Flow

```
User Input (goal, amount, intensity, notes)
           ↓
POST /ai/generate
           ↓
Create Session & Plan Document
           ↓
    ┌──────┴──────┐
    │  Background  │
    │  AI Process  │
    └──────┬──────┘
           │
    ┌──────▼──────────────┐
    │  Clova Studio API   │
    │  • Analyzes data    │
    │  • Uses tools       │
    │  • Generates plan   │
    └──────┬──────────────┘
           │
    Streaming Updates (SSE)
           │
    ┌──────▼──────┐
    │   Client    │
    │  Reconnects │
    │  as needed  │
    └──────┬──────┘
           │
    Plan Completed
           │
    Display Results
```

### 4. State Invalidation Flow

```
Any Mutation (create/update/delete)
           ↓
   invalidateOnMutation()
           ↓
Mark all data types as stale
           ↓
    ┌─────────────────┐
    │  Active Pages   │
    │  (polling every │
    │   5 seconds)    │
    └─────┬───────────┘
          │
    needsRefetch()?
          │
       Yes│
          ▼
    Fetch fresh data
          ↓
    Update UI
```

## Component Architecture

### Frontend Structure

```
App.tsx (Root)
 │
 ├─ Splash Page
 │
 ├─ Authentication Pages
 │   ├─ SignIn
 │   └─ SignUp
 │
 └─ Dashboard Layout
     ├─ Header
     ├─ Content Area
     │   ├─ Dashboard Page
     │   ├─ AddTransaction Page
     │   ├─ Expenses Page
     │   ├─ Income Page
     │   ├─ Budget Page
     │   ├─ Saving Page (Goals)
     │   ├─ Notifications Page
     │   └─ Profile Page
     └─ Navigation Tabs

Context Providers:
 • BalanceProvider (global balance state)
 • StateInvalidation (polling & sync)
```

### Backend Structure

```
server.ts (Entry point)
 │
 ├─ Middleware
 │   ├─ CORS
 │   ├─ JSON parser
 │   ├─ Auth middleware
 │   └─ File upload (multer)
 │
 ├─ Routes
 │   ├─ /auth (register, login, verify)
 │   ├─ /transactions (CRUD, stats)
 │   ├─ /goals (CRUD)
 │   ├─ /budgets (CRUD, calculations)
 │   ├─ /ai (generate, stream, plans)
 │   ├─ /ocr (receipt scanning)
 │   └─ /notifications (CRUD, mark read)
 │
 ├─ Models (Mongoose schemas)
 │   ├─ User
 │   ├─ Transaction
 │   ├─ Goal
 │   ├─ Budget
 │   ├─ SavingsPlan
 │   ├─ Notification
 │   └─ Session
 │
 ├─ Services
 │   ├─ AI Service (Clova Studio)
 │   ├─ OCR Service (Clova OCR)
 │   ├─ STT Service (Clova X)
 │   └─ Python Sandbox (Firejail)
 │
 └─ Utils
     ├─ AI Tools (function calling)
     ├─ Clova Client
     └─ Database connection
```

## Database Schema

### User Collection
```typescript
{
  _id: ObjectId,
  username: string,           // unique
  passwordHash: string,       // SHA256 hash
  createdAt: Date,
  updatedAt: Date
}
```

### Transaction Collection
```typescript
{
  _id: ObjectId,
  userId: ObjectId,           // ref: User
  amount: number,
  category: string,
  type: 'income' | 'expense',
  note?: string,
  createdAt: Date,
  updatedAt: Date
}
```

### Goal Collection
```typescript
{
  _id: ObjectId,
  userId: ObjectId,           // ref: User
  name: string,
  target: number,
  current: number,
  priority?: string,
  duration?: number,
  savingPlanId?: ObjectId,    // ref: SavingsPlan
  createdAt: Date,
  updatedAt: Date
}
```

### Budget Collection
```typescript
{
  _id: ObjectId,
  userId: ObjectId,           // ref: User
  category: string,
  limit: number,
  spent: number,              // calculated
  month: string,              // YYYY-MM format
  createdAt: Date,
  updatedAt: Date
}
```

### SavingsPlan Collection
```typescript
{
  _id: ObjectId,
  userId: ObjectId,           // ref: User
  goal: string,
  savingsGoal?: number,
  intensity: string,
  notes?: string,
  suggestedSavings: number,
  recommendations: [{
    type: 'reduce' | 'protect',
    category: string,
    percentage?: number
  }],
  markdownAdvice?: string,
  proposedGoal?: {
    name: string,
    target: number,
    priority: string,
    accepted: boolean,
    linkedGoalId?: ObjectId,
    duration?: number
  },
  proposedBudgetLimits?: [{
    category: string,
    suggestedLimit: number,
    currentLimit?: number,
    reasoning?: string
  }],
  streamingStatus?: 'pending' | 'streaming' | 'completed' | 'failed',
  generationProgress?: string,
  createdAt: Date,
  updatedAt: Date
}
```

### Notification Collection
```typescript
{
  _id: ObjectId,
  userId: ObjectId,           // ref: User
  type: string,               // 'budget_warning', 'high_spending', etc.
  message: string,
  read: boolean,
  createdAt: Date
}
```

### Session Collection
```typescript
{
  _id: ObjectId,
  sessionId: string,          // UUID
  userId: ObjectId,           // ref: User
  planId?: ObjectId,          // ref: SavingsPlan
  status: 'pending' | 'streaming' | 'completed' | 'failed',
  messages: any[],            // AI conversation history
  createdAt: Date,
  updatedAt: Date
}
```

## Security Architecture

### Client-Side Security

**Password Hashing**
```
User Password
     ↓
 argon2id (libsodium)
 • Memory: 19MB
 • Iterations: 2
 • Salt: username + site-salt
     ↓
64-char hex hash
     ↓
Sent to server (never plaintext)
```

**Token Storage**
- Stored in localStorage
- Included in Authorization header
- 64-character hex string
- No expiration (currently)

**Input Validation**
- Client-side validation before submission
- Type checking with TypeScript
- Form validation with HTML5

### Server-Side Security

**Password Verification**
```
Received argon2id hash
     ↓
SHA256 hash
     ↓
Compare with DB
     ↓
Match? → Generate token
```

**Authentication Middleware**
```typescript
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401);
  
  const user = verifyToken(token);
  if (!user) return res.status(401);
  
  req.user = user;
  next();
}
```

**Resource Isolation**
- User data filtered by userId
- MongoDB queries always include userId
- No cross-user data access

**AI Sandbox**
- Python code runs in Firejail container
- 6 second timeout
- 256MB RAM limit
- No network access
- Read-only filesystem

### Security Best Practices

✅ **Implemented:**
- Two-layer password hashing
- Site-specific salt
- Token-based authentication
- Input validation
- CORS configuration
- Resource isolation
- Sandbox for AI code execution

⚠️ **Not Implemented (Future):**
- Rate limiting
- Token expiration
- Refresh tokens
- Two-factor authentication
- Password reset
- Session management
- HTTPS enforcement (deployment)
- Security headers (helmet)

## Performance Optimization

### Frontend Optimizations

**Code Splitting**
- React Router lazy loading
- Dynamic imports for large components
- Vite automatic chunk splitting

**Caching Strategy**
- Background polling (5s interval)
- Conditional fetching (check if stale)
- LocalStorage for token persistence

**Rendering Optimization**
- React.memo for expensive components
- useCallback for stable function refs
- useMemo for computed values
- Virtual scrolling (future)

### Backend Optimizations

**Database Queries**
- Indexed fields (userId, category, month)
- Aggregation pipelines for statistics
- Lean queries when full documents not needed

**API Response Time**
- In-memory caching (future)
- Connection pooling (MongoDB default)
- Async/await for non-blocking I/O

**Resource Management**
- MongoDB Memory Server for dev
- Connection reuse
- Graceful shutdown handling

## Scalability Considerations

### Current Limitations

- Single server deployment
- No load balancing
- No horizontal scaling
- In-memory session storage
- Polling-based updates

### Future Scalability

**Horizontal Scaling**
- Stateless API design enables load balancing
- MongoDB supports replica sets
- Redis for distributed session storage

**Real-time Updates**
- WebSocket for instant updates
- Reduce polling overhead
- Better user experience

**Caching Layer**
- Redis for frequently accessed data
- Reduce database queries
- Faster response times

**Database Optimization**
- Sharding for large datasets
- Read replicas for scaling reads
- Indexed queries

## Monitoring & Observability

### Current State

- Console logging for errors
- Basic error responses
- No structured logging
- No metrics collection
- No performance monitoring

### Recommended Additions

**Logging**
- Structured logging (Winston, Pino)
- Log levels (debug, info, warn, error)
- Request/response logging
- Audit trails

**Monitoring**
- Application metrics (Prometheus)
- Health checks
- Error tracking (Sentry)
- Performance monitoring (New Relic, Datadog)

**Analytics**
- User behavior tracking
- Feature usage statistics
- Performance metrics
- Error rates

## Development Workflow

```
Developer makes change
        ↓
   Hot reload (HMR)
        ↓
   TypeScript check
        ↓
   ESLint (optional)
        ↓
   Test (optional)
        ↓
   Git commit
        ↓
   CI/CD (future)
        ↓
   Docker build
        ↓
   Deployment
```

## Deployment Architecture

### Docker Compose Setup

```yaml
services:
  mongodb:
    - Persistent storage volumes
    - Health checks
    - Resource limits
    
  app:
    - Multi-stage build
    - Frontend + Backend combined
    - Environment variables
    - Restart policies
```

### Production Considerations

**Infrastructure**
- Load balancer (nginx, HAProxy)
- SSL/TLS termination
- CDN for static assets
- Database backup strategy
- Container orchestration (K8s)

**Environment**
- Production environment variables
- Secrets management (Vault, AWS Secrets)
- MongoDB authentication
- Monitoring and logging

## API Design Principles

1. **RESTful**: Standard HTTP methods and status codes
2. **Resource-based**: URLs represent resources
3. **Stateless**: Each request contains all needed info
4. **JSON**: Consistent data format
5. **Versioning**: Future-proof with version prefix
6. **Authentication**: Token-based, stateless
7. **Error Handling**: Consistent error response format

## Testing Strategy

### Frontend Tests
- Unit tests for utils and hooks
- Component tests with React Testing Library
- E2E tests with Cypress
- Visual regression tests (future)

### Backend Tests
- Unit tests for utilities
- Integration tests for routes
- Database tests with test database
- API contract tests (future)

### Test Coverage Goals
- Critical paths: 80%+
- Utilities: 90%+
- Components: 70%+
- Overall: 75%+

## Documentation Strategy

Current documentation structure:
```
docs/
├── README.md (index)
├── user-guide/
│   ├── getting-started.md
│   └── features.md
├── developer-guide/
│   ├── setup.md
│   └── architecture.md (this file)
├── api-reference/
│   └── endpoints.md
└── deployment/
    └── docker.md
```

## Future Enhancements

**Short-term:**
- WebSocket for real-time updates
- Improved error handling
- Rate limiting
- Token expiration

**Medium-term:**
- GraphQL API
- Microservices architecture
- Event-driven architecture
- Caching layer (Redis)

**Long-term:**
- Mobile apps (React Native)
- Multi-tenancy support
- Advanced analytics
- ML-powered predictions
