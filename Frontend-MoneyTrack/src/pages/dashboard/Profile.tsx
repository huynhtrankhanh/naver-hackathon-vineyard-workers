import React from "react";
import { IonPage, IonContent } from "@ionic/react";
import { useHistory } from "react-router-dom";
import Header from "../../components/dashboard/Header";
import TabBar from "../../components/dashboard/TabBar";
import { useBalance } from "../../services/BalanceContext";

const Profile: React.FC = () => {
  const history = useHistory();
  const { balance } = useBalance();
  const username = "User";

  return (
    <IonPage>
      <IonContent className="bg-white">
        <div className="min-h-screen bg-white text-slate-900 flex flex-col">
          <Header title="Profile" onBack={() => history.push("/dashboard")} />
          <main className="mx-auto w-full max-w-md flex-1 px-4 pb-28 pt-4">
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-xl p-4">
                <div className="text-sm text-slate-500 mb-1">Logged in as</div>
                <div className="text-lg font-semibold">{username}</div>
              </div>

              <div className="rounded-xl p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-slate-100">
                <div className="text-sm text-slate-600 mb-1">Global Balance</div>
                <div className={`text-2xl font-bold ${balance < 0 ? 'text-rose-600' : 'text-slate-900'}`}>{balance.toLocaleString('vi-VN')} đ</div>
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
