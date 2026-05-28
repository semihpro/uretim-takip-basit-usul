import axios from 'axios'
import { useAuthStore } from '@/lib/auth'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - add token from Zustand store
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor - handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  loginBadge: (badgeId: string, pin: string) =>
    api.post('/auth/login-badge', { badgeId, pin }),
  getMe: () => api.get('/auth/me'),
}

// Products API
export const productsApi = {
  list: () => api.get('/products'),
  tree: () => api.get('/products/tree'),
  get: (id: string) => api.get(`/products/${id}`),
  create: (data: any) => api.post('/products', data),
  update: (id: string, data: any) => api.put(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
  addRoute: (id: string, data: any) => api.post(`/products/${id}/routes`, data),
}

// Workstations API
export const workstationsApi = {
  list: () => api.get('/workstations'),
  get: (id: string) => api.get(`/workstations/${id}`),
  create: (data: any) => api.post('/workstations', data),
  update: (id: string, data: any) => api.put(`/workstations/${id}`, data),
  delete: (id: string) => api.delete(`/workstations/${id}`),
  seedDefaults: () => api.post('/workstations/seed-defaults'),
}

// Orders API
export const ordersApi = {
  list: (params?: { status?: string; limit?: number }) =>
    api.get('/orders', { params }),
  get: (id: string) => api.get(`/orders/${id}`),
  create: (data: any) => api.post('/orders', data),
  update: (id: string, data: any) => api.put(`/orders/${id}`, data),
  confirm: (id: string) => api.post(`/orders/${id}/confirm`),
  cancel: (id: string) => api.post(`/orders/${id}/cancel`),
  progress: (id: string) => api.get(`/orders/${id}/progress`),
}

// Scans API
export const scansApi = {
  scan: (barcode: string, workstationId: string, deviceId?: string) =>
    api.post('/scans', { barcode, workstationId, deviceId }),
  scanReject: (barcode: string, workstationId: string, reason: string, deviceId?: string) =>
    api.post('/scans', { barcode, workstationId, deviceId, result: 'rejected', reason }),
  getRejectionReasons: () => api.get('/scans/rejection-reasons'),
  search: (barcode: string) => api.get('/scans/search', { params: { barcode } }),
  history: (params?: { limit?: number; workstationId?: string }) =>
    api.get('/scans/history', { params }),
}

// Dashboard API
export const dashboardApi = {
  stats: () => api.get('/dashboard/stats'),
  recentOrders: () => api.get('/dashboard/recent-orders'),
  recentScans: () => api.get('/dashboard/recent-scans'),
}

// Units API
export const unitsApi = {
  search: (barcode: string) => api.get('/units/search', { params: { barcode } }),
  get: (id: string) => api.get(`/units/${id}`),
}

// Users API
export const usersApi = {
  list: () => api.get('/users'),
  get: (id: string) => api.get(`/users/${id}`),
  create: (data: any) => api.post('/users', data),
  update: (id: string, data: any) => api.put(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
}

// Excel API
export const excelApi = {
  importProducts: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/excel/import-products', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  getTemplate: () => api.get('/excel/template'),
}
