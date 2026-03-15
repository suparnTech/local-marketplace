// src/lib/api.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Constants from "expo-constants";

/**
 * Backend API Configuration
 * Auto-detects your machine's IP from Metro bundler — no manual updates needed!
 */
const getBaseUrl = () => {
  // In dev builds, hostUri gives us the Metro server host (your machine's LAN IP)
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  if (host) return `http://${host}:4000`;
  return "http://localhost:4000"; // fallback for web
};

export const BASE_URL = getBaseUrl();

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor — attach token + log
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
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
