import React, { useState, useEffect } from 'react';
import { IonPage, IonContent, IonSpinner, IonToast } from '@ionic/react';
import { useHistory, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Sparkles, ArrowLeft, Target, FileText, CheckCircle } from 'lucide-react';
import Header from '../../components/dashboard/Header';
import { aiApi } from '../../services/api';

interface SavingPlan {
  _id: string;
  goal: string;
  savingsGoal?: number;
  intensity: string;
  notes?: string;
  suggestedSavings: number;
  recommendations: Array<{
    type: 'reduce' | 'protect';
    category: string;
    percentage?: number;
  }>;
  markdownAdvice?: string;
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
    currentLimit?: number;
    reasoning?: string;
  }>;
  streamingStatus: string;
  generationProgress?: string;
  createdAt: string;
}

const SavingPlanDetail: React.FC = () => {
  const history = useHistory();
  const { id } = useParams<{ id: string }>();
  const [plan, setPlan] = useState<SavingPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'danger'>('success');

  const toCurrency = (v: number = 0) => v.toLocaleString("vi-VN") + " đ";

  useEffect(() => {
    const fetchPlanDetail = async () => {
      try {
        setLoading(true);
        const data = await aiApi.getPlanById(id);
        setPlan(data);
      } catch (error) {
        console.error('Error fetching saving plan:', error);
        setToastMessage('Failed to load saving plan details');
        setToastColor('danger');
        setShowToast(true);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPlanDetail();
    }
  }, [id]);

  if (loading) {
    return (
      <IonPage>
        <IonContent className="bg-white">
          <div className="min-h-screen bg-white">
            <Header title="Saving Plan" onBack={() => history.push('/goals')} />
            <div className="flex justify-center items-center py-12">
              <IonSpinner name="crescent" />
            </div>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (!plan) {
    return (
      <IonPage>
        <IonContent className="bg-white">
          <div className="min-h-screen bg-white">
            <Header title="Saving Plan" onBack={() => history.push('/goals')} />
            <div className="text-center py-12 px-4">
              <p className="text-slate-600">Saving plan not found</p>
              <button
                onClick={() => history.push('/goals')}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Back to Saving
              </button>
            </div>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonContent className="bg-white">
        <div className="min-h-screen bg-white text-slate-900">
          <Header title="Saving Plan Details" onBack={() => history.push('/goals')} />
          <main className="mx-auto w-full max-w-md px-4 pb-8 pt-4">
            {/* Plan Header */}
            <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-emerald-50 p-6 shadow-sm mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-xl bg-blue-600 grid place-items-center">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">{plan.goal}</h1>
                  <p className="text-sm text-slate-600 capitalize">{plan.intensity}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-white rounded-lg p-3">
                  <div className="text-xs text-slate-600 mb-1">Suggested Monthly Savings</div>
                  <div className="text-lg font-bold text-blue-600">{toCurrency(plan.suggestedSavings)}</div>
                </div>
                {plan.savingsGoal && (
                  <div className="bg-white rounded-lg p-3">
                    <div className="text-xs text-slate-600 mb-1">Target Savings</div>
                    <div className="text-lg font-bold text-emerald-600">{toCurrency(plan.savingsGoal)}</div>
                  </div>
                )}
              </div>

              <div className="mt-3 text-xs text-slate-500">
                Created on {new Date(plan.createdAt).toLocaleDateString('vi-VN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>

            {/* User Notes */}
            {plan.notes && (
              <div className="rounded-2xl border border-slate-100 p-4 shadow-sm mb-4">
                <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-slate-600" />
                  Your Notes
                </h3>
                <p className="text-slate-700 text-sm">{plan.notes}</p>
              </div>
            )}

            {/* Proposed Goal */}
            {plan.proposedGoal && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm mb-4">
                <h3 className="font-semibold text-emerald-800 mb-3 flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Proposed Saving Goal
                </h3>
                <div className="bg-white rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-semibold text-slate-900">{plan.proposedGoal.name}</div>
                      <div className="text-sm text-slate-600">
                        Target: {toCurrency(plan.proposedGoal.target)}
                      </div>
                      <div className="text-xs text-slate-500 capitalize">
                        Priority: {plan.proposedGoal.priority}
                      </div>
                    </div>
                    {plan.proposedGoal.accepted && (
                      <div className="flex items-center gap-1 text-emerald-600 text-sm">
                        <CheckCircle className="h-4 w-4" />
                        <span>Accepted</span>
                      </div>
                    )}
                  </div>
                  {!plan.proposedGoal.accepted && (
                    <div className="mt-2 text-xs text-slate-500">
                      This goal has not been accepted yet. You can accept it from the Saving page.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Proposed Budget Limits */}
            {plan.proposedBudgetLimits && plan.proposedBudgetLimits.length > 0 && (
              <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 shadow-sm mb-4">
                <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Proposed Budget Limits
                </h3>
                <div className="space-y-2">
                  {plan.proposedBudgetLimits.map((limit, index) => (
                    <div key={index} className="bg-white rounded-lg p-3">
                      <div className="flex justify-between items-start mb-1">
                        <div className="font-medium text-slate-900">{limit.category}</div>
                        <div className="text-sm font-semibold text-blue-600">
                          {toCurrency(limit.suggestedLimit)}
                        </div>
                      </div>
                      {limit.currentLimit && (
                        <div className="text-xs text-slate-500">
                          Current: {toCurrency(limit.currentLimit)}
                        </div>
                      )}
                      {limit.reasoning && (
                        <div className="text-xs text-slate-600 mt-2">
                          {limit.reasoning}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-3">
                  <button
                    onClick={() => history.push({
                      pathname: '/dashboard/budget',
                      state: { fromSavingPlan: true, savingPlanId: plan._id }
                    })}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 text-white py-2 text-sm font-medium hover:bg-blue-700"
                  >
                    Modify Budget Limits
                  </button>
                </div>
              </div>
            )}

            {/* Recommendations */}
            {plan.recommendations && plan.recommendations.length > 0 && (
              <div className="rounded-2xl border border-slate-100 p-4 shadow-sm mb-4">
                <h3 className="font-semibold text-slate-900 mb-3">Recommendations</h3>
                <div className="space-y-2">
                  {plan.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <div className={`h-5 w-5 rounded grid place-items-center text-xs font-bold ${
                        rec.type === 'reduce' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {rec.type === 'reduce' ? '↓' : '✓'}
                      </div>
                      <div className="flex-1">
                        <span className="font-medium">{rec.category}</span>
                        {rec.percentage && (
                          <span className="text-slate-600"> - {rec.percentage}%</span>
                        )}
                        <div className="text-xs text-slate-500 capitalize">
                          {rec.type === 'reduce' ? 'Reduce spending' : 'Protect budget'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Analysis & Advice */}
            {plan.markdownAdvice && (
              <div className="rounded-2xl border border-slate-100 p-4 shadow-sm mb-4">
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-blue-600" />
                  AI Financial Analysis
                </h3>
                <div className="prose prose-sm prose-slate max-w-none">
                  <ReactMarkdown>{plan.markdownAdvice}</ReactMarkdown>
                </div>
              </div>
            )}

            {/* Back Button */}
            <div className="mt-6">
              <button
                onClick={() => history.push('/goals')}
                className="w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 bg-white text-slate-700 py-3 font-medium shadow-sm hover:bg-slate-50"
              >
                <ArrowLeft className="h-5 w-5" />
                Back to Saving
              </button>
            </div>
          </main>
        </div>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={2000}
          color={toastColor}
          position="top"
        />
      </IonContent>
    </IonPage>
  );
};

export default SavingPlanDetail;
