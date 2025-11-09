/**
 * State Invalidation Service
 * 
 * Manages when to refetch data from backend:
 * 1. When user modifies backend state
 * 2. When user returns to a page after leaving
 * 3. Periodically every 5 seconds when page is active
 * 
 * When ANY backend state is modified, ALL state is invalidated.
 */

type DataType = 'transactions' | 'goals' | 'budgets' | 'summary' | 'all';

interface InvalidationState {
  lastFetch: Record<string, number>;
  invalidated: Set<string>;
  pageVisibilityCallbacks: Map<string, () => void>;
  pollingIntervals: Map<string, number>;
}

class StateInvalidationService {
  private state: InvalidationState = {
    lastFetch: {},
    invalidated: new Set(),
    pageVisibilityCallbacks: new Map(),
    pollingIntervals: new Map(),
  };

  private POLLING_INTERVAL = 5000; // 5 seconds

  constructor() {
    // Set up page visibility listener
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }
  }

  /**
   * Mark data type as fetched
   */
  markFetched(dataType: DataType) {
    this.state.lastFetch[dataType] = Date.now();
    this.state.invalidated.delete(dataType);
  }

  /**
   * Invalidate specific data type or all data
   */
  invalidate(dataType: DataType = 'all') {
    if (dataType === 'all') {
      // Invalidate everything
      this.state.invalidated = new Set(['transactions', 'goals', 'budgets', 'summary']);
    } else {
      this.state.invalidated.add(dataType);
    }
  }

  /**
   * Check if data type needs refetch
   */
  needsRefetch(dataType: DataType): boolean {
    // If explicitly invalidated, needs refetch
    if (this.state.invalidated.has(dataType)) {
      return true;
    }

    // If never fetched, needs refetch
    if (!this.state.lastFetch[dataType]) {
      return true;
    }

    // If more than 5 seconds old, needs refetch
    const timeSinceLastFetch = Date.now() - this.state.lastFetch[dataType];
    return timeSinceLastFetch >= this.POLLING_INTERVAL;
  }

  /**
   * Called when backend state is modified
   * Invalidates ALL backend state
   */
  onMutation() {
    this.invalidate('all');
  }

  /**
   * Set up periodic polling for a page
   * Returns cleanup function
   */
  setupPolling(dataType: DataType, callback: () => void): () => void {
    const pollId = `${dataType}-${Date.now()}`;
    
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        callback();
      }
    }, this.POLLING_INTERVAL);

    this.state.pollingIntervals.set(pollId, intervalId);

    // Return cleanup function
    return () => {
      const id = this.state.pollingIntervals.get(pollId);
      if (id) {
        clearInterval(id);
        this.state.pollingIntervals.delete(pollId);
      }
    };
  }

  /**
   * Register callback for page visibility changes
   * Returns cleanup function
   */
  onPageReturn(dataType: string, callback: () => void): () => void {
    const key = `${dataType}-${Date.now()}`;
    this.state.pageVisibilityCallbacks.set(key, callback);

    // Return cleanup function
    return () => {
      this.state.pageVisibilityCallbacks.delete(key);
    };
  }

  /**
   * Handle page visibility changes
   */
  private handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      // Page became visible, trigger all callbacks
      this.state.pageVisibilityCallbacks.forEach(callback => {
        callback();
      });
    }
  }

  /**
   * Clean up all listeners
   */
  cleanup() {
    // Clear all polling intervals
    this.state.pollingIntervals.forEach(id => clearInterval(id));
    this.state.pollingIntervals.clear();
    
    // Clear all callbacks
    this.state.pageVisibilityCallbacks.clear();
    
    // Remove visibility listener
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }
  }
}

// Export singleton instance
export const stateInvalidation = new StateInvalidationService();
