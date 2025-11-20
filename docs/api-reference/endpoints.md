# API Reference

Complete reference for SmartMoney REST API endpoints.

## Base URL

**Development**: `http://localhost:3001/api`  
**Production**: Configure via environment variables

## Authentication

Most endpoints require authentication via Bearer token.

### How to Authenticate

1. Register or login to get a token
2. Include token in `Authorization` header:
   ```
   Authorization: Bearer <your-token-here>
   ```

### Protected Routes

Routes marked with 🔒 require authentication.

---

## Authentication Endpoints

### Register User

Create a new user account.

```http
POST /auth/register
```

**Request Body:**
```json
{
  "username": "john_doe",
  "passwordHash": "argon2id_hash_from_client"
}
```

**Response:** `200 OK`
```json
{
  "message": "User registered successfully",
  "token": "64-character-hex-token",
  "username": "john_doe"
}
```

**Errors:**
- `400` - Missing username or passwordHash
- `409` - Username already exists

**Notes:**
- Password must be hashed client-side with argon2id before sending
- Use libsodium-wrappers for client-side hashing
- Salt derived from: `username + fixed-site-salt`

---

### Login User

Authenticate existing user.

```http
POST /auth/login
```

**Request Body:**
```json
{
  "username": "john_doe",
  "passwordHash": "argon2id_hash_from_client"
}
```

**Response:** `200 OK`
```json
{
  "message": "Login successful",
  "token": "64-character-hex-token",
  "username": "john_doe"
}
```

**Errors:**
- `400` - Missing credentials
- `401` - Invalid username or password

---

### Verify Token 🔒

Check if authentication token is valid.

```http
GET /auth/verify
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "valid": true,
  "user": {
    "id": "user_id",
    "username": "john_doe"
  }
}
```

**Errors:**
- `401` - Invalid or expired token

---

## Transaction Endpoints

### Get All Transactions 🔒

Retrieve all transactions for authenticated user.

```http
GET /transactions
```

**Query Parameters:**
- `type` (optional): Filter by type (`income` or `expense`)

**Response:** `200 OK`
```json
[
  {
    "_id": "transaction_id",
    "amount": 50000,
    "category": "Food & Drinks",
    "type": "expense",
    "note": "Lunch at cafe",
    "userId": "user_id",
    "createdAt": "2025-11-20T10:30:00.000Z",
    "updatedAt": "2025-11-20T10:30:00.000Z"
  }
]
```

---

### Create Transaction 🔒

Add a new transaction.

```http
POST /transactions
```

**Request Body:**
```json
{
  "amount": 50000,
  "category": "Food & Drinks",
  "type": "expense",
  "note": "Lunch at cafe"
}
```

**Response:** `201 Created`
```json
{
  "_id": "transaction_id",
  "amount": 50000,
  "category": "Food & Drinks",
  "type": "expense",
  "note": "Lunch at cafe",
  "userId": "user_id",
  "createdAt": "2025-11-20T10:30:00.000Z",
  "updatedAt": "2025-11-20T10:30:00.000Z"
}
```

**Validation:**
- `amount`: Required, must be number > 0
- `category`: Required string
- `type`: Required, must be "income" or "expense"
- `note`: Optional string

---

### Update Transaction 🔒

Update an existing transaction.

```http
PUT /transactions/:id
```

**Request Body:**
```json
{
  "amount": 60000,
  "category": "Food & Drinks",
  "type": "expense",
  "note": "Updated note"
}
```

**Response:** `200 OK`
```json
{
  "_id": "transaction_id",
  "amount": 60000,
  "category": "Food & Drinks",
  "type": "expense",
  "note": "Updated note",
  "userId": "user_id",
  "createdAt": "2025-11-20T10:30:00.000Z",
  "updatedAt": "2025-11-20T10:35:00.000Z"
}
```

**Errors:**
- `404` - Transaction not found
- `403` - Not authorized to update this transaction

