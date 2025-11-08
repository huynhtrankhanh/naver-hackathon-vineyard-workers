import React from "react";
import { IonPage, IonContent, IonButton } from "@ionic/react";
import { useHistory } from "react-router-dom";

const Splash: React.FC = () => {
  const history = useHistory();

  return (
    <IonPage>
      <IonContent className="ion-padding relative" fullscreen>
        <div className="flex flex-col justify-center items-center text-center h-full z-10 relative text-xl"><h1 className="text-5xl font-bold mb-5">SmartMoney</h1></div>
        
        <div className="absolute bottom-12 left-4 right-4 w-[calc(100%-32px)] z-10">
          <IonButton
            expand="block"
            onClick={() => history.push("/login")}
            className="mb-4"
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
      </IonContent>
    </IonPage>
  );
};

export default Splash;
