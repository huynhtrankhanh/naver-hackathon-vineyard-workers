import React from "react";
import { IonPage, IonContent, IonButton } from "@ionic/react";
import { useHistory } from "react-router-dom";
import { Wallet } from "lucide-react";

const Splash: React.FC = () => {
  const history = useHistory();

  return (
    <IonPage>
      <IonContent className="bg-white" fullscreen>
        <div className="min-h-screen bg-white flex flex-col">
          {/* Main content - centered */}
          <div className="flex-1 flex flex-col justify-center items-center text-center px-8">
            <div className="mb-8">
              <div className="h-20 w-20 rounded-3xl bg-blue-600 flex items-center justify-center shadow-lg mx-auto mb-6">
                <Wallet className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-5xl font-bold text-gray-900 mb-4">SmartMoney</h1>
              <p className="text-xl text-gray-600 leading-relaxed max-w-md mx-auto">
                The plans of the diligent lead surely to abundance{" "}
                <em className="italic text-gray-500">(NRSVue)</em>
              </p>
            </div>
          </div>

          {/* Bottom buttons */}
          <div className="px-8 pb-12 space-y-3">
            <IonButton
              expand="block"
              onClick={() => history.push("/login")}
              className="mb-3"
            >
              Log in
            </IonButton>
            <IonButton
              expand="block"
              fill="outline"
              onClick={() => history.push("/signup")}
              color="dark"
            >
              Sign up
            </IonButton>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Splash;
