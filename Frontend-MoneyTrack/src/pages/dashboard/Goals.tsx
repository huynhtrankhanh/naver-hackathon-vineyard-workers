import React, { useState, useCallback } from "react";
import { IonPage, IonContent, IonSpinner, IonToast } from "@ionic/react";
import { useHistory } from "react-router-dom";
import { Target, Plus, ArrowDownCircle, Sparkles, CheckCircle, FileText } from "lucide-react";
import Header from "../../components/dashboard/Header";
import TabBar from "../../components/dashboard/TabBar";
import { goalsApi, aiApi } from "../../services/api";
import { useStateInvalidation, useInvalidateOnMutation } from "../../services/useStateInvalidation";
import { useBalance } from "../../services/BalanceContext";

interface Goal {
  _id: string;
  name: string;
  target: number;
  current: number;
  priority: string;
  savingPlanId?: string;
}

interface SavingPlan {
  _id: string;
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
  
  const toCurrency = (v: number) => v.toLocaleString("vi-VN") + " đ";

  const invalidateOnMutation = useInvalidateOnMutation();

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

  const fetchSavingPlans = useCallback(async () => {
    try {
      const data = await aiApi.getAllPlans();
      setSavingPlans(data);
    } catch (error) {
      console.error("Error fetching saving plans:", error);
    }
  }, []);

  // Use state invalidation hook
  useStateInvalidation({
    dataType: 'goals',
    fetchData: async () => {
      await fetchGoals();
      await fetchSavingPlans();
    },
  });

  const acceptProposedGoal = async (planId: string) => {
    try {
      setAcceptingPlanId(planId);
      await aiApi.acceptGoal(planId);
      
      setToastMessage('Saving goal accepted and created successfully!');
      setToastColor('success');
      setShowToast(true);
      
      // Refresh data
      invalidateOnMutation();
      await fetchGoals();
      await fetchSavingPlans();
    } catch (error) {
      console.error('Error accepting goal:', error);
      setToastMessage('Failed to accept goal. Please try again.');
      setToastColor('danger');
      setShowToast(true);
    } finally {
      setAcceptingPlanId(null);
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
      await goalsApi.contribute(contributingGoal._id, amount);

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
            {!balanceLoading && (
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
              <div className="space-y-3 mb-4">
                {goals.map(goal => {
                  const progress = goal.target > 0 ? goal.current / goal.target : 0;
                  return (
                    <div key={goal._id} className="rounded-2xl border border-slate-100 p-4 shadow-sm">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="h-10 w-10 rounded-xl bg-blue-50 grid place-items-center">
                            <Target className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium">{goal.name}</div>
                            <div className="text-xs text-slate-500 capitalize">{goal.priority} priority</div>
                          </div>
                        </div>
                        <span className="text-sm text-slate-500">Target {toCurrency(goal.target)}</span>
                      </div>
                      <div className="mt-3 h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 transition-all" 
                          style={{ width: `${Math.min(100, progress * 100)}%` }} 
                        />
                      </div>
                      <div className="mt-2 flex justify-between text-xs">
                        <span className="text-slate-500">{toCurrency(goal.current)} saved</span>
                        <span className="text-slate-600 font-medium">{Math.round(progress * 100)}% completed</span>
                      </div>
                      
                      {/* Contribute Button */}
                      {progress < 1 && (
                        <button
                          onClick={() => startContribution(goal)}
                          disabled={balance <= 0}
                          className="mt-3 w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-600 text-white py-2 text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ArrowDownCircle className="h-4 w-4" />
                          Dedicate towards goal
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-slate-500 py-8 mb-4">
                No saving goals yet. Create one with AI!
              </div>
            )}

            {/* Saving Plans Section */}
            {savingPlans.length > 0 && (
              <div className="mt-6">
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-blue-600" />
                  AI Saving Plans
                </h2>
                <div className="space-y-3 mb-4">
                  {savingPlans.map(plan => (
                    <div key={plan._id} className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 shadow-sm">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-medium text-slate-900">{plan.goal}</div>
                          <div className="text-xs text-slate-500 capitalize">{plan.intensity}</div>
                        </div>
                        <div className="text-sm text-blue-600 font-medium">
                          {toCurrency(plan.suggestedSavings)}/mo
                        </div>
                      </div>
                      
                      {/* Proposed Goal */}
                      {plan.proposedGoal && !plan.proposedGoal.accepted && (
                        <div className="mt-3 p-3 bg-white rounded-xl border border-emerald-200">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="text-sm font-medium text-emerald-700">Proposed Saving Goal</div>
                              <div className="text-sm font-semibold text-slate-900">{plan.proposedGoal.name}</div>
                              <div className="text-xs text-slate-600">
                                Target: {toCurrency(plan.proposedGoal.target)} • {plan.proposedGoal.priority} priority
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => acceptProposedGoal(plan._id)}
                            disabled={acceptingPlanId === plan._id}
                            className="mt-2 w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-600 text-white py-2 text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
                          >
                            {acceptingPlanId === plan._id ? (
                              <>
                                <IonSpinner name="crescent" className="h-4 w-4" />
                                Accepting...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4" />
                                Accept Goal
                              </>
                            )}
                          </button>
                        </div>
                      )}
                      
                      {plan.proposedGoal && plan.proposedGoal.accepted && (
                        <div className="mt-3 p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                          <div className="flex items-center gap-2 text-sm text-emerald-700">
                            <CheckCircle className="h-4 w-4" />
                            <span className="font-medium">Goal accepted and created</span>
                          </div>
                        </div>
                      )}
                      
                      {/* Proposed Budget Limits */}
                      {plan.proposedBudgetLimits && plan.proposedBudgetLimits.length > 0 && (
                        <div className="mt-3">
                          <button
                            onClick={() => history.push('/dashboard/budget')}
                            className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 text-white py-2 text-sm font-medium hover:bg-blue-700"
                          >
                            <FileText className="h-4 w-4" />
                            View Proposed Budget Limits ({plan.proposedBudgetLimits.length})
                          </button>
                        </div>
                      )}
                      
                      <div className="mt-2 text-xs text-slate-500">
                        Created {new Date(plan.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
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
                    <span className="font-medium">{toCurrency(contributingGoal.current)} / {toCurrency(contributingGoal.target)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Remaining to target:</span>
                    <span className="font-medium text-emerald-600">
                      {toCurrency(Math.max(0, contributingGoal.target - contributingGoal.current))}
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
                      type="number"
                      value={contributionAmount}
                      onChange={(e) => setContributionAmount(e.target.value)}
                      placeholder="0"
                      min="0"
                      max={balance}
                      step="10000"
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

            <button
              onClick={() => history.push("/savings-onboarding")}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-blue-600 text-white py-3 font-medium shadow-md hover:bg-blue-700"
            >
              <Plus className="h-5 w-5" />
              Create Saving Plan with AI
            </button>

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
