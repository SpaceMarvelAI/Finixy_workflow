import axios from 'axios';

// 1. Point to your running backend
const API_URL = 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 2. Automatically add the Token to every request
api.interceptors.request.use((config) => {
  // ✅ CHANGED: Now checking sessionStorage
  const token = sessionStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 3. Define your API calls matches your backend
export const authService = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.access_token) {
      // ✅ CHANGED: Now saving to sessionStorage
      sessionStorage.setItem('access_token', response.data.access_token);
    }
    return response.data;
  },
  register: (data: any) => api.post('/auth/register', data),
  
  // ✅ CHANGED: Now removing from sessionStorage
  logout: () => sessionStorage.removeItem('access_token'),
};

export const chatService = {
  // Sends a new natural language query to the AI
  sendQuery: (query: string) => api.post('/chat/query', { query }),

  // Fetches the list of all previous workflows for the sidebar
  getWorkflowHistory: async (limit: number = 50) => {
    return api.get(`/workflows?limit=${limit}`);
  },

  // NEW: Updates an existing workflow (Rename or Pin)
  updateWorkflow: (id: string | number, data: { name?: string; is_pinned?: boolean }) => {
    return api.put(`/workflows/${id}`, data);
  },

  // Add this inside chatService in api.ts
  getWorkflowDetails: (id: string) => {
    return api.get(`/workflows/${id}`);
  },

  // Deletes a workflow from the database
  deleteWorkflow: (id: string | number) => {
    return api.delete(`/workflows/${id}`);
  }
};

export const companyService = {
  // This matches your PUT /company/setup endpoint
  updateSetup: (data: any) => api.put('/company/setup', data),
};

export default api;

export const documentService = {
  // Uploads a file (requires multipart/form-data)
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  // Fetches the list of uploaded documents
  list: (limit: number = 100) => {
    return api.get(`/documents?limit=${limit}`);
  },

  // Fetches the detailed parsed data for the preview table
  getDocument: (id: string) => {
    return api.get(`/documents/${id}`);
  }
};