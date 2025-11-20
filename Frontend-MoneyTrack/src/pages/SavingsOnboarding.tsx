import React, { useState, useEffect } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { useHistory, useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Sparkles, BrainCircuit, Receipt, Bot, ArrowLeft, ArrowRight, CheckCircle2, Sprout, Scale, Flame, Info, FileText } from 'lucide-react';
import { aiApi } from '../services/api';

interface WizardData {
  goal: string;
  savingsGoal: string;
  months: string;
  intensity: string;
  notes: string;
}

interface AIResponse {
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
}

const defaultCategories = [
  'Food & Drinks',
  'Transport',
  'Shopping',
  'Bills',
  'Entertainment',
  'Healthcare',
  'Education',
  'Other',
  'Salary',
  'Freelance',
  'Investment',
  'Gift',
  'Bonus',
];

function getAllCategories() {
  try {
    const custom = JSON.parse(localStorage.getItem('customCategories') || '[]');
    return Array.from(new Set([...defaultCategories, ...custom]));
  } catch {
    return defaultCategories;
  }
}

const SavingsOnboarding: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const [currentScreen, setCurrentScreen] = useState<'wizard' | 'loading' | 'result' | 'advice'>('wizard');
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardData, setWizardData] = useState<WizardData>({
    goal: '',
    savingsGoal: '',
    months: '',
    intensity: 'Ideal target',
    notes: ''
  });
  const [allCategories] = useState<string[]>(getAllCategories());
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [aiResult, setAiResult] = useState<AIResponse | null>(null);
  const [loadingText, setLoadingText] = useState('Analyzing your inputs...');

  const totalSteps = 4;

  // Reset wizard state when user navigates to this page
  useEffect(() => {
    if (location.pathname === "/savings-onboarding") {
      setCurrentScreen('wizard');
      setCurrentStep(1);
      setWizardData({
        goal: '',
        savingsGoal: '',
        months: '',
        intensity: 'Ideal target',
        notes: ''
      });
      setSelectedCategories([]);
      setAiResult(null);
      setLoadingText('Analyzing your inputs...');
    }
  }, [location.pathname]);

  const showScreen = (screen: 'wizard' | 'loading' | 'result' | 'advice') => {
    setCurrentScreen(screen);
  };

  // No longer needed: startWizard

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      finishWizard();
    }
  };

  const finishWizard = async () => {
    showScreen('loading');
    setLoadingText('Starting AI generation...');

    try {
      // Call the backend AI API - it returns planId immediately

      // Tính toán savingsGoalPerMonth nếu có đủ dữ liệu
      let savingsGoalPerMonth: number | undefined = undefined;
      if (wizardData.savingsGoal && wizardData.months && !isNaN(Number(wizardData.savingsGoal)) && !isNaN(Number(wizardData.months)) && Number(wizardData.months) > 0) {
        savingsGoalPerMonth = Math.ceil(Number(wizardData.savingsGoal) / Number(wizardData.months));
      }
      const response = await aiApi.generateSavingsPlan({
        goal: wizardData.goal,
        savingsGoal: savingsGoalPerMonth,
        intensity: wizardData.intensity,
        notes: `Total goal: ${wizardData.savingsGoal} VND in ${wizardData.months} months. ` + wizardData.notes + (selectedCategories.length ? `\nCategories to save: ${selectedCategories.join(', ')}` : '')
      });

      // Check if we got a planId (streaming) or complete result (mock)
      if (response.planId) {
        // Use streaming to get real-time updates
        const planId = response.planId;
        setLoadingText('AI is analyzing your financial data...');

        // Poll for the plan status since Server-Sent Events can have auth issues
        const pollPlan = async () => {
          try {
            const plan = await aiApi.getPlanById(planId);
            
            if (plan.streamingStatus === 'completed') {
              // Transform to expected format
              setAiResult({
                goal: plan.goal,
                savingsGoal: plan.savingsGoal,
                intensity: plan.intensity,
                notes: plan.notes,
                suggestedSavings: plan.suggestedSavings,
                recommendations: plan.recommendations || [],
                markdownAdvice: plan.markdownAdvice
              });
              showScreen('result');
            } else if (plan.streamingStatus === 'failed') {
              throw new Error(plan.generationProgress || 'AI generation failed');
            } else {
              // Still generating, update loading text and poll again
              if (plan.generationProgress) {
                setLoadingText(plan.generationProgress);
              }
              setTimeout(pollPlan, 2000); // Poll every 2 seconds
            }
          } catch (error) {
            console.error('Error polling plan:', error);
            throw error;
          }
        };

        // Start polling
        await pollPlan();
      } else {
        // Mock response - complete result already available
        setAiResult(response);
        showScreen('result');
      }
    } catch (error) {
      console.error('Error generating plan:', error);
      setLoadingText('Failed to generate plan');
      setTimeout(() => {
        alert('Failed to generate plan. Please try again.');
        showScreen('wizard');
      }, 1000);
    }
  };

  const acceptPlan = () => {
    // Navigate to goals page or dashboard
    history.push('/goals');
  };

  return (
    <IonPage>
      <IonContent className="bg-gray-100">
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-0 md:p-6">
          <div className="w-full max-w-[400px] bg-white md:rounded-[3rem] shadow-2xl overflow-hidden relative flex flex-col min-h-screen md:h-[850px]">
            
            {/* Status Bar Area */}
            <div className="h-12 shrink-0 bg-transparent z-10"></div>



            {/* Wizard Screen */}
            {currentScreen === 'wizard' && (
              <div className="flex-1 flex flex-col bg-gray-50 h-full">
                {/* Fixed Top Nav */}
                <div className="px-6 py-4 flex items-center bg-white shrink-0">
                  <button
                    onClick={() => history.push('/dashboard')}
                    className="p-2 -ml-2 text-gray-400 hover:text-gray-900 transition-colors"
                  >
                    <ArrowLeft className="w-6 h-6" />
                  </button>
                  <div className="flex-1 mx-6 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all duration-400"
                      style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                    ></div>
                  </div>
                  <div className="text-sm font-medium text-gray-400 w-8 text-right">
                    {currentStep}/3
                  </div>
                </div>

                {/* Scrollable Content Area */}
                <div className="flex-1 p-6 overflow-y-auto overscroll-contain">
                  {/* Step 1: Priority (user input) */}
                  {currentStep === 1 && (
                    <div>
                      <span className="text-indigo-600 font-semibold tracking-wider uppercase text-xs mb-2 block">
                        Step 1 of 4
                      </span>
                      <h2 className="text-2xl font-bold text-gray-900 mb-3">What's your top priority?</h2>
                      <p className="text-gray-500 mb-6">Describe your main savings goal. For example: "Build a safety net", "Buy a house", "Travel to Japan", ...</p>
                      <input
                        type="text"
                        value={wizardData.goal}
                        onChange={e => setWizardData({ ...wizardData, goal: e.target.value })}
                        placeholder="e.g. Build a safety net, Buy a house, ..."
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:outline-none text-lg"
                        required
                        maxLength={100}
                      />
                    </div>
                  )}

                  {/* Step 2: Savings Goal & Months Input */}
                  {currentStep === 2 && (
                    <div>
                      <span className="text-indigo-600 font-semibold tracking-wider uppercase text-xs mb-2 block">
                        Step 2 of 4
                      </span>
                      <h2 className="text-2xl font-bold text-gray-900 mb-3">What is your total saving goal and in how many months?</h2>
                      <p className="text-gray-500 mb-6">Enter the total amount you want to save and the number of months you want to achieve it. The AI will calculate a monthly target for you.</p>
                      <div className="mb-5">
                        <label className="block text-sm font-medium text-slate-700 mb-2" htmlFor="savingsGoalInput">Total saving goal</label>
                        <div className="relative">
                          <input
                            id="savingsGoalInput"
                            type="tel"
                            placeholder="e.g. 10000000"
                            value={wizardData.savingsGoal}
                            onChange={e => setWizardData({ ...wizardData, savingsGoal: e.target.value })}
                            pattern="[0-9]*"
                            className="w-full text-2xl font-black text-gray-900 bg-white border-2 border-gray-200 focus:border-indigo-500 rounded-2xl py-3 pl-4 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-base font-bold text-gray-300">VND</span>
                        </div>
                      </div>
                      <div className="mb-8">
                        <label className="block text-sm font-medium text-slate-700 mb-2" htmlFor="monthsInput">Number of months</label>
                        <div className="relative">
                          <input
                            id="monthsInput"
                            type="tel"
                            placeholder="e.g. 12"
                            value={wizardData.months}
                            onChange={e => setWizardData({ ...wizardData, months: e.target.value })}
                            pattern="[0-9]*"
                            className="w-full text-2xl font-black text-gray-900 bg-white border-2 border-gray-200 focus:border-indigo-500 rounded-2xl py-3 pl-4 pr-20 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-base font-medium text-gray-400">months</span>
                        </div>
                      </div>
                      <div className="bg-indigo-50/50 p-4 rounded-2xl flex items-start gap-4 border border-indigo-200">
                        <Info className="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" />
                        <p className="text-sm text-gray-700">
                          The AI will divide your total goal by the number of months to suggest a monthly saving target. You can leave either field blank for the AI to suggest.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Chọn categories muốn tiết kiệm */}
                  {currentStep === 3 && (
                    <div>
                      <span className="text-indigo-600 font-semibold tracking-wider uppercase text-xs mb-2 block">
                        Step 3 of 4
                      </span>
                      <h2 className="text-2xl font-bold text-gray-900 mb-3">Which categories do you want to save on?</h2>
                      <p className="text-gray-500 mb-6">Select the categories you want the AI to focus on for savings.</p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {allCategories.map(cat => (
                          <button
                            key={cat}
                            type="button"
                            className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${selectedCategories.includes(cat) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'}`}
                            onClick={() => setSelectedCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                      {selectedCategories.length === 0 && <div className="text-xs text-rose-500">Please select at least one category.</div>}
                    </div>
                  )}

                  {/* Step 4: Importance & Notes */}
                  {currentStep === 4 && (
                    <div>
                      <span className="text-indigo-600 font-semibold tracking-wider uppercase text-xs mb-2 block">
                        Step 4 of 4 (Final Step)
                      </span>
                      <h2 className="text-2xl font-bold text-gray-900 mb-3">How important is this goal to you?</h2>
                      <p className="text-gray-500 mb-6">This tells the AI how much discipline to apply to hit your Step 2 number.</p>

                      <div className="space-y-4 pb-6">
                        {[
                          { icon: Sprout, color: 'green', label: 'Just starting out', value: 'Just starting out', desc: 'Small changes. I prioritize comfort and flexibility.' },
                          { icon: Scale, color: 'blue', label: 'Ideal target', value: 'Ideal target', desc: 'Aim to hit it. AI should balance saving and spending.' },
                          { icon: Flame, color: 'orange', label: 'Must achieve', value: 'Must achieve', desc: 'Maximum priority. I\'m ready for aggressive cuts.' }
                        ].map((option) => {
                          const Icon = option.icon;
                          return (
                            <label
                              key={option.value}
                              className={`flex items-start p-5 bg-white border-2 rounded-2xl cursor-pointer transition-all ${
                                wizardData.intensity === option.value
                                  ? 'border-indigo-600 bg-indigo-50/50'
                                  : 'border-transparent'
                              }`}
                            >
                              <input
                                type="radio"
                                name="intensity"
                                className="hidden"
                                checked={wizardData.intensity === option.value}
                                onChange={() => setWizardData({ ...wizardData, intensity: option.value })}
                              />
                              <div className={`mt-1 mr-4 text-${option.color}-600 bg-${option.color}-100 w-10 h-10 rounded-full flex items-center justify-center shrink-0`}>
                                <Icon className="w-5 h-5" />
                              </div>
                              <div>
                                <div className="font-bold text-gray-900 text-lg">{option.label}</div>
                                <p className="text-gray-500 text-sm mt-1 leading-snug">{option.desc}</p>
                              </div>
                            </label>
                          );
                        })}
                      </div>

                      <h2 className="text-2xl font-bold text-gray-900 mb-3 mt-8">Any additional notes? (Optional)</h2>
                      <p className="text-gray-500 mb-4">Tell the AI anything unique about your situation. It actually reads this!</p>

                      <div className="bg-white p-4 rounded-2xl shadow-sm border-2 border-transparent focus-within:border-indigo-500 transition-all">
                        <textarea
                          rows={4}
                          placeholder="e.g., 'I have a wedding in June' or 'I get paid bi-weekly'..."
                          value={wizardData.notes}
                          onChange={(e) => setWizardData({ ...wizardData, notes: e.target.value })}
                          className="w-full bg-transparent text-lg text-gray-900 placeholder-gray-300 focus:outline-none resize-none"
                        ></textarea>
                        <div className="flex justify-end items-center mt-2">
                          <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-indigo-400" />
                            Optional
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Fixed Wizard Footer */}
                <div className="p-6 pt-4 bg-white border-t border-gray-100 shrink-0 z-20">
                  <button
                    onClick={nextStep}
                    className={`w-full py-4 text-white font-bold rounded-2xl text-lg transition-transform active:scale-95 flex items-center justify-center gap-2 ${
                      currentStep === totalSteps ? 'bg-indigo-600' : 'bg-black'
                    }`}
                    disabled={currentStep === 3 && selectedCategories.length === 0}
                  >
                    {currentStep === totalSteps ? (
                      <>
                        <Sparkles className="w-5 h-5" />
                        <span>Generate Plan</span>
                      </>
                    ) : (
                      <>
                        <span>Continue</span>
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Loading Screen */}
            {currentScreen === 'loading' && (
              <div className="flex-1 flex flex-col items-center justify-center p-6 bg-white">
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-indigo-100 rounded-full animate-ping opacity-75"></div>
                  <div className="relative w-24 h-24 bg-gradient-to-tr from-violet-600 to-indigo-500 rounded-full flex items-center justify-center z-10 shadow-xl shadow-indigo-200/50">
                    <BrainCircuit className="w-12 h-12 text-white animate-pulse" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">AI is preparing your plan</h2>
                <p className="text-gray-500 text-center font-medium animate-pulse">{loadingText}</p>
              </div>
            )}

            {/* Result Screen */}
            {currentScreen === 'result' && aiResult && (
              <div className="flex-1 flex flex-col p-6 bg-white overflow-y-auto">
                <div className="flex-1 flex flex-col justify-center min-h-min py-8">
                  <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center mb-6 border-2 border-green-500/20">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Your plan is ready.</h1>
                  <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                    Based on your goal of <span className="text-gray-900 font-medium">{aiResult.goal}</span> with{' '}
                    <span className="text-gray-900 font-medium">{aiResult.intensity}</span> priority.
                  </p>

                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 p-6 rounded-[2rem] shadow-lg">
                    <div className="flex justify-between items-center mb-8">
                      <div>
                        <div className="text-blue-600 text-sm font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4" /> Suggested Saving Amount
                        </div>
                        <div className="text-5xl font-black text-gray-900 tracking-tight">
                          ${aiResult.suggestedSavings}
                          <span className="text-gray-500 text-xl font-medium ml-1">/mo</span>
                        </div>
                      </div>
                      <div className="relative w-16 h-16">
                        <svg viewBox="0 0 36 36" className="w-full h-full rotate-[-90deg]">
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="#e2e8f0"
                            strokeWidth="4"
                          />
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="4"
                            strokeDasharray="75, 100"
                          />
                        </svg>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {aiResult.recommendations.map((rec, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm"
                        >
                          <div
                            className={`w-10 h-10 ${
                              rec.type === 'reduce' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                            } rounded-xl flex items-center justify-center shrink-0`}
                          >
                            {rec.type === 'reduce' ? (
                              <ArrowRight className="w-5 h-5 rotate-90" />
                            ) : (
                              <CheckCircle2 className="w-5 h-5" />
                            )}
                          </div>
                          <div className="flex-1 text-gray-700">
                            {rec.type === 'reduce' ? 'Reduce' : 'Protect'}{' '}
                            <span className="text-gray-900 font-semibold">{rec.category}</span>
                            {rec.percentage && ` by ${rec.percentage}%`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 pt-6 space-y-3">
                  {aiResult.markdownAdvice && (
                    <button
                      onClick={() => showScreen('advice')}
                      className="w-full py-4 bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold rounded-2xl text-lg transition-all active:scale-95 flex items-center justify-center gap-2 border border-gray-200"
                    >
                      <FileText className="w-5 h-5" />
                      <span>View Detailed Advice</span>
                    </button>
                  )}
                  <button
                    onClick={acceptPlan}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-lg transition-all active:scale-95 shadow-lg shadow-blue-600/20"
                  >
                    Accept Plan
                  </button>
                </div>
              </div>
            )}

            {/* Detailed Advice Screen */}
            {currentScreen === 'advice' && aiResult && (
              <div className="flex-1 flex flex-col bg-white overflow-y-auto">
                <div className="px-6 py-4 flex items-center bg-white border-b border-gray-100 shrink-0">
                  <button
                    onClick={() => showScreen('result')}
                    className="p-2 -ml-2 text-gray-400 hover:text-gray-900 transition-colors"
                  >
                    <ArrowLeft className="w-6 h-6" />
                  </button>
                  <h2 className="flex-1 text-lg font-bold text-gray-900 ml-4">Detailed Saving Advice</h2>
                </div>
                
                <div className="flex-1 p-6 overflow-y-auto prose prose-slate max-w-none">
                  <ReactMarkdown
                    components={{
                      h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-gray-900 mb-4 mt-6" {...props} />,
                      h2: ({node, ...props}) => <h2 className="text-xl font-bold text-gray-900 mb-3 mt-5" {...props} />,
                      h3: ({node, ...props}) => <h3 className="text-lg font-semibold text-gray-800 mb-2 mt-4" {...props} />,
                      p: ({node, ...props}) => <p className="text-gray-700 mb-3 leading-relaxed" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-3 space-y-1" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-3 space-y-1" {...props} />,
                      li: ({node, ...props}) => <li className="text-gray-700" {...props} />,
                      strong: ({node, ...props}) => <strong className="font-semibold text-gray-900" {...props} />,
                      em: ({node, ...props}) => <em className="italic text-gray-600" {...props} />,
                      code: ({node, ...props}) => <code className="bg-gray-100 px-1 py-0.5 rounded text-sm" {...props} />
                    }}
                  >
                    {aiResult.markdownAdvice || ''}
                  </ReactMarkdown>
                </div>

                <div className="p-6 pt-4 bg-white border-t border-gray-100 shrink-0">
                  <button
                    onClick={acceptPlan}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl text-lg transition-all active:scale-95"
                  >
                    Accept Plan
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default SavingsOnboarding;
