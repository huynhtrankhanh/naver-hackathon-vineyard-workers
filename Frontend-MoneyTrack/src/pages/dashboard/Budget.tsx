import React, { useState, useCallback, useEffect } from "react";
import { IonPage, IonContent, IonSpinner, IonToast } from "@ionic/react";
import { useHistory, useLocation } from "react-router-dom";
import { Plus, Trash2, Edit2 } from "lucide-react";
import Header from "../../components/dashboard/Header";
import TabBar from "../../components/dashboard/TabBar";
import { budgetApi } from "../../services/api";
import { useStateInvalidation, useInvalidateOnMutation } from "../../services/useStateInvalidation";
import { useBalance } from "../../services/BalanceContext";
import { useLocalization } from "../../services/LocaleContext";

interface Budget {
  id: string;
  category?: string;
  limit: number;
  spent: number;
  month: string;
}

const Budget: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const { l10n } = useLocalization();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [category, setCategory] = useState('');
  const [limit, setLimit] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'danger'>('success');
  const { balance, loading: balanceLoading } = useBalance();

  const toCurrency = (v: number) => v.toLocaleString("vi-VN") + " đ";
  
  // Get current month in YYYY-MM format
  const currentMonth = new Date().toISOString().slice(0, 7);

  const invalidateOnMutation = useInvalidateOnMutation();

  const categories = [
    'Food & Drinks',
    'Transport',
    'Shopping',
    'Bills',
    'Entertainment',
    'Healthcare',
    'Education',
    'Other'
  ];

  // Clear modal form state when user navigates to this page
  useEffect(() => {
    if (location.pathname === "/dashboard/budget") {
      setShowAddModal(false);
      setEditingBudget(null);
      setCategory('');
      setLimit('');
    }
  }, [location.pathname]);

  const fetchBudgets = useCallback(async () => {
    try {
      // Only show loading spinner on initial load, not on periodic refreshes
      if (isInitialLoad) {
        setLoading(true);
      }
      
      const budgetData = await budgetApi.getByMonth(currentMonth);
      setBudgets(budgetData);
    } catch (error) {
      console.error("Error fetching budgets:", error);
    } finally {
      if (isInitialLoad) {
        setLoading(false);
        setIsInitialLoad(false);
      }
    }
  }, [currentMonth, isInitialLoad]);

  // Use state invalidation hook
  useStateInvalidation({
    dataType: 'budgets',
    fetchData: fetchBudgets,
  });

  const handleAddBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!category || !limit || parseFloat(limit) <= 0) {
      setToastMessage(l10n.getString('please-fill-all-fields'));
      setToastColor('danger');
      setShowToast(true);
      return;
    }

    try {
      setSubmitting(true);
      
      await budgetApi.create({
        category,
        limit: parseFloat(limit),
        spent: 0,
        month: currentMonth
      });

      // Invalidate all state since we modified backend
      invalidateOnMutation();

      setToastMessage(l10n.getString('budget-added'));
      setToastColor('success');
      setShowToast(true);
      
      // Reset form and close modal
      setCategory('');
      setLimit('');
      setShowAddModal(false);
      
      // Refresh budgets
      fetchBudgets();
    } catch (error) {
      console.error('Error creating budget:', error);
      setToastMessage(l10n.getString('failed-add-budget'));
      setToastColor('danger');
      setShowToast(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingBudget || !limit || parseFloat(limit) <= 0) {
      setToastMessage(l10n.getString('please-enter-valid-limit'));
      setToastColor('danger');
      setShowToast(true);
      return;
    }

    try {
      setSubmitting(true);
      
      await budgetApi.update(editingBudget.id, {
        limit: parseFloat(limit)
      });

      // Invalidate all state since we modified backend
      invalidateOnMutation();

      setToastMessage(l10n.getString('budget-updated'));
      setToastColor('success');
      setShowToast(true);
      
      // Reset form and close modal
      setEditingBudget(null);
      setLimit('');
      
      // Refresh budgets
      fetchBudgets();
    } catch (error) {
      console.error('Error updating budget:', error);
      setToastMessage(l10n.getString('failed-update-budget'));
      setToastColor('danger');
      setShowToast(true);
    } finally {
      setSubmitting(false);
    }
  };

  const startEditBudget = (budget: Budget) => {
    setEditingBudget(budget);
    setLimit(budget.limit.toString());
    setShowAddModal(false);
  };

  const cancelEdit = () => {
    setEditingBudget(null);
    setLimit('');
  };

  const handleDeleteBudget = async (id: string) => {
    if (!confirm(l10n.getString('confirm-delete-budget'))) {
      return;
    }

    try {
      await budgetApi.delete(id);
      
      // Invalidate all state since we modified backend
      invalidateOnMutation();
      
      setToastMessage(l10n.getString('budget-deleted'));
      setToastColor('success');
      setShowToast(true);
      fetchBudgets();
    } catch (error) {
      console.error('Error deleting budget:', error);
      setToastMessage(l10n.getString('failed-delete-budget'));
      setToastColor('danger');
      setShowToast(true);
    }
  };

  return (
    <IonPage>
      <IonContent className="bg-white">
        <div className="min-h-screen bg-white text-slate-900 flex flex-col">
          <Header title={l10n.getString('monthly-budget')} onBack={() => history.push("/dashboard")} />
          <main className="mx-auto w-full max-w-md flex-1 px-4 pb-28 pt-4">
            {/* Balance Display */}
            {!loading && !balanceLoading && (
              <div className="rounded-2xl border border-slate-100 p-4 shadow-sm mb-4 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="text-sm text-slate-600 mb-1">{l10n.getString('current-balance')}</div>
                <div className={`text-2xl font-bold ${balance < 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                  {toCurrency(balance)}
                </div>
                {balance < 0 && (
                  <div className="text-xs text-rose-600 mt-1">
                    ⚠️ {l10n.getString('track-expenses-carefully')}
                  </div>
                )}
              </div>
            )}

            <div className="text-slate-500 text-sm mb-4">
              {l10n.getString('set-spending-limits', { month: new Date().toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' }) })}
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <IonSpinner name="crescent" />
              </div>
            ) : (
              <>
                {budgets.length > 0 ? (
                  <div className="space-y-3 mb-4">
                    {budgets.map(budget => {
                      const percentage = budget.limit > 0 ? (budget.spent / budget.limit) * 100 : 0;
                      const isOverBudget = percentage > 100;
                      
                      return (
                        <div key={budget.id} className="rounded-2xl border border-slate-100 p-4 shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-medium">{budget.category}</div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-slate-500">{l10n.getString('limit-label', { amount: toCurrency(budget.limit) })}</span>
                              <button
                                onClick={() => startEditBudget(budget)}
                                className="p-1 hover:bg-slate-100 rounded"
                                title={l10n.getString('edit-limit')}
                              >
                                <Edit2 className="h-4 w-4 text-slate-400 hover:text-blue-600" />
                              </button>
                              <button
                                onClick={() => handleDeleteBudget(budget.id)}
                                className="p-1 hover:bg-slate-100 rounded"
                                title={l10n.getString('delete-budget')}
                              >
                                <Trash2 className="h-4 w-4 text-slate-400 hover:text-rose-600" />
                              </button>
                            </div>
                          </div>
                          <div className="mt-2 h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                            <div 
                              className={`h-full transition-all ${isOverBudget ? 'bg-rose-500' : 'bg-blue-500'}`}
                              style={{ width: `${Math.min(100, percentage)}%` }} 
                            />
                          </div>
                          <div className="mt-2 flex justify-between text-xs">
                            <span className={isOverBudget ? 'text-rose-600 font-medium' : 'text-slate-500'}>
                              {toCurrency(budget.spent)} {l10n.getString('spent')}
                            </span>
                            <span className={isOverBudget ? 'text-rose-600 font-medium' : 'text-slate-600'}>
                              {Math.round(percentage)}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center text-slate-500 py-8 mb-4">
                    {l10n.getString('no-budgets-set')}
                  </div>
                )}

                {/* Edit Budget Modal */}
                {editingBudget && (
                  <div className="rounded-2xl border-2 border-blue-500 p-4 shadow-lg mb-4">
                    <h3 className="font-semibold mb-4">{l10n.getString('edit-budget-limit')} - {editingBudget.category}</h3>
                    <form onSubmit={handleEditBudget} className="space-y-3">
                      <div>
                        <label htmlFor="edit-limit" className="block text-sm font-medium text-slate-700 mb-1">
                          {l10n.getString('monthly-limit-vnd')}
                        </label>
                        <input
                          id="edit-limit"
                          type="tel"
                          value={limit}
                          onChange={(e) => setLimit(e.target.value)}
                          placeholder="0"
                          pattern="[0-9]*"
                          min="0"
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:outline-none"
                          required
                        />
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="flex-1 py-2 px-4 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
                        >
                          {l10n.getString('cancel')}
                        </button>
                        <button
                          type="submit"
                          disabled={submitting}
                          className="flex-1 py-2 px-4 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          {submitting ? l10n.getString('updating') : l10n.getString('update-limit')}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {!showAddModal && !editingBudget ? (
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl bg-blue-600 text-white py-3 font-medium shadow-md hover:bg-blue-700"
                  >
                    <Plus className="h-5 w-5" />
                    {l10n.getString('add-budget-category')}
                  </button>
                ) : showAddModal ? (
                  <div className="rounded-2xl border-2 border-blue-500 p-4 shadow-lg">
                    <h3 className="font-semibold mb-4">{l10n.getString('add-new-budget')}</h3>
                    <form onSubmit={handleAddBudget} className="space-y-3">
                      <div>
                        <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-1">
                          {l10n.getString('category')}
                        </label>
                        <select
                          id="category"
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:outline-none bg-white"
                          required
                        >
                          <option value="">{l10n.getString('select-category')}</option>
                          {categories.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="limit" className="block text-sm font-medium text-slate-700 mb-1">
                          {l10n.getString('monthly-limit-vnd')}
                        </label>
                        <input
                          id="limit"
                          type="tel"
                          value={limit}
                          onChange={(e) => setLimit(e.target.value)}
                          placeholder="0"
                          pattern="[0-9]*"
                          min="0"
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:outline-none"
                          required
                        />
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddModal(false);
                            setCategory('');
                            setLimit('');
                          }}
                          className="flex-1 py-2 px-4 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
                        >
                          {l10n.getString('cancel')}
                        </button>
                        <button
                          type="submit"
                          disabled={submitting}
                          className="flex-1 py-2 px-4 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          {submitting ? l10n.getString('adding') : l10n.getString('add-new-budget')}
                        </button>
                      </div>
                    </form>
                  </div>
                ) : null}
              </>
            )}

            <IonToast
              isOpen={showToast}
              onDidDismiss={() => setShowToast(false)}
              message={toastMessage}
              duration={2000}
              color={toastColor}
              position="top"
            />
          </main>
          <TabBar active="dashboard" />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Budget;