import React, { useState, useEffect } from "react";
import { IonPage, IonContent, IonSpinner } from "@ionic/react";
import { useHistory } from "react-router-dom";
import Header from "../../components/dashboard/Header";
import TabBar from "../../components/dashboard/TabBar";
import { transactionApi } from "../../services/api";

interface Transaction {
  _id: string;
  title: string;
  amount: number;
  date: string;
  category: string;
}

const Income: React.FC = () => {
  const history = useHistory();
  const [items, setItems] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const sum = items.reduce((a, b) => a + b.amount, 0);
  const toCurrency = (v: number) => v.toLocaleString("vi-VN") + " đ";

  useEffect(() => {
    const fetchIncome = async () => {
      try {
        setLoading(true);
        const transactions = await transactionApi.getAll();
        // Filter only income transactions
        const incomeTransactions = transactions.filter((t: any) => t.type === 'income');
        setItems(incomeTransactions);
      } catch (error) {
        console.error("Error fetching income:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchIncome();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' });
  };

  return (
    <IonPage>
      <IonContent className="bg-white">
        <div className="min-h-screen bg-white text-slate-900 flex flex-col">
          <Header title="Income" onBack={() => history.push("/dashboard")} />
          <main className="mx-auto w-full max-w-md flex-1 px-4 pb-28 pt-4">
            <div className="rounded-2xl border border-slate-100 p-4 shadow-sm mb-4">
              <div className="text-xs text-slate-500">This month</div>
              <div className="text-2xl font-bold text-emerald-600 mt-1">+{toCurrency(sum)}</div>
            </div>
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <IonSpinner name="crescent" />
              </div>
            ) : items.length > 0 ? (
              <ul className="rounded-2xl border border-slate-100 divide-y divide-slate-100 shadow-sm">
                {items.map((i) => (
                  <li key={i._id} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium">{i.title}</div>
                      <div className="text-xs text-slate-500">{i.category} • {formatDate(i.date)}</div>
                    </div>
                    <div className="text-sm font-semibold text-emerald-600">+{toCurrency(i.amount)}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center text-slate-500 py-12">
                No income transactions yet. Add one from the Add Transaction page.
              </div>
            )}
          </main>
          <TabBar active="dashboard" />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Income;
