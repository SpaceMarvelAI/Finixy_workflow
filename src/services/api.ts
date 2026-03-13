import axios from 'axios';

// 1. Point to your running backend
const API_URL = 'http://localhost:8000/api/v1';

console.log('🔧 [API CONFIG] Base URL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 2. Automatically add the Token to every request
api.interceptors.request.use(
  (config) => {
    console.log('📤 [API REQUEST]', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
      headers: config.headers,
      data: config.data,
    });

    const token = sessionStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔑 [AUTH] Token attached to request');
    } else {
      console.warn('⚠️ [AUTH] No token found in sessionStorage');
    }
    return config;
  },
  (error) => {
    console.error('❌ [API REQUEST ERROR]', error);
    return Promise.reject(error);
  }
);

// 3. Response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log('✅ [API RESPONSE]', {
      status: response.status,
      statusText: response.statusText,
      url: response.config.url,
      data: response.data,
    });
    return response;
  },
  (error) => {
    console.error('❌ [API ERROR]', {
      message: error.message,
      code: error.code,
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      headers: error.response?.headers,
    });

    // CORS error detection
    if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
      console.error('🚫 [CORS ERROR] Backend is not responding or CORS is blocking the request');
      console.error('💡 [SOLUTION] Check if:');
      console.error('   1. Backend server is running on http://localhost:8000');
      console.error('   2. Backend has CORS enabled for http://localhost:3000');
      console.error('   3. No firewall is blocking the connection');
    }

    // Connection refused
    if (error.code === 'ECONNREFUSED' || error.message.includes('ERR_CONNECTION_REFUSED')) {
      console.error('🔌 [CONNECTION REFUSED] Backend server is not running');
      console.error('💡 [SOLUTION] Start your backend server on port 8000');
    }

    return Promise.reject(error);
  }
);

// 3. Define your API calls matches your backend
export const authService = {
  login: async (email: string, password: string) => {
    console.log('🔐 [AUTH] Attempting login for:', email);
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data.access_token) {
        sessionStorage.setItem('access_token', response.data.access_token);
        console.log('✅ [AUTH] Login successful, token saved');
      }
      return response.data;
    } catch (error) {
      console.error('❌ [AUTH] Login failed:', error);
      throw error;
    }
  },
  register: (data: any) => {
    console.log('📝 [AUTH] Attempting registration');
    return api.post('/auth/register', data);
  },
  
  logout: () => {
    console.log('👋 [AUTH] Logging out, removing token');
    sessionStorage.removeItem('access_token');
  },
};

