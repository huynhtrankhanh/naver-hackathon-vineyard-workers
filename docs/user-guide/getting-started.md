# Getting Started with SmartMoney

SmartMoney is an AI-powered personal finance application that helps you track expenses, manage budgets, and achieve your savings goals.

## 🎯 What is SmartMoney?

SmartMoney combines traditional expense tracking with AI-powered insights to help you:
- **Track spending** effortlessly with multiple input methods (manual, receipt scanning, voice)
- **Set and achieve saving goals** with AI-generated personalized plans
- **Manage budgets** with real-time spending alerts
- **Visualize finances** with intuitive charts and summaries

## 🚀 Quick Start

### For First-Time Users

1. **Create an Account**
   - Open SmartMoney in your browser
   - Click "Sign Up" on the splash screen
   - Enter a username and password
   - Your password is securely hashed using argon2id before being sent to the server

2. **Explore the Dashboard**
   - View your current balance
   - See income vs expenses summary
   - Check recent transactions
   - Monitor your saving goals

3. **Add Your First Transaction**
   - Tap the "+" button in the navigation bar
   - Choose your input method:
     - **Manual Entry**: Type amount, category, and note
     - **Receipt Scan**: Take a photo of your receipt
     - **Voice Input**: Speak your transaction (e.g., "Spent 50,000 on lunch")
   - Review and save

4. **Create a Saving Goal**
   - Go to the "Saving" tab
   - Tap "Create Saving Plan with AI"
   - Follow the wizard to:
     - Set your financial goal
     - Specify target savings amount
     - Choose intensity level
     - Add context notes
   - Let AI generate a personalized savings plan

## 📱 Main Features

### Dashboard
Your financial overview at a glance:
- **Current Balance**: Total available funds (excluding dedicated savings)
- **Monthly Summary**: Income vs expenses for the current month
- **Recent Transactions**: Latest financial activity
- **Quick Stats**: Visual spending breakdown

### Transaction Tracking
Multiple ways to record transactions:
- **Manual Entry**: Quick and precise
- **Receipt Scanning (OCR)**: Powered by Naver Clova OCR
- **Voice Input (STT)**: Speak naturally, AI extracts the details

### Budget Management
Stay on track with your spending:
- Set monthly budgets per category
- Real-time tracking of spent vs limit
- Automatic alerts at 80% threshold
- Visual progress indicators

### Saving Goals & AI Plans
Achieve your financial goals with AI assistance:
- **Saving Goals**: Set targets and track progress
- **AI-Generated Plans**: Get personalized recommendations
- **Budget Proposals**: AI suggests optimal budget limits
- **Goal Acceptance**: Review and accept AI-proposed goals

### Notifications
Stay informed about your finances:
- Budget limit warnings (80% threshold)
- High spending alerts (80% of income)
- Goal progress updates
- Mark notifications as read

## 🔐 Security

Your financial data is protected with:
- **Client-side password hashing** using argon2id
- **Server-side secondary hashing** using SHA256
- **Token-based authentication** for API access
- **Site-specific salt** to prevent password database comparison attacks

## 💡 Tips for Best Results

1. **Track Consistently**: Record transactions as they happen for accurate insights
2. **Use Categories**: Proper categorization improves AI recommendations
3. **Set Realistic Budgets**: Start conservative and adjust based on actual spending
4. **Review AI Plans**: AI suggestions are starting points - customize to your needs
5. **Check Notifications**: Stay aware of spending patterns and warnings

## 📊 Understanding Your Data

### Balance Calculation
```
Current Balance = Total Income - Total Expenses - Dedicated Savings
```

### Budget Tracking
Budgets are calculated in real-time from actual transactions. When you create or update a budget, the "spent" amount is automatically calculated from matching transactions in that category for the current month.

### AI Recommendations
The AI analyzes:
- Your transaction history
- Current spending patterns
- Budget limits
- Income levels
- Your stated goals and notes

It then provides:
- Suggested monthly savings amount
- Categories to reduce spending in
- Categories to protect (essential expenses)
- Proposed new budget limits
- Optional: A new saving goal

## 🆘 Troubleshooting

### Common Issues

**"Unable to scan receipt"**
- Ensure good lighting
- Hold camera steady
- Make sure receipt text is clear and readable
- Try manual entry if scanning repeatedly fails

**"Balance doesn't update immediately"**
- The app polls for updates every 5 seconds
- After adding a transaction, wait a moment
- Switch to another tab and back to force refresh

**"AI plan generation takes too long"**
- AI generation can take 30-60 seconds
- The server streams progress updates
- You can close the app and check back later
- Generation sessions persist and can be reconnected

**"Notifications not appearing"**
- Check if you've reached notification thresholds
- Notifications appear on Dashboard page load
- Each notification shows once per session

## 📚 Next Steps

- [Explore All Features](features.md) - Deep dive into SmartMoney capabilities
- [Learn About AI Savings](ai-savings.md) - Understand how AI generates recommendations
- [API Reference](../api-reference/endpoints.md) - For developers integrating with SmartMoney

## 🤝 Need Help?

- Check the [FAQ](faq.md)
- Review [Common Issues](troubleshooting.md)
- Report bugs on [GitHub Issues](https://github.com/huynhtrankhanh/naver-hackathon-vineyard-workers/issues)
