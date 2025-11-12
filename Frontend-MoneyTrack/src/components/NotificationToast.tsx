import React from "react";
import { X, Percent, AlertTriangle, Bell } from "lucide-react";

interface NotificationToastProps {
  message: string;
  type: "budget" | "income" | "info" | null;
  onDismiss: () => void;
  isVisible: boolean;
}

const NotificationToast: React.FC<NotificationToastProps> = ({
  message,
  type,
  onDismiss,
  isVisible,
}) => {
  if (!isVisible || !message) return null;

  const getIcon = () => {
    switch (type) {
      case "budget":
        return <Percent className="h-5 w-5 text-blue-600" />;
      case "income":
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      default:
        return <Bell className="h-5 w-5 text-slate-700" />;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case "budget":
        return "bg-blue-50 border-blue-200";
      case "income":
        return "bg-orange-50 border-orange-200";
      default:
        return "bg-slate-50 border-slate-200";
    }
  };

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 animate-slide-down">
      <div
        className={`rounded-2xl border ${getBgColor()} p-4 shadow-lg backdrop-blur-sm flex items-start gap-3`}
      >
        <div className="mt-0.5">{getIcon()}</div>
        <div className="flex-1 text-sm text-slate-900">{message}</div>
        <button
          onClick={onDismiss}
          className="h-6 w-6 rounded-lg hover:bg-white/50 flex items-center justify-center transition-colors"
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4 text-slate-600" />
        </button>
      </div>
    </div>
  );
};

export default NotificationToast;
