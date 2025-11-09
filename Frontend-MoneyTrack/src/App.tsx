import React from "react";
// 1. DÙNG 'Redirect' (của v5)
import { Redirect, Route } from "react-router-dom";
import { IonApp, IonRouterOutlet, setupIonicReact } from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";

/* Import các trang của bạn */
import Splash from "./pages/splash";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/dashboard/Dashboard";
import Income from "./pages/dashboard/Income";
import Expenses from "./pages/dashboard/Expenses";
import Budget from "./pages/dashboard/Budget";
import AddTransaction from "./pages/dashboard/AddTransaction";
import Goals from "./pages/dashboard/Goals";
import Profile from "./pages/dashboard/Profile";
import SavingsOnboarding from "./pages/SavingsOnboarding";

/* Core CSS */
import "@ionic/react/css/core.css";

/* CSS cơ bản (bắt buộc) */
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";

/* CSS tùy chọn (nên có) */
import "@ionic/react/css/padding.css";
import "@ionic/react/css/float-elements.css";
import "@ionic/react/css/text-alignment.css";
import "@ionic/react/css/text-transformation.css";
import "@ionic/react/css/flex-utils.css";
import "@ionic/react/css/display.css";

/* CSS Chủ đề (Đã import Tailwind ở đây) */
import "./theme/variables.css";

setupIonicReact();

const App: React.FC = () => (
  <IonApp>
    <IonReactRouter>
      <IonRouterOutlet>
        {/* 2. DÙNG 'component' và 'exact' (của v5) */}
        <Route exact path="/splash" component={Splash} />
        <Route exact path="/login" component={SignIn} />
        <Route exact path="/signup" component={SignUp} />
        <Route exact path="/dashboard" component={Dashboard} />
        <Route exact path="/dashboard/income" component={Income} />
        <Route exact path="/dashboard/expenses" component={Expenses} />
        <Route exact path="/dashboard/budget" component={Budget} />
        <Route exact path="/add" component={AddTransaction} />
        <Route exact path="/goals" component={Goals} />
        <Route exact path="/profile" component={Profile} />
        <Route exact path="/savings-onboarding" component={SavingsOnboarding} />

        {/* 3. DÙNG 'Redirect' (của v5) */}
        <Route exact path="/">
          <Redirect to="/splash" />
        </Route>
      </IonRouterOutlet>
    </IonReactRouter>
  </IonApp>
);

export default App;
