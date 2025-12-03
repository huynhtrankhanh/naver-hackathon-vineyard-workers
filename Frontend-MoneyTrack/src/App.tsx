import React from "react";
import { Redirect, Route } from "react-router-dom";
import { IonApp, IonRouterOutlet, setupIonicReact } from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";

/* Import các trang của bạn */
import GoalsAll from "./pages/dashboard/GoalsAll";
import Dashboard from "./pages/dashboard/Dashboard";
import Income from "./pages/dashboard/Income";
import Expenses from "./pages/dashboard/Expenses";
import Budget from "./pages/dashboard/Budget";
import AddTransaction from "./pages/dashboard/AddTransaction";
import EditTransaction from "./pages/dashboard/EditTransaction";
import Goals from "./pages/dashboard/Goals";
import Profile from "./pages/dashboard/Profile";
import Notifications from "./pages/dashboard/Notification";
import TransactionsByMonth from "./pages/dashboard/TransactionsByMonth";
          

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
          <Route exact path="/dashboard" component={Dashboard} />
          <Route exact path="/dashboard/income" component={Income} />
          <Route exact path="/dashboard/expenses" component={Expenses} />
          <Route exact path="/dashboard/budget" component={Budget} />
          <Route exact path="/add" component={AddTransaction} />
          <Route exact path="/edit-transaction/:id" component={EditTransaction} />
          <Route exact path="/goals/all" component={GoalsAll} />
          <Route exact path="/goals" component={Goals} />
          <Route exact path="/profile" component={Profile} />
          <Route exact path="/notifications" component={Notifications} />
          <Route exact path="/transactions/month" component={TransactionsByMonth} />

          <Route exact path="/">
            <Redirect to="/dashboard" />
          </Route>
        </IonRouterOutlet>
      </BalanceProvider>
    </IonReactRouter>
  </IonApp>
);

export default App;
