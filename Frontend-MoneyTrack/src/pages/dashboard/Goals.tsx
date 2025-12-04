import React, { useState, useCallback, useEffect } from "react";
import { IonPage, IonContent, IonSpinner, IonToast } from "@ionic/react";
import { useHistory, useLocation } from "react-router-dom";
import { Target, Plus } from "lucide-react";
import Header from "../../components/dashboard/Header";
import TabBar from "../../components/dashboard/TabBar";
import { goalsApi } from "../../services/api";
import { useStateInvalidation, useInvalidateOnMutation } from "../../services/useStateInvalidation";
import { useBalance } from "../../services/BalanceContext";
import { useLocalization } from "../../services/LocaleContext";

interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  priority?: string;
  duration?: number;
}

const Goals: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const { l10n } = useLocalization();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const { balance, loading: balanceLoading } = useBalance();
  const [submitting, setSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'danger'>('success');
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
      setToastMessage(l10n.getString('please-fill-all-fields'));
      setToastColor('danger');
      setShowToast(true);
      return;
    }

    const target = parseFloat(newGoalTarget);
    const duration = parseInt(newGoalDuration, 10);
    if (isNaN(target) || target <= 0) {
      setToastMessage(l10n.getString('please-enter-valid-target'));
      setToastColor('danger');
      setShowToast(true);
      return;
    }
    if (isNaN(duration) || duration <= 0) {
      setToastMessage(l10n.getString('please-enter-valid-duration'));
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

      setToastMessage(l10n.getString('goal-created'));
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
      setToastMessage(l10n.getString('failed-create-goal'));
      setToastColor('danger');
      setShowToast(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <IonPage>
      <IonContent className="bg-white">
        <div className="min-h-screen bg-white text-slate-900 flex flex-col">
          <Header title={l10n.getString('nav-saving')} onBack={() => history.push("/dashboard")} />
          <main className="mx-auto w-full max-w-md flex-1 px-4 pb-28 pt-4">
            {/* Balance Display */}
            {!balanceLoading && balance !== undefined && (
            <div className="rounded-2xl border border-slate-100 p-4 shadow-sm mb-4 bg-gradient-to-r from-blue-50 to-emerald-50">
              <div className="text-sm text-slate-600 mb-1">{l10n.getString('current-balance')}</div>
              <div className={`text-2xl font-bold ${balance < 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                {toCurrency(balance)}
              </div>
              {balance < 0 && (
                <div className="text-xs text-rose-600 mt-1">
                  ⚠️ {l10n.getString('negative-balance-warning')}
                </div>
              )}
            </div>
            )}

            <div className="text-slate-500 text-sm mb-4">{l10n.getString('track-saving-goals')}</div>
            
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <IonSpinner name="crescent" />
              </div>
            ) : goals.length > 0 ? (
              <div className="rounded-2xl border border-slate-100 p-4 shadow-sm mb-4 bg-gradient-to-r from-blue-50 to-emerald-50 cursor-pointer hover:border-blue-300 transition-colors" onClick={() => history.push('/goals/all')}>
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold text-base text-slate-900">{l10n.getString('dedicate-funds')}</div>
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
                          <div className="text-xs text-emerald-600 mt-0.5">{l10n.getString('suggestion-per-month', { amount: toCurrency(monthlySuggestion) })}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center text-slate-500 py-8 mb-4">
                {l10n.getString('no-saving-goals')}
              </div>
            )}

            {/* Manual Goal Creation Form */}
            {showCreateGoalForm && (
              <div className="rounded-2xl border-2 border-blue-500 p-4 shadow-lg mb-4 bg-white">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-lg">{l10n.getString('create-new-saving-goal')}</h3>
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
                      {l10n.getString('goal-name')}
                    </label>
                    <input
                      type="text"
                      value={newGoalName}
                      onChange={(e) => setNewGoalName(e.target.value)}
                      placeholder={l10n.getString('title-placeholder')}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={submitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      {l10n.getString('target-amount')} (VND)
                    </label>
                    <input
                      type="tel"
                      value={newGoalTarget}
                      onChange={(e) => setNewGoalTarget(e.target.value)}
                      placeholder="10000000"
                      pattern="[0-9]*"
                      min="1"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={submitting}
                    />
                  </div>


                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      {l10n.getString('duration-months')}
                    </label>
                    <input
                      type="number"
                      value={newGoalDuration}
                      onChange={(e) => setNewGoalDuration(e.target.value)}
                      placeholder="12"
                      min="1"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={submitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      {l10n.getString('priority')}
                    </label>
                    <select
                      value={newGoalPriority}
                      onChange={(e) => setNewGoalPriority(e.target.value as 'low' | 'medium' | 'high')}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={submitting}
                    >
                      <option value="low">{l10n.getString('priority-low')}</option>
                      <option value="medium">{l10n.getString('priority-medium')}</option>
                      <option value="high">{l10n.getString('priority-high')}</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    {submitting ? l10n.getString('contributing') : l10n.getString('create')}
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
                  {l10n.getString('create-goal-manually')}
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