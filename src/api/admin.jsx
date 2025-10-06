import axios from 'axios';

const API_URL = 'http://localhost:3000/api/admin';

// Toggle this if you switch between localStorage JWT and httpOnly cookies
const USE_COOKIES = false; // set to true if backend uses cookies instead of Authorization header

// Key under which the token is stored (must match AuthContext/login flow)
const TOKEN_STORAGE_KEY = 'authToken';

const getAuthToken = () => {
  try {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    console.debug('[admin api] Retrieved token from localStorage:', token ? 'present' : 'missing');
    return token || null;
  } catch (err) {
    console.error('[admin api] Failed to read token from localStorage:', err);
    return null;
  }
};

// Create axios instance
const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: USE_COOKIES, // false when using Authorization header with localStorage JWT
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach Authorization header if token exists
apiClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (!USE_COOKIES && token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.debug('[admin api] Attached Authorization header.');
    } else if (!USE_COOKIES) {
      console.warn('[admin api] No token found; Authorization header not attached.');
    }
    return config;
  },
  (error) => {
    console.error('[admin api] Request setup error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor: log 401s for easier debugging
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response) {
      console.error('[admin api] Response error:', {
        status: error.response.status,
        url: error.config?.url,
        method: error.config?.method,
        data: error.response.data,
      });
    } else {
      console.error('[admin api] Network/unknown error:', error.message || error);
    }
    return Promise.reject(error);
  }
);

// Helper to unwrap data and rethrow with logging
const unwrap = async (promise, fallbackMessage) => {
  try {
    const response = await promise;
    return response.data;
  } catch (error) {
    console.error(`[admin api] ${fallbackMessage}:`, error?.response?.data || error?.message || error);
    throw error?.response?.data || { message: fallbackMessage };
  }
};

// Get pending doctors
export const getPendingDoctors = () =>
  unwrap(apiClient.get('/doctors/pending'), 'Failed to fetch pending doctors');

// Get all doctors
export const getAllDoctors = () =>
  unwrap(apiClient.get('/doctors/all'), 'Failed to fetch doctors');

// Approve doctor
export const approveDoctor = (doctorId) =>
  unwrap(apiClient.post(`/doctors/${doctorId}/approve`), 'Failed to approve doctor');

// Reject doctor
export const rejectDoctor = (doctorId, reason = '') =>
  unwrap(apiClient.post(`/doctors/${doctorId}/reject`, { reason }), 'Failed to reject doctor');

// Get doctor certificate (returns path/URL)
export const getDoctorCertificate = (doctorId) =>
  unwrap(apiClient.get(`/doctors/${doctorId}/certificate`), 'Failed to fetch certificate');
