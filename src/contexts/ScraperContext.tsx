import React, { createContext, useContext, useState } from 'react';
import { useAuth } from './AuthContext';
import scraperService from '../services/scraperService';
import type {
  ScraperUsage,
  ScraperHistory,
  ScraperResultItem,
  AllScraperResults
} from '../services/scraperService';

interface ScraperContextType {
  usage: ScraperUsage['data'] | null;
  history: ScraperHistory['history'] | null;
  currentResults: ScraperResultItem[] | null;
  allResults: AllScraperResults['results'] | null;
  loading: boolean;
  error: string | null;
  getScraperUsage: () => Promise<void>;
  getScraperHistory: () => Promise<void>;
  scrapeGoogleMaps: (keyword: string) => Promise<boolean>;
  getResultsByKeyword: (keyword: string) => Promise<void>;
  getResultsById: (id: string) => Promise<void>;
  getAllResults: () => Promise<void>;
}

const ScraperContext = createContext<ScraperContextType>({
  usage: null,
  history: null,
  currentResults: null,
  allResults: null,
  loading: false,
  error: null,
  getScraperUsage: async () => {},
  getScraperHistory: async () => {},
  scrapeGoogleMaps: async () => false,
  getResultsByKeyword: async () => {},
  getResultsById: async () => {},
  getAllResults: async () => {},
});

export const ScraperProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [usage, setUsage] = useState<ScraperUsage['data'] | null>(null);
  const [history, setHistory] = useState<ScraperHistory['history'] | null>(null);
  const [currentResults, setCurrentResults] = useState<ScraperResultItem[] | null>(null);
  const [allResults, setAllResults] = useState<AllScraperResults['results'] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getScraperUsage = async () => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await scraperService.getScraperUsage();
      if (response.success) {
        setUsage(response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch scraper usage');
    } finally {
      setLoading(false);
    }
  };

  const getScraperHistory = async () => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await scraperService.getScraperHistory();
      if (response.success) {
        setHistory(response.history);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch scraper history');
    } finally {
      setLoading(false);
    }
  };

  const scrapeGoogleMaps = async (keyword: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      const response = await scraperService.scrapeGoogleMaps(keyword);
      if (response.success) {
        // Refresh usage data after successful scrape
        await getScraperUsage();
        await getScraperHistory();
        return true;
      }
      return false;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to scrape data');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getResultsByKeyword = async (keyword: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await scraperService.getScraperResultsByKeyword(keyword);
      if (response.success) {
        setCurrentResults(response.data);
      } else {
        setCurrentResults(null);
        setError('No results found for this keyword');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch results');
      setCurrentResults(null);
    } finally {
      setLoading(false);
    }
  };

  const getResultsById = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await scraperService.getScraperResultsById(id);
      if (response.success) {
        setCurrentResults(response.data);
      } else {
        setCurrentResults(null);
        setError('No results found for this ID');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch results');
      setCurrentResults(null);
    } finally {
      setLoading(false);
    }
  };

  const getAllResults = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await scraperService.getAllScraperResults();
      if (response.success) {
        setAllResults(response.results);
      } else {
        setAllResults(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch all results');
      setAllResults(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScraperContext.Provider
      value={{
        usage,
        history,
        currentResults,
        allResults,
        loading,
        error,
        getScraperUsage,
        getScraperHistory,
        scrapeGoogleMaps,
        getResultsByKeyword,
        getResultsById,
        getAllResults,
      }}
    >
      {children}
    </ScraperContext.Provider>
  );
};

export const useScraper = () => useContext(ScraperContext); 