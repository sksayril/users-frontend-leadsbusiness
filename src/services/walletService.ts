import api from './api';

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
}

export interface WalletTransaction {
  type: 'CREDIT' | 'DEBIT';
  amount?: number;
  coins: number;
  description: string;
  date: string;
  _id: string;
}

export interface Wallet {
  balance: number;
  leadsCoins: number;
  transactions: WalletTransaction[];
}

export interface PaymentVerificationData {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  amount?: number;
  currency?: string;
}

export interface SubscriptionPlan {
  plan: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
}

export interface Subscription {
  isActive: boolean;
  startDate: string;
  endDate: string;
  plan: string;
}

const walletService = {
  // Get Wallet Transactions
  getTransactions: async (): Promise<Wallet> => {
    const response = await api.get('/users/wallet/transactions');
    return response.data;
  },
  
  // Create Recharge Order
  createRechargeOrder: async (amount: number, currency: string = 'INR'): Promise<{ order: RazorpayOrder }> => {
    const response = await api.post('/users/wallet/recharge/order', { amount, currency });
    return response.data;
  },
  
  // Verify Recharge Payment
  verifyRechargePayment: async (data: PaymentVerificationData): Promise<{ message: string, wallet: Wallet }> => {
    const response = await api.post('/users/wallet/recharge/verify', data);
    return response.data;
  },
  
  // Create Subscription Order
  createSubscriptionOrder: async (plan: SubscriptionPlan['plan'], currency: string = 'INR'): Promise<{ order: RazorpayOrder }> => {
    const response = await api.post('/users/subscription/order', { plan, currency });
    return response.data;
  },
  
  // Verify Subscription Payment
  verifySubscriptionPayment: async (data: PaymentVerificationData): Promise<{ message: string, subscription: Subscription }> => {
    const response = await api.post('/users/subscription/verify', data);
    return response.data;
  }
};

export default walletService; 