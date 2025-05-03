import api from './api';

export interface UserSignupData {
  name: string;
  email: string;
  password: string;
  securityQuestion: string;
  securityAnswer: string;
}

export interface UserLoginData {
  email: string;
  password: string;
}

export interface ResetPasswordData {
  email: string;
  securityAnswer: string;
  newPassword: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    wallet?: {
      balance: number;
      leadsCoins: number;
      transactions: Array<any>;
    };
    subscription?: {
      isActive: boolean;
      startDate?: string;
      endDate?: string;
      plan?: string;
    };
  };
}

// User type definition
export interface User {
  name: string;
  email: string;
  wallet?: {
    balance: number;
    leadsCoins: number;
  };
  subscription?: {
    isActive: boolean;
    startDate: string;
    endDate: string;
    plan: string;
  };
}

// Extended user profile type with additional fields
export interface UserProfile extends User {
  _id: string;
  securityQuestion: string;
  securityAnswer: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

const authService = {
  // User Signup
  signup: async (userData: UserSignupData): Promise<AuthResponse> => {
    const response = await api.post('/users/signup', userData);
    return response.data;
  },
  
  // User Login
  login: async (credentials: UserLoginData): Promise<AuthResponse> => {
    const response = await api.post('/users/login', credentials);
    return response.data;
  },
  
  // Reset Password
  resetPassword: async (resetData: ResetPasswordData): Promise<{ message: string }> => {
    const response = await api.post('/users/reset-password', resetData);
    return response.data;
  },
  
  // Get User Profile
  getProfile: async (): Promise<{ user: AuthResponse['user'] }> => {
    const response = await api.get('/users/profile');
    return response.data;
  },
  
  // Logout
  logout: (): void => {
    // Clear all localStorage items (this will remove 'hasLoggedInBefore' as well)
    localStorage.clear();
    
    // Clear all cookies
    document.cookie.split(";").forEach(cookie => {
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    });
    
    // Clear cache using Service Worker API if available
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          caches.delete(cacheName);
        });
      });
    }
    
    // Clear IndexedDB
    if (window.indexedDB) {
      window.indexedDB.databases().then(databases => {
        databases.forEach(database => {
          if (database.name) {
            indexedDB.deleteDatabase(database.name);
          }
        });
      }).catch(() => {
        // Fallback for browsers that don't support databases() method
        // Common IndexedDB database names in the app could be listed here
        const possibleDatabases = ['leads-db', 'user-data', 'app-cache'];
        possibleDatabases.forEach(dbName => {
          try {
            indexedDB.deleteDatabase(dbName);
          } catch (e) {
            console.error(`Failed to delete database: ${dbName}`);
          }
        });
      });
    }
    
    // Clear sessionStorage
    sessionStorage.clear();
  },

  // Add this new function
  getUserProfile: async (): Promise<UserProfile> => {
    const response = await api.get('/users/profile');
    return response.data.user;
  }
};

export default authService; 