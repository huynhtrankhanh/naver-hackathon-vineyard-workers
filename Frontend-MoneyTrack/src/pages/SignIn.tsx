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
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
} from "@ionic/react";
import { logoGoogle, logoApple } from "ionicons/icons";
import { useHistory } from "react-router-dom";

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
      <IonHeader translucent={true}>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/splash" />
          </IonButtons>
          <IonTitle>Sign In</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding relative">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-blue-500 my-8">SmartMoney</h1>
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

        <IonText className="text-center absolute bottom-10 left-0 right-0">
          Don't have an account?{" "}
          <IonText
            color="primary"
            onClick={() => history.push("/signup")}
            className="cursor-pointer font-bold"
          >
            Sign up
          </IonText>
        </IonText>
      </IonContent>
    </IonPage>
  );
};

export default SignIn;
