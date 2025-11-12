import React, { useEffect, useState } from "react";
import { IonPage, IonContent, IonSpinner, IonList, IonItem, IonBadge, IonButton } from "@ionic/react";
import { useHistory } from "react-router-dom";
import { Bell, Percent, AlertTriangle } from "lucide-react";
import { notificationApi } from "../../services/api";

function iconForType(type?: string) {
  if (type === "budget") return <Percent className="h-5 w-5 text-slate-700" />;
  if (type === "income_ratio" || type === "income") return <AlertTriangle className="h-5 w-5 text-slate-700" />;
  return <Bell className="h-5 w-5 text-slate-700" />;
}

const Notifications: React.FC = () => {
  const history = useHistory();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

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
    setBusyId(id);
    try {
      await notificationApi.markAsRead(id);
      setItems(prev => prev.map(p => (p._id === id ? { ...p, isRead: true } : p)));
    } catch (err) {
      console.error("Mark read failed", err);
    } finally {
      setBusyId(null);
    }
  };

  // handle user selecting an item: mark read and navigate if meta.route present
  const handleSelect = async (notif: any) => {
    if (!notif.isRead) {
      await markRead(notif._id);
    }
    if (notif.meta && notif.meta.route) {
      history.push(notif.meta.route);
    }
  };

  const markAllRead = async () => {
    try {
      await Promise.all(items.filter(i => !i.isRead).map(i => notificationApi.markAsRead(i._id)));
      setItems(prev => prev.map(p => ({ ...p, isRead: true })));
    } catch (err) {
      console.error("Mark all read failed", err);
    }
  };

  return (
    <IonPage>
      <IonContent className="bg-white">
        <div className="mx-auto max-w-md px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => history.goBack()} className="text-sm text-slate-600">Back</button>
            <h2 className="text-lg font-semibold">Notifications</h2>
            <div className="flex items-center gap-2">
              <IonButton size="small" onClick={fetchAll} fill="clear">Refresh</IonButton>
              <IonButton size="small" onClick={markAllRead}>Mark all read</IonButton>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><IonSpinner /></div>
          ) : items.length === 0 ? (
            <div className="text-center text-slate-500 py-12">No notifications</div>
          ) : (
            <IonList>
              {items.map(notif => (
                // make the item clickable: selecting = mark read + optional navigate
                <IonItem
                  key={notif._id}
                  button
                  onClick={() => handleSelect(notif)}
                  className={`py-3 ${notif.isRead ? "opacity-70" : "bg-white"}`}
                >
                  <div className="flex items-start gap-3 w-full">
                    <div className="mt-1">{iconForType(notif.type)}</div>
                    <div className="flex-1">
                      <div className={`font-medium ${notif.isRead ? "text-slate-700" : "text-slate-900"}`}>
                        {notif.message}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">{new Date(notif.createdAt).toLocaleString()}</div>
                    </div>
                    <div className="ml-2 flex flex-col items-end gap-2">
                      {!notif.isRead && (
                        <IonBadge color="danger">New</IonBadge>
                      )}
                      {/* keep an optional explicit button but it won't be necessary */}
                      <IonButton
                        size="small"
                        disabled={busyId === notif._id}
                        onClick={(e) => {
                          e.stopPropagation(); // prevent parent onClick duplicate
                          markRead(notif._id);
                        }}
                      >
                        {notif.isRead ? "Read" : "Mark read"}
                      </IonButton>
                    </div>
                  </div>
                </IonItem>
              ))}
            </IonList>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Notifications;