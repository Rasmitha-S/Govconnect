import axios from 'axios';

export const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Authorization Bearer token from localStorage
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('govconnect_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle unauthenticated 401
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('govconnect_token');
      localStorage.removeItem('govconnect_user');
      // Only redirect if not already on public/auth routes
      if (!['/', '/login', '/register', '/services', '/how-it-works', '/verify-email'].includes(window.location.pathname)) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Unified API Service endpoints
export const authApi = {
  login: (data: any) => apiClient.post('/auth/login', data).then((res) => res.data),
  register: (data: any) => apiClient.post('/auth/register', data).then((res) => res.data),
  registerCitizen: (data: any) => apiClient.post('/auth/register', data).then((res) => res.data),
  registerOfficer: (data: any) => apiClient.post('/auth/register/officer', data).then((res) => res.data),
  registerAdmin: (data: any) => apiClient.post('/auth/register/admin', data).then((res) => res.data),
  verifyEmail: (token: string, email?: string) =>
    apiClient.get(`/auth/verify-email?token=${token}${email ? `&email=${encodeURIComponent(email)}` : ''}`).then((res) => res.data),
  forgotPassword: (email: string) => apiClient.post('/auth/forgot-password', { email }).then((res) => res.data),
  resetPassword: (data: any) => apiClient.post('/auth/reset-password', data).then((res) => res.data),
  changePassword: (data: any) => apiClient.post('/auth/change-password', data).then((res) => res.data),
  me: () => apiClient.get('/auth/me').then((res) => res.data),
  logout: () => apiClient.post('/auth/logout').then((res) => res.data),
};

export const serviceApi = {
  listServices: (params?: any) => apiClient.get('/services', { params }).then((res) => res.data),
  getService: (id: string) => apiClient.get(`/services/${id}`).then((res) => res.data),
  listCategories: () => apiClient.get('/services/categories').then((res) => res.data),
  listDepartments: () => apiClient.get('/services/departments').then((res) => res.data),
};

export const applicationApi = {
  createWaterApplication: (data: any) => apiClient.post('/applications/water', data).then((res) => res.data),
  createDrivingLicenceApplication: (data: any) => apiClient.post('/applications/driving-licence', data).then((res) => res.data),
  listCitizenApplications: () => apiClient.get('/applications').then((res) => res.data),
  getApplicationDetail: (id: string) => apiClient.get(`/applications/${id}`).then((res) => res.data),
  getTimeline: (id: string) => apiClient.get(`/applications/${id}/timeline`).then((res) => res.data),
  syncStatus: (id: string) => apiClient.post(`/applications/${id}/sync-status`).then((res) => res.data),
};

export const consentApi = {
  listConsents: () => apiClient.get('/consent').then((res) => res.data),
  revokeConsent: (id: string, reason?: string) => apiClient.post(`/consent/${id}/revoke`, { reason }).then((res) => res.data),
  getHistory: (id: string) => apiClient.get(`/consent/${id}/history`).then((res) => res.data),
};

export const officerApi = {
  listApplications: (params?: any) => apiClient.get('/officer/applications', { params }).then((res) => res.data),
  processDecision: (id: string, data: { decision: string; remarks: string }) =>
    apiClient.post(`/officer/applications/${id}/decision`, data).then((res) => res.data),
  getStats: () => apiClient.get('/officer/stats').then((res) => res.data),
};

export const grievanceApi = {
  submit: (data: any) => apiClient.post('/grievances', data).then((res) => res.data),
  listMy: () => apiClient.get('/grievances/my').then((res) => res.data),
  listDepartment: () => apiClient.get('/grievances/department').then((res) => res.data),
  resolve: (id: string, data: any) => apiClient.patch(`/grievances/${id}/resolve`, data).then((res) => res.data),
};

export const paymentApi = {
  simulate: (data: { applicationId: string; amount: number; paymentMethod?: string }) =>
    apiClient.post('/payments/simulate', data).then((res) => res.data),
};

export const aiApi = {
  detectService: (query: string) => apiClient.post('/ai/service-detect', { query }).then((res) => res.data),
  assistantChat: (message: string, conversationHistory?: any[]) =>
    apiClient.post('/ai/assistant', { message, conversationHistory }).then((res) => res.data),
  classifyGrievance: (text: string) => apiClient.post('/ai/grievance-classify', { text }).then((res) => res.data),
};

export const connectorApi = {
  listConnectors: () => apiClient.get('/connectors').then((res) => res.data),
  getHealth: (id: string) => apiClient.get(`/connectors/${id}/health`).then((res) => res.data),
  triggerHealthCheck: (id: string) => apiClient.post(`/connectors/${id}/health-check`).then((res) => res.data),
  simulateStatus: (id: string, data: { status: string; failureRate?: number }) =>
    apiClient.post(`/connectors/${id}/simulate-status`, data).then((res) => res.data),
};

export const notificationApi = {
  list: () => apiClient.get('/notifications').then((res) => res.data),
  markRead: (id: string) => apiClient.patch(`/notifications/${id}/read`).then((res) => res.data),
  markAllRead: () => apiClient.post('/notifications/read-all').then((res) => res.data),
};

export const adminApi = {
  getMetrics: () => apiClient.get('/admin/metrics').then((res) => res.data),
  getAuditLogs: (params?: any) => apiClient.get('/admin/audit-logs', { params }).then((res) => res.data),
  listUsers: () => apiClient.get('/admin/users').then((res) => res.data),
  getRegistrationRequests: (params?: any) => apiClient.get('/admin/registration-requests', { params }).then((res) => res.data),
  approveRegistrationRequest: (userId: string) => apiClient.post(`/admin/registration-requests/${userId}/approve`).then((res) => res.data),
  rejectRegistrationRequest: (userId: string, reason?: string) => apiClient.post(`/admin/registration-requests/${userId}/reject`, { reason }).then((res) => res.data),
};

export const digilockerApi = {
  getStatus: () => apiClient.get('/integrations/digilocker/status').then((res) => res.data),
  initiateConsent: (serviceCode: string, returnUrl?: string) =>
    apiClient.post('/integrations/digilocker/initiate', { serviceCode, returnUrl }).then((res) => res.data),
  completeRepresentative: (sessionId: string) =>
    apiClient.post('/integrations/digilocker/complete-representative', { sessionId }).then((res) => res.data),
  getSessionData: (sessionId: string) =>
    apiClient.get(`/integrations/digilocker/session/${sessionId}`).then((res) => res.data),
  denyConsent: (sessionId: string) =>
    apiClient.post('/integrations/digilocker/deny', { sessionId }).then((res) => res.data),
  revokeConsent: (consentId: string) =>
    apiClient.post(`/integrations/digilocker/revoke/${consentId}`).then((res) => res.data),
};
