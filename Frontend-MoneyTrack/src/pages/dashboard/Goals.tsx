import React, { useState, useCallback, useEffect } from "react";
import { IonPage, IonContent, IonSpinner, IonToast } from "@ionic/react";
import { useHistory, useLocation } from "react-router-dom";
import { Target, Plus } from "lucide-react";
import Header from "../../components/dashboard/Header";
import TabBar from "../../components/dashboard/TabBar";
import { goalsApi } from "../../services/api";
import { useStateInvalidation, useInvalidateOnMutation } from "../../services/useStateInvalidation";
import { useBalance } from "../../services/BalanceContext";

interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  priority?: string;
  savingPlanId?: string;
  duration?: number;
}

interface SavingPlan {
  id: string;
  goal: string;
  intensity: string;
  suggestedSavings: number;
  streamingStatus: string;
  proposedGoal?: {
    name: string;
    target: number;
    priority: string;
    accepted: boolean;
    linkedGoalId?: string;
  };
  proposedBudgetLimits?: Array<{
    category: string;
    suggestedLimit: number;
    reasoning?: string;
  }>;
  createdAt: string;
}

const Goals: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [savingPlans, setSavingPlans] = useState<SavingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const { balance, loading: balanceLoading, refresh: refreshBalance } = useBalance();
  const [contributingGoal, setContributingGoal] = useState<Goal | null>(null);
  const [contributionAmount, setContributionAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'danger'>('success');
  const [acceptingPlanId, setAcceptingPlanId] = useState<string | null>(null);
  const [showCreateGoalForm, setShowCreateGoalForm] = useState(false);
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');
  const [newGoalPriority, setNewGoalPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newGoalDuration, setNewGoalDuration] = useState('');
  
  const toCurrency = (v: number = 0) => v.toLocaleString("vi-VN") + " đ";

  const invalidateOnMutation = useInvalidateOnMutation();

  // Clear form state when user navigates to this page
  useEffect(() => {
    if (location.pathname === "/goals") {
      setShowCreateGoalForm(false);
      setNewGoalName('');
      setNewGoalTarget('');
      setNewGoalPriority('medium');
      setNewGoalDuration('');
      setContributingGoal(null);
      setContributionAmount('');
    }
  }, [location.pathname]);

  const fetchGoals = useCallback(async () => {
    try {
      // Only show loading spinner on initial load, not on periodic refreshes
      if (isInitialLoad) {
        setLoading(true);
      }
      const data = await goalsApi.getAll();
      setGoals(data);
    } catch (error) {
      console.error("Error fetching goals:", error);
    } finally {
      if (isInitialLoad) {
        setLoading(false);
        setIsInitialLoad(false);
      }
    }
  }, [isInitialLoad]);

  // Use state invalidation hook
  useStateInvalidation({
    dataType: 'goals',
    fetchData: async () => {
      await fetchGoals();
    },
  });

  const handleCreateGoalManually = async (e: React.FormEvent) => {
    e.preventDefault();
    

    if (!newGoalName.trim() || !newGoalTarget || !newGoalDuration) {
      setToastMessage('Please fill in all fields');
      setToastColor('danger');
      setShowToast(true);
      return;
    }

    const target = parseFloat(newGoalTarget);
    const duration = parseInt(newGoalDuration, 10);
    if (isNaN(target) || target <= 0) {
      setToastMessage('Please enter a valid target amount');
      setToastColor('danger');
      setShowToast(true);
      return;
    }
    if (isNaN(duration) || duration <= 0) {
      setToastMessage('Please enter a valid duration (months)');
      setToastColor('danger');
      setShowToast(true);
      return;
    }

    try {
      setSubmitting(true);
      await goalsApi.create({
        name: newGoalName.trim(),
        targetAmount: target,
        priority: newGoalPriority,
        currentAmount: 0,
        duration
      });

      setToastMessage('Saving goal created successfully!');
      setToastColor('success');
      setShowToast(true);

      // Reset form
      setNewGoalName('');
      setNewGoalTarget('');
      setNewGoalPriority('medium');
      setNewGoalDuration('');
      setShowCreateGoalForm(false);

      // Refresh data
      invalidateOnMutation();
      await fetchGoals();
    } catch (error) {
      console.error('Error creating goal:', error);
      setToastMessage('Failed to create goal. Please try again.');
      setToastColor('danger');
      setShowToast(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleContribute = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contributingGoal || !contributionAmount || parseFloat(contributionAmount) <= 0) {
      setToastMessage('Please enter a valid amount');
      setToastColor('danger');
      setShowToast(true);
      return;
    }

    const amount = parseFloat(contributionAmount);
    
    if (amount > balance) {
      setToastMessage('Insufficient balance. Cannot contribute more than your current balance.');
      setToastColor('danger');
      setShowToast(true);
      return;
    }

    try {
      setSubmitting(true);
      
      // Contribute to goal
      await goalsApi.contribute(contributingGoal.id, amount);

  // Invalidate all state since we modified backend
      invalidateOnMutation();

  // Immediately refresh balance to reflect the change
  refreshBalance();

      setToastMessage(`Successfully contributed ${toCurrency(amount)} to ${contributingGoal.name}!`);
      setToastColor('success');
      setShowToast(true);
      
      // Reset form
      setContributingGoal(null);
      setContributionAmount('');
      
      // Refresh goals and balance
      fetchGoals();
    } catch (error) {
      console.error('Error contributing to goal:', error);
      setToastMessage('Failed to contribute. Please try again.');
      setToastColor('danger');
      setShowToast(true);
    } finally {
      setSubmitting(false);
    }
  };

  const startContribution = (goal: Goal) => {
    setContributingGoal(goal);
    setContributionAmount('');
  };

  const cancelContribution = () => {
    setContributingGoal(null);
    setContributionAmount('');
  };

  return (
    <IonPage>
      <IonContent className="bg-white">
        <div className="min-h-screen bg-white text-slate-900 flex flex-col">
          <Header title="Saving" onBack={() => history.push("/dashboard")} />
          <main className="mx-auto w-full max-w-md flex-1 px-4 pb-28 pt-4">
            {/* Balance Display */}
            {!balanceLoading && balance !== undefined && (
            <div className="rounded-2xl border border-slate-100 p-4 shadow-sm mb-4 bg-gradient-to-r from-blue-50 to-emerald-50">
              <div className="text-sm text-slate-600 mb-1">Current Balance</div>
              <div className={`text-2xl font-bold ${balance < 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                {toCurrency(balance)}
              </div>
              {balance < 0 && (
                <div className="text-xs text-rose-600 mt-1">
                  ⚠️ Negative balance - Consider recording income or reducing expenses
                </div>
              )}
            </div>
            )}

            <div className="text-slate-500 text-sm mb-4">Track your saving goals and dedicate funds from your balance.</div>
            
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <IonSpinner name="crescent" />
              </div>
            ) : goals.length > 0 ? (
              <div className="rounded-2xl border border-slate-100 p-4 shadow-sm mb-4 bg-gradient-to-r from-blue-50 to-emerald-50 cursor-pointer hover:border-blue-300 transition-colors" onClick={() => history.push('/goals/all')}>
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold text-base text-slate-900">Dedicate funds from your balance</div>
                </div>
                <div className="flex flex-col gap-3 max-h-[132px] overflow-y-auto pr-1">
                  {goals.map(goal => {
                    const progress = goal.targetAmount > 0 ? goal.currentAmount / goal.targetAmount : 0;
                    const monthlySuggestion = (goal.duration ?? 0) > 0 ? Math.ceil(goal.targetAmount / (goal.duration ?? 1)) : 0;
                    return (
                      <div
                        key={goal.id}
                        className="rounded-xl border border-slate-100 p-3 shadow-sm flex flex-row items-center min-h-[60px] bg-white"
                      >
                        <div className="h-8 w-8 rounded-lg bg-blue-50 grid place-items-center mr-3">
                          <Target className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-xs truncate mb-0.5">{goal.name}</div>
                          <div className="text-xs text-slate-500">{Math.round(progress * 100)}%</div>
                          <div className="text-xs text-emerald-600 mt-0.5">Gợi ý: {toCurrency(monthlySuggestion)} / tháng</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center text-slate-500 py-8 mb-4">
                No saving goals yet. Create one with AI!
              </div>
            )}


            {/* Contribution Modal */}
            {contributingGoal && (
              <div className="rounded-2xl border-2 border-emerald-500 p-4 shadow-lg mb-4">
                <h3 className="font-semibold mb-2">Contribute to {contributingGoal.name}</h3>
                <div className="text-sm text-slate-600 mb-4">
                  <div className="flex justify-between mb-1">
                    <span>Current balance:</span>
                    <span className={`font-medium ${balance < 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                      {toCurrency(balance)}
                    </span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span>Goal progress:</span>
                    <span className="font-medium">{toCurrency(contributingGoal.currentAmount)} / {toCurrency(contributingGoal.targetAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Remaining to target:</span>
                    <span className="font-medium text-emerald-600">
                      {toCurrency(Math.max(0, contributingGoal.targetAmount - contributingGoal.currentAmount))}
                    </span>
                  </div>
                </div>
                
                <form onSubmit={handleContribute} className="space-y-3">
                  <div>
                    <label htmlFor="contribution-amount" className="block text-sm font-medium text-slate-700 mb-1">
                      Contribution Amount (VND)
                    </label>
                    <input
                      id="contribution-amount"
                      type="tel"
                      value={contributionAmount}
                      onChange={(e) => setContributionAmount(e.target.value)}
                      placeholder="0"
                      pattern="[0-9]*"
                      min="0"
                      max={balance}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-emerald-500 focus:outline-none"
                      required
                    />
                    {contributionAmount && parseFloat(contributionAmount) > 0 && (
                      <div className="mt-2 text-sm text-slate-600">
                        <div className="flex justify-between">
                          <span>Balance after contribution:</span>
                          <span className={`font-medium ${balance - parseFloat(contributionAmount) < 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                            {toCurrency(balance - parseFloat(contributionAmount))}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={cancelContribution}
                      className="flex-1 py-2 px-4 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 py-2 px-4 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {submitting ? 'Contributing...' : 'Contribute'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Manual Goal Creation Form */}
            {showCreateGoalForm && (
              <div className="rounded-2xl border-2 border-blue-500 p-4 shadow-lg mb-4 bg-white">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-lg">Create New Saving Goal</h3>
                  <button
                    onClick={() => {
                      setShowCreateGoalForm(false);
                      setNewGoalName('');
                      setNewGoalTarget('');
                      setNewGoalPriority('medium');
                    }}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                </div>
                
                <form onSubmit={handleCreateGoalManually} className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Goal Name
                    </label>
                    <input
                      type="text"
                      value={newGoalName}
                      onChange={(e) => setNewGoalName(e.target.value)}
                      placeholder="e.g., Emergency Fund, New Car"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={submitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Target Amount (VND)
                    </label>
                    <input
                      type="tel"
                      value={newGoalTarget}
                      onChange={(e) => setNewGoalTarget(e.target.value)}
                      placeholder="e.g., 10000000"
                      pattern="[0-9]*"
                      min="1"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={submitting}
                    />
                  </div>


                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Duration (months)
                    </label>
                    <input
                      type="number"
                      value={newGoalDuration}
                      onChange={(e) => setNewGoalDuration(e.target.value)}
                      placeholder="e.g., 12"
                      min="1"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={submitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Priority
                    </label>
                    <select
                      value={newGoalPriority}
                      onChange={(e) => setNewGoalPriority(e.target.value as 'low' | 'medium' | 'high')}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={submitting}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Creating...' : 'Create Goal'}
                  </button>
                </form>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              {!showCreateGoalForm && (
                <button
                  onClick={() => setShowCreateGoalForm(true)}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 text-white py-3 font-medium shadow-md hover:bg-emerald-700"
                >
                  <Plus className="h-5 w-5" />
                  Create Goal Manually
                </button>
              )}

            </div>

            <IonToast
              isOpen={showToast}
              onDidDismiss={() => setShowToast(false)}
              message={toastMessage}
              duration={2000}
              color={toastColor}
              position="top"
            />
          </main>
          <TabBar active="goals" />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Goals;