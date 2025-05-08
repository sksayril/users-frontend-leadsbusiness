import api from './api';

export interface Category {
  _id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
}

export interface LeadPreview {
  _id: string;
  customerName: string;
  price: number;
  category: {
    _id: string;
    name: string;
  };
}

export interface PaginationData {
  totalLeads: number;
  totalPages: number;
  currentPage: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PurchasedLead {
  id: string;
  customerName: string;
  customerAddress: string;
  customerContact: string;
  customerEmail: string;
  category: {
    _id: string;
    name: string;
  };
  purchaseDate: string;
}

const leadsService = {
  // Get All Categories
  getCategories: async (): Promise<{ categories: Category[] }> => {
    const response = await api.get('/leads/categories');
    return response.data;
  },
  
  // Get Leads Preview by Category with pagination
  getLeadsByCategory: async (categoryId: string, page: number = 1, itemsPerPage: number = 10): Promise<{ leads: LeadPreview[], pagination: PaginationData }> => {
    try {
      const response = await api.get(`/leads/preview/${categoryId}?page=${page}&itemsPerPage=${itemsPerPage}`);
      return response.data;
    } catch (error: any) {
      if (error.response && error.response.data.subscriptionRequired) {
        throw { subscriptionRequired: true, message: error.response.data.message };
      }
      throw error;
    }
  },
  
  // Purchase Lead
  purchaseLead: async (leadId: string): Promise<{ message: string, lead: PurchasedLead }> => {
    try {
      const response = await api.post(`/leads/purchase/${leadId}`);
      
      // Handle 204 No Content or 205 Reset Content responses
      if (response.status === 204 || response.status === 205) {
        console.log('Received 204/205 response for purchase lead');
        // Return a generic success response since the server didn't provide content
        return {
          message: "Lead purchased successfully",
          lead: {
            id: leadId,
            customerName: "Lead information",
            customerAddress: "Available in your purchased leads",
            customerContact: "Contact available in details",
            customerEmail: "Email available in details",
            category: {
              _id: "",
              name: "Lead"
            },
            purchaseDate: new Date().toISOString()
          }
        };
      }
      
      return response.data;
    } catch (error: any) {
      console.log('Purchase lead error:', error.response?.status, error.response?.data);
      
      // Check for 404 Not Found (lead doesn't exist)
      if (error.response && error.response.status === 404) {
        throw { 
          notFound: true, 
          message: error.response.data.message || 'Lead not found or no longer available'
        };
      }
      
      // Check for subscription required error
      if (error.response && error.response.data.subscriptionRequired) {
        throw { subscriptionRequired: true, message: error.response.data.message };
      }
      
      // Check for insufficient balance error (400 status code)
      if (error.response && error.response.status === 400) {
        // Enhanced error detection logic for insufficient balance
        const errorData = error.response.data;
        const errorMessage = errorData.message || '';
        
        // Check for various indicators of insufficient balance
        if ((errorData.insufficientCoins) || 
            (errorData.balance === "too low") ||
            (errorMessage.includes("Insufficient coins") || 
             errorMessage.includes("Failed to deduct coins"))) {
          
          console.log('Insufficient balance detected');
          throw { 
            insufficientBalance: true, 
            message: errorMessage || 'Insufficient balance to purchase this lead',
            redirectToDashboard: true,
            redirectToWallet: true // Redirect to wallet section specifically
          };
        }
        
        // Generic 400 error (not specifically about insufficient balance)
        throw { 
          insufficientBalance: true, 
          message: errorData.message || 'Insufficient balance to purchase this lead'
        };
      }
      
      // If we have the enhanced error from api.ts interceptor
      if (error.insufficientBalance) {
        console.log('Using enhanced error from interceptor');
        throw { 
          insufficientBalance: true, 
          message: error.message || 'Insufficient balance to purchase this lead',
          redirectToDashboard: error.redirectToDashboard || true,
          redirectToWallet: error.redirectToWallet || true
        };
      }
      
      // Handle any other errors
      throw error;
    }
  },
  
  // Get Purchased Leads
  getPurchasedLeads: async (): Promise<{ leads: PurchasedLead[] }> => {
    const response = await api.get('/leads/purchased');
    return response.data;
  },
  
  // Search Leads
  searchLeads: async (categoryId: string, query: string): Promise<{ leads: LeadPreview[] }> => {
    const response = await api.get(`/leads/search?category=${categoryId}&query=${query}`);
    return response.data;
  }
};

export default leadsService; 