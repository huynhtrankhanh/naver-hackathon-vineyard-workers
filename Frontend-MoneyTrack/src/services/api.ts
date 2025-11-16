/**
 * API Service for communicating with the backend
 */

// Use proxied API endpoint by default, fallback to direct URL from env or localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

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
  getSummary: () => apiCall<{ income: number; expenses: number; balance: number }>('/transactions/stats/summary'),
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
  contribute: (id: string, amount: number) => apiCall<any>(`/goals/${id}/contribute`, {
    method: 'POST',
    body: JSON.stringify({ amount }),
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

// Notification API
export const notificationApi = {
  // Get all notifications for the user
  getAll: () => apiCall<any[]>('/notifications'),
  // Create a new notification
  create: (payload: { type: string; message: string; meta?: Record<string, any> }) => 
    apiCall<any>('/notifications', {
      method: 'POST',
      body: JSON.stringify(payload),  
    }),
  // Mark a notification as read
  markAsRead: (id: string) =>
    apiCall<any>(`/notifications/${id}/read`, {
      method: 'PUT',
    }),
};
<<<<<<< Updated upstream
// Dán đoạn code này vào cuối file services/api.ts

// OCR API
=======
>>>>>>> Stashed changes
export const ocrApi = {
  /**
   * Tải file ảnh hóa đơn lên backend để phân tích.
   * @param file - File object của ảnh hóa đơn.
   * @returns Promise chứa dữ liệu đã được phân tích.
   */
  analyzeReceipt: async (file: File) => {
    const formData = new FormData();
    formData.append('receiptImage', file); // Key này phải khớp với backend

    const token = getAuthToken();
    const headers: Record<string, string> = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // ta phải dùng fetch() trực tiếp ở đây vì apiCall mặc định là 'application/json'
    // Còn upload file cần 'multipart/form-data' và để trình duyệt tự đặt header
    try {
      console.log("Đang gửi file lên backend endpoint: /ocr/receipt");
      const response = await fetch(`${API_BASE_URL}/ocr/receipt`, {
        method: 'POST',
        body: formData,
        headers: headers, // gửi Authorization header, Content-Type để trình duyệt tự xử lý
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API call failed: ${response.statusText}`);
      }
<<<<<<< Updated upstream
      
=======

>>>>>>> Stashed changes
      const result = await response.json();
      console.log("Backend đã trả về:", result);
      return result;

    } catch (error) {
      console.error("Lỗi khi gọi API phân tích hóa đơn:", error);
      throw error; // Ném lỗi ra ngoài để component bắt
    }
  }
<<<<<<< Updated upstream
};
=======
};
>>>>>>> Stashed changes
