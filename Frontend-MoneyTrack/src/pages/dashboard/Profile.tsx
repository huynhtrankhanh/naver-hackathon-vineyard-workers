import React, { useState } from "react";
import { IonPage, IonContent, IonButton, IonToast, IonSpinner } from "@ionic/react";
import { useHistory } from "react-router-dom";
import { LogOut } from "lucide-react";
import Header from "../../components/dashboard/Header";
import TabBar from "../../components/dashboard/TabBar";
import { authApi } from "../../services/api";

const Profile: React.FC = () => {
  const history = useHistory();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showToast, setShowToast] = useState(false);
  const username = authApi.getToken() ? "User" : "Guest"; // TODO: optionally call /auth/verify to fetch username

  const handleLogout = async () => {
    setLoading(true);
    setError("");

    try {
      // Call logout API to invalidate session on server
      await authApi.logout();
    } catch (err: any) {
      console.error("Logout API error:", err);
      // Continue with logout even if API fails (network issues, etc.)
    } finally {
      // Remove token from local storage
      authApi.removeToken();
      setLoading(false);
      
      // Redirect to splash screen
      history.push("/splash");
    }
  };

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

              <div className="bg-slate-50 rounded-xl p-4">
                <div className="text-sm text-slate-500 mb-3">Account Actions</div>
                <IonButton
                  expand="block"
                  color="danger"
                  onClick={handleLogout}
                  disabled={loading}
                  className="text-white"
                >
                  {loading ? (
                    <IonSpinner name="crescent" />
                  ) : (
                    <>
                      <LogOut className="w-5 h-5 mr-2" />
                      Log Out
                    </>
                  )}
                </IonButton>
              </div>
            </div>

            <IonToast
              isOpen={showToast}
              onDidDismiss={() => setShowToast(false)}
              message={error}
              duration={3000}
              color="danger"
              position="top"
            />
          </main>
          <TabBar active="profile" />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Profile;
