import React from "react";
import { IonPage, IonContent } from "@ionic/react";
import { useHistory } from "react-router-dom";
import Header from "../../components/dashboard/Header";
import TabBar from "../../components/dashboard/TabBar";

const Budget: React.FC = () => {
  const history = useHistory();

  return (
    <IonPage>
      <IonContent className="bg-white">
        <div className="min-h-screen bg-white text-slate-900 flex flex-col">
          <Header title="Monthly Budget" onBack={() => history.push("/dashboard")} />
          <main className="mx-auto w-full max-w-md flex-1 px-4 pb-28 pt-4">
            <div className="text-slate-500 text-sm">Coming soon… adjust category limits here.</div>
          </main>
          <TabBar active="dashboard" />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Budget;
