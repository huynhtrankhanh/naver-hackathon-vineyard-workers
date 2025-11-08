import React, { useState } from "react";
import { IonPage, IonContent } from "@ionic/react";
import { Wallet, PiggyBank, PieChart, Gauge, Bell } from "lucide-react";
import { useHistory } from "react-router-dom";
import TabBar from "../../components/dashboard/TabBar";
import KpiCard from "../../components/dashboard/KpiCard";
import Legend from "../../components/dashboard/Legend";

const Dashboard: React.FC = () => {
  const history = useHistory();
  const [income] = useState(15000000);
  const [expenses] = useState(11250000);
  const savings = income - expenses;

  const transactions = [
    { id: 1, title: "Highlands Coffee", category: "Food & Drinks", amount: -52000, time: "Today 08:40" },
    { id: 2, title: "GrabBike", category: "Transport", amount: -32000, time: "Yesterday 18:05" },
    { id: 3, title: "Salary", category: "Income", amount: 15000000, time: "Nov 01" },
  ];

  const goals = [
    { id: 1, name: "Buy a laptop", target: 12000000, progress: 0.35 },
    { id: 2, name: "Trip to Da Nang", target: 6000000, progress: 0.18 },
  ];

  const toCurrency = (v: number) => v.toLocaleString("vi-VN") + " đ";

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
                    background: `conic-gradient(#2563eb ${Math.max(5, Math.min(95, (income/(income+expenses))*100))}%, #ef4444 0)`
                  }}
                />
                <div className="flex-1 grid grid-cols-2 gap-3 text-sm">
                  <Legend label="Income" value={toCurrency(income)} colorClass="bg-blue-600"/>
                  <Legend label="Expenses" value={toCurrency(expenses)} colorClass="bg-rose-500"/>
                  <Legend label="Savings" value={toCurrency(savings)} colorClass="bg-emerald-500"/>
                </div>
              </div>
            </div>

            {/* Goals preview */}
            <section className="mt-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Saving Goals</h3>
                <a href="/goals" className="text-sm text-blue-600 hover:underline">View all</a>
              </div>
              <div className="grid gap-3">
                {goals.map(g => (
                  <div key={g.id} className="rounded-2xl border border-slate-100 p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{g.name}</div>
                      <span className="text-sm text-slate-500">Target {toCurrency(g.target)}</span>
                    </div>
                    <div className="mt-3 h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: `${g.progress*100}%` }} />
                    </div>
                    <div className="mt-1 text-xs text-slate-500">{Math.round(g.progress*100)}% completed</div>
                  </div>
                ))}
              </div>
            </section>

            {/* Recent transactions */}
            <section className="mt-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Recent Transactions</h3>
                <a href="/transactions" className="text-sm text-blue-600 hover:underline">See all</a>
              </div>
              <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-100 bg-white shadow-sm">
                {transactions.map(t => (
                  <li key={t.id} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`h-9 w-9 rounded-xl grid place-items-center ${t.amount > 0 ? "bg-emerald-50" : "bg-slate-50"}`}>
                        {t.amount > 0 ? <PiggyBank className="h-5 w-5 text-emerald-600"/> : <Wallet className="h-5 w-5 text-slate-600"/>}
                      </div>
                      <div>
                        <div className="font-medium leading-none">{t.title}</div>
                        <div className="text-xs text-slate-500">{t.category} • {t.time}</div>
                      </div>
                    </div>
                    <div className={`text-sm font-semibold ${t.amount>0?"text-emerald-600":"text-rose-600"}`}>
                      {t.amount>0?"+":"-"}{toCurrency(Math.abs(t.amount))}
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            {/* CTA to change limits */}
            <button
              onClick={() => history.push("/dashboard/budget")}
              className="mt-5 w-full block rounded-2xl bg-blue-600 text-white text-center py-3 font-medium shadow-md hover:bg-blue-700"
            >
              Adjust Monthly Limits
            </button>
          </main>

          {/* Bottom Tab Bar */}
          <TabBar active="dashboard" />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Dashboard;
