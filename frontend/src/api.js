import axios from 'axios';

// Dynamically determine backend URL
// In development, the Vite server proxies '/api' to 'http://localhost:8000'
// In production, we'll read VITE_API_URL or fall back to window.location.origin
const getBaseURL = () => {
  if (import.meta.env.DEV) {
    return '/api';
  }
  return import.meta.env.VITE_API_URL || '';
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
