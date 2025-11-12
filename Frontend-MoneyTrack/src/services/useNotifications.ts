import { useRef } from "react";
import { transactionApi, budgetApi, authApi, notificationApi } from "./api";

/**
 * useNotifications
 * - checkNotifications() -> trả về mảng thông báo (string)
 * - lưu session-level set để không spam cùng 1 cảnh báo nhiều lần
 */
export function useNotifications() {
  // Tránh báo lại cùng 1 cảnh báo trong session
  const notified = useRef<Set<string>>(new Set());

  function getToken(): string | null {
    try {
      if (typeof (authApi as any).getToken === "function") {
        return (authApi as any).getToken();
      }
    } catch {}
    return localStorage.getItem("token") || localStorage.getItem("authToken") || null;
  }

  async function shouldCreateNotification(type: string, meta?: Record<string, any>): Promise<boolean> {
    try {
      // Use the efficient check-recent endpoint
      const category = meta?.category;
      const result = await notificationApi.checkRecent(type, category);
      return !result.exists;
    } catch (error) {
      console.error("Error checking existing notifications:", error);
      // If we can't check, err on the side of not creating to avoid spam
      return false;
    }
  }

  async function pushNotificationToServer(type: string, message: string, meta?: Record<string, any>) {
    // Check if we should create this notification
    const shouldCreate = await shouldCreateNotification(type, meta);
    if (!shouldCreate) {
      console.log("Skipping notification creation - similar notification exists recently:", type);
      return;
    }

    const payload = {
      type,
      message,
      meta: meta ?? {},
    };

    console.log("Pushing notification:", payload);

    try {
      await notificationApi.create(payload);
      console.log("Notification pushed successfully");
    } catch (error: any) {
      console.error("Failed to push notification:", {
        status: error.status,
        body: error.body,
        payload,
        token: getToken()?.slice(0, 10) + "...", // chỉ in đầu token
      });
    }
  }

  async function checkNotifications(): Promise<string[]> {
    const messages: string[] = [];
    const token = getToken();
    if (!token) return messages;
    try {
      const summary = await transactionApi.getSummary();
      const income = summary?.income || 0;
      const expenses = summary?.expenses || 0;

      // Condition 1: expenses >= 80% income (income > 0)
      if (income > 0) {
        const ratio = expenses / income;
        const key = `income_ratio_${Math.floor(ratio * 100)}`;
        if (ratio >= 0.8 && !notified.current.has("income_80")) {
          const msg = `You've spent ${Math.round(ratio * 100)}% of your income this month. Please review your spending.`;
          messages.push(msg);
          notified.current.add("income_80");
          pushNotificationToServer("income_ratio", msg, { ratio, income, expenses } );  
        }
      }

      // Condition 2: budgets near limit (>=80%)
      const month = new Date().toISOString().slice(0, 7);
      const budgets = await budgetApi.getByMonth(month);
      if (Array.isArray(budgets)) {
        budgets.forEach((b: any) => {
          if (!b || !b.limit || b.limit <= 0) return;
          const pct = b.spent / b.limit;
          if (pct >= 0.8) {
            const key = `budget_${b._id}`;
            if (!notified.current.has(key)) {
              const percent = Math.round(pct * 100);
              const msg = `Budget "${b.category}" has used ${percent}% (${Math.round(b.spent)} / ${Math.round(b.limit)}).`;
                messages.push(msg);
              notified.current.add(key);
              pushNotificationToServer("budget_limit", msg, { category: b.category, percent, spent: b.spent, limit: b.limit });
            }
          }
        });
      }
    }  catch (error: any) {
      // If unauthorized, silently ignore (user likely logged out / token expired)
      const status = error?.status || error?.response?.status;
      if (status === 401 || status === 403) {
        // optional: trigger logout if you want
        // if (typeof (authApi as any).logout === 'function') (authApi as any).logout();
        return [];
      }
      console.error("Notification check failed", error);
    }
    return messages;
  }

  return { checkNotifications };
}