---

### Delete Transaction 🔒

Delete a transaction.

```http
DELETE /transactions/:id
```

**Response:** `200 OK`
```json
{
  "message": "Transaction deleted successfully"
}
```

**Errors:**
- `404` - Transaction not found
- `403` - Not authorized to delete this transaction

---

### Get Balance Summary 🔒

Get income/expense summary for current month.

```http
GET /transactions/stats/summary
```

**Response:** `200 OK`
```json
{
  "totalIncome": 5000000,
  "totalExpenses": 3500000,
  "balance": 1500000
}
```

**Notes:**
- Calculates from all user transactions
- Balance = income - expenses (excludes dedicated savings)

---

## Goal Endpoints

### Get All Goals 🔒

Retrieve all saving goals.

```http
GET /goals
```

**Response:** `200 OK`
```json
[
  {
    "_id": "goal_id",
    "name": "Emergency Fund",
    "target": 5000000,
    "current": 1000000,
    "priority": "high",
    "duration": 12,
    "savingPlanId": "plan_id",
    "userId": "user_id",
    "createdAt": "2025-11-20T10:30:00.000Z",
    "updatedAt": "2025-11-20T10:30:00.000Z"
  }
]
```

---

### Create Goal 🔒

Create a new saving goal.

```http
POST /goals
```

**Request Body:**
```json
{
  "name": "Emergency Fund",
  "target": 5000000,
  "current": 0,
  "priority": "high",
  "duration": 12
}
```

**Response:** `201 Created`
```json
{
  "_id": "goal_id",
  "name": "Emergency Fund",
  "target": 5000000,
  "current": 0,
  "priority": "high",
  "duration": 12,
  "userId": "user_id",
  "createdAt": "2025-11-20T10:30:00.000Z",
  "updatedAt": "2025-11-20T10:30:00.000Z"
}
```

---

### Update Goal 🔒

Update an existing goal.

```http
PUT /goals/:id
```

**Request Body:**
```json
{
  "name": "Updated Emergency Fund",
  "target": 6000000,
  "current": 1500000,
  "priority": "high"
}
```

**Response:** `200 OK`

---

### Delete Goal 🔒

Delete a saving goal.

```http
DELETE /goals/:id
```

**Response:** `200 OK`
```json
{
  "message": "Goal deleted successfully"
}
```

---

## Budget Endpoints

### Get All Budgets 🔒

Retrieve all budgets.

```http
GET /budgets
```

**Query Parameters:**
- `month` (optional): Filter by month (format: `YYYY-MM`)

**Response:** `200 OK`
```json
[
  {
    "_id": "budget_id",
    "category": "Food & Drinks",
    "limit": 1000000,
    "spent": 750000,
    "month": "2025-11",
    "userId": "user_id",
    "createdAt": "2025-11-01T00:00:00.000Z",
    "updatedAt": "2025-11-20T10:30:00.000Z"
  }
]
```

**Notes:**
- `spent` is calculated in real-time from transactions
- One budget per category per month

---

### Create Budget 🔒

Create a new budget or update existing one.

```http
POST /budgets
```

**Request Body:**
```json
{
  "category": "Food & Drinks",
  "limit": 1000000,
  "month": "2025-11"
}
```

**Response:** `201 Created` or `200 OK` (if updated existing)
```json
{
  "_id": "budget_id",
  "category": "Food & Drinks",
  "limit": 1000000,
  "spent": 0,
  "month": "2025-11",
  "userId": "user_id",
  "createdAt": "2025-11-01T00:00:00.000Z",
  "updatedAt": "2025-11-20T10:30:00.000Z"
}
```

**Notes:**
- If budget exists for category/month, updates the limit
- Prevents duplicate budgets

---

### Update Budget 🔒

Update budget limit.

```http
PUT /budgets/:id
```

**Request Body:**
```json
{
  "limit": 1200000
}
```

