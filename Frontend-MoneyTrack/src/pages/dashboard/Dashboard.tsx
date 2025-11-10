import React, { useState, useCallback } from "react";
import { IonPage, IonContent, IonSpinner } from "@ionic/react";
import { Wallet, PiggyBank, PieChart, Gauge, Bell } from "lucide-react";
import { useHistory } from "react-router-dom";
import TabBar from "../../components/dashboard/TabBar";
import KpiCard from "../../components/dashboard/KpiCard";
import Legend from "../../components/dashboard/Legend";
import { transactionApi, goalsApi, budgetApi } from "../../services/api";
import { useStateInvalidation } from "../../services/useStateInvalidation";

interface Transaction {
  _id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  type: string;
}

interface Goal {
  _id: string;
  name: string;
  target: number;
  current: number;
}

interface Budget {
  _id: string;
  category: string;
  limit: number;
  spent: number;
  month: string;
}

const Dashboard: React.FC = () => {
  const history = useHistory();
  const [income, setIncome] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      // Only show loading spinner on initial load, not on periodic refreshes
      if (isInitialLoad) {
        setLoading(true);
      }
      
      // Fetch summary
      const summaryData = await transactionApi.getSummary();
      setIncome(summaryData.income);
      setExpenses(summaryData.expenses);
      setBalance(summaryData.balance);

      // Fetch recent transactions (limit to 3)
      const transactionsData = await transactionApi.getAll();
      setTransactions(transactionsData.slice(0, 3));

      // Fetch goals (limit to 2)
      const goalsData = await goalsApi.getAll();
      setGoals(goalsData.slice(0, 2));

      // Fetch budgets for current month
      const currentMonth = new Date().toISOString().slice(0, 7);
      const budgetsData = await budgetApi.getByMonth(currentMonth);
      setBudgets(budgetsData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      if (isInitialLoad) {
        setLoading(false);
        setIsInitialLoad(false);
      }
    }
  }, [isInitialLoad]);

  // Use state invalidation hook for dashboard data
  useStateInvalidation({
    dataType: 'summary',
    fetchData,
  });

  const toCurrency = (v: number) => v.toLocaleString("vi-VN") + " đ";
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return `Today ${date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday ${date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <IonPage>
      <IonContent className="bg-white">
        <div className="min-h-screen bg-white text-slate-900 flex flex-col">
          {/* Top App Bar */}
          <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-slate-100">
            <div className="mx-auto max-w-md px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-2xl bg-blue-600 flex items-center justify-center shadow-sm">
                  <Wallet className="h-5 w-5 text-white" />
                </div>
                <div className="font-semibold">SmartMoney</div>
              </div>
              <button className="h-9 w-9 grid place-items-center rounded-xl border border-slate-200 hover:bg-slate-50">
                <Bell className="h-5 w-5 text-slate-700" />
              </button>
            </div>
          </header>

          {/* Scrollable content */}
          <main className="mx-auto w-full max-w-md flex-1 px-4 pb-28 pt-4">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <IonSpinner name="crescent" />
              </div>
            ) : (
              <>
                {/* KPI Cards (navigate) */}
                <div className="grid grid-cols-2 gap-3">
                  <KpiCard
                    title="Income"
                    value={toCurrency(income)}
                    icon={<Gauge className="h-4 w-4" />}
                    color="from-blue-500 to-blue-600"
                    onClick={() => history.push("/dashboard/income")}
                  />
                  <KpiCard
                    title="Expenses"
                    value={toCurrency(expenses)}
                    icon={<PieChart className="h-4 w-4" />}
                    color="from-rose-500 to-rose-600"
                    onClick={() => history.push("/dashboard/expenses")}
                  />
                </div>

                {/* Mini donut */}
                <div className="mt-4 rounded-2xl border border-slate-100 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">Income vs Expenses</h3>
                    <span className="text-sm text-slate-500">This month</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <div
                      className="h-20 w-20 rounded-full"
                      style={{
                        background: `conic-gradient(#2563eb ${Math.max(5, Math.min(95, (income/(income+expenses || 1))*100))}%, #ef4444 0)`
                      }}
                    />
                    <div className="flex-1 grid grid-cols-2 gap-3 text-sm">
                      <Legend label="Income" value={toCurrency(income)} colorClass="bg-blue-600"/>
                      <Legend label="Expenses" value={toCurrency(expenses)} colorClass="bg-rose-500"/>
                      <Legend label="Balance" value={toCurrency(balance)} colorClass="bg-emerald-500"/>
                    </div>
                  </div>
                </div>

                {/* Budget Limits */}
                {budgets.length > 0 && (
                  <section className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">Budget Limits</h3>
                      <a href="/dashboard/budget" className="text-sm text-blue-600 hover:underline">View all</a>
                    </div>
                    <div className="grid gap-2">
                      {budgets.slice(0, 3).map(budget => {
                        const percentage = budget.limit > 0 ? (budget.spent / budget.limit) * 100 : 0;
                        const isOverBudget = percentage > 100;
                        const isNearLimit = percentage > 80 && !isOverBudget;
                        return (
                          <div key={budget._id} className="rounded-xl border border-slate-100 p-3 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                              <div className="text-sm font-medium">{budget.category}</div>
                              <span className="text-xs text-slate-500">
                                {toCurrency(budget.spent)} / {toCurrency(budget.limit)}
                              </span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                              <div 
                                className={`h-full transition-all ${
                                  isOverBudget ? 'bg-rose-500' : isNearLimit ? 'bg-orange-500' : 'bg-blue-500'
                                }`}
                                style={{ width: `${Math.min(100, percentage)}%` }} 
                              />
                            </div>
                            <div className="mt-1 text-xs text-right">
                              <span className={
                                isOverBudget ? 'text-rose-600 font-medium' : 
                                isNearLimit ? 'text-orange-600 font-medium' : 
                                'text-slate-500'
                              }>
                                {Math.round(percentage)}% used
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* Goals preview */}
                {goals.length > 0 && (
                  <section className="mt-5">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">Saving Goals</h3>
                      <a href="/goals" className="text-sm text-blue-600 hover:underline">View all</a>
                    </div>
                    <div className="grid gap-3">
                      {goals.map(g => {
                        const progress = g.target > 0 ? g.current / g.target : 0;
                        return (
                          <div key={g._id} className="rounded-2xl border border-slate-100 p-4 shadow-sm">
                            <div className="flex items-center justify-between">
                              <div className="font-medium">{g.name}</div>
                              <span className="text-sm text-slate-500">Target {toCurrency(g.target)}</span>
                            </div>
                            <div className="mt-3 h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                              <div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, progress*100)}%` }} />
                            </div>
                            <div className="mt-1 text-xs text-slate-500">{Math.round(progress*100)}% completed</div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* Recent transactions */}
                {transactions.length > 0 && (
                  <section className="mt-5">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">Recent Transactions</h3>
                    </div>
                    <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-100 bg-white shadow-sm">
                      {transactions.map(t => {
                        const isIncome = t.type === 'income';
                        const displayAmount = Math.abs(t.amount);
                        return (
                          <li key={t._id} className="flex items-center justify-between px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className={`h-9 w-9 rounded-xl grid place-items-center ${isIncome ? "bg-emerald-50" : "bg-slate-50"}`}>
                                {isIncome ? <PiggyBank className="h-5 w-5 text-emerald-600"/> : <Wallet className="h-5 w-5 text-slate-600"/>}
                              </div>
                              <div>
                                <div className="font-medium leading-none">{t.title}</div>
                                <div className="text-xs text-slate-500">{t.category} • {formatDate(t.date)}</div>
                              </div>
                            </div>
                            <div className={`text-sm font-semibold ${isIncome?"text-emerald-600":"text-rose-600"}`}>
                              {isIncome?"+":"-"}{toCurrency(displayAmount)}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                )}

                {/* CTA to change limits */}
                <button
                  onClick={() => history.push("/dashboard/budget")}
                  className="mt-5 w-full block rounded-2xl bg-blue-600 text-white text-center py-3 font-medium shadow-md hover:bg-blue-700"
                >
                  Adjust Monthly Limits
                </button>
              </>
            )}
          </main>

          {/* Bottom Tab Bar */}
          <TabBar active="dashboard" />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Dashboard;
