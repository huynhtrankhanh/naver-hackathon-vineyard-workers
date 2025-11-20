# SmartMoney Features

Complete overview of all features available in SmartMoney.

## 🎯 Core Features

### 1. Authentication & Security

**User Registration & Login**
- Username/password authentication
- Secure password hashing:
  - Client-side: argon2id with libsodium (19MB memory, 2 iterations)
  - Server-side: SHA256 for verification
- Site-specific salt prevents cross-site password comparison
- Token-based API authentication

**Security Features**
- Protected API endpoints (all data routes require authentication)
- No plaintext password storage
- Secure session management
- CORS configuration for local development

### 2. Transaction Management

**Adding Transactions**
SmartMoney offers three convenient methods to record transactions:

#### A. Manual Entry
- Quick form with amount, category, type (income/expense), and notes
- Real-time balance update
- Custom category selection
- Date/time stamp

#### B. Receipt Scanning (OCR)
- **Powered by**: Naver Clova OCR API
- **How it works**:
  1. Take photo of receipt
  2. AI extracts merchant name, date, items, total amount
  3. AI categorizes expense automatically
  4. Review and edit before saving
- **Best for**: Restaurant bills, shopping receipts, invoices

#### C. Voice Input (Speech-to-Text)
- **Powered by**: Naver Clova STT API
- **How it works**:
  1. Tap microphone icon
  2. Speak naturally: "Spent 50,000 on lunch today"
  3. AI parses amount, category, and note
  4. Confirm and save
- **Best for**: Quick entries on the go

**Transaction History**
- View all transactions chronologically
- Filter by type (income/expense)
- Edit or delete transactions
- Real-time balance calculations

**Categories**
- Food & Drinks
- Transport
- Shopping
- Entertainment
- Utilities
- Healthcare
- Groceries
- Subscriptions
- Hobbies
- Education
- Other

### 3. Dashboard & Visualizations

**Overview Section**
- **Current Balance**: Available funds (excludes dedicated savings)
- **Monthly Income**: Total income for current month
- **Monthly Expenses**: Total expenses for current month
- **Net Flow**: Income minus expenses

**Visual Analytics**
- **Monthly Trend Chart**: Stacked bar chart showing spending by category over months
- **Spending Breakdown**: Pie chart of current month's expenses by category
- **Goal Progress**: Visual indicators for saving goals

**Recent Activity**
- Latest transactions
- Quick action buttons
- Category-based color coding

### 4. Budget Management

**Creating Budgets**
- Set monthly spending limits per category
- Visual progress bars
- Percentage-based tracking
- Multiple budgets per month (one per category)

**Budget Tracking**
- **Real-time calculation**: Spent amounts calculated from actual transactions
- **Automatic updates**: Budget data refreshes every 5 seconds
- **Duplicate prevention**: One budget per category per month
- **Limit updates**: Can update existing budget limits

**Budget Alerts**
- Notification at 80% of budget limit
- Warning indicators in budget cards
- Monthly reset

**Budget Proposals from AI**
- AI can suggest new budget limits
- Review proposals in Budgets page
- Choose to accept or modify suggestions
- Reasoning provided for each proposal

### 5. Saving Goals & Plans

**Creating Saving Goals**
- Set target amount
- Optional duration (in months)
- Priority level
- Track progress
- Dedicate funds from balance

**Contributing to Goals**
- "Dedicate towards Savings" button
- Specify amount to allocate
- Reduces available balance
- Updates goal progress

**Withdrawing from Goals**
- Take money out of savings
- Returns to available balance
- Updates goal progress

**AI-Generated Saving Plans**

The centerpiece feature of SmartMoney - personalized financial planning powered by AI.

#### How It Works

1. **User Input**
   - Financial goal (e.g., "Build emergency fund", "Save for vacation")
   - Target savings amount (optional)
   - Intensity level:
     - **Just starting out**: Conservative (60-90% of goal)
     - **Ideal target**: Balanced (90-110% of goal)
     - **Must achieve**: Aggressive (110-140% of goal)
   - Context notes (e.g., "Have a wedding in June")

2. **AI Analysis** (Powered by Naver Clova Studio HCX-007)
   - Reviews your transaction history
   - Analyzes spending patterns
   - Considers your income
   - Evaluates current budgets
   - Processes your context notes

3. **Plan Generation**
   - **Suggested monthly savings**: Realistic amount to save
   - **Spending recommendations**: 
     - Categories to reduce (with percentage targets)
     - Categories to protect (essential expenses)
   - **Proposed saving goal**: AI-generated goal to accept
   - **Budget limit proposals**: Suggested limits per category
   - **Markdown report**: Detailed reasoning and advice

4. **Review & Accept**
   - Read AI's analysis and recommendations
   - Accept the proposed saving goal (creates new goal)
   - Review proposed budget limits in Budgets page
   - Modify suggestions as needed

#### AI Generation Technical Details

- **Model**: Naver Clova Studio HCX-007 with high reasoning effort
- **Streaming**: Real-time progress updates via Server-Sent Events (SSE)
- **Reconnection**: Can close app during generation and reconnect later
- **Tool Usage**: AI has access to 7 tools for data analysis:
  1. `get_transactions` - Fetch transaction history
  2. `get_goals` - Fetch current saving goals
  3. `get_budgets` - Fetch budget limits
  4. `get_balance_summary` - Get income/expense summary
  5. `propose_saving_goal` - Create goal proposal
  6. `propose_budget_limit` - Create budget limit proposal
  7. `get_current_date` - Get current date for analysis

