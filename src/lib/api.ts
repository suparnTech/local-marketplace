// src/lib/api.ts
import axios from "axios";

/**
 * Backend API Configuration
 * Make sure this matches your machine's LAN IP
 * Run `ifconfig | grep "inet "` to find your IP
 */
export const BASE_URL = "http://172.24.121.202:4000";

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000, // Increased to 15 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    if (error.code === 'ECONNABORTED') {
      console.error('⏱️ Request timeout - backend might be slow or unreachable');
    } else if (error.response) {
      console.error(`❌ API Error: ${error.response.status} ${error.config.url}`);
    } else if (error.request) {
      console.error('❌ No response from server - check if backend is running');
    } else {
      console.error('❌ Request setup error:', error.message);
    }
    return Promise.reject(error);
  }
);
