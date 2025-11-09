import React, { useState } from "react";
import {
  IonPage,
  IonContent,
  IonInput,
  IonButton,
  IonCheckbox,
  IonLabel,
  IonIcon,
  IonText,
} from "@ionic/react";
import { logoGoogle, logoApple } from "ionicons/icons";
import { useHistory } from "react-router-dom";
import { Wallet, ArrowLeft } from "lucide-react";

const SignIn: React.FC = () => {
  const history = useHistory();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    console.log("Logging in with:", email, password);
    // ... (Logic gọi API sẽ thêm ở đây) ...
    // For now, navigate to dashboard after simulated login
    history.push("/dashboard");
  };

  return (
    <IonPage>
      <IonContent className="bg-white">
        <div className="min-h-screen bg-white flex flex-col">
          {/* Header */}
          <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-slate-100">
            <div className="mx-auto max-w-md px-4 py-3 flex items-center">
              <button
                onClick={() => history.push("/splash")}
                className="p-2 -ml-2 text-gray-400 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-2 ml-2">
                <div className="h-9 w-9 rounded-2xl bg-blue-600 flex items-center justify-center shadow-sm">
                  <Wallet className="h-5 w-5 text-white" />
                </div>
                <div className="font-semibold">SmartMoney</div>
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="mx-auto w-full max-w-md flex-1 px-4 py-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
              <p className="text-gray-500">Sign in to continue to your account</p>
            </div>

            <IonInput
              label="Email"
              labelPlacement="floating"
              fill="outline"
              type="email"
              className="mt-4 rounded-xl"
              onIonChange={(e) => setEmail(e.detail.value!)}
            />

            <IonInput
              label="Password"
              labelPlacement="floating"
              fill="outline"
              type="password"
              className="mt-4"
              onIonChange={(e) => setPassword(e.detail.value!)}
            />

            <div className="flex justify-between items-center text-sm mt-4">
              <div className="flex items-center">
                <IonCheckbox slot="start" />
                <IonLabel className="ml-2">Remember me</IonLabel>
              </div>
              <IonText color="primary" className="cursor-pointer">
                Forgot password?
              </IonText>
            </div>

            <IonButton expand="block" className="mt-6" onClick={handleLogin}>
              Sign in
            </IonButton>

            <IonText className="block text-center text-gray-500 my-5">or</IonText>

            <IonButton expand="block" fill="outline" color="dark" className="mt-4">
              <IonIcon icon={logoGoogle} slot="start" />
              Continue with Google
            </IonButton>

            <IonButton expand="block" fill="outline" color="dark" className="mt-4">
              <IonIcon icon={logoApple} slot="start" />
              Continue with Apple
            </IonButton>

            <IonText className="text-center block mt-8">
              Don't have an account?{" "}
              <IonText
                color="primary"
                onClick={() => history.push("/signup")}
                className="cursor-pointer font-bold"
              >
                Sign up
              </IonText>
            </IonText>
          </main>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default SignIn;
        </IonText>
      </IonContent>
    </IonPage>
  );
};

export default SignIn;