export const chatService = {
  // Sends a new natural language query to the AI
  sendQuery: (query: string, chat_id?: string) => {
    console.log('💬 [CHAT] Sending query:', { query, chat_id });
    return api.post('/chat/query', { query, chat_id });
  },

  // Get list of all chat sessions for sidebar
  getChatHistory: async (limit: number = 50, offset: number = 0) => {
    console.log('📜 [CHAT] Fetching chat history:', { limit, offset });
    return api.get(`/chats?limit=${limit}&offset=${offset}`);
  },

  // Get specific chat with all messages
  getChatDetails: (chat_id: string) => {
    console.log('🔍 [CHAT] Fetching chat details:', chat_id);
    return api.get(`/chats/${chat_id}`);
  },

  // Update chat metadata (rename, pin/unpin)
  updateChat: (chat_id: string, data: { 
    session_title?: string; 
    pinned?: boolean;
    session_status?: string;
    summary?: string;
  }) => {
    console.log('✏️ [CHAT] Updating chat:', { chat_id, data });
    return api.put(`/chats/${chat_id}`, data);
  },

  // Delete a chat (soft delete)
  deleteChat: (chat_id: string) => {
    console.log('🗑️ [CHAT] Deleting chat:', chat_id);
    return api.delete(`/chats/${chat_id}`);
  },

  // Add a message to existing chat
  addMessage: (chat_id: string, role: string, content: string, metadata?: any) => {
    console.log('💬 [CHAT] Adding message:', { chat_id, role, content, metadata });
    return api.post(`/chats/${chat_id}/messages`, { role, content, metadata });
  },

  // DEPRECATED - Old workflow endpoints (kept for backward compatibility)
  getWorkflowHistory: async (limit: number = 50) => {
    console.log('📊 [WORKFLOW] Fetching workflow history:', limit);
    return api.get(`/workflows?limit=${limit}`);
  },
  updateWorkflow: (id: string | number, data: { name?: string; is_pinned?: boolean }) => {
    console.log('✏️ [WORKFLOW] Updating workflow:', { id, data });
    return api.put(`/workflows/${id}`, data);
  },
  getWorkflowDetails: (id: string) => {
    console.log('🔍 [WORKFLOW] Fetching workflow details:', id);
    return api.get(`/workflows/${id}`);
  },
  deleteWorkflow: (id: string | number) => {
    console.log('🗑️ [WORKFLOW] Deleting workflow:', id);
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
    console.log('📤 [DOCUMENT] Uploading file:', { fileName: file.name, fileSize: file.size, chat_id });
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
    console.log('📂 [DOCUMENT] Fetching all documents');
    return api.get('/documents/all-document-data-by-user-id');
  },

  // Fetches the list of uploaded documents
  list: (limit: number = 100) => {
    console.log('📋 [DOCUMENT] Listing documents:', limit);
    return api.get(`/documents?limit=${limit}`);
  },

  // Fetches the detailed parsed data for the preview table
  getDocument: (id: string) => {
    console.log('🔍 [DOCUMENT] Fetching document:', id);
    return api.get(`/documents/${id}`);
  },

  // Delete a document from storage and S3
  deleteDocument: (id: string) => {
    console.log('🗑️ [DOCUMENT] Deleting document:', id);
    return api.delete(`/documents/${id}`);
  },

  // Updates the parsed data
  updateDocumentData: (id: string, data: any) => {
    console.log('✏️ [DOCUMENT] Updating document data:', { id, data });
    return api.put(`/documents/${id}/canonical-data`, { canonical_data: data });
  },

  // Download original file - returns a URL string (used for direct window.open)
  getFileUrl: (id: string) => {
    const url = `${API_URL}/documents/${id}/download`;
    console.log('🔗 [DOCUMENT] Generated file URL:', url);
    return url;
  },

  // Download original file as blob (authenticated) — primary pattern
  downloadFile: (id: string) => {
    console.log('⬇️ [DOCUMENT] Downloading file:', id);
    return api.get(`/documents/${id}/download`, {
      responseType: 'blob',
    });
  },

  // Fallback download pattern if primary returns 404
  downloadFileAlt: (id: string) => {
    console.log('⬇️ [DOCUMENT] Downloading file (alt):', id);
    return api.get(`/documents/download/${id}`, {
      responseType: 'blob',
    });
  },
};

// Report Service - Fetch reports from backend
export const reportService = {
  // Get specific report by ID with full data
  getReport: async (report_id: string) => {
    console.log('📊 [REPORT] Fetching report:', report_id);
    return api.get(`/reports/${report_id}`);
  },

  // List all reports for current user
  listReports: async (limit: number = 50, offset: number = 0) => {
    console.log('📋 [REPORT] Listing reports:', { limit, offset });
    return api.get(`/reports?limit=${limit}&offset=${offset}`);
  },

  // Update a report
  updateReport: async (report_id: string, data: any) => {
    console.log('✏️ [REPORT] Updating report:', { report_id, data });
    return api.patch(`/reports/${report_id}`, data);
  },

  // Delete a report
  deleteReport: async (report_id: string) => {
    console.log('🗑️ [REPORT] Deleting report:', report_id);
    return api.delete(`/reports/${report_id}`);
  },

  // Legacy: Generate AP Register directly
  generateAPRegisterDirect: async () => {
    console.log('📊 [REPORT] Generating AP Register directly');
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