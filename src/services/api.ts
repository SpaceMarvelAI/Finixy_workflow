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
  sendQuery: (query: string, chat_id?: string) => 
    api.post('/chat/query', { query, chat_id }),

  // Get list of all chat sessions for sidebar
  getChatHistory: async (limit: number = 50, offset: number = 0) => {
    return api.get(`/chats?limit=${limit}&offset=${offset}`);
  },

  // Get specific chat with all messages
  getChatDetails: (chat_id: string) => {
    return api.get(`/chats/${chat_id}`);
  },

  // Update chat metadata (rename, pin/unpin)
  updateChat: (chat_id: string, data: { 
    session_title?: string; 
    pinned?: boolean;
    session_status?: string;
    summary?: string;
  }) => {
    return api.put(`/chats/${chat_id}`, data);
  },

  // Delete a chat (soft delete)
  deleteChat: (chat_id: string) => {
    return api.delete(`/chats/${chat_id}`);
  },

  // Add a message to existing chat
  addMessage: (chat_id: string, role: string, content: string, metadata?: any) => {
    return api.post(`/chats/${chat_id}/messages`, { role, content, metadata });
  },

  // DEPRECATED - Old workflow endpoints (kept for backward compatibility)
  getWorkflowHistory: async (limit: number = 50) => {
    return api.get(`/workflows?limit=${limit}`);
  },
  updateWorkflow: (id: string | number, data: { name?: string; is_pinned?: boolean }) => {
    return api.put(`/workflows/${id}`, data);
  },
  getWorkflowDetails: (id: string) => {
    return api.get(`/workflows/${id}`);
  },
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
  upload: (file: File, chat_id?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (chat_id) {
      formData.append('chat_id', chat_id);
    }
    return api.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  // Get all documents uploaded by the current user
  getAllDocuments: () => {
    return api.get('/documents/all-document-data-by-user-id');
  },

  // Fetches the list of uploaded documents
  list: (limit: number = 100) => {
    return api.get(`/documents?limit=${limit}`);
  },

  // Fetches the detailed parsed data for the preview table
  getDocument: (id: string) => {
    return api.get(`/documents/${id}`);
  },

  // Delete a document from storage and S3
  deleteDocument: (id: string) => {
    return api.delete(`/documents/${id}`);
  },

  // Updates the parsed data
  updateDocumentData: (id: string, data: any) => {
    return api.put(`/documents/${id}/canonical-data`, { canonical_data: data });
  },

  // Download original file - returns a URL string (used for direct window.open)
  getFileUrl: (id: string) => {
    return `${API_URL}/documents/${id}/download`;
  },

  // Download original file as blob (authenticated) — primary pattern
  downloadFile: (id: string) => {
    return api.get(`/documents/${id}/download`, {
      responseType: 'blob',
    });
  },

  // Fallback download pattern if primary returns 404
  downloadFileAlt: (id: string) => {
    return api.get(`/documents/download/${id}`, {
      responseType: 'blob',
    });
  },
};

// Report Service - Fetch reports from backend
export const reportService = {
  // Get specific report by ID with full data
  getReport: async (report_id: string) => {
    return api.get(`/reports/${report_id}`);
  },

  // List all reports for current user
  listReports: async (limit: number = 50, offset: number = 0) => {
    return api.get(`/reports?limit=${limit}&offset=${offset}`);
  },

  // Update a report
  updateReport: async (report_id: string, data: any) => {
    return api.patch(`/reports/${report_id}`, data);
  },

  // Delete a report
  deleteReport: async (report_id: string) => {
    return api.delete(`/reports/${report_id}`);
  },

  // Legacy: Generate AP Register directly
  generateAPRegisterDirect: async () => {
    const token = sessionStorage.getItem('access_token');
    return axios.post(
      'http://localhost:8000/api/v1/reports/ap-register/direct',
      {},
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
  }
};