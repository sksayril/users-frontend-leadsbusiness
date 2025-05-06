import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

const API_BASE_URL = 'https://7cvccltb-3600.inc1.devtunnels.ms/api';

// Create an Axios instance with default configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle common response patterns
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Handle 204 No Content and 205 Reset Content responses
    if (response.status === 204 || response.status === 205) {
      // For endpoints that return no content, provide a default response structure
      // This prevents errors when code tries to access response.data when none exists
      if (!response.data) {
        response.data = {
          success: true,
          message: response.status === 204 ? "Operation completed successfully" : "Content reset successfully"
        };
      }
    }
    return response;
  },
  (error: AxiosError) => {
    // Handle error responses
    if (error.response && error.response.status === 401) {
      // Handle authentication errors (optional)
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    // Special handling for insufficient balance errors
    if (error.response && error.response.status === 400) {
      const errorData = error.response.data as any;
      const errorMessage = errorData?.message || '';
      
      // Check for specific error conditions indicating insufficient balance
      if ((errorData?.insufficientCoins) || 
          (errorData?.balance === "too low") ||
          (errorMessage.includes("Insufficient coins") || 
           errorMessage.includes("Failed to deduct coins"))) {
        
        // Enhance the error object with our custom properties
        const enhancedError: any = error;
        enhancedError.insufficientBalance = true;
        enhancedError.message = errorMessage || 'Insufficient balance';
        enhancedError.redirectToDashboard = true;
        enhancedError.redirectToWallet = true;
        
        return Promise.reject(enhancedError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api; 