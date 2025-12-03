import React, { useState, useCallback } from "react";
import { IonPage, IonContent, IonSpinner } from "@ionic/react";
import { useHistory } from "react-router-dom";
import Header from "../../components/dashboard/Header";
import TabBar from "../../components/dashboard/TabBar";
import { transactionApi } from "../../services/api";
import { useStateInvalidation } from "../../services/useStateInvalidation";
import { useLocalization } from "../../services/LocaleContext";

interface Transaction {
  id?: string;
  type: string;
  category: string;
  amount: number;
  date?: string;
  note?: string;
}

const Expenses: React.FC = () => {
  const history = useHistory();
  const { l10n } = useLocalization();
  const [items, setItems] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const sum = items.reduce((a, b) => a + Math.abs(b.amount), 0);
  const toCurrency = (v: number) => v.toLocaleString("vi-VN") + " đ";

  const fetchExpenses = useCallback(async () => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      }
      const transactions = await transactionApi.getAll();
      // Filter only expense transactions
      const expenseTransactions = transactions.filter((t: Transaction) => t.type === 'expense');
      // Sort by date descending if date field exists
      expenseTransactions.sort((a, b) => {
        if (a.date && b.date) return b.date.localeCompare(a.date);
        return 0;
      });
      setItems(expenseTransactions);
    } catch (error) {
      console.error("Error fetching expenses:", error);
    } finally {
      if (isInitialLoad) {
        setLoading(false);
        setIsInitialLoad(false);
      }
    }
  }, [isInitialLoad]);

  // Use state invalidation hook
  useStateInvalidation({
    dataType: 'transactions',
    fetchData: fetchExpenses,
  });

  return (
    <IonPage>
      <IonContent className="bg-white">
        <div className="min-h-screen bg-white text-slate-900 flex flex-col">
          <Header title={l10n.getString('expenses')} onBack={() => history.push("/dashboard")} />
          <main className="mx-auto w-full max-w-md flex-1 px-4 pb-28 pt-4">
            <div className="rounded-2xl border border-slate-100 p-4 shadow-sm mb-4">
              <div className="text-xs text-slate-500">{l10n.getString('this-month')}</div>
              <div className="text-2xl font-bold text-rose-600 mt-1">-{toCurrency(sum)}</div>
            </div>
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <IonSpinner name="crescent" />
              </div>
            ) : items.length > 0 ? (
              <ul className="rounded-2xl border border-slate-100 divide-y divide-slate-100 shadow-sm">
                {items.map((t) => (
                  <li
                    key={t.id}
                    className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => t.id && history.push(`/edit-transaction/${t.id}`)}
                  >
                    <div>
                      <div className="font-medium">{t.note || t.category}</div>
                      <div className="text-xs text-slate-500">{t.category}{t.date ? ` • ${new Date(t.date).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' })}` : ''}</div>
                    </div>
                    <div className="text-sm font-semibold text-rose-600">-{toCurrency(Math.abs(t.amount))}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center text-slate-500 py-12">
                {l10n.getString('no-expenses')}
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
