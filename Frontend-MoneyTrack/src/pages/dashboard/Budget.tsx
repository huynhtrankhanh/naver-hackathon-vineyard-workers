import React, { useState, useCallback, useEffect } from "react";
import { IonPage, IonContent, IonSpinner, IonToast } from "@ionic/react";
import { useHistory, useLocation } from "react-router-dom";
import { Plus, Trash2, Edit2 } from "lucide-react";
import Header from "../../components/dashboard/Header";
import TabBar from "../../components/dashboard/TabBar";
import { budgetApi, aiApi } from "../../services/api";
import { useStateInvalidation, useInvalidateOnMutation } from "../../services/useStateInvalidation";
import { useBalance } from "../../services/BalanceContext";

interface Budget {
  _id: string;
  category: string;
  limit: number;
  spent: number;
  month: string;
}

interface SavingPlan {
  _id: string;
  proposedBudgetLimits?: Array<{
    category: string;
    suggestedLimit: number;
    currentLimit?: number;
    reasoning?: string;
  }>;
}

const Budget: React.FC = () => {
  const history = useHistory();
  const location = useLocation<{ fromSavingPlan?: boolean; savingPlanId?: string }>();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [currentSavingPlan, setCurrentSavingPlan] = useState<SavingPlan | null>(null);
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

  // Check if we're coming from a saving plan page
  const fromSavingPlan = location.state?.fromSavingPlan || false;
  const savingPlanId = location.state?.savingPlanId;

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

      // Fetch the current/specific saving plan only if coming from saving plan page
      if (fromSavingPlan && savingPlanId) {
        const planData = await aiApi.getPlanById(savingPlanId);
        setCurrentSavingPlan(planData);
      } else {
        setCurrentSavingPlan(null);
      }
    } catch (error) {
      console.error("Error fetching budgets:", error);
    } finally {
      if (isInitialLoad) {
        setLoading(false);
        setIsInitialLoad(false);
      }
    }
  }, [currentMonth, isInitialLoad, fromSavingPlan, savingPlanId]);

  // Use state invalidation hook
  useStateInvalidation({
    dataType: 'budgets',
    fetchData: fetchBudgets,
  });

  const handleAddBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!category || !limit || parseFloat(limit) <= 0) {
      setToastMessage('Please fill in all fields with valid values');
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

      setToastMessage('Budget added successfully!');
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
      setToastMessage('Failed to add budget. Please try again.');
      setToastColor('danger');
      setShowToast(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingBudget || !limit || parseFloat(limit) <= 0) {
      setToastMessage('Please enter a valid limit value');
      setToastColor('danger');
      setShowToast(true);
      return;
    }

    try {
      setSubmitting(true);
      
      await budgetApi.update(editingBudget._id, {
        limit: parseFloat(limit)
      });

      // Invalidate all state since we modified backend
      invalidateOnMutation();

      setToastMessage('Budget updated successfully!');
      setToastColor('success');
      setShowToast(true);
      
      // Reset form and close modal
      setEditingBudget(null);
      setLimit('');
      
      // Refresh budgets
      fetchBudgets();
    } catch (error) {
      console.error('Error updating budget:', error);
      setToastMessage('Failed to update budget. Please try again.');
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
    if (!confirm('Are you sure you want to delete this budget?')) {
      return;
    }

    try {
      await budgetApi.delete(id);
      
      // Invalidate all state since we modified backend
      invalidateOnMutation();
      
      setToastMessage('Budget deleted successfully!');
      setToastColor('success');
      setShowToast(true);
      fetchBudgets();
    } catch (error) {
      console.error('Error deleting budget:', error);
      setToastMessage('Failed to delete budget.');
      setToastColor('danger');
      setShowToast(true);
    }
  };

  // Get AI proposed limit for a category (only if coming from saving plan page)
  const getProposedLimit = (category: string) => {
    if (!fromSavingPlan || !currentSavingPlan || !currentSavingPlan.proposedBudgetLimits) {
      return null;
    }
    
    const proposal = currentSavingPlan.proposedBudgetLimits.find(p => p.category === category);
    return proposal || null;
  };

  // Get all AI proposed limits for categories without existing budgets (only if coming from saving plan page)
  const getNewProposedLimits = () => {
    if (!fromSavingPlan || !currentSavingPlan || !currentSavingPlan.proposedBudgetLimits) {
      return [];
    }

    const existingCategories = new Set(budgets.map(b => b.category));
    const proposals: Array<{
      category: string;
      suggestedLimit: number;
      reasoning?: string;
    }> = [];

    for (const proposal of currentSavingPlan.proposedBudgetLimits) {
      if (!existingCategories.has(proposal.category)) {
        proposals.push(proposal);
      }
    }

    return proposals;
  };

  return (
    <IonPage>
      <IonContent className="bg-white">
        <div className="min-h-screen bg-white text-slate-900 flex flex-col">
          <Header title="Monthly Budget" onBack={() => history.push("/dashboard")} />
          <main className="mx-auto w-full max-w-md flex-1 px-4 pb-28 pt-4">
            {/* Balance Display */}
            {!loading && !balanceLoading && (
              <div className="rounded-2xl border border-slate-100 p-4 shadow-sm mb-4 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="text-sm text-slate-600 mb-1">Current Balance</div>
                <div className={`text-2xl font-bold ${balance < 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                  {toCurrency(balance)}
                </div>
                {balance < 0 && (
                  <div className="text-xs text-rose-600 mt-1">
                    ⚠️ Negative balance - Track expenses carefully
                  </div>
                )}
              </div>
            )}

            <div className="text-slate-500 text-sm mb-4">
              Set spending limits for different categories. Month: {new Date().toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
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
                      const proposedLimit = getProposedLimit(budget.category);
                      
                      return (
                        <div key={budget._id} className="rounded-2xl border border-slate-100 p-4 shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-medium">{budget.category}</div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-slate-500">Limit {toCurrency(budget.limit)}</span>
                              <button
                                onClick={() => startEditBudget(budget)}
                                className="p-1 hover:bg-slate-100 rounded"
                                title="Edit limit"
                              >
                                <Edit2 className="h-4 w-4 text-slate-400 hover:text-blue-600" />
                              </button>
                              <button
                                onClick={() => handleDeleteBudget(budget._id)}
                                className="p-1 hover:bg-slate-100 rounded"
                                title="Delete budget"
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
                              {toCurrency(budget.spent)} spent
                            </span>
                            <span className={isOverBudget ? 'text-rose-600 font-medium' : 'text-slate-600'}>
                              {Math.round(percentage)}%
                            </span>
                          </div>
                          
                          {/* AI Proposed Limit */}
                          {proposedLimit && (
                            <div className="mt-3 p-3 bg-blue-50 rounded-xl border border-blue-200">
                              <div className="text-xs font-medium text-blue-700 mb-1">✨ AI Suggested Limit</div>
                              <div className="text-sm font-semibold text-slate-900">{toCurrency(proposedLimit.suggestedLimit)}</div>
                              {proposedLimit.reasoning && (
                                <div className="text-xs text-slate-600 mt-1">{proposedLimit.reasoning}</div>
                              )}
                              <button
                                onClick={() => {
                                  setEditingBudget(budget);
                                  setLimit(proposedLimit.suggestedLimit.toString());
                                }}
                                className="mt-2 w-full py-1.5 px-3 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700"
                              >
                                Apply Suggested Limit
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center text-slate-500 py-8 mb-4">
                    No budgets set for this month. Add one to start tracking!
                  </div>
                )}

                {/* AI Proposed New Budget Categories */}
                {getNewProposedLimits().length > 0 && !showAddModal && !editingBudget && (
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-blue-600 mb-2 flex items-center gap-2">
                      ✨ AI Suggested New Budget Categories
                    </h3>
                    <div className="space-y-3">
                      {getNewProposedLimits().map((proposal, idx) => (
                        <div key={idx} className="rounded-2xl border-2 border-blue-200 bg-blue-50/50 p-4 shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-medium text-slate-900">{proposal.category}</div>
                            <div className="text-sm font-semibold text-blue-600">{toCurrency(proposal.suggestedLimit)}</div>
                          </div>
                          {proposal.reasoning && (
                            <div className="text-xs text-slate-600 mb-3">{proposal.reasoning}</div>
                          )}
                          <button
                            onClick={() => {
                              setCategory(proposal.category);
                              setLimit(proposal.suggestedLimit.toString());
                              setShowAddModal(true);
                            }}
                            className="w-full py-2 px-4 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
                          >
                            Create Budget with this Limit
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Edit Budget Modal */}
                {editingBudget && (
                  <div className="rounded-2xl border-2 border-blue-500 p-4 shadow-lg mb-4">
                    <h3 className="font-semibold mb-4">Edit Budget Limit - {editingBudget.category}</h3>
                    <form onSubmit={handleEditBudget} className="space-y-3">
                      <div>
                        <label htmlFor="edit-limit" className="block text-sm font-medium text-slate-700 mb-1">
                          Monthly Limit (VND)
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
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={submitting}
                          className="flex-1 py-2 px-4 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          {submitting ? 'Updating...' : 'Update Limit'}
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
                    Add Budget Category
                  </button>
                ) : showAddModal ? (
                  <div className="rounded-2xl border-2 border-blue-500 p-4 shadow-lg">
                    <h3 className="font-semibold mb-4">Add New Budget</h3>
                    <form onSubmit={handleAddBudget} className="space-y-3">
                      <div>
                        <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-1">
                          Category
                        </label>
                        <select
                          id="category"
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:outline-none bg-white"
                          required
                        >
                          <option value="">Select a category</option>
                          {categories.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="limit" className="block text-sm font-medium text-slate-700 mb-1">
                          Monthly Limit (VND)
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
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={submitting}
                          className="flex-1 py-2 px-4 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          {submitting ? 'Adding...' : 'Add Budget'}
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