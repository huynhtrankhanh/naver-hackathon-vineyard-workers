import React, { useState, useEffect } from "react";
import { IonPage, IonContent, IonSpinner, IonButton } from "@ionic/react";
import { useHistory } from "react-router-dom";
import { Target, Plus } from "lucide-react";
import Header from "../../components/dashboard/Header";
import TabBar from "../../components/dashboard/TabBar";
import { goalsApi } from "../../services/api";

interface Goal {
  _id: string;
  name: string;
  target: number;
  current: number;
  priority: string;
}

const Goals: React.FC = () => {
  const history = useHistory();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const toCurrency = (v: number) => v.toLocaleString("vi-VN") + " đ";

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const data = await goalsApi.getAll();
      setGoals(data);
    } catch (error) {
      console.error("Error fetching goals:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent className="bg-white">
        <div className="min-h-screen bg-white text-slate-900 flex flex-col">
          <Header title="Saving Goals" onBack={() => history.push("/dashboard")} />
          <main className="mx-auto w-full max-w-md flex-1 px-4 pb-28 pt-4">
            <div className="text-slate-500 text-sm mb-4">Track your savings goals and create AI-powered plans.</div>
            
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
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-slate-500 py-8 mb-4">
                No savings goals yet. Create one with AI!
              </div>
            )}

            <button
              onClick={() => history.push("/savings-onboarding")}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-blue-600 text-white py-3 font-medium shadow-md hover:bg-blue-700"
            >
              <Plus className="h-5 w-5" />
              Create Savings Plan with AI
            </button>
          </main>
          <TabBar active="goals" />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Goals;
