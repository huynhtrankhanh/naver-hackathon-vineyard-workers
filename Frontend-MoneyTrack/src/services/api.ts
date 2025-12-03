/**
 * API Service for communicating with the backend (now using IndexedDB)
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { initDB } from './db';
import { v4 as uuidv4 } from 'uuid';

// Helper to simulate network delay (optional)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper for generating IDs
const generateId = () => uuidv4();

// Transaction API
export const transactionApi = {
  getAll: async () => {
    const db = await initDB();
    return db.getAll('transactions');
  },
  getById: async (id: string) => {
    const db = await initDB();
    return db.get('transactions', id);
  },
  create: async (data: any) => {
    const db = await initDB();
    const newTransaction = {
      ...data,
      id: data.id || generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await db.put('transactions', newTransaction);
    return newTransaction;
  },
  update: async (id: string, data: any) => {
    const db = await initDB();
    const existing = await db.get('transactions', id);
    if (!existing) throw new Error('Transaction not found');
    const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
    await db.put('transactions', updated);
    return updated;
  },
  delete: async (id: string) => {
    const db = await initDB();
    await db.delete('transactions', id);
    return { message: 'Deleted successfully' };
  },
  getSummary: async () => {
    const db = await initDB();
    const all = await db.getAll('transactions');
    let income = 0;
    let expenses = 0;

    all.forEach((t: any) => {
      if (t.type === 'income') income += Number(t.amount);
      if (t.type === 'expense') expenses += Number(t.amount);
    });

    return { income, expenses, balance: income - expenses };
  },
  // New method for getting transactions by month
  getByMonth: async (month: string) => { // month format "YYYY-MM"
    const db = await initDB();
    const all = await db.getAll('transactions');
    return all.filter(t => t.date.startsWith(month));
  }
};

// Goals API
export const goalsApi = {
  getAll: async () => {
    const db = await initDB();
    return db.getAll('goals');
  },
  getById: async (id: string) => {
    const db = await initDB();
    return db.get('goals', id);
  },
  create: async (data: any) => {
    const db = await initDB();
    const newGoal = {
      ...data,
      id: data.id || generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await db.put('goals', newGoal);
    return newGoal;
  },
  update: async (id: string, data: any) => {
    const db = await initDB();
    const existing = await db.get('goals', id);
    if (!existing) throw new Error('Goal not found');
    const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
    await db.put('goals', updated);
    return updated;
  },
  delete: async (id: string) => {
    const db = await initDB();
    await db.delete('goals', id);
    return { message: 'Deleted successfully' };
  },
  contribute: async (id: string, amount: number) => {
    const db = await initDB();
    const goal = await db.get('goals', id);
    if (!goal) throw new Error('Goal not found');
    const updated = {
      ...goal,
      currentAmount: (Number(goal.currentAmount) || 0) + amount,
      updatedAt: new Date().toISOString()
    };
    await db.put('goals', updated);
    return updated;
  }
};

// Budget API
export const budgetApi = {
  getAll: async () => {
    const db = await initDB();
    return db.getAll('budgets');
  },
  getByMonth: async (month: string) => {
    const db = await initDB();
    return db.getAllFromIndex('budgets', 'by-month', month);
  },
  create: async (data: any) => {
    const db = await initDB();
    const newBudget = {
        ...data,
        id: data.id || generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    await db.put('budgets', newBudget);
    return newBudget;
  },
  update: async (id: string, data: any) => {
    const db = await initDB();
    const existing = await db.get('budgets', id);
    if (!existing) throw new Error('Budget not found');
    const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
    await db.put('budgets', updated);
    return updated;
  },
  delete: async (id: string) => {
    const db = await initDB();
    await db.delete('budgets', id);
    return { message: 'Deleted successfully' };
  }
};

// Auth API - Mocked
export const authApi = {
  register: async (username: string, passwordHash: string) => {
    return { message: 'Registered successfully', token: 'mock-token', username };
  },
  login: async (username: string, passwordHash: string) => {
    return { message: 'Logged in successfully', token: 'mock-token', username };
  },
  verify: async () => {
    return { valid: true, username: 'User' };
  },
  logout: async () => {
    return { message: 'Logged out successfully' };
  },
  setToken: (token: string) => {
    localStorage.setItem("authToken", token);
  },
  getToken: () => {
    return localStorage.getItem("authToken");
  },
  removeToken: () => {
    localStorage.removeItem("authToken");
  },
  isAuthenticated: () => {
    return true; // Always authenticated
  },
};

// Notification API
export const notificationApi = {
  getAll: async () => {
    const db = await initDB();
    return db.getAll('notifications');
  },
  create: async (payload: { type: string; message: string; meta?: Record<string, any> }) => {
    const db = await initDB();
     const newNotification = {
        ...payload,
        id: generateId(),
        read: false,
        createdAt: new Date().toISOString(),
    };
    await db.put('notifications', newNotification);
    return newNotification;
  },
  markAsRead: async (id: string) => {
    const db = await initDB();
    const existing = await db.get('notifications', id);
    if (existing) {
        existing.read = true;
        await db.put('notifications', existing);
    }
    return { message: 'Marked as read' };
  },
  checkRecent: async (type: string, category?: string) => {
     // Simplification: just return false or implement actual check if needed
     return { exists: false };
  },
};

// Removed AI API and OCR API
