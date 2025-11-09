/**
 * API Service for communicating with the backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Get auth token from localStorage
function getAuthToken(): string | null {
  return localStorage.getItem('authToken');
}

// Helper function for API calls
async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Add custom headers from options
  if (options?.headers) {
    Object.assign(headers, options.headers);
  }

  // Add auth token if available
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API call failed: ${response.statusText}`);
  }

  return response.json();
}

// Transaction API
export const transactionApi = {
  getAll: () => apiCall<any[]>('/transactions'),
  getById: (id: string) => apiCall<any>(`/transactions/${id}`),
  create: (data: any) => apiCall<any>('/transactions', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => apiCall<any>(`/transactions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => apiCall<any>(`/transactions/${id}`, {
    method: 'DELETE',
  }),
  getSummary: () => apiCall<{ income: number; expenses: number; savings: number }>('/transactions/stats/summary'),
};

// Goals API
export const goalsApi = {
  getAll: () => apiCall<any[]>('/goals'),
  getById: (id: string) => apiCall<any>(`/goals/${id}`),
  create: (data: any) => apiCall<any>('/goals', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => apiCall<any>(`/goals/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => apiCall<any>(`/goals/${id}`, {
    method: 'DELETE',
  }),
};

// Budget API
export const budgetApi = {
  getAll: () => apiCall<any[]>('/budgets'),
  getByMonth: (month: string) => apiCall<any[]>(`/budgets/month/${month}`),
  create: (data: any) => apiCall<any>('/budgets', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => apiCall<any>(`/budgets/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => apiCall<any>(`/budgets/${id}`, {
    method: 'DELETE',
  }),
};

// AI API (Mock)
export const aiApi = {
  generateSavingsPlan: (data: {
    goal: string;
    savingsGoal?: number;
    intensity: string;
    notes?: string;
  }) => apiCall<any>('/ai/generate', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getLatestPlan: () => apiCall<any>('/ai/latest'),
  getAllPlans: () => apiCall<any[]>('/ai'),
  getAdvice: (context: string) => apiCall<{ advice: string }>('/ai/advice', {
    method: 'POST',
    body: JSON.stringify({ context }),
  }),
};

// Auth API
export const authApi = {
  register: (username: string, passwordHash: string) =>
    apiCall<{ message: string; token: string; username: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, passwordHash }),
    }),
  login: (username: string, passwordHash: string) =>
    apiCall<{ message: string; token: string; username: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, passwordHash }),
    }),
  verify: () => apiCall<{ valid: boolean; username: string }>('/auth/verify'),
  logout: () =>
    apiCall<{ message: string }>('/auth/logout', {
      method: 'POST',
    }),
  
  // Helper methods for token management
  setToken: (token: string) => {
    localStorage.setItem('authToken', token);
  },
  getToken: () => {
    return localStorage.getItem('authToken');
  },
  removeToken: () => {
    localStorage.removeItem('authToken');
  },
  isAuthenticated: () => {
    return !!localStorage.getItem('authToken');
  },
};
