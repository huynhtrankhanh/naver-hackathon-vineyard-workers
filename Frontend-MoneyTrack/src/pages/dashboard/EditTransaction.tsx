import React, { useState, useEffect } from "react";
import {
  IonPage,
  IonContent,
  IonButton,
  IonSpinner,
  IonToast,
  IonAlert,
} from "@ionic/react";
import { useHistory, useParams } from "react-router-dom";
import Header from "../../components/dashboard/Header";
import TabBar from "../../components/dashboard/TabBar";
import { transactionApi, budgetApi } from "../../services/api";
import { useInvalidateOnMutation } from "../../services/useStateInvalidation";
import { useBalance } from "../../services/BalanceContext";

interface Budget {
  _id: string;
  category: string;
  limit: number;
  spent: number;
  month: string;
}

interface Transaction {
  _id: string;
  title: string;
  category: string;
  amount: number;
  type: "income" | "expense";
  date: string;
}

const EditTransaction: React.FC = () => {
  const history = useHistory();
  const { id } = useParams<{ id: string }>();
  const [type, setType] = useState<"income" | "expense">("expense");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingTransaction, setLoadingTransaction] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastColor, setToastColor] = useState<"success" | "danger">("success");
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  // Store original transaction data for balance calculation
  const [originalAmount, setOriginalAmount] = useState<number>(0);
  const [originalType, setOriginalType] = useState<"income" | "expense">("expense");
  const {
    balance,
    loading: balanceLoading,
    refresh: refreshBalance,
  } = useBalance();

  const invalidateOnMutation = useInvalidateOnMutation();

  const toCurrency = (v: number) => v.toLocaleString("vi-VN") + " đ";

  // Fetch transaction details
  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        setLoadingTransaction(true);
        const transaction: Transaction = await transactionApi.getById(id);
        setTitle(transaction.title);
        setCategory(transaction.category);
        setAmount(transaction.amount.toString());
        setType(transaction.type);
        // Store original values for balance calculation
        setOriginalAmount(transaction.amount);
        setOriginalType(transaction.type);
      } catch (error) {
        console.error("Error fetching transaction:", error);
        setToastMessage("Failed to load transaction");
        setToastColor("danger");
        setShowToast(true);
        setTimeout(() => history.push("/dashboard"), 2000);
      } finally {
        setLoadingTransaction(false);
      }
    };

    if (id) {
      fetchTransaction();
    }
  }, [id, history]);

  // Fetch budgets when component mounts or when type changes to expense
  useEffect(() => {
    const fetchBudgets = async () => {
      if (type === "expense") {
        try {
          const currentMonth = new Date().toISOString().slice(0, 7);
          const budgetsData = await budgetApi.getByMonth(currentMonth);
          setBudgets(budgetsData);
        } catch (error) {
          console.error("Error fetching budgets:", error);
        }
      }
    };
    fetchBudgets();
  }, [type]);

  // Update selected budget when category changes
  useEffect(() => {
    if (type === "expense" && category) {
      const budget = budgets.find((b) => b.category === category);
      setSelectedBudget(budget || null);
    } else {
      setSelectedBudget(null);
    }
  }, [category, budgets, type]);

  const expenseCategories = [
    "Food & Drinks",
    "Transport",
    "Shopping",
    "Bills",
    "Entertainment",
    "Healthcare",
    "Education",
    "Other",
  ];

  const incomeCategories = [
    "Salary",
    "Freelance",
    "Investment",
    "Gift",
    "Bonus",
    "Other",
  ];

  const categories = type === "expense" ? expenseCategories : incomeCategories;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !category || !amount || parseFloat(amount) <= 0) {
      setToastMessage("Please fill in all fields with valid values");
      setToastColor("danger");
      setShowToast(true);
      return;
    }

    try {
      setLoading(true);

      await transactionApi.update(id, {
        title: title.trim(),
        category,
        amount: parseFloat(amount),
        type,
      });

      // Invalidate all state since we modified backend
      invalidateOnMutation();

      // Proactively refresh balance right away
      refreshBalance();

      setToastMessage("Transaction updated successfully!");
      setToastColor("success");
      setShowToast(true);

      // Navigate back after a short delay
      setTimeout(() => {
        history.push("/dashboard");
      }, 1500);
    } catch (error) {
      console.error("Error updating transaction:", error);
      setToastMessage("Failed to update transaction. Please try again.");
      setToastColor("danger");
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      await transactionApi.delete(id);

      // Invalidate all state since we modified backend
      invalidateOnMutation();

      // Proactively refresh balance right away
      refreshBalance();

      setToastMessage("Transaction deleted successfully!");
      setToastColor("success");
      setShowToast(true);

      // Navigate back after a short delay
      setTimeout(() => {
        history.push("/dashboard");
      }, 1500);
    } catch (error) {
      console.error("Error deleting transaction:", error);
      setToastMessage("Failed to delete transaction. Please try again.");
      setToastColor("danger");
      setShowToast(true);
      setLoading(false);
    }
  };

  if (loadingTransaction) {
    return (
      <IonPage>
        <IonContent className="bg-white">
          <div className="min-h-screen bg-white text-slate-900 flex flex-col">
            <Header
              title="Edit Transaction"
              onBack={() => history.push("/dashboard")}
            />
            <main className="mx-auto w-full max-w-md flex-1 px-4 pb-28 pt-4">
              <div className="flex justify-center items-center py-12">
                <IonSpinner name="crescent" />
              </div>
            </main>
            <TabBar active="dashboard" />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonContent className="bg-white">
        <div className="min-h-screen bg-white text-slate-900 flex flex-col">
          <Header
            title="Edit Transaction"
            onBack={() => history.push("/dashboard")}
          />
          <main className="mx-auto w-full max-w-md flex-1 px-4 pb-28 pt-4">
            {/* Current Balance Display */}
            {!balanceLoading && (
              <div className="rounded-2xl border border-slate-100 p-4 shadow-sm mb-4 bg-gradient-to-r from-blue-50 to-purple-50">
                <div className="text-sm text-slate-600 mb-1">
                  Current Balance
                </div>
                <div
                  className={`text-2xl font-bold ${
                    balance < 0 ? "text-rose-600" : "text-slate-900"
                  }`}
                >
                  {toCurrency(balance)}
                </div>
                {balance < 0 && (
                  <div className="text-xs text-rose-600 mt-1">
                    ⚠️ Negative balance - Consider recording income accurately
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setType("expense");
                      setCategory("");
                    }}
                    className={`py-3 px-4 rounded-xl font-medium transition-colors ${
                      type === "expense"
                        ? "bg-rose-600 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setType("income");
                      setCategory("");
                    }}
                    className={`py-3 px-4 rounded-xl font-medium transition-colors ${
                      type === "income"
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    Income
                  </button>
                </div>
              </div>

              {/* Title */}
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  Title
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Coffee at Highlands"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label
                  htmlFor="category"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  Category
                </label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none bg-white"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                {/* Budget Limit Info */}
                {type === "expense" && selectedBudget && (
                  <div className="mt-3 p-3 rounded-xl bg-blue-50 border border-blue-200">
                    <div className="text-sm font-medium text-blue-900 mb-2">
                      Budget for {selectedBudget.category}
                    </div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-blue-700">Spent:</span>
                      <span className="font-medium text-blue-900">
                        {toCurrency(selectedBudget.spent)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-blue-700">Limit:</span>
                      <span className="font-medium text-blue-900">
                        {toCurrency(selectedBudget.limit)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-blue-700">Remaining:</span>
                      <span
                        className={`font-medium ${
                          selectedBudget.limit - selectedBudget.spent >= 0
                            ? "text-emerald-600"
                            : "text-rose-600"
                        }`}
                      >
                        {toCurrency(
                          selectedBudget.limit - selectedBudget.spent
                        )}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-blue-200 overflow-hidden mt-2">
                      <div
                        className={`h-full transition-all ${
                          selectedBudget.spent / selectedBudget.limit > 1
                            ? "bg-rose-500"
                            : selectedBudget.spent / selectedBudget.limit > 0.8
                            ? "bg-orange-500"
                            : "bg-blue-500"
                        }`}
                        style={{
                          width: `${Math.min(
                            100,
                            (selectedBudget.spent / selectedBudget.limit) * 100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* No Budget Warning */}
                {type === "expense" && category && !selectedBudget && (
                  <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200">
                    <div className="text-sm text-amber-800">
                      No budget set for this category.
                      <a
                        href="/dashboard/budget"
                        className="ml-1 font-medium text-amber-900 hover:underline"
                      >
                        Set one now
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Amount */}
              <div>
                <label
                  htmlFor="amount"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  Amount (VND)
                </label>
                <input
                  id="amount"
                  type="tel"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  min="0"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none"
                  required
                />

                {/* Balance Preview */}
                {amount && parseFloat(amount) > 0 && !balanceLoading && (
                  <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-sm font-medium text-slate-700 mb-2">
                      Balance Preview
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Current balance:</span>
                        <span
                          className={`font-medium ${
                            balance < 0 ? "text-rose-600" : "text-slate-900"
                          }`}
                        >
                          {toCurrency(balance)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Original transaction:</span>
                        <span
                          className={`font-medium ${
                            originalType === "income"
                              ? "text-emerald-600"
                              : "text-rose-600"
                          }`}
                        >
                          {originalType === "income" ? "+" : "-"}
                          {toCurrency(originalAmount)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">New transaction:</span>
                        <span
                          className={`font-medium ${
                            type === "income"
                              ? "text-emerald-600"
                              : "text-rose-600"
                          }`}
                        >
                          {type === "income" ? "+" : "-"}
                          {toCurrency(parseFloat(amount))}
                        </span>
                      </div>
                      <div className="border-t border-slate-200 pt-1 mt-1 flex justify-between">
                        <span className="text-slate-700 font-medium">
                          New balance:
                        </span>
                        <span
                          className={`font-bold ${
                            (() => {
                              // Calculate: current balance - original transaction + new transaction
                              let newBalance = balance;
                              // Remove old transaction effect
                              if (originalType === "income") {
                                newBalance -= originalAmount;
                              } else {
                                newBalance += originalAmount;
                              }
                              // Add new transaction effect
                              if (type === "income") {
                                newBalance += parseFloat(amount);
                              } else {
                                newBalance -= parseFloat(amount);
                              }
                              return newBalance < 0;
                            })()
                              ? "text-rose-600"
                              : "text-slate-900"
                          }`}
                        >
                          {toCurrency(
                            (() => {
                              // Calculate: current balance - original transaction + new transaction
                              let newBalance = balance;
                              // Remove old transaction effect
                              if (originalType === "income") {
                                newBalance -= originalAmount;
                              } else {
                                newBalance += originalAmount;
                              }
                              // Add new transaction effect
                              if (type === "income") {
                                newBalance += parseFloat(amount);
                              } else {
                                newBalance -= parseFloat(amount);
                              }
                              return newBalance;
                            })()
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit and Delete Buttons */}
              <div className="space-y-3 mt-6">
                <IonButton
                  type="submit"
                  expand="block"
                  disabled={loading}
                  color="primary"
                >
                  {loading ? <IonSpinner name="crescent" /> : "Update Transaction"}
                </IonButton>

                <IonButton
                  type="button"
                  expand="block"
                  color="danger"
                  fill="outline"
                  disabled={loading}
                  onClick={() => setShowDeleteAlert(true)}
                >
                  Delete Transaction
                </IonButton>
              </div>
            </form>

            <IonToast
              isOpen={showToast}
              onDidDismiss={() => setShowToast(false)}
              message={toastMessage}
              duration={2000}
              color={toastColor}
              position="top"
            />

            <IonAlert
              isOpen={showDeleteAlert}
              onDidDismiss={() => setShowDeleteAlert(false)}
              header="Delete Transaction"
              message="Are you sure you want to delete this transaction? This action cannot be undone."
              buttons={[
                {
                  text: "Cancel",
                  role: "cancel",
                },
                {
                  text: "Delete",
                  role: "destructive",
                  handler: handleDelete,
                },
              ]}
            />
          </main>
          <TabBar active="dashboard" />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default EditTransaction;
