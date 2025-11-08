import React, { useState } from "react";
import {
  IonPage,
  IonContent,
  IonInput,
  IonButton,
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
      <IonHeader translucent={true}>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/splash" />
          </IonButtons>
          <IonTitle>Sign Up</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding relative">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-blue-500 my-8">
            Create Account
          </h1>
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
        <IonText className="text-center absolute bottom-10 left-0 right-0">
          Already have an account?{" "}
          <IonText
            color="primary"
            onClick={() => history.push("/login")}
            className="cursor-pointer font-bold"
          >
            Sign in
          </IonText>
        </IonText>
      </IonContent>
    </IonPage>
  );
};

export default SignUp;