**Response:** `200 OK`

---

### Delete Budget 🔒

Delete a budget.

```http
DELETE /budgets/:id
```

**Response:** `200 OK`
```json
{
  "message": "Budget deleted successfully"
}
```

---

## AI Endpoints

### Generate Saving Plan 🔒

Generate AI-powered saving plan with Clova Studio.

```http
POST /ai/generate
```

**Request Body:**
```json
{
  "goal": "Build emergency fund",
  "savingsGoal": 5000000,
  "intensity": "Ideal target",
  "notes": "I have a wedding in June"
}
```

**Response:** `202 Accepted`
```json
{
  "message": "AI generation started",
  "planId": "plan_id",
  "sessionId": "session_id"
}
```

**Notes:**
- Generation happens asynchronously
- Use SSE endpoint to stream progress
- Can reconnect to session later

**Intensity Options:**
- "Just starting out": Conservative (60-90% of goal)
- "Ideal target": Balanced (90-110% of goal)
- "Must achieve": Aggressive (110-140% of goal)

---

### Stream Plan Generation 🔒

Stream real-time progress of AI generation (Server-Sent Events).

```http
GET /ai/stream/:sessionId
```

**Response:** `text/event-stream`
```
event: progress
data: {"status":"analyzing","message":"Analyzing transactions..."}

event: progress
data: {"status":"generating","message":"Generating recommendations..."}

event: complete
data: {"status":"completed","planId":"plan_id"}
```

**Events:**
- `progress`: Generation status updates
- `complete`: Plan generation finished
- `error`: Generation failed

---

### Get All Plans 🔒

Retrieve all saving plans.

```http
GET /ai
```

**Response:** `200 OK`
```json
[
  {
    "_id": "plan_id",
    "goal": "Emergency Fund",
    "savingsGoal": 5000000,
    "intensity": "Ideal target",
    "suggestedSavings": 450000,
    "recommendations": [
      {
        "type": "reduce",
        "category": "Entertainment",
        "percentage": 20
      },
      {
        "type": "protect",
        "category": "Groceries"
      }
    ],
    "markdownAdvice": "# Financial Analysis\n...",
    "proposedGoal": {
      "name": "Emergency Fund",
      "target": 5000000,
      "priority": "high",
      "accepted": false
    },
    "proposedBudgetLimits": [
      {
        "category": "Entertainment",
        "suggestedLimit": 400000,
        "reasoning": "Reduce by 20%"
      }
    ],
    "streamingStatus": "completed",
    "userId": "user_id",
    "createdAt": "2025-11-20T10:30:00.000Z"
  }
]
```

---

### Get Latest Plan 🔒

Get most recent saving plan.

```http
GET /ai/latest
```

**Response:** `200 OK` - Same structure as single plan in array above

---

### Get Plan by ID 🔒

Get specific saving plan.

```http
GET /ai/:id
```

**Response:** `200 OK` - Same structure as single plan

---

### Accept Proposed Goal 🔒

Accept AI-proposed goal and create actual goal.

```http
POST /ai/:planId/accept-goal
```

**Response:** `200 OK`
```json
{
  "message": "Goal accepted and created",
  "goalId": "new_goal_id"
}
```

**Notes:**
- Creates new Goal document
- Links goal to saving plan
- Marks proposal as accepted

---

## OCR Endpoints

### Scan Receipt 🔒

Extract transaction data from receipt image.

```http
POST /ocr/scan-receipt
```

**Request:** `multipart/form-data`
- `image`: Image file (JPEG, PNG)

**Response:** `200 OK`
```json
{
  "amount": 125000,
  "category": "Food & Drinks",
  "note": "Coffee Shop - 2 items",
  "merchantName": "The Coffee House",
  "confidence": 0.95
}
```

**Notes:**
- Uses Naver Clova OCR API
- AI categorizes based on merchant name
- Returns suggested transaction data for review

---

