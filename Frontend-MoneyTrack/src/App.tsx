import React from "react";
// 1. DÙNG 'Redirect' (của v5)
import { Redirect, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
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
import EditTransaction from "./pages/dashboard/EditTransaction";
import Goals from "./pages/dashboard/Goals";
import Profile from "./pages/dashboard/Profile";
import SavingsOnboarding from "./pages/SavingsOnboarding";
import SavingPlanDetail from "./pages/dashboard/SavingPlanDetail";
import Notifications from "./pages/dashboard/Notification";
import AddTransactionVoice from "./pages/dashboard/AddTransactionVoice";
import AddReceipt from "./pages/dashboard/AddReceipt";

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
import { BalanceProvider } from "./services/BalanceContext";

setupIonicReact();

const App: React.FC = () => (
  <IonApp>
    <IonReactRouter>
      <BalanceProvider>
        <IonRouterOutlet>
          {/* 2. DÙNG 'component' và 'exact' (của v5) */}
          <Route exact path="/splash" component={Splash} />
          <Route exact path="/login" component={SignIn} />
          <Route exact path="/signup" component={SignUp} />
          <ProtectedRoute exact path="/dashboard" component={Dashboard} />
          <ProtectedRoute exact path="/dashboard/income" component={Income} />
          <ProtectedRoute
            exact
            path="/dashboard/expenses"
            component={Expenses}
          />
          <ProtectedRoute exact path="/dashboard/budget" component={Budget} />
          <ProtectedRoute exact path="/add" component={AddTransaction} />
          <ProtectedRoute
            exact
            path="/edit-transaction/:id"
            component={EditTransaction}
          />
          <ProtectedRoute
            exact
            path="/add-voice"
            component={AddTransactionVoice}
          />

          <ProtectedRoute
            exact
            path="/add-receipt"
            component={AddReceipt}
          />

          <ProtectedRoute exact path="/goals" component={Goals} />
          <ProtectedRoute exact path="/profile" component={Profile} />
          <ProtectedRoute
            exact
            path="/saving-plan/:id"
            component={SavingPlanDetail}
          />
          <ProtectedRoute
            exact
            path="/notifications"
            component={Notifications}
          />
          <ProtectedRoute
            exact
            path="/savings-onboarding"
            component={SavingsOnboarding}
          />

          {/* 3. DÙNG 'Redirect' (của v5) */}
          <Route exact path="/">
            <Redirect to="/splash" />
          </Route>
        </IonRouterOutlet>
      </BalanceProvider>
    </IonReactRouter>
  </IonApp>
);

export default App;
