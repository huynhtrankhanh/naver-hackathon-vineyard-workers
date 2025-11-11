import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { transactionApi } from './api';
import { useStateInvalidation } from './useStateInvalidation';

type Summary = {
  income: number;
  expenses: number;
  balance: number;
};

type BalanceContextValue = {
  income: number;
  expenses: number;
  balance: number;
  summary: Summary | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const BalanceContext = createContext<BalanceContextValue | undefined>(undefined);

export const BalanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true);

  const fetchSummary = useCallback(async () => {
    try {
      if (isInitialLoad) setLoading(true);
      const res = await transactionApi.getSummary();
      setSummary(res);
      setError(null);
    } catch (e: any) {
      console.error('Failed to fetch summary:', e);
      setError(e?.message || 'Failed to fetch summary');
    } finally {
      if (isInitialLoad) {
        setLoading(false);
        setIsInitialLoad(false);
      }
    }
  }, [isInitialLoad]);

  // Use the shared invalidation/polling system to keep summary fresh every 5s
  const { refetch } = useStateInvalidation({ dataType: 'summary', fetchData: fetchSummary });

  const value = useMemo<BalanceContextValue>(() => ({
    income: summary?.income ?? 0,
    expenses: summary?.expenses ?? 0,
    balance: summary?.balance ?? 0,
    summary,
    loading,
    error,
    refresh: refetch,
  }), [summary, loading, error, refetch]);

  return (
    <BalanceContext.Provider value={value}>
      {children}
    </BalanceContext.Provider>
  );
};

export function useBalance() {
  const ctx = useContext(BalanceContext);
  if (!ctx) {
    throw new Error('useBalance must be used within a BalanceProvider');
  }
  return ctx;
}
