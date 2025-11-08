import { useEffect, useState } from "react";
import { Plus, Wallet, PiggyBank, PieChart, Sparkles, Bell, User, Gauge } from "lucide-react";

// --- Simple hash router ---
export default function App() {
  const [route, setRoute] = useState<string>(window.location.hash || "#/dashboard");
  useEffect(() => {
    const onHashChange = () => setRoute(window.location.hash || "#/dashboard");
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  if (route.startsWith("#/income")) return <IncomePage />;
  if (route.startsWith("#/expenses")) return <ExpensesPage />;
  if (route.startsWith("#/budget")) return <BudgetPage />;
  return <DashboardPage />;
}

// --- Dashboard ---
function DashboardPage() {
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

  const toCurrency = (v:number) => v.toLocaleString("vi-VN") + " đ";

  return (
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
            onClick={() => (window.location.hash = "#/income")}
          />
          <KpiCard
            title="Expenses"
            value={toCurrency(expenses)}
            icon={<PieChart className="h-4 w-4" />}
            color="from-rose-500 to-rose-600"
            onClick={() => (window.location.hash = "#/expenses")}
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
            <a href="#/goals" className="text-sm text-blue-600 hover:underline">View all</a>
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
            <a href="#/transactions" className="text-sm text-blue-600 hover:underline">See all</a>
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
        <a
          href="#/budget"
          className="mt-5 block rounded-2xl bg-blue-600 text-white text-center py-3 font-medium shadow-md hover:bg-blue-700"
        >
          Adjust Monthly Limits
        </a>
      </main>

      {/* Bottom Tab Bar */}
      <TabBar active="dashboard" />
    </div>
  );
}

// --- Income Page ---
function IncomePage(){
  const items = [
    { source: "Salary", amount: 15000000, date: "Nov 01" },
    { source: "Freelance", amount: 1200000, date: "Nov 08" },
  ];
  const sum = items.reduce((a,b)=>a+b.amount,0);
  const toCurrency = (v:number) => v.toLocaleString("vi-VN") + " đ";
  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col">
      <Header title="Income" />
      <main className="mx-auto w-full max-w-md flex-1 px-4 pb-28 pt-4">
        <div className="rounded-2xl border border-slate-100 p-4 shadow-sm mb-4">
          <div className="text-xs text-slate-500">This month</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">+{toCurrency(sum)}</div>
        </div>
        <ul className="rounded-2xl border border-slate-100 divide-y divide-slate-100 shadow-sm">
          {items.map((i,idx)=> (
            <li key={idx} className="px-4 py-3 flex items-center justify-between">
              <div>
                <div className="font-medium">{i.source}</div>
                <div className="text-xs text-slate-500">{i.date}</div>
              </div>
              <div className="text-sm font-semibold text-emerald-600">+{toCurrency(i.amount)}</div>
            </li>
          ))}
        </ul>
      </main>
      <TabBar active="dashboard" />
    </div>
  );
}

// --- Expenses Page ---
function ExpensesPage(){
  const items = [
    { category: "Food & Drinks", amount: 3200000 },
    { category: "Transport", amount: 900000 },
    { category: "Shopping", amount: 1800000 },
    { category: "Bills", amount: 1500000 },
    { category: "Other", amount: 450000 },
  ];
  const sum = items.reduce((a,b)=>a+b.amount,0);
  const toCurrency = (v:number) => v.toLocaleString("vi-VN") + " đ";
  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col">
      <Header title="Expenses" />
      <main className="mx-auto w-full max-w-md flex-1 px-4 pb-28 pt-4">
        <div className="rounded-2xl border border-slate-100 p-4 shadow-sm mb-4">
          <div className="text-xs text-slate-500">This month</div>
          <div className="text-2xl font-bold text-rose-600 mt-1">-{toCurrency(sum)}</div>
        </div>
        <ul className="rounded-2xl border border-slate-100 divide-y divide-slate-100 shadow-sm">
          {items.map((i,idx)=> (
            <li key={idx} className="px-4 py-3 flex items-center justify-between">
              <div className="font-medium">{i.category}</div>
              <div className="text-sm font-semibold text-rose-600">-{toCurrency(i.amount)}</div>
            </li>
          ))}
        </ul>
      </main>
      <TabBar active="dashboard" />
    </div>
  );
}

// --- Budget Page (placeholder) ---
function BudgetPage(){
  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col">
      <Header title="Monthly Budget" />
      <main className="mx-auto w-full max-w-md flex-1 px-4 pb-28 pt-4">
        <div className="text-slate-500 text-sm">Coming soon… adjust category limits here.</div>
      </main>
      <TabBar active="dashboard" />
    </div>
  );
}

// --- Shared UI ---
function Header({ title }:{title:string}){
  return (
    <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-slate-100">
      <div className="mx-auto max-w-md px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-2xl bg-blue-600 flex items-center justify-center shadow-sm">
            <Wallet className="h-5 w-5 text-white" />
          </div>
          <div className="font-semibold">{title}</div>
        </div>
        <button onClick={()=> (window.location.hash = "#/dashboard")} className="text-sm text-blue-600">Back</button>
      </div>
    </header>
  );
}

function KpiCard({ title, value, icon, color, onClick }: { title:string; value:string; icon:React.ReactNode; color:string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="rounded-2xl border border-slate-100 p-3 shadow-sm text-left hover:bg-slate-50 active:scale-[.99] transition">
      <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${color} text-white grid place-items-center mb-2`}>{icon}</div>
      <div className="text-xs text-slate-500">{title}</div>
      <div className="font-semibold">{value}</div>
    </button>
  );
}

function Legend({ label, value, colorClass }:{label:string; value:string; colorClass:string}){
  return (
    <div className="flex items-center gap-2">
      <span className={`h-2 w-2 rounded-full ${colorClass}`}></span>
      <div className="text-xs">
        <div className="font-medium text-slate-700">{label}</div>
        <div className="text-slate-500">{value}</div>
      </div>
    </div>
  );
}

function TabBar({ active }:{active: "dashboard" | "add" | "goals" | "profile"}){
  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-100">
      <div className="mx-auto max-w-md grid grid-cols-4">
        <TabBtn href="#/dashboard" label="Dashboard" active={active==="dashboard"} icon={<PieChart className="h-5 w-5"/>} />
        <TabBtn href="#/add" label="Add" active={active==="add"} icon={<Plus className="h-5 w-5"/>} />
        <TabBtn href="#/goals" label="Goals" active={active==="goals"} icon={<Sparkles className="h-5 w-5"/>} />
        <TabBtn href="#/profile" label="Profile" active={active==="profile"} icon={<User className="h-5 w-5"/>} />
      </div>
    </nav>
  );
}

function TabBtn({ href, label, icon, active=false }:{ href:string; label:string; icon:React.ReactNode; active?:boolean }){
  return (
    <a href={href} className={`flex flex-col items-center justify-center py-2 ${active?"text-blue-600":"text-slate-500 hover:text-slate-700"}`}>
      {icon}
      <span className="text-[11px] leading-tight">{label}</span>
    </a>
  );
}
