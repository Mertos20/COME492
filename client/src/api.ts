import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api"
});

export const setApiToken = (token: string | null): void => {
  if (!token) {
    delete api.defaults.headers.common.Authorization;
    return;
  }

  api.defaults.headers.common.Authorization = `Bearer ${token}`;
};

api.interceptors.request.use((config) => {
  const lang = localStorage.getItem('i18nextLng') || 'tr';
  config.headers['Accept-Language'] = lang;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error Response:", error.response?.data, error.message);
    return Promise.reject(error);
  }
);