- **Security**: Uses randomized XML-like tags to prevent prompt injection
- **Python Sandbox**: AI can execute Python code in isolated Firejail container (6s timeout, 256MB RAM)

#### Viewing Plans

- **Plan List**: View all generated plans
- **Plan Details**: See full analysis and recommendations
- **Creation Date**: When plan was generated
- **Status Tracking**: pending → streaming → completed → failed

### 6. Notifications

**Notification Types**

1. **Budget Warnings**
   - Triggered at 80% of category budget
   - Shows category name and percentage used
   - Helps prevent overspending

2. **High Spending Alerts**
   - Triggered when expenses reach 80% of monthly income
   - Only shown when income > 0
   - Encourages budget review

**Notification Management**
- View all notifications in Notifications page
- Mark individual notifications as read
- "Mark all as read" option
- Timestamp for each notification
- One-time per session display (no spam)

### 7. Profile & Settings

**User Profile**
- View username
- Account information
- Sign out option

**Future Settings** (Planned)
- Language preference (Vietnamese/English)
- Currency selection
- Notification preferences
- Data export options

## 🔄 State Management & Sync

**Automatic Updates**
- Background polling every 5 seconds (when page active)
- Immediate invalidation after mutations (create/update/delete)
- Page visibility detection (refetch on tab return)
- Multi-tab support

**Balance Context**
- Global balance state across all pages
- Prevents desynchronization
- Real-time updates
- Shared refresh mechanism

## 📊 Data Flow

```
User Action → Frontend → API Request → Backend → Database
                                          ↓
                                    AI Service (if needed)
                                          ↓
                                    Response ← Backend
                                          ↓
                            Frontend Update ← State Invalidation
```

## 🎨 UI/UX Features

**Design Principles**
- Mobile-first responsive design
- Ionic Framework components
- Consistent color coding by transaction type
- Smooth animations and transitions
- Loading states for async operations
- Error handling with user-friendly messages

**Accessibility**
- Clear visual hierarchy
- Readable typography
- Color contrast compliance
- Touch-friendly button sizes
- Keyboard navigation support

**Performance**
- Optimized bundle size
- Lazy loading for pages
- Efficient re-renders with React hooks
- Minimal API calls with caching

## 🚀 Technology Stack

### Frontend
- **React 18**: UI library
- **Ionic Framework 8**: Mobile components
- **TypeScript**: Type safety
- **Vite**: Fast build tool
- **Tailwind CSS**: Utility-first styling
- **Lucide React**: Icon library
- **libsodium-wrappers**: Cryptography (argon2id)
- **React Router**: Navigation
- **React Markdown**: AI report rendering

### Backend
- **Express.js**: Web framework
- **MongoDB**: Database (with Mongoose ODM)
- **MongoDB Memory Server**: Dev/test database
- **TypeScript**: Type safety
- **Naver Clova Studio**: AI services (HCX-007)
- **Naver Clova OCR**: Receipt scanning
- **Naver Clova STT**: Voice input
- **Firejail**: Python sandbox isolation
- **UUID**: Session management
- **Axios**: HTTP client

### Development Tools
- **tsx**: TypeScript execution
- **ESLint**: Code linting
- **Vitest**: Unit testing
- **Cypress**: E2E testing
- **Docker**: Containerization

## 🔮 Planned Features

Future enhancements on the roadmap:

- [ ] Export data (CSV/PDF format)
- [ ] Push notifications (PWA)
- [ ] Spending analytics with trends
- [ ] Budget templates
- [ ] Multi-currency support
- [ ] Collaborative budgets (family/shared)
- [ ] Financial reports
- [ ] Recurring transactions
- [ ] Split transactions
- [ ] Bill reminders
- [ ] Investment tracking
- [ ] Debt management
- [ ] Password reset via email
- [ ] Two-factor authentication
- [ ] Dark mode toggle
- [ ] Backup and restore
- [ ] Custom categories

## 📝 Feature Maturity

| Feature | Status | Notes |
|---------|--------|-------|
| Authentication | ✅ Stable | Fully implemented and tested |
| Transaction Tracking | ✅ Stable | Manual, OCR, and STT working |
| Dashboard | ✅ Stable | Real-time updates |
| Budget Management | ✅ Stable | Real-time tracking |
| Saving Goals | ✅ Stable | With AI integration |
| AI Saving Plans | ✅ Stable | Clova Studio integration |
| Notifications | ✅ Stable | Budget and spending alerts |
| OCR Receipt Scanning | ✅ Stable | Naver Clova OCR |
| Voice Input | ✅ Stable | Naver Clova STT |
| State Management | ✅ Stable | Polling and invalidation |

## 🤝 Feature Requests

Have an idea for a new feature? 
- Check [existing issues](https://github.com/huynhtrankhanh/naver-hackathon-vineyard-workers/issues)
- Create a new feature request with the "enhancement" label
- Describe your use case and expected behavior
