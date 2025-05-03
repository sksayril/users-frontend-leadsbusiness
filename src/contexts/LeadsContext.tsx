import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import leadsService from '../services/leadsService';
import type { Category, LeadPreview, PurchasedLead } from '../services/leadsService';

interface LeadsContextType {
  categories: Category[];
  currentCategory: Category | null;
  leads: LeadPreview[];
  purchasedLeads: PurchasedLead[];
  loading: boolean;
  error: string | null;
  fetchCategories: () => Promise<void>;
  fetchLeadsByCategory: (categoryId: string) => Promise<void>;
  purchaseLead: (leadId: string) => Promise<PurchasedLead>;
  fetchPurchasedLeads: () => Promise<void>;
  searchLeads: (categoryId: string, query: string) => Promise<void>;
  setCurrentCategory: (category: Category) => void;
}

const LeadsContext = createContext<LeadsContextType>({
  categories: [],
  currentCategory: null,
  leads: [],
  purchasedLeads: [],
  loading: false,
  error: null,
  fetchCategories: async () => {},
  fetchLeadsByCategory: async () => {},
  purchaseLead: async () => ({} as PurchasedLead),
  fetchPurchasedLeads: async () => {},
  searchLeads: async () => {},
  setCurrentCategory: () => {},
});

export const LeadsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [leads, setLeads] = useState<LeadPreview[]>([]);
  const [purchasedLeads, setPurchasedLeads] = useState<PurchasedLead[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch categories when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchCategories();
    } else {
      // Reset state when logged out
      setCategories([]);
      setCurrentCategory(null);
      setLeads([]);
      setPurchasedLeads([]);
    }
  }, [isAuthenticated]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await leadsService.getCategories();
      setCategories(response.categories);
      if (response.categories.length > 0 && !currentCategory) {
        setCurrentCategory(response.categories[0]);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const fetchLeadsByCategory = async (categoryId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await leadsService.getLeadsByCategory(categoryId);
      setLeads(response.leads);
    } catch (err: any) {
      // Special handling for subscription required errors
      if (err.subscriptionRequired) {
        setError(err.message);
        setLeads([]);
      } else {
        setError(err.response?.data?.message || 'Failed to fetch leads');
      }
    } finally {
      setLoading(false);
    }
  };

  const purchaseLead = async (leadId: string): Promise<PurchasedLead> => {
    try {
      setLoading(true);
      setError(null);
      const response = await leadsService.purchaseLead(leadId);
      // Update purchased leads list
      await fetchPurchasedLeads();
      return response.lead;
    } catch (err: any) {
      // Special handling for subscription required errors
      if (err.subscriptionRequired) {
        setError(err.message);
      } 
      // Special handling for insufficient balance errors
      else if (err.insufficientBalance) {
        setError(err.message);
        throw { insufficientBalance: true, message: err.message };
      } 
      else {
        setError(err.response?.data?.message || 'Failed to purchase lead');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchasedLeads = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await leadsService.getPurchasedLeads();
      setPurchasedLeads(response.leads);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch purchased leads');
    } finally {
      setLoading(false);
    }
  };

  const searchLeads = async (categoryId: string, query: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await leadsService.searchLeads(categoryId, query);
      setLeads(response.leads);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to search leads');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LeadsContext.Provider
      value={{
        categories,
        currentCategory,
        leads,
        purchasedLeads,
        loading,
        error,
        fetchCategories,
        fetchLeadsByCategory,
        purchaseLead,
        fetchPurchasedLeads,
        searchLeads,
        setCurrentCategory,
      }}
    >
      {children}
    </LeadsContext.Provider>
  );
};

export const useLeads = () => useContext(LeadsContext); 