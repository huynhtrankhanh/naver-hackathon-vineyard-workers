import React from "react";
import { IonPage, IonContent } from "@ionic/react";
import { useHistory } from "react-router-dom";
import { Globe } from "lucide-react";
import Header from "../../components/dashboard/Header";
import TabBar from "../../components/dashboard/TabBar";
import { useBalance } from "../../services/BalanceContext";
import { useLocale, useLocalization } from "../../services/LocaleContext";

const Profile: React.FC = () => {
  const history = useHistory();
  const { balance } = useBalance();
  const { locale, setLocale } = useLocale();
  const { l10n } = useLocalization();
  const username = l10n.getString('user');

  return (
    <IonPage>
      <IonContent className="bg-white">
        <div className="min-h-screen bg-white text-slate-900 flex flex-col">
          <Header title={l10n.getString('nav-profile')} onBack={() => history.push("/dashboard")} />
          <main className="mx-auto w-full max-w-md flex-1 px-4 pb-28 pt-4">
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-xl p-4">
                <div className="text-sm text-slate-500 mb-1">{l10n.getString('logged-in-as')}</div>
                <div className="text-lg font-semibold">{username}</div>
              </div>

              <div className="rounded-xl p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-slate-100">
                <div className="text-sm text-slate-600 mb-1">{l10n.getString('global-balance')}</div>
                <div className={`text-2xl font-bold ${balance < 0 ? 'text-rose-600' : 'text-slate-900'}`}>{balance.toLocaleString('vi-VN')} đ</div>
              </div>

              {/* Language Settings */}
              <div className="bg-slate-50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
                  <Globe className="h-4 w-4" />
                  <span>{l10n.getString('settings-language')}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setLocale('en')}
                    className={`py-3 px-4 rounded-xl font-medium transition-colors ${
                      locale === 'en'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {l10n.getString('settings-language-english')}
                  </button>
                  <button
                    onClick={() => setLocale('vi')}
                    className={`py-3 px-4 rounded-xl font-medium transition-colors ${
                      locale === 'vi'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {l10n.getString('settings-language-vietnamese')}
                  </button>
                </div>
              </div>
            </div>
          </main>
          <TabBar active="profile" />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Profile;
