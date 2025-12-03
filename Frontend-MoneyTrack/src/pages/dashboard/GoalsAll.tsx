import React, { useEffect, useState, useCallback } from "react";
import { IonPage, IonContent, IonSpinner, IonToast } from "@ionic/react";
import { useHistory } from "react-router-dom";
import { Target, ArrowDownCircle } from "lucide-react";
import Header from "../../components/dashboard/Header";
import TabBar from "../../components/dashboard/TabBar";
import { goalsApi } from "../../services/api";
import { useBalance } from "../../services/BalanceContext";
import { useLocalization } from "../../services/LocaleContext";

const toCurrency = (v = 0) => v.toLocaleString("vi-VN") + " đ";

const GoalsAll: React.FC = () => {
  const history = useHistory();
  const { l10n } = useLocalization();
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { balance, loading: balanceLoading, refresh: refreshBalance } = useBalance();
  const [contributingGoal, setContributingGoal] = useState<any | null>(null);
  const [contributionAmount, setContributionAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastColor, setToastColor] = useState<"success" | "danger">("success");

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    try {
      const data = await goalsApi.getAll();
      setGoals(data);
    } catch (error) {
      setToastMessage(l10n.getString('error-fetching-goals'));
      setToastColor("danger");
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  }, [l10n]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const handleContribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contributingGoal || !contributionAmount || parseFloat(contributionAmount) <= 0) {
      setToastMessage(l10n.getString('please-enter-valid-amount'));
      setToastColor("danger");
      setShowToast(true);
      return;
    }
    const amount = parseFloat(contributionAmount);
    if (amount > balance) {
      setToastMessage(l10n.getString('insufficient-balance'));
      setToastColor("danger");
      setShowToast(true);
      return;
    }
    try {
      setSubmitting(true);
      await goalsApi.contribute(contributingGoal.id, amount);
      refreshBalance();
      setToastMessage(l10n.getString('successfully-contributed', { amount: toCurrency(amount), goalName: contributingGoal.name }));
      setToastColor("success");
      setShowToast(true);
      setContributingGoal(null);
      setContributionAmount("");
      fetchGoals();
    } catch (error) {
      setToastMessage(l10n.getString('failed-contribute'));
      setToastColor("danger");
      setShowToast(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <IonPage>
      <IonContent className="bg-white">
        <div className="min-h-screen bg-white text-slate-900 flex flex-col">
          <Header title={l10n.getString('all-saving-goals-title')} onBack={() => history.goBack()} />
          <main className="mx-auto w-full max-w-md flex-1 px-4 pb-28 pt-4">
            {!balanceLoading && balance !== undefined && (
              <div className="rounded-2xl border border-slate-100 p-4 shadow-sm mb-4 bg-gradient-to-r from-blue-50 to-emerald-50">
                <div className="text-sm text-slate-600 mb-1">{l10n.getString('current-balance')}</div>
                <div className={`text-2xl font-bold ${balance < 0 ? 'text-rose-600' : 'text-slate-900'}`}>{toCurrency(balance)}</div>
              </div>
            )}
            <div className="text-slate-500 text-sm mb-4">{l10n.getString('view-dedicate-funds')}</div>
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <IonSpinner name="crescent" />
              </div>
            ) : goals.length > 0 ? (
              <div className="space-y-3 mb-4">
                {goals.map(goal => {
                  const progress = goal.targetAmount > 0 ? goal.currentAmount / goal.targetAmount : 0;
                  return (
                    <div key={goal.id} className="rounded-2xl border border-slate-100 p-4 shadow-sm">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="h-10 w-10 rounded-xl bg-blue-50 grid place-items-center">
                            <Target className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium">{goal.name}</div>
                            <div className="text-xs text-slate-500 capitalize">{goal.priority} {l10n.getString('priority').toLowerCase()}</div>
                          </div>
                        </div>
                        <span className="text-sm text-slate-500">{l10n.getString('target')} {toCurrency(goal.targetAmount)}</span>
                      </div>
                      <div className="mt-3 h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                        <div className="h-full bg-emerald-500 transition-all" style={{ width: `${Math.min(100, progress * 100)}%` }} />
                      </div>
                      <div className="mt-2 flex justify-between text-xs">
                        <span className="text-slate-500">{toCurrency(goal.currentAmount)} {l10n.getString('saved')}</span>
                        <span className="text-slate-600 font-medium">{Math.round(progress * 100)}% {l10n.getString('completed')}</span>
                      </div>
                      {progress < 1 && (
                        <button
                          onClick={() => setContributingGoal(goal)}
                          disabled={balance <= 0}
                          className="mt-3 w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-600 text-white py-2 text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ArrowDownCircle className="h-4 w-4" />
                          {l10n.getString('dedicate-towards-goal')}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-slate-500 py-8 mb-4">{l10n.getString('no-goals-yet')}</div>
            )}
            {contributingGoal && (
              <div className="rounded-2xl border-2 border-emerald-500 p-4 shadow-lg mb-4">
                <h3 className="font-semibold mb-2">{l10n.getString('contribute-to', { goalName: contributingGoal.name })}</h3>
                <div className="text-sm text-slate-600 mb-4">
                  <div className="flex justify-between mb-1">
                    <span>{l10n.getString('current-balance-label')}</span>
                    <span className={`font-medium ${balance < 0 ? 'text-rose-600' : 'text-slate-900'}`}>{toCurrency(balance)}</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span>{l10n.getString('goal-progress')}:</span>
                    <span className="font-medium">{toCurrency(contributingGoal.currentAmount)} / {toCurrency(contributingGoal.targetAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{l10n.getString('remaining-to-target')}:</span>
                    <span className="font-medium text-emerald-600">{toCurrency(Math.max(0, contributingGoal.targetAmount - contributingGoal.currentAmount))}</span>
                  </div>
                </div>
                <form onSubmit={handleContribute} className="space-y-3">
                  <div>
                    <label htmlFor="contribution-amount" className="block text-sm font-medium text-slate-700 mb-1">{l10n.getString('contribution-amount')}</label>
                    <input
                      id="contribution-amount"
                      type="tel"
                      value={contributionAmount}
                      onChange={e => setContributionAmount(e.target.value)}
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
                          <span>{l10n.getString('balance-after-contribution')}:</span>
                          <span className={`font-medium ${balance - parseFloat(contributionAmount) < 0 ? 'text-rose-600' : 'text-slate-900'}`}>{toCurrency(balance - parseFloat(contributionAmount))}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button type="button" onClick={() => setContributingGoal(null)} className="flex-1 py-2 px-4 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50">{l10n.getString('cancel')}</button>
                    <button type="submit" disabled={submitting} className="flex-1 py-2 px-4 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50">{submitting ? l10n.getString('contributing') : l10n.getString('contribute')}</button>
                  </div>
                </form>
              </div>
            )}
            <IonToast isOpen={showToast} onDidDismiss={() => setShowToast(false)} message={toastMessage} duration={2000} color={toastColor} position="top" />
          </main>
          <TabBar active="goals" />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default GoalsAll;
