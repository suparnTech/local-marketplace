// src/lib/api.ts
import axios from "axios";

/**
 * IMPORTANT: replace with your machine's LAN IP so your phone can reach it.
 * Example: http://192.168.1.10:4000
 */
const BASE_URL = "http://172.24.123.170:4000";

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 8000,
});
