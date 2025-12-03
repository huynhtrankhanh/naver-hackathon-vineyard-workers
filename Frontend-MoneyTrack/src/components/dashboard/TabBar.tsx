import React from "react";
import { PieChart, Plus, Sparkles, User } from "lucide-react";
import { useHistory } from "react-router-dom";
import { useLocalization } from "../../services/LocaleContext";

interface TabBarProps {
  active: "dashboard" | "add" | "goals" | "profile";
}

const TabBar: React.FC<TabBarProps> = ({ active }) => {
  const history = useHistory();
  const { l10n } = useLocalization();

  const tabs = [
    { id: "dashboard", labelKey: "nav-dashboard", icon: PieChart, path: "/dashboard" },
    { id: "add", labelKey: "nav-add", icon: Plus, path: "/add" },
    { id: "goals", labelKey: "nav-saving", icon: Sparkles, path: "/goals" },
    { id: "profile", labelKey: "nav-profile", icon: User, path: "/profile" },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-100">
      <div className="mx-auto max-w-md grid grid-cols-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => history.push(tab.path)}
              className={`flex flex-col items-center justify-center py-2 ${
                isActive
                  ? "text-blue-600"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[11px] leading-tight">{l10n.getString(tab.labelKey)}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default TabBar;
