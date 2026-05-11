import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('fitcore_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Global error handling
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('fitcore_token');
      window.location.href = '/login';
    } else if (err.response?.status !== 404) {
      toast.error(err.response?.data?.error || 'Something went wrong');
    }
    return Promise.reject(err);
  }
);

// ── Members ────────────────────────────────────
export const membersApi = {
  list: (params) => api.get('/members', { params }),
  get: (id) => api.get(`/members/${id}`),
  create: (data) => api.post('/members', data),
  update: (id, data) => api.put(`/members/${id}`, data),
  stats: () => api.get('/members/stats'),
  renewalInfo: (id) => api.get(`/members/${id}/renewal-info`),
  initiateRenewal: (id, data) => api.post(`/members/${id}/renew/initiate`, data),
  completeRenewal: (id, data) => api.post(`/members/${id}/renew/complete`, data),
};

// ── Billing ────────────────────────────────────
export const billingApi = {
  list: (params) => api.get('/billing', { params }),
  stats: () => api.get('/billing/stats'),
  invoice: (id) => api.get(`/billing/${id}/invoice`, { responseType: 'blob' }),
};

// ── Attendance ─────────────────────────────────
export const attendanceApi = {
  generateQR: (memberId) => api.get(`/attendance/qr/${memberId}`),
  checkIn: (data) => api.post('/attendance/checkin', data),
  list: (params) => api.get('/attendance', { params }),
  today: () => api.get('/attendance/today'),
};

// ── Classes ────────────────────────────────────
export const classesApi = {
  list: (params) => api.get('/classes', { params }),
  create: (data) => api.post('/classes', data),
  sessions: (params) => api.get('/classes/sessions', { params }),
  book: (data) => api.post('/classes/bookings', data),
  cancelBooking: (id) => api.delete(`/classes/bookings/${id}`),
};

// ── Dashboard ──────────────────────────────────
export const dashboardApi = {
  get: (params) => api.get('/dashboard', { params }),
};

// ── AI ─────────────────────────────────────────
export const aiApi = {
  insights: (params) => api.get('/ai/insights', { params }),
  ask: (question, context) => api.post('/ai/ask', { question, context }),
};

// ── Branches ───────────────────────────────────
export const branchesApi = {
  list: () => api.get('/branches'),
  create: (data) => api.post('/branches', data),
};

// ── Trainers ───────────────────────────────────
export const trainersApi = {
  list: () => api.get('/trainers'),
  update: (id, data) => api.put(`/trainers/${id}`, data),
};

// ── Auth ───────────────────────────────────────
export const authApi = {
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  changePassword: (data) => api.put('/auth/change-password', data),
  createUser: (data) => api.post('/auth/users', data),
};

export default api;
