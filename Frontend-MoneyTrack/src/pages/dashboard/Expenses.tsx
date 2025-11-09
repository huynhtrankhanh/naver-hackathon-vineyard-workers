import React, { useState, useCallback } from "react";
import { IonPage, IonContent, IonSpinner } from "@ionic/react";
import { useHistory } from "react-router-dom";
import Header from "../../components/dashboard/Header";
import TabBar from "../../components/dashboard/TabBar";
import { transactionApi } from "../../services/api";
import { useStateInvalidation } from "../../services/useStateInvalidation";

interface CategoryExpense {
  category: string;
  amount: number;
}

interface Transaction {
  type: string;
  category: string;
  amount: number;
}

const Expenses: React.FC = () => {
  const history = useHistory();
  const [items, setItems] = useState<CategoryExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const sum = items.reduce((a, b) => a + b.amount, 0);
  const toCurrency = (v: number) => v.toLocaleString("vi-VN") + " đ";

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      const transactions = await transactionApi.getAll();
      // Filter only expense transactions
      const expenseTransactions = transactions.filter((t: Transaction) => t.type === 'expense');
      
      // Group by category
      const categoryMap = new Map<string, number>();
      expenseTransactions.forEach((t: Transaction) => {
        const current = categoryMap.get(t.category) || 0;
        categoryMap.set(t.category, current + Math.abs(t.amount));
      });
      
      // Convert to array and sort by amount descending
      const categoryExpenses: CategoryExpense[] = Array.from(categoryMap.entries())
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount);
      
      setItems(categoryExpenses);
    } catch (error) {
      console.error("Error fetching expenses:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Use state invalidation hook
  useStateInvalidation({
    dataType: 'transactions',
    fetchData: fetchExpenses,
  });

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
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <IonSpinner name="crescent" />
              </div>
            ) : items.length > 0 ? (
              <ul className="rounded-2xl border border-slate-100 divide-y divide-slate-100 shadow-sm">
                {items.map((i, idx) => (
                  <li key={idx} className="px-4 py-3 flex items-center justify-between">
                    <div className="font-medium">{i.category}</div>
                    <div className="text-sm font-semibold text-rose-600">-{toCurrency(i.amount)}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center text-slate-500 py-12">
                No expenses yet. Add a transaction from the Add Transaction page.
              </div>
            )}
          </main>
          <TabBar active="dashboard" />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Expenses;
