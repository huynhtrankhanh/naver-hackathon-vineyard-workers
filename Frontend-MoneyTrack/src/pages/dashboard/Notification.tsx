import React, { useEffect, useState } from "react";
import { IonPage, IonContent, IonSpinner, IonBadge } from "@ionic/react";
import { useHistory } from "react-router-dom";
import { Bell, Percent, AlertTriangle, ArrowLeft, RefreshCw, CheckCheck, Inbox } from "lucide-react";
import { notificationApi } from "../../services/api";

function iconForType(type?: string) {
  if (type === "budget_limit" || type === "budget") return <Percent className="h-6 w-6 text-blue-600" />;
  if (type === "income_ratio" || type === "income") return <AlertTriangle className="h-6 w-6 text-orange-600" />;
  return <Bell className="h-6 w-6 text-slate-600" />;
}

function cardColorForType(type?: string, isRead?: boolean) {
  if (isRead) return "bg-slate-50/50 border-slate-200";
  if (type === "budget_limit" || type === "budget") return "bg-blue-50 border-blue-200";
  if (type === "income_ratio" || type === "income") return "bg-orange-50 border-orange-200";
  return "bg-white border-slate-200";
}

interface Notification {
  id: string;
  type?: string;
  message: string;
  createdAt: string;
  read: boolean;
  meta?: {
    route?: string;
  };
}

const Notifications: React.FC = () => {
  const history = useHistory();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await notificationApi.getAll();
      setItems(res || []);
    } catch (err) {
      console.error("Failed to load notifications", err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // mark single notification read
  const markRead = async (id: string) => {
    try {
      await notificationApi.markAsRead(id);
      setItems(prev => prev.map(p => (p.id === id ? { ...p, read: true } : p)));
    } catch (err) {
      console.error("Mark read failed", err);
    }
  };

  // handle user selecting an item: mark read and navigate if meta.route present
  const handleSelect = async (notif: Notification) => {
    if (!notif.read) {
      await markRead(notif.id);
    }
    if (notif.meta && notif.meta.route) {
      history.push(notif.meta.route);
    }
  };

  const markAllRead = async () => {
    try {
      await Promise.all(items.filter(i => !i.read).map(i => notificationApi.markAsRead(i.id)));
      setItems(prev => prev.map(p => ({ ...p, read: true })));
    } catch (err) {
      console.error("Mark all read failed", err);
    }
  };

  return (
    <IonPage>
      <IonContent className="bg-gradient-to-b from-slate-50 to-white">
        <div className="mx-auto max-w-md px-4 py-4">
          {/* Improved Header */}
          <div className="flex items-center justify-between mb-6">
            <button 
              onClick={() => history.goBack()} 
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm font-medium">Back</span>
            </button>
            <h2 className="text-xl font-bold text-slate-900">Notifications</h2>
            <div className="flex items-center gap-2">
              <button 
                onClick={fetchAll}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                title="Refresh"
              >
                <RefreshCw className="h-5 w-5 text-slate-600" />
              </button>
              <button 
                onClick={markAllRead}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                title="Mark all read"
              >
                <CheckCheck className="h-5 w-5 text-slate-600" />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><IonSpinner /></div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 p-4 rounded-full bg-slate-100">
                <Inbox className="h-12 w-12 text-slate-400" />
              </div>
              <p className="text-lg font-medium text-slate-900 mb-1">No notifications</p>
              <p className="text-sm text-slate-500">You're all caught up!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map(notif => (
                <div
                  key={notif.id}
                  onClick={() => handleSelect(notif)}
                  className={`rounded-2xl border-2 p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${cardColorForType(notif.type, notif.read)} ${!notif.read ? "hover:scale-[1.02]" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex-shrink-0">{iconForType(notif.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium leading-snug mb-1 ${notif.read ? "text-slate-600" : "text-slate-900"}`}>
                        {notif.message}
                      </div>
                      <div className="text-xs text-slate-500">{new Date(notif.createdAt).toLocaleString()}</div>
                    </div>
                    {!notif.read && (
                      <div className="flex-shrink-0">
                        <IonBadge color="danger" className="font-semibold">New</IonBadge>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Notifications;