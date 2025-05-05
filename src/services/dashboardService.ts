import api from './api';

export interface DashboardData {
  user: {
    name: string;
    email: string;
    joinedDate: string;
  };
  wallet: {
    balance: number;
    leadsCoins: number;
    totalSpentCoins: number;
  };
  leads: {
    totalPurchased: number;
    dailyStats: Array<{
      date: string;
      count: number;
      coinsSpent: number;
      categories: Array<{
        id: string;
        name: string;
        count: number;
      }>;
    }>;
    monthlyStats: Array<{
      monthYear: string;
      monthLabel: string;
      count: number;
      coinsSpent: number;
      categories: Array<{
        id: string;
        name: string;
        count: number;
      }>;
    }>;
  };
  subscription: {
    isActive: boolean;
    daysRemaining: number;
    expiryDate: string;
    startDate: string;
    plan: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  };
  recentTransactions: Array<{
    type: 'CREDIT' | 'DEBIT';
    amount?: number;
    coins: number;
    description: string;
    _id: string;
    date: string;
    currency?: string;
    inrEquivalent?: number;
  }>;
}

const dashboardService = {
  /**
   * Fetch dashboard data including user info, wallet, leads stats, and subscription
   */
  getDashboardData: async (): Promise<DashboardData> => {
    try {
      const { data } = await api.get('/users/dashboard');
      return data.dashboard;
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  }
};

export default dashboardService; 