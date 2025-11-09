import React, { useState } from "react";
import {
  IonPage,
  IonContent,
  IonInput,
  IonButton,
  IonText,
  IonToast,
  IonSpinner,
} from "@ionic/react";
import { useHistory } from "react-router-dom";
import { Wallet, ArrowLeft } from "lucide-react";
import { hashPassword } from "../utils/crypto";
import { authApi } from "../services/api";

const SignUp: React.FC = () => {
  const history = useHistory();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showError, setShowError] = useState(false);

  const handleSignUp = async () => {
    if (!username || !password || !confirmPassword) {
      setError("All fields are required");
      setShowError(true);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setShowError(true);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setShowError(true);
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Hash password with argon2id on client side
      const passwordHash = await hashPassword(password, username);

      // Call register API
      const response = await authApi.register(username, passwordHash);

      // Store token
      authApi.setToken(response.token);

      // Navigate to dashboard
      history.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Registration failed. Username may already exist.");
      setShowError(true);
    } finally {
      setLoading(false);
    }
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
              <p className="text-gray-500">Sign up to start tracking your finances</p>
            </div>

            <IonInput
              label="Username"
              labelPlacement="floating"
              fill="outline"
              type="text"
              className="mt-4"
              value={username}
              onIonChange={(e) => setUsername(e.detail.value!)}
            />

            <IonInput
              label="Password"
              labelPlacement="floating"
              fill="outline"
              type="password"
              className="mt-4"
              value={password}
              onIonChange={(e) => setPassword(e.detail.value!)}
            />

            <IonInput
              label="Confirm Password"
              labelPlacement="floating"
              fill="outline"
              type="password"
              className="mt-4"
              value={confirmPassword}
              onIonChange={(e) => setConfirmPassword(e.detail.value!)}
            />

            <IonButton 
              expand="block" 
              className="mt-6" 
              onClick={handleSignUp}
              disabled={loading}
            >
              {loading ? <IonSpinner name="crescent" /> : "Create Account"}
            </IonButton>

            {/* --- Link Sign In --- */}
            <IonText className="text-center block mt-8">
              Already have an account?{" "}
              <IonText
                color="primary"
                onClick={() => history.push("/login")}
                className="cursor-pointer font-bold"
              >
                Sign in
              </IonText>
            </IonText>

            <IonToast
              isOpen={showError}
              onDidDismiss={() => setShowError(false)}
              message={error}
              duration={3000}
              color="danger"
              position="top"
            />
          </main>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default SignUp;
