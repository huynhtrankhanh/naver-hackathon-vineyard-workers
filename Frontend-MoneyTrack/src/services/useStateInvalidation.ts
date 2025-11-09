/**
 * React Hook for State Invalidation
 * 
 * Provides easy-to-use React hook for managing data fetching with invalidation
 */

import { useEffect, useCallback, useRef } from 'react';
import { stateInvalidation } from './stateInvalidation';

type DataType = 'transactions' | 'goals' | 'budgets' | 'summary';

interface UseInvalidationOptions {
  dataType: DataType;
  fetchData: () => Promise<void>;
}

/**
 * Hook that manages data fetching with automatic invalidation
 * 
 * Features:
 * - Fetches on mount
 * - Refetches when user returns to page
 * - Polls every 5 seconds when page is active
 * - Refetches when data is invalidated
 */
export function useStateInvalidation({
  dataType,
  fetchData,
}: UseInvalidationOptions) {
  const isMounted = useRef(true);
  const fetchInProgress = useRef(false);

  // Wrap fetchData to handle invalidation tracking
  const fetchWithInvalidation = useCallback(async () => {
    // Prevent concurrent fetches
    if (fetchInProgress.current) {
      return;
    }

    try {
      fetchInProgress.current = true;
      await fetchData();
      stateInvalidation.markFetched(dataType);
    } finally {
      fetchInProgress.current = false;
    }
  }, [dataType, fetchData]);

  // Fetch if needs refetch
  const fetchIfNeeded = useCallback(async () => {
    if (stateInvalidation.needsRefetch(dataType)) {
      await fetchWithInvalidation();
    }
  }, [dataType, fetchWithInvalidation]);

  // Set up effects
  useEffect(() => {
    isMounted.current = true;

    // Initial fetch
    fetchWithInvalidation();

    // Set up periodic polling
    const cleanupPolling = stateInvalidation.setupPolling(dataType, fetchIfNeeded);

    // Set up page return handler
    const cleanupPageReturn = stateInvalidation.onPageReturn(dataType, fetchIfNeeded);

    // Cleanup on unmount
    return () => {
      isMounted.current = false;
      cleanupPolling();
      cleanupPageReturn();
    };
  }, [dataType, fetchWithInvalidation, fetchIfNeeded]);

  return {
    refetch: fetchWithInvalidation,
  };
}

/**
 * Hook to invalidate state after mutations
 */
export function useInvalidateOnMutation() {
  return useCallback(() => {
    stateInvalidation.onMutation();
  }, []);
}
