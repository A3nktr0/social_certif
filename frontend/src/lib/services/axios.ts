import axios from "axios";
import { getCSRFToken } from "@/lib/services/csrf"; 

// This file contains the axios instance used for making API requests.
// It is configured to include credentials (cookies) in requests.
// This is important for authentication, especially when using JWTs stored in cookies.
// The base URL is set to "/api", which is the endpoint for the backend API.

const api = axios.create({
  baseURL: "/api",
  withCredentials: true, // include cookies (JWT)
});

// Add a request interceptor to log requests and add CSRF token for mutations
api.interceptors.request.use(
  async (config) => {
    console.log(`[Axios] ${config.method?.toUpperCase()} request to: ${config.url}`);
    
    // For mutation requests, add CSRF token from cookie
    if (config.method && ['post', 'put', 'delete', 'patch'].includes(config.method)) {
      const token = getCSRFToken();
      
      if (token) {
        config.headers['X-CSRF-Token'] = token;
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
