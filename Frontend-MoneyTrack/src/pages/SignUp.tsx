import React, { useState } from "react";
import {
  IonPage,
  IonContent,
  IonInput,
  IonButton,
  IonIcon,
  IonText,
} from "@ionic/react";
import { logoGoogle, logoApple } from "ionicons/icons";
import { useHistory } from "react-router-dom";
import { Wallet, ArrowLeft } from "lucide-react";

const SignUp: React.FC = () => {
  const history = useHistory();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      console.error("Mật khẩu không khớp!");
      // TODO: Hiển thị thông báo lỗi cho user (dùng Toast hoặc Alert)
      return;
    }

    console.log("Đăng ký với:", email, password);

    // --- TODO: GỌI API ĐĂNG KÝ CỦA BACKEND ---
    /*
    try {
      // const response = await apiClient.post('/api/auth/register', { email, password });
      // console.log(response.data);
      // Đăng ký thành công, chuyển hướng đến trang login
      // history.push('/login');
    } catch (error) {
      // Xử lý lỗi (ví dụ: email đã tồn tại)
      console.error('Đăng ký thất bại:', error);
    }
    */
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
              label="Email"
              labelPlacement="floating"
              fill="outline"
              type="email"
              className="mt-4"
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

            <IonInput
              label="Confirm Password"
              labelPlacement="floating"
              fill="outline"
              type="password"
              className="mt-4"
              onIonChange={(e) => setConfirmPassword(e.detail.value!)}
            />

            <IonButton expand="block" className="mt-6" onClick={handleSignUp}>
              Create Account
            </IonButton>

            <IonText className="block text-center text-gray-500 my-5">or</IonText>

            <IonButton expand="block" fill="outline" color="dark" className="mt-4">
              <IonIcon icon={logoGoogle} slot="start" />
              Sign up with Google
            </IonButton>

            <IonButton expand="block" fill="outline" color="dark" className="mt-4">
              <IonIcon icon={logoApple} slot="start" />
              Sign up with Apple
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
          </main>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default SignUp;
