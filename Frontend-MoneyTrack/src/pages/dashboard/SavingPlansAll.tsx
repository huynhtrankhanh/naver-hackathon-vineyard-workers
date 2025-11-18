import React, { useEffect, useState, useCallback } from "react";
import { IonPage, IonContent, IonSpinner, IonToast } from "@ionic/react";
import { useHistory } from "react-router-dom";
import { Sparkles, CheckCircle, FileText } from "lucide-react";
import Header from "../../components/dashboard/Header";
import { aiApi } from "../../services/api";

const toCurrency = (v = 0) => v.toLocaleString("vi-VN") + " đ";

const SavingPlansAll: React.FC = () => {
  const history = useHistory();
  const [savingPlans, setSavingPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastColor, setToastColor] = useState<"success" | "danger">("success");

  const fetchSavingPlans = useCallback(async () => {
    setLoading(true);
    try {
      const data = await aiApi.getAllPlans();
      setSavingPlans(data);
    } catch (error) {
      setToastMessage("Error fetching saving plans");
      setToastColor("danger");
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSavingPlans();
  }, [fetchSavingPlans]);

  return (
    <IonPage>
      <IonContent className="bg-white">
        <div className="min-h-screen bg-white text-slate-900 flex flex-col">
          <Header title="All AI Saving Plans" onBack={() => history.goBack()} />
          <main className="mx-auto w-full max-w-md flex-1 px-4 pb-28 pt-4">
            <div className="text-slate-500 text-sm mb-4">View all AI-generated saving plans and their details.</div>
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <IonSpinner name="crescent" />
              </div>
            ) : savingPlans.length > 0 ? (
              <div className="space-y-3 mb-4">
                {savingPlans.map(plan => (
                  <div
                    key={plan._id}
                    className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 shadow-sm cursor-pointer hover:border-blue-300 transition-colors"
                    onClick={() => history.push(`/saving-plan/${plan._id}`)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-medium text-slate-900">{plan.goal}</div>
                        <div className="text-xs text-slate-500 capitalize">{plan.intensity}</div>
                      </div>
                      <div className="text-sm text-blue-600 font-medium">{toCurrency(plan.suggestedSavings)}/mo</div>
                    </div>
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
                          className="mt-2 w-full py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors"
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              await aiApi.acceptGoal(plan._id);
                              setToastMessage('Goal accepted and created!');
                              setToastColor('success');
                              setShowToast(true);
                              fetchSavingPlans();
                            } catch (err) {
                              setToastMessage('Failed to accept goal.');
                              setToastColor('danger');
                              setShowToast(true);
                            }
                          }}
                        >
                          Accept Goal
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
                    {plan.proposedBudgetLimits && plan.proposedBudgetLimits.length > 0 && (
                      <div className="mt-3">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            history.push('/dashboard/budget');
                          }}
                          className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 text-white py-2 text-sm font-medium hover:bg-blue-700"
                        >
                          <FileText className="h-4 w-4" />
                          View Proposed Budget Limits ({plan.proposedBudgetLimits.length})
                        </button>
                      </div>
                    )}
                    <div className="mt-3 flex items-center justify-between">
                      <div className="text-xs text-slate-500">Created {new Date(plan.createdAt).toLocaleDateString()}</div>
                      <div className="text-xs text-blue-600 font-medium">Click to view details →</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-slate-500 py-8 mb-4">No AI saving plans yet.</div>
            )}
            <IonToast isOpen={showToast} onDidDismiss={() => setShowToast(false)} message={toastMessage} duration={2000} color={toastColor} position="top" />
          </main>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default SavingPlansAll;
