import React from "react";
import { IonPage, IonContent } from "@ionic/react";
import { useHistory } from "react-router-dom";
import Header from "../../components/dashboard/Header";
import TabBar from "../../components/dashboard/TabBar";

const Expenses: React.FC = () => {
  const history = useHistory();
  const items = [
    { category: "Food & Drinks", amount: 3200000 },
    { category: "Transport", amount: 900000 },
    { category: "Shopping", amount: 1800000 },
    { category: "Bills", amount: 1500000 },
    { category: "Other", amount: 450000 },
  ];
  const sum = items.reduce((a, b) => a + b.amount, 0);
  const toCurrency = (v: number) => v.toLocaleString("vi-VN") + " đ";

  return (
    <IonPage>
      <IonContent className="bg-white">
        <div className="min-h-screen bg-white text-slate-900 flex flex-col">
          <Header title="Expenses" onBack={() => history.push("/dashboard")} />
          <main className="mx-auto w-full max-w-md flex-1 px-4 pb-28 pt-4">
            <div className="rounded-2xl border border-slate-100 p-4 shadow-sm mb-4">
              <div className="text-xs text-slate-500">This month</div>
              <div className="text-2xl font-bold text-rose-600 mt-1">-{toCurrency(sum)}</div>
            </div>
            <ul className="rounded-2xl border border-slate-100 divide-y divide-slate-100 shadow-sm">
              {items.map((i, idx) => (
                <li key={idx} className="px-4 py-3 flex items-center justify-between">
                  <div className="font-medium">{i.category}</div>
                  <div className="text-sm font-semibold text-rose-600">-{toCurrency(i.amount)}</div>
                </li>
              ))}
            </ul>
          </main>
          <TabBar active="dashboard" />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Expenses;
