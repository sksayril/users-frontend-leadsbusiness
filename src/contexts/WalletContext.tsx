import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import walletService from '../services/walletService';
import type { Wallet, Subscription } from '../services/walletService';

interface WalletContextType {
  wallet: Wallet | null;
  subscription: Subscription | null;
  loading: boolean;
  error: string | null;
  rechargeWallet: (amount: number, currency?: string) => Promise<{ orderId: string; amount: number; currency: string }>;
  verifyRechargePayment: (data: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    amount: number;
    currency?: string;
  }) => Promise<void>;
  createSubscription: (plan: 'MONTHLY' | 'QUARTERLY' | 'YEARLY', currency?: string) => Promise<{ orderId: string; currency: string }>;
  verifySubscriptionPayment: (data: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    currency?: string;
  }) => Promise<void>;
  refreshWallet: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType>({
  wallet: null,
  subscription: null,
  loading: false,
  error: null,
  rechargeWallet: async () => ({ orderId: '', amount: 0, currency: 'INR' }),
  verifyRechargePayment: async () => {},
  createSubscription: async () => ({ orderId: '', currency: 'INR' }),
  verifySubscriptionPayment: async () => {},
  refreshWallet: async () => {},
});

// Minimum time (in ms) between wallet refreshes to prevent API spam
const MIN_REFRESH_INTERVAL = 5000; // 5 seconds

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Use refs to track the last fetch time and prevent infinite loops
  const lastFetchTimeRef = useRef<number>(0);
  const isMountedRef = useRef<boolean>(false);

  useEffect(() => {
    isMountedRef.current = true;
    
    // Only fetch on initial mount if authenticated
    if (isAuthenticated && !wallet) {
      refreshWallet();
    }
    
    return () => {
      isMountedRef.current = false;
    };
  }, [isAuthenticated]); // Only depend on authentication status

  // Initialize wallet from user data (if available)
  useEffect(() => {
    if (user?.wallet) {
      setWallet(user.wallet);
    }
    if (user?.subscription && user.subscription.isActive && 
        user.subscription.startDate && user.subscription.endDate && user.subscription.plan) {
      setSubscription(user.subscription as Subscription);
    }
  }, [user]);

  const refreshWallet = async () => {
    if (!isAuthenticated) return;
    
    // Prevent rapid successive calls
    const now = Date.now();
    if (now - lastFetchTimeRef.current < MIN_REFRESH_INTERVAL) {
      console.log('Skipping wallet refresh - too soon since last refresh');
      return;
    }
    
    // Update last fetch time
    lastFetchTimeRef.current = now;
    
    try {
      setLoading(true);
      const walletData = await walletService.getTransactions();
      
      // Check if component is still mounted before updating state
      if (isMountedRef.current) {
        setWallet(walletData);
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        setError(err.response?.data?.message || 'Failed to fetch wallet data');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const rechargeWallet = async (amount: number, currency: string = 'INR') => {
    try {
      setLoading(true);
      setError(null);
      const response = await walletService.createRechargeOrder(amount, currency);
      return { 
        orderId: response.order.id,
        amount: response.order.amount,
        currency: response.order.currency
      };
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create recharge order');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const verifyRechargePayment = async (data: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    amount: number;
    currency?: string;
  }) => {
    try {
      setLoading(true);
      setError(null);
      const response = await walletService.verifyRechargePayment(data);
      setWallet(response.wallet);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to verify payment');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createSubscription = async (plan: 'MONTHLY' | 'QUARTERLY' | 'YEARLY', currency: string = 'INR') => {
    try {
      setLoading(true);
      setError(null);
      const response = await walletService.createSubscriptionOrder(plan, currency);
      return { 
        orderId: response.order.id,
        currency: response.order.currency || currency
      };
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create subscription order');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const verifySubscriptionPayment = async (data: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    currency?: string;
  }) => {
    try {
      setLoading(true);
      setError(null);
      const response = await walletService.verifySubscriptionPayment(data);
      setSubscription(response.subscription);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to verify subscription payment');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <WalletContext.Provider
      value={{
        wallet,
        subscription,
        loading,
        error,
        rechargeWallet,
        verifyRechargePayment,
        createSubscription,
        verifySubscriptionPayment,
        refreshWallet,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext); 