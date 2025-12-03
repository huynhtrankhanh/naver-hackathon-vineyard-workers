import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface MoneyTrackDB extends DBSchema {
  transactions: {
    key: string;
    value: {
      id: string;
      title: string;
      amount: number;
      type: 'income' | 'expense';
      category: string;
      date: string;
      createdAt?: string;
      updatedAt?: string;
    };
    indexes: { 'by-date': string; 'by-type': string };
  };
  goals: {
    key: string;
    value: {
      id: string;
      name: string;
      targetAmount: number;
      currentAmount: number;
      deadline?: string;
      createdAt?: string;
      updatedAt?: string;
    };
  };
  budgets: {
    key: string;
    value: {
      id: string;
      month: string; // "YYYY-MM"
      limit: number;
      spent: number;
      category?: string;
      createdAt?: string;
      updatedAt?: string;
    };
    indexes: { 'by-month': string };
  };
  notifications: {
    key: string;
    value: {
      id: string;
      type: string;
      message: string;
      read: boolean;
      meta?: any;
      createdAt: string;
    };
    indexes: { 'by-type': string };
  };
}

let dbPromise: Promise<IDBPDatabase<MoneyTrackDB>>;

export const initDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<MoneyTrackDB>('MoneyTrackDB', 1, {
      upgrade(db) {
        // Transactions Store
        const transactionStore = db.createObjectStore('transactions', {
          keyPath: 'id',
        });
        transactionStore.createIndex('by-date', 'date');
        transactionStore.createIndex('by-type', 'type');

        // Goals Store
        db.createObjectStore('goals', { keyPath: 'id' });

        // Budgets Store
        const budgetStore = db.createObjectStore('budgets', {
          keyPath: 'id',
        });
        budgetStore.createIndex('by-month', 'month');

        // Notifications Store
        const notificationStore = db.createObjectStore('notifications', {
            keyPath: 'id'
        });
        notificationStore.createIndex('by-type', 'type');
      },
    });
  }
  return dbPromise;
};