### Parse Transaction Text 🔒

Parse transaction from text (for voice input).

```http
POST /ai/parse-text
```

**Request Body:**
```json
{
  "text": "Spent 50,000 on lunch today"
}
```

**Response:** `200 OK`
```json
{
  "amount": 50000,
  "category": "Food & Drinks",
  "type": "expense",
  "note": "lunch"
}
```

---

### Speech to Text 🔒

Convert audio to text.

```http
POST /ai/speech-to-text
```

**Request:** `multipart/form-data`
- `audio`: Audio file

**Response:** `200 OK`
```json
{
  "text": "Spent 50,000 on lunch today"
}
```

**Notes:**
- Uses Naver Clova STT API
- Combine with `/ai/parse-text` to create transaction

---

## Notification Endpoints

### Get All Notifications 🔒

Retrieve all notifications.

```http
GET /notifications
```

**Response:** `200 OK`
```json
[
  {
    "_id": "notification_id",
    "userId": "user_id",
    "type": "budget_warning",
    "message": "Budget 'Food & Drinks' has used 85%",
    "read": false,
    "createdAt": "2025-11-20T10:30:00.000Z"
  }
]
```

---

### Mark as Read 🔒

Mark notification as read.

```http
PUT /notifications/:id/read
```

**Response:** `200 OK`

---

### Mark All as Read 🔒

Mark all notifications as read.

```http
PUT /notifications/mark-all-read
```

**Response:** `200 OK`
```json
{
  "message": "All notifications marked as read"
}
```

---

## Health Check

### Server Health

Check if server is running.

```http
GET /api/health
```

**Response:** `200 OK`
```json
{
  "status": "ok",
  "message": "Backend server is running"
}
```

---

## Error Responses

All endpoints may return these error responses:

### 400 Bad Request
```json
{
  "message": "Validation error message"
}
```

### 401 Unauthorized
```json
{
  "message": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "message": "Not authorized to access this resource"
}
```

### 404 Not Found
```json
{
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "message": "Server error message"
}
```

---

## Rate Limiting

Currently no rate limiting implemented. Future versions may include:
- Rate limits per IP
- Rate limits per user
- Throttling for AI endpoints

---

## Pagination

Currently no pagination implemented. All endpoints return full result sets. Future versions may include:
- `?page=1&limit=20` query parameters
- Response metadata with total count, pages

---

## Webhooks

Not currently supported. Future feature consideration.

---

## API Versioning

Current version: **v1** (implicit, no version in URL)

Future versions will use URL versioning:
- `/api/v1/...`
- `/api/v2/...`

---

## SDK / Client Libraries

Currently no official SDKs. Frontend uses direct `fetch` calls via `api.ts` service layer.

Example client implementation: `Frontend-MoneyTrack/src/services/api.ts`

---

## Testing the API

### Using cURL

```bash
# Register
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","passwordHash":"hashed_password"}'

# Get transactions (with token)
curl http://localhost:3001/api/transactions \
  -H "Authorization: Bearer your-token-here"
```

### Using Postman

1. Import OpenAPI spec (if available)
2. Set `Authorization` header with Bearer token
3. Test endpoints interactively

---

## API Best Practices

1. **Always include Authorization header** for protected routes
2. **Validate input** before sending requests
3. **Handle errors gracefully** with try-catch
4. **Use appropriate HTTP methods** (GET, POST, PUT, DELETE)
5. **Don't expose sensitive data** in URLs or logs
6. **Cache responses** when appropriate
7. **Respect server resources** - don't spam requests

---

## Future API Features

- [ ] GraphQL endpoint
- [ ] WebSocket support for real-time updates
- [ ] Batch operations
- [ ] Export endpoints (CSV, PDF)
- [ ] Import endpoints
- [ ] Webhook notifications
- [ ] OAuth2 authentication
- [ ] API key management
- [ ] Rate limiting and throttling
- [ ] Request/response compression
